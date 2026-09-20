/**
 * DATA REPAIR — unwrap CV rows stored as a JSON *string* inside jsonb.
 *
 * The write path is fixed (lib/api/routes/cv.ts → `jsonbParam`), but every row
 * written before it still holds
 *
 *   data :: jsonb = '"{\"personal\":{\"fullName\":\"Asha\"}}"'   -- jsonb_typeof = 'string'
 *
 * instead of the object. SQL jsonb operators return NULL on those rows —
 * `data->'personal'->>'fullName'` is NULL — so any report, migration or admin
 * view over CV contents reads them as empty. The app looked correct throughout
 * because its JS reader parses the string back, which is exactly why this had
 * to be repaired in the data, not just in the code.
 *
 * Dry run (default) reports what WOULD change; `--apply` writes it. Idempotent:
 * a repaired row no longer matches `jsonb_typeof(...) = 'string'` and is skipped
 * on the next run.
 *
 *   node --env-file=C:/Users/hamis/projects/_hdd-data/env/supabase.env \
 *     apps/web/scripts/repair-cv-jsonb-strings.mjs [--apply]
 *
 * The UPDATE is pure SQL (`(col #>> '{}')::jsonb`) — no value is passed as a
 * parameter, so no driver can re-encode it — and a candidate is only updated
 * after Node has confirmed its inner text parses as a JSON object/array. A
 * string that is NOT valid JSON is left exactly as it is and reported.
 *
 * Out of scope (and reported, not touched): every OTHER jsonb column in the
 * schema written through the same stack. `scripts/audit-jsonb-shapes.ts` lists
 * them; they need their own write paths fixed and their readers checked first.
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
];

const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: { rejectUnauthorized: false } });

let repaired = 0;
let skipped = 0;
const skippedSamples = [];

try {
  for (const { table, columns } of TABLES) {
    for (const column of columns) {
      const before = (await sql`
        select count(*)::int as n from ${sql(table)} where jsonb_typeof(${sql(column)}) = 'string'`)[0].n;
      if (before === 0) {
        console.log(`${table}.${column}: nothing to repair (0 rows stored as a string)`);
        continue;
      }

      const rows = await sql`
        select id, (${sql(column)} #>> '{}') as text
        from ${sql(table)} where jsonb_typeof(${sql(column)}) = 'string'`;

      const rewritable = [];
      for (const row of rows) {
        let parsed;
        try {
          parsed = JSON.parse(row.text);
        } catch {
          skipped += 1;
          if (skippedSamples.length < 3) skippedSamples.push(`${row.id}: ${String(row.text).slice(0, 60)}`);
          continue;
        }
        if (!parsed || typeof parsed !== "object") {
          skipped += 1;
          if (skippedSamples.length < 3) skippedSamples.push(`${row.id}: not an object/array`);
          continue;
        }
        rewritable.push(row.id);
      }

      console.log(`${table}.${column}: ${before} row(s) stored as a jsonb string · ${rewritable.length} hold a JSON object/array`);
      if (!APPLY) {
        console.log(`  dry run — re-run with --apply to rewrite them`);
        continue;
      }

      for (const id of rewritable) {
        // Pure SQL: Postgres unwraps the string and parses it exactly once.
        const done = await sql`
          update ${sql(table)} set ${sql(column)} = (${sql(column)} #>> '{}')::jsonb
          where id = ${id} and jsonb_typeof(${sql(column)}) = 'string'
          returning id`;
        repaired += done.length;
      }

      const after = (await sql`
        select jsonb_typeof(${sql(column)})::text as t, count(*)::int as n
        from ${sql(table)} group by 1 order by 2 desc`);
      console.log(`  after: ${after.map((r) => `${r.t ?? "null"}:${r.n}`).join(" ")}`);
    }
  }

  // Prove the repaired rows are now queryable by plain SQL.
  const sample = await sql`
    select id, data->'personal'->>'fullName' as sql_name from cv
    where jsonb_typeof(data) = 'object' and data->'personal'->>'fullName' is not null
    order by updated_at desc limit 3`;
  console.log("");
  console.log("plain SQL jsonb path query, after repair:");
  for (const r of sample) console.log(`  ${r.id} → ${JSON.stringify(r.sql_name)}`);
  if (sample.length === 0) console.log("  (no object rows with a name yet)");

  // Blast radius that this repair deliberately does NOT touch.
  const others = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public' and data_type = 'jsonb'
    order by table_name, column_name`;
  const stillBroken = [];
  for (const c of others) {
    if (c.table_name === "cv" && (c.column_name === "data" || c.column_name === "template_history")) continue;
    const [r] = await sql`
      select count(*)::int as n from ${sql(c.table_name)}
      where jsonb_typeof(${sql(c.column_name)}) = 'string'`;
    if (r.n > 0) stillBroken.push(`${c.table_name}.${c.column_name} (${r.n})`);
  }
  console.log("");
  console.log(`rows repaired: ${repaired}${APPLY ? "" : " (dry run — none written)"} · left alone: ${skipped}`);
  if (skippedSamples.length) console.log(`  left alone e.g. ${skippedSamples.join(" · ")}`);
  if (stillBroken.length) {
    console.log(`OTHER jsonb columns still holding strings (out of scope of this repair):`);
    for (const b of stillBroken) console.log(`  ${b}`);
  }
} catch (err) {
  console.error("REPAIR FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
