-- Push (blueprint H2 + Stage 5). Two additive tables, idempotent.
--
--   device_token          — native push tokens, one per (user, device).
--                           Written by the Bearer PUT /api/mobile/device-token
--                           (the old cookie-only route couldn't be reached by
--                           the native app).
--   web_push_subscription  — PushSubscription rows from an installed PWA, sent
--                           via the `web-push` lib + a VAPID keypair. The free
--                           re-engagement rail behind WhatsApp.

CREATE TABLE IF NOT EXISTS "device_token" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "device_id" text NOT NULL,
  "push_token" text NOT NULL,
  "platform" text NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "device_token_device_uniq" ON "device_token" ("device_id");
CREATE INDEX IF NOT EXISTS "device_token_user_idx" ON "device_token" ("user_id");

CREATE TABLE IF NOT EXISTS "web_push_subscription" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text NOT NULL DEFAULT '',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_seen_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_push_endpoint_uniq" ON "web_push_subscription" ("endpoint");
CREATE INDEX IF NOT EXISTS "web_push_user_idx" ON "web_push_subscription" ("user_id");
