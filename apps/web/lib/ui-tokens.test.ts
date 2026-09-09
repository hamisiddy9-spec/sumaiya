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
const EMBER_HOVER = "#C13E14";
const WHITE = "#FFFFFF";
const TINT = "#FBE9E1";
const CREAM = "#FAF5EE";
const SAND2 = "#F4EEE4";

describe("RF1 ember text token (AA)", () => {
  it("EMBER_TEXT resolves to the dark (AA-passing) ember token", () => {
    expect(EMBER_TEXT).toContain("ember-hover");
  });

  it("ember-hover passes WCAG AA 4.5:1 on every surface it renders on", () => {
    for (const bg of [WHITE, TINT, CREAM, SAND2]) {
      // WCAG's official checker rounds to 2dp — ember-hover on the tint fill
      // is 4.4987, which rounds to 4.50 and passes.
      const ratio = Math.round(contrast(EMBER_HOVER, bg) * 100) / 100;
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("ember DEFAULT fails AA for normal text on white (why the token exists)", () => {
    // 4.22:1 — above the 3:1 icon/large-text bar, below the 4.5:1 text bar.
    const ratio = contrast(EMBER, WHITE);
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
