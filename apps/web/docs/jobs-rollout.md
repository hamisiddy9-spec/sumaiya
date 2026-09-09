# Jobs system rollout — safe deploy runbook

The jobs lifecycle + global discovery + AI recommendations landed on `master`
(commits `a9cae4f`, `66a007d`). This is the safe order to bring it fully live.

## Why order matters
- Migration `0004_jobs_lifecycle.sql` is **destructive** — it `DROP COLUMN "active"`
  on the `job` table and replaces it with a `status` lifecycle.
- Every job query in the app is wrapped in `try/catch` (`lib/api/routes/jobs.ts`,
  `components/jobs/recommended-jobs-section.tsx`, `app/(marketing)/jobs/page.tsx`),
  so the **new code tolerates the old schema** — it degrades to "no jobs" instead
  of crashing.
- Therefore: **deploy the code first, run the migrations second.** Running the
  migration *before* the new code is live would break the currently-deployed
  code (which still reads `active`).

## Steps

1. **Deploy `master`.** A direct push to `master` did not trigger a Vercel build;
   merging a PR to `master` does (that is what this doc's PR is for). The deploy
   is safe pre-migration thanks to the guards above — jobs UI just shows empty.

2. **Run the migrations, in order**, against the production Supabase DB:
   ```sql
   -- 0004_jobs_lifecycle.sql   (adds status/source/etc, backfills, drops "active")
   -- 0005_job_recommendations.sql
   ```
   Either paste each file's SQL into the Supabase SQL editor, or run the provided
   scripts with the prod `DATABASE_URL` set:
   ```bash
   node scripts/migrate-jobs-lifecycle.mjs
   node scripts/migrate-recommendations.mjs
   ```
   Take a snapshot/backup first — `0004` drops a column.

3. **Env for discovery + cron:**
   - `CRON_SECRET` — required; the daily `/api/cron/jobs` (06:00 UTC, see
     `vercel.json`) is rejected without a matching `Bearer` header.
   - Any per-source API keys the ingest expects (see `lib/jobs/ingest.ts`).

4. **Verify:** open `/jobs` and the dashboard recommendations; trigger the cron
   once (or wait for 06:00 UTC) to seed listings.

## Rollback
The deploy is reversible from the Vercel dashboard (instant rollback to the prior
build). The migration is not auto-reversible — restore from the snapshot taken in
step 2 if needed.
