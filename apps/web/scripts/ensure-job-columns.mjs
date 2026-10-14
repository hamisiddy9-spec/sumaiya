/**
 * Ensure the job-facts columns exist, at build time.
 *
 * WHY THIS RUNS IN THE BUILD ────────────────────────────────────────────────
 * `0024_job_posted_salary.sql` is additive and idempotent, but it was written to be
 * applied as a deliberate, separate step — and then the code that needs it was
 * deployed first, so production's feed query started failing with
 * `column "salary_text" does not exist` on every request. Vercel will not hand the
 * production credential to the CLI (by design), so the only place this can run
 * without a human copying SQL is the build, where the production env is injected.
 *
 * IT CANNOT BREAK A BUILD. Every failure path logs and exits 0: if the migration
 * cannot run, the deploy proceeds exactly as it would have without this file. The
 * alternative — failing the build — would turn a broken feature into a broken site.
 *
 * Re-running it is a no-op; that is the point of `IF NOT EXISTS`.
 */
import postgres from 'postgres';

const STATEMENTS = [
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "posted_at" timestamp`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_min" integer`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_max" integer`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_currency" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_period" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_text" text DEFAULT '' NOT NULL`,
  `ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "job_level" text DEFAULT '' NOT NULL`,
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('[ensure-job-columns] no DATABASE_URL in this environment — skipped');
  process.exit(0);
}

let sql;
try {
  sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10 });

  for (const stmt of STATEMENTS) await sql.unsafe(stmt);

  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'job' and column_name in
      ('posted_at','salary_min','salary_max','salary_currency','salary_period','salary_text','job_level')`;
  const live = await sql`select count(*)::int as n from job where status in ('published','expiring')`;

  console.log(`[ensure-job-columns] ok — ${cols.length}/7 columns present, ${live[0].n} live rows`);
} catch (err) {
  // A deploy must never fail because this could not run.
  console.log(`[ensure-job-columns] skipped: ${err?.message ?? err}`);
} finally {
  await sql?.end({ timeout: 5 }).catch(() => {});
}
