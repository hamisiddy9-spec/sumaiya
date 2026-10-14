/**
 * Home's pure label logic — no React, no styles, so the rules are testable on
 * their own (see `home-labels.test.ts`).
 */
import type { CV } from "@sumaiya/types";
import { isEmptyCv } from "@sumaiya/utils/cv-shape";
import { analyzeCv, atsScore } from "../../lib/ats";
import type { Lang } from "../../lib/i18n";

// ── Relative "edited" time ────────────────────────────────────────────────────
/**
 * The design's recent-row meta line reads `CV · Imehaririwa saa 2 zilizopita`
 * (or `CV · 20 Sep` for anything older than a week) — hours-relative, not the
 * `Leo` / `Jana` day bucket `lib/relative-date.ts` produces for other screens.
 * That helper is shared and its day-bucket wording is right where it is used
 * (the CV list's `Ilibadilishwa Leo`), so Home gets its own small formatter
 * instead of changing a string three other screens depend on.
 *
 * Singular is handled explicitly: `saa 1 zilizopita` is wrong Swahili (the swahili-lint-ignore
 * relative verb must agree with a count of one) and `swahili-lint.test.ts`
 * fails the build on it.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function editedAgo(at: string | Date, lang: Lang, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(at).getTime());
  const minutes = Math.floor(diff / MINUTE);
  const hours = Math.floor(diff / HOUR);
  const days = Math.floor(diff / DAY);

  if (lang === "sw") {
    if (minutes < 1) return "sasa hivi";
    if (minutes < 60) return minutes === 1 ? "dakika moja iliyopita" : `dakika ${minutes} zilizopita`;
    if (hours < 24) return hours === 1 ? "saa moja iliyopita" : `saa ${hours} zilizopita`;
    if (days < 7) return days === 1 ? "siku moja iliyopita" : `siku ${days} zilizopita`;
  } else {
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  // Older than a week: the date, exactly as the design's second row shows it.
  const d = new Date(at);
  return lang === "sw"
    ? d.toLocaleDateString("sw-TZ", { month: "short", day: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** `CV · Imehaririwa saa 2 zilizopita` within the week, `CV · 20 Sep` after it. */
export function cvMetaLine(at: string | Date, lang: Lang, now: Date = new Date()): string {
  const withinWeek = Math.max(0, now.getTime() - new Date(at).getTime()) < 7 * DAY;
  if (!withinWeek) return `CV · ${editedAgo(at, lang, now)}`;
  return lang === "sw"
    ? `CV · Imehaririwa ${editedAgo(at, lang, now)}`
    : `CV · Edited ${editedAgo(at, lang, now)}`;
}

// ── Status chip ───────────────────────────────────────────────────────────────
/**
 * The three states the design's recent rows carry — `Tayari` / `Rasimu` /
 * `Imekamilika` — derived from the CV itself rather than from a flag nobody
 * stores:
 *
 *   draft     the CV has nothing in it yet (lib/ats.ts is honest but useless on
 *             an empty document, and `isEmptyCv` is the same test the CV-check
 *             screen already uses to say so)
 *   complete  every check the CV check runs passes — the score is a real 100
 *   ready     anything in between: usable, still improvable
 */
export type CvStatus = "draft" | "ready" | "complete";

export function cvStatusOf(cv: Pick<CV, "data">): CvStatus {
  if (isEmptyCv(cv.data)) return "draft";
  // Pass/fail is language-independent, so the label language is not involved.
  return atsScore(analyzeCv(cv.data, false)) >= 100 ? "complete" : "ready";
}

const STATUS_LABELS: Record<CvStatus, { en: string; sw: string }> = {
  draft: { en: "Draft", sw: "Rasimu" },
  ready: { en: "Ready", sw: "Tayari" },
  complete: { en: "Complete", sw: "Imekamilika" },
};

export function cvStatusLabel(status: CvStatus, lang: Lang): string {
  return STATUS_LABELS[status][lang];
}
