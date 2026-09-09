/**
 * Registry contract tests — the resilience guarantees of the aggregation
 * engine:
 *   1. disabled adapter (no key) → skipped silently, run continues
 *   2. throwing adapter → isolated, run continues, other sources still ran
 *   3. normalization: every raw job becomes the canonical shape through the
 *      text.ts pipeline (entities decoded, tags stripped, fields capped)
 *   4. malformed raw job → dropped, source's other jobs survive
 */
import { describe, expect, it } from "vitest";
import { JOB_SOURCE_REGISTRY, normalizeRawJob, runSources } from "./registry";
import type { JobSourceAdapter, RawJob } from "./types";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import { smartrecruitersAdapter } from "./smartrecruiters";
import { adzunaAdapter } from "./adzuna";
import { joobleAdapter } from "./jooble";
import { usajobsAdapter } from "./usajobs";
import { careerjetAdapter } from "./careerjet";
import { talentAdapter } from "./talent";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const GOOD_RAW: RawJob = {
  title: "  Senior React Developer ",
  company: "Acme & Co",
  location: "",
  category: "Software",
  employmentType: "full-time",
  description: "<div>Build <b>React</b> apps &lt;div&gt;fast&lt;/div&gt;.</div>",
  applyUrl: "https://jobs.acme.com/123",
  sourceUrl: "https://jobs.acme.com/123",
  externalId: "abc-123",
  remote: true,
};

function adapter(overrides: Partial<JobSourceAdapter> = {}): JobSourceAdapter {
  return {
    id: "test",
    name: "Test",
    enabled: () => true,
    fetch: async () => [GOOD_RAW],
    ...overrides,
  };
}

// ─── Registry shape ───────────────────────────────────────────────────────────

describe("JOB_SOURCE_REGISTRY", () => {
  it("every adapter satisfies the contract (id/name/enabled/fetch)", () => {
    const ids = new Set<string>();
    for (const a of JOB_SOURCE_REGISTRY) {
      expect(typeof a.id).toBe("string");
      expect(a.id.length).toBeGreaterThan(0);
      expect(typeof a.name).toBe("string");
      expect(typeof a.enabled).toBe("function");
      expect(typeof a.fetch).toBe("function");
      expect(ids.has(a.id)).toBe(false); // unique ids
      ids.add(a.id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(13); // 5 keyless + 3 ATS + 5 key-gated
  });

  it("key-gated adapters are disabled without their env vars (skipped, not broken)", async () => {
    // Clear any accidentally-set env so the test is deterministic.
    for (const k of [
      "ADZUNA_APP_ID", "ADZUNA_API_KEY",
      "JOOBLE_API_KEY",
      "USAJOBS_API_KEY", "USAJOBS_EMAIL",
      "CAREERJET_API_KEY", "CAREERJET_AFFILIATE_ID",
      "TALENT_PUBLISHER_ID", "TALENT_API_KEY",
      "LEVER_COMPANIES",
    ]) delete process.env[k];

    const { jobs, reports } = await runSources([
      adzunaAdapter, joobleAdapter, usajobsAdapter, careerjetAdapter, talentAdapter, leverAdapter,
    ]);
    expect(jobs).toHaveLength(0);
    expect(reports).toHaveLength(6);
    for (const r of reports) {
      expect(r.skipped).toBe(true);
      expect(r.ran).toBe(false);
    }
  });

  it("keyless ATS boards are enabled by default (real public boards)", () => {
    expect(greenhouseAdapter.enabled()).toBe(true);
    expect(smartrecruitersAdapter.enabled()).toBe(true);
  });
});

// ─── runSources isolation ─────────────────────────────────────────────────────

describe("runSources — key-agnostic resilience", () => {
  it("skips a disabled adapter and still runs the enabled ones", async () => {
    const { jobs, reports } = await runSources([
      adapter({ id: "keyed", name: "Keyed", enabled: () => false }),
      adapter({ id: "free", name: "Free" }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(reports).toHaveLength(2);
    expect(reports[0]).toMatchObject({ source: "keyed", skipped: true, ran: false, count: 0 });
    expect(reports[1]).toMatchObject({ source: "free", ran: true, ok: true, count: 1 });
  });

  it("a throwing adapter never breaks the run — others still produce jobs", async () => {
    const { jobs, reports } = await runSources([
      adapter({
        id: "broken",
        name: "Broken",
        fetch: async () => {
          throw new Error("network down");
        },
      }),
      adapter({ id: "fine", name: "Fine" }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(reports[0]).toMatchObject({ source: "broken", ran: true, ok: false, count: 0 });
    expect(reports[0].error).toContain("network down");
    expect(reports[1]).toMatchObject({ source: "fine", ran: true, ok: true, count: 1 });
  });

  it("an enabled() that throws is treated as disabled — never kills the run", async () => {
    const { jobs, reports } = await runSources([
      adapter({
        id: "weird",
        name: "Weird",
        enabled: () => {
          throw new Error("boom");
        },
      }),
      adapter({ id: "fine", name: "Fine" }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(reports[0]).toMatchObject({ source: "weird", skipped: true, ran: false });
    expect(reports[1]).toMatchObject({ source: "fine", ok: true });
  });

  it("a malformed raw job is dropped without killing the source's other jobs", async () => {
    const { jobs, reports } = await runSources([
      adapter({
        id: "mixed",
        name: "Mixed",
        fetch: async () => {
          // One object missing every string field → normalizeRawJob will throw
          // on .toLowerCase() of undefined? No — clean() handles nulls; force
          // a throw with a getter that explodes.
          const bad = {
            ...GOOD_RAW,
            externalId: "bad",
            get title(): string {
              throw new Error("poisoned field");
            },
          };
          return [bad as unknown as RawJob, GOOD_RAW];
        },
      }),
    ]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe("abc-123");
    expect(reports[0].ok).toBe(true);
    expect(reports[0].count).toBe(1);
  });
});

// ─── normalizeRawJob — canonical shape ────────────────────────────────────────

describe("normalizeRawJob — canonical shape through text.ts", () => {
  const adapterFixture = adapter();

  it("cleans HTML/entities in the description (decode → strip → collapse)", () => {
    const n = normalizeRawJob(adapterFixture, GOOD_RAW);
    // <div> and <b> stripped; encoded &lt;div&gt; decoded THEN stripped.
    // Tags become spaces (existing text.ts contract) — no markup survives.
    expect(n.description).toBe("Build React apps fast .");
    expect(n.description).not.toContain("<");
    expect(n.description).not.toContain("div");
  });

  it("trims + collapses whitespace in short fields", () => {
    const n = normalizeRawJob(adapterFixture, GOOD_RAW);
    expect(n.title).toBe("Senior React Developer");
    expect(n.company).toBe("Acme & Co");
  });

  it("location falls back to 'Remote' only when the source marks it remote", () => {
    expect(normalizeRawJob(adapterFixture, { ...GOOD_RAW, location: "", remote: true }).location).toBe("Remote");
    // No location AND not remote → empty, never fabricated
    expect(normalizeRawJob(adapterFixture, { ...GOOD_RAW, location: "", remote: false }).location).toBe("");
    expect(normalizeRawJob(adapterFixture, { ...GOOD_RAW, location: "Nairobi, Kenya" }).location).toBe("Nairobi, Kenya");
  });

  it("sets source/sourceName from the adapter and keeps externalId/sourceUrl/applyUrl", () => {
    const n = normalizeRawJob(adapterFixture, GOOD_RAW);
    expect(n.source).toBe("test");
    expect(n.sourceName).toBe("Test");
    expect(n.externalId).toBe("abc-123");
    expect(n.applyUrl).toBe("https://jobs.acme.com/123");
    expect(n.sourceUrl).toBe("https://jobs.acme.com/123");
  });

  it("defaults employmentType to full-time and passes deadlines through", () => {
    const n = normalizeRawJob(adapterFixture, { ...GOOD_RAW, employmentType: "" });
    expect(n.employmentType).toBe("full-time");
    const withDeadline = normalizeRawJob(adapterFixture, {
      ...GOOD_RAW,
      applicationDeadline: new Date("2026-12-31"),
    });
    expect(withDeadline.applicationDeadline?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
  });

  it("caps description at 4000 chars (cleanHtml max)", () => {
    const n = normalizeRawJob(adapterFixture, { ...GOOD_RAW, description: "x".repeat(9000) });
    expect(n.description.length).toBe(4000);
  });
});
