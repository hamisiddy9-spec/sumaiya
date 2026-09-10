jest.mock("@react-native-async-storage/async-storage", () => ({ getItem: jest.fn(), setItem: jest.fn() }));

import { computeSkillGaps } from "./skill-gaps";
import { EMPTY_PROFILE, type CareerProfile } from "./profile-store";
import type { JobRecommendation } from "@sumaiya/api-client";

const profile = (over: Partial<CareerProfile> = {}): CareerProfile => ({ ...EMPTY_PROFILE, ...over });

const job = (title: string, description: string): JobRecommendation => ({
  jobId: title,
  score: 50,
  reason: "",
  matchedTerms: [],
  job: { id: title, title, company: "X", location: "Nairobi", category: "", employmentType: "", description, applyUrl: "" },
});

describe("computeSkillGaps", () => {
  it("flags a skill the jobs want and the user lacks, with the real count", () => {
    const r = computeSkillGaps({
      profile: profile({ headline: "Storekeeper", skills: "forklift, teamwork" }),
      jobs: [job("Storekeeper", "must know excel and inventory"), job("Store clerk", "excel spreadsheets required"), job("Warehouse", "picking and packing")],
    });
    const excel = r.gaps.find((g) => g.area.id === "excel");
    expect(excel).toBeTruthy();
    expect(excel!.jobHits).toBe(2);
    expect(excel!.reason.en).toContain("2 of 3");
    expect(excel!.priority).toBe("high"); // 2 hits + weight 5
  });

  it("moves a skill the user already shows into strengths, not gaps", () => {
    const r = computeSkillGaps({
      profile: profile({ headline: "Sales & Retail", skills: "excel, customer service, sales targets" }),
      jobs: [job("Sales rep", "excel and customer service and sales")],
    });
    expect(r.gaps.find((g) => g.area.id === "excel")).toBeFalsy();
    expect(r.strengths.map((s) => s.id)).toEqual(expect.arrayContaining(["excel", "customer-service"]));
  });

  it("works with zero jobs — the field drives the list", () => {
    const r = computeSkillGaps({ profile: profile({ headline: "Finance & Accounting" }), jobs: [] });
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.gaps.map((g) => g.area.id)).toEqual(expect.arrayContaining(["bookkeeping", "excel"]));
    expect(r.target).toBe("Finance & Accounting");
  });

  it("always surfaces interview + job-search once someone is looking", () => {
    const r = computeSkillGaps({ profile: profile({ headline: "Driving" }), jobs: [] });
    expect(r.gaps.map((g) => g.area.id)).toEqual(expect.arrayContaining(["interview", "job-search"]));
  });

  it("readiness is strengths / (strengths + gaps)", () => {
    const r = computeSkillGaps({
      profile: profile({ headline: "Sales & Retail", skills: "excel, sales, customer service, communication" }),
      jobs: [job("Sales", "excel sales customer service communication")],
    });
    expect(r.readiness).toBeGreaterThan(0);
    expect(r.readiness).toBeLessThanOrEqual(100);
  });
});
