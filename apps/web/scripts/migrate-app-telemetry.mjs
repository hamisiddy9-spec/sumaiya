#!/usr/bin/env node
/**
 * Apply 0016 — native telemetry + published releases.
 * Usage: node --env-file=.env.local scripts/migrate-app-telemetry.mjs
 *
 * Additive and idempotent (CREATE TABLE IF NOT EXISTS), so running it twice or
 * running it before the code ships is harmless.
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { guardWrite } from "./lib/db-target.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../drizzle/migrations/0016_app_telemetry.sql");

// Refuses a remote database unless ALLOW_REMOTE_WRITE=1 is set
// explicitly: .env.local points DATABASE_URL at production, so
// "I ran it with --env-file=.env.local" is not evidence of safety.
// See scripts/lib/db-target.mjs.
const url = guardWrite({ what: "migrate-app-telemetry" });

console.log("📦 Connecting to database...");
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const migrationSql = fs.readFileSync(sqlPath, "utf-8");
  console.log("📄 Running migration 0016_app_telemetry...");
  await sql.unsafe(migrationSql);
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in ('app_event', 'app_release')
    order by table_name
  `;
  console.log("✅ Applied. Tables present:", tables.map((t) => t.table_name).join(", "));
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
