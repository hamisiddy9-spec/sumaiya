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
    ["Habari za asubuhi", "Habari za leo asubuhi"], // 05:00–11:59
    ["Habari za mchana", "Habari za leo"], // 12:00–15:59
    ["Habari za jioni", "Karibu jioni hii"], // 16:00–20:59
    ["Habari za usiku", "Karibu usiku huu", "Karibu tena"], // 21:00–04:59 — night
  ],
  en: [
    ["Good morning", "Morning"],
    ["Good afternoon", "Afternoon"],
    ["Good evening", "Evening"],
    ["Good evening", "Hello", "Welcome back"], // 21:00–04:59 — English has no
    // natural post-midnight greeting; "Good night" is a farewell, so "Hello" is
    // the honest neutral for the small hours.
  ],
};

/** Phrases that claim the user has been here before. Never said on a first run. */
export const RETURNING_ONLY = ["Karibu tena", "Welcome back"];

/**
 * Time-of-day bucket for a given hour (0 morning … 3 night).
 *
 * NIGHT IS 21:00–04:59, not "21:00 and later": the old boundaries (`hour < 12`
 * is morning) put 00:00–05:59 in the MORNING bucket, so the Home screen greeted
 * the user "Habari za leo asubuhi," (good morning) at 00:26 — observed on the
 * device. Midnight is the middle of the night in Dar es Salaam, not the start
 * of the day.
 */
export function greetingBucket(hour: number): 0 | 1 | 2 | 3 {
  if (hour >= 5 && hour < 12) return 0;
  if (hour >= 12 && hour < 16) return 1;
  if (hour >= 16 && hour < 21) return 2;
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
