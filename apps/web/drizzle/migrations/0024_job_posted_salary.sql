-- The source's own posting date and pay facts, on `job`.
--
-- WHY ─────────────────────────────────────────────────────────────────────────
-- The phone's advert screen could only show a title, a company and one pasted
-- description, and the feed labelled its "posted" line from `created_at`. That
-- column is the moment the pipeline first saw the advert, so on a board synced
-- daily it reads as "posted 4 hours ago" for an advert the employer published
-- last month: the app was reporting INGESTION as POSTING. Eleven adapters
-- (adzuna, ajira, careerjet, greenhouse, jobwebtanzania, jooble, lever,
-- reliefweb, smartrecruiters, talent, usajobs) already parse a real posting
-- date and `normalizeRawJob` carries it as `postedAt` — the write had nowhere
-- to put it, so the value was dropped at the upsert.
--
-- Salary had the same shape of problem for longer: Jobicy publishes
-- `annualSalaryMin`/`annualSalaryMax`/`salaryCurrency`/`jobLevel`, Adzuna
-- publishes `salary_min`/`salary_max`, and careerjet/talent print a range as
-- text — all of it was dropped, except where two adapters smuggled it into
-- `category` as the string "Salary: …", which is why an employer's pay offer
-- could appear in the feed inside a field rendered as a job category.
--
-- additive + idempotent: safe to run more than once, and safe to apply before
-- the code that uses it ships. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0024_job_posted_salary.sql
--
-- NOT applied to production by this change — left for a deliberate, separate
-- step.

ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "posted_at" timestamp;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_min" integer;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_max" integer;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_currency" text DEFAULT '' NOT NULL;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_period" text DEFAULT '' NOT NULL;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "salary_text" text DEFAULT '' NOT NULL;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "job_level" text DEFAULT '' NOT NULL;

-- NO BACKFILL, ON PURPOSE. `posted_at` could be seeded from `created_at` to make
-- the column look populated, and that would write the same false claim into the
-- database that this migration exists to stop the app making: the ingest fills
-- it from the source on its next run for every source that provides one, and a
-- listing whose source provides none keeps a NULL — which the app renders as
-- nothing rather than a guess.
--
-- All six columns are NULL or '' until that run. Nothing reads them as a
-- number until they carry a real one.

-- ACCESS: no GRANT, and that is deliberate. 0022 revoked anon SELECT on the
-- whole `job` table (a table-level grant cannot express a column projection,
-- and the anon key ships inside the APK), so these columns arrive locked with
-- the rest of the table. Every product read goes through Drizzle as `postgres`.
-- `source_url`, `source` and `external_id` stay out of the public feed
-- projection for the same reason: they are crawl provenance, not product data.
