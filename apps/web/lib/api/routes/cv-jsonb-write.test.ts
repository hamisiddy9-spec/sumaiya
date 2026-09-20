/**
 * THE WRITE-PATH TEST — a CV written through the API must land in the database
 * as a real jsonb OBJECT.
 *
 * Why this test exists (the bug it would have caught)
 * ---------------------------------------------------
 * `npm run seam` walked a guest CV through the product's own migration page and
 * then asked the DATABASE what it held:
 *
 *   row m_6eNPVbdIuUE6OYAY0hff — jsonb_typeof(data) = 'string'
 *   select data->'personal'->>'fullName' from cv …   → NULL
 *
 * on a row that plainly held the name. Writing through the app's own API double
 * encoded the payload (drizzle's jsonb mapper `JSON.stringify`s the value, then
 * postgres-js serialises that *string* again), so the column held a JSON string
 * inside jsonb. Every screen looked right — the JS reader parses the string
 * back — while the database could not query its own content: no server-side
 * report, migration or admin view over CV contents could see anything. A test
 * that only asserts what the API *returns* cannot catch this, because the read
 * path compensates. This one asserts what the write path HANDS the column.
 *
 * The four shapes, probed against the live database:
 *   bare object                        → 'string'  ✗
 *   sql`${obj}::jsonb`                 → 'object'  ✓ objects only
 *   sql`${JSON.stringify(obj)}::jsonb` → 'string'  ✗
 *   sql`${JSON.stringify(obj)}::text::jsonb` → 'object'  ✓ (what jsonbParam does)
 *
 * The end-to-end half of this defect is `scripts/verify-cv-write-shape.mjs`,
 * which POSTs through the real API and asks Postgres for `jsonb_typeof` — a
 * unit test can pin the write path, only a real row can prove the column.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { jsonbParam, jsonbText } from "./cv";

const CV_ROUTE = path.join(path.dirname(fileURLToPath(import.meta.url)), "cv.ts");
const source = readFileSync(CV_ROUTE, "utf8");

const CV_DATA = {
  personal: { fullName: "Asha Mwende", jobTitle: "Warehouse Supervisor" },
  summary: "Five years running warehouse operations.",
  experience: [{ id: "e1", company: "Nala", position: "Supervisor" }],
};

describe("the CV write path stores jsonb, not a string of jsonb", () => {
  it("keeps exactly ONE JSON layer — the second encode is what breaks SQL", () => {
    const text = jsonbText(CV_DATA);
    // One layer: the text parses straight back to the document itself, which is
    // precisely what `data->'personal'->>'fullName'` needs.
    expect(JSON.parse(text)).toEqual(CV_DATA);
    // The bug's output, for contrast: a JSON *string* whose contents are the
    // document. `data->'personal'` on that is NULL.
    const doubleEncoded = JSON.stringify(JSON.stringify(CV_DATA));
    expect(text).not.toBe(doubleEncoded);
    expect(JSON.parse(doubleEncoded)).not.toEqual(CV_DATA); // it is a string
  });

  it("unwraps a legacy JSON-string row instead of copying the broken shape forward", () => {
    // Exactly what a row written before the fix holds (the duplicate path reads
    // one back and re-writes it).
    const legacy = JSON.stringify(CV_DATA);
    expect(jsonbText(legacy)).toBe(JSON.stringify(CV_DATA));
    expect(JSON.parse(jsonbText(legacy))).toEqual(CV_DATA);
    // Unwrapping is idempotent, so calling it on already-encoded text is safe.
    expect(jsonbText(jsonbText(CV_DATA))).toBe(jsonbText(CV_DATA));
  });

  it("jsonbText never invents data — a non-object becomes an empty document", () => {
    expect(jsonbText(undefined)).toBe("{}");
    expect(jsonbText(null)).toBe("{}");
    expect(jsonbText([1, 2])).toBe("[1,2]");
  });

  it("jsonbParam's parameter is JSON TEXT and its SQL carries the ::jsonb cast", () => {
    const fragment = jsonbParam(CV_DATA) as unknown as {
      queryChunks: Array<string | { value?: string[] }>;
    };
    const params = fragment.queryChunks.filter((c): c is string => typeof c === "string");
    const sqlText = fragment.queryChunks
      .filter((c) => typeof c !== "string")
      .flatMap((c) => (c as { value?: string[] }).value ?? [])
      .join("");

    // A bare object here is the whole bug: the driver would re-serialise it.
    expect(params).toEqual([JSON.stringify(CV_DATA)]);
    // Without the cast, Postgres receives a string parameter and stores a
    // jsonb *string* — `::text::jsonb` makes it parse exactly once.
    expect(sqlText).toContain("::text::jsonb");
  });

  it("every jsonb write in the route goes through jsonbParam — no bare object", () => {
    // The exact shapes that were wrong (each one produced jsonb_typeof=string).
    expect(source).not.toMatch(/data:\s*body\.data\b/);
    expect(source).not.toMatch(/data:\s*values\.data\b/);
    expect(source).not.toMatch(/data:\s*source\.data\b/);
    expect(source).not.toMatch(/templateHistory:\s*\[initialTemplateId\]/);
    expect(source).not.toMatch(/templateHistory:\s*nextHistory\b/);
    expect(source).not.toMatch(/templateHistory:\s*withTemplateInHistory\(/);
    // …and the route still writes them (an empty route would pass the above).
    expect(source).toMatch(/data:\s*jsonbParam\(/);
    expect(source).toMatch(/templateHistory:\s*jsonbParam\(/);
  });

  it("covers every write path: create, idempotent upsert, patch and duplicate", () => {
    // POST create (data + templateHistory), the clientId upsert branch
    // (data + templateHistory), PATCH (data + templateHistory), duplicate (data).
    const writes = source.match(/jsonbParam\(/g) ?? [];
    expect(writes.length).toBeGreaterThanOrEqual(7);
  });
});
