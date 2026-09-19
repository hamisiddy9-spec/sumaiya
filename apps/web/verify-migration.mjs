#!/usr/bin/env node

/**
 * Verify migration baseline creates all 33 tables on empty Postgres database
 *
 * Usage: Set DATABASE_URL to empty database, then:
 *   node verify-migration.mjs
 *
 * Expected output: Table count: 33
 */

import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable required");
  console.error("Usage: DATABASE_URL=postgresql://... node verify-migration.mjs");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  try {
    console.log("🔍 Testing migration baseline on empty database...\n");
    
    const client = await pool.connect();
    
    // Count tables
    const res = await client.query(
      `SELECT COUNT(*) as cnt FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    
    const count = parseInt(res.rows[0].cnt, 10);
    const EXPECTED = 33;
    
    console.log(`Tables created: ${count}`);
    console.log(`Expected:      ${EXPECTED}`);
    
    if (count === EXPECTED) {
      console.log(`\n✓ SUCCESS: All ${EXPECTED} tables created from baseline migration`);
      
      // List tables
      const tableRes = await client.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         ORDER BY table_name`
      );
      
      console.log("\nTables:");
      tableRes.rows.forEach((row, i) => {
        console.log(`  ${String(i + 1).padStart(2)}. ${row.table_name}`);
      });
      
      client.release();
      pool.end();
      process.exit(0);
    } else {
      console.error(`\n✗ FAILURE: Expected ${EXPECTED} tables but got ${count}`);
      client.release();
      pool.end();
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err.message);
    pool.end();
    process.exit(1);
  }
}

run();
