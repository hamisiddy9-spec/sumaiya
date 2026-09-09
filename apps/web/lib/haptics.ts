"use client";

/**
 * Tiny wrapper over the Vibration API for tactile feedback on the web app —
 * mirrors the native app's `haptics` vocabulary so the two feel consistent.
 *
 * Support: Android Chrome / most Android browsers and installed PWAs. iOS Safari
 * has no Vibration API — every call is a silent no-op there (and on desktop),
 * which is the intended graceful degradation. Fire-and-forget; never throws.
 *
 * Keep patterns short and rare — reserve them for genuine moments (a download
 * completed, an action was blocked), not every tap.
 */

function buzz(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers throw if called without a user gesture — ignore */
  }
}

export const haptics = {
  /** A light tap — a control acknowledged the touch. */
  light: () => buzz(10),
  /** A more deliberate confirmation. */
  medium: () => buzz(18),
  /** Something completed successfully (e.g. the CV finished exporting). */
  success: () => buzz([12, 40, 22]),
  /** An action was blocked or rejected (e.g. the sign-up wall). */
  warning: () => buzz([30, 40, 30]),
  /** Cancel any ongoing vibration. */
  stop: () => buzz(0),
};
