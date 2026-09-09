-- Business documents: quotation / invoice / letterhead letter types.
-- Run ONCE in the Supabase SQL editor BEFORE deploying the business-docs tools.
-- Additive: ALTER TYPE ... ADD VALUE only appends; existing rows keep their
-- current letter_type. Postgres requires each new value in its own statement.

ALTER TYPE letter_type ADD VALUE IF NOT EXISTS 'quotation';
ALTER TYPE letter_type ADD VALUE IF NOT EXISTS 'invoice';
ALTER TYPE letter_type ADD VALUE IF NOT EXISTS 'letterhead';
