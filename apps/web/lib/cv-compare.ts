// CV comparison — deterministic facts first, AI verdict second.
//
// "Which of these two CVs is better for THIS job?" is answered with FACTS
// (both CVs scored against the same job description by the real match engine,
// matchCvToJd — the same numbers the match card shows). The AI then writes a
// short comparison summary from those facts; it never manufactures scores or
// claims. Without a job description we compare structure/skills/experience
// directly (what changed / how they differ) — still fact-grounded.

import type { CVData } from "@/types";
import { matchCvToJd, type MatchResult } from "@/lib/job-match";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

export interface CvCompareFacts {
  /** True when the user gave a job description → score-based verdict mode. */
  scored: boolean;
  /** Per-CV match result against the job (only when scored). */
  a?: MatchResult;
  b?: MatchResult;
  /** Deterministic winner: "a" | "b" | "tie" (only when scored). */
  winner?: "a" | "b" | "tie";
  /** Skills only A has (from its skills list). */
  onlyA: string[];
  /** Skills only B has (from its skills list). */
  onlyB: string[];
  /** Skills both list. */
  shared: string[];
}

function skillNames(data: CVData): string[] {
  return (data.skills ?? []).map((s) => s.name.toLowerCase().trim()).filter(Boolean);
}

/** Deterministic fact layer — no AI involved. */
export function compareCvs(a: CVData, b: CVData, jobDescription?: string): CvCompareFacts {
  const sa = new Set(skillNames(a));
  const sb = new Set(skillNames(b));
  const onlyA = [...sa].filter((s) => !sb.has(s));
  const onlyB = [...sb].filter((s) => !sa.has(s));
  const shared = [...sa].filter((s) => sb.has(s));

  if (jobDescription && jobDescription.trim().length >= 10) {
    const ma = matchCvToJd(a, jobDescription);
    const mb = matchCvToJd(b, jobDescription);
    const winner = ma.score > mb.score ? "a" : mb.score > ma.score ? "b" : "tie";
    return { scored: true, a: ma, b: mb, winner, onlyA, onlyB, shared };
  }
  return { scored: false, onlyA, onlyB, shared };
}

/** Prompt for the AI comparison — grounded in the fact layer + the real CVs.
 *  Embeds TRUTH_CONSTRAINT: the model may interpret facts, never invent them. */
export function buildCvComparePrompt(
  a: CVData,
  b: CVData,
  facts: CvCompareFacts,
  lang: "en" | "sw",
): string {
  const L = lang === "sw" ? "Swahili" : "English";
  const name = (d: CVData) => d.personal.fullName?.trim() || (lang === "sw" ? "CV ya kwanza" : "CV A");
  const nameB = (d: CVData) => d.personal.fullName?.trim() || (lang === "sw" ? "CV ya pili" : "CV B");
  const summary = (d: CVData) => d.summary?.trim() || (lang === "sw" ? "(hakuna summary)" : "(no summary)");
  const expCount = (d: CVData) => d.experience?.length ?? 0;
  const eduCount = (d: CVData) => d.education?.length ?? 0;

  const scoredBlock = facts.scored && facts.a && facts.b
    ? `
MATCH SCORES (facts, from the platform's match engine — the same numbers the user sees):
- ${name(a)}: ${facts.a.score}% — matched: ${facts.a.matched.join(", ") || "(none)"}; missing: ${facts.a.missing.join(", ") || "(none)"}
- ${nameB(b)}: ${facts.b.score}% — matched: ${facts.b.matched.join(", ") || "(none)"}; missing: ${facts.b.missing.join(", ") || "(none)"}`
    : `
(No job description provided — compare structure and skills directly.)`;

  return `You are a career coach comparing two CVs for a real job-seeker. Below are both CVs and, when available, the DETERMINISTIC match scores (facts). Your job: write a short, useful comparison (max 120 words, in ${L}) that the candidate can act on.

${scoredBlock}

SKILLS ONLY IN ${name(a)}: ${facts.onlyA.join(", ") || "(none)"}
SKILLS ONLY IN ${nameB(b)}: ${facts.onlyB.join(", ") || "(none)"}
SKILLS IN BOTH: ${facts.shared.join(", ") || "(none)"}

CV ${name(a)} (${expCount(a)} experiences, ${eduCount(a)} education entries):
${summary(a)}

CV ${nameB(b)} (${expCount(b)} experiences, ${eduCount(b)} education entries):
${summary(b)}

${TRUTH_CONSTRAINT} All scores and skills above are facts — report them faithfully. You may explain WHY one CV fits better (structure, keywords, emphasis), but never claim a CV contains something it doesn't, never invent skills or numbers. If neither is clearly stronger, say so honestly.

Reply in ${L}, plain text, no markdown headers.`;

}

/** Parse the AI comparison reply defensively (it's free text — no JSON). */
export function parseCvCompare(raw: string): string {
  return raw?.trim() ? raw.trim() : "";
}
