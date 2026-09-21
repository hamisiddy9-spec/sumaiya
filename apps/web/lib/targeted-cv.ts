// Targeted CV builder — Job → Match → Tailored CV, the core differentiator.
//
// Given the Career Profile + a job description, it:
//   1. analyzes the job (title/skills/keywords/seniority — lib/job-analysis)
//   2. builds a CV from the profile (profileToCvData — verified facts only)
//   3. reorders/reweights skills + experience around what THIS job asks for
//      (rankSkillsForJob / rankExperienceForJob — no facts invented)
//   4. scores BEFORE vs AFTER with the real engine (matchCvToJd) so the
//      improvement shown to the user is the actual match delta — never a
//      fabricated number
//   5. explains WHY it improved (which keywords got covered by the reorder)
//
// The AI reword step (summary/experience rewrite) stays in /api/ai/tailor-cv
// with TRUTH_CONSTRAINT + the evidence gate — this builder is deterministic
// and never rewrites content itself. Missing requirements are surfaced for a
// confirm question, never auto-added.

import type { CareerProfile, CVData } from "@/types";
import { profileToCvData } from "@/lib/career-profile/mapper";
import { matchCvToJd } from "@/lib/job-match";
import { matchExplanation } from "@/lib/match-explanation";
import { analyzeJob, rankSkillsForJob, rankExperienceForJob, type JobAnalysis } from "@/lib/job-analysis";

/** The two product languages; mirrors SnapLang in lib/api/snap-apply.ts. */
export type SnapLang = "en" | "sw";

export interface TargetedCvResult {
  /** The derived, reordered CV (before AI rewording). */
  cv: CVData;
  analysis: JobAnalysis;
  /** Real engine scores — before (profile-derived, original order) and after. */
  before: { score: number; matched: string[]; missing: string[] };
  after: { score: number; matched: string[]; missing: string[] };
  /** Why the score moved — concrete keyword coverage deltas. */
  explanation: string[];
  /** Requirements the user should confirm they have (never auto-added). */
  toConfirm: string[];
}

export function buildTargetedCv(profile: CareerProfile, jd: string, lang: SnapLang = "en"): TargetedCvResult {
  const analysis = analyzeJob(jd, profile.personal.jobTitle);

  // Base CV from the profile (verified facts only).
  const base = profileToCvData(profile);

  // Reorder/reweight around the job.
  const reordered: CVData = {
    ...base,
    skills: rankSkillsForJob(base.skills, analysis),
    experience: rankExperienceForJob(base.experience, analysis),
  };

  const before = matchCvToJd(base, jd);
  const after = matchCvToJd(reordered, jd);

  // Explain the delta with concrete coverage facts, in the caller's language
  // (lib/match-explanation.ts) — the same builder /snap uses, so the two screens
  // can never drift into different wording or different languages.
  const explanation = matchExplanation({
    lang,
    newlyMatched: after.matched.filter((t) => !before.matched.includes(t)),
    stillMissing: after.missing.slice(0, 6),
    beforeScore: before.score,
    afterScore: after.score,
  });

  return {
    cv: reordered,
    analysis,
    before: { score: before.score, matched: before.matched, missing: before.missing },
    after: { score: after.score, matched: after.matched, missing: after.missing },
    explanation,
    toConfirm: analysis.requirements,
  };
}
