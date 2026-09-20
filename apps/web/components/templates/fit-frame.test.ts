import { describe, it, expect } from "vitest";
import { fitScale, fitBox, PAGE_W, PAGE_H, MIN_FIT_SCALE } from "./fit-frame";

/**
 * The fitting/centring rule, pinned.
 *
 * These numbers come from measurements on the live app before the fix, so the
 * test fails on the old behaviour rather than merely describing the new one:
 *
 *   - The CV editor preview computed its scale as `(offsetWidth - 32) / 794`
 *     while the column's real padding is 32px PER SIDE at the `lg` breakpoint.
 *     Measured on https://sumaiya.app/editor/cv/try?template=apex at a 1024px
 *     viewport: the preview column was 454px wide (390px of content) and the
 *     sheet's wrapper was 422px — 32px too wide, so the sheet was clipped 16px
 *     on each side, and the left 16px sat outside a `overflow-auto` box that
 *     cannot scroll left.
 *   - The marketing template page used a fixed 380px sheet: measured at a 390px
 *     viewport it was pinned at the column's left edge (left gap 0, right
 *     overflow 22px, document scrollWidth 396 > 390).
 */
describe("fitScale — the one fitting rule", () => {
  it("fits the sheet to the container exactly, never wider", () => {
    for (const w of [2000, 1024, 870, 454, 396, 390, 360, 320, 137.9]) {
      expect(fitBox(fitScale(w)).width).toBeLessThanOrEqual(Math.ceil(w));
    }
  });

  it("returns containerWidth / 794 for ordinary columns", () => {
    expect(fitScale(794)).toBeCloseTo(1, 10);
    expect(fitScale(390)).toBeCloseTo(390 / 794, 10);
    expect(fitScale(454)).toBeCloseTo(454 / 794, 10);
    expect(fitScale(137.9)).toBeCloseTo(137.9 / 794, 10);
  });

  it("never magnifies past 1 — a sheet bigger than its column would clip", () => {
    expect(fitScale(3000)).toBe(1);
    expect(fitScale(PAGE_W)).toBe(1);
    expect(fitBox(fitScale(3000)).width).toBe(PAGE_W);
  });

  it("still fits in a column narrower than any usable sheet — no clipping floor", () => {
    // The removed 0.28 floor is what turned a 200px column into a 222px box
    // (clipped on the right). A tiny complete sheet beats a magnified slice.
    expect(MIN_FIT_SCALE).toBe(0);
    expect(fitScale(137.9)).toBeCloseTo(137.9 / 794, 10);
    expect(fitScale(100)).toBeCloseTo(100 / 794, 10);
    expect(fitBox(fitScale(137.9)).width).toBe(138);
  });

  it("a caller-supplied floor still bounds the scale from below", () => {
    expect(fitScale(100, 0.28)).toBe(0.28);
    expect(fitScale(1000, 0.28)).toBe(1);
  });

  it("degrades safely with no measurement (hidden column, first paint)", () => {
    expect(fitScale(0)).toBe(1);
    expect(fitScale(Number.NaN)).toBe(1);
    expect(fitScale(-50)).toBe(1);
  });

  it("REGRESSION: the hand-computed `(offsetWidth - 32) / 794` overflowed by 32px", () => {
    // The editor preview column at a 1024px viewport, measured live:
    const columnOffsetWidth = 454;   // clientWidth of the `p-4 lg:p-8` column
    const lgPaddingPerSide = 32;     // p-8 at >=1024px
    const available = columnOffsetWidth - lgPaddingPerSide * 2;   // 390

    const boxWidth = fitBox(fitScale(available)).width;
    expect(boxWidth).toBe(390);                    // fits the content box exactly
    expect(boxWidth).toBeLessThanOrEqual(available);

    // The old expression, kept here as the guard: it produced a box 32px wider
    // than the column's content box, i.e. 16px clipped off each side.
    const oldBoxWidth = PAGE_W * Math.max(0.28, Math.min(1, (columnOffsetWidth - 32) / PAGE_W));
    expect(Math.round(oldBoxWidth - available)).toBe(32);
    expect(oldBoxWidth).toBeGreaterThan(available);
  });

  it("REGRESSION: a fixed 380px sheet overflowed every viewport narrower than 412px", () => {
    const fixedSheetWidth = 380;                 // the old PREVIEW_W constant
    const phoneContentViewport = 390;            // measured, 390x844 device metrics
    const phoneColumn = phoneContentViewport - 16 * 2;   // the page's own padding
    expect(fixedSheetWidth).toBeGreaterThan(phoneColumn);        // 380 > 358 → clipped
    expect(fitBox(fitScale(phoneColumn)).width).toBe(phoneColumn); // and now it fits
  });
});

describe("fitBox", () => {
  it("keeps A4's aspect ratio at every scale", () => {
    for (const s of [0.28, 0.5, 1]) {
      const b = fitBox(s);
      expect(b.width / b.height).toBeCloseTo(PAGE_W / PAGE_H, 2);
    }
  });

  it("rounds to whole pixels so the sheet's scaled pixels == the box", () => {
    const b = fitBox(fitScale(390));
    expect(Number.isInteger(b.width)).toBe(true);
    expect(Number.isInteger(b.height)).toBe(true);
    expect(Math.abs(b.width - 794 * fitScale(390))).toBeLessThanOrEqual(0.5);
  });
});
