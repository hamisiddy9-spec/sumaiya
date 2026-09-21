/**
 * Pre-repair backup of the rows this repair will rewrite — the CV version
 * history above all. Read-only; writes ONLY a local JSON file, never the DB.
 */
import { writeFileSync } from "node:fs";
import postgres from "postgres";

const DB_URL = (process.env.DATABASE_URL ?? "").replace(/\?&?sslmode=[^&]*/g, "");
const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: { rejectUnauthorized: false } });

const out = {};
const dump = async (table, column) => {
  const rows = await sql.unsafe(
    `select id, ${column} as value, ${column} #>> '{}' as text from "${table}" where jsonb_typeof(${column}) = 'string'`,
  );
  out[`${table}.${column}`] = rows;
};

try {
  await dump("document_version", "snapshot");
  await dump("user_profile", "career_profile");
  await dump("job", "corroborated_sources");
  await dump("debug_event", "detail");
  const file = process.argv[2] ?? "C:/Users/hamis/AppData/Local/Temp/sumaiya-jsonb-backup.json";
  writeFileSync(file, JSON.stringify(out, null, 1));
  for (const [k, v] of Object.entries(out)) console.log(`${k}: ${v.length} row(s) backed up`);
  console.log(`backup → ${file}`);
} finally {
  await sql.end({ timeout: 5 });
}
