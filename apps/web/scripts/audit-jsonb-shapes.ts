/**
 * Read-only sweep: which jsonb columns hold a shape their reader cannot read?
 *
 * We fixed this for `cv.data` today — a jsonb column holding a JSON *string*
 * while the reader expected an object, plus a key-name mismatch between the
 * phone app and the web reader. The reader silently returned an EMPTY document
 * instead of failing, so users saw blank CVs while the data sat in the column.
 *
 * A storage-shape bug is a property of the WRITE path, not of one table. This
 * enumerates every jsonb column and reports the blast radius before anyone
 * scopes a fix.
 *
 *   node --env-file=.env.local scripts/audit-jsonb-shapes.ts
 *
 * SELECT only. It never writes.
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "";

async function main() {
  if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
  const sql = postgres(url, { ssl: "require", prepare: false });

  try {
    const cols = await sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public' and data_type = 'jsonb'
      order by table_name, column_name`;

    const rows = [];
    for (const { table_name, column_name } of cols) {
      let dist = "";
      let total = 0;
      try {
        // Identifiers go through sql() so they are quoted as identifiers, never
        // concatenated into SQL text.
        const r = await sql`
          select jsonb_typeof(${sql(column_name)}) as t, count(*)::int as n
          from ${sql(table_name)}
          group by 1 order by 2 desc`;
        dist = r.map((x) => `${x.t ?? "null"}:${x.n}`).join(" ");
        total = r.reduce((s, x) => s + x.n, 0);
      } catch (e) {
        dist = "ERROR: " + (e as Error).message;
      }

      let asString = 0;
      try {
        const [r] = await sql`
          select count(*)::int as n from ${sql(table_name)}
          where jsonb_typeof(${sql(column_name)}) = 'string'`;
        asString = r?.n ?? 0;
      } catch { asString = -1; }

      rows.push({ table: table_name, column: column_name, total, dist, asString });
    }

    console.log("");
    console.log("table".padEnd(26) + "column".padEnd(24) + "rows".padEnd(7) + "types".padEnd(26) + "as-string");
    console.log("-".repeat(96));
    for (const r of rows) {
      console.log(
        r.table.padEnd(26) + r.column.padEnd(24) + String(r.total).padEnd(7) +
        r.dist.slice(0, 25).padEnd(26) + String(r.asString),
      );
    }

    const bad = rows.filter((r) => r.asString > 0);
    console.log("-".repeat(96));
    console.log(`jsonb columns: ${rows.length}   holding a JSON string: ${bad.length}`);
    if (bad.length) {
      console.log("");
      console.log("STRING-ENCODED — the reader probably expects an object:");
      for (const b of bad) console.log(`  ${b.table}.${b.column} — ${b.asString}/${b.total} rows`);
    }
  } catch (e) {
    console.error("SWEEP FAILED:", (e as Error).message);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
