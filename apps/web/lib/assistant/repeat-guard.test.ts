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

  it("the ack moves the conversation forward WITHOUT offering a menu", () => {
    for (const lang of ["sw", "en"] as const) {
      for (let i = 0; i < 3; i++) {
        const out = pickRepeatVariant(lang, i);
        // Forward-moving: it asks what comes next / to continue.
        expect(out, out).toMatch(/tuendelee|tuchukue|tusonge|tuanze|kifuatacho|keep going|next|move forward|start/i);
        // And it no longer names a menu of other actions, nor claims the user
        // repeated themselves ("Umekwisha niambia hivyo").
        expect(out, out).not.toMatch(/ATS|ukaguzi wa CV, linganisha|chagua mojawapo|which one|pick one/i);
        expect(out, out).not.toMatch(/umekwisha niambia|you've told me that/i);
      }
    }
  });
});

/**
 * REGRESSION — a menu is never a substitute for a deliverable.
 *
 * The two replies and the request are quoted VERBATIM from the device run
 * (native 1.6.25, docs/QA-NATIVE-1625-2026-09-21.md §2.4). Both observed
 * deflections were REPEAT_VARIANTS — the guard swapped the model's reply for a
 * menu, twice, and the summary was never written. The old guard had no notion of
 * a deliverable at all, so it returns a variant here and these tests fail on it.
 */
const DEVICE_REQUEST = "Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja.";
const DEVICE_MENU_REPLY =
  "Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili — tuchukue hatua inayofuata: naweza kukagua CV yako, kuilinganisha na kazi unayoitaka, au kutengeneza hati mpya. Ni ipi?";
const DEVICE_MENU_REPLY_2 =
  "Umekwisha niambia hivyo, asante! Hebu tuende hatua inayofuata — gusa hapa chini: ukaguzi wa CV, linganisha kazi, au tengeneza hati. Tutafanya nini kwanza?";
const WRITTEN_SUMMARY =
  "Muhtasari wa CV yako: Msaidizi wa huduma kwa mteja mwenye uzoefu wa miaka mitatu katika mapokezi, kushughulikia malalamiko na kuhudumia wateja kwa heshima. Nimezoea kufanya kazi kwa mfumo wa kompyuta na kutunza rekodi za wateja kwa usahihi.";

describe("a deliverable request is never answered with a menu", () => {
  it("keeps the model's written summary when the same request is repeated", () => {
    const out = guardReplyAgainstRepeat(WRITTEN_SUMMARY, [WRITTEN_SUMMARY], "sw", 2, {
      latestUserMessage: DEVICE_REQUEST,
    });
    expect(out).toBe(WRITTEN_SUMMARY);
    expect(out).not.toBe(pickRepeatVariant("sw", 2));
  });

  it("keeps the written summary even without the caller's hint", () => {
    // Rule 2: the reply already carries the work — the guard may vary wording,
    // but it may not erase the deliverable. (Old behaviour: a variant.)
    const out = guardReplyAgainstRepeat(WRITTEN_SUMMARY, [WRITTEN_SUMMARY], "sw", 0);
    expect(out).toBe(WRITTEN_SUMMARY);
  });

  it("still varies a repeat that carries NO deliverable (the guard is not disabled)", () => {
    const out = guardReplyAgainstRepeat(DEVICE_MENU_REPLY_2, [DEVICE_MENU_REPLY_2], "sw", 0);
    expect(out).not.toBe(DEVICE_MENU_REPLY_2);
    expect(pickRepeatVariant("sw", 0)).toBe(out);
  });

  it("recognises every deliverable ask from the user's own wording", () => {
    for (const ask of [
      DEVICE_REQUEST,
      "Niandikie barua ya maombi ya kazi ya udereva",
      "Nisaidie kuandika ujumbe kwa mwajiri",
      "Write me a short professional summary",
      "Nijenge kuhusu mimi kwa muhtasari",
    ]) {
      const out = guardReplyAgainstRepeat(
        "Karibu! Unatarget kazi gani?",
        ["Karibu! Unatarget kazi gani?"],
        "sw",
        1,
        { latestUserMessage: ask },
      );
      expect(out, ask).toBe("Karibu! Unatarget kazi gani?");
    }
  });
});
