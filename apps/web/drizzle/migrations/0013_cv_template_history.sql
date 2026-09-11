-- CV template-history column (grandfather fix for premium-template gating).
-- Additive, idempotent, backfilled so existing rows aren't retroactively
-- locked out of the template they're currently using.
--
-- NOT APPLIED YET as of this commit — the app owner asked for code-only work
-- tonight, no build/deploy/DB changes until tomorrow. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0013_cv_template_history.sql

ALTER TABLE "cv" ADD COLUMN IF NOT EXISTS "template_history" jsonb NOT NULL DEFAULT '[]';

-- Backfill: every existing CV's current template counts as "already used" —
-- without this, every CV made before this migration would immediately lose
-- access to its own current template the moment someone switched away from
-- it in the picker and tried to switch back.
UPDATE "cv" SET "template_history" = jsonb_build_array("template_id")
WHERE "template_history" = '[]'::jsonb;
