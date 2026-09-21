/**
 * Where does "Tanzania" actually live in the job table?
 *
 * The home-market predicate matches on job.location only. Before fixing the SQL pattern
 * I need to know whether Tanzanian listings even HAVE a Tanzanian location string, or
 * whether the word lives in company / source / title instead — because if it is not in
 * `location`, then no amount of ordering fixes the feed.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync("C:/Users/hamis/projects/_hdd-data/env/supabase.env", "utf8");
const url = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (sql, a = []) => (await c.query(sql, a)).rows;

const consts = readFileSync("C:/Users/hamis/projects/sumaiya/apps/web/lib/jobs/constants.ts", "utf8");
const LIVE = [...consts.match(/LIVE_STATUSES[^=]*=\s*\[(.*?)\]/s)[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);

console.log("  === WHERE THE WORD 'tanzania' APPEARS (live rows only) ===");
for (const col of ["location", "company", "source_name", "title"]) {
  const [r] = await q(`select count(*)::int n from job where status = any($1) and ${col} ilike '%tanzania%'`, [LIVE]);
  console.log(`    ${col.padEnd(14)} ${r.n}`);
}

console.log("\n  === location values, most common (live, top 15) ===");
for (const r of await q(
  `select coalesce(location,'(null)') loc, count(*)::int n from job where status = any($1)
   group by 1 order by n desc limit 15`, [LIVE]
)) console.log(`    ${String(r.loc).slice(0, 34).padEnd(36)} ${r.n}`);

console.log("\n  === rows whose COMPANY or SOURCE mentions Tanzania — what is their location? ===");
for (const r of await q(
  `select title, company, location, source_name from job
   where status = any($1) and (company ilike '%tanzania%' or source_name ilike '%tanzania%')
   limit 10`, [LIVE]
)) console.log(`    loc=${String(r.location).slice(0, 20).padEnd(22)} src=${String(r.source_name).slice(0, 16).padEnd(18)} ${String(r.company).slice(0, 26)}`);

console.log("\n  === source_name distribution (where the feed actually comes from) ===");
for (const r of await q(
  `select coalesce(source_name,'(null)') s, count(*)::int n from job where status = any($1)
   group by 1 order by n desc limit 12`, [LIVE]
)) console.log(`    ${String(r.s).slice(0, 32).padEnd(34)} ${r.n}`);

console.log("\n  === does a Postgres word boundary work at all? ===");
const [a] = await q(`select count(*)::int n from job where status = any($1) and location ~* '\\b(tanzania)\\b'`, [LIVE]);
const [b] = await q(`select count(*)::int n from job where status = any($1) and location ~* '\\y(tanzania)\\y'`, [LIVE]);
const [d] = await q(`select count(*)::int n from job where status = any($1) and location ~* '(tanzania)'`, [LIVE]);
console.log(`    with \\b : ${a.n}   <- JS syntax, NOT a word boundary in Postgres`);
console.log(`    with \\y : ${b.n}   <- Postgres' own word boundary`);
console.log(`    bare    : ${d.n}`);
await c.end();
