-- Durable diagnostic log — see lib/db/schema.ts's debugEvent comment for why
-- (Vercel runtime-log retention on this plan is 1h/1day, far too short for
-- an intermittent bug). Additive, idempotent.
--
-- NOT APPLIED YET — code-only tonight per the app owner. Apply alongside
-- migration 0013 tomorrow:
--   psql "$DATABASE_URL" -f drizzle/migrations/0014_debug_event.sql

CREATE TABLE IF NOT EXISTS "debug_event" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "user_id" text,
  "detail" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "debug_event_kind_idx" ON "debug_event" ("kind", "created_at");
