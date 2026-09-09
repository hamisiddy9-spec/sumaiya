#!/usr/bin/env node
/**
 * Sumaiya Migration Runner — 0010 push tokens.
 * Adds device_token + web_push_subscription (additive, idempotent).
 * Usage: node --env-file=.env.local scripts/migrate-push-tokens.mjs
 */
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../drizzle/migrations/0010_push_tokens.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", prepare: false });
try {
  console.log("📄 Running migration 0010_push_tokens...");
  await sql.unsafe(fs.readFileSync(sqlPath, "utf-8"));
  console.log("✅ Push tokens migration applied.");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
