/**
 * SEAM TEST — direct Postgres access, for assertions about SERVER state.
 *
 * The whole point of this file: "the screen showed my CV" is not evidence.
 * "There is a row in `cv` for this user id, whose `personal.fullName` equals the
 * string typed into the browser, and whose photo is N bytes" is evidence.
 *
 * READ-ONLY except where the journey itself requires a write (and then only to
 * rows created by this run). Connects with DATABASE_URL from the secrets file —
 * the same role the app uses.
 *
 * A NOTE ON jsonb SHAPE (learned the hard way, see `jsonbShape` below):
 * rows written through the app's own API are stored as a JSON *string inside*
 * jsonb, so `data->'personal'->>'fullName'` returns NULL even though the content
 * is there. Assertions therefore read the raw column and normalise in JS, and
 * the shape itself is asserted separately — a test that "passes" because it
 * silently unwraps the product's bug is not a test.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
// Resolve dependencies from the repo root (npm workspaces hoists them there).
const req = createRequire(path.join(REPO, "package.json"));

export async function openDb(url) {
  const postgres = req("postgres");
  const sql = postgres(url, { max: 1, idle_timeout: 10, connect_timeout: 25 });
  return sql;
}

/** Row counts the seam cares about, with errors kept as data. */
export async function baselineCounts(sql, tables) {
  const out = {};
  for (const t of tables) {
    try {
      const r = await sql`select count(*)::int as n from ${sql(t)}`;
      out[t] = r[0].n;
    } catch (err) {
      out[t] = `ERR ${err.message.slice(0, 60)}`;
    }
  }
  return out;
}

/** Unwrap the JSON-string-inside-jsonb shape the write path produces. */
export function normalizeCvData(raw) {
  let v = raw;
  for (let i = 0; i < 4 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return null; // stored as a string that is not JSON at all
    }
  }
  return v && typeof v === "object" ? v : null;
}

/** Which of the JSON shapes the column holds: "object" is the only healthy one. */
export async function jsonbShape(sql, table = "cv") {
  const rows = await sql`
    select jsonb_typeof(data)::text as jtype, count(*)::int as n
    from ${sql(table)} group by 1 order by n desc`;
  return rows;
}

/** One CV row's raw column plus the facts the journey asserted. */
export async function cvRow(sql, id) {
  const rows = await sql`
    select id, user_id, title, template_id,
           jsonb_typeof(data)::text            as jsonb_type,
           length(data::text)::int             as data_json_bytes,
           data                                as raw_data,
           created_at::text                    as created_at,
           updated_at::text                    as updated_at
    from cv where id = ${id}`;
  const row = rows[0];
  if (!row) return null;
  const data = normalizeCvData(row.raw_data);
  return {
    ...row,
    data,
    full_name: data?.personal?.fullName ?? null,
    job_title: data?.personal?.jobTitle ?? null,
    photo_chars: typeof data?.personal?.photo === "string" ? data.personal.photo.length : 0,
    photo_prefix: typeof data?.personal?.photo === "string" ? data.personal.photo.slice(0, 24) : null,
  };
}

/** CV rows belonging to one user (metadata only — never the photo bytes). */
export async function cvRowsForUser(sql, userId) {
  return sql`
    select id, title, template_id,
           jsonb_typeof(data)::text as jsonb_type,
           length(data::text)::int  as data_json_bytes,
           created_at::text         as created_at
    from cv where user_id = ${userId} order by created_at desc`;
}

/**
 * The live job feed, as the DATABASE sees it. The status list mirrors
 * lib/jobs/constants.ts — written out here on purpose: if the app's list changes,
 * the seam test should notice the numbers move, not silently follow.
 */
export async function jobCounts(sql) {
  const out = { total: null, live: null, byStatus: [], newest: null, oldest: null, error: null };
  try {
    out.total = (await sql`select count(*)::int as n from job`)[0].n;
    out.live = (await sql`select count(*)::int as n from job where status in ('published','expiring')`)[0].n;
    out.byStatus = await sql`select status, count(*)::int as n from job group by status order by n desc`;
    out.newest = (await sql`select max(created_at)::text as newest from job`)[0].newest;
    out.oldest = (await sql`select min(created_at)::text as oldest from job`)[0].oldest;
  } catch (err) {
    out.error = err.message;
  }
  return out;
}

/** Every CV row created during this run window, found by content — used for the
 *  orphan question: a guest who never signs in must leave NO row behind. */
export async function cvsMentioning(sql, needle, sinceIso) {
  return sql`
    select id, user_id, title, created_at::text as created_at
    from cv
    where coalesce(data::text, '') like ${"%" + needle + "%"} and created_at >= ${sinceIso}
    order by created_at desc limit 20`;
}
