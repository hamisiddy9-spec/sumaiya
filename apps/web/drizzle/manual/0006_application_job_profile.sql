-- Additive: structured JD intelligence (JobProfile) snapshot per application.
-- Nullable — old rows stay untouched. Written by /api/applications/from-cv
-- (and POST /api/applications) when a job description is present.
ALTER TABLE application ADD COLUMN IF NOT EXISTS job_profile jsonb;
