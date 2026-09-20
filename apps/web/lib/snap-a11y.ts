// Snap-to-Apply (R3) — keyboard + live-region helpers for the /snap surface.
// Pure and deterministic so they're unit-testable without a browser. The
// client wires these into the ARIA tabs pattern, the results live region and
// the saved-CV title (which must never be hardcoded English).

/**
 * WAI-ARIA tabs pattern: ArrowLeft/ArrowRight wrap around, Home/End jump to
 * the first/last tab, anything else is ignored (Enter/Space activate via the
 * button's native click). Returns the next tab index.
 */
export function nextSnapTab(current: number, key: string, count: number): number {
  if (key === "Home") return 0;
  if (key === "End") return Math.max(0, count - 1);
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  return current;
}

/**
 * Polite live-region announcement when the snap results arrive — screen
 * readers hear this even if focus is elsewhere; the client also moves focus
 * to the results heading for keyboard users.
 */
export function snapResultsLiveMessage(sw: boolean, score: number): string {
  const pct = Number.isFinite(score) ? Math.round(score) : 0;
  return sw
    ? `Matokeo yako yako tayari — ulinganifu na kazi ${pct}%.`
    : `Results ready — ATS match ${pct}%.`;
}

/**
 * Saved-CV title in the user's language (the old code hardcoded "Tailored CV"
 * for Swahili speakers — a bilingual-parity defect).
 */
export function tailoredCvTitle(sw: boolean, jobTitle: string): string {
  const prefix = sw ? "CV lengwa" : "Tailored CV";
  const t = (jobTitle ?? "").trim();
  return t ? `${prefix} — ${t}` : prefix;
}

/**
 * Ease-out cubic progress (0 → 1), clamped to [0, 1]. Drives the D9 score
 * count-up so the number decelerates into place instead of landing abruptly.
 * RF5: shared implementation now lives in lib/motion (re-exported below).
 */

/**
 * Score value to display at `elapsedMs` into the result count-up: eases
 * toward the target and returns exactly the target once finished, 0 before it
 * starts. Pure + deterministic so the animation logic is unit-testable.
 * Degenerate (non-finite / zero-duration) inputs fall back to 0 or target.
 *
 * RF5: kept as a thin re-export of the shared motion utility so /snap keeps
 * its public API while every surface shares one implementation.
 */
export { easeOutCubic, countUpValueAt as snapScoreAt } from "@/lib/motion";
