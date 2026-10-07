/**
 * The motion system's numbers, and the pure functions over them.
 *
 * Deliberately free of React and of `react-native-reanimated`: the tokens are
 * data, and data should be assertable in a plain unit test. The curves
 * (`Easing.*`) live in `./motion` alongside the components, because they are
 * functions from Reanimated — this file is the part that has to be provable
 * without a renderer.
 *
 * `apps/web/lib/motion.ts` mirrors these numbers exactly; the same contract is
 * pinned by `apps/web/lib/motion-tokens.test.ts`. If a number moves here it
 * moves there, and in docs/MOTION-STANDARD-2026-09-20.md.
 *
 * Three rules the tokens encode:
 *
 *  1. **Entering decelerates, leaving accelerates.** Anything arriving uses
 *     `ease.out`; anything being removed uses `ease.in` and a shorter duration
 *     than it arrived with (`dur.fast` < `dur.slow`). Nothing lingers on the way out.
 *  2. **A stagger is capped.** `stagger.base + cap * step` is the longest any
 *     item waits (270ms). Past `cap` every item enters together, so a 40-row
 *     list is fully delivered within one beat instead of trickling in for two
 *     seconds after the screen is already usable.
 *  3. **Reduce Motion collapses, it does not delete.** Every duration has a
 *     `reduceMotion` form of `dur.instant` (1ms) — non-zero on purpose, so
 *     completion callbacks still fire and nothing hangs, but far too fast to
 *     read as movement. Motion is never the only way to understand a change, so
 *     collapsing it loses no information.
 */

/** Durations in ms. `instant` is the Reduce-Motion form — never 0. */
export const MOTION = {
  dur: {
    /** Reduce-Motion substitute. Non-zero so `withTiming` finished callbacks still fire. */
    instant: 1,
    /** Tap acknowledgement, chevron turns, chip state. */
    micro: 90,
    /** An element leaving. Always shorter than the matching entry. */
    fast: 140,
    /** In-place state change: label↔spinner, a value updating. */
    base: 220,
    /** An element entering. */
    slow: 300,
    /** A push/pop between screens. */
    screen: 260,
    /** A full-screen colour field dissolving into a page. */
    field: 340,
  },
  spring: {
    /** Presentation/dismissal of a dialog or sheet. No visible overshoot. */
    gentle: { damping: 20, stiffness: 180, mass: 0.9 } as const,
    /** A container resizing because its content changed. */
    snappy: { damping: 22, stiffness: 260, mass: 0.8 } as const,
  },
  stagger: {
    /** Delay before the first item of a group moves. */
    base: 30,
    /** Added per item, up to `cap` items. */
    step: 40,
    /** Items past this index do not wait any longer. */
    cap: 6,
  },
  /** px a row travels upward on entry. Small on purpose — presence, not travel. */
  rise: 12,
} as const;

/** The longest any staggered item waits: 30 + 6*40 = 270ms. */
export const MAX_STAGGER_MS = MOTION.stagger.base + MOTION.stagger.cap * MOTION.stagger.step;

/**
 * 0 for the first slot, then 1..`cap`, clamped. The step index (not the delay)
 * is what a caller maps onto a class name or an inline delay; there are exactly
 * `cap + 1` of them.
 */
export function staggerStep(index: number, cap: number = MOTION.stagger.cap): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(Math.floor(index), cap);
}

/**
 * Entry delay for the nth item of a staggered group. Negative / non-finite
 * indices clamp to the first slot; everything past `cap` shares the last delay;
 * Reduce Motion is zero delay.
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

/** Duration for something leaving. Shorter than entry, near-instant under Reduce Motion. */
export function exitDurationMs(reduceMotion: boolean, duration: number = MOTION.dur.fast): number {
  return reduceMotion ? MOTION.dur.instant : duration;
}
