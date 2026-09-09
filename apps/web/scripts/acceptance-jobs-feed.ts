/**
 * REAL-DATA CHECK — jobs feed filters against the real prod DB.
 *
 *   npx tsx --env-file=.env.local scripts/acceptance-jobs-feed.ts
 *
 * Pulls the SAME query /jobs page uses (live jobs, newest first, 100 cap),
 * maps to FeedJob exactly like the page, then exercises every filter/sort/
 * grouping combination against real data:
 *   - default (no filters)  → honest count, never empty
 *   - category, location (incl. remote), min-score, recency, query
 *   - sort: newest / match / closing
 *   - recency grouping: today / thisWeek / earlier — jobs total == filtered total
 *   - impossible combo → EMPTY result (not a crash) — the UI shows the
 *     empty-state with a "clear filters" affordance
 */
import { db, job } from "../lib/db";
import { desc } from "drizzle-orm";
import { liveStatusFilter } from "../lib/jobs/lifecycle";
import {
  filterJobs, sortJobs, groupByRecency, topLocations, topCategories,
  REMOTE_LOCATION, DEFAULT_FILTERS,
  type FeedJob,
} from "../lib/jobs/feed-filter";

function toFeed(j: (typeof job.$inferSelect)): FeedJob {
  return {
    id: j.id, title: j.title, company: j.company, location: j.location,
    category: j.category, employmentType: j.employmentType, description: j.description,
    applyUrl: j.applyUrl, status: j.status, featured: j.featured,
    applicationDeadline: j.applicationDeadline?.toISOString() ?? null,
    sourceName: j.sourceName, createdAt: j.createdAt.toISOString(),
    matchScore: null, missing: [],
  };
}

async function main() {
  console.log("JOBS FEED FILTERS CHECK — real prod data");
  const rows = await db
    .select()
    .from(job)
    .where(liveStatusFilter())
    .orderBy(desc(job.featured), desc(job.createdAt))
    .limit(100);
  const jobs = rows.map(toFeed);
  console.log(`live jobs in feed: ${jobs.length}`);
  if (!jobs.length) { console.log("no live jobs — nothing to exercise"); process.exit(0); }

  let fail = 0;
  const check = (label: string, cond: boolean, got?: unknown) => {
    console.log(`${cond ? "✓" : "✗ FAIL"} ${label}${got !== undefined ? `: ${JSON.stringify(got)}` : ""}`);
    if (!cond) fail++;
  };

  // 0. Default — honest count, must be non-empty (there ARE live jobs).
  const all = filterJobs(jobs, DEFAULT_FILTERS);
  check("default filter returns all live jobs", all.length === jobs.length, all.length);

  // 1. Category filter — pick the most common category, expect a strict subset.
  const cats = topCategories(jobs);
  check("topCategories returns options", cats.length > 0, cats.slice(0, 4));
  if (cats.length > 0) {
    const byCat = filterJobs(jobs, { ...DEFAULT_FILTERS, category: cats[0] });
    check(`category="${cats[0]}" count>0 and honest`, byCat.length > 0 && byCat.every((j) => j.category === cats[0]), byCat.length);
  }

  // 2. Location filter — exact city + remote.
  const locs = topLocations(jobs);
  check("topLocations returns options", locs.length > 0, locs.slice(0, 4));
  const remoteJobs = filterJobs(jobs, { ...DEFAULT_FILTERS, location: REMOTE_LOCATION });
  const realRemote = jobs.filter((j) => /remote|anywhere|worldwide|global/i.test(j.location));
  check("remote filter honest (matches regex count)", remoteJobs.length === realRemote.length, remoteJobs.length);
  const concrete = locs.find((l) => l !== REMOTE_LOCATION);
  if (concrete) {
    const byLoc = filterJobs(jobs, { ...DEFAULT_FILTERS, location: concrete });
    check(`location="${concrete}" honest`, byLoc.length > 0 && byLoc.every((j) => j.location === concrete), byLoc.length);
  }

  // 3. Min-score filter (matchScore null in this harness — use synthetic scores
  // like the page does when a CV is present, then verify the filter math).
  const scored = jobs.map((j, i) => ({ ...j, matchScore: (i * 37) % 100 }));
  const hi = filterJobs(scored, { ...DEFAULT_FILTERS, minScore: "70" as const });
  check("minScore>=70 filter honest", hi.every((j) => (j.matchScore ?? 0) >= 70), hi.length);
  const mid = filterJobs(scored, { ...DEFAULT_FILTERS, minScore: "50" as const });
  check("minScore>=50 is a superset of >=70", mid.length >= hi.length, mid.length);

  // 4. Recency filter.
  const rec7 = filterJobs(jobs, { ...DEFAULT_FILTERS, recency: "7d" as const });
  const cutoff7 = Date.now() - 7 * 86_400_000;
  check("recency 7d honest", rec7.every((j) => new Date(j.createdAt).getTime() >= cutoff7), rec7.length);

  // 5. Query search.
  const q = jobs[0].company.trim().split(/\s+/)[0];
  const qres = filterJobs(jobs, { ...DEFAULT_FILTERS, query: q });
  check(`query="${q}" finds at least 1`, qres.length >= 1, qres.length);

  // 6. Sort orders produce permutations, never drop jobs.
  const n = sortJobs(all, "newest");
  const m = sortJobs(all, "match");
  const c = sortJobs(all, "closing");
  check("newest sort keeps all", n.length === all.length);
  check("match sort keeps all", m.length === all.length);
  check("closing sort keeps all", c.length === all.length);
  check("newest is newest-first", n.length >= 2 ? new Date(n[0].createdAt).getTime() >= new Date(n[1].createdAt).getTime() : true);

  // 7. Recency grouping — every job lands in exactly one group.
  const groups = groupByRecency(n);
  const groupedCount = groups.reduce((acc, g) => acc + g.jobs.length, 0);
  check("recency groups cover every job", groupedCount === n.length, `${groupedCount}/${n.length}`);
  check("groups are labeled", groups.length >= 1 && groups.every((g) => ["today", "thisWeek", "earlier"].includes(g.key)));

  // 8. Impossible combination → empty (UI shows empty-state + clear filters).
  const impossible = filterJobs(jobs, { ...DEFAULT_FILTERS, category: cats[0] ?? "NOPE", minScore: "90" as const });
  check("impossible combo → empty (not crash)", impossible.length === 0, impossible.length);

  console.log(fail ? `\n❌ JOBS FEED FILTERS CHECK FAILED (${fail})` : "\n✅ JOBS FEED FILTERS CHECK PASSED — all filters honest against real data, no empty-state dead-ends.");
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("\n❌ CHECK FAILED:", e.message ?? e);
  process.exit(1);
});
