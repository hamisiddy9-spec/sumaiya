-- AI system foundation (system blueprint — Stage 1/2).
-- Three additive tables; no changes to existing tables. All idempotent.
--
--   - tool_invocation: the capability audit trail. Every call through the
--     guardrail pipeline (lib/assistant/run-tool) leaves one row, whatever the
--     caller. This is the cost dashboard + the "what did the AI do" trail.
--     `input_hash` is a digest of the args, never the raw args.
--   - provenance: field-level "where did this text come from" (blueprint H8).
--     A tool that writes to a document cannot commit without provenance rows
--     for each changed span. Powers the source chips + "revert to my words".
--   - eval_sample: a low-rate sample of real generative tool IO so the nightly
--     job can re-run the anti-fabrication / repeat-guard / tone suites against
--     production traffic. User referenced by hash, not id. Rows are pruned.

CREATE TABLE IF NOT EXISTS "tool_invocation" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "tool" text NOT NULL,
  "caller" text NOT NULL,
  "policy" text NOT NULL,
  "outcome" text NOT NULL,
  "cost_class" text NOT NULL DEFAULT 'none',
  "latency_ms" integer NOT NULL DEFAULT 0,
  "input_hash" text NOT NULL DEFAULT '',
  "error_code" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tool_invocation_user_idx" ON "tool_invocation" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "tool_invocation_tool_idx" ON "tool_invocation" ("tool", "created_at");

CREATE TABLE IF NOT EXISTS "provenance" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "doc_type" text NOT NULL,
  "doc_id" text NOT NULL,
  "field_path" text NOT NULL,
  "span_start" integer NOT NULL DEFAULT 0,
  "span_end" integer NOT NULL DEFAULT 0,
  "source_kind" text NOT NULL,
  "source_ref" text NOT NULL DEFAULT '',
  "invocation_id" text,
  "confirmed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "provenance_doc_idx" ON "provenance" ("doc_type", "doc_id");
CREATE INDEX IF NOT EXISTS "provenance_user_idx" ON "provenance" ("user_id");

CREATE TABLE IF NOT EXISTS "eval_sample" (
  "id" text PRIMARY KEY NOT NULL,
  "user_hash" text NOT NULL,
  "tool" text NOT NULL,
  "prompt_version" text NOT NULL DEFAULT '',
  "model" text NOT NULL DEFAULT '',
  "input" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "output" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "verdict" text,
  "verdict_detail" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "evaluated_at" timestamp
);

CREATE INDEX IF NOT EXISTS "eval_sample_tool_idx" ON "eval_sample" ("tool", "created_at");
CREATE INDEX IF NOT EXISTS "eval_sample_pending_idx" ON "eval_sample" ("evaluated_at");
