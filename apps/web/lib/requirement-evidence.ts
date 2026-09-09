/**
 * M2 — Per-requirement evidence classification for an application's match
 * breakdown (the "You are missing 4 important requirements" view).
 *
 * Inputs are REAL persisted data only: the requirements list the snap parser
 * extracted from the JD, and the keyword-level matched list. We never invent a
 * requirement or a status — everything is derived deterministically:
 *
 *  - a requirement is "detected" when ALL its significant terms appear in the
 *    matched set (exact, or as part of a longer matched phrase);
 *  - "partial" when SOME do (weak evidence — the profile touches it);
 *  - "missing" when NONE do;
 *  - a requirement with NO significant terms (pure stopwords, e.g. "Must have
 *    experience") is reported "detected" — we can't prove an absence from a
 *    phrase that carries no signal, so we never claim it's missing.
 *
 * This is the anti-fabrication line: statuses are claims, and every claim is
 * grounded in the real matched/missing data the user already saw at snap time.
 */

import { extractTerms, STOP_WORDS } from "./job-match";
import { resourcesForGaps, type LearningResource } from "./learning-resources";

export type RequirementStatus = "detected" | "partial" | "missing";

export type RequirementEvidence = {
  requirement: string;
  status: RequirementStatus;
  /** significant terms of the requirement that appear in the matched set */
  matchedTerms: string[];
  /** significant terms with no match — the concrete gap */
  missingTerms: string[];
  /**
   * REAL learning resources that close this requirement's gap — deterministic
   * KB lookup on the missing terms, never AI-invented. Empty for detected
   * requirements and for gaps with no known course (honest).
   */
  resources: LearningResource[];
};

/** Significant terms of one requirement line (stopwords stripped). */
export function requirementTerms(requirement: string): string[] {
  return extractTerms(requirement).filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

/** True when the term is covered by the matched set (exact or phrase-contains). */
export function isTermMatched(term: string, matched: readonly string[]): boolean {
  const t = term.toLowerCase();
  return matched.some((m) => {
    const phrase = m.toLowerCase();
    return phrase === t || phrase.includes(t) || t.includes(phrase);
  });
}

export function classifyRequirements(
  requirements: readonly string[],
  matched: readonly string[]
): RequirementEvidence[] {
  return requirements.map((requirement) => {
    const terms = requirementTerms(requirement);
    // No signal → can't claim a gap. Report as detected (nothing to fix).
    if (terms.length === 0) {
      return { requirement, status: "detected", matchedTerms: [], missingTerms: [], resources: [] };
    }
    const matchedTerms = terms.filter((t) => isTermMatched(t, matched));
    const missingTerms = terms.filter((t) => !matchedTerms.includes(t));
    const status: RequirementStatus =
      missingTerms.length === 0 ? "detected" : matchedTerms.length > 0 ? "partial" : "missing";
    return {
      requirement,
      status,
      matchedTerms,
      missingTerms,
      // Real courses for the concrete gap — deterministic KB, never invented.
      resources: resourcesForGaps(missingTerms, 3),
    };
  });
}

/** Counts for the summary line ("4 important requirements missing"). */
export function requirementSummary(evidence: readonly RequirementEvidence[]) {
  return {
    total: evidence.length,
    detected: evidence.filter((e) => e.status === "detected").length,
    partial: evidence.filter((e) => e.status === "partial").length,
    missing: evidence.filter((e) => e.status === "missing").length,
  };
}
