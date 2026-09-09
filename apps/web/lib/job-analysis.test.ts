// Job-analysis engine tests — deterministic, no AI, no DB.
import { describe, expect, it } from "vitest";
import {
  analyzeJob,
  rankExperienceForJob,
  rankSkillsForJob,
  type JobAnalysis,
} from "./job-analysis";

const JD = `Frontend Engineer

About the role: We are looking for a full-time Frontend Engineer to build customer-facing dashboards.

Responsibilities:
- Build responsive interfaces with React and TypeScript
- Integrate REST APIs and write unit tests

Requirements:
- 5+ years of experience with React and JavaScript
- Experience with Git and deploying to Vercel

How to apply: send your CV to careers@example.com`;

describe("analyzeJob", () => {
  it("extracts title, skills, seniority, employment type and keywords", () => {
    const a = analyzeJob(JD);
    expect(a.title).toMatch(/frontend engineer/i);
    expect(a.skills).toContain("react");
    expect(a.skills).toContain("typescript");
    expect(a.seniority).toBe("senior");
    expect(a.employmentType).toBe("full-time");
    expect(a.keywords.length).toBeGreaterThan(0);
  });

  it("empty JD → graceful defaults, never throws", () => {
    const a = analyzeJob("");
    expect(a.title).toBe("");
    expect(a.skills).toEqual([]);
    expect(a.keywords).toEqual([]);
    expect(a.seniority).toBe("unstated");
    expect(a.employmentType).toBe("unstated");
  });
});

describe("rankSkillsForJob — malformed input edge cases", () => {
  const analysis: JobAnalysis = analyzeJob(JD);

  it("a skill entry WITHOUT a name does not crash the sort (regression)", () => {
    // parseCvLoose accepts client-supplied cv objects verbatim, so a sloppy
    // guest CV can carry { id, level } with no name. Before the fix this
    // threw `Cannot read properties of undefined (reading 'toLowerCase')`
    // inside snapMatch → a 500 on /api/ai/snap.
    const skills = [
      { id: "s1", name: "React", level: 3 },
      { id: "s2", level: 2 } as { id: string; name: string; level: number },
    ];
    expect(() => rankSkillsForJob(skills, analysis)).not.toThrow();
    const ranked = rankSkillsForJob(skills, analysis);
    expect(ranked).toHaveLength(2);
  });

  it("a nameless skill never ranks as a JD hit (empty name is not a term)", () => {
    // jdLower.includes("") is ALWAYS true — without the empty-name guard a
    // nameless skill would sort to the top as a "hit" and pollute the
    // reordered CV with a blank first skill.
    const skills = [
      { id: "s1", name: "React", level: 3 },
      { id: "s2", name: "", level: 2 },
    ];
    const ranked = rankSkillsForJob(skills, analysis);
    // React (hit) must come first; the nameless entry sinks to the bottom.
    expect(ranked[0].id).toBe("s1");
    expect(ranked[1].id).toBe("s2");
  });

  it("empty skills array → empty result, no throw", () => {
    expect(rankSkillsForJob([], analysis)).toEqual([]);
  });
});

describe("rankExperienceForJob", () => {
  it("empty experience → empty result, no throw", () => {
    expect(rankExperienceForJob([], analyzeJob(JD))).toEqual([]);
  });

  it("keeps all entries and orders by JD keyword coverage", () => {
    const exp = [
      { id: "e1", company: "Acme", position: "Accountant", description: "Payroll and tax returns." },
      { id: "e2", company: "Globex", position: "Frontend Engineer", description: "Built React dashboards and REST APIs." },
    ];
    const ranked = rankExperienceForJob(exp, analyzeJob(JD));
    expect(ranked).toHaveLength(2);
    expect(ranked[0].id).toBe("e2"); // matches React / REST / dashboards
  });
});
