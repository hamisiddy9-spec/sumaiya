// Snap-to-Apply (E1) — pure pipeline helpers for the paste-text slice.
//
// One clean end-to-end path: user pastes a job description → (1) ATS match
// score against their real CV, (2) a tailored CV (AI reword, truth-gated),
// (3) a matching cover letter. Everything here is pure and deterministic
// except the two prompt builders (which are pure string builders — the AI
// call itself lives in the route). No DB, no React, no fetch.
//
// Anti-fabrication is the moat: every AI prompt embeds TRUTH_CONSTRAINT, the
// tailored-CV output is re-checked against the user's real CV by the evidence
// engine in the route, and the JD guard (looksLikeJobDescription) refuses to
// treat non-job text as a job — we never fabricate a job or a profile.

import type { CVData } from "@/types";
import { matchCvToJd } from "@/lib/job-match";
import { analyzeJob, rankSkillsForJob, rankExperienceForJob } from "@/lib/job-analysis";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";
import type { EvidenceReport } from "@/lib/career-profile/evidence";

export type SnapLang = "en" | "sw";

// ─── ATS match (deterministic — no AI, always available) ─────────────────────
// Reuses the real engine (matchCvToJd) and the deterministic reorder
// (rankSkillsForJob / rankExperienceForJob) so the score shown is the actual
// keyword coverage — before vs after — never a fabricated number.

export interface SnapMatch {
  before: { score: number; matched: string[]; missing: string[] };
  after: { score: number; matched: string[]; missing: string[] };
  /** Why the score moved — concrete keyword-coverage facts. */
  explanation: string[];
  /** Title detected from the JD (may be ""). */
  jobTitle: string;
  /** Requirement phrasings worth confirming with the user (never auto-added). */
  requirements: string[];
  /**
   * Whether `after` reflects the AI-tailored CV (true) or only the
   * deterministic reorder (false). The reorder alone never changes the
   * keyword term-set, so before === after unless the tailored rewrite is
   * applied — the route recomputes `after` from the merged tailored CV.
   */
  tailored: boolean;
}

export function snapMatch(cvData: CVData, jd: string): SnapMatch {
  const analysis = analyzeJob(jd, cvData.personal.jobTitle);

  const reordered: CVData = {
    ...cvData,
    skills: rankSkillsForJob(cvData.skills, analysis),
    experience: rankExperienceForJob(cvData.experience, analysis),
  };

  const before = matchCvToJd(cvData, jd);
  const after = matchCvToJd(reordered, jd);

  const explanation: string[] = [];
  const newlyMatched = after.matched.filter((t) => !before.matched.includes(t));
  if (newlyMatched.length) {
    explanation.push(
      `Reordering surfaced ${newlyMatched.length} keyword${newlyMatched.length === 1 ? "" : "s"} already in your profile: ${newlyMatched.slice(0, 6).join(", ")}${newlyMatched.length > 6 ? "…" : ""}.`,
    );
  }
  const stillMissing = after.missing.slice(0, 6);
  if (stillMissing.length) {
    explanation.push(`Still missing from your profile: ${stillMissing.join(", ")}.`);
  }
  if (after.score > before.score) {
    explanation.push("Your best skills and experience for this role moved to the top, so ATS keyword scanning sees them first.");
  } else if (after.score === before.score) {
    explanation.push("Your profile already covers this job well — the reorder keeps the same match while putting the most relevant content first for a human recruiter.");
  } else {
    explanation.push("This job asks for skills outside your profile — the score reflects the real gap.");
  }

  return {
    before: { score: before.score, matched: before.matched, missing: before.missing },
    after: { score: after.score, matched: after.matched, missing: after.missing },
    explanation,
    jobTitle: analysis.title,
    requirements: analysis.requirements,
    tailored: false,
  };
}

// ─── Profile usability ───────────────────────────────────────────────────────
// A "profile" with zero real facts must not be tailored against — that would
// produce a hallucinated CV. The route returns a warm next step instead.

export function isUsableProfile(cvData: CVData): boolean {
  return Boolean(
    cvData.summary?.trim() ||
      cvData.skills.length > 0 ||
      cvData.experience.length > 0 ||
      cvData.education.length > 0 ||
      (cvData.projects ?? []).length > 0 ||
      cvData.certifications.length > 0,
  );
}

// ─── Prompt builders (both embed TRUTH_CONSTRAINT — asserted by the evals) ───

/** The candidate's real facts, formatted for the model — never invented. */
export function cvFactBlock(cvData: CVData): string {
  const lines: string[] = [];
  const p = cvData.personal;
  if (p.fullName) lines.push(`Name: ${p.fullName}`);
  if (p.jobTitle) lines.push(`Job title: ${p.jobTitle}`);
  if (cvData.summary) lines.push(`Summary: ${cvData.summary}`);
  if (cvData.skills.length) lines.push(`Skills: ${cvData.skills.map((s) => s.name).join(", ")}`);
  for (const e of cvData.experience) {
    lines.push(`Experience: ${e.position || "(role)"}${e.company ? " @ " + e.company : ""} — ${e.description || "(no description)"}`);
  }
  if (cvData.education.length) {
    lines.push(`Education: ${cvData.education.map((e) => [e.degree, e.field, e.institution].filter(Boolean).join(", ")).join(" | ")}`);
  }
  if ((cvData.projects ?? []).length) {
    lines.push(`Projects: ${cvData.projects!.map((pr) => `${pr.name}${pr.role ? ` (${pr.role})` : ""} — ${pr.description || ""}`).join(" | ")}`);
  }
  if (cvData.certifications.length) {
    lines.push(`Certifications: ${cvData.certifications.map((c) => c.name).join(", ")}`);
  }
  return lines.length ? lines.join("\n") : "(no facts yet)";
}

/** Tailor prompt — mirrors /api/ai/tailor-cv, returns STRICT JSON. */
export function snapTailorPrompt(jd: string, jobTitle: string, cvData: CVData, lang: SnapLang = "en"): string {
  const L = lang === "en" ? "English" : lang === "sw" ? "Swahili" : "the SAME language as the CV content";
  return `You are an expert CV writer tailoring a candidate's CV to a SPECIFIC job. Rewrite their professional summary AND each work-experience entry's bullet points to (1) emphasise the experience most relevant to THIS job and (2) naturally weave in the job's real keywords and requirements — but ONLY where it is truthful to what the candidate actually did. Don't drop important real content. Keep each experience's bullets concise, each starting with "- ". Write in ${L}. ${TRUTH_CONSTRAINT}

Return STRICT JSON (no extra keys, no commentary, no markdown), matching exactly:
{"summary":"","experience":[{"id":"","description":""}]}
Return the SAME experience ids listed below, each with its rewritten description — do not add, drop, reorder or renumber entries.

TARGET ROLE: ${jobTitle || "(infer from the job description)"}

JOB DESCRIPTION:
"""
${jd}
"""

CANDIDATE'S REAL CV (every fact below is true — never add anything that is not here):
"""
${cvFactBlock(cvData)}
"""`;
}

/** Cover-letter prompt — mirrors /api/ai/cover-letter, body only. */
export function snapCoverLetterPrompt(jd: string, cvData: CVData, lang: SnapLang = "en"): string {
  const langName = lang === "en" ? "English" : "Swahili";
  return `Write a compelling, professional cover letter body for the job below, in ${langName}. Use a confident but warm tone, 3–4 short paragraphs. Do NOT include the address block, date, "Dear..." greeting, or sign-off — return ONLY the body paragraphs. Ground every claim in the candidate's real facts below. If the candidate is a student or recent graduate with little work history, write a confident entry-level letter that leads with motivation, education and relevant skills (academic projects, an attachment/internship or volunteering) and eagerness to contribute — without apologising for inexperience. ${TRUTH_CONSTRAINT}

CANDIDATE (real facts only — never invent experience, skills, employers or dates):
"""
${cvFactBlock(cvData)}
"""

JOB DESCRIPTION:
"""
${jd}
"""`;
}

// ─── Tailored-CV parse + merge ───────────────────────────────────────────────

export interface TailoredCv {
  summary: string;
  experience: Array<{ id: string; description: string }>;
}

/** Tolerant JSON parse (same philosophy as the /api/ai routes). */
export function safeParseJson(raw: string): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Some providers wrap JSON in markdown fences — strip them and retry.
    const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

/**
 * Parse the AI's tailored-CV JSON. Only experience whose id matches a REAL
 * input id is accepted — a hallucinated/renumbered id can never write to the
 * wrong entry (same guard as /api/ai/tailor-cv).
 */
export function parseTailoredCv(raw: string, validIds: Set<string>): TailoredCv | null {
  const parsed = safeParseJson(raw) as { summary?: unknown; experience?: unknown } | null;
  if (!parsed || typeof parsed !== "object") return null;
  const summary = typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : "";
  const exp = Array.isArray(parsed.experience)
    ? (parsed.experience as Array<{ id?: unknown; description?: unknown }>)
        .filter(
          (e) =>
            e &&
            typeof e.id === "string" &&
            validIds.has(e.id) &&
            typeof e.description === "string" &&
            e.description.trim().length > 0,
        )
        .map((e) => ({ id: e.id as string, description: (e.description as string).trim() }))
    : [];
  if (!summary && exp.length === 0) return null;
  return { summary, experience: exp };
}

/** Apply the tailored summary/experience onto a copy of the user's CV. */
export function mergeTailoredCv(cvData: CVData, tailored: TailoredCv): CVData {
  return {
    ...cvData,
    summary: tailored.summary || cvData.summary,
    experience: cvData.experience.map((e) => {
      const hit = tailored.experience.find((x) => x.id === e.id);
      return hit ? { ...e, description: hit.description } : e;
    }),
  };
}

// ─── Warm copy (graceful failure — never a dead end) ─────────────────────────

export function snapNotAJobMessage(sw: boolean): string {
  return sw
    ? "Hii haionekani kama maelezo ya kazi (job description). Bandika tangazo kamili la nafasi ya kazi — pamoja na mahitaji na majukumu — kisha jaribu tena."
    : "This doesn't look like a job description. Paste the full job posting — including the requirements and responsibilities — then try again.";
}

export function snapNoProfileMessage(sw: boolean): string {
  return sw
    ? "Hatujapata CV au wasifu wako bado — na hatutabuni matokeo. Jenga CV yako nami (dakika ~2), kisha urudie hapa kwa alama ya CV yako + CV lengwa + barua ya maombi."
    : "We couldn't find your CV or career profile yet — and we never invent results. Build your CV with Sumaiya (takes ~2 minutes), then come back for your ATS score + tailored CV + cover letter.";
}

export function snapAiUnavailableMessage(sw: boolean): string {
  return sw
    ? "Huduma ya AI haipatikani kwa sasa — alama ya CV yako na mpangilio wa CV lengwa ziko hapa, lakini uandishi wa AI umekosekana. Jaribu tena baada ya dakika chache."
    : "AI writing is temporarily unavailable — your ATS score and reordered CV are here, but the AI-drafted parts couldn't be generated. Please try again in a few minutes.";
}

export function snapAiPartialMessage(sw: boolean): string {
  return sw
    ? "Sehemu moja ya AI haikufanikiwa — angalia matokeo yaliyopo na jaribu tena kama kuna kitu kinakosekana."
    : "One part of the AI output didn't come through — check what's here and retry if something is missing.";
}

/** Evidence labels surfaced in the UI (from the shared engine vocabulary). */
export interface SnapEvidenceView {
  count: number;
  allSupported: boolean;
  unconfirmed: Array<{ claim: string; kind: string; location: string }>;
}

export function toEvidenceView(evidence: EvidenceReport | null): SnapEvidenceView {
  if (!evidence) return { count: 0, allSupported: true, unconfirmed: [] };
  return {
    count: evidence.unconfirmed.length,
    allSupported: evidence.allSupported,
    unconfirmed: evidence.unconfirmed.map((c) => ({ claim: c.claim, kind: c.kind, location: c.location })),
  };
}
