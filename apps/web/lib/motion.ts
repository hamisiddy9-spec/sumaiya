// RF5 — shared motion utilities. Extracted from the D9 /snap motion pass
// (snap-rise stagger + score count-up) so every surface uses the SAME easing,
// timing and reveal language instead of ad-hoc animations.
//
// Pure + deterministic → unit-tested without a browser. The CSS side
// (`.rise` / `.rise-1..4`) lives in app/globals.css with the app-wide
// `prefers-reduced-motion` safety net that collapses these to instant.

/** Ease-out cubic progress (0 → 1), clamped to [0, 1]. Decelerates into place. */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/** Ease-out quart — faster initial pop than cubic, for small chips/counts. */
export function easeOutQuart(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 4);
}

/**
 * Value to display at `elapsedMs` into a count-up: eases toward the target and
 * returns exactly the target once finished, 0 before it starts. Degenerate
 * (non-finite / zero-duration) inputs fall back to 0 or target. Generic
 * version of the /snap score count-up so any numeric stat can use it.
 */
export function countUpValueAt(
  elapsedMs: number,
  durationMs: number,
  target: number,
  ease: (t: number) => number = easeOutCubic,
): number {
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(durationMs) || !Number.isFinite(target)) {
    return 0;
  }
  if (durationMs <= 0 || elapsedMs <= 0) return 0;
  if (elapsedMs >= durationMs) return Math.round(target);
  return Math.round(target * ease(elapsedMs / durationMs));
}

/**
 * Stagger class for a reveal index (0-based): first card gets no delay, each
 * subsequent card +50ms, capped at the 4th step — the /snap D9 language.
 * Returns "" for anything out of range so callers can spread it safely.
 */
export function riseClass(index: number): string {
  if (index <= 0) return "rise";
  if (index <= 3) return `rise rise-${index + 1}`;
  return "rise rise-4";
}

export const animationClasses = {
  fadeIn: "animate-fade-in",
  fadeInUp: "animate-fade-in-up",
  float: "animate-float",
  pulse: "animate-pulse-scale",
  shimmer: "animate-shimmer",
  skeletonShimmer: "animate-skeleton-shimmer",
} as const;

export const transitionClasses = {
  fast: "transition duration-150 ease-out",
  normal: "transition duration-200 ease-out",
  slow: "transition duration-300 ease-out",
} as const;

export const staggerDelay = (index: number, interval = 50): string => {
  return `delay-[${index * interval}ms]`;
};
