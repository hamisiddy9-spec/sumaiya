import type { Lang } from "./i18n";

/**
 * "Leo" / "Jana" / "Siku N zilizopita" — by CALENDAR day, not a raw 24h
 * millisecond diff. A raw diff misclassifies anything near a midnight
 * boundary: something updated yesterday at 23:00, viewed today at 01:00
 * (2 hours later, well under 24h), used to read "Leo" (Today) — wrong, it
 * was yesterday. Comparing local calendar dates fixes every such case,
 * including the reverse (something 20h old but from yesterday evening
 * previously read "Leo" instead of "Jana").
 */
/**
 * `now` is injectable so a caller with a pinned clock (closingLabel, tests) cannot
 * silently fall back to the wall clock and make the result date-dependent.
 */
export function relativeDate(d: string | Date, lang: Lang, now: Date = new Date()): string {
  const date = new Date(d);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (lang === "sw") {
    if (dayDiff <= 0) return "Leo";
    if (dayDiff === 1) return "Jana";
    if (dayDiff < 7) return `Siku ${dayDiff} zilizopita`;
    return date.toLocaleDateString("sw-TZ", { month: "short", day: "numeric" });
  }
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
