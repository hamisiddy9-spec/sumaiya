import { describe, it, expect } from "vitest";
import {
  analyzeCv, atsScore, atsBreakdown,
  lineFindings, applicableAutoFixes,
  autoFixRemovePhoto, autoFixDates, autoFixEmptyBullets, autoFixDuplicateSkills,
  type AtsCheck,
} from "@/lib/ats-score";
import { createEmptyCVData, type CVData } from "@/types";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

function checksFor(data: CVData, sw = false): AtsCheck[] {
  return analyzeCv(data, sw);
}

describe("analyzeCv — explainable fields", () => {
  it("every check carries a category, location, fix, and evidence flag", () => {
    const checks = checksFor(cv({}));
    expect(checks.length).toBe(11);
    for (const c of checks) {
      expect(["parsing", "relevance", "impact", "content"]).toContain(c.category);
      expect(typeof c.location).toBe("string");
      expect(c.location.length).toBeGreaterThan(0);
      expect(typeof c.fix).toBe("string");
      expect(c.fix.length).toBeGreaterThan(0);
      expect(typeof c.evidenceBacked).toBe("boolean");
      expect(typeof c.autoFixable).toBe("boolean");
    }
  });

  it("photo check is autoFixable + evidenceBacked", () => {
    const checks = checksFor(cv({ personal: { ...createEmptyCVData().personal, photo: "x.jpg" } }));
    const photo = checks.find((c) => c.id === "photo")!;
    expect(photo.autoFixable).toBe(true);
    expect(photo.evidenceBacked).toBe(true);
  });
});

describe("atsBreakdown", () => {
  it("groups checks into the four pillars and scores each", () => {
    const pillars = atsBreakdown(checksFor(cv({})), false);
    expect(pillars.map((p) => p.key)).toEqual(["parsing", "relevance", "impact", "content"]);
    expect(pillars.every((p) => p.checks.length > 0)).toBe(true);
    for (const p of pillars) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
  });

  it("total of pillar check weights equals the full check set", () => {
    const all = checksFor(cv({}));
    const pillars = atsBreakdown(all, false);
    const pillarWeight = pillars.reduce((s, p) => s + p.checks.reduce((x, c) => x + c.weight, 0), 0);
    expect(pillarWeight).toBe(all.reduce((s, c) => s + c.weight, 0));
  });
});

describe("lineFindings", () => {
  const expCv = cv({
    experience: [{
      id: "e1", company: "Acme", position: "Manager",
      startDate: "2020-01", endDate: "", current: true,
      description: [
        "Was responsible for the sales team.",
        "Worked on the annual report.",
        "Handled customer calls every day.",
        "Managed inventory for the Dar es Salaam branch.",
        "Managed reporting for the Mwanza office.",
        "Managed the budget for the whole region.",
      ].join("\n"),
    }],
  });

  it("flags passive phrasing and weak verbs with what/why/where/fix", () => {
    const findings = lineFindings(expCv, false);
    expect(findings.length).toBeGreaterThan(0);
    const passive = findings.find((f) => f.issue === "Passive phrasing");
    expect(passive).toBeDefined();
    expect(passive!.line).toContain("responsible for");
    expect(passive!.why.length).toBeGreaterThan(10);
    expect(passive!.fix.length).toBeGreaterThan(10);
    expect(passive!.evidenceBacked).toBe(true);
    expect(passive!.entryId).toBe("e1");
  });

  it("flags repeated openers (3+ same first word)", () => {
    const findings = lineFindings(expCv, false);
    const repeat = findings.find((f) => f.issue.includes("Repeated opener"));
    expect(repeat).toBeDefined();
  });

  it("returns nothing for a clean entry", () => {
    const clean = cv({
      experience: [{
        id: "e1", company: "Acme", position: "Eng",
        startDate: "2020-01", endDate: "", current: true,
        description: "Built the payments API used by 40 stores.\nCut billing errors by 25%.",
      }],
    });
    expect(lineFindings(clean, false)).toEqual([]);
  });

  it("translates issues to Swahili", () => {
    const findings = lineFindings(expCv, true);
    expect(findings.some((f) => f.issue.includes("kitenzi") || f.issue.includes("Maneno"))).toBe(true);
  });

  it("handles incomplete/long data gracefully", () => {
    expect(lineFindings(cv({}), false)).toEqual([]);
    const long = cv({
      experience: Array.from({ length: 30 }, (_, i) => ({
        id: `e${i}`, company: `Co${i}`, position: "R", startDate: "", endDate: "", current: false,
        description: "Was responsible for many things at once.".repeat(5),
      })),
    });
    expect(lineFindings(long, false).length).toBeGreaterThan(0);
  });
});

describe("AutoFix — user-approved, evidence-backed only", () => {
  it("removes the photo without touching anything else", () => {
    const data = cv({ personal: { ...createEmptyCVData().personal, fullName: "A", photo: "p.jpg" } });
    const r = autoFixRemovePhoto(data);
    expect(r.applied).toBe(true);
    expect(r.data.personal.photo).toBeUndefined();
    expect(r.data.personal.fullName).toBe("A");
  });

  it("normalizes bare years to YYYY-MM and pads months", () => {
    const data = cv({
      experience: [{
        id: "e1", company: "C", position: "P", startDate: "2020", endDate: "2021-3",
        current: false, description: "x",
      }],
    });
    const r = autoFixDates(data);
    expect(r.applied).toBe(true);
    expect(r.data.experience[0].startDate).toBe("2020-01");
    expect(r.data.experience[0].endDate).toBe("2021-03");
  });

  it("leaves already-consistent dates untouched", () => {
    const data = cv({
      experience: [{
        id: "e1", company: "C", position: "P", startDate: "2020-01", endDate: "2021-03",
        current: false, description: "x",
      }],
    });
    expect(autoFixDates(data).applied).toBe(false);
  });

  it("removes empty bullets only", () => {
    const data = cv({
      experience: [{
        id: "e1", company: "C", position: "P", startDate: "", endDate: "", current: false,
        description: "Real bullet\n   \n- \nAnother real bullet",
      }],
    });
    const r = autoFixEmptyBullets(data);
    expect(r.applied).toBe(true);
    expect(r.data.experience[0].description).toBe("Real bullet\nAnother real bullet");
  });

  it("dedupes skills case-insensitively, keeping the highest level", () => {
    const data = cv({
      skills: [
        { id: "s1", name: "Excel", level: 3 },
        { id: "s2", name: "excel", level: 5 },
        { id: "s3", name: "SQL", level: 4 },
      ],
    });
    const r = autoFixDuplicateSkills(data);
    expect(r.applied).toBe(true);
    expect(r.data.skills).toHaveLength(2);
    expect(r.data.skills.find((s) => s.name.toLowerCase() === "excel")!.level).toBe(5);
  });

  it("applicableAutoFixes only returns fixes with a real effect", () => {
    const data = cv({
      personal: { ...createEmptyCVData().personal, photo: "p.jpg" },
      skills: [{ id: "s1", name: "X", level: 3 }, { id: "s2", name: "x", level: 4 }],
    });
    const ids = applicableAutoFixes(data);
    expect(ids).toContain("remove-photo");
    expect(ids).toContain("dedupe-skills");
    expect(ids).not.toContain("normalize-dates"); // no dates at all
  });
});

describe("regression — existing score contract", () => {
  it("atsScore still aggregates the same way", () => {
    const checks = checksFor(cv({}));
    expect(atsScore(checks)).toBeGreaterThanOrEqual(0);
    const full = checksFor(cv({
      personal: { fullName: "A", jobTitle: "Dev", email: "a@b.c", phone: "1", location: "X", linkedin: "li" },
      summary: "x".repeat(80),
      experience: [{ id: "1", company: "C", position: "P", startDate: "2020-01", endDate: "", current: true, description: "Led a team of 5 and increased sales by 30%." }],
      skills: Array.from({ length: 10 }, (_, i) => ({ id: `s${i}`, name: `Skill ${i}`, level: 3 as const })),
    }));
    expect(atsScore(full)).toBeGreaterThan(atsScore(checks));
  });
});
