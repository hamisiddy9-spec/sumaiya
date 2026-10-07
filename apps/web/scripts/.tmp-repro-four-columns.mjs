/**
 * TEMP repro — the four jsonb columns the CV work order left alone.
 * Read-only. Delete after the reproductions are captured.
 */
import postgres from "postgres";

const DB_URL = (process.env.DATABASE_URL ?? "").replace(/\?&?sslmode=[^&]*/g, "");
if (!DB_URL) { console.error("DATABASE_URL required"); process.exit(1); }
const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: { rejectUnauthorized: false } });

const q = async (label, promise) => {
  try { console.log(`\n## ${label}\n${JSON.stringify(await promise, null, 1)}`); }
  catch (e) { console.log(`\n## ${label}\nERROR: ${e.message}`); }
};

// ---- 1. every jsonb column, by shape -------------------------------------
await q("all jsonb columns by jsonb_typeof", (async () => {
  const cols = await sql`select table_name, column_name from information_schema.columns
    where table_schema='public' and data_type='jsonb' order by table_name, column_name`;
  const out = [];
  for (const c of cols) {
    const d = await sql`select jsonb_typeof(${sql(c.column_name)})::text as t, count(*)::int as n
      from ${sql(c.table_name)} group by 1 order by 2 desc`;
    out.push(`${c.table_name}.${c.column_name}: ${d.map((x) => `${x.t ?? "null"}:${x.n}`).join(" ")}`);
  }
  return out;
})());

// ---- 2. per column: sample row, typeof, path query ------------------------
const t1 = sql`select id, jsonb_typeof(corroborated_sources)::text as jtype,
    corroborated_sources->>0 as path_0, jsonb_array_length(corroborated_sources) as arr_len,
    left(corroborated_sources::text, 90) as raw, left(title,40) as title
  from job order by created_at desc limit 3`;
await q("job.corroborated_sources — newest 3", t1.catch((e) => [{ error: e.message }]));

const t2 = sql`select id, kind, jsonb_typeof(detail)::text as jtype, detail->>'path' as path,
    left(detail::text, 90) as raw from debug_event order by created_at desc limit 3`;
await q("debug_event.detail — newest 3", t2.catch((e) => [{ error: e.message }]));

const t3 = sql`select id, jsonb_typeof(career_profile)::text as jtype,
    career_profile->'personal'->>'fullName' as sql_name,
    left(career_profile::text, 70) as raw, updated_at from user_profile
  where career_profile is not null order by updated_at desc nulls last limit 3`;
await q("user_profile.career_profile — newest 3", t3.catch((e) => [{ error: e.message }]));

const t4 = sql`select id, document_id, document_type, title, jsonb_typeof(snapshot)::text as jtype,
    snapshot->>'title' as sql_title, jsonb_typeof(snapshot->'data') as data_type,
    left(snapshot::text, 90) as raw, created_at
  from document_version order by created_at desc limit 5`;
await q("document_version.snapshot — newest 5", t4.catch((e) => [{ error: e.message }]));

// ---- 3. counts -----------------------------------------------------------
await q("counts", (async () => {
  const one = async (t, c) => {
    const [r] = await sql`select count(*)::int as total,
      count(*) filter (where jsonb_typeof(${sql(c)}) = 'string')::int as as_string
      from ${sql(t)}`;
    return `${t}.${c}: ${r.as_string} of ${r.total} string-encoded`;
  };
  return [
    await one("job", "corroborated_sources"),
    await one("debug_event", "detail"),
    await one("user_profile", "career_profile"),
    await one("document_version", "snapshot"),
  ];
})());

// ---- 4. how do the app's readers currently cope with it? -----------------
await q("reader-level: SQL cannot see through the string", (async () => {
  const [r] = await sql`select
    (select count(*)::int from job where corroborated_sources->>0 is not null) as jobs_sql_visible,
    (select count(*)::int from job where corroborated_sources is not null) as jobs_total,
    (select count(*)::int from document_version where snapshot->>'title' is not null) as dv_sql_visible,
    (select count(*)::int from document_version) as dv_total,
    (select count(*)::int from user_profile where career_profile->'personal'->>'fullName' is not null) as up_sql_visible,
    (select count(*)::int from user_profile) as up_total,
    (select count(*)::int from debug_event where detail->>'path' is not null) as dbg_sql_visible,
    (select count(*)::int from debug_event) as dbg_total`;
  return r;
})());

await sql.end({ timeout: 5 });
