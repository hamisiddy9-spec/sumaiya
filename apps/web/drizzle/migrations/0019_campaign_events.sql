-- Campaign events — the server-side record of what a printed poster produced.
--
-- The poster QR lands on /ats-checker?src=poster. The browser captures that tag
-- (lib/analytics/attribution.ts) and lib/analytics attaches it to every event —
-- but those events go to PostHog and Vercel, which this repo cannot query. Until
-- this table existed there was no server-side record that ANY poster scan had
-- happened, so the funnel from scan → signup → CV was unanswerable from our own
-- data. lib/analytics/campaign.ts now posts the funnel steps to
-- POST /api/campaign/event and this table stores them.
--
-- Deliberately NOT reusing app_event: that one is native telemetry keyed by an
-- install id the phone generates. A scan happens in a browser on a device that
-- may never install anything, so it needs its own anonymous key (`visitor_id`).
--
-- No user id, no user hash, no IP — only the campaign slug, a step name from the
-- declared catalog, an opaque random visitor id, and sanitized event props.
--
-- additive + idempotent: safe to run more than once, and safe to run before the
-- code that uses it ships.
--
-- APPLIED BY HAND — this file records what was applied; nothing runs it.
--   Status: applied to the production database by hand on or before 2026-09-17
--   (the oldest row in the table is dated 2026-09-17 14:07 UTC), before the code
--   that writes to it was committed. Verified from the live database on
--   2026-09-18: `campaign_event` exists with columns id/src/name/visitor_id/
--   props/occurred_at/created_at and all three indexes below, in a NOT NULL
--   shape that matches this file.
--   There is deliberately NO applier script in scripts/ (a previous revision had
--   scripts/apply-migration.mjs, which could run arbitrary SQL against the live
--   database if invoked by accident — it was removed). Apply this, and any
--   future migration, the same way 0013–0018 were applied:
--     psql "$DATABASE_URL" -f apps/web/drizzle/migrations/0019_campaign_events.sql
--   Then confirm with:
--     select count(*) from information_schema.columns
--      where table_name = 'campaign_event';   -- 7

CREATE TABLE IF NOT EXISTS "campaign_event" (
  "id" text PRIMARY KEY NOT NULL,
  "src" text NOT NULL,
  "name" text NOT NULL,
  "visitor_id" text NOT NULL,
  "props" jsonb NOT NULL DEFAULT '{}',
  "occurred_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- The admin campaign view always reads by (src) inside a time window.
CREATE INDEX IF NOT EXISTS "campaign_event_src_idx" ON "campaign_event" ("src", "created_at");
-- Distinct-visitor counting per step.
CREATE INDEX IF NOT EXISTS "campaign_event_visitor_idx" ON "campaign_event" ("visitor_id", "created_at");
CREATE INDEX IF NOT EXISTS "campaign_event_name_idx" ON "campaign_event" ("name", "created_at");
