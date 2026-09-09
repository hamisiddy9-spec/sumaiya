/**
 * Composer auto-grow sizing (P2) — the single source of truth for how tall the
 * Sumaiya chat textarea grows before it stops growing and scrolls internally.
 *
 * Pure + deterministic so the exact clamp behaviour is unit-tested: a long
 * message must never hide text or overflow the composer bar, and the box must
 * switch to internal scrolling exactly when it hits the cap.
 */
export const COMPOSER_MAX_HEIGHT_PX = 140;

export interface ComposerSizing {
  /** Height in px to set on the textarea. */
  height: number;
  /** True when content exceeds the cap — the box must scroll internally. */
  scrolls: boolean;
}

/**
 * Given the textarea's full content height (scrollHeight), decide the rendered
 * height and whether the box needs internal scrolling:
 *  - content ≤ cap  → box grows to fit exactly (never scrolls)
 *  - content > cap  → box stops at the cap and scrolls internally
 * Non-finite / negative measurements are coerced to 0 so a bad read can never
 * collapse the composer below a single line.
 */
export function computeComposerHeight(
  scrollHeight: number,
  maxHeight: number = COMPOSER_MAX_HEIGHT_PX,
): ComposerSizing {
  const safe = Number.isFinite(scrollHeight) ? Math.max(0, Math.floor(scrollHeight)) : 0;
  if (safe > maxHeight) return { height: maxHeight, scrolls: true };
  return { height: Math.max(safe, 1), scrolls: false };
}
