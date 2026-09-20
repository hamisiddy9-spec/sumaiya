import type { Lang } from "./i18n";

/**
 * The Home greeting, and the rule that keeps it honest.
 *
 * The greeting used to be chosen purely from the clock, so a brand-new install
 * opened after 21:00 was told "Karibu tena" / "Welcome back" — on odd dates as
 * the very first words the app ever said to that person, before they had
 * created anything at all.
 *
 * The greeting now takes whether we actually know the user has been here
 * before. Phrases that claim a prior visit are only ever eligible when we do.
 *
 * Pure and React-free so the rule is unit-testable on its own.
 */

// A few natural variants per time-of-day bucket instead of one fixed phrase
// repeated on every single visit — the same phrase every evening, forever,
// reads robotic rather than like a warm greeting. The pick is stable for the
// whole day (keyed on the date, not random per render) so it never flickers
// between variants on a re-render or a pull-to-refresh within the same day.
export const GREETINGS: Record<Lang, string[][]> = {
  sw: [
    ["Habari za asubuhi", "Habari za leo asubuhi"], // < 12:00
    ["Habari za mchana", "Habari za leo"], // < 16:00
    ["Habari za jioni", "Karibu jioni hii"], // < 21:00
    ["Habari za usiku", "Karibu usiku huu", "Karibu tena"], // >= 21:00
  ],
  en: [
    ["Good morning", "Morning"],
    ["Good afternoon", "Afternoon"],
    ["Good evening", "Evening"],
    ["Good evening", "Evening", "Welcome back"],
  ],
};

/** Phrases that claim the user has been here before. Never said on a first run. */
export const RETURNING_ONLY = ["Karibu tena", "Welcome back"];

/** Time-of-day bucket index for a given hour (0 morning … 3 late night). */
export function greetingBucket(hour: number): 0 | 1 | 2 | 3 {
  if (hour < 12) return 0;
  if (hour < 16) return 1;
  if (hour < 21) return 2;
  return 3;
}

/**
 * The greeting to render.
 *
 * @param isReturning pass `true` ONLY when the app positively knows the user
 *        has been here before (a non-empty career profile, or CVs on the
 *        account). When in doubt pass `false`: saying "Karibu" a beat early is
 *        harmless, telling a first-timer "welcome back" is not.
 */
export function greeting(lang: Lang, isReturning = false, now = new Date()): string {
  const bucket = greetingBucket(now.getHours());
  const variants = GREETINGS[lang][bucket].filter(
    (v) => isReturning || !RETURNING_ONLY.includes(v),
  );
  const pick = now.getDate() % variants.length;
  return variants[pick];
}
