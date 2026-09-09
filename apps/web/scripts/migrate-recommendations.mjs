#!/usr/bin/env node
/**
 * Sumaiya Migration Runner — 0005 job recommendations.
 * Usage: DATABASE_URL=postgresql://... node scripts/migrate-recommendations.mjs
 * (or with --env-file=.env.local: node --env-file=.env.local scripts/migrate-recommendations.mjs)
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../drizzle/migrations/0005_job_recommendations.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

console.log("📦 Connecting to database...");
const sql = postgres(url, { ssl: "require", prepare: false });

try {
  const migrationSql = fs.readFileSync(sqlPath, "utf-8");
  console.log("📄 Running migration...");
  await sql.unsafe(migrationSql);
  console.log("✅ Job recommendations migration applied successfully!");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
