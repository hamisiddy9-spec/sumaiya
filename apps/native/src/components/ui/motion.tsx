import React, { useEffect } from "react";
import { Easing, useReducedMotion } from "react-native-reanimated";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import {
  MOTION,
  MAX_STAGGER_MS,
  enterDurationMs,
  exitDurationMs,
  staggerDelayMs,
  staggerStep,
} from "./motion-tokens";

/**
 * The app's motion system — the single source of every duration, easing curve,
 * spring and stagger interval. See docs/MOTION-STANDARD-2026-09-20.md for the
 * principles; this file is the enforceable form of them.
 *
 * The numbers and the pure helpers live in `./motion-tokens` (no React, no
 * Reanimated) so they can be asserted in a plain unit test. This file adds the
 * curves and the components, and re-exports everything, so screens import their
 * motion primitives from one place (`@/components/ui`) rather than reaching into
 * Reanimated directly.
 */

export { MOTION, MAX_STAGGER_MS, staggerDelayMs, staggerStep, enterDurationMs, exitDurationMs };

/** The curves. */
export const EASE = {
  /** Decelerate into place — the default for anything entering. */
  out: Easing.out(Easing.cubic),
  /** Accelerate away — anything leaving, so it clears the frame quickly. */
  in: Easing.in(Easing.cubic),
  /** Symmetric, for a value that changes in place. */
  inOut: Easing.inOut(Easing.cubic),
  /** Apple's "emphasized decelerate": a longer settle on the last 10%. */
  emphasized: Easing.bezier(0.16, 1, 0.3, 1),
} as const;

/**
 * Whether the OS asks for reduced motion.
 *
 * Re-exported so callers do not reach into Reanimated for it. The codebase
 * already used this hook in `SumaiyaMark`, so the behaviour is proven on device
 * rather than assumed.
 */
export const useMotionReduced = useReducedMotion;

/**
 * Staggered entrance for a list of children — each item fades/rises a beat after
 * the last. Wrap mapped rows: children.map((row, i) => <Stagger index={i}>…)
 *
 * Drives the rise with a shared value (via `Reveal`), not an `entering` layout
 * animation. A layout-animation intercept on a wrapper has already broken
 * interaction — and crashed Fabric mounting (`addViewAt … index N, count N-1`) —
 * once in this app (see `Reveal` and `empty-state.tsx`). Shared values have no
 * mounting-layer involvement, so rows added to or removed from a list (e.g. the
 * home screen's recent CVs) cannot skew Fabric's child indices.
 */
export function Stagger({
  index,
  children,
  distance = MOTION.rise,
  step = MOTION.stagger.step,
  base = MOTION.stagger.base,
}: {
  index: number;
  children: React.ReactNode;
  distance?: number;
  step?: number;
  base?: number;
}) {
  const reduce = useMotionReduced();
  const delay = staggerDelayMs(index, { reduceMotion: reduce, step, base });
  return (
    <Reveal delayMs={delay} distance={distance}>
      {children}
    </Reveal>
  );
}

/**
 * Reveal on mount, driven by a shared value rather than an `entering` layout
 * animation.
 *
 * Why not `entering` here: a layout-animation intercept on a wrapper has already
 * broken interaction once in this app — `empty-state.tsx` documents that an
 * `entering` wrapper left the action Button non-interactive on Fabric, so the
 * empty state was shipped with no entrance at all. A `useAnimatedStyle` driven
 * by a shared value has no mounting-layer involvement, so the children stay
 * interactive, and it is the same mechanism every dialog/sheet in the app
 * already relies on.
 *
 * `delayMs` is for a short orchestration (e.g. heading, then body, then action);
 * keep at most three beats. Under Reduce Motion the reveal is `dur.instant`
 * (1ms), not removed.
 */
export function Reveal({
  children,
  delayMs = 0,
  distance = MOTION.rise,
  style,
}: {
  children: React.ReactNode;
  delayMs?: number;
  distance?: number;
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const reduce = useMotionReduced();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: MOTION.dur.slow, easing: EASE.out }),
    );
    // `reduce` in the deps is deliberate: flipping the OS setting while a screen
    // is open settles the reveal immediately instead of freezing it mid-way.
  }, [reduce, delayMs, progress]);

  const anim = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
