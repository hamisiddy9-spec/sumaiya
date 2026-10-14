/**
 * The Applications list's pure logic — no React, no styles — so the rules the
 * design states can be tested on their own in `applications-labels.test.ts`:
 *
 *   1. a row's POSITION and its `Ilipoguswa mwisho:` line come from when the
 *      application last MOVED, never from when it was created (design fragment
 *      B7, and the design's own schema comment: "keyed by last_moved_at for
 *      emotional relevance");
 *   2. an application that was sent and has sat unanswered gets the follow-up
 *      lane. This is the phone side of the rule the web tracker already ships
 *      (`apps/web/lib/applications.ts` — `FOLLOW_UP_DAYS`, `daysWaiting`,
 *      `needsFollowUp`); see docs/MAOMBI-RESEARCH-2026-09-23.md "BUILD ORDER 5
 *      — the offline follow-up".
 */
import type { AppStatus } from "../lib/applications-store";
import type { Lang } from "../lib/i18n";
import { relativeDate } from "../lib/relative-date";

const DAY = 86_400_000;

/**
 * How long a still-open application may sit before the list offers a follow-up.
 *
 * The fragment's sample row happens to read `Imetumwa siku 21 zilizopita`, but
 * that is sample data, not the threshold. 7 is the product's own number — the
 * web tracker ships `FOLLOW_UP_DAYS = 7` — so the phone and the web agree on
 * when an application has gone quiet.
 */
export const FOLLOW_UP_DAYS = 7;

/**
 * The app's `last_moved_at`.
 *
 * There is no separate column: `applications-store.ts` stamps `updatedAt` on
 * every write (create and each update), so it already IS "when this last
 * moved". `createdAt` is only the floor for a row written before this screen
 * existed, which keeps the ordering total instead of putting such a row at the
 * bottom of the list.
 */
export function lastMovedAt(a: { updatedAt?: number; createdAt?: number }): number {
  return Math.max(a.updatedAt ?? 0, a.createdAt ?? 0);
}

/**
 * Newest movement first — the design's ordering law.
 *
 * The store's own `listApplications()` orders by STATUS then `updatedAt` (an
 * interview floats above a job applied to this morning). That is the right
 * order for a status board and the wrong order for this list, so the screen
 * re-sorts here rather than the store being changed under every other caller.
 */
export function sortByLastMovement<T extends { updatedAt?: number; createdAt?: number }>(apps: T[]): T[] {
  return [...apps].sort((a, b) => lastMovedAt(b) - lastMovedAt(a));
}

/** Whole days since it was sent — its own sent date, else when it was created. */
export function daysWaiting(a: { appliedAt?: number; createdAt?: number }, now = Date.now()): number {
  return Math.max(0, Math.floor((now - (a.appliedAt ?? a.createdAt ?? 0)) / DAY));
}

/** Sent, and quiet for at least {@link FOLLOW_UP_DAYS}. */
export function needsFollowUp(
  a: { status: AppStatus; appliedAt?: number; createdAt?: number },
  now = Date.now(),
): boolean {
  return a.status === "applied" && daysWaiting(a, now) >= FOLLOW_UP_DAYS;
}

/** `siku 4 zilizopita` / `4 days ago` — singular handled, because `siku 1 zilizopita` (swahili-lint-ignore) is not Swahili. */
export function daysAgoLabel(days: number, lang: Lang): string {
  if (lang === "sw") return days <= 1 ? "siku moja iliyopita" : `siku ${days} zilizopita`;
  return days <= 1 ? "1 day ago" : `${days} days ago`;
}

/** The follow-up lane's own sentence: `Imetumwa siku 8 zilizopita` / `Sent 8 days ago`. */
export function sentAgoLabel(days: number, lang: Lang): string {
  return lang === "sw" ? `Imetumwa ${daysAgoLabel(days, lang)}` : `Sent ${daysAgoLabel(days, lang)}`;
}

/** Calendar-day difference, so a 23:00→01:00 pair is `Jana`/`Yesterday`, not `Leo`. */
function calendarDayDiff(at: number, now: Date): number {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOfDay(now) - startOfDay(new Date(at))) / DAY);
}

/** `Saa 10:15` / `10:15` — the wall clock, 24-hour, zero-padded. */
function clockLabel(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * The value beside `Ilipoguswa mwisho:`.
 *
 * The design's own example is `Jana (Saa 10:15 Jioni)` — how long ago, then the
 * clock, but only for today and yesterday; anything older is just `Siku 4
 * zilizopita` / `21 Sep` (`lib/relative-date.ts` already owns that wording and
 * its midnight-boundary rules, so the day bucket is read from there).
 *
 * The clock is rendered 24-hour (`Saa 22:15`) rather than with a Swahili
 * day-part word: the day-part clock (saa 10 jioni = 16:15) starts at sunrise,
 * so a 12-hour string plus a guessed day-part word is wrong more often than it
 * is right, and a wrong time is worse than no time.
 */
export function lastMovedLabel(movedAt: number, lang: Lang, now: Date = new Date()): string {
  const bucket = relativeDate(new Date(movedAt), lang, now);
  if (calendarDayDiff(movedAt, now) !== 1 && calendarDayDiff(movedAt, now) !== 0) return bucket;
  const clock = clockLabel(movedAt);
  return `${bucket} (${lang === "sw" ? `Saa ${clock}` : clock})`;
}

/**
 * `Maombi 4 yanafuatiliwa` under the title — how many are being tracked.
 *
 * The fragment prints `Nyaraka 4 zinazofuatiliwa`, "4 documents". In this app a
 * tracked thing is an APPLICATION, not a document (`nyaraka` is the word this
 * product uses for the CV library, "CV zako · Nyaraka na miundo"), so the label
 * names what is actually counted. Singular is a different noun class, not a
 * different number.
 */
export function applicationsTrackedLine(n: number, lang: Lang): string {
  if (lang === "sw") return n === 1 ? "Ombi 1 linafuatiliwa" : `Maombi ${n} yanafuatiliwa`;
  return n === 1 ? "1 application being tracked" : `${n} applications being tracked`;
}

/**
 * The chip's Kiswahili, and where each word comes from.
 *
 * `Imetumwa` (sent), `Mazungumzo` (interview) and `Imekubaliwa` (accepted) are
 * the fragment's own vocabulary, exact. `Imehifadhiwa` (saved) and `Imefungwa`
 * (closed) are not in the fragment at all: the app's store has two states the
 * design's six-stage pipeline does not (a job saved before it is sent, and one
 * the user has ended themselves), and calling a user-closed application
 * `Imekataliwa` ("rejected") would put a rejection in their history that never
 * happened.
 *
 * `Imeonekana` (seen) and `Mwito` (invited) have no counterpart in the store's
 * data at all, so they are NOT rendered — a chip that can never hold a row is a
 * promise the app cannot keep.
 */
export const APPLICATION_STATUS_LABEL: Record<AppStatus, { en: string; sw: string }> = {
  saved: { en: "Saved", sw: "Imehifadhiwa" },
  applied: { en: "Sent", sw: "Imetumwa" },
  interview: { en: "Interview", sw: "Mazungumzo" },
  offer: { en: "Accepted", sw: "Imekubaliwa" },
  closed: { en: "Closed", sw: "Imefungwa" },
};

/**
 * The chip row's order: most advanced first, which is the fragment's own
 * (`Mazungumzo`, `Mwito`, `Imetumwa`). Chips are only rendered for statuses the
 * data actually contains, so this order decides which end the live ones appear
 * at rather than which ones exist.
 */
export const PIPELINE_ORDER: AppStatus[] = ["offer", "interview", "applied", "saved", "closed"];
