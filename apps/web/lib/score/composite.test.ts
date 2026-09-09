import { describe, it, expect } from "vitest";
import { computeCompositeScore } from "@/lib/score/composite";
import { explainScore, scoreHeadline } from "@/lib/score/explain";
import { analyzeJobProfile } from "@/lib/job-analysis";
import type { CVData } from "@/types";

const CV: CVData = {
  personal: {
    fullName: "Juma Mwinyi",
    jobTitle: "Marketing Manager",
    email: "juma@example.com",
    phone: "+255700000000",
    location: "Dar es Salaam",
  },
  summary: "Marketing manager with 8 years of experience growing brands across East Africa.",
  experience: [
    {
      id: "e1",
      company: "Tigo",
      position: "Marketing Manager",
      location: "Dar es Salaam",
      startDate: "2020-01",
      endDate: "",
      current: true,
      description:
        "Led a team of 6 marketers. Managed 12 multi-channel campaigns and increased engagement by 25%.",
    },
    {
      id: "e2",
      company: "Vodacom",
      position: "Brand Officer",
      location: "Dar es Salaam",
      startDate: "2016-01",
      endDate: "2019-12",
      current: false,
      description: "Coordinated brand activations and supported product launches across 3 regions.",
    },
  ],
  education: [
    { id: "edu1", institution: "UDSM", degree: "Bachelor", field: "Marketing", startDate: "2012", endDate: "2016", grade: "" },
  ],
  skills: [
    { id: "s1", name: "Marketing", level: 5 },
    { id: "s2", name: "SEO", level: 4 },
    { id: "s3", name: "Google Ads", level: 4 },
    { id: "s4", name: "Excel", level: 3 },
  ],
  projects: [],
  languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
  certifications: [],
  referees: [],
  hobbies: "",
};

const JD = `Marketing Manager
Company: Kilimall
Location: Dar es Salaam
Salary: 2,000,000 - 3,500,000 TZS per month

About the role
We are looking for a Marketing Manager to lead our Tanzania growth team.

Responsibilities
- Lead and manage a team of marketers
- Develop multi-channel campaign strategies
- Manage the marketing budget and report on ROI
- Coordinate with the sales team on launches

Qualifications
- 5+ years of experience in marketing
- Bachelor's degree in Marketing or related field
- Proficiency in SEO and Google Ads
- Experience with Excel for reporting
- Must have experience managing campaigns
- Preferred: experience with HubSpot
- Nice to have: knowledge of Swahili market`;

describe("computeCompositeScore", () => {
  it("returns a 0-100 deterministic score with all 7 components", () => {
    const result = computeCompositeScore({ data: CV, jd: JD });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).toHaveLength(7);
    // Weights sum to 1.
    const weightSum = result.components.reduce((a, c) => a + c.weight, 0);
    expect(weightSum).toBeCloseTo(1, 5);
  });

  it("is deterministic — same input, same score", () => {
    const a = computeCompositeScore({ data: CV, jd: JD });
    const b = computeCompositeScore({ data: CV, jd: JD });
    expect(a.score).toBe(b.score);
    expect(a.components.map((c) => c.score)).toEqual(b.components.map((c) => c.score));
  });

  it("scores a strong match higher than a weak match", () => {
    const strong = computeCompositeScore({ data: CV, jd: JD });
    const weakJd = `Accountant
Company: X
Responsibilities
- Prepare financial statements
- Manage payroll and tax filings
Qualifications
- CPA certification
- 5+ years of accounting experience`;
    const weak = computeCompositeScore({ data: CV, jd: weakJd });
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("keyword coverage component reflects matchCvToJd", () => {
    const result = computeCompositeScore({ data: CV, jd: JD });
    const kw = result.components.find((c) => c.key === "keywordCoverage")!;
    expect(kw.score).toBeGreaterThan(0);
    expect(kw.score).toBeLessThanOrEqual(100);
  });

  it("achievement strength rewards quantified bullets", () => {
    const noMetrics: CVData = {
      ...CV,
      experience: [
        {
          ...CV.experience[0],
          description: "Managed a team and coordinated campaigns across the region.",
        },
      ],
    };
    const withMetrics = computeCompositeScore({ data: CV, jd: JD });
    const without = computeCompositeScore({ data: noMetrics, jd: JD });
    const a = withMetrics.components.find((c) => c.key === "achievementStrength")!.score;
    const b = without.components.find((c) => c.key === "achievementStrength")!.score;
    expect(a).toBeGreaterThan(b);
  });
});

describe("explainScore", () => {
  it("produces good/missing/weak/improvable/needsUserInput", () => {
    const score = computeCompositeScore({ data: CV, jd: JD });
    const ex = explainScore(score, CV, JD);
    expect(ex.good.length).toBeGreaterThan(0);
    expect(ex.disclaimer.en).toContain("guide, not a hiring prediction");
    expect(ex.disclaimer.sw).toContain("si utabiri");
  });

  it("surfaces missing tools as needsUserInput (never auto-claims)", () => {
    const score = computeCompositeScore({ data: CV, jd: JD });
    const ex = explainScore(score, CV, JD);
    // HubSpot is in the JD but not the CV → ask the user, never insert.
    const hubspot = ex.needsUserInput.find((s) => s.toLowerCase().includes("hubspot"));
    expect(hubspot).toBeDefined();
    expect(hubspot).toContain("If you have this experience");
  });

  it("never claims the score guarantees an interview", () => {
    const score = computeCompositeScore({ data: CV, jd: JD });
    const ex = explainScore(score, CV, JD);
    const all = [...ex.good, ...ex.missing, ...ex.weak, ...ex.improvable].join(" ").toLowerCase();
    expect(all).not.toContain("will get you the job");
    expect(all).not.toContain("guarantee");
  });

  it("scoreHeadline names the strongest component", () => {
    const score = computeCompositeScore({ data: CV, jd: JD });
    const h = scoreHeadline(score);
    expect(h).toMatch(/Score \d+\/100/);
  });
});

describe("analyzeJobProfile (WS-2)", () => {
  it("extracts company, location, salary and confidence", () => {
    const p = analyzeJobProfile(JD);
    expect(p.company).toBe("Kilimall");
    expect(p.location).toBe("Dar es Salaam");
    expect(p.salary).toBeDefined();
    expect(p.salary!.currency).toBe("TZS");
    expect(p.salary!.min).toBe(2000000);
    expect(p.confidence).toBeGreaterThan(0.5);
  });

  it("splits responsibilities vs qualifications vs niceToHave", () => {
    const p = analyzeJobProfile(JD);
    expect(p.responsibilities.length).toBeGreaterThan(0);
    expect(p.qualifications.length).toBeGreaterThan(0);
    expect(p.niceToHave.length).toBeGreaterThan(0);
    const all = p.responsibilities.join(" ").toLowerCase();
    expect(all).toContain("lead");
  });

  it("assigns importance: critical for must-have, low for nice-to-have", () => {
    const p = analyzeJobProfile(JD);
    const critical = p.requirements.find((r) => r.importance === "critical");
    const low = p.requirements.find((r) => r.importance === "low");
    expect(critical).toBeDefined();
    expect(low).toBeDefined();
    expect(low!.text.toLowerCase()).toContain("hubspot");
  });

  it("skills carry importance from requirement context", () => {
    const p = analyzeJobProfile(JD);
    const seo = p.skills.find((s) => s.name === "seo");
    expect(seo).toBeDefined();
    expect(seo!.importance).toBe("high");
  });

  it("handles a single-paragraph JD with low confidence", () => {
    const p = analyzeJobProfile("We need a Python developer with 3+ years of Django experience. Salary: 3,000,000 TZS.");
    expect(p.title).toBeDefined();
    expect(p.skills.some((s) => s.name === "python")).toBe(true);
    expect(p.confidence).toBeGreaterThan(0);
  });
});
