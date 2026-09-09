// Unit tests for the R3 /snap keyboard + live-region helpers — deterministic,
// no browser. These pin the WAI-ARIA tabs keyboard pattern, the results
// announcement and the bilingual saved-CV title.

import { describe, it, expect } from "vitest";
import { nextSnapTab, snapResultsLiveMessage, tailoredCvTitle, snapScoreAt, easeOutCubic } from "@/lib/snap-a11y";

describe("nextSnapTab (ARIA tabs keyboard pattern)", () => {
  it("wraps forward with ArrowRight", () => {
    expect(nextSnapTab(0, "ArrowRight", 2)).toBe(1);
    expect(nextSnapTab(1, "ArrowRight", 2)).toBe(0);
    expect(nextSnapTab(1, "ArrowRight", 3)).toBe(2);
  });

  it("wraps backward with ArrowLeft", () => {
    expect(nextSnapTab(1, "ArrowLeft", 2)).toBe(0);
    expect(nextSnapTab(0, "ArrowLeft", 2)).toBe(1);
  });

  it("jumps to first/last with Home/End", () => {
    expect(nextSnapTab(1, "Home", 2)).toBe(0);
    expect(nextSnapTab(0, "End", 2)).toBe(1);
    expect(nextSnapTab(0, "End", 3)).toBe(2);
    expect(nextSnapTab(1, "End", 1)).toBe(0);
  });

  it("ignores unrelated keys (Enter/Space activate natively)", () => {
    expect(nextSnapTab(0, "Enter", 2)).toBe(0);
    expect(nextSnapTab(1, " ", 2)).toBe(1);
    expect(nextSnapTab(0, "Tab", 2)).toBe(0);
  });
});

describe("snapResultsLiveMessage", () => {
  it("announces in English with the rounded score", () => {
    expect(snapResultsLiveMessage(false, 87.4)).toBe("Results ready — ATS match 87%.");
    expect(snapResultsLiveMessage(false, 100)).toBe("Results ready — ATS match 100%.");
  });

  it("announces in Swahili with the rounded score", () => {
    const msg = snapResultsLiveMessage(true, 87);
    expect(msg).toMatch(/Matokeo yako yako tayari/);
    expect(msg).toMatch(/87%/);
  });

  it("is safe for non-finite scores", () => {
    expect(snapResultsLiveMessage(false, Number.NaN)).toBe("Results ready — ATS match 0%.");
    expect(snapResultsLiveMessage(true, Number.POSITIVE_INFINITY)).toMatch(/0%/);
  });
});

describe("tailoredCvTitle", () => {
  it("prefixes the job title in English", () => {
    expect(tailoredCvTitle(false, "Frontend Engineer")).toBe("Tailored CV — Frontend Engineer");
  });

  it("prefixes the job title in Swahili (never hardcoded English)", () => {
    expect(tailoredCvTitle(true, "Frontend Engineer")).toBe("CV lengwa — Frontend Engineer");
  });

  it("falls back to the bare prefix without a title", () => {
    expect(tailoredCvTitle(false, "")).toBe("Tailored CV");
    expect(tailoredCvTitle(false, "   ")).toBe("Tailored CV");
    expect(tailoredCvTitle(true, "")).toBe("CV lengwa");
  });
});

describe("snapScoreAt / easeOutCubic (D9 score count-up)", () => {
  it("starts at 0 and lands exactly on the target", () => {
    expect(snapScoreAt(0, 650, 87)).toBe(0);
    expect(snapScoreAt(650, 650, 87)).toBe(87);
    expect(snapScoreAt(1000, 650, 87)).toBe(87);
    expect(snapScoreAt(650, 650, 0)).toBe(0);
  });

  it("eases out — progress leads the clock, then decelerates", () => {
    const quarter = snapScoreAt(162.5, 650, 100); // 25% of the duration
    const half = snapScoreAt(325, 650, 100); // 50% of the duration
    expect(quarter).toBeGreaterThan(25); // faster than linear early on
    expect(half).toBeGreaterThan(quarter);
    expect(half).toBeLessThan(100);
  });

  it("is monotonic and never overshoots the target", () => {
    let prev = 0;
    for (let ms = 0; ms <= 650; ms += 25) {
      const v = snapScoreAt(ms, 650, 73);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(73);
      prev = v;
    }
  });

  it("is safe for degenerate inputs", () => {
    expect(snapScoreAt(100, 0, 87)).toBe(0);
    expect(snapScoreAt(Number.NaN, 650, 87)).toBe(0);
    expect(snapScoreAt(100, 650, Number.POSITIVE_INFINITY)).toBe(0);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
  });
});
