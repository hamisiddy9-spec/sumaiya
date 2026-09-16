/**
 * The AI spine — one recommendation layer that turns the Career Profile into a
 * single, coherent "what to do next" across the whole product, not just
 * templates.
 *
 * Until now only templates had a recommender (`template-suggestions.ts`), so the
 * rest of the app had to guess. This module folds the profile into ONE
 * structured answer with three coordinated parts:
 *
 *   1. templates — reuse `suggestTemplates`, so the picks are field-aware and
 *      always renderable, never a dangling id;
 *   2. skills / learning — map the SAME detected field onto the curated
 *      `SKILLS_BY_FIELD` catalogue (`courses.ts`), skipping anything the user
 *      already lists on their profile, so we never tell a driver to "learn
 *      Excel" twice;
 *   3. a next action — one actionable sentence, in the user's language.
 *
 * Deterministic and offline. When the profile is too sparse to detect a field,
 * this returns `null` and the caller shows a gentle nudge instead of a wrong
 * guess — a wrong recommendation is worse than none.
 */

import type { CareerProfile } from "./profile-store";
import { profilePromptBlock } from "./profile-store";
import { inferField, suggestTemplates, fieldLabel, type CareerField } from "./template-suggestions";
import { SKILL_AREAS, SKILLS_BY_FIELD, type SkillArea } from "./courses";
import type { CvTemplateMeta } from "./cv-html";

export interface RecommendedSkill {
  area: SkillArea;
  reason: { en: string; sw: string };
}

export interface NextMoves {
  /** The single detected field driving every part of this answer. */
  field: CareerField;
  fieldLabel: { en: string; sw: string };
  /** 1–3 templates, best first (never more than asked for). */
  templates: CvTemplateMeta[];
  /** The honest one-line reason the templates were picked. */
  templateWhy: { en: string; sw: string };
  /** 2–3 skill gaps, highest-weight first, minus what they already list. */
  skills: RecommendedSkill[];
  /** The single thing to do next. */
  action: { en: string; sw: string };
}

const lc = (s: string) => s.toLowerCase();

/** Mirrors skill-gaps' `userHasSkill`: does the profile already demonstrate
 *  this skill, so we shouldn't nudge them to learn it again. */
function profileHasSkill(area: SkillArea, text: string): boolean {
  const hay = lc(text);
  return area.cvKeywords.some((k) => hay.includes(k));
}

/**
 * Build the "next moves" answer for a profile. Returns `null` when there is not
 * enough to go on — the caller should show a fallback, not a guess.
 */
export function recommendNextMoves(profile: CareerProfile): NextMoves | null {
  const text = profilePromptBlock(profile);
  const suggested = suggestTemplates(text, 3);
  const field = inferField(text);
  if (!field || !suggested) return null;

  // Skills for the SAME field, minus what the user already demonstrates.
  // `haveText` deliberately mirrors skill-gaps: skills + summary + experience,
  // NOT the headline (first-run stores field labels there, and matching a
  // label would wrongly credit the user with the skill).
  const haveText = [profile.skills, profile.summary, profile.experience]
    .filter(Boolean)
    .join(" · ");

  const skills: RecommendedSkill[] = [];
  for (const id of SKILLS_BY_FIELD[field] ?? []) {
    const area = SKILL_AREAS.find((a) => a.id === id);
    if (!area) continue;
    if (profileHasSkill(area, haveText)) continue;
    skills.push({
      area,
      reason: {
        en: `Hiring managers for ${fieldLabel(field, "en")} roles look for ${area.skill.en} — and it's not on your profile yet.`,
        sw: `Waajiri wa kazi za ${fieldLabel(field, "sw")} wanatafuta ${area.skill.sw} — na bado haiko kwenye wasifu wako.`,
      },
    });
    if (skills.length === 3) break;
  }

  const topTemplate = suggested.templates[0];
  const action = topTemplate
    ? {
        en: `Start your ${fieldLabel(field, "en")} CV with the ${topTemplate.name.en} design`,
        sw: `Anza CV yako ya ${fieldLabel(field, "sw")} kwa muundo wa ${topTemplate.name.sw}`,
      }
    : {
        en: `Start a ${fieldLabel(field, "en")} CV from your profile`,
        sw: `Anza CV ya ${fieldLabel(field, "sw")} kutoka wasifu wako`,
      };

  return {
    field,
    fieldLabel: { en: fieldLabel(field, "en"), sw: fieldLabel(field, "sw") },
    templates: suggested.templates,
    templateWhy: suggested.why,
    skills,
    action,
  };
}
