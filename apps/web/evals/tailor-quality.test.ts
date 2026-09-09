// EVAL: Tailor quality + truth.
//
// Deterministic layer (always runs in CI):
//   - buildTargetedCv must never LOWER the real match score (a regression that
//     drops content fails) and must surface gaps as toConfirm — never auto-add
//     missing requirements (anti-fabrication at the builder level).
//   - The reordered CV must carry ZERO fabricated claims through the evidence
//     engine (it only reorders verified profile facts).
//
// AI layer (skipped in CI — runs where an AI provider is configured):
//   - A truthful tailor must lift the REAL ATS score (short summary → strong
//     summary, passive bullets → action verbs) without fabricating anything.
//   - The rewritten CV must never lose keyword coverage (match >= original).

import { describe, it, expect } from "vitest";
import { buildTargetedCv } from "@/lib/targeted-cv";
import { profileToCvData } from "@/lib/career-profile/mapper";
import { verifyAiContent } from "@/lib/career-profile/evidence";
import { analyzeCv, atsScore } from "@/lib/ats-score";
import { matchCvToJd } from "@/lib/job-match";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";
import {
  profileFrontend,
  profileSales,
  profileGap,
  cvWeak,
  jdFrontend,
  jdSales,
  jdDataAnalyst,
} from "./fixtures/golden-pairs";
import {
  scoreTruthfulness,
  scoreQualityLift,
  scoreStructure,
  TRUTH_PASS_THRESHOLD,
  STRUCTURE_PASS_THRESHOLD,
  evalPasses,
} from "./lib/rubric";
import { aiReady, evalCallAi } from "./lib/ai";

const ready = await aiReady();

// ─── Deterministic layer: buildTargetedCv ────────────────────────────────────

describe("eval: tailor quality (deterministic builder)", () => {
  const cases = [
    { name: "frontend", profile: profileFrontend, jd: jdFrontend },
    { name: "sales", profile: profileSales, jd: jdSales },
    { name: "gap", profile: profileGap, jd: jdDataAnalyst },
  ];

  for (const { name, profile, jd } of cases) {
    describe(name, () => {
      const result = buildTargetedCv(profile, jd);

      it("never lowers the real match score", () => {
        expect(result.after.score).toBeGreaterThanOrEqual(result.before.score);
      });

      it("before/after scores are the real engine's, not fabricated", () => {
        expect(result.before.score).toBe(matchCvToJd(profileToCvData(profile), jd).score);
        expect(result.after.score).toBe(matchCvToJd(result.cv, jd).score);
      });

      it("reorders only verified profile facts — zero fabricated claims", () => {
        const report = verifyAiContent(result.cv.summary, result.cv.experience, profileToCvData(profile));
        expect(report.unconfirmed, JSON.stringify(report.unconfirmed.slice(0, 5))).toEqual([]);
        expect(scoreTruthfulness(report)).toBeGreaterThanOrEqual(TRUTH_PASS_THRESHOLD);
      });

      it("keeps every skill and role from the profile (nothing dropped)", () => {
        const base = profileToCvData(profile);
        for (const s of base.skills) {
          expect(result.cv.skills.map((x) => x.name.toLowerCase())).toContain(s.name.toLowerCase());
        }
        for (const e of base.experience) {
          expect(result.cv.experience.map((x) => x.company.toLowerCase())).toContain(e.company.toLowerCase());
        }
      });
    });
  }

  it("missing requirements are surfaced as toConfirm, never auto-added", () => {
    const result = buildTargetedCv(profileGap, jdDataAnalyst);
    // toConfirm carries the JD's stated Requirements-section items…
    expect(result.toConfirm.length).toBeGreaterThan(0);
    expect(result.toConfirm.some((t) => t.toLowerCase().includes("degree in statistics"))).toBe(true);
    // …and the reordered CV is unchanged from the profile's facts (nothing
    // invented, nothing auto-added): skills are exactly the profile's.
    const baseSkills = profileToCvData(profileGap).skills.map((s) => s.name.toLowerCase());
    const cvSkills = result.cv.skills.map((s) => s.name.toLowerCase());
    expect(cvSkills.length).toBe(baseSkills.length);
    for (const s of baseSkills) expect(cvSkills).toContain(s);
  });

  it("a strong pair keeps its real score (no vacuous-lift regression)", () => {
    // Measured 20 on master (evals/probe-pins.ts). A regression that collapses
    // the engine (e.g. everything scores 0 or 100) fails here.
    const result = buildTargetedCv(profileFrontend, jdFrontend);
    expect(result.after.score).toBeGreaterThanOrEqual(15);
  });
});

// ─── AI layer: truthful tailoring lifts the real ATS score ───────────────────

describe.skipIf(!ready)("eval: tailor quality (AI rewrite)", () => {
  const jd = `Frontend Developer — Full-time
We are looking for a Frontend Developer with experience in React, JavaScript and modern CSS.
Responsibilities: build web applications with React, write clean JavaScript, integrate REST APIs and deploy with Git.
Requirements: familiarity with HTML, CSS and Git workflows. Apply now.`;

  it(
    "tailored CV: structure valid + zero fabricated claims + ATS lift + no coverage loss",
    { timeout: 120_000 },
    async () => {
      // Same prompt contract as POST /api/ai/tailor-cv (TRUTH_CONSTRAINT +
      // weave job keywords only where truthful). The eval pins the CONTRACT:
      // if a future prompt change drops TRUTH_CONSTRAINT, this fails.
      const expBlock = cvWeak.experience
        .map((e) => `[${e.id}] ${e.position} @ ${e.company}\n${e.description}`)
        .join("\n\n");
      const prompt = `You are an expert CV writer tailoring a candidate's CV to a SPECIFIC job. Rewrite their professional summary AND each work-experience entry's bullet points to (1) emphasise the experience most relevant to THIS job and (2) naturally weave in the job's real keywords and requirements — but ONLY where it is truthful to what the candidate actually did. Keep each experience's bullets concise, each starting with "- ". Write in English. ${TRUTH_CONSTRAINT}
Return STRICT JSON (no extra keys, no commentary, no markdown), matching exactly:
{"summary":"","experience":[{"id":"","description":""}]}
Return the SAME experience ids listed below.

TARGET ROLE: Frontend Developer

JOB DESCRIPTION:
"""
${jd}
"""

CURRENT SUMMARY:
"""
${cvWeak.summary}
"""

CURRENT EXPERIENCE (id in [brackets]):
"""
${expBlock}
"""`;

      const raw = await evalCallAi(prompt, { temperature: 0.3, maxTokens: 1600, jsonMode: true, timeoutMs: 60_000 });
      expect(raw, "AI provider returned nothing").toBeTruthy();

      const parsed = safeParse(raw!) as { summary?: string; experience?: Array<{ id?: string; description?: string }> } | null;
      expect(parsed, "output must be strict JSON").not.toBeNull();

      // 1. Structure property.
      const structure = scoreStructure(parsed, ["summary"]);
      expect(structure).toBeGreaterThanOrEqual(STRUCTURE_PASS_THRESHOLD);

      // 2. Truthfulness — the moat. Zero fabricated claims.
      const aiExperience = (parsed!.experience ?? [])
        .filter((e) => e.id && e.description)
        .map((e) => ({ id: e.id!, description: e.description! }));
      const report = verifyAiContent(parsed!.summary ?? "", aiExperience, cvWeak);
      const truth = scoreTruthfulness(report);
      expect(report.unconfirmed, JSON.stringify(report.unconfirmed.slice(0, 5))).toEqual([]);
      expect(truth).toBeGreaterThanOrEqual(TRUTH_PASS_THRESHOLD);

      // 3. Quality lift on the REAL ATS engine.
      const tailored: typeof cvWeak = {
        ...cvWeak,
        summary: parsed!.summary ?? cvWeak.summary,
        experience: cvWeak.experience.map((e) => {
          const hit = (parsed!.experience ?? []).find((x) => x.id === e.id);
          return hit ? { ...e, description: hit.description ?? e.description } : e;
        }),
      };
      const beforeAts = atsScore(analyzeCv(cvWeak, false));
      const afterAts = atsScore(analyzeCv(tailored, false));
      const lift = scoreQualityLift(beforeAts, afterAts);
      expect(afterAts, `ATS must not drop (before=${beforeAts}, after=${afterAts})`).toBeGreaterThanOrEqual(beforeAts);

      // 4. Never lose keyword coverage.
      const beforeMatch = matchCvToJd(cvWeak, jd).score;
      const afterMatch = matchCvToJd(tailored, jd).score;
      expect(afterMatch).toBeGreaterThanOrEqual(beforeMatch);

      // Scored rubric report (informational — the hard gates above decide).
      const scores = {
        truthfulness: { value: truth, threshold: TRUTH_PASS_THRESHOLD },
        structure: { value: structure, threshold: STRUCTURE_PASS_THRESHOLD },
        qualityLift: { value: lift, threshold: 0.5 },
      };
      const failed = evalPasses(scores);
      expect(failed, `rubric dimensions below threshold: ${failed.join(", ")}`).toEqual([]);
      // eslint-disable-next-line no-console
      console.log(`[eval] AI tailor: ATS ${beforeAts} → ${afterAts}, match ${beforeMatch} → ${afterMatch}, unconfirmed=${report.unconfirmed.length}`);
    },
  );
});

/** Best-effort JSON extraction (mirrors the route's safeParseJson). */
function safeParse(raw: string): unknown | null {
  try {
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}
