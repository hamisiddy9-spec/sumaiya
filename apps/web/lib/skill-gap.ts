// Skill-gap analysis + learning plan — deterministic facts FIRST, AI
// recommendation SECOND, clearly separated.
//
// Facts (never AI):
//   - strengths = job terms the CV already covers (matched by the real match
//     engine, matchCvToJd — not an LLM's opinion)
//   - gaps      = job terms the CV does NOT cover (the honest delta)
// Recommendation (AI, labelled as such):
//   - a learning plan built ONLY from the gaps — the model suggests HOW to
//     close them, it never claims the candidate already has them.
//
// Reuses lib/job-match.ts (extractTerms / matchCvToJd) — no parallel engine.

import type { CVData } from "@/types";
import { matchCvToJd } from "@/lib/job-match";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";
import { resourcesForGaps, type LearningResource } from "@/lib/learning-resources";

export interface SkillGapFacts {
  /** Job terms the CV already covers (from the real match engine). */
  strengths: string[];
  /** Job terms missing from the CV (the honest delta). */
  gaps: string[];
  /** 0–100 keyword coverage — same score the match card shows. */
  score: number;
  /** Ranked gap terms that are worth learning (≥4 chars, not pure noise). */
  learnableGaps: string[];
  /**
   * REAL learning resources for the most important gaps — deterministic KB,
   * never AI-invented. Empty when no gap maps to a known course (honest).
   */
  resources: LearningResource[];
}

/** Deterministic fact layer — no AI involved. */
export function analyzeSkillGap(data: CVData, jobDescription: string): SkillGapFacts {
  const { matched, missing, score } = matchCvToJd(data, jobDescription);
  const learnableGaps = missing
    .filter((t) => t.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
  return {
    strengths: matched,
    gaps: missing,
    score,
    learnableGaps,
    // REAL courses for the top gaps — deterministic, never invented. The AI
    // learning plan (separate) stays the only AI layer.
    resources: resourcesForGaps(learnableGaps, 4),
  };
}

/** Prompt for the AI learning plan — built ONLY from the fact-layer gaps.
 *  Embeds TRUTH_CONSTRAINT: the plan is a recommendation, never a claim that
 *  the candidate already has the skill. */
export function buildLearningPlanPrompt(
  jobTitle: string | undefined,
  strengths: string[],
  gaps: string[],
  lang: "en" | "sw",
): string {
  const L = lang === "sw" ? "Swahili" : "English";
  return `You are a career coach helping a real job-seeker prepare for a specific role. The candidate's CV has been compared against a job description. Below are the FACTS from that comparison: what their CV already covers (strengths) and what the job expects that their CV does NOT list (gaps).

STRENGTHS (already in the CV):
${strengths.join(", ") || "(none matched)"}

GAPS (not found in the CV):
${gaps.join(", ") || "(none)"}

Write a short, practical LEARNING PLAN that helps the candidate close the most important gaps before applying — no more than 5 concrete steps. Each step must be an action the candidate can actually take (a course, a project, a certification, a practice routine), grounded in the real gap term it addresses. ${TRUTH_CONSTRAINT} The candidate may or may not already have some of these skills — you are RECOMMENDING how to learn/strengthen them, never asserting the candidate has them. Never invent employers, projects, courses with fake institutions, or achievements. If a gap looks like generic text rather than a real skill (e.g. "responsibilities", "experience"), skip it.

Return STRICT JSON only, exactly this shape (no commentary, no markdown):
{"plan":[{"step":"<concrete action>","gap":"<which gap term it addresses>"}],"summary":"<one-sentence overview, in ${L}>"}

Write the plan content in ${L}.`;

}

/** Best-effort parse of the AI plan response (defensive — the model can drift). */
export function parseLearningPlan(raw: string): { plan: { step: string; gap: string }[]; summary: string } {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const obj = JSON.parse(cleaned) as { plan?: unknown; summary?: unknown };
    const plan = Array.isArray(obj.plan)
      ? obj.plan
          .map((p) => {
            const o = (p ?? {}) as { step?: unknown; gap?: unknown };
            return { step: String(o.step ?? "").trim(), gap: String(o.gap ?? "").trim() };
          })
          .filter((s) => s.step)
      : [];
    return { plan, summary: String(obj.summary ?? "").trim() };
  } catch {
    return { plan: [], summary: "" };
  }
}
