/**
 * THE WRITE-PATH TEST for every jsonb column in the string-encoding defect.
 *
 * `cv.data` was fixed first (lib/api/routes/cv-jsonb-write.test.ts). The same
 * stack bug — drizzle's jsonb mapper JSON.stringify's the value and postgres-js
 * serialises that string again — was still live on the columns the CV work
 * order did not cover, measured against the live database on 2026-09-20:
 *
 *   job.corroborated_sources        1204 / 1204 rows jsonb_typeof = 'string'
 *   debug_event.detail               100 / 100
 *   user_profile.career_profile       13 / 13
 *   document_version.snapshot          2 / 2   (a user's CV version history)
 *
 * and 0 of those rows was reachable by SQL: `snapshot->>'title'` was NULL,
 * `jsonb_array_length(corroborated_sources)` threw "cannot get array length of
 * a scalar". The app looked fine because drizzle's own reader JSON.parses the
 * string back — which is why only a test on the WRITE PATH catches this.
 *
 * A test that asserts what the API *returns* cannot: the read path compensates.
 * So each case below pins the exact expression the writer hands the column, and
 * the end-to-end half is scripts/verify-jsonb-write-shape.mjs, which drives the
 * real API and asks real Postgres for `jsonb_typeof`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { jsonbParam, jsonbText } from "@/lib/db/jsonb";
import { jsonbParam as jsonbParamFromCvRoute } from "@/lib/api/routes/cv";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(here, "..");
const read = (rel: string) => readFileSync(path.join(WEB, rel), "utf8");

const CV_ROUTE = read("lib/api/routes/cv.ts");
const INGEST = read("lib/jobs/ingest.ts");
const VERSIONS = read("lib/api/routes/versions.ts");
const PROFILE = read("lib/api/routes/profile.ts");
const SYNC = read("lib/career-profile/sync.ts");
const MOBILE = read("lib/api/routes/mobile.ts");

const SOURCES = [
  ["lib/api/routes/cv.ts", CV_ROUTE],
  ["lib/jobs/ingest.ts", INGEST],
  ["lib/api/routes/versions.ts", VERSIONS],
  ["lib/api/routes/profile.ts", PROFILE],
  ["lib/career-profile/sync.ts", SYNC],
  ["lib/api/routes/mobile.ts", MOBILE],
] as const;

describe("jsonbText / jsonbParam — one JSON layer, always", () => {
  it("keeps exactly ONE JSON layer (the second encode is what breaks SQL)", () => {
    const value = ["remotive", "jobicy"];
    expect(JSON.parse(jsonbText(value))).toEqual(value);
    // The bug's output, for contrast: a JSON *string* whose contents are the
    // array. `jsonb_array_length` on that throws.
    expect(jsonbText(value)).not.toBe(JSON.stringify(JSON.stringify(value)));
  });

  it("unwraps a legacy JSON-string row instead of copying the broken shape forward", () => {
    const profile = { personal: { fullName: "Asha Mwende" } };
    expect(jsonbText(JSON.stringify(profile))).toBe(JSON.stringify(profile));
    expect(jsonbText(JSON.stringify(JSON.stringify(profile)))).toBe(JSON.stringify(profile));
  });

  it("the route still re-exports the shared helper (one implementation, no drift)", () => {
    expect(jsonbParamFromCvRoute).toBe(jsonbParam);
    const fragment = jsonbParam({ title: "My CV" }) as unknown as { queryChunks: Array<string | { value?: string[] }> };
    const sqlText = fragment.queryChunks
      .filter((c) => typeof c !== "string")
      .flatMap((c) => (c as { value?: string[] }).value ?? [])
      .join("");
    // Without `::text`, Postgres receives a string parameter and stores a jsonb
    // string; without `::jsonb` it would not be jsonb at all.
    expect(sqlText).toContain("::text::jsonb");
  });
});

describe("every string-encoded column's writer pins the parameter", () => {
  it("job.corroborated_sources goes through jsonbParam (lib/jobs/ingest.ts)", () => {
    // The insertion path the ingest cron uses for all ~1200 rows.
    expect(INGEST).not.toMatch(/corroboratedSources:\s*corroboratingSources\(/);
    expect(INGEST).toMatch(/corroboratedSources:\s*jsonbParam\(corroboratingSources\(/);
  });

  it("debug_event.detail goes through jsonbParam (lib/api/routes/cv.ts)", () => {
    expect(CV_ROUTE).not.toMatch(/detail:\s*\{\s*path:\s*"\/api\/cv"/);
    expect(CV_ROUTE).toMatch(/detail:\s*jsonbParam\(\{/);
  });

  it("document_version.snapshot goes through jsonbParam (lib/api/routes/versions.ts)", () => {
    expect(VERSIONS).not.toMatch(/snapshot:\s*body\.snapshot\b/);
    expect(VERSIONS).toMatch(/snapshot:\s*jsonbParam\(body\.snapshot\)/);
  });

  it("user_profile.career_profile goes through jsonbParam in every route that writes it", () => {
    // POST + PATCH (wholesale save / interview), the /seed fill-blanks path and
    // the confirmation resolve path.
    expect(PROFILE).not.toMatch(/careerProfile\s*=\s*stampProfileAllFacts\(/);
    expect((PROFILE.match(/careerProfile\s*=\s*jsonbParam\(stampProfileAllFacts\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(PROFILE).not.toMatch(/careerProfile:\s*resolved\b/);
    expect(PROFILE).toMatch(/careerProfile:\s*jsonbParam\(resolved\)/);
    expect(PROFILE).toMatch(/merged\.careerProfile\s*=\s*jsonbParam\(merged\.careerProfile\)/);
  });

  it("the ONE shared CV→profile writer is pinned (lib/career-profile/sync.ts)", () => {
    // CV create/save/import, the assistant's build-cv/build-doc and the Settings
    // backfill all funnel through seedProfileFromCv — fix it here, not per caller.
    expect(SYNC).not.toMatch(/careerProfile:\s*merged\b/);
    expect((SYNC.match(/careerProfile:\s*jsonbParam\(merged\)/g) ?? []).length).toBe(2); // values + onConflictDoUpdate
  });

  it("the native app's save path is pinned too (lib/api/routes/mobile.ts)", () => {
    expect(MOBILE).not.toMatch(/careerProfile:\s*cp\b/);
    expect((MOBILE.match(/careerProfile:\s*jsonbParam\(cp\)/g) ?? []).length).toBe(2);
  });

  it("every one of those writers shares the same helper — no local re-implementation", () => {
    for (const [name, source] of SOURCES) {
      expect(source, name).toMatch(/from\s+"@\/lib\/db\/jsonb"|from\s+"\.\.\/db\/jsonb"/);
    }
    // The helper itself must be the only place that builds the cast. Comments
    // are stripped first — several of them *name* the cast to explain it, and a
    // test that counts prose is not measuring the write path.
    const code = [CV_ROUTE, INGEST, VERSIONS, PROFILE, SYNC, MOBILE]
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    expect(code.match(/::jsonb/g) ?? []).toHaveLength(0);
  });
});
