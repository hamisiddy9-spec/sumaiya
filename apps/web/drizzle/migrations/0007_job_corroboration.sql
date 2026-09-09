-- Cross-source dedup: corroborated_sources records which source keys also
-- carry the same canonical posting (from lib/jobs/dedup.ts). Multi-source
-- corroboration is an authenticity signal; the column lets the feed show
-- "also listed on X" and lets admins see duplicate coverage.
-- Additive on the existing "job" table. Default [] keeps existing rows valid.

ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "corroborated_sources" jsonb NOT NULL DEFAULT '[]'::jsonb;
