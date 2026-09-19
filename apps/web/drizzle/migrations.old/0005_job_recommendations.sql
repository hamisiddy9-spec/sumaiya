-- Job recommendations: per-user cached top matches (CV ↔ live feed).
-- Additive on the existing "job" table (created by 0002_ecosystem.sql).
-- Rows are recomputed by the daily cron and on-demand when stale (>12h).

CREATE TABLE IF NOT EXISTS "job_recommendation" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "job_id" text NOT NULL,
  "score" integer NOT NULL,
  "reason" text NOT NULL DEFAULT '',
  "matched_terms" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "job_recommendation_user_idx" ON "job_recommendation" ("user_id", "updated_at");
CREATE UNIQUE INDEX IF NOT EXISTS "job_recommendation_user_job_uniq" ON "job_recommendation" ("user_id", "job_id");

ALTER TABLE "job_recommendation" ADD CONSTRAINT "job_recommendation_job_id_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE cascade;
