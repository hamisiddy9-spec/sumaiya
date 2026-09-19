#!/usr/bin/env node

/**
 * Verify migration baseline creates all 33 tables
 *
 * Usage: Set DATABASE_URL to an empty Postgres database, then run:
 *   node -r ts-node/register scripts/verify-migration-baseline.ts
 *
 * Expected output:
 *   Table count: 33
 *   All migrations applied successfully.
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set");
  console.error("Set DATABASE_URL to an empty Postgres database for verification");
  process.exit(1);
}

async function verifyMigrationBaseline() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log("Connecting to database...");
    const conn = await pool.connect();

    // Query the _journal to see applied migrations
    const journalResult = await conn.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations__'`
    );

    console.log(`\nDrizzle migrations table exists: ${journalResult.rows.length > 0 ? "✓" : "✗"}`);

    // Count all tables in the public schema
    const tableResult = await conn.query(
      `SELECT COUNT(*) as table_count FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    const tableCount = parseInt(tableResult.rows[0].table_count, 10);
    console.log(`\nPublic tables created: ${tableCount}`);

    // Expected count: 33 tables
    const EXPECTED_TABLE_COUNT = 33;
    if (tableCount === EXPECTED_TABLE_COUNT) {
      console.log(`✓ SUCCESS: All ${EXPECTED_TABLE_COUNT} tables created\n`);

      // List all tables
      const tableList = await conn.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         ORDER BY table_name`
      );

      console.log("Tables:");
      tableList.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${row.table_name}`);
      });

      conn.release();
      pool.end();
      process.exit(0);
    } else {
      console.error(`✗ FAILURE: Expected ${EXPECTED_TABLE_COUNT} tables, got ${tableCount}`);
      conn.release();
      pool.end();
      process.exit(1);
    }
  } catch (error) {
    console.error("ERROR:", error);
    pool.end();
    process.exit(1);
  }
}

verifyMigrationBaseline();
