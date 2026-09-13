-- Referral premium reward.
--
-- A referrer earns 7 days of Sumaiya Premium each time a friend they invited
-- activates (builds a CV) — see lib/referral.ts. No paid tier exists yet, so
-- this is a seam: the grant is real and stored now, so a referrer who earned
-- it is already covered the moment any feature is actually premium-gated.
--
-- additive + idempotent: safe to run more than once, and safe to run before
-- the code that uses it ships. Apply with:
--   psql "$DATABASE_URL" -f drizzle/migrations/0018_referral_premium_reward.sql

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "premium_until" timestamp;
