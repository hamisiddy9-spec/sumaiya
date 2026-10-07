// RF5 — unit tests for the shared motion utilities (pure + deterministic).
import { describe, it, expect } from "vitest";
import { easeOutCubic, easeOutQuart, countUpValueAt, riseClass } from "@/lib/motion";

describe("easeOutCubic", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("clamps out-of-range input", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });

  it("decelerates (slower near the end)", () => {
    // Cubic ease-out: t=0.5 → 1-(0.5)^3 = 0.875 (fast start, slow finish).
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 6);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("easeOutQuart", () => {
  it("pops faster than cubic at the same t", () => {
    // Quart: 1-(0.5)^4 = 0.9375 > cubic 0.875.
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375, 6);
    expect(easeOutQuart(0.5)).toBeGreaterThan(easeOutCubic(0.5));
  });

  it("bounds-checked", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
  });
});

describe("countUpValueAt", () => {
  it("returns 0 before it starts and exactly the target at/after the end", () => {
    expect(countUpValueAt(0, 650, 87)).toBe(0);
    expect(countUpValueAt(650, 650, 87)).toBe(87);
    expect(countUpValueAt(1000, 650, 87)).toBe(87);
    expect(countUpValueAt(650, 650, 0)).toBe(0);
  });

  it("eases monotonically toward the target", () => {
    const values = [0.1, 0.25, 0.5, 0.75, 0.9].map((f) =>
      countUpValueAt(650 * f, 650, 100),
    );
    // Non-decreasing.
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
    // Strictly between 0 and 100 mid-flight.
    expect(values[2]).toBeGreaterThan(0);
    expect(values[2]).toBeLessThan(100);
  });

  it("handles degenerate inputs", () => {
    expect(countUpValueAt(NaN, 650, 87)).toBe(0);
    expect(countUpValueAt(100, 0, 87)).toBe(0);
    expect(countUpValueAt(100, -5, 87)).toBe(0);
    expect(countUpValueAt(100, 650, Infinity)).toBe(0);
  });

  it("honors a custom easing function", () => {
    // Linear would be 50 at t=0.5; quart gives 93.75 → rounding differs.
    const linear: (t: number) => number = (t) => t;
    expect(countUpValueAt(325, 650, 100, linear)).toBe(50);
  });
});

describe("riseClass", () => {
  it("uses the capped token stagger (base 30ms, step 40ms, cap 6)", () => {
    // The old mapping was `index <= 3 → rise-(index+1)`, which made `rise-1`
    // unreachable and left the cap unenforced in the language. The steps now
    // correspond 1:1 to the shared tokens, and index > cap shares the last step.
    expect(riseClass(0)).toBe("rise");
    expect(riseClass(1)).toBe("rise rise-1");
    expect(riseClass(2)).toBe("rise rise-2");
    expect(riseClass(3)).toBe("rise rise-3");
    expect(riseClass(6)).toBe("rise rise-6");
    expect(riseClass(7)).toBe("rise rise-6"); // capped
    expect(riseClass(99)).toBe("rise rise-6"); // capped
  });

  it("safe for negative indexes", () => {
    expect(riseClass(-1)).toBe("rise");
  });
});
