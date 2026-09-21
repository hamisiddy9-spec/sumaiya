/**
 * The keyword chips must be words a user recognises as keywords.
 *
 * Shipped: "HAYAPO KWENYE WASIFU WAKO" listed "independently." (trailing period),
 * "least" and "grow"; "MANENO YALIYOLINGANA" listed "salaam."
 * (docs/QA-WEB-JOURNEYS-2026-09-20.md D11).
 *
 * Two separate faults: sentence punctuation survived tokenization, and advert
 * filler was never filtered. Real skills must survive both fixes — and the
 * characters that are genuinely part of a term (c++, c#, node.js, ci/cd) must
 * keep working.
 */
import { describe, it, expect } from "vitest";
import { extractTerms, matchCvToJd } from "@/lib/job-match";
import { createEmptyCVData, type CVData } from "@/types";

const ADVERT =
  "Salaam. We are looking for a sales officer who can work independently. " +
  "Requirements: sales reports, customer care. You will grow the territory and at least 3 years are needed.";

describe("extractTerms — no punctuation at the edges of a keyword", () => {
  const terms = extractTerms(ADVERT);

  it("drops the trailing period a sentence left on a word", () => {
    expect(terms).toContain("salaam");
    expect(terms).toContain("independently");
    expect(terms).not.toContain("salaam.");
    expect(terms).not.toContain("independently.");
  });

  it("filters the advert filler that reached the user as a chip", () => {
    expect(terms).not.toContain("least");
    expect(terms).not.toContain("grow");
  });

  it("keeps the real keywords", () => {
    for (const kw of ["sales", "officer", "customer"]) {
      expect(terms, `"${kw}" is a real keyword and must survive`).toContain(kw);
    }
  });

  it("keeps the punctuation that IS part of a term", () => {
    // node.js / ci/cd / c++ keep their inner and language punctuation. ("c#" is
    // only 2 characters, so the pre-existing length>=3 filter drops it — that is
    // not a punctuation rule and this fix does not change it.)
    for (const kw of ["node.js", "c++", "ci/cd"]) {
      expect(extractTerms(`Experience with ${kw} required`)).toContain(kw);
    }
    // A sentence period after a dotted term must not become part of it.
    expect(extractTerms("We use Node.js.")).toContain("node.js");
    expect(extractTerms("We use Node.js.")).not.toContain("node.js.");
    // A trailing + on an ordinary word is punctuation and goes.
    expect(extractTerms("React+ experience")).toContain("react");
    expect(extractTerms("React+ experience")).not.toContain("react+");
  });

  it("every term it emits is free of sentence punctuation at its edges", () => {
    for (const t of terms) {
      expect(t, `"${t}" must not start or end with . or /`).not.toMatch(/^[./]/);
      expect(t, `"${t}" must not start or end with . or /`).not.toMatch(/[./]$/);
    }
  });
});

describe("the chips the user actually sees", () => {
  const cv: CVData = {
    ...createEmptyCVData(),
    summary: "Nina uzoefu wa mauzo.",
    personal: { ...createEmptyCVData().personal, jobTitle: "Mauzo" },
    skills: [{ id: "s1", name: "Mauzo", level: 4 }],
  };

  it("neither column contains a fragment or filler", () => {
    const r = matchCvToJd(cv, ADVERT);
    for (const chip of [...r.matched, ...r.missing]) {
      expect(chip, `chip "${chip}" carries sentence punctuation`).not.toMatch(/[.,;:!?]$/);
      expect(["least", "grow"]).not.toContain(chip);
    }
    // …and the lists are still populated (an empty result would pass vacuously).
    expect(r.matched.length + r.missing.length).toBeGreaterThan(5);
  });
});
