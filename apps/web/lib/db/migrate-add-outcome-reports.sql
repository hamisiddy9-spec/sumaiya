-- Migration: Add outcome_report table for tracking user success (interviews, offers, rejections)
-- Purpose: Close feedback loop — know if AI recommendations actually help users get hired
-- Date: 2026-09-18

CREATE TABLE IF NOT EXISTS outcome_report (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- Which documents this outcome relates to
  cv_id TEXT,
  cover_letter_id TEXT,

  -- What happened: none_yet | interview | offer | rejection | not_sent
  outcome TEXT NOT NULL DEFAULT 'none_yet',

  -- Context for AI learning
  company_name TEXT,
  job_title TEXT,
  applied_via TEXT DEFAULT 'unknown', -- sumaiya-email, linkedin, indeed, manual

  -- Timeline
  document_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  application_sent_at TIMESTAMP,
  outcome_reported_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Interview details (if outcome = interview)
  interview_date TIMESTAMP,
  interview_type TEXT, -- phone, video, in-person, unknown

  -- Offer details (if outcome = offer)
  offer_accepted TEXT, -- yes, no, pending
  offer_salary_min INTEGER, -- KES/USD
  offer_salary_max INTEGER,

  -- User feedback on AI helpfulness
  ai_helpful_rating INTEGER, -- 1-5 scale
  feedback_text TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS outcome_user_idx ON outcome_report(user_id);
CREATE INDEX IF NOT EXISTS outcome_cv_idx ON outcome_report(cv_id);
CREATE INDEX IF NOT EXISTS outcome_outcome_idx ON outcome_report(outcome);
CREATE INDEX IF NOT EXISTS outcome_created_idx ON outcome_report(created_at DESC);
