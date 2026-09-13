/**
 * Real-data check for job-aware suggestions: does the classifier actually
 * recognise the jobs people in this market hold? Runs over the real job rows.
 * Temporary tooling — delete when done.
 *
 *   cd /home/oem/sumaiya && npx tsx scripts/verify-suggestions-real.ts
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { inferField } from "../apps/native/src/lib/template-suggestions";
import { suggestTemplates } from "../apps/native/src/lib/template-suggestions";

function dbUrl(): string {
  const env = readFileSync("apps/web/.env.local", "utf8");
  const m = /^\s*DATABASE_URL\s*=\s*(.+)$/m.exec(env);
  if (!m) throw new Error("no DATABASE_URL");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const sql = postgres(dbUrl(), { ssl: "require", max: 1 });

  const tables = await sql<{ table_name: string }[]>`
    select table_name from information_schema.tables
    where table_schema='public' and table_name like '%job%' order by table_name`;
  console.log("job-ish tables:", tables.map((t) => t.table_name).join(", "));

  const table = tables.find((t) => t.table_name === "jobs")?.table_name ?? tables[0]?.table_name;
  if (!table) {
    console.log("no job table");
    await sql.end();
    return;
  }

  const cols = await sql<{ column_name: string }[]>`
    select column_name from information_schema.columns
    where table_schema='public' and table_name=${table} order by ordinal_position`;
  const names = cols.map((c) => c.column_name);
  const titleCol = ["title", "job_title", "position", "name"].find((c) => names.includes(c));
  if (!titleCol) {
    console.log(`${table} has no title column; columns:`, names.join(", "));
    await sql.end();
    return;
  }

  const rows = await sql<{ title: string; company: string | null }[]>`
    select ${sql(titleCol)} as title, ${names.includes("company") ? sql("company") : sql("null")} as company
    from ${sql(table)} where ${sql(titleCol)} is not null limit 4000`;

  const counts: Record<string, number> = {};
  let matched = 0;
  const unmatched: string[] = [];

  for (const r of rows) {
    const field = inferField(`${r.title ?? ""}`);
    if (field) {
      matched++;
      counts[field] = (counts[field] ?? 0) + 1;
    } else if (unmatched.length < 25) {
      unmatched.push(String(r.title));
    }
  }

  const pct = ((matched / rows.length) * 100).toFixed(1);
  console.log(`\n${matched}/${rows.length} real job titles classified (${pct}%)`);
  console.log("by field:", Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12));

  console.log("\nunclassified sample (these get NO recommendation, by design):");
  for (const u of unmatched) console.log("  -", u.slice(0, 70));

  // And what a real title resolves to, end to end.
  console.log("\nend-to-end for real titles:");
  for (const t of ["Warehouse Supervisor", "Registered Nurse", "Sales Representative", "Driver", "Accountant"]) {
    const s = suggestTemplates(t, 3);
    console.log(
      `  "${t}" → ${s ? `${s.field} → ${s.templates.map((x) => x.id).join(", ")}` : "(no recommendation)"}`,
    );
  }

  await sql.end();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
