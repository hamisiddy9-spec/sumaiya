// Sumaiya Score — the ONE authoritative, explainable composite score.
//
// Pure deterministic code. NEVER calls the AI. Calls the existing engines
// (matchCvToJd, atsScore, analyzeJob, classifyRequirements, extractMetrics)
// and combines them with fixed weights. The AI may explain the score in
// natural language; it never computes it.
//
// Anti-spoof rule (inherited): the score is always recomputed server-side;
// client-provided scores are informational only.
//
// Engineering truth (from the eval harness): matchCvToJd is Set-based and
// order-invariant — truthful tailoring CANNOT raise keyword coverage. That is
// why keyword coverage is only 20% of the composite: the ATS, achievement and
// education components are what honestly move after tailoring.

import type { CVData } from "@/types";
import { matchCvToJd, extractTerms } from "@/lib/job-match";
import { analyzeCv, atsScore } from "@/lib/ats-score";
import { analyzeJob, analyzeJobProfile, type JobAnalysis, type JobProfile } from "@/lib/job-analysis";
import { classifyRequirements } from "@/lib/requirement-evidence";
import { extractMetrics } from "@/lib/career-profile/evidence";

export type ScoreComponentKey =
  | "jobRelevance"
  | "keywordCoverage"
  | "skillsAlignment"
  | "experienceRelevance"
  | "achievementStrength"
  | "educationQualification"
  | "atsQuality";

export interface ScoreComponent {
  key: ScoreComponentKey;
  /** Weight 0..1 — sums to 1. */
  weight: number;
  /** Component score 0..100. */
  score: number;
  /** Human-readable why, English. */
  detail: string;
  /** Human-readable why, Swahili. */
  detailSw: string;
}

export interface CompositeScore {
  /** Rounded 0..100 total (sum of weight × score). */
  score: number;
  components: ScoreComponent[];
}

export interface CompositeInput {
  data: CVData;
  jd: string;
  /** Language for details (default "en"). */
  sw?: boolean;
}

const WEIGHTS: Record<ScoreComponentKey, number> = {
  jobRelevance: 0.25,
  keywordCoverage: 0.2,
  skillsAlignment: 0.2,
  experienceRelevance: 0.15,
  achievementStrength: 0.1,
  educationQualification: 0.05,
  atsQuality: 0.05,
};

/** 0..100 alignment between the job title and the candidate's stated title. */
function titleAlignment(jobTitle: string, cvJobTitle: string): { score: number; detail: string } {
  const jt = jobTitle.trim().toLowerCase();
  const ct = (cvJobTitle || "").trim().toLowerCase();
  if (!jt || !ct) return { score: 50, detail: "Job title unstated or CV has no target title." };
  if (jt === ct) return { score: 100, detail: `Exact title match: ${jobTitle}.` };
  if (jt.includes(ct) || ct.includes(jt)) {
    return { score: 90, detail: `Title overlap: “${jobTitle}” vs “${cvJobTitle}”.` };
  }
  // Shared significant word (e.g. "Marketing Manager" vs "Digital Marketing Lead").
  const jWords = new Set(jt.split(/\W+/).filter((w) => w.length >= 4));
  const cWords = new Set(ct.split(/\W+/).filter((w) => w.length >= 4));
  const shared = [...jWords].filter((w) => cWords.has(w));
  if (shared.length > 0) return { score: 75, detail: `Related titles (shared term: ${shared[0]}).` };
  return { score: 30, detail: "Job title differs from your stated title." };
}

/** 0..100: what fraction of the JD's known-tool skills appear in the CV. */
function skillsAlignment(analysis: JobAnalysis, data: CVData): { score: number; missing: string[] } {
  const cvSkillNames = new Set(
    data.skills.map((s) => (typeof s === "string" ? s : s.name).toLowerCase().trim())
  );
  const jdSkills = [...new Set(analysis.skills.map((s) => s.toLowerCase().trim()))];
  if (jdSkills.length === 0) return { score: 100, missing: [] };
  const missing = jdSkills.filter((s) => !cvSkillNames.has(s));
  const matched = jdSkills.length - missing.length;
  return { score: Math.round((matched / jdSkills.length) * 100), missing };
}

/** 0..100: JD keyword coverage of the experience section alone. */
function experienceRelevance(jd: string, data: CVData): { score: number; detail: string } {
  const jdTerms = extractTerms(jd).filter((t) => t.length >= 4);
  if (jdTerms.length === 0) return { score: 100, detail: "No measurable keywords in the job description." };
  const expText = data.experience
    .map((e) => `${e.position} ${e.company} ${e.description}`)
    .join(" ")
    .toLowerCase();
  const matched = jdTerms.filter((t) => expText.includes(t));
  return {
    score: Math.round((matched.length / jdTerms.length) * 100),
    detail: `${matched.length}/${jdTerms.length} job keywords appear in your experience.`,
  };
}

/** 0..100: quantified achievements in the CV (metrics in bullets). */
function achievementStrength(data: CVData): { score: number; count: number; detail: string } {
  const texts = [
    data.summary,
    ...data.experience.map((e) => e.description),
    ...(data.projects ?? []).map((p) => (typeof p === "string" ? p : `${p.name ?? ""} ${p.description ?? ""}`)),
  ].filter(Boolean);
  let count = 0;
  const seen = new Set<string>();
  for (const t of texts) {
    for (const m of extractMetrics(t)) {
      if (!seen.has(m.normalized)) {
        seen.add(m.normalized);
        count++;
      }
    }
  }
  const score = count === 0 ? 0 : count === 1 ? 30 : count === 2 ? 55 : count === 3 ? 75 : count >= 4 ? 90 : 100;
  return { score, count, detail: `${count} quantified ${count === 1 ? "metric" : "metrics"} found in your experience.` };
}

/** 0..100: JD requirements covered by the matched keyword set. */
function educationQualification(jd: string, data: CVData): { score: number; detail: string } {
  const analysis = analyzeJob(jd, data.personal.jobTitle);
  const match = matchCvToJd(data, jd);
  if (analysis.requirements.length === 0) return { score: 100, detail: "No explicit requirements to check." };
  const evidence = classifyRequirements(analysis.requirements, match.matched);
  const detected = evidence.filter((e) => e.status === "detected").length;
  const partial = evidence.filter((e) => e.status === "partial").length;
  return {
    score: Math.round(((detected + partial * 0.5) / evidence.length) * 100),
    detail: `${detected}/${evidence.length} requirements covered, ${partial} partial.`,
  };
}

/**
 * Compute the Sumaiya Score. Deterministic; safe for server AND client
 * (no DB, no AI). `jobProfile` may be supplied to reuse an already-parsed JD.
 */
export function computeCompositeScore(input: CompositeInput, jobProfile?: JobProfile): CompositeScore {
  const { data, jd, sw = false } = input;
  const analysis = jobProfile ? { title: jobProfile.title, skills: jobProfile.skills.map((s) => s.name), seniority: jobProfile.seniority, employmentType: jobProfile.employmentType, keywords: jobProfile.keywords, requirements: jobProfile.requirements.map((r) => r.text) } as JobAnalysis : analyzeJob(jd, data.personal.jobTitle);
  const match = matchCvToJd(data, jd);
  const atsChecks = analyzeCv(data, sw);
  const ats = atsScore(atsChecks);

  const title = titleAlignment(analysis.title, data.personal.jobTitle);
  const skillAlign = skillsAlignment(analysis, data);
  const expRel = experienceRelevance(jd, data);
  const achieve = achievementStrength(data);
  const edu = educationQualification(jd, data);

  const components: ScoreComponent[] = [
    {
      key: "jobRelevance",
      weight: WEIGHTS.jobRelevance,
      score: title.score,
      detail: title.detail,
      detailSw: title.detail,
    },
    {
      key: "keywordCoverage",
      weight: WEIGHTS.keywordCoverage,
      score: match.score,
      detail: `${match.matched.length}/${match.matched.length + match.missing.length} job keywords matched.`,
      detailSw: `${match.matched.length}/${match.matched.length + match.missing.length} maneno ya kazi yamepatikana kwenye CV.`,
    },
    {
      key: "skillsAlignment",
      weight: WEIGHTS.skillsAlignment,
      score: skillAlign.score,
      detail:
        skillAlign.missing.length === 0
          ? "All job tools appear in your skills."
          : `Missing job tools: ${skillAlign.missing.slice(0, 5).join(", ")}.`,
      detailSw:
        skillAlign.missing.length === 0
          ? "Zana zote za kazi zinapatikana kwenye ujuzi wako."
          : `Zana zinazokosekana: ${skillAlign.missing.slice(0, 5).join(", ")}.`,
    },
    {
      key: "experienceRelevance",
      weight: WEIGHTS.experienceRelevance,
      score: expRel.score,
      detail: expRel.detail,
      detailSw: expRel.detail,
    },
    {
      key: "achievementStrength",
      weight: WEIGHTS.achievementStrength,
      score: achieve.score,
      detail: achieve.detail,
      detailSw: `${achieve.count} mafanikio yaliyopimika yamepatikana kwenye uzoefu wako.`,
    },
    {
      key: "educationQualification",
      weight: WEIGHTS.educationQualification,
      score: edu.score,
      detail: edu.detail,
      detailSw: edu.detail,
    },
    {
      key: "atsQuality",
      weight: WEIGHTS.atsQuality,
      score: Math.round(ats),
      detail: `ATS readiness ${Math.round(ats)}/100 (${atsChecks.filter((c) => c.pass).length}/${atsChecks.length} checks pass).`,
      detailSw: `Utayari wa ATS ${Math.round(ats)}/100 (${atsChecks.filter((c) => c.pass).length}/${atsChecks.length} ukaguzi umepita).`,
    },
  ];

  const total = Math.round(components.reduce((acc, c) => acc + c.weight * c.score, 0));
  return { score: total, components };
}
