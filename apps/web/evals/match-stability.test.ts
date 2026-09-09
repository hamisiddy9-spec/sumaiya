// EVAL: Match stability — the scoring engine must never regress.
//
// Golden pairs pin the real engine's scores at authoring time. A PR that
// changes scoring behaviour (e.g. scoreTerms matching everything, a stopword
// that eats a real skill, a tokenizer that fragments terms) drifts the pin or
// breaks a semantic invariant — and this suite fails in CI.
//
// Deterministic, no AI, no DB. Part of `npm run evals` (merge gate).

import { describe, it, expect } from "vitest";
import { matchCvToJd } from "@/lib/job-match";
import { goldenPairs } from "./fixtures/golden-pairs";

describe("eval: match stability", () => {
  for (const pair of goldenPairs) {
    describe(pair.name, () => {
      const result = matchCvToJd(pair.cv, pair.jd);

      it(`score stays pinned at ${pair.pinnedScore} ±${pair.tolerance}`, () => {
        expect(Math.abs(result.score - pair.pinnedScore)).toBeLessThanOrEqual(pair.tolerance);
      });

      it("every expected keyword is matched", () => {
        for (const term of pair.mustMatch) {
          expect(result.matched, `expected "${term}" to be matched`).toContain(term);
        }
      });

      it("every genuinely-absent keyword stays missing", () => {
        for (const term of pair.mustMiss) {
          expect(result.missing, `expected "${term}" to be missing`).toContain(term);
        }
      });

      it("score is within 0..100 and matched+missing cover the JD terms", () => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        // matched + missing partition the JD's term set exactly.
        for (const t of result.matched) expect(result.missing).not.toContain(t);
        for (const t of result.missing) expect(result.matched).not.toContain(t);
      });
    });
  }

  it("the hard-negative pair stays low (no score inflation)", () => {
    const pair = goldenPairs.find((p) => p.name === "hard-negative-plumber")!;
    const { score } = matchCvToJd(pair.cv, pair.jd);
    expect(score).toBeLessThanOrEqual(25);
  });

  it("an identical CV+JD scores identically every time (determinism)", () => {
    const pair = goldenPairs[0];
    const a = matchCvToJd(pair.cv, pair.jd);
    const b = matchCvToJd(pair.cv, pair.jd);
    expect(b).toEqual(a);
  });
});
