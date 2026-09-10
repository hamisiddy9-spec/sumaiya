/**
 * Turns a proactive signal from /api/mobile/signals into something the home
 * screen can render and act on. The signal engine is deterministic and shared
 * with the web (lib/assistant/signals.ts) — this just picks the native
 * destination for each type.
 */
import type { MobileSignal } from "@sumaiya/api-client";
import type { Lang } from "./i18n";

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
    case "career.skillGap":
      return {
        cta: { en: "See what to learn", sw: "Ona cha kujifunza" },
        target: { screen: "LearningHub" },
      };
    case "application.followUp":
      return {
        cta: { en: "Open applications", sw: "Fungua maombi" },
        target: { screen: "Applications" },
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
