-- Lock down the `job` table's internal columns.
--
-- 0020 granted anon SELECT on the whole `job` table via job_public_feed_select. A
-- table-level grant cannot express a column projection, so any holder of the anon key
-- - which ships inside the web bundle and the Android APK - could read columns that
-- lib/api/routes/jobs.ts deliberately withholds from its unauthenticated endpoint:
--   GET /rest/v1/job?select=source,source_url,external_id&limit=2
--   -> 200 {"source":"remotive","source_url":"https://remotive.com/remote-jobs/..."}
-- The route's careful projection is bypassed by the grant underneath it.
--
-- No app code needs this access. Every product read goes through Drizzle as `postgres`
-- (apps/web/lib/**/*.ts); supabase-js is auth-only and never calls .from() on a table,
-- and the feed the user sees is served by the app, not by PostgREST.
--
-- APPLIED BY HAND 2026-09-20. After this the anon key holds ZERO data access to any
-- public table. Verify: scripts/assert-rls.mjs
-- Reverse (not recommended): GRANT SELECT ON public.job TO anon; plus recreate the policy.

REVOKE SELECT ON public.job FROM anon;
DROP POLICY IF EXISTS job_public_feed_select ON public.job;
