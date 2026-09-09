import { describe, it, expect } from "vitest";
import { createEmptyCVData, type CVData } from "@/types";
import { analyzeSkillGap, buildLearningPlanPrompt, parseLearningPlan } from "@/lib/skill-gap";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

const jd = `Senior React Developer needed. Must know React, TypeScript, Next.js, PostgreSQL, Docker, AWS and GraphQL. Experience with Kubernetes is a plus.`;

const devCv = cv({
  summary: "React developer building web apps with TypeScript and Next.js.",
  skills: [
    { id: "s1", name: "React", level: 4 },
    { id: "s2", name: "TypeScript", level: 3 },
    { id: "s3", name: "Next.js", level: 3 },
    { id: "s4", name: "PostgreSQL", level: 3 },
  ],
});

describe("Skill-gap facts (deterministic, no AI)", () => {
  it("separates strengths (covered) from gaps (missing)", () => {
    const f = analyzeSkillGap(devCv, jd);
    expect(f.strengths).toEqual(expect.arrayContaining(["react", "typescript", "next.js", "postgresql"]));
    expect(f.gaps).toEqual(expect.arrayContaining(["docker", "aws", "kubernetes"]));
    expect(f.gaps.some((g) => g.startsWith("graphql"))).toBe(true);
    expect(f.score).toBeGreaterThan(30);
    expect(f.score).toBeLessThan(100);
  });

  it("learnableGaps ranks real skills and skips noise", () => {
    const f = analyzeSkillGap(devCv, jd);
    expect(f.learnableGaps).toEqual(expect.arrayContaining(["kubernetes", "docker"]));
    expect(f.learnableGaps.some((g) => g.startsWith("graphql"))).toBe(true);
    for (const g of f.learnableGaps) expect(g.length).toBeGreaterThanOrEqual(4);
    expect(f.learnableGaps.length).toBeLessThanOrEqual(8);
  });

  it("resources are REAL courses for known gaps — deterministic, never invented", () => {
    const f = analyzeSkillGap(devCv, jd);
    expect(f.resources.length).toBeGreaterThan(0);
    // docker and aws are in the KB → at least one real resource
    const urls = f.resources.map((r) => r.url);
    expect(urls.some((u) => u.includes("docker.com") || u.includes("freecodecamp.org/news/the-docker-handbook"))).toBe(true);
    for (const r of f.resources) {
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.provider.length).toBeGreaterThan(0);
    }
  });

  it("full coverage → no gaps, score 100, no resources", () => {
    const f = analyzeSkillGap(cv({ skills: jd.split(/\s+/).map((w, i) => ({ id: `s${i}`, name: w, level: 3 })) }), jd);
    expect(f.score).toBe(100);
    expect(f.gaps.length).toBe(0);
    expect(f.resources).toEqual([]);
  });

  it("empty CV → all job terms are gaps", () => {
    const f = analyzeSkillGap(createEmptyCVData(), jd);
    expect(f.strengths.length).toBe(0);
    expect(f.gaps.length).toBeGreaterThan(0);
  });
});

describe("Learning-plan prompt (facts vs recommendation)", () => {
  it("embeds TRUTH_CONSTRAINT", () => {
    const prompt = buildLearningPlanPrompt("React Developer", ["react"], ["aws", "graphql"], "en");
    expect(prompt).toContain(TRUTH_CONSTRAINT);
  });

  it("passes only real gap terms to the model", () => {
    const prompt = buildLearningPlanPrompt(undefined, ["react"], ["aws", "graphql"], "sw");
    expect(prompt).toContain("aws, graphql");
    expect(prompt).toContain("Swahili");
    expect(prompt).not.toContain("react,");
  });
});

describe("parseLearningPlan (defensive)", () => {
  it("parses clean JSON", () => {
    const r = parseLearningPlan(
      '{"plan":[{"step":"Build an AWS project","gap":"aws"}],"summary":"Learn AWS."}',
    );
    expect(r.plan).toHaveLength(1);
    expect(r.plan[0].step).toBe("Build an AWS project");
    expect(r.summary).toBe("Learn AWS.");
  });

  it("tolerates code fences", () => {
    const r = parseLearningPlan('```json\n{"plan":[],"summary":""}\n```');
    expect(r.plan).toHaveLength(0);
  });

  it("returns empty on garbage", () => {
    const r = parseLearningPlan("sorry, no plan");
    expect(r.plan).toHaveLength(0);
    expect(r.summary).toBe("");
  });
});
