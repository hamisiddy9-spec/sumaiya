import type { Lang } from "./i18n";
import { relativeDate } from "./relative-date";

/**
 * When the advert closes, in the words a jobseeker uses.
 *
 * The Jobs feed already filtered expired listings using
 * `applicationDeadline` — the deadline was load-bearing and invisible. A card
 * that shows a fit score, two buttons and no closing date makes the user open
 * the advert (or apply late) to find the one fact that decides whether to
 * bother today. This is the mirror of `relativeDate`, which only knows how to
 * look backwards; a deadline is always in front of you, so "Siku 3 zijazo"
 * (the coming three days) rather than "Kesho" for everything inside a week.
 *
 * Returns null when there is no deadline (unknown is not the same as closed —
 * see lib/job-listing.ts) and when the value is not a date at all, rather than
 * printing "Invalid Date" on a job card.
 */
export function closingLabel(
  deadline: string | null | undefined,
  lang: Lang,
  now: Date = new Date(),
): string | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  // A date already gone is described the way the rest of the app describes
  // past dates ("Jana", "Siku 2 zilizopita") — the caller decides to mark it
  // closed; this only says when.
  if (dayDiff <= 0) return relativeDate(date, lang);

  if (lang === "sw") {
    if (dayDiff === 1) return "Kesho";
    if (dayDiff < 7) return `Siku ${dayDiff} zijazo`;
    return date.toLocaleDateString("sw-TZ", { day: "numeric", month: "short", year: "numeric" });
  }
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff < 7) return `In ${dayDiff} days`;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
