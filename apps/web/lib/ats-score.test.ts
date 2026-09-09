import { describe, it, expect } from "vitest";
import { analyzeCv, atsScore } from "@/lib/ats-score";
import { createEmptyCVData, type CVData } from "@/types";

function cv(p: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...p };
}

describe("analyzeCv / atsScore", () => {
  it("scores an empty CV low and returns the full checklist", () => {
    const checks = analyzeCv(createEmptyCVData(), false);
    expect(checks.length).toBeGreaterThanOrEqual(10);
    expect(atsScore(checks)).toBeLessThan(50);
  });

  it("credits impact content from a project (graduate, no jobs)", () => {
    const checks = analyzeCv(cv({
      projects: [{ id: "p1", name: "Sensor", description: "Built a rig that cut sampling time by 40%." }],
    }), false);
    const quantified = checks.find(c => c.id === "quantified");
    const verbs = checks.find(c => c.id === "action_verbs");
    expect(quantified?.pass).toBe(true); // "40%" counts even with no experience
    expect(verbs?.pass).toBe(true);      // "Built" counts even with no experience
  });

  it("is deterministic", () => {
    const d = cv({ summary: "Experienced nurse with strong patient-care skills across busy wards." });
    expect(atsScore(analyzeCv(d, false))).toBe(atsScore(analyzeCv(d, false)));
  });
});
