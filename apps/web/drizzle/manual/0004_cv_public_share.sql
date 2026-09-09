-- Public CV share ("CV yako mtandaoni").
-- Run ONCE in the Supabase SQL editor BEFORE deploying the share feature.
-- Adds opt-in public-link columns to the cv table. All additive + idempotent;
-- existing rows default to private (is_public = false), so nothing is exposed
-- until a user explicitly turns sharing on.

ALTER TABLE cv ADD COLUMN IF NOT EXISTS is_public            boolean NOT NULL DEFAULT false;
ALTER TABLE cv ADD COLUMN IF NOT EXISTS public_slug          text;
ALTER TABLE cv ADD COLUMN IF NOT EXISTS public_show_contact  boolean NOT NULL DEFAULT true;

-- Slug must be globally unique (it's the public URL) and fast to look up.
CREATE UNIQUE INDEX IF NOT EXISTS cv_public_slug_key ON cv (public_slug);
CREATE INDEX        IF NOT EXISTS cv_public_slug_idx ON cv (public_slug);
