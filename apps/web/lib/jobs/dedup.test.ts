/**
 * Cross-source dedup tests — the core guarantee: the same real opening from
 * two sources (different ids, slightly different wording) becomes ONE row.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalKey,
  dedupeJobs,
  fuzzyKey,
  fuzzyTitle,
  normalizeDedupText,
} from "./dedup";
import type { NormalizedJob } from "./sources/types";

function job(overrides: Partial<NormalizedJob> & { title: string; company: string }): NormalizedJob {
  return {
    location: "Remote",
    category: "",
    employmentType: "full-time",
    description: "Build things.",
    applyUrl: "https://example.com/apply",
    source: "test",
    sourceName: "Test",
    sourceUrl: "https://example.com/job",
    externalId: "ext-1",
    ...overrides,
  };
}

// ─── Key building ─────────────────────────────────────────────────────────────

describe("canonicalKey / normalizeDedupText", () => {
  it("collapses case, punctuation and whitespace", () => {
    expect(normalizeDedupText("  Senior, React Developer! ")).toBe("senior react developer");
    expect(normalizeDedupText("Acme & Co.")).toBe("acme co");
  });

  it("same posting from two sources → same canonical key", () => {
    const a = canonicalKey({ company: "Acme Inc", title: "Senior React Developer", location: "Remote" });
    const b = canonicalKey({ company: "Acme Inc.", title: "Senior React Developer", location: "remote" });
    expect(a).toBe(b);
  });

  it("different titles at the same company → different keys", () => {
    const a = canonicalKey({ company: "Acme Inc", title: "Senior React Developer", location: "Remote" });
    const b = canonicalKey({ company: "Acme Inc", title: "Backend Engineer", location: "Remote" });
    expect(a).not.toBe(b);
  });

  it("missing company or title → empty key (cannot dedup)", () => {
    expect(canonicalKey({ company: "", title: "Engineer", location: "Remote" })).toBe("");
    expect(canonicalKey({ company: "Acme", title: "", location: "Remote" })).toBe("");
  });
});

describe("fuzzyTitle — near-identical titles", () => {
  it("strips parentheticals and format words", () => {
    expect(fuzzyTitle("Senior React Developer (m/f/d)")).toBe("senior react developer");
    expect(fuzzyTitle("Senior React Developer (Remote)")).toBe("senior react developer");
    expect(fuzzyTitle("Senior React Developer")).toBe("senior react developer");
  });

  it("fuzzyKey ignores the parenthetical difference", () => {
    const a = fuzzyKey({ company: "Acme Inc", title: "Senior React Developer", location: "Remote" });
    const b = fuzzyKey({ company: "Acme Inc", title: "Senior React Developer (m/f/d)", location: "Remote" });
    expect(a).toBe(b);
  });

  it("strips format-noise parentheticals but KEEPS meaningful ones", () => {
    // Format noise (m/f/d, Remote, all genders) → stripped
    expect(fuzzyTitle("DevOps Engineer (m/f/d)")).toBe("devops engineer");
    expect(fuzzyTitle("Account Executive (all genders)")).toBe("account executive");
    expect(fuzzyTitle("Engineer (Remote)")).toBe("engineer");
    // Real signal (Senior/Associate, AI/Backend, Nordics/Italy) → KEPT
    expect(fuzzyTitle("AWS Data Engineer (Senior)")).toBe("aws data engineer senior");
    expect(fuzzyTitle("AWS Data Engineer (Associate)")).toBe("aws data engineer associate");
    expect(fuzzyTitle("Software Engineer (AI)")).not.toBe(fuzzyTitle("Software Engineer (Backend)"));
    expect(fuzzyTitle("Account Executive - Nordics (all genders)")).toContain("nordics");
    expect(fuzzyTitle("Account Executive - Italy (all genders)")).toContain("italy");
  });

  it("keeps plain-hyphen qualifiers AND em-dash qualifiers (conservative dedup)", () => {
    // "- Nordics" / "- Italy" are real qualifiers → must differ
    expect(fuzzyTitle("Account Executive - Nordics")).not.toBe(fuzzyTitle("Account Executive - Italy"));
    // "– Corporate Compliance" is a role qualifier → must NOT be stripped
    // (stripping it would merge "Nominee Director – Corporate Compliance"
    // with "Nominee Director – UK Representation" — different openings)
    expect(fuzzyTitle("Nominee Director – Corporate Compliance")).toContain("corporate compliance");
    expect(fuzzyTitle("Nominee Director – Corporate Compliance")).not.toBe(
      fuzzyTitle("Nominee Director – UK Representation")
    );
    // "— Acme" suffix is NOT stripped either (under-merge is safer than
    // over-merge; company lives in its own field)
    expect(fuzzyTitle("Frontend Engineer — Acme")).toContain("acme");
  });
});

// ─── dedupeJobs — the acceptance test ─────────────────────────────────────────

describe("dedupeJobs — cross-source collapse", () => {
  it("two sources, same job, different ids → ONE row", () => {
    const fromRemotive = job({
      title: "Senior React Developer",
      company: "Acme Inc",
      location: "Remote",
      source: "remotive",
      sourceName: "Remotive",
      externalId: "rm-100",
      applyUrl: "https://remotive.com/jobs/100",
      sourceUrl: "https://remotive.com/jobs/100",
    });
    const fromRemoteOK = job({
      title: "Senior React Developer (Remote)",
      company: "Acme Inc.",
      location: "Remote",
      source: "remoteok",
      sourceName: "RemoteOK",
      externalId: "rok-999",
      applyUrl: "https://remoteok.com/remote-jobs/999",
      sourceUrl: "https://remoteok.com/remote-jobs/999",
    });

    const { jobs, collapsed, corroboratedGroups, corroboration } = dedupeJobs([fromRemotive, fromRemoteOK]);
    expect(jobs).toHaveLength(1); // one canonical row
    expect(collapsed).toBe(1);
    expect(corroboratedGroups).toBe(1);
    // Corroboration records BOTH sources for the canonical key.
    const sources = [...corroboration.values()][0];
    expect(sources.sort()).toEqual(["remoteok", "remotive"]);
  });

  it("keeps the RICHEST description as the canonical winner", () => {
    const thin = job({ title: "React Developer", company: "Acme Inc", externalId: "a", description: "Short JD." });
    const rich = job({ title: "React Developer", company: "Acme Inc", externalId: "b", description: "Long JD. ".repeat(50) });
    const { jobs } = dedupeJobs([thin, rich]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].description).toBe(rich.description);
  });

  it("does NOT collapse genuinely different titles at the same company", () => {
    const dev = job({ title: "React Developer", company: "Acme Inc", externalId: "a" });
    const pm = job({ title: "Project Manager", company: "Acme Inc", externalId: "b" });
    const { jobs, collapsed } = dedupeJobs([dev, pm]);
    expect(jobs).toHaveLength(2);
    expect(collapsed).toBe(0);
  });

  it("does NOT collapse the same title at different companies", () => {
    const a = job({ title: "React Developer", company: "Acme Inc", externalId: "a" });
    const b = job({ title: "React Developer", company: "Globex Corp", externalId: "b" });
    const { jobs, collapsed } = dedupeJobs([a, b]);
    expect(jobs).toHaveLength(2);
    expect(collapsed).toBe(0);
  });

  it("does NOT collapse same title+company at different locations", () => {
    const a = job({ title: "React Developer", company: "Acme Inc", location: "Nairobi, Kenya", externalId: "a" });
    const b = job({ title: "React Developer", company: "Acme Inc", location: "Berlin, Germany", externalId: "b" });
    const { jobs, collapsed } = dedupeJobs([a, b]);
    expect(jobs).toHaveLength(2);
    expect(collapsed).toBe(0);
  });

  it("fuzzy layer collapses parenthetical variants but keeps the richer one", () => {
    const plain = job({ title: "DevOps Engineer", company: "Globex", location: "Remote", externalId: "x1", description: "short" });
    const paren = job({ title: "DevOps Engineer (m/f/d)", company: "Globex", location: "Remote", externalId: "x2", description: "rich description ".repeat(20) });
    const { jobs, collapsed } = dedupeJobs([plain, paren]);
    expect(jobs).toHaveLength(1);
    expect(collapsed).toBe(1);
    expect(jobs[0].externalId).toBe("x2"); // richer one wins
  });

  it("handles a third source corroborating the same posting", () => {
    const a = job({ title: "Data Scientist", company: "Initech", externalId: "1", source: "s1" });
    const b = job({ title: "Data Scientist", company: "Initech", externalId: "2", source: "s2" });
    const c = job({ title: "Data Scientist", company: "Initech", externalId: "3", source: "s3" });
    const { jobs, corroboration, corroboratedGroups } = dedupeJobs([a, b, c]);
    expect(jobs).toHaveLength(1);
    expect(corroboratedGroups).toBe(1);
    const sources = [...corroboration.values()][0].sort();
    expect(sources).toEqual(["s1", "s2", "s3"]);
  });

  it("keeps the RICHEST of THREE exact duplicates (regression: out[-1] drop)", () => {
    // Three sources carry the same posting with INCREASING description
    // quality. The winner must be the richest (c). Before the fix, the stale
    // seenExact entry pointed at the already-replaced record, out.indexOf
    // returned -1, and `out[-1] = c` silently dropped c (a non-element
    // property) — the intermediate record won and the richest JD vanished.
    const a = job({ title: "React Developer", company: "Acme Inc", externalId: "a", source: "s1", description: "X".repeat(100) });
    const b = job({ title: "React Developer", company: "Acme Inc", externalId: "b", source: "s2", description: "Y".repeat(200) });
    const c = job({ title: "React Developer", company: "Acme Inc", externalId: "c", source: "s3", description: "Z".repeat(300) });
    const { jobs, collapsed, corroboration, corroboratedGroups } = dedupeJobs([a, b, c]);
    expect(jobs).toHaveLength(1);
    expect(collapsed).toBe(2);
    expect(jobs[0].externalId).toBe("c");
    expect(jobs[0].description).toBe(c.description);
    // All three sources corroborate the canonical group.
    expect(corroboratedGroups).toBe(1);
    expect([...corroboration.values()][0].sort()).toEqual(["s1", "s2", "s3"]);
    // No phantom array properties from the old out[-1] assignment.
    expect(Object.keys(jobs)).toEqual(["0"]);
  });

  it("richest winner survives mixed exact + fuzzy collisions (regression)", () => {
    // a and c share the exact canonical key; b only fuzzy-collapses with them
    // (parenthetical variant). The richest record overall must win even though
    // the exact map's winner is replaced through the FUZZY layer first.
    const a = job({ title: "DevOps Engineer", company: "Globex", externalId: "a", source: "s1", description: "A".repeat(100) });
    const b = job({ title: "DevOps Engineer (m/f/d)", company: "Globex", externalId: "b", source: "s2", description: "B".repeat(250) });
    const c = job({ title: "DevOps Engineer", company: "Globex", externalId: "c", source: "s3", description: "C".repeat(400) });
    const { jobs, collapsed } = dedupeJobs([a, b, c]);
    expect(jobs).toHaveLength(1);
    expect(collapsed).toBe(2);
    expect(jobs[0].externalId).toBe("c");
    expect(jobs[0].description).toBe(c.description);
  });
});
