// ScoreExplanation — the machine-readable "why" behind a Sumaiya Score.
//
// Every score answers: what is good? what is missing? what is weak? what can
// be improved? what cannot be fixed without user input?
//
// Pure deterministic. The AI chat renders this structure; it never fabricates
// it. Copy philosophy (directive §7, §28): a score is a guide based on the job
// description — never a hiring prediction, never "ATS-proof".

import type { CompositeScore, ScoreComponent, ScoreComponentKey } from "@/lib/score/composite";
import type { CVData } from "@/types";
import { matchCvToJd, extractTerms } from "@/lib/job-match";
import { analyzeJob } from "@/lib/job-analysis";

export interface ScoreExplanation {
  /** Strong areas (component ≥ 70) — concrete reasons. */
  good: string[];
  /** Concrete gaps: missing keywords, missing job tools, missing requirements. */
  missing: string[];
  /** Weak areas (component 40–69) — could improve but not absent. */
  weak: string[];
  /** Actionable improvements the user can make in the editor. */
  improvable: string[];
  /** Things only the user can confirm (e.g. "do you have Python experience?"). */
  needsUserInput: string[];
  /** Honest framing — always attached to the score. */
  disclaimer: { en: string; sw: string };
}

const COMPONENT_LABEL: Record<ScoreComponentKey, { en: string; sw: string }> = {
  jobRelevance: { en: "Job relevance", sw: "Uhusiano na kazi" },
  keywordCoverage: { en: "Keyword coverage", sw: "Upatikanaji wa maneno muhimu" },
  skillsAlignment: { en: "Skills alignment", sw: "Upangaji wa ujuzi" },
  experienceRelevance: { en: "Experience relevance", sw: "Uhusiano wa uzoefu" },
  achievementStrength: { en: "Achievement strength", sw: "Nguvu ya mafanikio" },
  educationQualification: { en: "Education & qualifications", sw: "Elimu na sifa" },
  atsQuality: { en: "ATS document quality", sw: "Ubora wa hati kwa waajiri" },
};

const DISCLAIMER = {
  en: "This score estimates how closely your CV aligns with the job description. It is a guide, not a hiring prediction.",
  sw: "Alama hii inakadiria jinsi CV yako inavyolingana na maelezo ya kazi. Ni mwongozo, si utabiri wa kuajiriwa.",
};

/**
 * Build the structured explanation for a composite score. Deterministic.
 * `data` + `jd` are needed for the concrete gap lists (missing keywords,
 * missing job tools).
 */
export function explainScore(score: CompositeScore, data: CVData, jd: string, sw = false): ScoreExplanation {
  const good: string[] = [];
  const missing: string[] = [];
  const weak: string[] = [];
  const improvable: string[] = [];
  const needsUserInput: string[] = [];

  for (const c of score.components) {
    const label = COMPONENT_LABEL[c.key][sw ? "sw" : "en"];
    if (c.score >= 70) {
      good.push(`${label}: ${c.detail}`);
    } else if (c.score >= 40) {
      weak.push(`${label}: ${c.detail}`);
    } else if (c.score > 0) {
      improvable.push(`${label}: ${c.detail}`);
    }
  }

  // Concrete missing keywords (top 6).
  const match = matchCvToJd(data, jd);
  const missingKeywords = match.missing.slice(0, 6);
  if (missingKeywords.length) {
    missing.push(
      sw
        ? `${missingKeywords.length} maneno muhimu ya kazi hayapo kwenye CV: ${missingKeywords.join(", ")}.`
        : `${missingKeywords.length} important job keywords are not in your CV: ${missingKeywords.join(", ")}.`
    );
  }

  // Missing job tools → needs user input (only the user knows if they have it).
  const analysis = analyzeJob(jd, data.personal.jobTitle);
  const cvSkillNames = new Set(
    data.skills.map((s) => (typeof s === "string" ? s : s.name).toLowerCase().trim())
  );
  const missingTools = [...new Set(analysis.skills.map((s) => s.toLowerCase().trim()))].filter(
    (s) => !cvSkillNames.has(s)
  );
  for (const tool of missingTools.slice(0, 4)) {
    needsUserInput.push(
      sw
        ? `"${tool}" inaonekana kwenye maelezo ya kazi lakini haipo kwenye CV yako. Kama una uzoefu huo, niambie wapi/umetumiaje.`
        : `"${tool}" appears in the job description but not in your CV. If you have this experience, tell me where/how you used it.`
    );
  }

  // Missing requirements (from the requirement classifier terms).
  const reqTerms = analysis.requirements.map((r) => extractTerms(r).filter((t) => t.length >= 3));
  const missingReq = reqTerms
    .filter((terms) => terms.length > 0 && !terms.some((t) => match.matched.includes(t)))
    .slice(0, 3);
  if (missingReq.length) {
    missing.push(
      sw
        ? `Mahitaji yafuatayo hayajaonyeshwa waziwazi: ${analysis.requirements.slice(0, 3).join("; ")}.`
        : `These requirements aren't clearly demonstrated: ${analysis.requirements.slice(0, 3).join("; ")}.`
    );
  }

  // ATS-driven improvement hints (weak verb / no numbers already surfaced via
  // the achievement component; add the editor-visible hint).
  const achieve = score.components.find((c) => c.key === "achievementStrength");
  if (achieve && achieve.score < 70) {
    improvable.push(
      sw
        ? "Ongeza idadi/matokeo yaliyopimika kwenye maelezo ya uzoefu (mfano: asilimia, kiasi, muda)."
        : "Add measurable outcomes to your experience bullets (percentages, counts, timeframes)."
    );
  }

  // Dedupe while preserving order.
  const seen = new Set<string>();
  const uniq = (arr: string[]) => arr.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));

  return {
    good: uniq(good),
    missing: uniq(missing),
    weak: uniq(weak),
    improvable: uniq(improvable),
    needsUserInput: uniq(needsUserInput),
    disclaimer: DISCLAIMER,
  };
}

/** One-line EN/SW summary of the explanation for chips and headers. */
export function scoreHeadline(score: CompositeScore, sw = false): string {
  const top = [...score.components].sort((a, b) => b.score - a.score)[0];
  const label = COMPONENT_LABEL[top.key][sw ? "sw" : "en"];
  return sw
    ? `Alama ${score.score}/100 — ${label} ndiyo nguvu yako kubwa (${top.score}/100).`
    : `Score ${score.score}/100 — ${label} is your strongest area (${top.score}/100).`;
}
