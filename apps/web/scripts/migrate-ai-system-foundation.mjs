#!/usr/bin/env node
/**
 * Sumaiya Migration Runner — 0009 AI system foundation.
 * Adds tool_invocation, provenance, eval_sample (all additive, idempotent).
 * Usage: node --env-file=.env.local scripts/migrate-ai-system-foundation.mjs
 *   (or) DATABASE_URL=postgresql://... node scripts/migrate-ai-system-foundation.mjs
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  __dirname,
  "../drizzle/migrations/0009_ai_system_foundation.sql",
);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

console.log("📦 Connecting to database...");
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const migrationSql = fs.readFileSync(sqlPath, "utf-8");
  console.log("📄 Running migration 0009_ai_system_foundation...");
  await sql.unsafe(migrationSql);
  console.log("✅ AI system foundation migration applied successfully!");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
