-- Lock down public CV enumeration.
--
-- 0020 granted anon SELECT on the whole `cv` table through a policy whose USING clause
-- only filtered PUBLISHED rows. PostgREST filters are client-supplied, so any holder of
-- the anon key - which ships inside the web bundle and the Android APK - could run
--   GET /rest/v1/cv?select=*&is_public=eq.true
-- and list EVERY published CV in full, including the base64 photo, without ever knowing
-- a slug. That defeats the product's "unlisted link" model: the database cannot express
-- "unreachable without the link" through a filter the client chooses.
--
-- The public share page needs no anon grant. app/(app)/cv/[slug]/page.tsx reads
-- server-side as `postgres` and scopes with and(eq(cv.publicSlug, slug), eq(cv.isPublic, true)).
--
-- APPLIED BY HAND 2026-09-20. After this, anon holds SELECT on `job` only.
-- To verify: scripts/assert-rls.mjs
-- To reverse (not recommended): GRANT SELECT ON public.cv TO anon; plus recreate the policy.

DROP POLICY IF EXISTS cv_public_share_select ON public.cv;
REVOKE SELECT ON public.cv FROM anon;
