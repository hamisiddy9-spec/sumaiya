// EVAL: Sumaiya Score composite — the ONE authoritative score must be
// stable, explainable, and honest.
//
// Pins the composite score + key component scores for the golden pairs. A PR
// that changes scoring behaviour (weights, component math, evidence rules)
// drifts these pins — and this suite fails in CI. The composite calls the
// existing deterministic engines; it never invents numbers.
//
// Deterministic, no AI, no DB. Part of `npm run evals` (merge gate).

import { describe, it, expect } from "vitest";
import { computeCompositeScore } from "@/lib/score/composite";
import { explainScore } from "@/lib/score/explain";
import { goldenPairs } from "./fixtures/golden-pairs";

describe("eval: score composite stability", () => {
  for (const pair of goldenPairs) {
    describe(pair.name, () => {
      const composite = computeCompositeScore({ data: pair.cv, jd: pair.jd });

      it("is deterministic across runs", () => {
        const again = computeCompositeScore({ data: pair.cv, jd: pair.jd });
        expect(again.score).toBe(composite.score);
      });

      it("total is the weighted sum of its components", () => {
        const manual = Math.round(
          composite.components.reduce((acc, c) => acc + c.weight * c.score, 0)
        );
        expect(composite.score).toBe(manual);
      });

      it("all 7 components are present with weights summing to 1", () => {
        const keys = composite.components.map((c) => c.key);
        expect(keys).toEqual([
          "jobRelevance",
          "keywordCoverage",
          "skillsAlignment",
          "experienceRelevance",
          "achievementStrength",
          "educationQualification",
          "atsQuality",
        ]);
        const weightSum = composite.components.reduce((a, c) => a + c.weight, 0);
        expect(weightSum).toBeCloseTo(1, 5);
      });

      it("composite score is within 0..100", () => {
        expect(composite.score).toBeGreaterThanOrEqual(0);
        expect(composite.score).toBeLessThanOrEqual(100);
      });

      it("explanation is structured and honest", () => {
        const ex = explainScore(composite, pair.cv, pair.jd);
        expect(ex.good).toBeInstanceOf(Array);
        expect(ex.missing).toBeInstanceOf(Array);
        expect(ex.weak).toBeInstanceOf(Array);
        expect(ex.improvable).toBeInstanceOf(Array);
        expect(ex.needsUserInput).toBeInstanceOf(Array);
        expect(ex.disclaimer.en).toContain("guide, not a hiring prediction");
        // The disclaimer must never promise outcomes.
        expect(ex.disclaimer.en.toLowerCase()).not.toContain("guarantee");
        expect(ex.disclaimer.en.toLowerCase()).not.toContain("will get you");
      });

      it("keyword coverage component agrees with the pinned match score", () => {
        const kw = composite.components.find((c) => c.key === "keywordCoverage")!;
        expect(Math.abs(kw.score - pair.pinnedScore)).toBeLessThanOrEqual(pair.tolerance);
      });
    });
  }
});
