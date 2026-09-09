import { describe, it, expect } from "vitest";
import { analyzeJob, rankSkillsForJob, rankExperienceForJob } from "@/lib/job-analysis";
import { buildTargetedCv } from "@/lib/targeted-cv";
import { createEmptyCareerProfile, type CareerProfile } from "@/types";

const JD = `Senior Software Engineer — Full-time
We are looking for a Senior Software Engineer with 5+ years of experience with
React, Node.js, TypeScript and PostgreSQL. Experience with AWS and Docker is a
plus. Must have a Bachelor's degree in Computer Science or related field.
Responsibilities: build and scale our payments platform, mentor junior engineers.
Apply if you are passionate about clean code and agile delivery.`;

describe("analyzeJob", () => {
  it("extracts title, skills, seniority, employment type, keywords", () => {
    const a = analyzeJob(JD);
    expect(a.title).toContain("Senior Software Engineer");
    expect(a.skills).toEqual(expect.arrayContaining(["react", "node", "typescript", "postgresql"]));
    expect(a.seniority).toBe("senior");
    expect(a.employmentType).toBe("full-time");
    expect(a.keywords.length).toBeGreaterThan(10);
    expect(a.requirements.length).toBeGreaterThan(0);
  });

  it("falls back to a supplied title", () => {
    expect(analyzeJob("no title here at all", "Backend Dev").title).toBe("Backend Dev");
  });

  it("handles empty JDs without crashing", () => {
    const a = analyzeJob("");
    expect(a.skills).toEqual([]);
    expect(a.seniority).toBe("unstated");
    expect(a.employmentType).toBe("unstated");
  });

  it("detects junior + internship", () => {
    const jr = analyzeJob("Junior Data Entry Clerk Internship — part-time");
    expect(jr.seniority).toBe("junior");
    expect(jr.employmentType).toBe("internship");
  });
});

describe("rankSkillsForJob", () => {
  it("puts matching skills first", () => {
    const skills = [
      { id: "1", name: "Cooking", level: 5 },
      { id: "2", name: "React", level: 2 },
      { id: "3", name: "TypeScript", level: 3 },
    ];
    const a = analyzeJob("We need React and TypeScript developers.");
    const ranked = rankSkillsForJob(skills, a);
    expect(ranked[0].name).toBe("React");
    expect(ranked[1].name).toBe("TypeScript");
    expect(ranked[2].name).toBe("Cooking");
  });
});

describe("rankExperienceForJob", () => {
  it("reorders entries by keyword coverage", () => {
    const exp = [
      { id: "1", company: "Cafe", position: "Chef", description: "Cooked food daily." },
      { id: "2", company: "TechCo", position: "Dev", description: "Built React apps with TypeScript and PostgreSQL." },
    ];
    const a = analyzeJob("React TypeScript PostgreSQL developer");
    const ranked = rankExperienceForJob(exp, a);
    expect(ranked[0].id).toBe("2");
  });
});

// ─── buildTargetedCv ─────────────────────────────────────────────────────────

function profile(partial: Partial<CareerProfile>): CareerProfile {
  return { ...createEmptyCareerProfile(), ...partial };
}

const richProfile = profile({
  personal: { fullName: "Jane", jobTitle: "Software Engineer", email: "j@x.com", phone: "1", location: "Dar" },
  summary: "Software engineer with 5+ years building web platforms with React, Node.js and PostgreSQL.",
  skills: [
    { id: "s1", name: "Cooking", level: 5 },
    { id: "s2", name: "React", level: 4 },
    { id: "s3", name: "Node.js", level: 3 },
    { id: "s4", name: "TypeScript", level: 3 },
    { id: "s5", name: "PostgreSQL", level: 3 },
  ],
  experience: [
    { id: "e1", company: "Cafe", position: "Chef", startDate: "2018-01", endDate: "2020-01", current: false, description: "Cooked food daily for a busy cafe." },
    { id: "e2", company: "TechCo", position: "Software Engineer", startDate: "2020-01", endDate: "", current: true, description: "Built and scaled React and Node.js services on PostgreSQL." },
  ],
});

describe("buildTargetedCv", () => {
  it("returns real before/after scores from the engine", () => {
    const r = buildTargetedCv(richProfile, JD);
    expect(r.before.score).toBeGreaterThanOrEqual(0);
    expect(r.after.score).toBeGreaterThanOrEqual(0);
    expect(r.before.matched).toBeDefined();
    expect(r.after.matched).toBeDefined();
  });

  it("reorders skills and experience around the job", () => {
    const r = buildTargetedCv(richProfile, JD);
    expect(r.cv.skills[0].name).toBe("React"); // matches JD, level 4
    expect(r.cv.experience[0].id).toBe("e2"); // TechCo entry covers more JD terms
  });

  it("never invents facts — output equals profile facts in a new order", () => {
    const r = buildTargetedCv(richProfile, JD);
    const skillNames = r.cv.skills.map((s) => s.name.toLowerCase()).sort();
    expect(skillNames).toEqual(["cooking", "node.js", "postgresql", "react", "typescript"]);
    // No new employers, no fabricated metrics.
    expect(r.cv.experience.map((e) => e.company)).toEqual(["TechCo", "Cafe"]);
  });

  it("flags requirements for confirmation instead of auto-adding", () => {
    const r = buildTargetedCv(richProfile, JD);
    expect(r.toConfirm.length).toBeGreaterThan(0);
    // The requirement mentions a degree — surfaced, not injected into the CV.
    const cvText = JSON.stringify(r.cv).toLowerCase();
    expect(cvText).not.toContain("bachelor");
  });

  it("explains the delta in plain language", () => {
    const r = buildTargetedCv(richProfile, JD);
    expect(r.explanation.length).toBeGreaterThan(0);
    expect(r.explanation.join(" ").length).toBeGreaterThan(20);
  });

  it("handles an empty profile + long JD without crashing", () => {
    const longJd = JD + "\n" + JD + "\n" + JD;
    const r = buildTargetedCv(createEmptyCareerProfile(), longJd);
    expect(r.cv.skills).toEqual([]);
    expect(r.before.score).toBe(0);
    expect(r.after.score).toBe(0);
  });

  it("handles an incomplete profile (missing sections)", () => {
    const thin = profile({ personal: { fullName: "A", jobTitle: "", email: "", phone: "", location: "" } });
    const r = buildTargetedCv(thin, JD);
    expect(Array.isArray(r.cv.experience)).toBe(true);
    expect(r.cv.personal.fullName).toBe("A");
  });
});
