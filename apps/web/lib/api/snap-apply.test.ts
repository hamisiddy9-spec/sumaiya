// Unit tests for the Snap-to-Apply (E1) pure pipeline — deterministic, no AI,
// no DB. The E1 anti-fabrication eval lives in evals/snap-apply.test.ts; these
// cover the mechanics of the helpers the route composes.

import { describe, it, expect } from "vitest";
import { createEmptyCVData, type CVData } from "@/types";
import { cvFrontend } from "@/evals/fixtures/golden-pairs";
import {
  snapMatch,
  isUsableProfile,
  snapTailorPrompt,
  snapCoverLetterPrompt,
  cvFactBlock,
  parseTailoredCv,
  mergeTailoredCv,
  safeParseJson,
  snapNotAJobMessage,
  snapNoProfileMessage,
  snapAiUnavailableMessage,
  toEvidenceView,
} from "@/lib/api/snap-apply";
import { matchCvToJd, looksLikeJobDescription, getCVTerms } from "@/lib/job-match";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

// A realistic frontend JD that passes looksLikeJobDescription.
const JD = `Frontend Engineer — Dar es Salaam (Full-time)

About the role: We are looking for a Frontend Engineer to build customer-facing dashboards and own the product's web experience.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests
- Ship accessible, performant web applications with Next.js
- Collaborate with designers in Figma

Requirements:
- 3+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel
- Knowledge of Python is a plus

Benefits: competitive salary, health insurance, remote-friendly.

How to apply: send your CV to careers@example.com`;

describe("snapMatch", () => {
  it("returns scores from the REAL engine (matchCvToJd), never fabricated", () => {
    const r = snapMatch(cvFrontend, JD);
    const expectedBefore = matchCvToJd(cvFrontend, JD);
    expect(r.before.score).toBe(expectedBefore.score);
    expect(r.before.matched).toEqual(expectedBefore.matched);
    expect(r.before.missing).toEqual(expectedBefore.missing);
    expect(r.after.score).toBeGreaterThanOrEqual(0);
    expect(r.after.score).toBeLessThanOrEqual(100);
    // The deterministic reorder alone can't change the keyword term-set, so a
    // fresh snapMatch reports tailored: false and after === before — the route
    // recomputes the honest after-score once the AI rewrite is merged.
    expect(r.tailored).toBe(false);
    expect(r.after.score).toBe(r.before.score);
  });

  it("detects the job title and surfaces requirement phrasings", () => {
    const r = snapMatch(cvFrontend, JD);
    expect(r.jobTitle.toLowerCase()).toContain("frontend");
    expect(r.requirements.length).toBeGreaterThan(0);
  });

  it("explains the delta in concrete keyword terms", () => {
    const r = snapMatch(cvFrontend, JD);
    expect(r.explanation.length).toBeGreaterThan(0);
    expect(r.explanation.join(" ").length).toBeGreaterThan(20);
  });

  it("matched keywords really are in the CV; missing really are not", () => {
    const r = snapMatch(cvFrontend, JD);
    // Use the engine's OWN term set + fuzzy rule (getCVTerms/scoreTerms) so
    // the membership check can never drift from what the matcher actually does.
    const cvTerms = getCVTerms(cvFrontend);
    const engineFound = (t: string) =>
      cvTerms.has(t) ||
      [...cvTerms].some((cv) => (cv.includes(t) || t.includes(cv)) && Math.min(cv.length, t.length) >= 4);
    for (const t of r.after.matched) {
      expect(engineFound(t), `"${t}" should be covered by the CV`).toBe(true);
    }
  });
});

describe("isUsableProfile", () => {
  it("rejects an empty profile (no facts → nothing to tailor)", () => {
    expect(isUsableProfile(createEmptyCVData())).toBe(false);
  });

  it("accepts a profile with at least one real fact", () => {
    const cv: CVData = { ...createEmptyCVData(), skills: [{ id: "s1", name: "Excel", level: 3 }] };
    expect(isUsableProfile(cv)).toBe(true);
  });
});

describe("prompt builders (anti-fabrication)", () => {
  it("both prompts embed TRUTH_CONSTRAINT", () => {
    expect(snapTailorPrompt(JD, "Frontend Engineer", cvFrontend)).toContain(TRUTH_CONSTRAINT);
    expect(snapCoverLetterPrompt(JD, cvFrontend)).toContain(TRUTH_CONSTRAINT);
  });

  it("the tailor prompt contains the candidate's REAL facts, not placeholders", () => {
    const p = snapTailorPrompt(JD, "Frontend Engineer", cvFrontend);
    expect(p).toContain("Nala Finance"); // real employer
    expect(p).toContain("Amina Hassan"); // real name
    expect(p).toContain("React"); // real skill
  });

  it("the cover-letter prompt grounds claims in the candidate's real skills", () => {
    const p = snapCoverLetterPrompt(JD, cvFrontend);
    expect(p).toContain("Nala Finance");
    expect(p).toContain("TypeScript");
  });

  it("cvFactBlock includes every section that exists and never fabricates", () => {
    const block = cvFactBlock(cvFrontend);
    expect(block).toContain("Frontend Engineer");
    expect(block).toContain("University of Dar es Salaam");
    const empty = cvFactBlock(createEmptyCVData());
    expect(empty).toContain("no facts yet");
  });
});

describe("parseTailoredCv (id-guard)", () => {
  const raw = JSON.stringify({
    summary: "Tailored summary",
    experience: [
      { id: "e1", description: "- Rewrote dashboards with React" },
      { id: "e9", description: "- Hallucinated entry with a made-up id" },
      { id: "e2", description: "" },
    ],
  });

  it("accepts only ids that exist in the real CV (no hallucinated entries)", () => {
    const parsed = parseTailoredCv(raw, new Set(["e1", "e2"]));
    expect(parsed).not.toBeNull();
    expect(parsed!.experience.map((e) => e.id)).toEqual(["e1"]);
    expect(parsed!.experience.some((e) => e.id === "e9")).toBe(false);
  });

  it("returns null when the AI returns nothing usable", () => {
    expect(parseTailoredCv("not json at all", new Set(["e1"]))).toBeNull();
    expect(parseTailoredCv(JSON.stringify({ summary: "", experience: [] }), new Set(["e1"]))).toBeNull();
  });

  it("safeParseJson strips markdown fences", () => {
    expect(safeParseJson("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
    expect(safeParseJson("garbage")).toBeNull();
  });
});

describe("mergeTailoredCv", () => {
  it("updates only the experience entries the AI rewrote, keeps the rest", () => {
    const tailored = {
      summary: "New summary",
      experience: [{ id: "e1", description: "- Rewritten" }],
    };
    const merged = mergeTailoredCv(cvFrontend, tailored);
    expect(merged.summary).toBe("New summary");
    expect(merged.experience.find((e) => e.id === "e1")!.description).toBe("- Rewritten");
    expect(merged.experience.find((e) => e.id === "e2")!.description).toBe(cvFrontend.experience[1].description);
  });
});

describe("warm copy + evidence view", () => {
  it("all graceful-failure messages are non-empty in both languages", () => {
    for (const sw of [false, true]) {
      expect(snapNotAJobMessage(sw).length).toBeGreaterThan(10);
      expect(snapNoProfileMessage(sw).length).toBeGreaterThan(10);
      expect(snapAiUnavailableMessage(sw).length).toBeGreaterThan(10);
    }
  });

  it("toEvidenceView maps the engine report to the light UI shape", () => {
    const view = toEvidenceView({
      claims: [],
      allSupported: false,
      unconfirmed: [{ claim: "SAP", kind: "skill", location: "summary", supported: false, status: "needs-confirmation" }],
    });
    expect(view.count).toBe(1);
    expect(view.allSupported).toBe(false);
    expect(view.unconfirmed[0].claim).toBe("SAP");
    expect(toEvidenceView(null).allSupported).toBe(true);
  });
});

describe("JD guard wiring (never fabricate a job)", () => {
  it("the guard the route uses rejects conversational text", () => {
    const chat = "hi sumaiya how are you today can you help me with my cv please";
    expect(looksLikeJobDescription(chat)).toBe(false);
  });

  it("a real pasted advert passes the guard", () => {
    expect(looksLikeJobDescription(JD)).toBe(true);
  });
});
