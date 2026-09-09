-- Follow-up reminder tracking for the Application Workspace.
-- Run ONCE in the Supabase SQL editor (or `npm run db:push`). Adds the column the
-- daily follow-up cron uses to remind at most once per week per application.
-- Without it, the cron's query errors and no reminders are sent (the workspace
-- and everything else still work).

ALTER TABLE application
  ADD COLUMN IF NOT EXISTS follow_up_reminded_at timestamp;
