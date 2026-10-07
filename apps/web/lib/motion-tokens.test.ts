/**
 * The web half of the motion standard (docs/MOTION-STANDARD-2026-09-20.md).
 *
 * These pin the rules that are invisible in review and easy to break by
 * "just changing a number": an unbounded stagger, an exit as long as its entry,
 * a Reduce-Motion path that collapses to nothing instead of to near-nothing.
 *
 * The native app asserts the same contract in
 * apps/native/src/components/ui/motion.test.ts against the same numbers.
 */
import { describe, it, expect } from "vitest";
import {
  MOTION,
  MAX_STAGGER_MS,
  riseClass,
  staggerStep,
  staggerDelayMs,
  enterDurationMs,
  exitDurationMs,
  swapClasses,
} from "@/lib/motion";

describe("MOTION tokens (web)", () => {
  it("keeps the instant duration non-zero so callbacks still fire", () => {
    expect(MOTION.dur.instant).toBeGreaterThan(0);
    expect(MOTION.dur.instant).toBeLessThanOrEqual(16);
  });

  it("makes leaving faster than arriving", () => {
    expect(MOTION.dur.fast).toBeLessThan(MOTION.dur.slow);
    expect(MOTION.dur.micro).toBeLessThan(MOTION.dur.base);
  });

  it("matches the native app's numbers exactly (one vocabulary, two renderers)", () => {
    // If these drift, web and native stop feeling like the same product.
    expect(MOTION.dur).toEqual({
      instant: 1,
      micro: 90,
      fast: 140,
      base: 220,
      slow: 300,
      screen: 260,
      field: 340,
    });
    expect(MOTION.stagger).toEqual({ base: 30, step: 40, cap: 6 });
    expect(MOTION.rise).toBe(12);
    expect(MAX_STAGGER_MS).toBe(270);
  });

  it("expresses every easing as a CSS timing function", () => {
    for (const [name, value] of Object.entries(MOTION.ease)) {
      expect(value, name).toMatch(/^cubic-bezier\(/);
    }
  });
});

describe("staggerStep", () => {
  it("gives the first slot no extra step", () => {
    expect(staggerStep(0)).toBe(0);
    expect(staggerStep(-1)).toBe(0);
    expect(staggerStep(NaN)).toBe(0);
  });

  it("counts up then clamps at the cap", () => {
    expect(staggerStep(1)).toBe(1);
    expect(staggerStep(6)).toBe(6);
    expect(staggerStep(7)).toBe(6);
    expect(staggerStep(500)).toBe(6);
  });
});

describe("riseClass", () => {
  it("uses the capped step classes rather than inventing rise-7 plus", () => {
    expect(riseClass(0)).toBe("rise");
    expect(riseClass(1)).toBe("rise rise-1");
    expect(riseClass(6)).toBe("rise rise-6");
    expect(riseClass(40)).toBe("rise rise-6");
    expect(riseClass(-3)).toBe("rise");
  });
});

describe("staggerDelayMs", () => {
  it("is base + step*index, capped, and never above MAX_STAGGER_MS", () => {
    expect(staggerDelayMs(0)).toBe(30);
    expect(staggerDelayMs(1)).toBe(70);
    expect(staggerDelayMs(6)).toBe(270);
    expect(staggerDelayMs(99)).toBe(MAX_STAGGER_MS);
  });

  it("collapses to zero under Reduce Motion", () => {
    expect(staggerDelayMs(5, { reduceMotion: true })).toBe(0);
  });
});

describe("enter / exit durations", () => {
  it("passes through in the default case and collapses to instant under Reduce Motion", () => {
    expect(enterDurationMs(false, 300)).toBe(300);
    expect(exitDurationMs(false, 140)).toBe(140);
    expect(enterDurationMs(true, 300)).toBe(MOTION.dur.instant);
    expect(exitDurationMs(true, 140)).toBe(MOTION.dur.instant);
    // Near-instant, never zero — a 0ms duration can skip transitionend and hang
    // anything waiting on it.
    expect(enterDurationMs(true)).toBeGreaterThan(0);
  });
});

describe("swapClasses", () => {
  it("names the loading → content hand-off classes that app/globals.css defines", () => {
    expect(swapClasses.in).toBe("swap-in");
    expect(swapClasses.out).toBe("swap-out");
  });
});
