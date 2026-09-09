-- Jobs discovery feed.
-- Run ONCE in the Supabase SQL editor (or `npm run db:push`). Creates the table
-- backing the /jobs feed and the admin jobs manager. Until it exists, the feed
-- shows its empty state and the admin manager degrades gracefully.

CREATE TABLE IF NOT EXISTS job (
  id               text PRIMARY KEY,
  title            text NOT NULL,
  company          text NOT NULL DEFAULT '',
  location         text NOT NULL DEFAULT '',
  category         text NOT NULL DEFAULT '',
  employment_type  text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  apply_url        text NOT NULL DEFAULT '',
  source           text NOT NULL DEFAULT '',
  posted_by        text,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamp NOT NULL DEFAULT now(),
  updated_at       timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_active_idx ON job (active);
