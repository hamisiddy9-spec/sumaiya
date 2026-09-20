-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — close the public-anon-key hole.
--
-- THE HOLE (measured on the live project 2026-09-20, before this migration):
--   public tables 33 · RLS enabled 0 · policies 0
--   anon privileges: SELECT=33 INSERT=33 UPDATE=33 DELETE=33 TRUNCATE=33
--                    REFERENCES=33 TRIGGER=33
--   With ONLY the anon key that ships in the browser bundle
--   (NEXT_PUBLIC_SUPABASE_ANON_KEY — public by design, see .github/workflows/ci.yml:22-23)
--   an unauthenticated caller could, over PostgREST:
--     GET /rest/v1/cv          -> HTTP 200 and a stranger's CV, photo included
--     GET /rest/v1/profile     -> HTTP 200
--     POST /rest/v1/device_token -> HTTP 201 (a row for an arbitrary user_id)
--     POST /rest/v1/cv          -> HTTP 201 (a CV owned by an arbitrary user_id)
--     PATCH /rest/v1/cv?id=eq.… -> HTTP 200 (tamper with a stranger's CV)
--     POST /rest/v1/job, DELETE /rest/v1/job?id=eq.… -> HTTP 201 / HTTP 200
--
-- WHY IT WAS INVISIBLE: every product read/write goes through Drizzle over
-- DATABASE_URL as the 'postgres' role, which holds bypassrls and owns every
-- table — so RLS being off had no effect on the app and no test went red. The
-- exposure is only through Supabase's PostgREST endpoint.
--
-- WHY THIS SHAPE (verified against the code, not assumed):
--   * The web app uses supabase-js for **auth only** — getUser / getSession /
--     verifyOtp / exchangeCodeForSession / updateUser. There is not one
--     `.from(…)` data call anywhere in apps/web or apps/native.
--   * The native app (apps/native/src/lib/supabase.ts) is auth-only too: it
--     hands its access token to ApiClient and talks to /api/* on sumaiya.app.
--   * The only two PostgREST data routes in the repo — app/api/applications/list
--     and app/api/jobs/[id]/apply — query a table called `applications` that does
--     not exist (the real table is `application`); they are dead code.
--   * The guest CV editor never touches the database. A guest CV is client state
--     persisted to localStorage under "sumaiya-guest-cv"
--     (components/editor/cv-editor-client.tsx:122, :1289, app/(app)/migrate-guest/page.tsx:38),
--     and the guest doc is a literal `{ id: "guest", userId: "guest" }`
--     (app/(app)/editor/cv/try/page.tsx:53). lib/api/routes/snap.ts:75 says the
--     same in words: "Guest CV (from localStorage …) — guests have no DB".
--   * Therefore NOTHING in the product needs an anonymous PostgREST write, and
--     nothing needs an anonymous PostgREST read except the two surfaces below.
--
-- WHAT THIS MIGRATION DOES
--   1. ENABLE ROW LEVEL SECURITY on all 33 tables in `public`.
--   2. Owner-scoped SELECT/INSERT/UPDATE/DELETE (`auth.uid()`) on the 27 tables
--      that belong to a user.
--   3. Public SELECT on exactly two surfaces the product intends to be public:
--      an explicitly shared CV (cv.is_public) and the job feed.
--   4. Deny-by-default on the 5 tables that are pure server-side telemetry:
--      RLS on, no policy at all.
--   5. No anonymous write anywhere: anon loses INSERT/UPDATE/DELETE/TRUNCATE/
--      REFERENCES/TRIGGER outright, and loses SELECT everywhere except cv + job.
--   6. Future tables are not born open: default privileges for anon are revoked.
--   7. HARDENING, separate and clearly labelled: give every text primary key a
--      DEFAULT so an insert that omits the id can never leave a half-formed row.
--
-- NOTE ON service_role: it is NOT given a policy. The role has rolbypassrls=true
-- (verified on the live project) exactly like the 'postgres' role, which is the
-- documented way it is meant to be used. Writing a policy for it would be wrong.
--
-- NOTE ON 'postgres': the app's DATABASE_URL connects as 'postgres', which owns
-- every one of these tables and therefore bypasses RLS by ownership. This
-- migration deliberately does NOT use FORCE ROW LEVEL SECURITY — forcing it would
-- lock the product out of its own database.
--
-- additive + idempotent: safe to run more than once, and safe to run before the
-- code that uses it ships (no app code path reads the policy set).
--
-- APPLIED BY HAND — this file records what was applied; nothing runs it.
--   Status: **APPLIED**. Applied to the live project (ref duywnmibgiqulqzunsmh)
--   on 2026-09-20 over the connection pooler, as ONE multi-statement simple query
--   so Postgres ran the whole file in a single implicit transaction — any failure
--   would have rolled back every statement and left the database untouched.
--   Result: 287 statement results, 919 ms, no error.
--   Verified immediately after applying:
--     • pg_class: 33/33 public tables relrowsecurity = true        (before: 0/33)
--     • pg_policies: 108 policies                                  (before: 0)
--     • anon table privileges: SELECT on cv + job only; no write privilege on
--       any of the 33 tables                                     (before: on all 33)
--     • pg_default_acl: anon no longer inherits privileges on new tables
--     • every anonymous probe below now returns 401 (code 42501 "permission
--       denied for table …") or HTTP 200 with zero rows           (before: 200/201)
--     • scripts/assert-rls.mjs exits 0, and exits 1 when a grant is put back
--     • a second, real user cannot read the first user's CV row; a user cannot
--       insert a row owned by someone else (403 "new row violates row-level
--       security policy")
--   There is deliberately NO applier script in scripts/ — a previous revision had
--   scripts/apply-migration.mjs, which could run arbitrary SQL against the live
--   database if invoked by accident (it was removed). Apply this the same way
--   0013–0019 were applied:
--     psql "$DATABASE_URL" -f apps/web/drizzle/migrations/0020_row_level_security.sql
--   Then confirm with the verification block at the foot of this file, and run
--     node scripts/assert-rls.mjs
--   (which needs DATABASE_URL and fails the build if the hole re-opens).
--
-- REVERT: _hdd-data/rls-audit/backup-before-rls/revert.sql (outside the repo)
-- drops every policy below, disables RLS on all 33 tables, restores the exact
-- pre-change grants and drops the added id defaults.
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══ STEP 1 · ENABLE RLS ON EVERY TABLE IN public (33) ════════════════════════
ALTER TABLE public."ai_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."app_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."app_release" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ats_score_snapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."business_card" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."campaign_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cover_letter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cv" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."debug_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."device_token" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."document_version" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."download_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."email_application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."eval_sample" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job_match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job_recommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."letter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."outcome_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."outcome_report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."provenance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."referral_claim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."referral_code" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."saved_job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."signal_notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."template_submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tool_invocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."web_push_subscription" ENABLE ROW LEVEL SECURITY;

-- ═══ STEP 2 · OWNER-SCOPED POLICIES (`user_id = auth.uid()`) — 24 tables ══════
-- Each table is per-user and every write to it comes from a Bearer-authenticated
-- /api/* call (lib/api/auth.ts#getAuthUser) or, on native, from ApiClient with the
-- Supabase access token. auth.uid() is NULL without a JWT, so a NULL comparison
-- cannot match a row: an anon caller is denied by construction, not by accident.
-- Each policy is wrapped in `(select auth.uid())` so Postgres evaluates it once
-- per statement instead of once per row.

-- ai_usage — needed by: lib/api/ai-limit.ts (per-user AI budget), lib/api/routes/user.ts (account deletion)
DROP POLICY IF EXISTS "ai_usage_owner_select" ON public."ai_usage";
CREATE POLICY "ai_usage_owner_select" ON public."ai_usage"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ai_usage_owner_insert" ON public."ai_usage";
CREATE POLICY "ai_usage_owner_insert" ON public."ai_usage"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ai_usage_owner_update" ON public."ai_usage";
CREATE POLICY "ai_usage_owner_update" ON public."ai_usage"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ai_usage_owner_delete" ON public."ai_usage";
CREATE POLICY "ai_usage_owner_delete" ON public."ai_usage"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- application — needed by: lib/api/routes/applications.ts, lib/api/routes/user.ts
DROP POLICY IF EXISTS "application_owner_select" ON public."application";
CREATE POLICY "application_owner_select" ON public."application"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "application_owner_insert" ON public."application";
CREATE POLICY "application_owner_insert" ON public."application"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "application_owner_update" ON public."application";
CREATE POLICY "application_owner_update" ON public."application"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "application_owner_delete" ON public."application";
CREATE POLICY "application_owner_delete" ON public."application"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- ats_score_snapshot — needed by: lib/api/routes/ats-history.ts, lib/api/routes/applications.ts
DROP POLICY IF EXISTS "ats_score_snapshot_owner_select" ON public."ats_score_snapshot";
CREATE POLICY "ats_score_snapshot_owner_select" ON public."ats_score_snapshot"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ats_score_snapshot_owner_insert" ON public."ats_score_snapshot";
CREATE POLICY "ats_score_snapshot_owner_insert" ON public."ats_score_snapshot"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ats_score_snapshot_owner_update" ON public."ats_score_snapshot";
CREATE POLICY "ats_score_snapshot_owner_update" ON public."ats_score_snapshot"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ats_score_snapshot_owner_delete" ON public."ats_score_snapshot";
CREATE POLICY "ats_score_snapshot_owner_delete" ON public."ats_score_snapshot"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- business_card — needed by: lib/api/routes/business-card.ts, lib/api/routes/versions.ts
DROP POLICY IF EXISTS "business_card_owner_select" ON public."business_card";
CREATE POLICY "business_card_owner_select" ON public."business_card"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "business_card_owner_insert" ON public."business_card";
CREATE POLICY "business_card_owner_insert" ON public."business_card"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "business_card_owner_update" ON public."business_card";
CREATE POLICY "business_card_owner_update" ON public."business_card"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "business_card_owner_delete" ON public."business_card";
CREATE POLICY "business_card_owner_delete" ON public."business_card"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- cover_letter — needed by: lib/api/routes/cover-letter.ts, lib/api/routes/applications.ts
DROP POLICY IF EXISTS "cover_letter_owner_select" ON public."cover_letter";
CREATE POLICY "cover_letter_owner_select" ON public."cover_letter"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cover_letter_owner_insert" ON public."cover_letter";
CREATE POLICY "cover_letter_owner_insert" ON public."cover_letter"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cover_letter_owner_update" ON public."cover_letter";
CREATE POLICY "cover_letter_owner_update" ON public."cover_letter"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cover_letter_owner_delete" ON public."cover_letter";
CREATE POLICY "cover_letter_owner_delete" ON public."cover_letter"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- cv — needed by: lib/api/routes/cv.ts, lib/api/routes/versions.ts, app/(app)/cv/[slug]/page.tsx
DROP POLICY IF EXISTS "cv_owner_select" ON public."cv";
CREATE POLICY "cv_owner_select" ON public."cv"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cv_owner_insert" ON public."cv";
CREATE POLICY "cv_owner_insert" ON public."cv"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cv_owner_update" ON public."cv";
CREATE POLICY "cv_owner_update" ON public."cv"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "cv_owner_delete" ON public."cv";
CREATE POLICY "cv_owner_delete" ON public."cv"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- debug_event — needed by: lib/api/routes/cv.ts (client debug breadcrumbs)
DROP POLICY IF EXISTS "debug_event_owner_select" ON public."debug_event";
CREATE POLICY "debug_event_owner_select" ON public."debug_event"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "debug_event_owner_insert" ON public."debug_event";
CREATE POLICY "debug_event_owner_insert" ON public."debug_event"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "debug_event_owner_update" ON public."debug_event";
CREATE POLICY "debug_event_owner_update" ON public."debug_event"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "debug_event_owner_delete" ON public."debug_event";
CREATE POLICY "debug_event_owner_delete" ON public."debug_event"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- device_token — needed by: lib/api/routes/mobile.ts (native push registration), lib/push/expo.ts
DROP POLICY IF EXISTS "device_token_owner_select" ON public."device_token";
CREATE POLICY "device_token_owner_select" ON public."device_token"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "device_token_owner_insert" ON public."device_token";
CREATE POLICY "device_token_owner_insert" ON public."device_token"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "device_token_owner_update" ON public."device_token";
CREATE POLICY "device_token_owner_update" ON public."device_token"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "device_token_owner_delete" ON public."device_token";
CREATE POLICY "device_token_owner_delete" ON public."device_token"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- document_version — needed by: lib/api/routes/versions.ts, lib/api/routes/user.ts
DROP POLICY IF EXISTS "document_version_owner_select" ON public."document_version";
CREATE POLICY "document_version_owner_select" ON public."document_version"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "document_version_owner_insert" ON public."document_version";
CREATE POLICY "document_version_owner_insert" ON public."document_version"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "document_version_owner_update" ON public."document_version";
CREATE POLICY "document_version_owner_update" ON public."document_version"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "document_version_owner_delete" ON public."document_version";
CREATE POLICY "document_version_owner_delete" ON public."document_version"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- download_log — needed by: lib/documents/export-ledger.ts, lib/api/routes/user.ts
DROP POLICY IF EXISTS "download_log_owner_select" ON public."download_log";
CREATE POLICY "download_log_owner_select" ON public."download_log"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "download_log_owner_insert" ON public."download_log";
CREATE POLICY "download_log_owner_insert" ON public."download_log"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "download_log_owner_update" ON public."download_log";
CREATE POLICY "download_log_owner_update" ON public."download_log"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "download_log_owner_delete" ON public."download_log";
CREATE POLICY "download_log_owner_delete" ON public."download_log"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- email_application — needed by: server-side only (email-application tracking; lib/db)
DROP POLICY IF EXISTS "email_application_owner_select" ON public."email_application";
CREATE POLICY "email_application_owner_select" ON public."email_application"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "email_application_owner_insert" ON public."email_application";
CREATE POLICY "email_application_owner_insert" ON public."email_application"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "email_application_owner_update" ON public."email_application";
CREATE POLICY "email_application_owner_update" ON public."email_application"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "email_application_owner_delete" ON public."email_application";
CREATE POLICY "email_application_owner_delete" ON public."email_application"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- job_match — needed by: server-side only (CV↔job matching; lib/db)
DROP POLICY IF EXISTS "job_match_owner_select" ON public."job_match";
CREATE POLICY "job_match_owner_select" ON public."job_match"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_match_owner_insert" ON public."job_match";
CREATE POLICY "job_match_owner_insert" ON public."job_match"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_match_owner_update" ON public."job_match";
CREATE POLICY "job_match_owner_update" ON public."job_match"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_match_owner_delete" ON public."job_match";
CREATE POLICY "job_match_owner_delete" ON public."job_match"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- job_recommendation — needed by: lib/jobs/recommend.ts, lib/api/routes/user.ts
DROP POLICY IF EXISTS "job_recommendation_owner_select" ON public."job_recommendation";
CREATE POLICY "job_recommendation_owner_select" ON public."job_recommendation"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_recommendation_owner_insert" ON public."job_recommendation";
CREATE POLICY "job_recommendation_owner_insert" ON public."job_recommendation"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_recommendation_owner_update" ON public."job_recommendation";
CREATE POLICY "job_recommendation_owner_update" ON public."job_recommendation"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "job_recommendation_owner_delete" ON public."job_recommendation";
CREATE POLICY "job_recommendation_owner_delete" ON public."job_recommendation"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- letter — needed by: lib/api/routes/letter.ts, lib/api/routes/versions.ts
DROP POLICY IF EXISTS "letter_owner_select" ON public."letter";
CREATE POLICY "letter_owner_select" ON public."letter"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "letter_owner_insert" ON public."letter";
CREATE POLICY "letter_owner_insert" ON public."letter"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "letter_owner_update" ON public."letter";
CREATE POLICY "letter_owner_update" ON public."letter"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "letter_owner_delete" ON public."letter";
CREATE POLICY "letter_owner_delete" ON public."letter"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- outcome_report — needed by: server-side only (outcome funnel; lib/db)
DROP POLICY IF EXISTS "outcome_report_owner_select" ON public."outcome_report";
CREATE POLICY "outcome_report_owner_select" ON public."outcome_report"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "outcome_report_owner_insert" ON public."outcome_report";
CREATE POLICY "outcome_report_owner_insert" ON public."outcome_report"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "outcome_report_owner_update" ON public."outcome_report";
CREATE POLICY "outcome_report_owner_update" ON public."outcome_report"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "outcome_report_owner_delete" ON public."outcome_report";
CREATE POLICY "outcome_report_owner_delete" ON public."outcome_report"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- payment — needed by: lib/api/routes/user.ts (account deletion), billing routes
DROP POLICY IF EXISTS "payment_owner_select" ON public."payment";
CREATE POLICY "payment_owner_select" ON public."payment"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "payment_owner_insert" ON public."payment";
CREATE POLICY "payment_owner_insert" ON public."payment"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "payment_owner_update" ON public."payment";
CREATE POLICY "payment_owner_update" ON public."payment"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "payment_owner_delete" ON public."payment";
CREATE POLICY "payment_owner_delete" ON public."payment"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- provenance — needed by: lib/api/routes/cv.ts, lib/api/routes/profile.ts (AI evidence spans)
DROP POLICY IF EXISTS "provenance_owner_select" ON public."provenance";
CREATE POLICY "provenance_owner_select" ON public."provenance"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "provenance_owner_insert" ON public."provenance";
CREATE POLICY "provenance_owner_insert" ON public."provenance"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "provenance_owner_update" ON public."provenance";
CREATE POLICY "provenance_owner_update" ON public."provenance"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "provenance_owner_delete" ON public."provenance";
CREATE POLICY "provenance_owner_delete" ON public."provenance"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- referral_code — needed by: lib/referral.ts
DROP POLICY IF EXISTS "referral_code_owner_select" ON public."referral_code";
CREATE POLICY "referral_code_owner_select" ON public."referral_code"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "referral_code_owner_insert" ON public."referral_code";
CREATE POLICY "referral_code_owner_insert" ON public."referral_code"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "referral_code_owner_update" ON public."referral_code";
CREATE POLICY "referral_code_owner_update" ON public."referral_code"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "referral_code_owner_delete" ON public."referral_code";
CREATE POLICY "referral_code_owner_delete" ON public."referral_code"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- saved_job — needed by: server-side only (saved jobs; lib/db)
DROP POLICY IF EXISTS "saved_job_owner_select" ON public."saved_job";
CREATE POLICY "saved_job_owner_select" ON public."saved_job"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "saved_job_owner_insert" ON public."saved_job";
CREATE POLICY "saved_job_owner_insert" ON public."saved_job"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "saved_job_owner_update" ON public."saved_job";
CREATE POLICY "saved_job_owner_update" ON public."saved_job"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "saved_job_owner_delete" ON public."saved_job";
CREATE POLICY "saved_job_owner_delete" ON public."saved_job"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- signal_notification — needed by: lib/notify/dispatch-signals.ts
DROP POLICY IF EXISTS "signal_notification_owner_select" ON public."signal_notification";
CREATE POLICY "signal_notification_owner_select" ON public."signal_notification"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "signal_notification_owner_insert" ON public."signal_notification";
CREATE POLICY "signal_notification_owner_insert" ON public."signal_notification"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "signal_notification_owner_update" ON public."signal_notification";
CREATE POLICY "signal_notification_owner_update" ON public."signal_notification"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "signal_notification_owner_delete" ON public."signal_notification";
CREATE POLICY "signal_notification_owner_delete" ON public."signal_notification"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- subscription — needed by: lib/api/routes/user.ts, billing routes
DROP POLICY IF EXISTS "subscription_owner_select" ON public."subscription";
CREATE POLICY "subscription_owner_select" ON public."subscription"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "subscription_owner_insert" ON public."subscription";
CREATE POLICY "subscription_owner_insert" ON public."subscription"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "subscription_owner_update" ON public."subscription";
CREATE POLICY "subscription_owner_update" ON public."subscription"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "subscription_owner_delete" ON public."subscription";
CREATE POLICY "subscription_owner_delete" ON public."subscription"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- template_submission — needed by: lib/api/routes/marketplace.ts, app/(app)/admin/submissions/page.tsx
DROP POLICY IF EXISTS "template_submission_owner_select" ON public."template_submission";
CREATE POLICY "template_submission_owner_select" ON public."template_submission"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "template_submission_owner_insert" ON public."template_submission";
CREATE POLICY "template_submission_owner_insert" ON public."template_submission"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "template_submission_owner_update" ON public."template_submission";
CREATE POLICY "template_submission_owner_update" ON public."template_submission"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "template_submission_owner_delete" ON public."template_submission";
CREATE POLICY "template_submission_owner_delete" ON public."template_submission"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- tool_invocation — needed by: lib/assistant/run-tool.ts, lib/ai/budget.ts
DROP POLICY IF EXISTS "tool_invocation_owner_select" ON public."tool_invocation";
CREATE POLICY "tool_invocation_owner_select" ON public."tool_invocation"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "tool_invocation_owner_insert" ON public."tool_invocation";
CREATE POLICY "tool_invocation_owner_insert" ON public."tool_invocation"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "tool_invocation_owner_update" ON public."tool_invocation";
CREATE POLICY "tool_invocation_owner_update" ON public."tool_invocation"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "tool_invocation_owner_delete" ON public."tool_invocation";
CREATE POLICY "tool_invocation_owner_delete" ON public."tool_invocation"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- web_push_subscription — needed by: lib/push/index.ts, lib/push-client.ts
DROP POLICY IF EXISTS "web_push_subscription_owner_select" ON public."web_push_subscription";
CREATE POLICY "web_push_subscription_owner_select" ON public."web_push_subscription"
  FOR SELECT TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "web_push_subscription_owner_insert" ON public."web_push_subscription";
CREATE POLICY "web_push_subscription_owner_insert" ON public."web_push_subscription"
  FOR INSERT TO authenticated
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "web_push_subscription_owner_update" ON public."web_push_subscription";
CREATE POLICY "web_push_subscription_owner_update" ON public."web_push_subscription"
  FOR UPDATE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text)
  WITH CHECK ("user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "web_push_subscription_owner_delete" ON public."web_push_subscription";
CREATE POLICY "web_push_subscription_owner_delete" ON public."web_push_subscription"
  FOR DELETE TO authenticated
  USING ("user_id" = (SELECT auth.uid())::text);

-- ═══ STEP 2b · OWNER-SCOPED POLICIES — the 2 tables keyed by the user id ══════
-- `profile.id` and `user_profile.id` ARE auth.users.id (profile.ts declares
-- "id: text().primaryKey() // references auth.users.id"; user_profile.id is a FK
-- to profile.id). So the owner column is `id`, not `user_id`.

-- profile — needed by: lib/referral.ts, lib/api/routes/user.ts (the row id IS the auth user id)
DROP POLICY IF EXISTS "profile_owner_select" ON public."profile";
CREATE POLICY "profile_owner_select" ON public."profile"
  FOR SELECT TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "profile_owner_insert" ON public."profile";
CREATE POLICY "profile_owner_insert" ON public."profile"
  FOR INSERT TO authenticated
  WITH CHECK ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "profile_owner_update" ON public."profile";
CREATE POLICY "profile_owner_update" ON public."profile"
  FOR UPDATE TO authenticated
  USING ("id" = (SELECT auth.uid())::text)
  WITH CHECK ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "profile_owner_delete" ON public."profile";
CREATE POLICY "profile_owner_delete" ON public."profile"
  FOR DELETE TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

-- user_profile — needed by: lib/api/routes/profile.ts, lib/api/routes/mobile.ts, lib/api/routes/jobs.ts (the row id IS the auth user id)
DROP POLICY IF EXISTS "user_profile_owner_select" ON public."user_profile";
CREATE POLICY "user_profile_owner_select" ON public."user_profile"
  FOR SELECT TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "user_profile_owner_insert" ON public."user_profile";
CREATE POLICY "user_profile_owner_insert" ON public."user_profile"
  FOR INSERT TO authenticated
  WITH CHECK ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "user_profile_owner_update" ON public."user_profile";
CREATE POLICY "user_profile_owner_update" ON public."user_profile"
  FOR UPDATE TO authenticated
  USING ("id" = (SELECT auth.uid())::text)
  WITH CHECK ("id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "user_profile_owner_delete" ON public."user_profile";
CREATE POLICY "user_profile_owner_delete" ON public."user_profile"
  FOR DELETE TO authenticated
  USING ("id" = (SELECT auth.uid())::text);

-- ═══ STEP 2c · referral_claim — two parties, both owner columns ══════════════
-- A claim joins a referrer to a referred user; each of them may see their own
-- row (lib/referral.ts reads it to pay out premium time and to render "who you
-- invited"). INSERT is restricted to `referred_user_id = auth.uid()` so a user
-- cannot forge a claim naming someone else as the referred party, and nobody can
-- make themselves the referrer of a stranger.
DROP POLICY IF EXISTS "referral_claim_party_select" ON public."referral_claim";
CREATE POLICY "referral_claim_party_select" ON public."referral_claim"
  FOR SELECT TO authenticated
  USING ("referrer_user_id" = (SELECT auth.uid())::text
      OR "referred_user_id" = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "referral_claim_referred_insert" ON public."referral_claim";
CREATE POLICY "referral_claim_referred_insert" ON public."referral_claim"
  FOR INSERT TO authenticated
  WITH CHECK ("referred_user_id" = (SELECT auth.uid())::text);

-- No UPDATE and no DELETE policy: a claim is written once by the signup path and
-- is never edited or removed by a client. Absence of a policy is the denial.

-- ═══ STEP 3 · PUBLIC READ — only the two surfaces meant to be public ═════════
-- These are the ONLY two GRANT SELECT policies in this file. Everything the
-- product genuinely serves to a logged-out visitor already renders server-side
-- through Drizzle; these policies exist so that the intent is enforced in the
-- database if a PostgREST read path is ever added, and so that anon reads cannot
-- silently widen later.

-- cv — needed by: app/(app)/cv/[slug]/page.tsx ("CV yako mtandaoni", the opt-in
-- share link) and app/(app)/cv/[slug]/opengraph-image.tsx, which both scope on
-- (public_slug = slug AND is_public = true). Scoped to explicitly published rows
-- ONLY: a private CV stays unreadable, and `public_slug IS NOT NULL` is required
-- so the public view can never be reached without a link.
DROP POLICY IF EXISTS "cv_public_share_select" ON public."cv";
CREATE POLICY "cv_public_share_select" ON public."cv"
  FOR SELECT TO anon, authenticated
  USING ("is_public" = true AND "public_slug" IS NOT NULL);

-- job — needed by: the job feed (lib/api/routes/jobs.ts, app/api/jobs/feed,
-- native apps/native/src/screens/app/jobs-screen.tsx). Job listings are public
-- by nature and hold no personal data, so a plain public read is correct.
-- NOTE: no `status`/`is_active` predicate is used here because the live table
-- and apps/web/lib/db/schema.ts have drifted apart on this table (the live
-- columns are source_job_id/is_active/…; the Drizzle definition is
-- status/apply_url/…). A predicate on a column that a future drizzle-kit change
-- renames would silently break the feed. Public read of public data is safe.
DROP POLICY IF EXISTS "job_public_feed_select" ON public."job";
CREATE POLICY "job_public_feed_select" ON public."job"
  FOR SELECT TO anon, authenticated
  USING (true);

-- ═══ STEP 4 · DENY BY DEFAULT — RLS on, deliberately NO policy (5 tables) ═════
-- These are server-side records with no per-user owner column, and no client of
-- any kind reads them directly. RLS with zero policies denies anon AND
-- authenticated completely; the app still reads and writes them as 'postgres'.
--   app_event       — native telemetry, keyed by install_id (lib/api/routes/app-telemetry.ts)
--   app_release     — APK release metadata (lib/app-update.ts)
--   campaign_event  — poster-scan funnel (lib/api/routes/campaign-events.ts)
--   eval_sample     — AI evaluation samples (lib/assistant/run-tool.ts)
--   outcome_event   — outcome funnel, keyed by a salted user HASH, never a user id
--                     (lib/outcomes/events.ts) — `auth.uid()` cannot be matched to it
--                     by design, so no owner policy is even expressible.
-- Assertion (run after applying): every one of the five has 0 policies.

-- ═══ STEP 5 · NO ANONYMOUS WRITE ANYWHERE ════════════════════════════════════
-- Belt and braces on top of RLS: anon loses every write privilege outright, so a
-- policy mistake cannot re-open a write path. RLS is the enforcement layer; these
-- REVOKEs make the grant layer agree with it.
-- anon also loses SELECT everywhere except the two public surfaces in STEP 3 —
-- a missing table privilege is reported by PostgREST before any policy is
-- evaluated (401/403), which is a clearer failure than an empty 200.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public."cv", public."job" TO anon;

-- 'authenticated' keeps its SELECT/INSERT/UPDATE/DELETE grants on purpose: RLS is
-- what scopes them, and that is what makes the owner-scoped model provable over
-- PostgREST (probe: user A reads their own cv, user B cannot). It loses the three
-- privileges no client can ever need — TRUNCATE, REFERENCES, TRIGGER — none of
-- which are reachable through PostgREST anyway.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;

-- ═══ STEP 6 · FUTURE TABLES ARE NOT BORN OPEN ════════════════════════════════
-- The default ACL for tables created in `public` by `postgres` was
-- `postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres,
-- service_role=arwdDxtm/postgres` — i.e. every NEW table inherited the hole.
-- This revokes anon's inheritance. A new table that genuinely needs PostgREST
-- access must now say so explicitly (GRANT + ENABLE RLS + policy), which is the
-- behaviour we want.
--
-- KNOWN RESIDUAL: default privileges cannot enable RLS on future tables — only a
-- migration or a CI assertion can. scripts/assert-rls.mjs is that assertion; run
-- it before a release. It fails if any public table has relrowsecurity = false,
-- or if anon holds a privilege on a table with no public-read policy.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM authenticated;

-- ═══ STEP 7 · HARDENING (separate, clearly labelled) — PRIMARY-KEY DEFAULTs ═══
-- Verified on the live project before this migration: all 33 `id` columns are
-- `text NOT NULL` with **no DEFAULT**, so an insert that omits the id fails hard
-- with Postgres 23502:
--   POST /rest/v1/cv {"user_id":"…","title":"no-id-probe"} ->
--   HTTP 400 {"code":"23502","message":"null value in column \"id\" of relation
--             \"cv\" violates not-null constraint"}
-- The app always supplies its own id (lib/api/routes/cv.ts:147 uses `nanoid()`,
-- likewise every other create path), so this changes no app behaviour. It makes
-- the database able to produce a valid row on its own, so a half-formed insert
-- cannot be an error that leaks an internal shape or a partial row.
--
-- This is a SEPARATE step from the security fix: it can be reverted on its own
-- (revert.sql drops these defaults) without touching RLS or the policies.
-- `gen_random_uuid()` is in pg_catalog on PostgreSQL 13+ (this project is 17.6),
-- so no extension is required. `ai_usage` is excluded — its primary key is the
-- composite (user_id, day) and it has no `id` column at all.
ALTER TABLE public."app_event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."app_release" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."application" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."ats_score_snapshot" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."business_card" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."campaign_event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."cover_letter" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."cv" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."debug_event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."device_token" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."document_version" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."download_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."email_application" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."eval_sample" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."job" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."job_match" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."job_recommendation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."letter" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."outcome_event" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."outcome_report" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."payment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."profile" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."provenance" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."referral_claim" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."referral_code" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."saved_job" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."signal_notification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."subscription" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."template_submission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."tool_invocation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."user_profile" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public."web_push_subscription" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- ═══ VERIFICATION — run after applying ═══════════════════════════════════════
-- 1) Every public table has RLS on (expect 33 rows, relrowsecurity = true):
--      select c.relname, c.relrowsecurity from pg_class c
--        join pg_namespace n on n.oid = c.relnamespace
--       where n.nspname = 'public' and c.relkind = 'r' order by 1;
-- 2) Policy count (expect 108 = 24 user_id tables x 4 + 2 id-keyed tables x 4
--    + referral_claim's SELECT+INSERT + cv's public read + job's public read):
--      select count(*) from pg_policies where schemaname = 'public';
-- 3) anon holds SELECT on cv + job and NOTHING else (expect 2 rows):
--      select table_name, privilege_type
--        from information_schema.role_table_grants
--       where grantee = 'anon' and table_schema = 'public' order by 1,2;
-- 4) The five deny-by-default tables have zero policies:
--      select tablename, count(*) from pg_policies where schemaname = 'public'
--       and tablename in ('app_event','app_release','campaign_event','eval_sample','outcome_event')
--       group by 1;   -- expect no rows
-- 5) Every id column has a default (expect 32 rows):
--      select table_name, column_default from information_schema.columns
--       where table_schema = 'public' and column_name = 'id' order by 1;
