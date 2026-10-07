-- User-initiated problem reports (consent-first, from the native app).
--
-- additive + idempotent: safe to run more than once, and safe to apply before
-- the code that uses it ships. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0023_app_report.sql
--
-- NOT applied to production by this change — left for a deliberate, separate
-- step.

DO $$ BEGIN
  CREATE TYPE "app_report_kind" AS ENUM ('crash', 'problem', 'idea');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Same anonymity shape as app_event: keyed by installId, userHash only when
-- signed in and only ever a salted hash (never a raw user id). `screenshot` is
-- a base64 JPEG the client already downscaled (width 720, quality 0.6) before
-- sending; `logs` is the last 40 entries of the same ring buffer that already
-- feeds app_event.
CREATE TABLE IF NOT EXISTS "app_report" (
  "id" text PRIMARY KEY NOT NULL,
  "install_id" text NOT NULL,
  "user_hash" text,
  "kind" "app_report_kind" NOT NULL,
  "note" text,
  "screenshot" text,
  "logs" jsonb NOT NULL DEFAULT '[]',
  "app_version" text,
  "platform" text,
  "device" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "app_report_created_idx" ON "app_report" ("created_at");
CREATE INDEX IF NOT EXISTS "app_report_install_idx" ON "app_report" ("install_id", "created_at");
