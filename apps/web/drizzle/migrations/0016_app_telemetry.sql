-- Native app telemetry + published releases.
--
-- additive + idempotent: safe to run more than once, and safe to run before the
-- code that uses it ships. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0016_app_telemetry.sql

-- ── app_event ────────────────────────────────────────────────────────────────
-- One row per telemetry event from the native app. Keyed by an anonymous
-- per-install id (no user row required), with the salted user hash filled in
-- only when the sender was signed in.
CREATE TABLE IF NOT EXISTS "app_event" (
  "id" text PRIMARY KEY NOT NULL,
  "install_id" text NOT NULL,
  "user_hash" text,
  "name" text NOT NULL,
  "props" jsonb NOT NULL DEFAULT '{}',
  "app_version" text,
  "platform" text,
  "device" text,
  "occurred_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "app_event_name_idx" ON "app_event" ("name", "created_at");
CREATE INDEX IF NOT EXISTS "app_event_install_idx" ON "app_event" ("install_id", "created_at");
CREATE INDEX IF NOT EXISTS "app_event_version_idx" ON "app_event" ("app_version", "created_at");

-- ── app_release ──────────────────────────────────────────────────────────────
-- Published native builds. The updater manifest is served from here, so an APK
-- existing somewhere is never by itself a reason to interrupt users.
CREATE TABLE IF NOT EXISTS "app_release" (
  "id" text PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "apk_url" text NOT NULL,
  "size_bytes" integer,
  "notes_sw" text NOT NULL DEFAULT '',
  "notes_en" text NOT NULL DEFAULT '',
  "channel" text NOT NULL DEFAULT 'stable',
  "published_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "app_release_channel_idx" ON "app_release" ("channel", "published_at");
