import { describe, it, expect } from "vitest";
import { createEmptyCVData, type CVData } from "@/types";
import { compareCvs, buildCvComparePrompt } from "@/lib/cv-compare";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

const jd = `Senior React Developer needed. Must know React, TypeScript, Next.js, PostgreSQL, Docker, AWS and GraphQL.`;

const reactCv = cv({
  personal: { ...createEmptyCVData().personal, fullName: "Ali" },
  summary: "React developer with Next.js and PostgreSQL.",
  skills: [
    { id: "s1", name: "React", level: 4 },
    { id: "s2", name: "TypeScript", level: 3 },
    { id: "s3", name: "Next.js", level: 3 },
    { id: "s4", name: "PostgreSQL", level: 3 },
  ],
});

const excelCv = cv({
  personal: { ...createEmptyCVData().personal, fullName: "Babu" },
  summary: "Accountant who loves Excel and bookkeeping.",
  skills: [
    { id: "s1", name: "Excel", level: 4 },
    { id: "s2", name: "QuickBooks", level: 3 },
  ],
});

describe("CV comparison facts (deterministic, no AI)", () => {
  it("scores both CVs against the job and picks the deterministic winner", () => {
    const f = compareCvs(reactCv, excelCv, jd);
    expect(f.scored).toBe(true);
    expect(f.a?.score).toBeGreaterThan(f.b?.score ?? 0);
    expect(f.winner).toBe("a");
  });

  it("reports skills only in A / only in B / shared", () => {
    const f = compareCvs(reactCv, excelCv);
    expect(f.onlyA).toContain("react");
    expect(f.onlyB).toContain("excel");
    expect(f.onlyB).toContain("quickbooks");
    expect(f.scored).toBe(false);
  });

  it("ties when scores are equal", () => {
    const same = compareCvs(reactCv, cv({ ...reactCv, personal: { ...reactCv.personal, fullName: "Other" } }), jd);
    expect(same.winner).toBe("tie");
  });

  it("empty job description → structural mode, not scored", () => {
    const f = compareCvs(reactCv, excelCv, "  ");
    expect(f.scored).toBe(false);
    expect(f.winner).toBeUndefined();
  });
});

describe("CV comparison prompt (facts vs interpretation)", () => {
  it("embeds TRUTH_CONSTRAINT", () => {
    const p = buildCvComparePrompt(reactCv, excelCv, compareCvs(reactCv, excelCv, jd), "en");
    expect(p).toContain(TRUTH_CONSTRAINT);
  });

  it("passes the deterministic scores as facts", () => {
    const facts = compareCvs(reactCv, excelCv, jd);
    const p = buildCvComparePrompt(reactCv, excelCv, facts, "en");
    expect(p).toContain(`${facts.a?.score}%`);
    expect(p).toContain(`${facts.b?.score}%`);
    expect(p).toContain("react");
    expect(p).toContain("excel");
  });
});
