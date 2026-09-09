-- Outcome instrumentation (feedback flywheel, PR-1).
-- The raw material of "did the AI advice actually work?":
--   - outcome_event: anonymized events (user id stored ONLY as sha256 hash),
--     typed PII-free payloads, indexed by (type, created_at) for aggregation
--     and by user_hash for per-user correlation.
--   - user_profile.analytics_opt_out: privacy flag — when true the write path
--     records nothing for that user. Additive; existing rows default to false.

CREATE TABLE IF NOT EXISTS "outcome_event" (
  "id" text PRIMARY KEY NOT NULL,
  "user_hash" text NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "outcome_event_type_idx" ON "outcome_event" ("type", "created_at");
CREATE INDEX IF NOT EXISTS "outcome_event_user_idx" ON "outcome_event" ("user_hash");

ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "analytics_opt_out" boolean NOT NULL DEFAULT false;
