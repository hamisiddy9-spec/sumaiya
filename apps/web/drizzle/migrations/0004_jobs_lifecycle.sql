-- Jobs lifecycle system: status enum + source metadata + dedup + verification.
-- Additive on the existing "job" table (created by 0002_ecosystem.sql).

-- New columns (all additive).
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "source_url" text NOT NULL DEFAULT '';
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "source_name" text NOT NULL DEFAULT '';
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "external_id" text NOT NULL DEFAULT '';
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'published';
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "application_deadline" timestamp;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "last_verified_at" timestamp;
ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;

-- Map the legacy boolean to the new status lifecycle. Guarded because some
-- environments never had the legacy "active" column (or already dropped it) —
-- without the guard the UPDATE errors with 42703 (column does not exist).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'active'
  ) THEN
    UPDATE "job" SET "status" = 'expired' WHERE "status" = 'published' AND "active" = false;
  END IF;
END $$;

-- Indexes for feed queries + dedup. The unique index is the DB-level guard so a
-- source can never publish the same listing twice (app-level dedup is belt).
CREATE INDEX IF NOT EXISTS "job_status_idx" ON "job" ("status");
CREATE INDEX IF NOT EXISTS "job_created_idx" ON "job" ("created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "job_source_external_uniq" ON "job" ("source", "external_id") WHERE "external_id" <> '';

-- Drop the legacy boolean now that status replaces it.
ALTER TABLE "job" DROP COLUMN IF EXISTS "active";
DROP INDEX IF EXISTS "job_active_idx";
