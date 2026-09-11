-- Signal notification dispatch ledger (system blueprint — signal dispatcher).
-- One additive table, idempotent. See lib/db/schema.ts for the full comment.

CREATE TABLE IF NOT EXISTS "signal_notification" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "notif_key" text NOT NULL,
  "type" text NOT NULL,
  "sent_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "signal_notification_user_key_uniq" ON "signal_notification" ("user_id", "notif_key");
