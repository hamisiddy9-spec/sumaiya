import { describe, expect, it } from "vitest";
import { COMPOSER_MAX_HEIGHT_PX, computeComposerHeight } from "./composer-height";

describe("computeComposerHeight", () => {
  it("grows to fit content below the cap without scrolling", () => {
    expect(computeComposerHeight(48)).toEqual({ height: 48, scrolls: false });
    expect(computeComposerHeight(96)).toEqual({ height: 96, scrolls: false });
  });

  it("stops exactly at the cap when content hits it (no internal scroll yet)", () => {
    expect(computeComposerHeight(COMPOSER_MAX_HEIGHT_PX)).toEqual({
      height: COMPOSER_MAX_HEIGHT_PX,
      scrolls: false,
    });
  });

  it("clamps at the cap and scrolls internally once content exceeds it", () => {
    const sizing = computeComposerHeight(COMPOSER_MAX_HEIGHT_PX + 1);
    expect(sizing).toEqual({ height: COMPOSER_MAX_HEIGHT_PX, scrolls: true });
  });

  it("clamps a very long message (a whole pasted job description) at the cap", () => {
    const sizing = computeComposerHeight(4096);
    expect(sizing.height).toBe(COMPOSER_MAX_HEIGHT_PX);
    expect(sizing.scrolls).toBe(true);
  });

  it("never collapses below a single line for degenerate measurements", () => {
    expect(computeComposerHeight(0)).toEqual({ height: 1, scrolls: false });
    expect(computeComposerHeight(-5)).toEqual({ height: 1, scrolls: false });
  });

  it("coerces non-finite measurements to a safe single line instead of collapsing", () => {
    expect(computeComposerHeight(Number.NaN)).toEqual({ height: 1, scrolls: false });
    expect(computeComposerHeight(Number.POSITIVE_INFINITY)).toEqual({ height: 1, scrolls: false });
  });

  it("honours a custom maxHeight", () => {
    expect(computeComposerHeight(200, 100)).toEqual({ height: 100, scrolls: true });
    expect(computeComposerHeight(80, 100)).toEqual({ height: 80, scrolls: false });
  });

  it("floors fractional scrollHeights (browsers report integers, but be safe)", () => {
    expect(computeComposerHeight(47.9)).toEqual({ height: 47, scrolls: false });
    expect(computeComposerHeight(141.2, 140)).toEqual({ height: 140, scrolls: true });
  });
});
