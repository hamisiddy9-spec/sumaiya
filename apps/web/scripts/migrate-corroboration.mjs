#!/usr/bin/env node
/**
 * Sumaiya Migration Runner — 0007 job corroboration.
 * Usage: DATABASE_URL=postgresql://... node scripts/migrate-corroboration.mjs
 * (or with --env-file=.env.local: node --env-file=.env.local scripts/migrate-corroboration.mjs)
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { guardWrite } from "./lib/db-target.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../drizzle/migrations/0007_job_corroboration.sql");

// Refuses a remote database unless ALLOW_REMOTE_WRITE=1 is set
// explicitly: .env.local points DATABASE_URL at production, so
// "I ran it with --env-file=.env.local" is not evidence of safety.
// See scripts/lib/db-target.mjs.
const url = guardWrite({ what: "migrate-corroboration" });

console.log("📦 Connecting to database...");
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const migrationSql = fs.readFileSync(sqlPath, "utf-8");
  console.log("📄 Running migration...");
  await sql.unsafe(migrationSql);
  console.log("✅ Job corroboration migration applied successfully!");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
