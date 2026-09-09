-- PayMe Africa provider support. Additive and nullable/defaulted — safe to run
-- on a live DB with existing rows. Payments remain gated by PAYMENTS_ENABLED.

ALTER TABLE "payment"
  ADD COLUMN IF NOT EXISTS "provider" text NOT NULL DEFAULT 'pesapal',
  ADD COLUMN IF NOT EXISTS "provider_ref" text,
  ADD COLUMN IF NOT EXISTS "provider_txn_id" text;

ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "provider" text;

CREATE INDEX IF NOT EXISTS "payment_provider_ref_idx" ON "payment" ("provider_ref");
