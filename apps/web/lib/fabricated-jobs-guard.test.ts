/**
 * NO FABRICATED JOBS ON THE PUBLIC DOMAIN.
 *
 * `app/api/jobs/feed/route.ts` served a hardcoded `MOCK_JOBS` array — eight
 * invented listings for invented employers (Kilimanjaro Retail Ltd, Jangwani
 * Telecom, Mwananchi Foods, Bora Logistics, St. Joseph Academy, Zanzibar Beach
 * Resort, "Kenya Logistics Hub" in NAIROBI) as a PUBLIC `POST /api/jobs/feed`
 * endpoint, with nothing in the response marking them as samples. It was the
 * same class of defect as the fabricated testimonials already removed from the
 * landing page, and the repo's own seam prober had flagged it ("TWO FEEDS, TWO
 * TRUTHS"): the real feed serves the database's rows.
 *
 * The route file was deleted on 2026-09-21. This test is the tripwire against
 * a hardcoded feed coming back: the endpoint path must not resolve to a file,
 * and none of the invented employer names may reappear in shipped source.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, extname, resolve } from "path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = resolve(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".next", ".claude", "__tests__"]);

// The invented employers the feed shipped, minus one: "Kilimanjaro Retail Ltd"
// is deliberately NOT listed here because it is also the sample CV's employer
// (lib/sample-cv.ts:42, and the same sample business card / cover letter in
// components/template-gallery-client.tsx) — legitimate, clearly-labelled sample
// content for the template previews, not a job listing. Every name below was
// unique to the hardcoded feed.
const INVENTED_EMPLOYERS = [
  "Jangwani Telecom",
  "Mwananchi Foods",
  "Bora Logistics",
  "St. Joseph Academy",
  "Zanzibar Beach Resort",
  "Kenya Logistics Hub",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if ([".ts", ".tsx"].includes(extname(entry)) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("the fabricated job feed", () => {
  it("is gone — no route file serves POST /api/jobs/feed", () => {
    expect(existsSync(join(WEB_ROOT, "app/api/jobs/feed/route.ts"))).toBe(false);
    expect(existsSync(join(WEB_ROOT, "app/api/jobs/feed"))).toBe(false);
  });

  it("leaves no hardcoded listing array behind anywhere in shipped source", () => {
    const files = ["lib", "components", "app"].flatMap((d) => walk(join(WEB_ROOT, d)));
    expect(files.length).toBeGreaterThan(200); // the scan really walked the app
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of INVENTED_EMPLOYERS) {
        if (text.includes(name)) offenders.push(`${file.replace(WEB_ROOT, "")} :: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the real feed: the hono jobs route still serves the database's rows", () => {
    const routes = readFileSync(join(WEB_ROOT, "lib/api/routes/jobs.ts"), "utf8");
    expect(routes).toContain('.get("/"');
    // and no hardcoded array anywhere in it
    expect(routes).not.toContain("MOCK_JOBS");
  });
});
