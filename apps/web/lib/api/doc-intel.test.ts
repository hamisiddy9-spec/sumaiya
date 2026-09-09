import { describe, it, expect } from "vitest";
import { docIntelContext, buildDocIntelPrompt } from "@/lib/api/routes/ai";
import { TRUTH_CONSTRAINT } from "@/lib/api/ai-guardrails";

describe("document intelligence helpers", () => {
  it("builds a compact context from CVData", () => {
    const ctx = docIntelContext({
      personal: { jobTitle: "Software Engineer" },
      summary: "Built web platforms.",
      experience: [{ position: "Dev", company: "TechCo", description: "React apps" }],
      skills: [{ name: "React" }, { name: "TypeScript" }],
    });
    expect(ctx).toContain("Software Engineer");
    expect(ctx).toContain("TechCo");
    expect(ctx).toContain("React");
  });

  it("prefers raw text and handles empty input", () => {
    expect(docIntelContext(undefined, "Hello document")).toBe("Hello document");
    expect(docIntelContext(undefined)).toBe("");
    expect(docIntelContext({})).toBe("");
  });

  it("embeds TRUTH_CONSTRAINT in every content op", () => {
    for (const op of ["summarize", "expand", "shorten", "proofread", "convert", "compare", "structure"]) {
      const p = buildDocIntelPrompt(op, "cv", "Candidate facts here.", "summary", "cover letter", "Other doc.");
      expect(p).toContain(TRUTH_CONSTRAINT);
    }
  });

  it("never allows invented facts in expand — explicit prohibition present", () => {
    const p = buildDocIntelPrompt("expand", "cv", "Facts.");
    expect(p.toLowerCase()).toContain("never add");
  });

  it("threads target and otherText into convert/compare prompts", () => {
    const convert = buildDocIntelPrompt("convert", "cv", "Facts.", undefined, "business card");
    expect(convert).toContain("business card");
    const compare = buildDocIntelPrompt("compare", "cv", "Facts.", undefined, undefined, "OTHER-DOC");
    expect(compare).toContain("OTHER-DOC");
  });
});
