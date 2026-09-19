-- Marketplace: user-submitted template designs (moderation queue).
-- Additive only — no changes to existing tables.

CREATE TABLE IF NOT EXISTS "template_submission" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "submitter_name" text NOT NULL DEFAULT '',
  "doc_type" text NOT NULL DEFAULT 'cv',
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "category" text NOT NULL DEFAULT '',
  "base_template_id" text NOT NULL,
  "primary_color" text NOT NULL DEFAULT '#DA4A1C',
  "font_family" text NOT NULL DEFAULT 'Inter',
  "section_order" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "review_note" text NOT NULL DEFAULT '',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "template_submission_status_idx" ON "template_submission" ("status");
