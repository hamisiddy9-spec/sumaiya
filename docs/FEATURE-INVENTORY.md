# Sumaiya — feature inventory, measured from the code

**Measured:** 2026-09-19, branch `main` @ `aee08ae` (`refactor(templates): make the template
system native-only (D1)`), from the working tree at `C:\Users\hamis\projects\sumaiya`.
**Method:** read the source; run the two suites; read the routing, the API surface and the
test coverage rather than any prose doc. Nothing in this file is copied from another
document — every claim traces to a file path, a test, or a command output recorded below.

**The tree was moving while I measured.** Another writer had five files uncommitted under
`apps/web/lib/templates/*` and `apps/web/scripts/generate-template-registry.mjs`, plus
`apps/native/src/navigation/root-navigator.tsx` — all of it the same D1 cleanup (deleting dead
TemplateHub branches and comments). Those edits change no counts and no behaviour that this
inventory describes. `npx tsc --noEmit` was re-run against the final tree and is clean; the two
suites were re-run against it too, and the counts below are from those runs. I committed only
this file — nothing else in that tree was touched.

**What "measured" excludes, stated up front:** I did not run the app, start a server, connect
to the database, call an AI provider, build the APK, or open a phone. So a **WORKS** here means
*the code is wired end to end and a passing test exercises its logic* — it does **not** mean
*observed working in production*. Everywhere I could only establish wiring, the row says
**UNVERIFIED**. §8 lists everything I could not check and why.

---

## 1 · State key

| State | Means |
|---|---|
| **WORKS** | Implemented, wired to a route/entry point a user can reach, **and** covered by tests that pass in this run. |
| **UNVERIFIED** | Implemented and wired, but no passing test exercises the path, **or** it depends on a service/device I could not run (live DB, AI provider key, phone hardware). Not known broken — not proven working. |
| **BROKEN** | Two pieces of the code contradict each other, or a declared route/link resolves to nothing, or a real defect is visible in the source. |
| **NOT IMPLEMENTED** | No code. Includes deliberate omissions (payments) and stubs that look like features but return placeholders. |

## 2 · The test evidence, verbatim

```
cd apps/web && npx vitest run
  Test Files  127 passed | 1 skipped (128)
  Tests       2052 passed | 3 skipped (2055)
  Duration    47.58s

cd apps/native && npx jest
  Test Suites: 42 passed, 42 total
  Tests:       1201 passed, 1201 total
  Snapshots:   0 total
  Time:        9.251 s
```

Two further runs, for completeness:

```
cd apps/web && npx tsc --noEmit      → no output, no errors
cd apps/whatsapp && node --test      → # tests 4 · # pass 4 · # fail 0
```

The 3 skipped web tests are environment-gated, not broken: `evals/language-fidelity.test.ts`
and `evals/tailor-quality.test.ts` need a live AI provider key;
`lib/career-profile/db-verify.test.ts` needs a real database. The web suite is hermetic on
purpose — `apps/web/test/hermetic-ai-env.ts` strips provider keys before any test loads, so
**no test in this repo makes a real AI call.**

**Coverage shape (this matters for the rebuild):** 128 web test files, none of them under
`app/`. All coverage is in `lib/` (109 files), `types/` (5), `evals/` (9), `components/` (3 —
only `admin/campaign-funnel-view`, `templates/template-utils`, `install-prompt`). There are
**no `.test.tsx` component tests at all**. The Next.js route/page layer has no direct test
coverage; two evals (`evals/snap-apply.test.ts`, `evals/snap-ocr.test.ts`) assert by *reading
`snap-client.tsx` as text* rather than rendering it.

## 3 · Correcting the record (claims checked against the code)

| Claim found in older docs | Measured |
|---|---|
| a `mobile/` directory, `apps/mobile` | **neither exists.** The app is `apps/native`. |
| 273 templates | **does not exist.** `components/templates/*.tsx` = 268 files, of which **266 are template components** imported by `components/templates/registry.ts`; 2 are shared infra (`template-canvas.tsx`, `template-utils.tsx`). `lib/templates/registry.ts` = **266** metadata entries. |
| "267 template files" (docs/DECISIONS.md) | off by one: 268 `.tsx`, 266 of them templates. |
| `npm run build:android` | **no such script** in any `package.json`. |
| "273 template pages prerendered" (`next.config.mjs`) | stale comment. `app/[locale]/(marketing)/templates/[slug]/page.tsx` generates from `TEMPLATES` = the **47** curated ids × 2 locales. |
| templates offered to users | **47** — `CURATED_CV_TEMPLATE_IDS` in `lib/templates/curation.ts`; of those, 7 are premium-flagged (`PREMIUM_TEMPLATE_IDS`). |
| native template coverage | **218** engine templates (`apps/native/src/lib/templates/registry.ts`), each rendered by `src/lib/cv-engine/registry-sync.test.ts` (20 tests). |

---

## 4 · Web app (`apps/web`) — feature table

| # | Feature | State | Files | Evidence / notes |
|---|---|---|---|---|
| 1 | **Sign-in / sign-up / verify / reset** (email OTP + Google) | UNVERIFIED | `app/(app)/(auth)/{sign-in,sign-up,verify,reset-password}/`, `lib/auth-client.ts`, `lib/auth-errors.ts`, `app/api/auth/{[...all],callback,confirm}/route.ts` | `lib/auth-errors.test.ts` covers the error mapper only. No test signs in; needs Supabase. |
| 2 | **CV editor** (form ↔ live preview, autosave, sections, drag-reorder, versions) | WORKS | `components/editor/cv-editor-client.tsx` (3666 lines), `lib/stores/editor-store.ts`, `app/(app)/(dashboard)/editor/cv/[id]/page.tsx` | Logic tested via `types/parse-cv-data.test.ts`, `types/cv-parse.test.ts`, `lib/cv-shape-boundary.test.ts`, `lib/cv/from-parsed.test.ts`, `lib/api/routes/cv-template-history.test.ts`. **The store and the component themselves have no test.** |
| 3 | **Export → PDF** | WORKS (partly) | `lib/pdf.ts` (`exportElementToPdf`, `renderElementToPdfBlob`), `lib/stores/editor-store.ts:272`, `components/editor/cv-editor-client.tsx:1435` | `lib/pdf.test.ts` (14) covers the decisions around the render — `resolvePdfDelivery`, `resolveExportScale` (low-memory OOM guard), `computePageCount` — **not** the html2canvas/jsPDF render itself, which cannot run in the node test env. |
| 4 | **Export → Word (.docx)** | UNVERIFIED | `lib/docx.ts` (`buildCvDocument`, `downloadCvDocx`), `cv-editor-client.tsx:1580` | Real `docx`-package single-column ATS output. **No test file references `lib/docx.ts`.** Lazy-imported at click time; a failure shows a toast. |
| 5 | **Export → plain text (.txt)** | UNVERIFIED | `lib/pdf.ts` (`buildCvText`, `exportCvToText`), `cv-editor-client.tsx:1611` | No test imports `buildCvText` or `exportCvToText`. |
| 6 | **Share** (Web Share API with the real PDF attached; desktop falls back to download) | UNVERIFIED | `lib/pdf.ts` `sharePdf`, `cv-editor-client.tsx:1624` (`handleShare`) | Behaviour is asserted by `e2e/guest-export.spec.ts`, which I could not run (§8). |
| 7 | **Share CV online** (public link → `/cv/<slug>`) | WORKS (partly) | `components/editor/share-cv-modal.tsx`, `app/(app)/cv/[slug]/page.tsx`, `lib/api/routes/cv.ts:323` (`POST /:id/share`) | Public read is scoped `public_slug = slug AND is_public = true`, so a private CV cannot be reached by guessing. No test on the share route. |
| 8 | **Templates — registry & rendering** | WORKS | `components/templates/registry.ts` (266 entries), `components/templates/*.tsx` (266 components), `lib/templates/{registry,curation,tiers}.ts` | `lib/templates/tiers.test.ts` (4), `lib/templates/provider-select.test.ts` (5), `components/templates/template-utils.test.ts`. Every offered id resolves to a real component: components = 266, registry = 266, and every curated id is present. |
| 9 | **Template picker in the editor** (47 curated, premium locked) | WORKS | inline `TemplateModal` in `cv-editor-client.tsx:857-946`; live thumbnails render the real component via `TemplateMiniPreview`/`TemplateLargePreview` | Premium lock = `isPremiumTemplate(id) && !isActive && !premium && !templateHistory.includes(id)`; `premium` comes from `usePremium()` → `/api/entitlements`. Guarded by `lib/entitlements.test.ts` (20). |
| 10 | **Template gallery + per-template SEO pages** | WORKS | `components/template-gallery-client.tsx`, `app/[locale]/(marketing)/templates/page.tsx`, `.../templates/[slug]/page.tsx` | Gallery lists the 47 curated; `[slug]` prerenders 47 × 2 locales. No test on either page. |
| 11 | **ATS checker (public, no sign-up)** | WORKS | `app/[locale]/(marketing)/ats-checker/{page,ats-checker-client}.tsx`, `lib/ats-text.ts`, `POST /api/tools/extract-text` | Scoring logic is `lib/ats-text.ts` — **which has no test file.** Compare `lib/ats-score.ts`, which does (3 tests) and is the editor's structured scorer. Defect in §7 (client says 15 MB, server caps 4 MB). |
| 12 | **ATS panel in the editor** (+ explainable breakdown, project-aware) | WORKS | `components/editor/ats-panel.tsx`, `components/editor/ats-explain.tsx`, `lib/ats-score.ts`, `lib/ats-explain.ts`, `lib/api/routes/ats-history.ts` | `lib/ats-score.test.ts` (3) + `lib/ats-explain.test.ts` (16). `ats-score.ts` counts impact text from experience **and** projects (commit `18ec853`). |
| 13 | **Tailor to job** (JD → keyword coverage → one-click skills; whole-CV rewrite) | WORKS | `components/editor/job-target-panel.tsx`, `components/jobs/targeted-cv-drawer.tsx`, `lib/targeted-cv.ts`, `lib/job-match.ts`, `POST /api/jobs/targeted-cv`, `POST /api/ai/tailor-cv` | `lib/job-match.test.ts` (24), `lib/targeted-cv.test.ts` (13), `lib/job-analysis.test.ts` (7), `lib/requirement-evidence.test.ts` (14), `lib/api/tailoring-guards.test.ts`. Anti-fabrication guards for the AI rewrite are pinned in `evals/tailor-quality.test.ts`. |
| 14 | **Jobs feed** (real pipeline) | UNVERIFIED | `app/[locale]/(marketing)/jobs/page.tsx`, `components/jobs/jobs-feed.tsx`, `components/jobs/recommended-jobs-section.tsx`, `lib/jobs/*`, `lib/jobs/sources/*` (14 adapters), `app/api/cron/jobs/route.ts`, `lib/api/routes/jobs.ts` | The pipeline is unit-tested hard: `feed-filter` (21), `dedup`, `enrich`, `authenticity`, `location-relevance`, `text`, `sources/registry`, `sources/jobwebtanzania`. **Whether the feed has rows depends on the live DB + the cron having run** — unverifiable here. Key-gated sources (Adzuna, Jooble, USAJobs, Careerjet, Talent) are silently skipped without env vars. |
| 15 | **Applications tracking** | WORKS | `components/dashboard/applications-grid.tsx`, `components/dashboard/application-workspace.tsx`, `components/dashboard/outcome-check.tsx`, `app/(app)/(dashboard)/applications/[id]/page.tsx`, `lib/api/routes/applications.ts`, `lib/applications.ts`, `lib/application-copilot.ts` | Live on the dashboard's `?tab=applications`, plus a per-application detail page. `lib/applications.test.ts` (8) pins the status state machine; `lib/application-copilot.test.ts`. Entry creation from a snap result: `POST /api/applications/from-cv`. |
| 16 | **Cover letters** (generate, edit, PDF export) | UNVERIFIED | `components/editor/cover-letter-editor-client.tsx`, `app/(app)/(dashboard)/editor/cover-letter/[id]/page.tsx`, `app/(app)/editor/cover-letter/try/page.tsx`, `lib/api/routes/cover-letter.ts`, `POST /api/ai/cover-letter` | Wired end to end, **no test file for the route or the editor**. Needs an AI key to generate. |
| 17 | **Business cards / formal letters** (quotation, invoice, letterhead, proposal) | UNVERIFIED | `components/editor/business-card-editor-client.tsx`, `components/editor/letter-editor-client.tsx`, `lib/api/routes/{business-card,letter}.ts`, `app/api/documents/{business-card,letter}/[id]/download/route.ts` | `lib/documents/export-ledger.test.ts` covers the export ledger, not the editors. |
| 18 | **AI assistant / chat ("Sumaiya")** | WORKS (logic) / UNVERIFIED (live) | `app/(app)/assistant/page.tsx`, `components/assistant/cv-assistant-client.tsx` (3786 lines), `lib/assistant/*` (40 files, 21 of them tests) incl. `orchestrator.ts`, `tools.ts`, `run-tool.ts`, `intent.ts`, `conversation-store.ts`, `POST /api/ai/assistant-turn` | `evals/orchestrator.test.ts` + ~20 `lib/assistant/*.test.ts`. Guests get the guest chat (`<CvAssistantClient guest />`). Live replies require a provider key → UNVERIFIED. |
| 19 | **Voice** (spoken CV intake + TTS) | UNVERIFIED | `app/(app)/voice/page.tsx`, `components/voice/voice-intake.tsx`, `lib/voice/intake-script.ts`, `lib/tts/*`, `app/api/tts/route.ts` | `/voice` **requires auth** (redirects to sign-in). Cloud TTS answers 501 without a key and the client falls back to browser `speechSynthesis`. `lib/voice/intake-script.test.ts`, `lib/tts/*.test.ts` (3 files) cover scripts/config, not audibility. |
| 20 | **Interview prep — AI mock interview** | UNVERIFIED | `app/(app)/interview/page.tsx`, `components/interview/interview-client.tsx`, `POST /api/ai/interview-turn` | Turn-by-turn coach grounded in the CV + optional JD; persists in-progress sessions to localStorage. **No test for this component or that endpoint.** |
| 21 | **Career Interview — profile builder** (type or speak) | WORKS | `app/(app)/(dashboard)/career-interview/page.tsx`, `components/interview/career-interview-client.tsx`, `lib/career-interview/questions.ts`, `lib/career-profile/*` | `lib/career-interview/questions.test.ts` (8) + `lib/career-profile/{mapper,evidence,confirmations,mobile-bridge}.test.ts`. `db-verify.test.ts` is skipped without a DB. |
| 22 | **CV import** (upload existing PDF → editable CV) | UNVERIFIED | `app/(app)/(dashboard)/import-cv/page.tsx`, `components/pdf-tools/import-cv-client.tsx`, `lib/client-cv-extract.ts`, `lib/cv/from-parsed.ts`, `POST /api/ai/parse-cv` | **Requires an account** (`redirect("/sign-in?callbackUrl=%2Fimport-cv")`). Only 2 tests cover `client-cv-extract`, 6 cover `from-parsed`; the AI parse step is untested/live-only. Client advertises up to 25 MB. |
| 23 | **Snap-to-Apply** (paste/photo a job → ATS match → tailored CV + cover letter) | WORKS (best-covered feature) | `app/(app)/snap/snap-client.tsx` (1077 lines), `app/[locale]/(marketing)/snap-to-apply/page.tsx`, `lib/snap-{ocr,application,export,share,prefill,strings,a11y}.ts`, `lib/api/{snap-apply,snap-share}.ts`, `lib/api/routes/snap.ts` (`POST /api/ai/snap`), `lib/api/routes/snap-events.ts` | `lib/snap-ocr.test.ts` (8), `snap-share` (18), `snap-prefill` (17), `snap-export` (9), `snap-application` (6), `snap-a11y`, `snap-strings`, `lib/api/routes/snap.test.ts`, `lib/api/snap-{apply,share}.test.ts`, `evals/snap-{apply,ocr}.test.ts`. Guest-usable; the save path stashes to localStorage and converts. |
| 24 | **Snap share card** (`/snap/share/<signed token>`) | WORKS | `app/(app)/snap/share/[token]/page.tsx` + `opengraph-image.tsx`, `lib/api/snap-share.ts` | Signed, self-contained token; 18 tests. |
| 25 | **PDF tools page** (image→PDF, merge, split, rotate, watermark, page numbers, delete pages, extract text) | UNVERIFIED | `app/[locale]/(marketing)/tools/{page,tools-client}.tsx`, `app/[locale]/(marketing)/tools/[slug]/page.tsx`, `lib/pdf-tools.ts`, `lib/pdf-tools-list.ts`, `lib/api/routes/tools.ts` (9 endpoints) | All 8 UI tools have a real `pdf-lib` handler on the server. **`lib/api/routes/tools.ts` has no test file**, and the interactive client has none. Server caps bodies at 4 MB (Vercel limit); WEBP is rejected up front; `POST /tools/protect` exists server-side but is not surfaced (`hasPassword: false` on every tool). |
| 26 | **Dashboard** (CVs, cover letters, business cards, letters, applications, signals, referral) | UNVERIFIED | `app/(app)/(dashboard)/dashboard/page.tsx` (704 lines), `components/dashboard/*` (16 files) | Server-rendered from Drizzle; every list, tab and signal is wired. No test covers the page. Some server reads are wrapped in try/catch so a missing migration degrades to an empty state rather than a 500 (jobs page does this explicitly). |
| 27 | **Daily brief + proactive signals + notifications** | WORKS (logic) | `app/(app)/(dashboard)/brief/page.tsx`, `lib/daily-brief.ts`, `lib/assistant/signals.ts`, `lib/notify/dispatch-signals.ts`, `app/api/cron/signals/route.ts`, `lib/push*`, `lib/api/routes/push.ts` | `lib/daily-brief.test.ts` (10), `lib/assistant/signals.test.ts`, `lib/notify/dispatch-signals.test.ts`, `lib/push/expo.test.ts`, `lib/push-client.test.ts`. Delivery itself unverified. |
| 28 | **Applications follow-up cron** | UNVERIFIED | `app/api/cron/follow-ups/route.ts`, `lib/notify/dispatch-signals.ts` | Scheduled in `vercel.json` (`0 8 * * *`), guarded by `CRON_SECRET`. Whether it has ever run is not visible from the repo. |
| 29 | **Referral loop + earned Premium** | WORKS | `lib/referral.ts`, `components/referral/*`, `lib/api/routes/referral.ts`, `lib/entitlements{,-server}.ts` | `lib/entitlements.test.ts` (20) + `lib/entitlements-server.test.ts`. 7 days of Premium per activated friend. |
| 30 | **Payments / billing** | NOT IMPLEMENTED (deliberate) | `lib/features.ts` (`PAYMENTS_ENABLED = false`), `next.config.mjs` redirects, `components/premium-template-modal.tsx` | **Intentionally off, which is not the same as broken.** There is no `app/api/payments/*`, no checkout page; `/pricing` and `/checkout` redirect home; the pricing nav item is behind the flag. `PAYME_*` env vars in `.env.example` are vestigial. The waitlist flag (`sumaiya_premium_waitlist`) is a local convenience, never an entitlement. |
| 31 | **Admin** (users, jobs, templates, submissions, campaigns, insights) | UNVERIFIED | `app/(app)/admin/*` (7 pages), `lib/admin.ts`, `lib/campaign/*`, `lib/analytics/*` | Gated by `ADMIN_EMAILS`. `components/admin/campaign-funnel-view.test.ts` is the only admin test and it renders the view's numbers. |
| 32 | **PWA / install / offline shell** | WORKS (logic) | `public/sw.js`, `public/sw.test.ts`, `public/manifest.json`, `components/install-prompt.tsx` + `.test.ts`, `lib/pwa/*` | `public/sw.test.ts`, `lib/pwa/{device-gate,ios-hint-logic}.test.ts`, `components/install-prompt.test.ts`. |
| 33 | **Bilingual EN/SW surface** | WORKS | `lib/i18n/translations.ts`, `lib/i18n/context.tsx`, `middleware.ts` (`x-lang`), `lib/swahili-lint.test.ts` | `lib/i18n/translations.test.ts` + `lib/swahili-lint.test.ts` fail the build on calqued Swahili. |
| 34 | **Marketing site** (home, about, jobs, templates, tools, blog, contact, legal, `/pro`) | UNVERIFIED | `app/[locale]/(marketing)/**`, `middleware.ts`, `lib/routing.ts`, `lib/seo.ts` | `lib/routing.test.ts`, `lib/seo.test.ts`. Content and SEO wiring exist; rendering was not exercised. |
| 35 | **WhatsApp channel** | WORKS (unit) / UNVERIFIED (live) | `apps/whatsapp/src/{index,handler}.mjs` + `handler.test.mjs`, `POST /api/whatsapp/turn` | 4 tests, 4 pass (`node --test`). The worker owns the Meta Cloud API webhook; **it starts in health-only mode without env**, and Meta provisioning is an owner task per its README. |

### 4b · Guest mode — "can a signed-out user finish a CV and download it?"

**Code answer: yes. Status: UNVERIFIED, blocked only by environment.**

| Piece | File |
|---|---|
| Guest editor route (no auth) | `app/(app)/editor/cv/try/page.tsx` — redirects *signed-in* users away, serves `guestMode` to everyone else |
| All four export gates are open | `components/editor/cv-editor-client.tsx:976` — `const isPremium = true; // payment temporarily disabled`. The `isPremium` **prop** (line 975) is destructured and then shadowed; it is dead. |
| Delivery before the account ask | `handleDownload` (~1435), `handleDownloadDocx` (~1580), `handleDownloadText` (~1611), `handleShare` (~1624) each fire `setSignUpPrompt("postExport")` **after** the file is out |
| Draft survives the funnel | `localStorage["sumaiya-guest-cv"]` (`cv-editor-client.tsx:116,1335,1385,1407`), converted by `app/(app)/migrate-guest/page.tsx` after sign-in; failure modes in `lib/migrate-guest-failure.ts` (9 tests) |
| A committed regression spec asserting exactly this | `apps/web/e2e/guest-export.spec.ts` — waits for a real `download` event and asserts the PDF is >10 KB, then the prompt. Its own header says the wall "used to" hit every path. |

Why still UNVERIFIED: that spec is **not run by CI** (`.github/workflows/ci.yml` runs tsc, lint,
vitest, build, evals, native tsc/test/export — no `playwright test`), it needs a local
production build plus browser channels, and the guest page calls
`createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, …)` while this checkout's
`.env.local` contains only `DATABASE_URL`. I did not run it (§8). The code path itself has no
ambiguity left — the caveat is environmental, not logical.

---

## 5 · Native app (`apps/native`) — screens and features

Navigation is fixed and readable: `src/navigation/root-navigator.tsx` gates
Onboarding → Auth → FirstRun → App; `src/navigation/stacks/app-tabs.tsx` gives 5 tabs
(Home, CVs, Sumaiya, Import, Profile). There is **no guest mode in the native app** — the whole
app is behind `!user ? <Auth/> : …`.

| Feature / screen | State | Files | Evidence / notes |
|---|---|---|---|
| Onboarding, language pick, splash, first-run wizard | UNVERIFIED (device-QA'd) | `src/screens/{splash,onboarding,first-run}-screen.tsx` | 139 screenshots under `qa/2026-09-11/` plus two written reports at the app root (`QA-REPORT-2026-09-10.md`, `QA-REPORT-2026-09-11.md`) and a Maestro flow in `e2e/smoke.yaml`. That is real device evidence from a *different* APK (§8), not from this run. |
| Auth (email OTP + Google) | BROKEN on the tested APK | `src/screens/auth/sign-in-screen.tsx`, `src/contexts/auth-context.tsx` | `QA-REPORT-2026-09-11.md` P0-1: email OTP dead on production (red "Error sending magic link email", no mail arrives); Google sign-in works. The report calls it a Supabase config issue, not a client bug. Not re-tested here. |
| Home tab | UNVERIFIED | `src/screens/app/home-screen.tsx` (582 lines), `src/lib/recommendations.ts`, `src/lib/guides.ts` | Signals, quick actions, guide cards. |
| CV list | WORKS (logic) | `src/screens/app/cv-list-screen.tsx`, `src/hooks/use-cvs.ts` | `src/hooks/use-cvs.test.ts` (6) covers the offline-first cache + server fold-in and the account-scoped local cache. |
| **CV editor** | WORKS (engine) / UNVERIFIED (screen) | `src/screens/cv-editor-screen.tsx` (648 lines), `src/lib/cv-html.ts`, `src/lib/cv-engine/*` (9 modules) | The strongest evidence in the repo: `src/lib/cv-engine/registry-sync.test.ts` (20 tests) **renders all 218 templates** and asserts non-empty, well-formed output. The screen itself has no test. |
| **Template catalogue on device** | WORKS | `src/lib/templates/registry.ts` (218), `src/lib/templates/*.ts` (220 files incl. `types.ts`), `src/lib/template-suggestions.ts` | 218 entries; `src/lib/template-suggestions.test.ts` (15). Matches the D1 claim that the APK ships templates locally. |
| **PDF export** | WORKS (helpers) / UNVERIFIED (print) | `src/services/pdf-export.ts`, `src/services/share.ts`, `expo-print` | `src/services/pdf-export.test.ts` (4) tests the filename derivation (`"Jane Doe - Storekeeper CV.pdf"`, letter names, unsafe-character stripping), **not** the print call. |
| **ATS checker** | WORKS (logic) | `src/screens/ats-checker-screen.tsx`, `src/lib/ats.ts` | `src/lib/ats.test.ts` (7): empty-vs-strong CV, pillar breakdown, Swahili action verbs, JD keyword overlap. |
| **Tailor / job apply** (CV + cover letter from a JD) | WORKS (logic) | `src/screens/job-apply-screen.tsx`, `src/lib/letter-html.ts`, `src/lib/skill-gaps.ts` | `src/lib/letter-html.test.ts` (8) — includes the guard that refuses to print a letter under 80 chars (the "real-looking PDF that says nothing" bug); `skill-gaps.test.ts` (6). |
| **Jobs list** | UNVERIFIED | `src/screens/jobs-screen.tsx`, `src/lib/job-listing.ts`, `packages/api-client` | `src/lib/job-listing.test.ts` (3). Depends on the live API. |
| **Applications** (list + detail, local SQLite) | UNVERIFIED | `src/screens/applications-screen.tsx`, `src/screens/application-detail-screen.tsx`, `src/lib/applications-store.ts` | expo-sqlite store with a `coverLetter` column; **no test file for `applications-store.ts`**. |
| **Sumaiya chat** | UNVERIFIED / BROKEN on the tested APK | `src/screens/sumaiya-chat-screen.tsx`, `src/hooks/use-sumaiya-chat.ts`, `src/components/chat/*` | `QA-REPORT-2026-09-11.md` P0-2: tapping the composer did nothing (`mInputShown=false`, `mServedView=null`) and send did nothing; a quick-action chip was the only way in. The composer and screen have both been edited since (5 commits, e.g. `293005c`, `0de6b68`) and those edits were a11y/layout, not focus — **current state unknown.** `reply-bubbles.test.ts` (5) covers bubble shaping only. |
| **Scan / import** (camera, files, OCR) | UNVERIFIED | `src/screens/app/{scan,scan-processing}-screen.tsx`, `src/lib/{pick-photo,attachment-extract,attachments-context}.ts`, `expo-camera`, `expo-document-picker` | `pick-photo.test.ts` (2), `attachments-context.test.ts` (12), `evals/mobile-ocr.test.ts` (web side). Needs a device. |
| **PDF tools (native)** | UNVERIFIED | `src/screens/pdf-tools-screen.tsx` (140 lines) | **Images → PDF only** (expo-print from picked photos, ≤30). It is *not* the 8-tool web suite. No test. |
| **Career profile** | UNVERIFIED | `src/screens/career-profile-screen.tsx`, `src/lib/career-fields.ts` | Feeds the `POST /api/profile/*` endpoints. No test. |
| **AI memory + consent gate ("What Sumaiya knows")** | WORKS | `src/lib/ai-memory.ts`, `src/screens/app/memory-screen.tsx`, `src/lib/signal-actions.ts` | `src/lib/ai-memory.test.ts` (17) incl. the PDPA consent gate; `signal-actions.test.ts` (4). |
| Learning hub + short courses | WORKS (logic) | `src/screens/learning-hub-screen.tsx`, `src/lib/{courses,short-courses,course-progress}.ts` | `src/lib/short-course.test.ts` (18). |
| Invite / referral | UNVERIFIED | `src/screens/invite-screen.tsx` | No test. |
| Profile, preferences, theme, language | WORKS (logic) | `src/screens/app/profile-screen.tsx`, `src/lib/{prefs,profile-store,language-sync}.tsx` | `prefs.test.ts` (4), `profile-store.test.ts` (5), `i18n.test.ts` (22), `swahili-lint.test.ts` (1). |
| Push notifications + deep links | WORKS (logic) | `src/lib/{push,notification-route}.ts`, `src/__tests__/deep-linking*.test.ts`, `app.json`, Android manifest | `push.test.ts` (3), `notification-route.test.ts` (5), `deep-linking.test.ts` (30), `deep-linking-integration.test.ts` (30), `app-hosts.test.ts` (13). Delivery needs a device. |
| Offline-first behaviour | WORKS (logic) | `packages/utils/src/offline-storage.ts`, `src/hooks/use-offline-sync.ts`, `src/lib/connectivity.ts`, `src/lib/applications-store.ts` | SQLite cache + sync queue. `connectivity.test.ts` (12), `use-cvs.test.ts` (6). **Not verified offline** (never tested in airplane mode per the QA reports). |
| Crash reporting / app update / telemetry | WORKS (logic) | `src/lib/{sentry,update-check,telemetry,app-version}.ts`, `src/components/update-prompt.tsx` | `update-check.test.ts` (21), `reporting.test.ts` (4). |
| Release plumbing (APK signing, version codes, deep-link invariants) | WORKS (logic) | `apps/native/scripts/{test-release-invariants.js,verify-bundle-keys.mjs}`, `eas.json`, `app.json` | Run in CI. No `build:android` npm script exists — releases are EAS-based. |

---

## 6 · Cross-cutting

| Thing | State | Files | Notes |
|---|---|---|---|
| Hono API (the real backend) | WORKS (logic) | `app/api/[[...route]]/route.ts` mounts 24 route modules under `/api`; `lib/api/routes/*` | `nodejs` runtime, `maxDuration = 60`, durable per-IP rate limits (60/min general, 10/min on `/ai/*`), `onError` → `reportError`. |
| Auth/entitlement enforcement | WORKS | `lib/api/auth.ts`, `lib/entitlements{,-server}.ts`, `lib/api/routes/{capabilities,entitlements}.ts` | One `can()` used by web UI, native UI, API and the assistant's tool registry. |
| Assistant tool registry | WORKS (logic) | `lib/assistant/tools.ts` (35 tools), `lib/assistant/executors/generative.ts`, `POST /api/capabilities/:toolId` | Each tool declares `policy` (auto/preview/confirm), `cost`, `offline` mode and `capability`. `lib/assistant/tool-authz.test.ts`, `tools.test.ts`, `tool-meta.test.ts`, `run-tool.test.ts`. |
| Database schema & migrations | UNVERIFIED | `lib/db/schema.ts`, `drizzle/`, `scripts/migrate-*.mjs` (9), `lib/templates/database-schema.sql` | Drizzle + a pile of one-off migration scripts. Whether the live DB is at schema is not visible from the repo. Several pages try/catch around missing columns and degrade to empty states (documented in `jobs/page.tsx`). |
| Analytics & attribution | WORKS (logic) | `lib/analytics/*`, `lib/campaign/*`, `components/meta-pixel.tsx`, `app/api/cron/telemetry` | `lib/analytics/*.test.ts` (3 files), `lib/campaign/{aggregate,ingest}.test.ts`. |
| Launch acceptance scripts | UNVERIFIED | `apps/web/scripts/acceptance-*.ts` (12), `scripts/audit-jsonb-shapes.ts`, `scripts/backfill-jobs.ts` | DB-dependent one-off verifiers. **Not run by any test runner and not in CI.** |
| Cross-browser E2E | UNVERIFIED | `apps/web/e2e/{critical-flows,guest-export,composer,mic}.spec.ts`, `playwright.config.ts`, `scripts/verify-all.sh` (stages 1-7: build, tsc, lint, vitest, evals, playwright, Lighthouse, DB) | Configures chromium-desktop, chromium-pixel7, webkit-iphone13, firefox-desktop. **Not wired into CI, and no `e2e/reports/` exists in the tree** — this harness has not been run here. |
| CI | WORKS | `.github/workflows/{ci,health-cron,nightly-evals}.yml` | web: tsc → lint → vitest → build; web-evals; whatsapp `node --test`; native: tsc → jest → release invariants → `expo export`. |

---

## 7 · Defects and dead ends found while reading (things that look like features)

These are the traps a rebuild should not carry forward.

1. **`/api/jobs/feed` returns eight hardcoded fake jobs.** `app/api/jobs/feed/route.ts` is
   headed "This is placeholder data until a real jobs source is wired" and returns Kilimanjaro
   Retail / Jangwani Telecom etc. **Nothing calls it** — zero references outside itself. The real
   feed is `app/[locale]/(marketing)/jobs/page.tsx` + `lib/api/routes/jobs.ts`. A rebuild that
   finds this file will think a mock is the product.
2. **The blessed "template provider" does not render templates.** `lib/templates/native-provider.ts`
   `renderDocument()` ignores the template id and emits one generic boilerplate HTML string
   (`buildTemplateHtml`), and `exportPdf()` returns a JSON buffer "placeholder". The editor never
   uses it — it renders `components/templates/*.tsx` directly. `lib/templates/families.ts` opens
   with "IMPORTANT: This is a STUB showing the pattern" and carries TODOs to add the matching
   cover letters and to assign the unassigned families. `docs/DECISIONS.md` blesses this
   provider layer as *the* architecture, which is why the stub is easy to mistake for the engine.
3. **`lib/cv-builder/` is dead code built on that stub.** `template-adapter.ts`
   `renderTemplateComponent()` returns `` `<div>Template: ${templateId}</div>` ``;
   `template-integration.ts:99` is a `TODO: Implement AI recommendation logic`. Imported only by
   `lib/cv-builder/index.ts` — no page or component imports any of it.
4. **`components/editor/template-picker.tsx`, `template-selection-modal.tsx` and
   `dynamic-template-renderer.tsx` are dead.** Exported, never imported. The real picker is the
   inline `TemplateModal` inside `cv-editor-client.tsx`. Two working-looking implementations of
   one feature; only one is live.
5. **`/applications` is declared as a route but has no page.** `lib/routing.ts` lists it in both
   `PROTECTED_PREFIXES` and `APP_PREFIXES`, so middleware passes it through; there is no
   `app/(app)/applications/page.tsx` (only `applications/[id]/page.tsx`), so it renders
   `app/(app)/not-found.tsx`. Nothing links to it — the tracker lives at
   `/dashboard?tab=applications`. Real 404, low impact.
6. **`/studio/<id>` has no inbound link.** `app/(app)/studio/[id]/page.tsx` + `studio-client.tsx`
   work and `lib/routing.ts` protects the path, but no nav, dashboard card or editor button
   references `/studio` anywhere. Reachable only by typing the URL.
7. **The exported `isPremium` prop is ignored.** `cv-editor-client.tsx:975` takes
   `isPremium: isPremiumProp = false` and line 976 shadows it with `const isPremium = true`.
   Consequently the `UpgradeModal` (line 214) and every `if (!isPremium)` gate are unreachable
   today. Intentional while payments are off — but "the paywall is on" would be a false reading
   of this file.
8. **The public ATS checker advertises a limit the server refuses.** Client
   (`ats-checker-client.tsx:9`) accepts PDFs up to **15 MB**; the server
   (`lib/api/routes/tools.ts:20`, `MAX_PDF_BYTES`) caps at **4 MB** and returns 413 with a
   friendly message. A 4-15 MB resume is a guaranteed rejection the UI said was fine. (Upload
   import uses its own 25 MB client limit.)
9. **`app/api/applications/list/route.ts` and `app/api/jobs/[id]/apply/route.ts` are dead
   pre-Drizzle routes.** Both talk to a Supabase table named **`applications`** with snake_case
   columns (`user_id`, `cv_id`, `applied_at`). The schema in `lib/db/schema.ts` has a table named
   **`application`** (singular) and nothing creates an `applications` table — I grepped
   `drizzle/` and the migration scripts for it and found nothing. Both endpoints would 500 if
   called, and **neither is called by anything in the repo**: the tracker uses the Hono
   `GET/POST/PATCH/DELETE /api/applications` (Drizzle) and the native apply flow uses
   `POST /api/mobile/apply`. These are the only two files under `app/api/` that use the Supabase
   client for data instead of Drizzle.
10. **A stale build comment claims 273 template pages.** `next.config.mjs` still says "the
    default parallel workers OOM while prerendering the 273 template pages"; the real number is
    47 × 2 locales = 94.
11. **Native email OTP and the chat composer are reported broken on the last tested APK.**
    `QA-REPORT-2026-09-11.md` (P0-1, P0-2). Both may be fixed or may not — see §8.

## 8 · What I could not verify, and why

| Not verified | Why |
|---|---|
| Anything running live (DB, auth, AI, jobs ingestion, crons, push, email) | No server was started and no credentials exist in this checkout. `apps/web/.env.local` contains **only `DATABASE_URL`** — no `NEXT_PUBLIC_SUPABASE_URL`, no `NEXT_PUBLIC_SUPABASE_ANON_KEY`, no AI provider key. `lib/env.ts` warns loudly for exactly this state. |
| Every AI feature end to end — assistant chat, enhance, tailor rewrite, cover-letter generation, interview coach, CV parse, snap tailoring | Needs `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`, and the test env deliberately strips provider keys (`test/hermetic-ai-env.ts`). Tests cover the prompts, guards and pure logic — never a live reply. |
| The Playwright suite (`guest-export`, `critical-flows`, `composer`, `mic`) — **including the guest-download contract** | Needs `next build` + `next start` on :3000, browser channels, and Supabase env the checkout does not have. It is not in CI. `scripts/verify-all.sh` stage 6 would run it; no `e2e/reports/` exists, so it has not been run in this tree. |
| The APK: any screen, the offline behaviour, push delivery, the camera/OCR path, deep links from a real notification | No device, emulator, or Android SDK work was performed, and I did not build (`npm run export` / EAS). |
| The device-QA findings in `apps/native/QA-REPORT-2026-09-11.md` and `-09-10.md` | Recorded against **APK 1.6.3 / commit `890a5cd`** (2026-09-11). HEAD is `aee08ae` — **245 commits later**, including 5 that touch `sumaiya-chat-screen.tsx` and `chat-composer.tsx`. I read those diffs: the composer edits were accessibility labels and layout, **not** the tap-focus/keyboard-avoidance root cause the report describes. Current state: unknown, and worth a fresh device pass before any rebuild. |
| Whether the jobs feed has rows, whether crons have ever fired, whether the DB is at schema | All live-state questions. 12 `scripts/acceptance-*.ts` verifiers exist for these and are run by nothing automated. |
| Marketing page rendering, Lighthouse, the PWA offline shell in a real browser | Same environmental gap as the Playwright suite. |
| The `android/` native project (gradle config, signing, `app.json` version codes) | Read only `app.json`/`eas.json`/the release-invariant script. No Gradle build was attempted. |
| Payment behaviour | There is nothing to verify: `PAYMENTS_ENABLED` is `false` and no payment code exists in the tree. The only real gate is `template.premium`, earned via referrals, and its logic is covered by `lib/entitlements.test.ts`. |

## 9 · Bottom line for a rebuild

- The product that actually exists is: **a Next.js web app** (marketing + CV editor + 47 offered
  templates out of 266 renderable + public ATS checker + jobs feed + application tracker + AI
  assistant + snap-to-apply + PDF tools + 8-document-type editor family) **and a separate Expo
  app** that requires an account and ships 218 CV templates locally with a real offline SQLite
  cache.
- The two features with the **deepest** test coverage — and therefore the least risk of a
  surprise — are **snap-to-apply** and the **native CV template engine**.
- The features that are implemented but **carry no direct test at all** are the ones to
  scrutinise first in a rebuild: the Word/plain-text exports, the public ATS text scorer, the
  cover-letter editor, the PDF-tools endpoints, the interview coach, and the native
  applications store.
- The **"offline-first APK"** claim is half-true today: templates and the CV list are local and
  cached, but the app still requires a signed-in account and a reachable API for essentially
  everything else.
