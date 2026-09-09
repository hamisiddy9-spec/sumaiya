import { analyzeCv, atsScore, atsBreakdown, lineFindings, matchJd } from "./ats";
import type { CVData } from "@sumaiya/types";

const empty: CVData = {
  personalInfo: { fullName: "", email: "", phone: "", location: "" },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  summary: "",
};

const strong: CVData = {
  personalInfo: {
    fullName: "Asha Mwangi",
    email: "asha@example.com",
    phone: "+254700000000",
    location: "Nairobi",
    headline: "Warehouse Supervisor",
  },
  summary:
    "Warehouse supervisor with six years of experience running inventory and dispatch for FMCG distributors across Kenya.",
  experience: [
    {
      id: "e1",
      company: "Brookside",
      title: "Warehouse Supervisor",
      startDate: "2019-03",
      endDate: "Present",
      description:
        "Led a team of 12 pickers and reduced dispatch errors by 30% over one year. Implemented a barcode system that cut stock counts from 2 days to 4 hours.",
      keyAchievements: ["Cut shrinkage by 18%"],
    },
  ],
  education: [
    { id: "ed1", institution: "TUK", degree: "Diploma", field: "Supply Chain", graduationDate: "2018-11" },
  ],
  skills: [
    "Inventory","Forklift","POS","Dispatch","Team leadership","Barcode systems","Stock control","Safety",
  ].map((name, i) => ({ id: `s${i}`, name, level: "advanced" as const })),
  certifications: [],
  languages: [],
};

describe("analyzeCv", () => {
  it("an empty CV scores low and fails the core checks", () => {
    const checks = analyzeCv(empty);
    const score = atsScore(checks);
    expect(score).toBeLessThan(25);
    expect(checks.find((c) => c.id === "contact")!.pass).toBe(false);
    expect(checks.find((c) => c.id === "experience")!.pass).toBe(false);
  });

  it("a strong CV scores high and passes contact / impact checks", () => {
    const checks = analyzeCv(strong);
    const score = atsScore(checks);
    expect(score).toBeGreaterThan(80);
    expect(checks.find((c) => c.id === "contact")!.pass).toBe(true);
    expect(checks.find((c) => c.id === "quantified")!.pass).toBe(true);
    expect(checks.find((c) => c.id === "action_verbs")!.pass).toBe(true);
  });

  it("breakdown pillars sum the right checks and each scores 0-100", () => {
    const pillars = atsBreakdown(analyzeCv(strong));
    expect(pillars.map((p) => p.key).sort()).toEqual(["content", "impact", "parsing", "relevance"]);
    for (const p of pillars) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
  });

  it("Swahili action verbs count toward the impact check", () => {
    const sw: CVData = {
      ...empty,
      experience: [
        { id: "e1", company: "Duka", title: "Muuzaji", startDate: "2020-01", description: "Niliongoza timu ya watu watano na niliongeza mauzo kwa 25%.", keyAchievements: [] },
      ],
    };
    const checks = analyzeCv(sw, true);
    expect(checks.find((c) => c.id === "action_verbs")!.pass).toBe(true);
    expect(checks.find((c) => c.id === "quantified")!.pass).toBe(true);
  });
});

describe("lineFindings", () => {
  it("flags passive phrasing and missing numbers", () => {
    const data: CVData = {
      ...empty,
      experience: [
        { id: "e1", company: "Shop", title: "Clerk", startDate: "2021-01",
          description: "Was responsible for customer service and daily operations of the front desk area", keyAchievements: [] },
      ],
    };
    const f = lineFindings(data);
    expect(f.some((x) => /passive/i.test(x.issue))).toBe(true);
    expect(f.some((x) => /measurable|number/i.test(x.issue))).toBe(true);
  });
});

describe("matchJd", () => {
  it("scores keyword overlap and lists missing keywords", () => {
    const jd =
      "We are hiring a warehouse supervisor. Must have forklift certification, inventory management, dispatch planning and strong safety record. Experience with SAP is a plus.";
    const res = matchJd(strong, jd);
    expect(res.score).toBeGreaterThan(30);
    expect(res.matched).toEqual(expect.arrayContaining(["warehouse", "forklift", "inventory"]));
    expect(res.missing).toEqual(expect.arrayContaining(["sap"]));
  });
});
