// R3 bilingual-parity invariant for the /snap surface: every string key must
// exist in BOTH en and sw, and no value may be empty. A hardcoded English
// string on this page is a bug — this test makes that regression-proof.

import { describe, it, expect } from "vitest";
import { STRINGS } from "@/lib/snap-strings";

/** Flatten a nested object into dot-paths, e.g. { a: { b: 1 } } → ["a.b"]. */
function keySet(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.keys(obj as Record<string, unknown>).flatMap((k) =>
    keySet((obj as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k),
  );
}

function leafValues(obj: unknown): unknown[] {
  if (typeof obj !== "object" || obj === null) return [obj];
  return Object.values(obj as Record<string, unknown>).flatMap(leafValues);
}

describe("STRINGS en/sw parity", () => {
  it("has the same key tree in English and Swahili", () => {
    const en = keySet(STRINGS.en).sort();
    const sw = keySet(STRINGS.sw).sort();
    expect(sw).toEqual(en);
  });

  it("has no empty values in either language", () => {
    for (const value of leafValues(STRINGS.en)) {
      expect(String(value).trim().length).toBeGreaterThan(0);
    }
    for (const value of leafValues(STRINGS.sw)) {
      expect(String(value).trim().length).toBeGreaterThan(0);
    }
  });

  it("provides the R3 a11y strings in both languages", () => {
    expect(STRINGS.en.snapModeLabel.length).toBeGreaterThan(0);
    expect(STRINGS.sw.snapModeLabel.length).toBeGreaterThan(0);
    expect(STRINGS.en.posterPreviewAlt.length).toBeGreaterThan(0);
    expect(STRINGS.sw.posterPreviewAlt.length).toBeGreaterThan(0);
  });

  it("keeps the E2 photo-slice strings bilingual", () => {
    expect(STRINGS.en.ocrProgress).toContain("{pct}");
    expect(STRINGS.sw.ocrProgress).toContain("{pct}");
    expect(STRINGS.en.takePhoto).toMatch(/photo/i);
    expect(STRINGS.sw.takePhoto).toMatch(/picha/i);
  });
});
