-- Export ledger completeness.
--
-- `download_log` was written by exactly ONE endpoint (POST /cv/:id/download) —
-- cover letters, letters and business cards bumped their own counter and wrote
-- nothing to the ledger. The assistant reads the ledger to answer "have they
-- actually sent this?", so every export of those three types was invisible to
-- it, and the ledger held 18 cv rows and zero of anything else.
--
-- `title` is added because an export is not always a SAVED document: the native
-- app builds a cover letter on demand (POST /mobile/apply) and never stores a
-- cover_letter row, so its export had no id and no name to report back. The row
-- now carries the human title the export had at the time.
--
-- additive + idempotent: safe to run more than once, and safe to run before the
-- code that uses it ships. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0017_export_ledger.sql

ALTER TABLE "download_log" ADD COLUMN IF NOT EXISTS "title" text;

-- The assistant's library block orders by recency per user; the existing table
-- had no index at all on user_id.
CREATE INDEX IF NOT EXISTS "download_log_user_idx" ON "download_log" ("user_id", "created_at");
