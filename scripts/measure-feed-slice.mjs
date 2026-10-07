/**
 * How much does the feed's LIMIT 100 cost a Tanzanian user?
 *
 * The public feed (apps/web/lib/api/routes/jobs.ts) does:
 *   .where(inArray(job.status, LIVE_STATUSES))
 *   .orderBy(desc(job.featured), desc(job.createdAt))
 *   .limit(100)
 * then re-orders ONLY those rows for the home market (homeMarketFirst).
 *
 * So the 100 rows are chosen by FEATURED-then-NEWEST, and the home-market pass can
 * only promote Tanzanian rows that happen to be inside that slice. This measures how
 * many live Tanzanian jobs sit outside it and can therefore never be shown.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync("C:/Users/hamis/projects/_hdd-data/env/supabase.env", "utf8");
const url = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!url) { console.error("no DATABASE_URL"); process.exit(1); }

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (sql, args = []) => (await c.query(sql, args)).rows;

const [tot] = await q("select count(*)::int n from job");
console.log(`  total job rows: ${tot.n}`);

const byStatus = await q("select status, count(*)::int n from job group by status order by n desc");
console.log("  by status:");
for (const r of byStatus) console.log(`    ${String(r.status).padEnd(14)} ${r.n}`);

// LIVE_STATUSES lives in lib/jobs/constants.ts — jobs.ts only IMPORTS it, and grepping
// the importing file captured an unrelated array. Read the real definition.
const consts = readFileSync("C:/Users/hamis/projects/sumaiya/apps/web/lib/jobs/constants.ts", "utf8");
const m = consts.match(/LIVE_STATUSES[^=]*=\s*\[(.*?)\]/s);
const live = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : ["published"];
console.log(`  LIVE_STATUSES (from constants.ts): ${live.join(", ")}`);

const TZ = /tanzania|dar es salaam|dar-es-salaam|arusha|mwanza|dodoma|morogoro|zanzibar|mbeya|tanga|kilimanjaro|moshi|tanzanian/i;

const liveRows = await q(
  `select id, title, company, location, featured, created_at from job where status = any($1)`,
  [live]
);
console.log(`\n  LIVE rows: ${liveRows.length}`);
const tzLive = liveRows.filter((r) => TZ.test(`${r.location || ""} ${r.title || ""} ${r.company || ""}`));
console.log(`  LIVE rows that are Tanzanian (by location/title/company): ${tzLive.length}`);

// The exact slice the feed returns: featured desc, created_at desc, limit 100.
const slice = [...liveRows]
  .sort((a, b) => (Number(b.featured) - Number(a.featured)) || (new Date(b.created_at) - new Date(a.created_at)))
  .slice(0, 100);
const sliceTz = slice.filter((r) => TZ.test(`${r.location || ""} ${r.title || ""} ${r.company || ""}`));
console.log(`\n  THE FEED'S SLICE (featured desc, created_at desc, LIMIT 100):`);
console.log(`    rows in slice        : ${slice.length}`);
console.log(`    Tanzanian in slice   : ${sliceTz.length}`);
console.log(`    Tanzanian OUTSIDE it : ${tzLive.length - sliceTz.length}  <- can never be shown`);
if (tzLive.length) {
  const pct = ((tzLive.length - sliceTz.length) / tzLive.length) * 100;
  console.log(`    i.e. ${pct.toFixed(1)}% of live Tanzanian jobs are unreachable in the feed`);
}
const oldest = slice.length ? slice[slice.length - 1].created_at : null;
console.log(`    the slice's oldest row: ${oldest ? new Date(oldest).toISOString().slice(0, 10) : "n/a"}`);

await c.end();
