import { describe, expect, it } from "vitest";
import { classifyRequirements, isTermMatched, requirementSummary, requirementTerms } from "./requirement-evidence";

describe("requirementTerms", () => {
  it("extracts significant terms and strips stopwords", () => {
    expect(requirementTerms("Experience with SQL and Python")).toEqual(["sql", "python"]);
  });

  it("returns nothing for a pure-stopword phrase (no signal)", () => {
    expect(requirementTerms("Must have experience required")).toEqual([]);
  });
});

describe("isTermMatched", () => {
  it("matches exact terms case-insensitively", () => {
    expect(isTermMatched("SQL", ["sql"])).toBe(true);
    expect(isTermMatched("sql", ["SQL"])).toBe(true);
  });

  it("matches a term inside a longer matched phrase", () => {
    expect(isTermMatched("management", ["Project Management"])).toBe(true);
  });

  it("matches a phrase inside a longer term (rare but honest)", () => {
    expect(isTermMatched("project management", ["Management"])).toBe(true);
  });

  it("does not match unrelated terms", () => {
    expect(isTermMatched("marketing", ["sales"])).toBe(false);
  });
});

describe("classifyRequirements", () => {
  it("marks a requirement detected when all terms are matched", () => {
    const result = classifyRequirements(["SQL and Python"], ["SQL", "Python"]);
    expect(result[0].status).toBe("detected");
    expect(result[0].matchedTerms).toEqual(["sql", "python"]);
    expect(result[0].missingTerms).toEqual([]);
    // detected → no resources (nothing to fix)
    expect(result[0].resources).toEqual([]);
  });

  it("marks a requirement partial when only some terms match", () => {
    const result = classifyRequirements(["Project management and agile"], ["Project Management"]);
    expect(result[0].status).toBe("partial");
    expect(result[0].matchedTerms).toEqual(["project", "management"]);
    expect(result[0].missingTerms).toContain("agile");
    // "agile" has no KB entry → honest empty resources
    expect(result[0].resources).toEqual([]);
  });

  it("marks a requirement missing when no terms match", () => {
    const result = classifyRequirements(["Tableau certification"], ["SQL", "Python"]);
    expect(result[0].status).toBe("missing");
    expect(result[0].matchedTerms).toEqual([]);
    expect(result[0].missingTerms).toEqual(["tableau", "certification"]);
    // "tableau" IS in the KB → real resources, never invented
    expect(result[0].resources.length).toBeGreaterThan(0);
    for (const r of result[0].resources) {
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.provider.length).toBeGreaterThan(0);
    }
  });

  it("reports a no-signal requirement as detected — never claims a gap it cannot prove", () => {
    const result = classifyRequirements(["Must have experience"], ["SQL"]);
    expect(result[0].status).toBe("detected");
    expect(result[0].matchedTerms).toEqual([]);
    expect(result[0].missingTerms).toEqual([]);
    expect(result[0].resources).toEqual([]);
  });

  it("matches terms inside phrases from the matched list", () => {
    const result = classifyRequirements(["Agile development"], ["agile", "development"]);
    expect(result[0].status).toBe("detected");
  });

  it("handles an empty requirement list", () => {
    expect(classifyRequirements([], [])).toEqual([]);
  });

  it("attaches real resources for known gaps — evidence bank is actionable", () => {
    const result = classifyRequirements(["SQL and Python experience"], ["Excel"]);
    const missing = result[0];
    expect(missing.status).toBe("missing");
    expect(missing.resources.length).toBeGreaterThan(0);
    // sql comes first (gap order) and is a REAL provider
    const sqlish = missing.resources.find((r) => r.provider.includes("SQLBolt"));
    expect(sqlish).toBeDefined();
  });
});

describe("requirementSummary", () => {
  it("counts statuses for the summary line", () => {
    const evidence = classifyRequirements(
      ["SQL", "Agile", "Tableau", "Leadership"],
      ["SQL", "Agile", "Team Leadership"]
    );
    expect(requirementSummary(evidence)).toEqual({ total: 4, detected: 3, partial: 0, missing: 1 });
  });
});
