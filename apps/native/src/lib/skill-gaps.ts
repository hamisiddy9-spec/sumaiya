/**
 * The skill-gap engine behind the Learning Hub.
 *
 * Deterministic, no AI, no network. It compares what the user already has
 * (Career Profile skills + their most recent CV) against what their target
 * jobs actually ask for (the recommended-jobs feed), against the curated
 * SKILL_AREAS catalogue.
 *
 * Works with zero CV — for a user who's only done first-run, the field they
 * picked drives the "your next skills" list.
 */
import type { CVData } from "@sumaiya/types";
import type { JobRecommendation } from "@sumaiya/api-client";
import type { CareerProfile } from "./profile-store";
import { CAREER_FIELDS } from "./career-fields";
import { SKILLS_BY_FIELD, SKILL_AREAS, type Priority, type SkillArea } from "./courses";

export interface SkillGap {
  area: SkillArea;
  status: "gap" | "strong";
  priority: Priority;
  /** how many target jobs asked for this skill (0 when it's field-relevance only) */
  jobHits: number;
  jobsChecked: number;
  reason: { en: string; sw: string };
}

export interface GapResult {
  target: string; // the role/field label shown at the top
  readiness: number; // 0–100 — strong / (strong + gaps)
  gaps: SkillGap[]; // ranked, highest priority first
  strengths: SkillArea[];
}

const lc = (s: string) => s.toLowerCase();

/** Recover field ids from the profile headline (first-run stores the EN labels
 *  joined with " · "). */
function fieldIdsFromProfile(p: CareerProfile): string[] {
  const h = lc(p.headline || "");
  if (!h) return [];
  return CAREER_FIELDS.filter((f) => h.includes(lc(f.label.en)) || h.includes(lc(f.label.sw))).map((f) => f.id);
}

function userHasSkill(area: SkillArea, haystack: string): boolean {
  return area.cvKeywords.some((k) => haystack.includes(k));
}

function jobHitCount(area: SkillArea, jobTexts: string[]): number {
  if (!area.jobKeywords.length) return 0;
  return jobTexts.filter((txt) => area.jobKeywords.some((k) => txt.includes(k))).length;
}

export function computeSkillGaps(input: {
  profile: CareerProfile;
  cv?: CVData | null;
  jobs?: JobRecommendation[];
}): GapResult {
  const { profile, cv, jobs = [] } = input;

  // What the user already DEMONSTRATES — skills, summary, experience, CV.
  // NOT the headline: first-run stores field labels there ("Finance &
  // Accounting"), and matching "accounting" in a field name would wrongly
  // credit the user with the skill.
  const haveText = lc(
    [
      profile.skills,
      profile.summary,
      profile.experience,
      cv?.summary ?? "",
      ...(cv?.skills ?? []).map((s) => s.name),
      ...(cv?.experience ?? []).flatMap((e) => [e.title, e.description]),
    ]
      .filter(Boolean)
      .join(" · "),
  );

  // What the target jobs ask for.
  const jobTexts = jobs.map((j) => lc(`${j.job.title} ${j.job.description} ${j.matchedTerms.join(" ")}`));
  const jobsChecked = jobTexts.length;

  // Field relevance — every skill mapped to one of the user's fields is "in
  // play" even if no live job mentions it.
  const fieldIds = fieldIdsFromProfile(profile);
  const fieldSkillIds = new Set(fieldIds.flatMap((id) => SKILLS_BY_FIELD[id] ?? []));

  const gaps: SkillGap[] = [];
  const strengths: SkillArea[] = [];

  for (const area of SKILL_AREAS) {
    const has = userHasSkill(area, haveText);
    const hits = jobHitCount(area, jobTexts);
    const fieldRelevant = fieldSkillIds.has(area.id);
    // Job-search / interview skills are always in play once someone is looking.
    const universal = area.id === "job-search" || area.id === "interview";
    const relevant = hits > 0 || fieldRelevant || universal;
    if (!relevant) continue;

    if (has && !universal) {
      strengths.push(area);
      continue;
    }

    // Priority: real job demand outranks field relevance; the catalogue weight
    // is a tie-breaker.
    let priority: Priority;
    if (hits >= 3 || (hits >= 1 && area.weight >= 5)) priority = "high";
    else if (hits >= 1 || (fieldRelevant && area.weight >= 4)) priority = "medium";
    else priority = universal ? "medium" : "low";

    const reason =
      hits > 0
        ? {
            en: `${hits} of ${jobsChecked} jobs you're matched to ask for ${area.skill.en}, and it's not on your CV yet.`,
            sw: `Kazi ${hits} kati ya ${jobsChecked} unazolingana nazo zinahitaji ${area.skill.sw}, na haiko kwenye CV yako bado.`,
          }
        : universal
          ? {
              en: `Every application comes down to this — worth practising before you need it.`,
              sw: `Kila ombi linaishia hapa — inafaa kufanya mazoezi kabla ya kuhitaji.`,
            }
          : {
              en: `Common in ${fieldIds.length ? "your field" : "the jobs you're targeting"} and quick to make visible on a CV.`,
              sw: `Ya kawaida katika ${fieldIds.length ? "fani yako" : "kazi unazolenga"} na ya haraka kuionyesha kwenye CV.`,
            };

    gaps.push({ area, status: "gap", priority, jobHits: hits, jobsChecked, reason });
  }

  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  gaps.sort((a, b) => order[a.priority] - order[b.priority] || b.jobHits - a.jobHits || b.area.weight - a.area.weight);

  const denom = gaps.length + strengths.length;
  const readiness = denom ? Math.round((strengths.length / denom) * 100) : 0;

  const target =
    profile.headline?.split(" · ")[0]?.trim() ||
    (fieldIds[0] && CAREER_FIELDS.find((f) => f.id === fieldIds[0])?.label.en) ||
    "";

  return { target, readiness, gaps, strengths };
}
