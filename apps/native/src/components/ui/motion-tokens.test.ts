/**
 * The motion system's contract, as tests.
 *
 * These are the rules that are easy to break by "just tweaking a number" and
 * impossible to notice in a code review: an unbounded stagger, a disappearing
 * exit, an easing that overshoots. Pin them here instead of relying on someone
 * watching the animation.
 */
import {
  MOTION,
  MAX_STAGGER_MS,
  staggerDelayMs,
  staggerStep,
  enterDurationMs,
  exitDurationMs,
} from "./motion-tokens";

describe("MOTION tokens", () => {
  it("has a non-zero instant duration so completion callbacks still fire", () => {
    // Reduced Motion collapses, it does not delete: a 0ms timing can skip the
    // finished callback and leave a caller waiting forever.
    expect(MOTION.dur.instant).toBeGreaterThan(0);
    expect(MOTION.dur.instant).toBeLessThanOrEqual(16);
  });

  it("makes leaving faster than arriving", () => {
    expect(MOTION.dur.fast).toBeLessThan(MOTION.dur.slow);
    expect(MOTION.dur.micro).toBeLessThan(MOTION.dur.base);
  });

  it("keeps every functional duration inside one deliberate beat", () => {
    // Nothing in the in-place vocabulary may run longer than the longest
    // screen transition, or the UI reads as waiting on itself.
    // NOTE: Jest's expect() takes no message argument — `expect(value, name)` is
    // Vitest's signature and throws here ("Expect takes at most one argument")
    // before a single assertion runs. So the name goes into the failure itself.
    for (const [name, ms] of Object.entries(MOTION.dur)) {
      if (name === "instant") continue;
      if (ms > MOTION.dur.field) {
        throw new Error(
          `MOTION.dur.${name} = ${ms}ms exceeds dur.field = ${MOTION.dur.field}ms`,
        );
      }
    }
  });
});

describe("staggerDelayMs", () => {
  it("starts at the base delay and adds one step per item", () => {
    expect(staggerDelayMs(0)).toBe(MOTION.stagger.base);
    expect(staggerDelayMs(1)).toBe(MOTION.stagger.base + MOTION.stagger.step);
    expect(staggerDelayMs(2)).toBe(MOTION.stagger.base + 2 * MOTION.stagger.step);
  });

  it("caps the delay — a 40-row list does not trickle in for two seconds", () => {
    const cap = staggerDelayMs(MOTION.stagger.cap);
    expect(staggerDelayMs(MOTION.stagger.cap + 1)).toBe(cap);
    expect(staggerDelayMs(40)).toBe(cap);
    expect(staggerDelayMs(9999)).toBe(cap);
  });

  it("never exceeds MAX_STAGGER_MS", () => {
    for (const i of [0, 3, 7, 25, 500]) {
      expect(staggerDelayMs(i)).toBeLessThanOrEqual(MAX_STAGGER_MS);
    }
  });

  it("collapses to zero under Reduce Motion", () => {
    expect(staggerDelayMs(0, { reduceMotion: true })).toBe(0);
    expect(staggerDelayMs(9, { reduceMotion: true })).toBe(0);
  });

  it("clamps a hostile index instead of returning NaN into an animation", () => {
    expect(staggerDelayMs(-5)).toBe(MOTION.stagger.base);
    expect(staggerDelayMs(NaN)).toBe(MOTION.stagger.base);
    expect(staggerDelayMs(Infinity)).toBe(MOTION.stagger.base);
    expect(staggerDelayMs(2.7)).toBe(MOTION.stagger.base + 2 * MOTION.stagger.step);
  });

  it("honours a caller's own step/base/cap", () => {
    expect(staggerDelayMs(3, { step: 10, base: 5, cap: 2 })).toBe(25);
  });
});

describe("enter / exit durations", () => {
  it("returns the given duration in the default case", () => {
    expect(enterDurationMs(false, 300)).toBe(300);
    expect(exitDurationMs(false, 140)).toBe(140);
  });

  it("collapses to the instant token under Reduce Motion, never to zero", () => {
    expect(enterDurationMs(true, 300)).toBe(MOTION.dur.instant);
    expect(exitDurationMs(true, 140)).toBe(MOTION.dur.instant);
    expect(enterDurationMs(true)).toBeGreaterThan(0);
  });
});
