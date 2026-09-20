/**
 * DATA REPAIR — unwrap every jsonb row stored as a JSON *string* inside jsonb.
 *
 * The write paths are fixed (lib/db/jsonb.ts → `jsonbParam`), but every row
 * written before them still holds
 *
 *   data :: jsonb = '"{\"personal\":{\"fullName\":\"Asha\"}}"'   -- jsonb_typeof = 'string'
 *
 * instead of the object. SQL jsonb operators return NULL (or throw) on those
 * rows — `data->'personal'->>'fullName'` is NULL, `jsonb_array_length
 * (corroborated_sources)` errors with "cannot get array length of a scalar" —
 * so any report, migration, admin view, index or RLS policy over these columns
 * reads them as empty. The app looked correct throughout because drizzle's own
 * reader JSON.parses the string back, which is exactly why this had to be
 * repaired in the data, not just in the code.
 *
 * Started as the CV-only repair; the defect is a property of the STACK, not of
 * one table, so it now covers every column the audit found string-encoded:
 *   cv.data · cv.template_history · job.corroborated_sources ·
 *   document_version.snapshot (a user's CV version history) ·
 *   user_profile.career_profile · debug_event.detail
 *
 * Dry run (default) reports what WOULD change; `--apply` writes it. Idempotent:
 * a repaired row no longer matches `jsonb_typeof(...) = 'string'` and is skipped
 * on the next run.
 *
 *   node --env-file=C:/Users/hamis/projects/_hdd-data/env/supabase.env \
 *     apps/web/scripts/repair-jsonb-strings.mjs [--apply]
 *
 * The UPDATE is pure SQL (`(col #>> '{}')::jsonb`) — no value is passed as a
 * parameter, so no driver can re-encode it — and a candidate is only updated
 * after Node has confirmed its inner text parses as a JSON object/array. A
 * string that is NOT valid JSON is left exactly as it is and reported. Each
 * write is then re-read and compared to what the row held BEFORE (jsonb
 * equality, not text form), so a repair that changed content is reported rather
 * than silently accepted.
 *
 * Out of scope (and reported, not touched): any OTHER jsonb column in the
 * schema still holding a string. `scripts/audit-jsonb-shapes.ts` lists them;
 * they need their own write paths fixed and their readers checked first.
 */
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const DB_URL = (process.env.DATABASE_URL ?? "").replace(/\?&?sslmode=[^&]*/g, "");
if (!DB_URL) {
  console.error("DATABASE_URL is required (use --env-file=…).");
  process.exit(1);
}

const TABLES = [
  { table: "cv", columns: ["data", "template_history"] },
  { table: "job", columns: ["corroborated_sources"] },
  { table: "document_version", columns: ["snapshot"] },
  { table: "user_profile", columns: ["career_profile"] },
  { table: "debug_event", columns: ["detail"] },
];

const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: { rejectUnauthorized: false } });

/**
 * "The database can query its own content" — one definition for every shape:
 * an array with entries, or a non-empty object. A jsonb *string* fails both,
 * which is the defect. (`jsonb_array_length` throws on a scalar, so the type is
 * checked first rather than letting the whole audit die on one row.)
 */
const SQL_VISIBLE = (c) => `case
    when jsonb_typeof(${c}) = 'array' then jsonb_array_length(${c}) > 0
    when jsonb_typeof(${c}) = 'object' then ${c}::text not in ('{}', '[]')
    else false end`;

let repaired = 0;
const failures = [];
const skippedSamples = [];

/**
 * A value's canonical form for comparison: jsonb reorders object keys and
 * reformats numbers, so comparing raw text would report false mismatches.
 * Sorting keys recursively makes the BEFORE text and the AFTER text comparable
 * as VALUES.
 */
function canonical(text) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
    }
    return v;
  };
  try {
    return JSON.stringify(sort(JSON.parse(text)));
  } catch {
    return String(text);
  }
}

try {
  for (const { table, columns } of TABLES) {
    for (const column of columns) {
      const before = (await sql`
        select count(*)::int as n from ${sql(table)} where jsonb_typeof(${sql(column)}) = 'string'`)[0].n;

      const [visibleBefore] = await sql.unsafe(
        `select count(*)::int as n from "${table}" where ${SQL_VISIBLE(`"${column}"`)}`,
      );

      if (before === 0) {
        console.log(`${table}.${column}: nothing to repair (0 rows stored as a string)`);
        continue;
      }

      // Every candidate is read back as TEXT and validated in Node first: only
      // a string whose contents are a real JSON object/array may be rewritten.
      // `#>> '{}'` returns the string's own text with no JSON quoting.
      const rows = await sql`
        select id, (${sql(column)} #>> '{}') as text
        from ${sql(table)} where jsonb_typeof(${sql(column)}) = 'string'`;

      const rewritable = [];
      for (const row of rows) {
        let parsed;
        try {
          parsed = JSON.parse(row.text);
        } catch {
          if (skippedSamples.length < 3) skippedSamples.push(`${table}.${column} ${row.id}: not valid JSON`);
          continue;
        }
        if (!parsed || typeof parsed !== "object") {
          if (skippedSamples.length < 3) skippedSamples.push(`${table}.${column} ${row.id}: not an object/array`);
          continue;
        }
        rewritable.push({ id: row.id, text: row.text });
      }

      console.log(
        `${table}.${column}: ${before} row(s) stored as a jsonb string · ` +
        `${rewritable.length} hold a JSON object/array · SQL-visible before: ${visibleBefore.n}`,
      );
      if (!APPLY) {
        console.log(`  dry run — re-run with --apply to rewrite them`);
        continue;
      }

      // Chunked, not one statement per row: 1,200 jobs × 3 round trips through
      // the pooler is minutes of latency, and the write is the same statement
      // either way. The value never travels as a parameter — only the id list
      // does — so no driver can re-encode the JSON.
      const CHUNK = 250;
      for (let i = 0; i < rewritable.length; i += CHUNK) {
        const chunk = rewritable.slice(i, i + CHUNK);
        const ids = chunk.map((r) => r.id);
        try {
          const updated = await sql`
            update ${sql(table)} set ${sql(column)} = (${sql(column)} #>> '{}')::jsonb
            where id = any(${ids}::text[]) and jsonb_typeof(${sql(column)}) = 'string'
            returning id, (${sql(column)})::text as after`;
          const before = new Map(chunk.map((r) => [r.id, r.text]));
          for (const row of updated) {
            // Faithfulness: what the row holds now must EQUAL what it held
            // before, compared value-by-value (jsonb key order and number
            // formatting are canonicalised), not by text form.
            if (canonical(before.get(row.id)) !== canonical(row.after)) {
              failures.push(`${table}.${column} ${row.id}: value differs after repair — INVESTIGATE`);
              continue;
            }
            repaired += 1;
          }
          // A candidate the UPDATE did not return was already repaired by a
          // concurrent run — idempotent, so that is not an error.
          const missed = chunk.length - updated.length;
          if (missed > 0 && missed !== chunk.length) {
            failures.push(`${table}.${column}: ${missed} row(s) in one batch were not returned by the update`);
          }
        } catch (err) {
          failures.push(`${table}.${column} batch ${i / CHUNK}: ${err.message}`);
        }
      }

      const after = await sql`
        select jsonb_typeof(${sql(column)})::text as t, count(*)::int as n
        from ${sql(table)} group by 1 order by 2 desc`;
      const [visibleAfter] = await sql.unsafe(
        `select count(*)::int as n from "${table}" where ${SQL_VISIBLE(`"${column}"`)}`,
      );
      console.log(
        `  after: ${after.map((r) => `${r.t ?? "null"}:${r.n}`).join(" ")} · ` +
        `SQL-visible after: ${visibleAfter.n}`,
      );
    }
  }

  // Prove the repaired rows are now queryable by plain SQL — a real path query
  // per column, not just a type check.
  console.log("");
  console.log("plain SQL jsonb path queries, after repair:");
  const paths = [
    ["cv.data", `select id, data->'personal'->>'fullName' as v from cv
      where jsonb_typeof(data) = 'object' and data->'personal'->>'fullName' is not null
      order by updated_at desc limit 1`],
    ["cv.template_history", `select id, jsonb_array_length(template_history)::text as v from cv
      where jsonb_typeof(template_history) = 'array' order by updated_at desc limit 1`],
    ["job.corroborated_sources", `select id, (jsonb_array_length(corroborated_sources)::text || ' source(s), first: ' || coalesce(corroborated_sources->>0, '')) as v
      from job where jsonb_typeof(corroborated_sources) = 'array' order by created_at desc limit 1`],
    ["document_version.snapshot", `select id, (snapshot->>'title') as v from document_version
      where jsonb_typeof(snapshot) = 'object' order by created_at desc limit 1`],
    ["user_profile.career_profile", `select id, career_profile->'personal'->>'fullName' as v from user_profile
      where jsonb_typeof(career_profile) = 'object' order by updated_at desc nulls last limit 1`],
    ["debug_event.detail", `select id, detail->>'path' as v from debug_event
      where jsonb_typeof(detail) = 'object' order by created_at desc limit 1`],
  ];
  for (const [label, query] of paths) {
    try {
      const rows = await sql.unsafe(query);
      console.log(`  ${label}: ${rows.length ? `${rows[0].id} → ${JSON.stringify(rows[0].v)}` : "(no row to query yet)"}`);
    } catch (err) {
      console.log(`  ${label}: ERROR ${err.message}`);
    }
  }

  // Blast radius that this repair deliberately does NOT touch.
  const others = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public' and data_type = 'jsonb'
    order by table_name, column_name`;
  const covered = new Set(TABLES.flatMap((t) => t.columns.map((c) => `${t.table}.${c}`)));
  const stillBroken = [];
  for (const c of others) {
    const key = `${c.table_name}.${c.column_name}`;
    if (covered.has(key)) continue;
    const [r] = await sql`
      select count(*)::int as n from ${sql(c.table_name)}
      where jsonb_typeof(${sql(c.column_name)}) = 'string'`;
    if (r.n > 0) stillBroken.push(`${key} (${r.n})`);
  }
  console.log("");
  console.log(`rows repaired: ${repaired}${APPLY ? "" : " (dry run — none written)"}`);
  if (skippedSamples.length) console.log(`  left alone (not valid JSON) e.g. ${skippedSamples.join(" · ")}`);
  if (stillBroken.length) {
    console.log(`OTHER jsonb columns still holding strings (out of scope of this repair):`);
    for (const b of stillBroken) console.log(`  ${b}`);
  }
  if (failures.length) {
    console.log(`PROBLEMS (${failures.length}):`);
    for (const f of failures) console.log(`  ${f}`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error("REPAIR FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
