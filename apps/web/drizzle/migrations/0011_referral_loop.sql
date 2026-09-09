-- Referral loop (system blueprint — Stage 5). Two additive tables, idempotent.
--
--   referral_code   — one stable invite code per referrer.
--   referral_claim  — one row per person who signed up via a ?ref= link.
--                     activated_at is stamped lazily once the referred user
--                     has actually built something (activated invite > sign-up).

CREATE TABLE IF NOT EXISTS "referral_code" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "code" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_code_uniq" ON "referral_code" ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_code_user_uniq" ON "referral_code" ("user_id");

CREATE TABLE IF NOT EXISTS "referral_claim" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "referrer_user_id" text NOT NULL,
  "referred_user_id" text NOT NULL,
  "claimed_at" timestamp NOT NULL DEFAULT now(),
  "activated_at" timestamp
);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_claim_referred_uniq" ON "referral_claim" ("referred_user_id");
CREATE INDEX IF NOT EXISTS "referral_claim_referrer_idx" ON "referral_claim" ("referrer_user_id");
