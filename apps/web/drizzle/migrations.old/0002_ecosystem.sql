-- Ecosystem tables: Shared Profile, Application Kits, ATS Score History

-- 1. User Profile (shared identity across all doc types)
CREATE TABLE IF NOT EXISTS "user_profile" (
  "id" text PRIMARY KEY REFERENCES "profile"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL DEFAULT '',
  "job_title" text NOT NULL DEFAULT '',
  "email" text NOT NULL DEFAULT '',
  "phone" text NOT NULL DEFAULT '',
  "location" text NOT NULL DEFAULT '',
  "linkedin" text DEFAULT '',
  "website" text DEFAULT '',
  "photo" text DEFAULT '',
  "summary" text NOT NULL DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Application Kits (CV + cover letter + JD grouped)
CREATE TABLE IF NOT EXISTS "application" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "title" text NOT NULL DEFAULT 'My Application',
  "company_name" text DEFAULT '',
  "job_title" text DEFAULT '',
  "job_description" text DEFAULT '',
  "job_description_url" text DEFAULT '',
  "cv_id" text REFERENCES "cv"("id") ON DELETE SET NULL,
  "cover_letter_id" text REFERENCES "cover_letter"("id") ON DELETE SET NULL,
  "match_score" integer,
  "status" text NOT NULL DEFAULT 'draft',
  "applied_at" timestamp,
  "notes" text DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "application_user_idx" ON "application" ("user_id");

-- 3. ATS Score History (score-over-time tracking)
CREATE TABLE IF NOT EXISTS "ats_score_snapshot" (
  "id" text PRIMARY KEY,
  "document_id" text NOT NULL,
  "document_type" text NOT NULL DEFAULT 'cv',
  "user_id" text NOT NULL,
  "score" integer NOT NULL,
  "checks" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "ats_snapshot_doc_idx" ON "ats_score_snapshot" ("document_id");
CREATE INDEX IF NOT EXISTS "ats_snapshot_user_idx" ON "ats_score_snapshot" ("user_id");

-- Added later: per-user email-notification preference on the shared profile.
ALTER TABLE "user_profile" ADD COLUMN IF NOT EXISTS "email_notifications" boolean NOT NULL DEFAULT true;
