-- Persisted UI language preference, server-side — see lib/db/schema.ts's
-- userProfile.lang comment for why (push notifications and other
-- server-composed messages had no way to know a user's language and always
-- defaulted to English). Additive, idempotent.
--
-- NOT APPLIED YET — code-only tonight. Apply alongside 0013/0014 tomorrow:
--   psql "$DATABASE_URL" -f drizzle/migrations/0015_user_profile_lang.sql

ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "lang" text;
