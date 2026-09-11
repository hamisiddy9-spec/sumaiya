/**
 * Turns a proactive signal from /api/mobile/signals into something the home
 * screen can render and act on. The signal engine is deterministic and shared
 * with the web (lib/assistant/signals.ts) — this just picks the native
 * destination for each type.
 */
import type { MobileSignal } from "@sumaiya/api-client";
import type { Lang } from "./i18n";
import { SKILL_AREAS } from "./courses";

/** Matches a raw missing-skill keyword from the server (e.g. "excel") to this
 *  catalogue's own labelled skill area, so the CTA can name it the way the
 *  Learning Hub itself does ("Excel") rather than a bare capitalised keyword.
 *  Falls back to the raw keyword, capitalised, when nothing in the curated
 *  14 areas covers it — the signal is still real, just not yet catalogued. */
function skillLabel(keyword: string, lang: Lang): string {
  const k = keyword.toLowerCase();
  const area = SKILL_AREAS.find(
    (a) => a.id === k || a.jobKeywords.includes(k) || a.cvKeywords.includes(k) || a.skill.en.toLowerCase() === k,
  );
  if (area) return area.skill[lang];
  return keyword.charAt(0).toUpperCase() + keyword.slice(1);
}

export interface SignalAction {
  /** Button copy, e.g. "Tailor my CV". */
  cta: { en: string; sw: string };
  /** Where it goes — a HomeStack route name + optional params. */
  target: { screen: string; params?: Record<string, unknown> };
}

export function signalAction(s: MobileSignal): SignalAction {
  switch (s.type) {
    case "cv.tailor":
      return {
        cta: { en: "See the job", sw: "Ona kazi" },
        target: { screen: "Jobs" },
      };
    case "coverLetter.generate":
      return {
        cta: { en: "Draft it with Sumaiya", sw: "Iandike na Sumaiya" },
        target: {
          screen: "SumaiyaTab",
          params: { seed: "Help me write a cover letter for the job I'm applying to." },
        },
      };
    case "confirmations":
      return {
        cta: { en: "Review", sw: "Kagua" },
        target: { screen: "ProfileTab", params: { screen: "CareerProfile" } },
      };
    case "ats.check":
      return {
        cta: { en: "Check my CV", sw: "Kagua CV yangu" },
        target: { screen: "AtsChecker" },
      };
    case "career.skillGap": {
      const skill = s.missingSkills?.[0];
      return {
        cta: skill
          ? { en: `Learn ${skillLabel(skill, "en")}`, sw: `Jifunze ${skillLabel(skill, "sw")}` }
          : { en: "See what to learn", sw: "Ona cha kujifunza" },
        target: { screen: "LearningHub" },
      };
    }
    case "application.followUp":
      return {
        cta: { en: "Open applications", sw: "Fungua maombi" },
        target: { screen: "Applications" },
      };
    case "job.newMatch":
      return {
        cta: { en: "See the job", sw: "Ona kazi" },
        target: { screen: "Jobs" },
      };
    default:
      return {
        cta: { en: "Open", sw: "Fungua" },
        target: { screen: "HomeMain" },
      };
  }
}

export const signalText = (s: MobileSignal, lang: Lang) => ({
  title: s.title[lang] ?? s.title.en,
  detail: s.detail[lang] ?? s.detail.en,
});
