/**
 * BEFORE/AFTER for the home-market ordering fix.
 *
 * Runs the exact OLD and NEW ORDER BY against the live database and reports what the
 * LIMIT slice contains in each case. This is the evidence for the change in
 * apps/web/lib/api/routes/jobs.ts — not a re-derivation of it.
 *
 * Note the boundary escape: Postgres uses `\y`, NOT `\b` (which it reads as backspace).
 * The script ASSERTS that the source uses `\y`, so this harness cannot drift from a fix
 * that would silently match nothing.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const WEB = "C:/Users/hamis/projects/sumaiya/apps/web";
const env = readFileSync("C:/Users/hamis/projects/_hdd-data/env/supabase.env", "utf8");
const url = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const { connectOptions } = await import("./lib/db-connect.mjs");
const c = new pg.Client(connectOptions(url));
await c.connect();
const q = async (sql, a = []) => (await c.query(sql, a)).rows;

const ff = readFileSync(`${WEB}/lib/jobs/feed-filter.ts`, "utf8");
const TERMS = [...ff.match(/HOME_MARKET_TERMS\s*=\s*\[(.*?)\]/s)[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
if (!/HOME_MARKET_SQL_PATTERN\s*=\s*`\\\\y\(/.test(ff) && !ff.includes("\\\\y(")) {
  console.error("  ABORT: HOME_MARKET_SQL_PATTERN does not use \\y — the SQL match would never fire");
  process.exit(1);
}
const PATTERN = `\\y(${TERMS.join("|")})\\y`;
// A SEPARATE JS regex for counting: `\y` is Postgres' word boundary and means a literal
// "y" in a JS RegExp, which silently matches nothing. JS uses `\b`. Counting with the
// SQL pattern's syntax is how a correct fix gets reported as a no-op.
const JSRE = new RegExp(`\\b(${TERMS.join("|")})\\b`, "i");
console.log(`  terms from feed-filter.ts: ${TERMS.length}  ·  SQL pattern uses \\y (asserted)`);

const consts = readFileSync(`${WEB}/lib/jobs/constants.ts`, "utf8");
const LIVE = [...consts.match(/LIVE_STATUSES[^=]*=\s*\[(.*?)\]/s)[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);

async function slice(orderBy, params, label) {
  const rows = await q(
    `select title, location, featured, created_at from job
     where status = any($1) order by ${orderBy} limit 100`,
    params
  );
  const tz = rows.filter((r) => JSRE.test(r.location || "")).length;
  console.log(`\n  ${label}`);
  console.log(`    rows in slice: ${rows.length}   Tanzanian: ${tz}   non-Tanzanian: ${rows.length - tz}`);
  for (const r of rows.slice(0, 5)) {
    console.log(`      ${String(r.location || "?").slice(0, 20).padEnd(22)} ${String(r.title || "").slice(0, 46)}`);
  }
  return tz;
}

const [tot] = await q("select count(*)::int n from job where status = any($1)", [LIVE]);
const [tzAll] = await q("select count(*)::int n from job where status = any($1) and location ~* $2", [LIVE, PATTERN]);
console.log(`  live rows: ${tot.n}   of which home-market by location: ${tzAll.n}`);

const before = await slice("featured desc, created_at desc", [LIVE], "BEFORE — order by featured, created_at");
const after = await slice(
  "case when location ~* $2 then 0 else 1 end, featured desc, created_at desc",
  [LIVE, PATTERN],
  "AFTER — home market first, in SQL, before the limit"
);

console.log(`\n  === VERDICT ===`);
console.log(`  home-market listings reachable in the 100-row slice:  ${before}  ->  ${after}   (of ${tzAll.n})`);
await c.end();
