/**
 * The SmartFit magnification band, pinned.
 *
 * The bug this guards against is VARIANCE, not magnification: with a 0.84–1.5
 * band the same 10px body text rendered at 15px on a two-role CV and 8.4px on a
 * long one, so adding a single bullet visibly changed the typography and two CVs
 * from one template looked like two different designs (measured with
 * scripts/smartfit-band.mjs: 1.29–1.50 short, 0.84 long — a 1.79x spread).
 *
 * The second assertion is the preview/PDF contract: the engine must be used with
 * its default (fill on) everywhere, including the preview. `fill={false}` exists
 * only so the fill change can be A/B measured against the old behaviour; a
 * preview that renders differently from the downloaded PDF is a worse defect
 * than an inflated one.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FIT_BAND, clampFitScale } from "./fit";

const WEB = path.resolve(__dirname, "..", "..", "..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "dist") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("SmartFit: the magnification band is narrow and is the ONE band", () => {
  it("is [0.92, 1.12] — at most 12% larger and 8% smaller than the design", () => {
    expect(FIT_BAND.min).toBe(0.92);
    expect(FIT_BAND.max).toBe(1.12);
  });

  it("keeps the spread inside a single design language (<= 1.25x)", () => {
    const spread = FIT_BAND.max / FIT_BAND.min;
    expect(spread).toBeLessThanOrEqual(1.25);
    // The band it replaced, for the record: 1.5 / 0.84 = 1.786.
    expect(spread).toBeGreaterThan(1.2);
  });

  it("clamps every candidate scale into the band, in both directions", () => {
    expect(clampFitScale(1.5)).toBe(1.12);   // a short CV can no longer become a poster
    expect(clampFitScale(1.12)).toBe(1.12);
    expect(clampFitScale(1.05)).toBe(1.05);  // inside the band: untouched
    expect(clampFitScale(0.92)).toBe(0.92);
    expect(clampFitScale(0.5)).toBe(0.92);   // a long CV can no longer be shrunk to a strip
  });

  it("never lets a 10px body line fall below 9.2px or rise above 11.2px", () => {
    const sizes = [1.5, 1.2, 1.0, 0.9, 0.5, 0.1].map((s) => 10 * clampFitScale(s));
    expect(Math.min(...sizes)).toBeCloseTo(9.2, 6);
    expect(Math.max(...sizes)).toBeCloseTo(11.2, 6);
  });

  it("is used identically by the preview and the PDF: no call site passes fill={false}", () => {
    const offenders: string[] = [];
    for (const f of sourceFiles(WEB)) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/<AutoFitPage\b[^>]*>/g)) {
        if (/\bfill\s*=/.test(m[0])) offenders.push(`${path.relative(WEB, f)}: ${m[0]}`);
      }
      // TemplateCanvas forwards to AutoFitPage — it must not grow a `fill` prop.
      for (const m of src.matchAll(/<TemplateCanvas\b[^>]*>/g)) {
        if (/\bfill\s*=/.test(m[0])) offenders.push(`${path.relative(WEB, f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
