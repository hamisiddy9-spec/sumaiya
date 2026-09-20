// Product rule: sell the outcome, never the mechanism. Swahili copy must
// never say "ATS" — English may, where it legitimately names the mechanism.
// This walks every string in the translations tree (not just the four
// strings a native-speaker audit originally found) so a new Swahili key can
// never reintroduce the jargon without failing here first.
import { describe, it, expect } from "vitest";
import { translations } from "./translations";

const ATS_PATTERN = /\bATS\b/i;

function walk(node: unknown, path: string, hits: string[]): void {
  if (typeof node === "string") {
    if (ATS_PATTERN.test(node)) hits.push(path);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${path}[${i}]`, hits));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${key}` : key, hits);
    }
  }
}

describe("no ATS jargon in Swahili copy", () => {
  it("translations.sw contains no 'ATS' anywhere in its string tree", () => {
    const hits: string[] = [];
    walk(translations.sw, "sw", hits);
    expect(hits, `found "ATS" in Swahili copy at: ${hits.join(", ")} — describe the outcome instead (e.g. "mifumo ya kuajiri" / "vigezo vya waajiri"), never the mechanism`).toEqual([]);
  });

  it("translations.en is allowed to contain 'ATS' (the guard is scoped to Swahili only)", () => {
    const hits: string[] = [];
    walk(translations.en, "en", hits);
    expect(hits.length, "translations.en should legitimately use 'ATS' in several places — if this is 0, check the walker itself before assuming English copy changed").toBeGreaterThan(0);
  });
});
