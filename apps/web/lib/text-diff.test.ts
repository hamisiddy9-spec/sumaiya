import { describe, it, expect } from "vitest";
import { wordDiff, changeRatio } from "./text-diff";

const join = (parts: ReturnType<typeof wordDiff>, types: string[]) =>
  parts.filter((p) => types.includes(p.type)).map((p) => p.text).join("");

describe("wordDiff", () => {
  it("round-trips: same+add reconstructs `after`, same+del reconstructs `before`", () => {
    const before = "I managed a small team and shipped features.";
    const after = "I led a small team and delivered features on time.";
    const parts = wordDiff(before, after);
    expect(join(parts, ["same", "add"])).toBe(after);
    expect(join(parts, ["same", "del"])).toBe(before);
  });

  it("identical text is all `same`", () => {
    const parts = wordDiff("no change here", "no change here");
    expect(parts.every((p) => p.type === "same")).toBe(true);
    expect(changeRatio(parts)).toBe(0);
  });

  it("pure insertion", () => {
    const parts = wordDiff("Built interfaces.", "Built responsive interfaces.");
    expect(parts.some((p) => p.type === "add" && p.text.includes("responsive"))).toBe(true);
    expect(parts.some((p) => p.type === "del")).toBe(false);
  });

  it("changeRatio grows with the size of the edit", () => {
    const small = changeRatio(wordDiff("the quick brown fox", "the quick brown foxes"));
    const big = changeRatio(wordDiff("the quick brown fox", "a slow green turtle"));
    expect(big).toBeGreaterThan(small);
  });
});
