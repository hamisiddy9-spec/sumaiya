import { describe, it, expect } from "vitest";
import {
  normalizeReply,
  replySimilarity,
  REPEAT_SIMILARITY_THRESHOLD,
  guardReplyAgainstRepeat,
  pickRepeatVariant,
} from "./repeat-guard";

describe("normalizeReply", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalizeReply("  Habari,   rafiki!  ")).toBe("habari rafiki");
    expect(normalizeReply("CV na ATS — check?").trim()).toBe("cv na ats check");
    expect(normalizeReply("")).toBe("");
  });
});

describe("replySimilarity", () => {
  it("identical sentences → 1", () => {
    expect(replySimilarity("Karibu! Unatarget kazi gani?", "Karibu! Unatarget kazi gani?")).toBe(1);
  });

  it("near-identical phrasing (case/punct) → above threshold", () => {
    const sim = replySimilarity("Nimekuelewa, tutengeneze CV yako.", "Nimekuelewa tutengeneze CV yako!");
    expect(sim).toBeGreaterThanOrEqual(REPEAT_SIMILARITY_THRESHOLD);
  });

  it("different replies → low similarity", () => {
    const sim = replySimilarity("Karibu! Unatarget kazi gani?", "Nimekamilisha CV yako, tazama hapa.");
    expect(sim).toBeLessThan(REPEAT_SIMILARITY_THRESHOLD);
  });

  it("empty inputs → 0", () => {
    expect(replySimilarity("", "anything")).toBe(0);
    expect(replySimilarity("anything", "")).toBe(0);
  });

  it("R1 live repro: Swahili replies sharing 22/23 words with a word-order swap score HIGH (was 0.087)", () => {
    // Live QA 2026-08: user asked the same CV question twice; Sumaiya replied
    // with near-identical sentences — only "kwanza/niambie" reordered and one
    // verb inflected (unaitafuta → unayoitafuta). Old greedy subsequence
    // scored 0.087 (single early order-diff poisoned the tail → guard never
    // fired → user saw the same message twice).
    const a = "Karibu! Kwanza, niambie kazi gani unaitafuta, na nami nitakusaidia kuandaa CV yako ipasavyo. Unaweza pia kubandika CV yako ya sasa hapa ili niichambue.";
    const b = "Karibu! Niambie kwanza kazi gani unayoitafuta, na nami nitakusaidia kuandaa CV yako ipasavyo. Unaweza pia kubandika CV yako ya sasa hapa ili niichambue.";
    expect(replySimilarity(a, b)).toBeGreaterThanOrEqual(REPEAT_SIMILARITY_THRESHOLD);
    // And the guard must actually swap it:
    const out = guardReplyAgainstRepeat(b, [a], "sw", 0);
    expect(out).not.toBe(b);
  });

  it("order-insensitive: same words reordered → high similarity", () => {
    const sim = replySimilarity("Sawa, tutengeneze CV yako sasa", "Tutengeneze CV yako sasa, sawa");
    expect(sim).toBeGreaterThanOrEqual(REPEAT_SIMILARITY_THRESHOLD);
  });

  it("different replies sharing only function words → low similarity", () => {
    const sim = replySimilarity(
      "Karibu! Unatarget kazi gani?",
      "Nimekamilisha CV yako, tazama hapa.",
    );
    expect(sim).toBeLessThan(REPEAT_SIMILARITY_THRESHOLD);
  });
});

describe("guardReplyAgainstRepeat — server-side backstop", () => {
  it("swaps in a varied ack when the fresh reply is a verbatim repeat", () => {
    const prior = ["Karibu! Unatarget kazi gani?"];
    const fresh = "Karibu! Unatarget kazi gani?";
    const out = guardReplyAgainstRepeat(fresh, prior, "sw", 0);
    expect(out).not.toBe(fresh);
    expect(out.length).toBeGreaterThan(0);
  });

  it("passes through replies that are genuinely new", () => {
    const prior = ["Karibu! Unatarget kazi gani?"];
    const fresh = "Sawa, nimekusanya maelezo yako. Nitengeneze CV sasa?";
    expect(guardReplyAgainstRepeat(fresh, prior, "sw", 0)).toBe(fresh);
  });

  it("ignores empty prior history", () => {
    const fresh = "Karibu! Niendelee vipi?";
    expect(guardReplyAgainstRepeat(fresh, [], "en", 0)).toBe(fresh);
  });

  it("rotates variants so even the ack varies per turn", () => {
    const prior = ["Habari"];
    const fresh = "Habari";
    const a = guardReplyAgainstRepeat(fresh, prior, "sw", 0);
    const b = guardReplyAgainstRepeat(fresh, prior, "sw", 1);
    const c = guardReplyAgainstRepeat(fresh, prior, "sw", 2);
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it("pickRepeatVariant stays in bounds for both languages", () => {
    expect(pickRepeatVariant("sw", 0)).toBeTruthy();
    expect(pickRepeatVariant("en", 0)).toBeTruthy();
    // rotation beyond array length wraps cleanly
    expect(pickRepeatVariant("sw", 999)).toBeTruthy();
    expect(pickRepeatVariant("en", 999)).toBeTruthy();
  });

  it("the ack moves the conversation forward (has a next-step offer)", () => {
    const out = pickRepeatVariant("en", 0);
    expect(out.toLowerCase()).toMatch(/ats|check|match|build|next step|which one|first/i);
  });
});
