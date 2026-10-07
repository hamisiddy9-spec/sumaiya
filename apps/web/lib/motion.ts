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
 * Stagger class for a reveal index (0-based).
 *
 * Delays come from the shared tokens below, and the delay is CAPPED at
 * `MOTION.stagger.cap` items (30 + 6*40 = 270ms). The old version mapped
 * index >= 4 onto "rise-4" with a 200ms delay and no cap in the language, so a
 * long grid kept asking for longer waits than the system allowed. Past the cap
 * every item shares the last step, so a 40-card grid is fully delivered inside
 * one beat instead of trickling in long after the page is usable.
 *
 * Returns "" for anything out of range so callers can spread it safely.
 */
export function riseClass(index: number): string {
  const step = staggerStep(index);
  return step === 0 ? "rise" : `rise rise-${step}`;
}

/** 0 for the first slot, then 1..cap, clamped. Pure — unit-tested. */
export function staggerStep(index: number, cap: number = MOTION.stagger.cap): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(Math.floor(index), cap);
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

/**
 * The web half of the app's motion system. These are the SAME numbers as
 * `apps/native/src/components/ui/motion.tsx` — one vocabulary, two renderers.
 * Read `docs/MOTION-STANDARD-2026-09-20.md` before changing any of them; if a
 * number has to move, it moves in both files and in that document together.
 *
 * The web's reduced-motion story is different from native's and already exists:
 * `app/globals.css` carries an app-wide
 * `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-
 * duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` net.
 * That is exactly the required behaviour — collapse to near-instant, do not
 * remove — so nothing here needs a JavaScript branch on the media query.
 */
export const MOTION = {
  dur: {
    /** Reduce-Motion substitute on native. On web the CSS net does this job. */
    instant: 1,
    micro: 90,
    /** An element leaving. Always shorter than the matching entry. */
    fast: 140,
    base: 220,
    slow: 300,
    /** A route/screen transition. */
    screen: 260,
    /** A full-screen surface dissolving in. */
    field: 340,
  },
  /** CSS timing functions — the curves, spelled for CSS. */
  ease: {
    out: "cubic-bezier(0.33, 1, 0.68, 1)",
    in: "cubic-bezier(0.32, 0, 0.67, 0)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    /** Apple's "emphasized decelerate" — the longer settle on the last 10%. */
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  stagger: {
    base: 30,
    step: 40,
    cap: 6,
  },
  rise: 12,
} as const;

/** The longest any staggered item waits: 30 + 6*40 = 270ms. */
export const MAX_STAGGER_MS = MOTION.stagger.base + MOTION.stagger.cap * MOTION.stagger.step;

/**
 * Entry delay in ms for the nth item of a staggered group — the number behind
 * the CSS classes, so a component can drive an inline `animationDelay` for a
 * group the class list cannot express. Capped, and zero under reduced motion.
 */
export function staggerDelayMs(
  index: number,
  opts?: { reduceMotion?: boolean; step?: number; base?: number; cap?: number },
): number {
  const step = opts?.step ?? MOTION.stagger.step;
  const base = opts?.base ?? MOTION.stagger.base;
  const cap = opts?.cap ?? MOTION.stagger.cap;
  if (opts?.reduceMotion) return 0;
  return base + staggerStep(index, cap) * step;
}

/** Duration for something entering: `duration`, or `dur.instant` under Reduce Motion. */
export function enterDurationMs(reduceMotion: boolean, duration: number = MOTION.dur.slow): number {
  return reduceMotion ? MOTION.dur.instant : duration;
}

/** Duration for something leaving. Near-instant under Reduce Motion. */
export function exitDurationMs(reduceMotion: boolean, duration: number = MOTION.dur.fast): number {
  return reduceMotion ? MOTION.dur.instant : duration;
}

/**
 * The loading → content hand-off.
 *
 * `swapOut` fades the placeholder where it stands while `swapIn` rises the real
 * content into the space — the surface is never empty, so the swap is not a
 * "boom". Apply both in the same commit: React will unmount the placeholder in
 * the branch change, so the outgoing class is for surfaces that hold the node
 * (an overlaying placeholder) rather than for a branch swap.
 */
export const swapClasses = {
  in: "swap-in",
  out: "swap-out",
} as const;
