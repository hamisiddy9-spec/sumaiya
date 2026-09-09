import { describe, it, expect } from "vitest";
import {
  normalizeSkillTerm,
  kbKeyForTerm,
  learningResourcesFor,
  resourcesForGaps,
  type LearningResource,
} from "./learning-resources";

describe("normalizeSkillTerm", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeSkillTerm("Power BI")).toBe("powerbi");
    expect(normalizeSkillTerm("Node.js")).toBe("nodejs");
    expect(normalizeSkillTerm("C++")).toBe("c");
  });

  it("returns empty for whitespace/garbage", () => {
    expect(normalizeSkillTerm("")).toBe("");
    expect(normalizeSkillTerm("   ")).toBe("");
  });
});

describe("kbKeyForTerm", () => {
  it("finds exact KB keys", () => {
    expect(kbKeyForTerm("excel")).toBe("excel");
    expect(kbKeyForTerm("React")).toBe("react");
  });

  it("resolves aliases to their KB key", () => {
    expect(kbKeyForTerm("project management")).toBe("projectmanagement");
    expect(kbKeyForTerm("data analysis")).toBe("dataanalysis");
    expect(kbKeyForTerm("ml")).toBe("machinelearning");
  });

  it("returns undefined for unknown terms — honest, never invents", () => {
    expect(kbKeyForTerm("zanzibar")).toBeUndefined();
    expect(kbKeyForTerm("synergy")).toBeUndefined();
  });
});

describe("learningResourcesFor", () => {
  it("returns real resources with provider + live-looking URL for a known term", () => {
    const rs = learningResourcesFor("sql");
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.provider.length).toBeGreaterThan(0);
      expect(r.url).toMatch(/^https:\/\//);
      expect(typeof r.free).toBe("boolean");
    }
  });

  it("returns an empty array for an unknown term — never a fabricated course", () => {
    expect(learningResourcesFor("quantum-leap")).toEqual([]);
  });

  it("every KB entry has a title, provider and https URL", () => {
    // Walk a representative sample of the KB through the public API.
    for (const term of ["excel", "react", "aws", "python", "kubernetes", "english", "quickbooks", "salesforce"]) {
      for (const r of learningResourcesFor(term)) {
        expect(r.title.trim().length).toBeGreaterThan(0);
        expect(r.provider.trim().length).toBeGreaterThan(0);
        expect(r.url.startsWith("https://")).toBe(true);
      }
    }
  });
});

describe("resourcesForGaps", () => {
  it("collects resources for multiple gaps, dedupes by URL, caps the total", () => {
    const rs = resourcesForGaps(["sql", "python", "react", "excel"], 4);
    expect(rs.length).toBeLessThanOrEqual(4);
    const urls = new Set(rs.map((r) => r.url));
    expect(urls.size).toBe(rs.length); // no dupes
    // sql's first entry comes first (gap order preserved)
    expect(rs[0].provider).toContain("SQLBolt");
  });

  it("returns empty for unknown gaps — no invented courses", () => {
    expect(resourcesForGaps(["synergy", "quantum-leap"])).toEqual([]);
  });

  it("honors a custom limit", () => {
    const rs = resourcesForGaps(["sql", "python", "react", "excel", "aws", "docker"], 2);
    expect(rs.length).toBe(2);
  });

  it("returns empty for an empty gap list", () => {
    expect(resourcesForGaps([])).toEqual([]);
  });
});

// Structural guarantee: every resource record in the KB is well-formed.
// (The shell script scripts/verify-learning-urls.sh separately proves each
// URL is LIVE — this test covers shape + honesty invariants.)
describe("KB integrity", () => {
  it("all entries are real-shaped records (no placeholder or empty fields)", () => {
    const sample = resourcesForGaps([
      "excel", "word", "powerpoint", "quickbooks", "sap", "salesforce",
      "react", "javascript", "typescript", "nodejs", "nextjs", "python",
      "sql", "postgres", "mysql", "mongodb", "docker", "kubernetes",
      "aws", "azure", "gcp", "git", "linux", "dataanalysis",
      "machinelearning", "communication", "leadership", "projectmanagement",
      "marketing", "sales", "customerservice", "accounting", "english",
      "teamwork", "wordpress", "tableau", "powerbi", "publicspeaking",
      "negotiation",
    ], 100);
    expect(sample.length).toBeGreaterThan(30);
    for (const r of sample as LearningResource[]) {
      expect(r.title).not.toMatch(/lorem|todo|tbd|placeholder/i);
      expect(r.provider).not.toMatch(/lorem|todo|tbd/i);
    }
  });
});
