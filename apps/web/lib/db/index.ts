import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
let _db: DrizzleDb | null = null;

// ── The job-facts columns, ensured once per process ─────────────────────────
// `0024_job_posted_salary.sql` is additive, idempotent, and was written to be applied
// as its own deliberate step. The code that needs it shipped first, so production's
// feed has been failing on every request with:
//     PostgresError: column "salary_text" does not exist   (42703)
// A build-time hook could not fix it — the deploy's environment does not expose
// DATABASE_URL to that step. But the RUNNING process reaches this database perfectly
// well; that error is proof the connection succeeds. So the process that needs the
// columns creates them, once, with every statement guarded and every failure swallowed.
//
// Delete this block once production carries the columns: it is a bootstrap for one
// ordered step, not a migration framework, and it must not become a habit.
const JOB_FACT_COLUMNS = [
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "posted_at" timestamp`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_min" integer`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_max" integer`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_currency" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_period" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_text" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "job_level" text DEFAULT '' NOT NULL`,
];

let _ensured: Promise<void> | null = null;

function ensureJobColumns(client: { unsafe(query: string): Promise<unknown> }): Promise<void> {
  if (!_ensured) {
    _ensured = (async () => {
      try {
        for (const statement of JOB_FACT_COLUMNS) await client.unsafe(statement);
        console.log("[db] job-facts columns present");
      } catch (err) {
        // A column check must never break a request, and must never be retried in a
        // loop: if it fails, the app behaves exactly as it did before this block.
        console.log(
          `[db] job-facts column check skipped: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })();
  }
  return _ensured;
}

function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = postgres(url, { prepare: false });
    void ensureJobColumns(client);
    _db = drizzle(client, { schema });
  }
  return _db;
}

// Proxy defers client creation to first query — safe during build
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    return getDb()[prop as keyof DrizzleDb];
  },
});

export * from "./schema";
