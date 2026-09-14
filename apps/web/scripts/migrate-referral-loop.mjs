#!/usr/bin/env node
/**
 * Sumaiya Migration Runner — 0011 referral loop.
 * Adds referral_code + referral_claim (additive, idempotent).
 * Usage: node --env-file=.env.local scripts/migrate-referral-loop.mjs
 */
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { guardWrite } from "./lib/db-target.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, "../drizzle/migrations/0011_referral_loop.sql");

// Refuses a remote database unless ALLOW_REMOTE_WRITE=1 is set
// explicitly: .env.local points DATABASE_URL at production, so
// "I ran it with --env-file=.env.local" is not evidence of safety.
// See scripts/lib/db-target.mjs.
const url = guardWrite({ what: "migrate-referral-loop" });

const sql = postgres(url, { ssl: "require", prepare: false });
try {
  console.log("📄 Running migration 0011_referral_loop...");
  await sql.unsafe(fs.readFileSync(sqlPath, "utf-8"));
  console.log("✅ Referral loop migration applied.");
} catch (err) {
  console.error("❌ Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
