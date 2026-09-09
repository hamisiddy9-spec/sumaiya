import { describe, it, expect } from "vitest";
import {
  extractMetrics,
  extractSkills,
  verifyAiContent,
  tailorEvidence,
} from "@/lib/career-profile/evidence";
import { createEmptyCVData, type CVData } from "@/types";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

const userCv = cv({
  summary: "Sales manager who increased revenue by 30% at Acme.",
  experience: [
    {
      id: "e1", company: "Acme Ltd", position: "Sales Manager",
      startDate: "2020-01", endDate: "", current: true,
      description: "Led a team of 5. Grew revenue by 30% year over year.",
    },
  ],
  skills: [
    { id: "s1", name: "Excel", level: 4 },
    { id: "s2", name: "CRM", level: 3 },
  ],
});

describe("extractMetrics", () => {
  it("finds percentages and counts", () => {
    const m = extractMetrics("increased sales by 30% and led a team of 12");
    expect(m.map((x) => x.normalized)).toEqual(["30 %", "12"]);
  });

  it("finds currency figures", () => {
    const m = extractMetrics("managed a $50K budget and 2M revenue");
    expect(m.length).toBeGreaterThanOrEqual(2);
  });

  it("returns nothing for plain text", () => {
    expect(extractMetrics("I improved processes and worked hard")).toEqual([]);
  });
});

describe("extractSkills", () => {
  it("detects known tools case-insensitively", () => {
    const s = extractSkills("experienced with SAP, SalesForce and power bi");
    expect(s).toEqual(expect.arrayContaining(["sap", "salesforce", "power bi"]));
  });

  it("does not match substrings (excel vs excellency)", () => {
    expect(extractSkills("an excellency award")).not.toContain("excel");
  });
});

describe("verifyAiContent", () => {
  it("confirms claims that exist in the user's CV", () => {
    const report = verifyAiContent(
      "I increased revenue by 30% at Acme Ltd.",
      [],
      userCv,
    );
    const metrics = report.claims.filter((c) => c.kind === "metric");
    expect(metrics[0].supported).toBe(true);
    expect(metrics[0].status).toBe("confirmed");
    expect(report.allSupported).toBe(true);
  });

  it("flags invented metrics as needs-confirmation", () => {
    const report = verifyAiContent(
      "I increased revenue by 85% and cut costs by 40%.",
      [],
      userCv,
    );
    const unsupported = report.claims.filter((c) => c.kind === "metric" && !c.supported);
    expect(unsupported.some((c) => c.claim.includes("85"))).toBe(true);
    expect(unsupported.some((c) => c.claim.includes("40"))).toBe(true);
    expect(report.allSupported).toBe(false);
    expect(report.unconfirmed.length).toBeGreaterThan(0);
  });

  it("flags skills the user never listed (the SAP question)", () => {
    const report = verifyAiContent(
      "Strong SAP and HubSpot experience delivering results.",
      [],
      userCv,
    );
    const skills = report.claims.filter((c) => c.kind === "skill");
    expect(skills.map((c) => c.claim)).toEqual(expect.arrayContaining(["sap", "hubspot"]));
    expect(skills.every((c) => c.status === "needs-confirmation")).toBe(true);
  });

  it("does not flag skills the user actually has", () => {
    const report = verifyAiContent("Proficient with Excel and CRM.", [], userCv);
    expect(report.claims.filter((c) => c.kind === "skill")).toEqual([]);
  });

  it("flags an employer that never appears in the user history", () => {
    const report = verifyAiContent("Led sales at Google for 3 years.", [], userCv);
    const emp = report.claims.filter((c) => c.kind === "employer");
    expect(emp.length).toBeGreaterThan(0);
    expect(emp[0].supported).toBe(false);
  });

  it("checks each experience entry with its location", () => {
    const report = verifyAiContent(
      "",
      [{ id: "e1", company: "Acme Ltd", description: "Cut costs by 90% with SAP." }],
      userCv,
    );
    expect(report.unconfirmed.length).toBeGreaterThan(0);
    expect(report.claims[0].location).toBe("experience:Acme Ltd");
  });

  it("handles empty AI output gracefully", () => {
    const report = verifyAiContent("", [], userCv);
    expect(report.claims).toEqual([]);
    expect(report.allSupported).toBe(true);
  });

  it("tolerates incomplete user data (missing sections)", () => {
    const report = verifyAiContent("Grew revenue 10%.", [], cv({}));
    expect(report.claims.length).toBeGreaterThan(0);
    expect(report.allSupported).toBe(false);
  });
});

describe("tailorEvidence", () => {
  it("wraps verifyAiContent for the tailor route shape", () => {
    const report = tailorEvidence(
      { summary: "Grew revenue 50% with SAP.", experience: [] },
      userCv,
    );
    expect(report.unconfirmed.length).toBeGreaterThan(0);
  });
});
