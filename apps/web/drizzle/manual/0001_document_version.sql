-- Version history for documents.
-- Run this ONCE in the Supabase SQL editor (or `npm run db:push` locally with
-- DATABASE_URL set). Until this table exists, the "Version history" feature in
-- the CV editor will fail silently (save/list return an error the UI swallows).

CREATE TABLE IF NOT EXISTS document_version (
  id            text PRIMARY KEY,
  user_id       text NOT NULL,
  document_id   text NOT NULL,
  document_type text NOT NULL DEFAULT 'cv',
  title         text NOT NULL DEFAULT '',
  snapshot      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_version_doc_idx  ON document_version (document_id);
CREATE INDEX IF NOT EXISTS document_version_user_idx ON document_version (user_id);
