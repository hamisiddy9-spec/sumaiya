-- Career Profile (source of truth): one verified career fact-set per user.
-- Additive on the existing "user_profile" table (created by 0002_ecosystem.sql).
-- NULL = no career profile yet (existing rows untouched). Shape: CareerProfile
-- in types/index.ts. CVs keep working unchanged — they are derived views.

ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "career_profile" jsonb;
