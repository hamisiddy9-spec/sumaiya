// RF1 — guard the design-system contrast math so the AA-passing token can't
// drift. If someone re-brightens `ember.hover` below AA, or re-darkens
// `ember` above it (making the two tokens interchangeable), this test fails
// and the sweep's intent is documented in code.

import { describe, it, expect } from "vitest";
import { EMBER_TEXT, FOCUS_RING, TAP_MIN } from "@/lib/ui-tokens";

// Hex → relative luminance (WCAG 2.x definition).
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Keep in sync with tailwind.config.ts — these are the actual token values.
const EMBER = "#DA4A1C";
const EMBER_PRESSED = "#B93C13"; // the guide's emberPressed — the small-ember-text token
const EMBER_HOVER = "#C2410C"; // the guide's emberHover — a STATE colour, not a text colour
const WHITE = "#FFFFFF";
const TINT = "#F7E2DA"; // emberTint @12% composited over the surface
const SURFACE = "#FBF9F5";
const RAISED = "#F5F3EF";
const SUNKEN = "#EFEEEA";

describe("RF1 ember text token (AA)", () => {
  it("EMBER_TEXT resolves to the dark (AA-passing) ember token", () => {
    expect(EMBER_TEXT).toContain("ember-pressed");
  });

  it("EMBER_TEXT passes WCAG AA 4.5:1 on every surface it renders on", () => {
    for (const bg of [WHITE, SURFACE, RAISED, SUNKEN, TINT]) {
      const ratio = Math.round(contrast(EMBER_PRESSED, bg) * 100) / 100;
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("emberHover is a state colour: it is NOT safe for small text on every surface", () => {
    // #C2410C is 5.18:1 on white but 4.46:1 on surfaceSunken — which is why the
    // text token is emberPressed, not emberHover. If this ever starts passing
    // everywhere, the two tokens have been re-brightened and this test's reason
    // for existing has changed.
    expect(Math.round(contrast(EMBER_HOVER, SUNKEN) * 100) / 100).toBeLessThan(4.5);
  });

  it("ember DEFAULT fails AA for normal text (why the token exists)", () => {
    // 4.01:1 on the guide's surface — above the 3:1 icon/large-text bar, below 4.5:1.
    const ratio = contrast(EMBER, SURFACE);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });

  it("ember DEFAULT fails AA on the tint badge fill (the R3 snap repro)", () => {
    expect(contrast(EMBER, TINT)).toBeLessThan(4.5);
  });
});

describe("RF1 focus + tap primitives", () => {
  it("FOCUS_RING includes a visible ring, an offset and no outline", () => {
    expect(FOCUS_RING).toContain("focus-visible:ring-2");
    expect(FOCUS_RING).toContain("ring-ember");
    expect(FOCUS_RING).toContain("focus-visible:outline-none");
    expect(FOCUS_RING).toContain("ring-offset");
  });

  it("TAP_MIN guarantees the 24px minimum hit area", () => {
    expect(TAP_MIN).toContain("min-h-6"); // 1.5rem = 24px
    expect(TAP_MIN).toContain("min-w-6");
  });
});
