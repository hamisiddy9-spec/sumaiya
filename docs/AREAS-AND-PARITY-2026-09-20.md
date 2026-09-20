# AREAS NOT YET CONSIDERED, AND THE THREE-SURFACE PARITY METHOD

**Date:** 2026-09-20 · **Repo:** `C:\Users\hamis\projects\sumaiya` · **Branch:** `main` @ `2803072`
**Live:** https://sumaiya.app (`/api/health` → `{"ok":true,"db":"connected"}`) ·
**Android:** 1.6.24 / versionCode 10624 installed on the Pixel at `10.229.114.105:5555`,
`lastUpdateTime=2026-09-20 10:02:55`, process running.

**What this document is.** Part 1 is a systematic pass over the areas the accumulated docs
did *not* cover, each with evidence and a verdict. Part 2 is the working method for shipping
one feature across mobile web, desktop web and the native app without the three drifting
apart — with the Google sign-in break as the worked example. Part 3 is the actionable queue.

**Method, and what "verified" means here.** Every claim carries one of: a `file:line`, a
verbatim command output, or a URL. Where I could not check something it says **UNVERIFIED**
and why. The live database was read directly (counts and schema flags only — **no row
contents, no PII**), through the project's own `DATABASE_URL`, by
`scripts/live-state-probe.cjs`, which is committed with this document.

**Two corrections to the existing docs, found while measuring:**

1. **`docs/CLAUDE-QUEUE-2026-09-20.md:236` ("5 commits are local, unpushed") is stale.**
   `git ls-remote origin HEAD` → `28030721b471e16552f6420bb1547c751d54273b`; local
   `git rev-parse HEAD` → the same SHA. HEAD is pushed.
2. **`docs/FEATURE-INVENTORY.md:114` says follow-ups are "Scheduled in `vercel.json`"** —
   true, but of `apps/web/vercel.json:18-22`, not the repo-root `vercel.json`, which has no
   `crons` key at all and sets `outputDirectory: apps/web/.next`. Two Vercel config files
   describe two different deployments of one app; the crons only exist in one of them.

---

# PART 1 — THE UNEXAMINED AREAS

Verdicts: **REAL GAP** · **ADEQUATE** · **UNVERIFIED** (implemented but unproven; not known
broken). Priority: **P0** launch-blocking · **P1** this week · **P2** next · **P3** backlog.

---

## 1 · Performance (bundle, cold start, PDF cost, list virtualization, image weight) — REAL GAP

**What exists.** The export path lazy-imports its heavy libraries on purpose
(`apps/web/lib/pdf.ts:167-170` — `await Promise.all([import("html2canvas"), import("jspdf")])`),
which is the right instinct. The service worker stale-while-revalidates every static asset, so
a repeat visit costs almost no data (`apps/web/public/sw.js:97-110`). The native release build
is minified and shrunk (commit `9104ff4`, 51.47 → 43.45 MiB).

**What is missing, with the numbers.** The *first* visit's JavaScript is large, and the
money-path libraries are exactly the large ones. Sizes of the browser chunks in the build
tree (`ls -S apps/web/.next/static/chunks/*.js`, bytes on disk, uncompressed):

```
5.8M  main-app.js                            3.0M  node_modules_docx_dist_index_mjs.js
2.8M  node_modules_mammoth_lib_index_js.js   2.1M  node_modules_pdfjs-dist_legacy_build_pdf_mjs.js
1.2M  node_modules_canvg_lib_index_es_js.js  1.2M  node_modules_jspdf_dist_jspdf_es_min_js.js
1.1M  node_modules_html2canvas_dist_js.js    748K  node_modules_posthog-js_dist_module_mjs.js
```
`apps/web/.next/static` totals **59 MB** on disk.

**Caveat, and an honest account of a failed measurement.** That `.next` tree had **no `BUILD_ID`**
(`cat apps/web/.next/BUILD_ID` → empty), so those are *not* confirmed production first-load
numbers, and I have **no production bundle measurement to report**. Two attempts were made and both
are recorded in the appendix; one of them taught the study a lesson worth keeping:

- Attempt 1 was written as `npx next build 2>&1 | tail -60 > file; echo "EXIT=$?"`. The recorded
  `EXIT=0` was **`tail`'s** exit status, not the build's — a green number produced by measuring the
  wrong process. That is precisely the silent-failure class this document is about (§4): the
  instrument reported success and the thing being instrumented had failed.
- Attempt 2 measured correctly (`npx next build > file 2>&1; echo "EXIT=$?"`) and returned
  **`EXIT=1`** — compilation succeeded (`✓ Compiled successfully`, line 14 of the log) and then page
  data collection crashed: `unhandledRejection Error [PageNotFoundError]: Cannot find module for page:
  /_document`. **It never reached the route table**, so neither `sumaiya-build2.out.txt` nor any other
  log on this machine contains a "First Load JS" figure. The likely cause is a partial `.next` left
  by an earlier interrupted build (which is also why there was no `BUILD_ID`), but that is an
  inference, and a clean rebuild in a quiet tree is the check — it is queued, not asserted here
  (queue §20), and it was deliberately not re-attempted during this study.

The *ranking* in the listing above is the actionable part regardless of build mode: `docx` (3.0 MB)
and `mammoth` (2.8 MB) are loaded on the CV import / Word-export paths, and on a 3G connection a few
MB is minutes.

Other measurements:
- **List virtualization: none.** `apps/web/components/jobs/jobs-feed.tsx:318-329` renders
  `groups.map(...)` over every job. Native slices rather than virtualizes —
  `apps/native/src/screens/jobs-screen.tsx:185` `{rest.slice(0, 40).map(...)}` — and
  `apps/native/src/screens/applications-screen.tsx:74` maps the whole tracker. The only
  `FlatList` in the app is the template gallery
  (`apps/native/src/components/cv/template-gallery.tsx:332`). A 200-item feed renders 200
  views on a cheap phone.
- **Image weight on 3G: no pipeline at all.** `next/image` is imported by **0** files; there
  are **6** raw `<img>` tags. The campaign posters are served raw from `/public`:
  `poster-en-story.png` 352 KB, `poster-sw-story.png` 364 KB, `poster-en-square.png` 256 KB,
  `poster-sw-square.png` 264 KB — 4 files, ~1.2 MB, no WebP/AVIF variant and no `srcset`.
  `public/` totals 4.1 MB, of which `pdf.worker.min.mjs` is 1.4 MB (loaded only when PDF text
  extraction is requested — check it is not fetched on every page).
- **PDF render cost: measured nowhere.** The export rasterizes the CV with html2canvas at
  scale 2, or 3, and calls `canvas.getContext("2d").getImageData(0, 0, w, h)` on the *whole*
  canvas to find clean page breaks (`apps/web/lib/pdf.ts:267-272`). On a 1-page A4 at scale 2
  that is ~3.5 MP of pixels read into JS. There is an OOM guard — `resolveExportScale` plus a
  retry at scale 1 (`lib/pdf.ts:53`, `:234-247`) — which is evidence the failure was hit in
  practice. No timing exists anywhere in the repo.
- **Cold start: unmeasured** on any device, on any surface.

**Missing:** a production first-load measurement per route; virtualization on the three long
lists; an image pipeline (`next/image`, or pre-encoded AVIF/WebP at two widths); an instrumented
export duration (`performance.now()` around the rasterize, reported as an event property).

**Cost:** measurement ½ day; virtualization 1 day (web `react-window`-style windowing, native
`FlatList` swap); image variants ½ day (a `sharp` script + `next/image` on the poster/marketing
surfaces); export timing ½ day (one event, one property).

**Priority:** P1 for the measurement and the export timing (they make everything else
decidable); P2 for virtualization and images.

---

## 2 · Offline and sync — REAL GAP (native: partly adequate; web: shell only)

**What exists.**
- Native has a real local layer: `packages/utils/src/offline-storage.ts` (SQLite, `sumaiya.db`,
  defensive date coercion so a string can't disable caching, an idempotent `init()` with retry
  after the "Database not initialized forever" failure), `apps/native/src/hooks/use-offline-sync.ts`
  (queue with retries, `reportError` scopes `cvEditor.save.local/.queue/.server`),
  `src/lib/connectivity.ts` (12 tests).
- Web has an offline **shell**: `public/sw.js` — HTML network-first with a cache fallback and a
  branded offline page (`:69-92`), static assets stale-while-revalidate (`:97-110`), and
  authenticated HTML deliberately never cached (`:42` `AUTH_HTML_PREFIXES`, `:48-56`).
- The web guest editor is the one page the SW guarantees offline (`/editor/cv/try`).

**What is missing.**
- **No web data layer offline.** Everything that is data — `/jobs`, the dashboard, the
  signed-in editor, `/templates` browsing with live previews — is a network round-trip with no
  cached fallback. On a phone in Tanzania that is most of the product.
- **No conflict handling anywhere.** Searching `use-offline-sync.ts` and `offline-storage.ts`
  for `conflict` / `updatedAt >` / `last-write` returns **nothing**. Two devices that edit the
  same CV converge by whoever writes last; the loser's work is silently gone. There is no
  version column on the sync payload.
- **No offline verification.** The inventory is explicit that airplane mode has never been
  tested (`docs/FEATURE-INVENTORY.md:173`), and the one device QA pass predates the current
  backend entirely.

**Cost:** airplane-mode pass 2–3 days (script + fixes); conflict handling 2–3 days (an
`updated_at` precondition on the CV PATCH, a 409 path, and a "kept your other device's version"
notice); web data caching 3–5 days (out of scope until the guest path is solid).

**Priority:** P1 for the airplane-mode pass (it is the product's headline claim and it is
currently a claim); P2 for conflict handling.

---

## 3 · Data and state (drafts, cross-device, export/backup, and the guest's work) — REAL GAP

**What exists.**
- **The guest→account journey on web is genuinely built**: the draft is
  `localStorage["sumaiya-guest-cv"]` (`apps/web/components/editor/cv-editor-client.tsx:116`),
  and `apps/web/app/(app)/migrate-guest/page.tsx` converts it after sign-in, with the payload
  carrying `migrationId` and `downloadIntent` (`:56-64`), a double-invoke guard (`:16`), a
  corrupt-draft branch that clears and degrades instead of looping (`:51-69`), and 9 tests on
  the failure modes (`lib/migrate-guest-failure.ts`). This is the best-built path in the
  product.
- Signed-in documents live in Postgres and are read by both clients through the shared API
  client (`@sumaiya/api-client`, imported 20× by native).
- Account deletion purges 14 tables plus the auth user (`apps/web/lib/api/routes/user.ts:65-103`).

**What is missing.**
- **Native has no guest mode, so there is nothing to migrate.** Every native screen is behind
  `!user ? <Auth/>` (`apps/native/src/navigation/root-navigator.tsx:245`). The rule "a guest
  must finish and download a CV before being asked for an account" is honoured on the surface
  treated as secondary and violated on the surface treated as the product.
- **Native has no autosave.** Searching `cv-editor-screen.tsx` and `use-cvs.ts` for
  `autosave|autoSave|debounce|saveDraft` returns **zero** matches; saving is an explicit button
  (`cv-editor-screen.tsx:309`) with an unsaved-work guard (`:101-123`). A user who backs out or
  whose battery dies loses the edit. The web editor autosaves; the two surfaces behave
  differently on the single most destructive action.
- **One guest draft only, keyed by a constant.** `sumaiya-guest-cv` is a single key
  (`cv-editor-client.tsx`), so a second guest CV overwrites the first with no warning.
- **The native application tracker never syncs.** `applications-store.ts` is local SQLite; the
  `application` table has **0 rows** (live probe). Change phone and the tracker is gone.
- **No export of a user's own data.** Searching `user.ts` and `profile-screen.tsx` for
  `export-data|downloadData|exportAll|gdpr` returns nothing. There is a deletion path and no
  portability path — under PDPA/GDPR those are a pair, and the deletion path is the stricter
  half to have built first, but the asymmetry is still a gap.

**Cost:** native guest mode 4 days (a port with a working reference); native autosave 1–2 days
(reuse the `use-offline-sync` queue, debounce into SQLite, save-on-background); multi-draft
guest storage ½ day (key by id, list them); data export 1 day (`GET /api/user/export` → one
JSON of the user's rows + a "Download my data" row in settings); push the tracker to the server
or stop claiming it as a feature.

**Priority:** P0 for native guest mode and native autosave; P1 for the rest.

---

## 4 · Forms and validation (and the silent-failure class) — REAL GAP

**What exists.** Inputs that go visibly wrong do go red: `inputCls(base, invalid)`
(`cv-editor-client.tsx:317-319`), a date validator that only fires once the user has typed
something (`:329`), a photo validator that explains *which* limit was hit (`:2077-2082`), and
three `role="alert"` regions (`import-cv-client.tsx:394`, `cv-editor-client.tsx:199`, and the
toast at `:2835`).

**What is missing.**
- **No field-level error association.** Searching all of `apps/web/components` for
  `aria-invalid|aria-describedby` returns **zero** matches. An error is either form-level or a
  colour change; a screen-reader user gets no signal, and neither does a sighted user on a field
  that is off-screen.
- **The silent-failure class, which is the real finding.** Three separate bugs on 2026-09-20
  shared one shape — *each side validated its own assumption and nothing validated the seam*:

  | Bug | Evidence | The seam |
  |---|---|---|
  | Email OTP length | native `apps/native/src/lib/auth-code.ts:3` `EMAIL_OTP_DIGITS = 8` vs web `apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx:257,259` `maxLength={6}` / `slice(0, 6)` | one Supabase project, two different expectations for the same code |
  | Google sign-in | web `apps/web/lib/auth-client.ts:46-61` (`signInWithOAuth`, needs the Supabase Google client secret) vs native `@react-native-google-signin` → `signInWithIdToken` (needs no secret) | two mechanisms for one identity provider |
  | Config present-but-empty | `docs/HANDOFF-2026-09-20.md:28-30` — `.env.example` imported into Vercel with empty values → every authed route 500s | a variable being *set* is not the same as it holding a value |

  A fourth instance is live in the repo right now, in the *tests*: the native support address is
  `support@templatehub.pro` (`apps/native/src/lib/app-hosts.ts:53`) and the test that guards it
  only asserts `expect(SUPPORT_EMAIL.startsWith("support@")).toBe(true)`
  (`apps/native/src/__tests__/app-hosts.test.ts:64`) — a green test over a wrong domain, because
  it asserts the *shape* of the value instead of its *identity*.

**Cost:** the seam test (Part 2 + queue §0.5) is the fix; native OTP alignment ½ day once the
Supabase template is decided; a11y error wiring ½ day.

**Priority:** P0 for OTP alignment (one of the two surfaces is wrong *today* and nobody knows
which); P1 for the seam test and the support-address assertion.

---

## 5 · PDF and template output quality — REAL GAP (the most consequential one after security)

**What exists.** The web exporter is careful work: dynamic imports, a low-memory scale guard,
webfont readiness (`apps/web/lib/pdf.ts:211-215`), an explicit decode wait for the profile photo
because a cold export used to rasterize it blank (`:217-223`), per-page JPEG slices instead of
one giant PNG (comment at `:274-280`, "took site CVs from ~13 MB to well under 1 MB"), and a
pixel scan to nudge page breaks away from lines of text (`:260-272`). The native side prints
real HTML through `expo-print` (`apps/native/src/services/pdf-export.ts`) and the filename
derivation is tested (4 tests).

**What is missing, and why it is serious.**
- **The web PDF has no text layer.** `renderPdfDoc` rasterizes the DOM with html2canvas and
  embeds each page as **JPEG** in jsPDF (`lib/pdf.ts:228-233`, `:256`, `:274-280`). The output is
  an image of a CV. Text is not selectable, not searchable, and **an ATS that extracts text gets
  nothing** — which is the one mechanism the product is sold on in English. The claim "your CV
  is ready to send" is not satisfied by the artifact the web produces.
- **The two surfaces produce structurally different PDFs from the same template.** Web =
  rasterized JPEG pages. Native = `expo-print` (a real WebView print → vector text). So the
  same CV is ATS-hostile on the web and ATS-friendly (probably — never tested) on the phone.
  Nothing in the repo asserts either.
- **ATS-parsability is asserted nowhere.** No test extracts text from a generated PDF, though
  `pdfjs-dist` is already a dependency and the pattern already exists server-side
  (`POST /api/tools/extract-text`).
- **No print stylesheet.** Searching `apps/web` for `@media print`, `print-color-adjust`, `@page`
  returns **zero** matches, so browser print (Ctrl-P, and the "print my CV" instinct) is
  unstyled — a different artifact again.
- **The renderer is a stub that must not be built on.**
  `apps/web/lib/templates/native-provider.ts` `renderDocument()` ignores the template id and
  emits one generic string for all 266 names (`docs/FEATURE-INVENTORY.md:203-209`).
- **47 of 266 templates are offered**; the other 219 are maintained, and native CI renders all
  218 of them every run (`registry-sync.test.ts`, 20 tests) for templates no user can select.

**Cost:** a text-layer PDF path 3–5 days — the honest options are (a) render the CV to HTML and
print it through a headless Chromium (`@sparticuz/chromium` + `puppeteer-core` on Vercel — heavy),
(b) generate the PDF from structured data with `pdf-lib` text primitives (real text, full
control, per-template layout work), or (c) keep the raster for preview fidelity and add a
text layer via `pdfjs`/`pdf-lib` overlay (a normal "sandwich" PDF — cheapest, degrades
gracefully). Whatever is chosen, the assertion is the same and is cheap: extract text from the
generated PDF in a test and require the CV's own name and job title to appear.

**Priority:** P0 for the *assertion* (prove or disprove ATS-parsability, in CI) and P1 for the
text layer itself. This is the product's core artifact.

---

## 6 · Analytics and funnel measurement — ADEQUATE design, empty in production

**What exists, and it is good.** A typed event catalog with the explicit purpose of stopping the
same moment being logged three ways (`apps/web/lib/analytics/events.ts:1-14`); attribution
captured from `?src=`, sanitized and length-capped
(`lib/analytics/attribution.ts:103`, `MAX_CAMPAIGN_SOURCE_LENGTH = 64`), stamped on *every*
event (`getAttributionProps`, `:225`), with a persistent visitor id (`:62`); campaign funnel
steps mirrored server-side to `POST /api/campaign/event` (`lib/analytics/campaign.ts`); server
telemetry cron (`app/api/cron/telemetry/route.ts`); three test files.

**What the live database says.** `app_event` **33 rows**, newest `2026-09-20 11:15:18`;
`campaign_event` **2 rows**, both with `name = "campaign_landing"` and `src` values of
`probe-live-1` / `probe-cli` — i.e. **both were written by earlier automated probes, not by a
real visitor**. The queue's claim that `?src=poster` writes nothing stands, with a nuance: the
endpoint works, no real campaign has ever reached it. And with **0 CVs**, **0 applications** and
**0 outcome reports** in the database, the retention funnel the product direction is built on
has no data at any stage after "landing".

**Missing:** a server-side aggregation/alert layer over `app_event` (the cron exists; whether it
has run is UNVERIFIED); a target for the guest→export activation rate; and — the real one — a
first real user.

**Cost:** ½ day to add an admin "funnel today" panel reading `app_event` + `campaign_event`;
the rest is distribution, not engineering.

**Priority:** P2 (nothing here is broken; it is unexercised).

---

## 7 · Notifications — ADEQUATE in code, never once delivered

**What exists.** `device_token` with a per-device unique index
(`apps/web/lib/db/schema.ts:573-583`, migration `drizzle/migrations/0010_push_tokens.sql`);
a real sender with 100-message chunking and `DeviceNotRegistered` pruning
(`apps/web/lib/push/expo.ts:45-97`); a dedupe table keyed on `(user_id, notif_key)` with a
cooldown (`lib/notify/dispatch-signals.ts:106-132`); a web-push subscription table; two daily
crons (`apps/web/vercel.json:20-21`); native permission handling and deep-link routing
(`src/lib/{push,notification-route}.ts`, 30 + 30 + 13 tests on deep links).

**What the live database says.** `device_token` **0 rows**, `web_push_subscription` **0 rows**,
`signal_notification` **0 rows**. The one signed-in account has never registered a device. So
the registration call (`PUT /api/mobile/device-token`, `lib/api/routes/mobile.ts:583`) is
**UNVERIFIED end-to-end** — it may be working perfectly and simply unused, or it may be broken;
the code cannot tell you which, and neither can the empty table.

**Missing:** one device test that registers a token and proves a notification arrives; a
user-facing on/off preference (no opt-out exists anywhere — the only match for permissions in
`src/lib/push.ts:55` is a comment); a notification-history surface so a dismissed nudge is
recoverable.

**Cost:** 1 day (device test + a preferences row in settings).

**Priority:** P1 — notifications are the retention mechanism the product direction leans on, and
zero have ever been delivered.

---

## 8 · Monetization and the free/paid boundary — REAL GAP (undefined, not merely unbuilt)

**What exists.** The boundary is implemented and then switched off *and shadowed*:
`PAYMENTS_ENABLED = false` (`apps/web/lib/features.ts:8`); `/pricing` and `/checkout` 307 to the
home page (`apps/web/next.config.mjs:59-60`, reproduced in the research doc); and in the editor
the `isPremium` **prop** is destructured and then shadowed by `const isPremium = true`
(`cv-editor-client.tsx:975-976`), which makes the `UpgradeModal` (line 214) and every
`if (!isPremium)` gate dead code. Entitlements are real and tested (20 tests): 7 days of Premium
per activated friend (`lib/referral.ts`), 7 of the 47 offered templates flagged premium, and the
waitlist flag is explicitly a local convenience, never an entitlement.

**What is missing.**
- **No price list and no rail.** No Selcom/Pesapal/DPO integration, no TZS amounts anywhere in
  the repo. The market is not empty: **Careergo charges TZS 600/hour** and **SwiftKazi
  KES 20 per CV / KES 60 per application**, both on mobile money today
  (`docs/RESEARCH-2026-09-20.md` §1b, citing [careergo.co/tz](https://careergo.co/tz) and
  [swiftkazi.co.ke](https://swiftkazi.co.ke/)).
- **Nothing records purchase intent.** Because the paywall is short-circuited, no event says
  "this user tried to use a premium template". The one number that would price the product —
  demand at the wall — is not collected.
- **The rule the boundary must respect is unwritten.** "A guest finishes and downloads a CV
  before being asked for an account" is settled; what is *paid* is not. The Gulf market changes
  the answer (photo, nationality, visa status, notice period are expected there, and the RESEARCH
  doc argues the attestation paperwork is not completable by software).

**Cost:** define the boundary (a page of decisions) ½ day; instrument the wall honestly
(log the attempt, allow the template, no dark patterns) 1 day; a rail only when there is a
receiving account.

**Priority:** P1 for the written boundary + intent instrumentation; P3 for the rail.

---

## 9 · Job data quality and freshness — REAL GAP (confirmed empty in production)

**What exists.** The pipeline is the most thoroughly unit-tested thing in the repo: 14 source
adapters (`apps/web/lib/jobs/sources/*`), feed-filter (21 tests), dedup, enrich, authenticity,
location-relevance, text-formatting, a daily ingest cron (`apps/web/vercel.json:19`,
`0 6 * * *`), a hardening pass that degrades to an empty state instead of a 500 when a migration
is missing, and an admin surface.

**What the live evidence says.**
```
$ curl -s https://sumaiya.app/api/jobs
{"success":true,"data":[]}
$ (live DB) count job: {"n":0}   job latest: {"newest":null,"n":0}
```
The feed is empty in production, and the table has never held a row. So the cron has either
never fired, or fired and ingested nothing, or failed silently — **UNVERIFIED which**, and that
is itself the gap: no run report exists to distinguish the three.

**Also missing.** Several sources are silently skipped without env keys (Adzuna, Jooble,
Careerjet, Talent, USAJobs — per the inventory), so "the feed is empty" and "the key is missing"
look identical from outside. And a dead mock still ships: `app/api/jobs/feed/route.ts` returns
eight hardcoded jobs (Kilimanjaro Retail, Jangwani Telecom) and **nothing calls it**.

**Cost:** a per-source run report (source, fetched, accepted, rejected, error) written by the
cron into one row per run + an admin view = 1–2 days; seeding real listings is data work
(licensing matters — do not scrape against terms); deleting the mock is 5 minutes.

**Priority:** P0 for the run report and the mock deletion (both trivial and both remove
guesswork from the product's second-most-visible surface); P1 for real data.

---

## 10 · Security and privacy — REAL GAP, and the most important finding in this study

### 10a · The whole database is readable **and writable** with the public key

**Evidence, first-hand, from the live project this app runs on.**

Row-level security across the `public` schema:
```
PUBLIC TABLES: 33 · with RLS enabled: 0 · with any policy: 0
```
Privileges held by the `anon` role — the role behind the key that ships in the browser bundle:
```
anon privileges across public tables:
  DELETE 33 · INSERT 33 · REFERENCES 33 · SELECT 33 · TRIGGER 33 · TRUNCATE 33 · UPDATE 33
pg_default_acl: postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres
```
The key is public **by design, and the repo says so**:
`NEXT_PUBLIC_* are public by design (they ship in the browser bundle)` —
`.github/workflows/ci.yml:22-23`.

And the exposure reproduces over HTTP, with no credentials beyond that public key:
```
$ curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/profile?select=*&limit=1" -H "apikey: <public anon key>"
profile      -> HTTP 200
cv           -> HTTP 200
application  -> HTTP 200
device_token -> HTTP 200
job          -> HTTP 200
ai_usage     -> HTTP 200
```
**What this means.** Anyone who reads the browser bundle — no account, no exploit, one `curl` —
can read every table in the product, and because `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` are
granted to `anon` on all 33 tables (and to future tables via the default ACL), can also write to
and delete from all of them. Today the database holds 1 user, 0 CVs and 0 applications, so this
is not yet a leak — it is a loaded gun pointed at launch day, when the CV table starts holding
names, phone numbers, national-ID-adjacent data and photographs.

**Why it is not visible from the app's own code.** All application data access is Drizzle over
`DATABASE_URL` as `postgres`, server-side, which bypasses RLS entirely — so RLS being off has no
effect on the app and every product test stays green. The exposure is only through Supabase's
PostgREST endpoint, which ships enabled with every API key.

**The fix, in order of preference for *this* codebase.**
1. **Revoke, don't just enable.** The app never uses PostgREST for `public` data (the only two
   Supabase-client data routes are dead code — `app/api/applications/list/route.ts`,
   `app/api/jobs/[id]/apply/route.ts`). So: `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon,
   authenticated;` plus `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon,
   authenticated;`. This is the tighter fix — a policy mistake cannot re-open it.
2. If anything ever does need PostgREST: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 33
   plus per-table policies, and turn RLS on for future tables.
3. **A CI guard so it cannot silently return**: a script asserting every table in `public` has
   `relrowsecurity = true` **or** that `anon` holds no grant on it. This is exactly the class of
   check the seam test (queue §0.5) is for.

Once either 1 or 2 is done, the "public share" route also stops depending on its own scoping
alone (`app/api/cv/[slug]` scopes on `public_slug AND is_public`, but a direct table read needed
no scope at all).

*Note on the "injection bug found today": I could not find it.* Searching the repo and `docs/`
for SQL-injection evidence returns only remediation claims; the nearest real items are the
**prompt-injection** gap recorded in `apps/web/docs/architecture/2026-08-26-ai-copilot-architecture.md:117`
(G-8, guest profile block interpolated unsanitized/unbounded at `ai.ts` L557-561 — since
addressed: `sanitizePromptText` is now applied in 5 route modules including
`lib/api/routes/ai.ts:573`) and the campaign-`src` sanitizer
(`lib/analytics/attribution.ts:103`). Drizzle parameterizes, so a classic SQLi is unlikely; the
injection classes that *are* live here are (a) **prompt injection** into every AI tool whose
output is written into a document, and (b) **HTML/template injection** into the 266 template
components that interpolate user data — React escapes those, but the same data also flows into
`expo-print` HTML on native (`src/lib/cv-html.ts`), where escaping is the author's responsibility.
That is where a test should point. **Recommendation:** a test that feeds `"><script>` and
`{{7*7}}` through every free-text CV field, renders both the web and the native PDF path, and
asserts no script tag and no evaluated expression appears in the output.

### 10b · The rest of the security picture

| Area | State | Evidence |
|---|---|---|
| Account deletion | **ADEQUATE** — purges 14 tables in order, then the Supabase auth user | `lib/api/routes/user.ts:65-103`; native caller `src/screens/app/profile-screen.tsx:201` |
| Deletion when the service key is missing | **PARTIAL** — guarded by `if (process.env.SUPABASE_SERVICE_ROLE_KEY)`, so an unset key leaves the auth user alive and the UI says nothing | `user.ts:91-97`; the old project's teardown doc already recorded this as "delete account leaves a ghost" (`apps/web/docs/teardown-2026-09-07.md:121`) |
| Data portability | **REAL GAP** — no export path (§3) | grep: 0 matches |
| Rate limiting | **ADEQUATE** — durable per-IP, 60/min general, 10/min on `/ai/*` | `docs/FEATURE-INVENTORY.md:183` |
| Admin gating | **ADEQUATE, with a footnote** — env allowlist, falling back to two hardcoded personal emails in source | `lib/admin.ts:4-14` |
| Error-path PII | **ADEQUATE-ish** — structured logs carry `userId`/`distinctId` but no CV content | `lib/observability/report-error.ts:11-16` |
| AI disclosure / memory consent | **ADEQUATE** — a PDPA consent gate with 17 tests, plus a written disclosure doc | `src/lib/ai-memory.ts`, `docs/ai-memory-disclosure.md` |
| Sub-processor / privacy links at the point of signing in | **UNVERIFIED** | not checked in this pass |

**Priority:** **P0 — revoke or RLS, today, before any promotion.** The CI guard is P0 with it.
The escaping test and the export path are P1.

---

## 11 · Error handling and observability — REAL GAP (nobody is told when it breaks)

**What exists.** A server reporter that never throws and writes one structured JSON line per
error to the console (`apps/web/lib/observability/report-error.ts:26-41` — "On Vercel this lands
in the function logs, so a 500 is greppable by message/scope"); an `onError` hook on the Hono app
routing through it; a Next error boundary file (`apps/web/.next/static/chunks/global-error.js`
present in the build tree); on native, Sentry plus `reportError` scopes, `update-check` (21
tests) and telemetry (`src/lib/{sentry,reporting,telemetry,update-check}.ts`); and `debug_event`
**61 rows** / `app_event` **33 rows** newest today, so native telemetry is genuinely landing.

**What is missing.** No alerting of any kind: nothing watches the Vercel logs, so a route that
starts 500ing is discovered when a user complains — and there is no support channel to complain
to (§12). No request id reaches the user, so a screenshot of "Something went wrong" cannot be
tied to a log line. No dashboard for API error rate. And the AI 503 path is honest but silent:
`if (!hasAiProvider()) return c.json({ error: "AI is not configured." }, 503)` in 8 places
(`lib/api/routes/ai.ts:157,207,319,365,439,465,546,903`) — correct behaviour, but nothing counts
how often a user hits it.

**Cost:** a Vercel log drain or Sentry server-side ½ day; a request id echoed in error responses
and shown in the toast ½ day; an error-rate panel in admin ½ day.

**Priority:** P1.

---

## 12 · Support — REAL GAP (there is a channel, and it points at the wrong company)

**What exists.** A native support screen with a prefilled mailto
(`apps/native/src/screens/app/support-screen.tsx:19,33`), an FAQ screen
(`help-faq-screen.tsx`), help rows, and a web `/contact` page
(`apps/web/app/[locale]/(marketing)/contact/page.tsx:14,26`). A WhatsApp worker exists as a
channel (`apps/whatsapp/`, 4/4 tests) but is health-only without Meta provisioning.

**What is missing, and the bug in plain sight.** Both the app and the website send users to
**`support@templatehub.pro`** — the domain of the parked product (`DECISIONS.md` D3) — for help
with **Sumaiya**, a memorial product. `apps/native/src/lib/app-hosts.ts:53` and
`contact/page.tsx:26`. The guard test asserts `startsWith("support@")`
(`apps/native/src/__tests__/app-hosts.test.ts:64`), so it stays green.

Beyond the address: no ticketing, no human chat in the channel this market uses (WhatsApp), no
status page, no stated response time, and no in-app "report a problem" that carries the app
version, device and request id. The FAQ is the only self-serve help, and `help-faq-screen.tsx`
was still being rewritten today (`cb29d9f`).

**Cost:** correct address + an alias on the owned domain 15 minutes; WhatsApp support line ½ day
(the worker already exists); "report a problem" with diagnostics 1 day.

**Priority:** P0 for the wrong address (a user's help request goes to a company that no longer
exists in that role); P1 for the report path.

---

## 13 · Onboarding and first-run — ADEQUATE on native, REAL GAP on the web

**What exists.** Native onboarding (language pick, splash) and a genuinely well-instrumented
first-run wizard with 8 steps — `intro, name, photo, fields, experience, skills, recent, look` —
that skips the name step when the account already has one and shows a taste of premium designs
(`apps/native/src/screens/first-run-screen.tsx:45,146-147,157-179`), firing
`firstrun.start` and `firstrun.step` with `prev_seconds` per step and explicitly no PII. That is
the right way to instrument onboarding, and it is already there.

**What is missing.** No equivalent on the web. A visitor who arrives from search lands on a
marketing page, and their route into the product is whatever they guess — the guest editor
(`/editor/cv/try`) is the only first-run the web has, and nothing guides them to it, times it, or
measures whether they finish. There is no defined aha-moment, no activation target, and — with
0 CVs in the database — no evidence that anyone has ever completed the journey on any surface.

**Cost:** a web first-run that mirrors the native wizard's shape (3–5 steps to a downloaded CV)
3 days; an activation event + target ½ day.

**Priority:** P1 for the activation metric (measure before building); P2 for the wizard.

---

## 14 · SEO and content for job-search intent — REAL GAP (and an empty page is being indexed)

**What exists.** `app/sitemap.ts` (65 lines, per-route priorities and change frequencies),
`app/robots.ts`, 94 prerendered template pages (47 × 2 locales), JSON-LD on
`tools/[slug]`, `snap-to-apply`, `ats-checker`, `blog/[slug]` and the locale layout, and 11 blog
posts.

**What is missing.** Cadence has stopped: the newest post is dated **2026-08-04**
(`apps/web/lib/blog.ts`, sorted dates end 2026-07-07…2026-08-04) — ~7 weeks before today — and
there is no Swahili content programme beyond locale mirroring. Worse, **`/jobs` is indexed and
empty**: an indexed page that returns no listings teaches both users and crawlers that Sumaiya
has nothing to offer, and `sitemap.ts` gives it `priority: 0.8, changeFrequency: "weekly"`.
The query families that matter here ("kazi Tanzania", "ajira", "CV sample", "CV ya kiswahili")
are not targeted by any page that currently has content.

**Cost:** pause/redirect the empty `/jobs` in the sitemap until it has rows (15 minutes — and it
is the honest fix); 2 posts/month in Swahili at the register the Swahili standard defines
(1 day/post); a proper "kazi" content hub when the feed is alive.

**Priority:** P1 for the sitemap change and the cadence decision; P2 for the content programme.

---

## 15 · Internationalization beyond Swahili/English — REAL GAP (RTL has not been considered at all)

**What exists.** Two locales (`en`, `sw`) with a `x-lang` middleware signal, 276 keyed strings in
318 lines on the web (`apps/web/lib/i18n/translations.ts`), a mirrored native translation layer,
and a lint tripwire on both surfaces that fails the build on calqued Swahili
(`apps/web/lib/swahili-lint.test.ts`, `apps/native/src/lib/swahili-lint.ts`) — plus a
native-speaker audit (`docs/SWAHILI-AUDIT-2026-09-20.md`) that caught two real errors
(`Mgusiko`, `omba kwa ujanja`). This is above-average language engineering for the region.

**What is missing for the stated Gulf expansion.** Searching both apps for `rtl`, `RTL`,
`I18nManager` and `dir="rtl"` returns **no exact matches**. So, concretely: no right-to-left
layout direction, no logical CSS properties (padding/margin are physical throughout), no Arabic
string set, no Arabic font pairing (or an Arabic-capable face in the CV templates), no Arabic
template family, no numeric/locale formatting rules, no RTL mirroring for the 266 CV templates,
and no `I18nManager.forceRTL`/restart path on native.

**Why this is a real gap and not a "later".** RTL is not translation; it is a layout direction
that has to be designed in. Retrofitting it means touching every template, every absolutely
positioned ornament, and every `margin-left` in the codebase. And the Gulf market itself makes it
material: Naukrigulf runs an Arabic jobseeker section and Bayt is bilingual
(`docs/RESEARCH-2026-09-20.md` §1c, citing
[infoedge.in](https://www.infoedge.in/Businesses/RecruitmentNaukrigulf),
[bayt.com](https://www.bayt.com/en/blog/30033/new-cv-search-features-from-bayt-com-help-employers-locate-the-ideal-job-candidate/)).
The Gulf CV fields the research identified as mandatory — nationality, visa status,
availability-to-join — are also still absent (the photo landed in `12f2d9f`).

**Cost:** *decide* now whether Arabic is in scope for the Gulf (½ day, a decision with a date);
if yes, the cheap irreversible-proofing is 3–5 days now (logical properties, a `dir` attribute
plumbed through the layout, `I18nManager` wired, and one RTL template rendered as a proof) versus
weeks later.

**Priority:** P1 for the decision + direction plumbing; P2 for the Arabic content and templates.

---

## 16 · Testing strategy — ADEQUATE volume, structurally blind at every seam

**Fresh evidence, run today for this document:**

```
cd apps/web && npx vitest run
  Test Files  136 passed | 1 skipped (137)
       Tests  2158 passed | 3 skipped (2161)
    Duration  183.63s

cd apps/native && npx jest
  Test Suites: 1 failed, 42 passed, 43 total
       Tests: 1 failed, 1212 passed, 1213 total
        Time: 13.024 s
```
The single native failure is `src/components/ui/motion-tokens.test.ts:36` — an **uncommitted**
file (another agent's in-flight motion work, listed as untracked in `git status`). It is not
mine and I neither fixed nor reverted it. But the operational fact stands: **"the tests pass" is
false on native right now**, and CI would be red if it ran.

**The structural gaps.**
- **Nothing tests a seam.** 2158 web tests and 1212 native tests, and the day's three bugs lived
  where no test looked: client↔server digit count, web↔native provider, config↔deployment.
- **No component tests on the web.** `apps/web/vitest.config.ts` sets no jsdom environment, there
  are no `.test.tsx` files, no test under `app/`, and two evals assert by *reading
  `snap-client.tsx` as text* rather than rendering it (`docs/FEATURE-INVENTORY.md:62-67`).
- **The E2E suite exists and never runs.** Four Playwright specs
  (`apps/web/e2e/{critical-flows,guest-export,composer,mic}.spec.ts`) with four device profiles
  configured — and `playwright test` is **not in `ci.yml`**, and no `e2e/reports/` exists.
- **No schema/database/security check** in CI: not a migration check, not an RLS assertion (§10).
- **The one suite that asserts the product's core artifact doesn't exist**: nothing extracts text
  from a generated PDF (§5).

**Cost:** the seam test (queue §0.5) 2–3 days; E2E into CI 1 day plus flake budget; the PDF-text
assertion ½ day; the RLS assertion ½ day.

**Priority:** P0 for the RLS assertion and the PDF-text assertion (both cheap, both catch a
class P0 bug); P1 for the seam test and E2E in CI.

---

## 17 · Deployment and CI health — REAL GAP (CI cannot run, and the local claims cannot be re-verified here)

**What exists.** `.github/workflows/ci.yml` runs four jobs: web (typecheck → lint → vitest →
build), web-evals, whatsapp (`node --test`), native (typecheck → jest → release invariants →
`expo export`). The release invariants script guards exactly the class of bug that shipped before
(debug-signed releases, an assetlinks fingerprint nothing matched, an App Link filter claiming a
redirecting host). `health-cron.yml` was fixed today to stop falling back to the dead host
(`92a5090`). The live deployment is healthy: `curl -s https://sumaiya.app/api/health` →
`{"ok":true,"db":"connected"}`.

**What is missing.**
- **CI has never run and cannot run.** `docs/HANDOFF-2026-09-20.md:41` records
  `actions/runs = 0, never run; actions/secrets = 0`, and the queue lists GitHub Actions billing
  as an owner-only blocker. I could not re-verify: **`gh` is not on this PATH**
  (`which gh` → not found), so this claim is the handoff's, not mine. **UNVERIFIED by me.**
- **No deployment gate at all.** Since CI is down, the four `tsc`/test/build gates that the queue
  tells a human to run by hand are the only gate — and the native suite is red right now (§16).
- **Two Vercel configs for one app.** The repo-root `vercel.json` (no `crons`,
  `outputDirectory: apps/web/.next`, `buildCommand: npm run build`) and
  `apps/web/vercel.json` (three `crons`, the `templatehub.pro` rewrite, `outputDirectory: .next`).
  Whichever Vercel actually reads decides whether the daily jobs/signals/follow-ups crons exist.
  With `job` empty and `signal_notification` empty, this ambiguity has consequences.
- **No post-deploy verification.** The queue's `verify-all.sh` (7 stages) exists; nothing runs it.

**Cost:** fix the Actions billing (owner) or move the gates into a pre-push hook + a local
`verify-all.sh` run that is actually executed before every deploy (½ day, and it is the only
option while Actions is dark); reconcile the two `vercel.json`s 15 minutes; a post-deploy smoke
script (health + one authed route + one export) ½ day.

**Priority:** P0 for the two-config reconciliation and a post-deploy smoke script; P1 for
restoring a gate.

---

## Part 1 summary — verdicts and priorities

| # | Area | Verdict | Priority |
|---|---|---|---|
| 10 | **Security: RLS/grants — the whole DB readable and writable with the public key** | **REAL GAP** | **P0** |
| 5 | PDF artifact has no text layer → not ATS-parsable on web (with the assertion missing) | **REAL GAP** | **P0** |
| 12 | Support address points at `templatehub.pro` | **REAL GAP** | **P0** |
| 4 | OTP length differs between the two clients (8 vs 6) | **REAL GAP** | **P0** |
| 9 | Job feed empty in production, no run report; dead mock still ships | **REAL GAP** | **P0** |
| 3 | Native guest mode + native autosave + data export | **REAL GAP** | **P0/P1** |
| 16 | No seam/RLS/PDF tests; E2E not in CI; native suite red | **REAL GAP** | **P0/P1** |
| 17 | CI dark; two `vercel.json`; no post-deploy check | **REAL GAP** | **P0/P1** |
| 2 | Web has no offline data; no conflict handling; never tested in airplane mode | **REAL GAP** | **P1** |
| 7 | Notifications: machinery adequate, zero ever delivered, no opt-out | **ADEQUATE code / UNVERIFIED live** | **P1** |
| 11 | No alerting, no request id | **REAL GAP** | **P1** |
| 1 | Bundle/PDF cost/virtualization/images | **REAL GAP** | **P1/P2** |
| 15 | Arabic/RTL not considered | **REAL GAP** | **P1 (decision)** |
| 6 | Analytics design adequate, production empty | **ADEQUATE / unexercised** | **P2** |
| 8 | Free/paid boundary undefined + intent unmeasured | **REAL GAP** | **P1/P2** |
| 13 | Native onboarding strong; web first-run absent | **MIXED** | **P1/P2** |
| 14 | SEO stopped; `/jobs` indexed and empty | **REAL GAP** | **P1/P2** |

**The single highest-value item is §10a.** Every other gap costs a user some time; this one
costs them the contents of the database the day the product succeeds. It is also the cheapest to
close: one SQL statement plus a CI assertion.

---

# PART 2 — THE METHOD: ONE FEATURE, THREE SURFACES, NO DRIFT

The problem stated precisely: **there is no rule for what is shared and what is re-implemented**,
so each of the three surfaces re-decides, in private, and the divergence is discovered by a user.
Google sign-in is the proof — one provider, two mechanisms, one of them returning
`400 {"msg":"Unsupported provider: missing OAuth secret"}` on the web while working on the phone.

This part is: what good three-surface products actually do (cited), the shared/forks split for
*this* codebase measured from *this* codebase, how a feature gets specified so that all three
implementations are recognisably one product, how drift is detected and prevented (Google sign-in
worked through), what a test must assert so a seam bug cannot silently return, a definition of
done per surface, and where behaviour may legitimately differ.

---

## 2.1 · What the products that do this well actually do (cited)

I took four patterns from primary sources, and I am explicit about what does not transfer.

**1 · Share below the UI; fork at the edges of the codebase.** React Native's own guidance is
that platform divergence is normal and should be *structured*, not avoided: `Platform.select`
for a few values, and **platform-specific file extensions** — `.ios.`, `.android.`, and crucially
`.native.js`, whose documented purpose is *"sharing code with NodeJS and Web"*, paired with the
note that the web bundler should ignore `.native.*` "in order to avoid having unused code in your
production bundle"
([reactnative.dev/docs/platform-specific-code](https://reactnative.dev/docs/platform-specific-code), read in this session).
The rule this gives us: **a platform fork should be a named file, not an `if` scattered through a
shared one.**

**2 · Screens are the shared primitive; the platform is the skeleton.** Solito's methodology —
written for exactly the Next.js + React Native pairing this repo has — is that screen *code* and
the code for navigating *between* screens is 100% shared, while rendering the screens is
platform work: *"your screens are your primitives, and your platform is your skeleton"*, with URLs
as the source of truth so both platforms map the same URL to the same screen. It states the
outcome we want in one line: *"We need to match our users' expectations based on the platform
they're using"* — cross-platform apps get a bad reputation when they make an app feel like a
mobile website or a website feel like an app
([Solito methodology](https://github.com/nandorojo/solito/blob/master/docs/docs/methodology.md), read in this session).
The rule: **identical task and identical outcome per platform; not identical pixels.**

**3 · One token file, many platforms — as a published standard.** The Design Tokens Community
Group's first stable specification (2025.10) exists for precisely our failure mode, described in
the W3C group's own announcement as teams "juggl[ing] dozens or even hundreds of token files
manually, leading to drift, errors, and maintenance overhead", with the benefit stated as
*"Cross-platform consistency – one token file generates platform-specific code for iOS, Android,
web, and Flutter"*
([w3.org/community/design-tokens](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version),
[designtokens.org/TR/2025.10/format](https://www.designtokens.org/TR/2025.10/format/)).
**This repo has already arrived at that conclusion independently** — `packages/design-tokens/src`
opens with *"Mirrors apps/web/tailwind.config.ts exactly. Web is the reference — if these drift,
the mobile app renders a different brand."* The instinct is right; the mechanism (a hand-copy) is
the weak part.

**4 · Put a machine-checkable contract on the boundary, and verify each side in isolation.**
Consumer-driven contract testing is the mature answer to "two clients and one server drift
apart": the consumer's test declares what it needs, the contract is recorded from the test run,
and the provider verifies against it in its own pipeline — no shared environment, and the drift
"surfaces in CI, on each side independently" (Pact's own documentation describes it as "assert[ing]
that inter-application messages conform to a shared understanding that is documented in a
contract", and lists "an API client and a web front-end" as an immediate use case)
([docs.pact.io](https://docs.pact.io/), read in this session). Adopting Pact itself would be
overkill here — this repo has one server it already owns — but the *discipline* is exactly what
the OTP-digit bug needed: **the digit count is an inter-application message and it belonged in a
contract, not in two forms.**

**What does not transfer, and why.** A universal-UI approach (React Native Web everywhere, the
`Tamagui`/`Solito` starter shape — see
[tamagui/starters next-expo-solito](https://github.com/tamagui/starters/tree/main/next-expo-solito))
is the wrong move *for this repo specifically*: the web app is a mature Next.js product with 266
DOM template components, server components reading Drizzle directly, SEO pages, and a PWA shell,
and the queue already concludes that web and native were never designed together. Converting the
web to RN-Web is a rewrite of the strongest asset. **What we copy is the *layering*, not the
library.** Also worth stating plainly: "three surfaces" here is **two implementations and three
presentations** — mobile web and desktop web are two shells over one web codebase. Only the
native app is a genuinely separate implementation. That halves the problem.

---

## 2.2 · What is shared in *this* codebase, measured today

The shared-core groundwork already exists and is largely unused. Import counts
(`grep -rhoE "@sumaiya/[a-z-]+" apps/web … | sort | uniq -c`):

| Package | Files in `src` | Imports by **web** | Imports by **native** | Verdict |
|---|---|---|---|---|
| `@sumaiya/utils` | 8 | **7** | **26** | the only genuinely shared package |
| `@sumaiya/types` | 1 | **0** | **32** | native-only in practice |
| `@sumaiya/api-client` | 2 | **0** | **20** | native-only — web fetches its own way |
| `@sumaiya/hooks` | 1 | 0 | 1 | effectively unused |
| `@sumaiya/core` | 1 | 0 | 0 | **reserved and empty of use** — its own header says it is the home for "logic that both apps depend on and that isn't UI, isn't a raw type, and isn't a network client" |
| `@sumaiya/design-tokens` | 1 | 0 | ? | a hand-maintained mirror of `apps/web/tailwind.config.ts` |
| `@sumaiya/analytics`, `@sumaiya/templates` | 1 each | 0 | 0 | unused |

And the logic that is duplicated **today**, feature by feature:

| Feature | Web | Native | Consequence |
|---|---|---|---|
| ATS scoring | `lib/ats-score.ts`, `lib/ats-text.ts`, `lib/ats-explain.ts` (tests) | `src/lib/ats.ts` (tests) | the same CV can score differently on the two surfaces; nothing compares them |
| Swahili lint | `lib/swahili-lint.test.ts` | `src/lib/swahili-lint.ts` | two banned-word tables to keep in step |
| OTP rules | hardcoded `6` twice in `sign-in-form.tsx:257,259` | `EMAIL_OTP_DIGITS = 8` (`auth-code.ts:3`) | **live bug** (§4) |
| Support contact | `contact/page.tsx:26` | `app-hosts.ts:53` | two copies, both `support@templatehub.pro` |
| PDF production | `lib/pdf.ts` (html2canvas → JPEG) | `services/pdf-export.ts` (expo-print) | structurally different artifacts (§5) |
| Motion tokens | `apps/web/lib/motion-tokens.ts` + test | `apps/native/src/components/ui/motion-tokens.ts` + test | **created in both apps today, untracked** — the drift is being introduced right now, and the native copy is the currently failing test |

**The split to adopt. If it can run in Hermes (React Native's JS engine) and it is not UI, it goes
in a package. Nothing else is shared by copy.**

**SHARED — `packages/*`, no exceptions**

| Goes in | What that means concretely here |
|---|---|
| `@sumaiya/core` (make it real) | field **validation rules** and their messages; the **OTP digit count and normalizer** (one constant both apps import); document schema and defaults; `?src` sanitization; route/id constants; the token vocabulary (statuses, doc types); the **provider rules** (which identity providers exist, and the single exchange call) |
| `@sumaiya/types` | web's CV/document types, moved — not re-declared |
| `@sumaiya/api-client` | one typed client for both surfaces: web adopts it for the browser calls, native keeps using it; endpoint paths and payload shapes live here only |
| `@sumaiya/i18n` (new, folded into `core` if you prefer) | one string catalogue with keys, and the Swahili lint tripwire reading from it — the web and native copies become one file |
| `@sumaiya/design-tokens` | keep, but make web *consume* it (`tailwind.config.ts` imports it) instead of mirroring it |
| `@sumaiya/analytics` | the event-name catalog and the property shapes — so `cv_export` cannot become three names |
| The **scoring engine** (ATS) | moved to `core` with its tests; both surfaces call it |
| Motion tokens | one file, generated or imported; **do this before the two copies drift a third time** |

**PLATFORM-SPECIFIC — must stay, and should be a named file per platform (RN's `.native.*` / a
`platform/` folder), never an `if`**

| Concern | Web (one implementation, two shells) | Native |
|---|---|---|
| UI primitives | the 266 DOM template components, Tailwind, Radix-ish primitives | React Native views, `react-native`/NativeWind styles |
| Template rendering | DOM components render the CV | `src/lib/cv-html.ts` → HTML string → WebView |
| Navigation | Next App Router; desktop vs mobile differ in *chrome* (sidebar/tabs), not in routes | React Navigation; tabs, stacks, back gestures |
| Storage | `localStorage` (guest draft), cookies, SW cache | `expo-sqlite`, `SecureStore` |
| File production | html2canvas/jsPDF **or** the new text-layer path | `expo-print` |
| Camera / files / share | `getUserMedia`, `<input type=file>`, Web Share API → download fallback | `expo-camera`, `expo-document-picker`, `expo-sharing` / `ACTION_SEND` |
| Push / permissions | web push + service worker | Expo push + `expo-notifications` |
| Install | PWA manifest + install prompt | Play Store / APK, unknown-source install |
| SEO / prerender | server components, sitemap, JSON-LD | not applicable |
| Fonts | webfonts + `document.fonts.ready` before export | bundled fonts, synchronous |

**The one-line rule for the team:** *business logic, validation, strings, endpoints and tokens are
shared and imported; presentation, navigation, storage, hardware and file production are
platform-specific and named.* If you are about to copy a constant, stop — that is the bug.

---

## 2.3 · How a feature is specified so all three implementations are recognisably one product

One brief per feature, and **every requirement carries an ID and a surface tag**, so the tests,
the review and the QA checklist can all name it. The template (also useful as a PR body):

```
FEATURE: <name>                              OWNER: <person>   DATE: <date>
OUTCOME (user-visible, one sentence, in the user's words):
  "<what the person gets, in English and in Swahili>"

SURFACES: [desktop-web] [mobile-web] [native]  — none may be omitted without a line below

REQUIREMENTS
R1  [CORE]    <rule that must be identical on all surfaces — validation, limits, ordering>
R2  [CORE]    <string keys added to the shared catalogue; Swahili register checked>
R3  [API]     <endpoint + payload shape, in @sumaiya/api-client>
R4  [WEB]     <presentation: layout, breakpoints, what differs desktop vs mobile-web>
R5  [NATIVE]  <presentation: screen, navigation entry, camera/storage specifics>
R6  [MEASURED] <exact event name(s) from the shared catalog + properties>
R7  [ERRORS]  <every failure the user can cause and the exact copy for each>

FORKS (each one needs a reason, and a reason is not "it was easier")
F1  <what differs> · why: <constraint> · consequence: <what the user notices>

PROOF (per surface — a claim without a command is not proof)
  web-desktop: <command or flow> → observed: <result>
  web-mobile:  <command or flow> → observed: <result>
  native:      <command or flow> → observed: <result>
  server state: <query/row/URL that must exist afterwards>

NOT DOING: <the adjacent things this feature deliberately does not touch>
```

Three rules that make the brief do its job:

1. **Requirements are numbered before implementation, and the test names carry the ID**
   (`R3 · /api/ai/tailor-cv rejects an empty JD`). A requirement with no test is visible.
2. **One string catalogue entry per user-visible string, used by all surfaces.** No surface
   writes its own copy of a sentence, and the Swahili lint tripwire runs over the catalogue.
3. **`FORKS` is a section, not a secret.** The legitimate-fork list in §2.6 is the default; a fork
   outside it must be written here with its reason, which is what turns "the web does it
   differently" from an accident into a decision.

---

## 2.4 · The worked example: Google sign-in, and the test that cannot silently recur

**What happened, with the code.** The two clients never shared an auth module, so each solved
"sign in with Google" in its own idiom:

- web — `apps/web/lib/auth-client.ts:46-61` calls `supabase.auth.signInWithOAuth({ provider: "google" })`,
  which is the **Supabase-hosted OAuth flow**: Supabase redirects to Google itself, so Supabase
  must hold the Google **client secret**. It does not, and the user gets
  `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`.
- native — `apps/native/src/contexts/auth-context.tsx:15` uses `@react-native-google-signin/google-signin`,
  which talks to Google **directly** and hands Supabase an **ID token** via
  `supabase.auth.signInWithIdToken(...)`. That path needs **no secret** — which is why sign-in
  works on the phone and fails on the web.

Both implementations were internally consistent. Each had its own passing tests. The bug is in the
*choice*, made twice, by nobody.

**What the platform vendor says, which settles the argument.** Supabase's own Google guide
documents both shapes and shows the web using the *same* exchange as the native app: Google's
pre-built button / Identity Services returns a `CredentialResponse`, and the handler calls
`supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential })`; for Expo it
documents `@react-native-google-signin` → `signInWithIdToken` with the same token shape
([supabase.com/docs/guides/auth/social-login/auth-google](https://supabase.com/docs/guides/auth/social-login/auth-google),
[signInWithIdToken reference](https://supabase.com/docs/reference/javascript/auth-signinwithidtoken), read in this session).
So the fix already queued as option 2 is the *architecturally correct* one, not merely the cheap
one: **web stops depending on a server-side secret and uses the mechanism the native app already
uses.**

**The rule, stated so it can be enforced:**

> **An identity flow may differ in how the credential is obtained; it may never differ in what is
> exchanged.** There is exactly one sign-in function in the product, it lives in a shared package,
> and both apps call it.

**Concretely, the end state.**

```
packages/core/src/auth/providers.ts        // the only declaration of providers
  export const IDENTITY_PROVIDERS = ["google", "email"] as const;
  export const EXCHANGE_PATH = "signInWithIdToken";     // the single exchange for OAuth providers
packages/api-client/src/auth.ts            // one sign-in surface
  signInWithGoogleIdToken(idToken)         // web: GIS credential · native: GoogleSignin idToken
apps/web/lib/google-identity.ts            // [WEB] obtains the credential only
apps/native/src/lib/google-identity.ts     // [NATIVE] obtains the idToken only
```

**The tests that make it unable to recur — three layers, each one cheap:**

1. **A source-graph assertion (unit, fast, no network).** *"Both apps obtain a Google credential
   through the shared exchange."* Implementation: a test that scans `apps/web` and `apps/native`
   for auth calls and fails on any `signInWithOAuth(` or `signInWithIdToken(` outside
   `packages/api-client`, and fails if either app does not reference the shared helper. This is the
   test that would have failed the day the web code was written. Assert the **identity of the
   call**, never its shape (this is the lesson of `expect(SUPPORT_EMAIL.startsWith("support@"))`
   passing over `support@templatehub.pro`).
2. **A per-surface live flow (E2E).** Playwright for the two web shells
   (`chromium-desktop`, `chromium-pixel7` — both already configured in
   `apps/web/playwright.config.ts`) and the existing Maestro flow for native. Each asserts the
   **server state**, not the UI: after sign-in, a session exists and `GET /api/user/profile`
   returns the same email on all three. A UI-only assertion ("we are on /dashboard") is exactly
   what passed while the web returned 400 — the fix is to assert the row, not the screen.
3. **A configuration contract (the third seam of the same class).** One test that reads the
   *deployed* configuration and asserts it: Supabase `/auth/v1/settings` (with the anon key) must
   report `external.google === true`; the Google client used by the web must have the Supabase
   callback in its authorized redirect URIs; and **the email-OTP template's length must equal
   `EMAIL_OTP_DIGITS`** — the constant that must move into `@sumaiya/core` from
   `apps/native/src/lib/auth-code.ts:3` so that web's hardcoded `6` cannot survive. This single
   test kills the entire family: *config says X vs deployed env holds Y*, *web says 6 vs app says 8*.

And the cultural rule that goes with it, which is the real prevention:

> **A bug fixed on one surface is not fixed until either the other surfaces have the same test, or
> the brief records why the surface is not affected.** Two surfaces exist; one passing proves
> nothing about the other. Report *"I ran X and observed Y"*, never "works".

---

## 2.5 · How drift is detected and prevented, mechanically

Five mechanisms, in descending value per hour of work:

1. **One source, imported — never copied.** Constants, tokens, strings, endpoints, event names,
   provider rules, scoring. The import table in §2.2 is the current scorecard; a copy that appears
   in either app is the signal.
2. **An import-graph test.** One test file with a short list of "must be imported" and "must not be
   re-implemented" module names, asserting both apps compile against the shared version. Cheap,
   and it catches the next motion-tokens file on the day it is created.
3. **The seam test, with a leg per surface** (queue §0.5). One command, `SURFACE=…`, walking the
   whole user journey and asserting against **server state**: guest opens → builds a CV →
   downloads → signs in → sees the data → and every assertion reads the database or an API
   response rather than the screen. Run it for `web-desktop`, `web-mobile` and `native`, and make
   `npm run evals` (the existing anti-fabrication harness) part of it.
4. **Contract fixtures for the client↔API boundary.** The Pact *idea* without the Pact server: a
   single recorded-shape test file that both clients run against the same fixtures, so a field
   renamed on the server fails on both clients in CI rather than in production on one
   (pattern documented at [docs.pact.io](https://docs.pact.io/)).
5. **A deployed-config check in the health path.** `/api/health` currently answers
   `{"ok":true,"db":"connected"}` — extend it to assert the *identities* it depends on: the
   Supabase project ref matches the expected one, the AI provider is present, the job sources that
   require keys are reported as present-or-missing (not silently skipped), and **the anon key
   cannot read a protected table** (§10a). One endpoint, polled daily, that turns three classes of
   silent failure into a red check.

Plus the two review rules that cost nothing: **a PR touching a shared package runs both suites**
(turborepo already makes this possible), and **a PR that changes one surface's copy or constants
must show the other surface's value** in the description.

---

## 2.6 · Definition of done, per surface

A feature is not done until **every** cell is either green or explicitly marked *not applicable,
because …*. This is the checklist that replaces "it works on my machine".

| | **Desktop web** | **Mobile web** | **Native (Android)** |
|---|---|---|---|
| Reachable | linked from the nav/entry path a real user takes; URL is shareable | same, and thumb-reachable (no primary action in the top 10% of the screen) | reached in ≤2 taps from the tab bar; back gesture exits cleanly |
| Works on the stated minimum | current Chrome/Edge/Firefox at 1280–1920px, keyboard-navigable, hover+focus states | a real mid-range Android browser at 360–414px, on 3G-throttled network | the Pixel on 1.6.24-class hardware, cheap-phone assumptions |
| Data | written to the server; reload restores it | same, and survives a tab kill | written locally first (SQLite), queued for sync, then server |
| Offline | not claimed unless implemented | offline shell shown, never a browser error page | full offline pass in airplane mode |
| Export/download | a real file lands, and it is the artifact under test (§5: a **text-layer** PDF) | opens/attaches via Web Share, with a download fallback | lands in the phone's storage with a human filename, and shares to WhatsApp |
| Strings | from the shared catalogue, English and Swahili, the Swahili read by a native speaker | same string keys | same string keys; no surface invents copy |
| Errors | every failure state has copy, an `aria-invalid`/`role="alert"` wiring, and a way out | same, at 360px, with the keyboard open | same, with a retry and no silent swallow |
| Measurement | the same event names and properties as the other two | same | same; server-side events land in the same tables |
| Proof | a command or a recorded flow, quoted verbatim in the PR/brief | same | same |

**And the one cross-surface test every feature must add:** a line to the seam test asserting the
**server state** the feature is supposed to produce, so that "the screen looked right" can never
again stand in for "the product worked".

---

## 2.7 · Where behaviour may legitimately differ

Differ freely here (and say so in the brief's `FORKS` section):

| Concern | Why it legitimately differs | What must stay identical |
|---|---|---|
| **Layout and density** | desktop has screen to spend on information; a phone has a thumb and a keyboard covering half the viewport | information present, order of steps, labels, the outcome |
| **Navigation chrome** | sidebar/top-nav on desktop, bottom tabs on mobile web, native tab bar + stack (Solito's "platform is your skeleton") | the same URL/screen names map to the same task on every surface |
| **Storage mechanism** | IndexedDB/localStorage vs SQLite vs nothing | what is stored, and that the user's work survives closing the app |
| **Credential acquisition** | a browser popup, a native Google dialog, a device passkey | **the exchange** (one call, shared) and the resulting session |
| **File production** | WebView print vs client-side raster vs (new) text-layer generation — the *mechanism* is genuinely platform work | **the artifact**: same content, same template, and one PDF that is ATS-parsable on every surface (§5) |
| **Offline depth** | the native app is the offline product; the web is the reachable one — the queue already states this boundary | never showing a raw browser error; never losing work |
| **Share** | `navigator.share` vs Android `ACTION_SEND` vs download | the file the receiver gets |
| **Camera** | `getUserMedia` vs `expo-camera` | the guide, the crop rules, and the stored size (`lib/photo-upload.ts`: 12 MB source cap, 600px square, q0.82, 400 KB ceiling) |
| **Push** | web push vs Expo push | the event that triggers it, and a user-visible opt-out on both |
| **First-run** | native has a wizard; web has a guest editor — the *route in* may differ | the aha-moment (a CV they can send) is the same, and is measured with the same event |
| **Install/distribution** | APK/Play vs PWA install prompt | the product's identity and the support channel |
| **Number, date and name formatting** | locale-appropriate | the value |

Differ nowhere else. Anything beyond this table is a decision that gets written down — because an
unwritten divergence is how the product ends up with two Google sign-ins, one of which returns
`400 missing OAuth secret` to a user who has no way to tell anyone, because the help address
points at a domain that belongs to a different, retired product.

---

# APPENDIX · every command behind a claim, verbatim

```bash
# ---------- repo identity (corrects the queue's "5 unpushed commits") ----------
$ git log --oneline -3
2803072 docs(queue): the seam test, the web Google sign-in break, mobile-web-vs-desktop, and guided photo capture
12f2d9f feat(web): make the CV photo work end-to-end — real downscale, real crop, real templates
e9fa803 docs(product): retention-first product direction — screens, features, implementation, and the outcome loop
$ git ls-remote origin HEAD      → 28030721b471e16552f6420bb1547c751d54273b
$ git rev-parse HEAD             → 28030721b471e16552f6420bb1547c751d54273b
$ git status -sb | head -1       → ## main...origin/main        (no [ahead N] marker)

# ---------- live site ----------
$ curl -s https://sumaiya.app/api/health           → {"ok":true,"db":"connected"}
$ curl -s https://sumaiya.app/api/jobs             → {"success":true,"data":[]}

# ---------- live database: counts and schema flags only, no row contents ----------
$ cd apps/web && node ../../scripts/live-state-probe.cjs
target: postgresql://postgres.duywnmibgiqulqzunsmh:***@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
== row counts ==
job 0 · campaign_event 2 · app_event 33 · debug_event 81 · device_token 0 · web_push_subscription 0
signal_notification 0 · profile 1 · user_profile 1 · cv 0 · application 0 · outcome_report 0
download_log 0 · ai_usage 0 · ats_score_snapshot 0 · template_submission 0 · referral_code 1
referral_claim 0 · saved_job 0 · job_match 0 · tool_invocation 0 · provenance 0 · payment 0
auth.users 1 (newest 2026-09-20 06:50:25.759035+00)
== freshness ==        job: null · campaign_event: 2026-09-20 08:05:26.002 · app_event: 2026-09-20 11:15:18.988096
== row level security ==
public tables 33 · RLS on 0 · RLS off 33
anon grants: DELETE=33 INSERT=33 REFERENCES=33 SELECT=33 TRIGGER=33 TRUNCATE=33 UPDATE=33
default ACL for new tables: {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,...}
# campaign_event's only two rows (non-PII columns):
  {src: "probe-live-1", name: "campaign_landing", at: 2026-09-20 08:05:26, has_vid: true}
  {src: "probe-cli",    name: "campaign_landing", at: 2026-08-21 07:48:55, has_vid: true}   ← both are earlier probes, not visitors

# ---------- the exposure, reproduced over HTTP with the PUBLIC anon key ----------
$ for tbl in profile cv application device_token job ai_usage; do
    curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/$tbl?select=*&limit=1" -H "apikey: $ANON"; done
200 200 200 200 200 200

# ---------- test suites, run in this session ----------
$ cd apps/web && npx vitest run
  Test Files  136 passed | 1 skipped (137)      Tests  2158 passed | 3 skipped (2161)      Duration  183.63s
$ cd apps/native && npx jest
  Test Suites: 1 failed, 42 passed, 43 total    Tests: 1 failed, 1212 passed, 1213 total    Time: 13.024s
  # the single failure is src/components/ui/motion-tokens.test.ts:36 — an UNCOMMITTED file
  # (another writer's in-flight motion work). Not mine; neither fixed nor reverted.

# ---------- the device ----------
$ C:/Users/hamis/tools/android-sdk/platform-tools/adb.exe connect 10.229.114.105:5555
$ … shell dumpsys package pro.sumaiya.app | grep -E "versionName|versionCode|lastUpdateTime|firstInstallTime"
  versionCode=10624 minSdk=24 targetSdk=36 · versionName=1.6.24
  lastUpdateTime=2026-09-20 10:02:55 · firstInstallTime=2026-09-18 20:53:16

# ---------- static evidence ----------
$ ls -S apps/web/.next/static/chunks/*.js | head -8      # chunk sizes in §1 (dev/non-production tree; no BUILD_ID)
$ du -sh apps/web/.next/static                           → 59M
$ grep -rl 'from "next/image"' apps/web/app apps/web/components --include=*.tsx | wc -l   → 0
$ grep -rn "<img " apps/web/app apps/web/components --include=*.tsx | wc -l               → 6
$ grep -rn "@media print|@page|print-color-adjust" apps/web                               → 0 matches
$ grep -rn "aria-invalid|aria-describedby" apps/web/components                            → 0 matches
$ grep -rn "^\s*(NEW|C)R?EATE POLICY|ENABLE ROW LEVEL SECURITY" .                         → 0 matches
$ grep -rhoE "@sumaiya/[a-z-]+" apps/web …     → 7 × @sumaiya/utils
$ grep -rhoE "@sumaiya/[a-z-]+" apps/native/src → 32 types · 26 utils · 20 api-client · 1 hooks
$ grep -rn "localStorage.setItem(\"" apps/web | sort -u  → sumaiya-guest-cv · th_pending_cv_text · theme
$ grep -rn "conflict|updatedAt >|last-write" apps/native/src/hooks/use-offline-sync.ts packages/utils/src/offline-storage.ts → 0 matches
$ grep -n "crons" -r ./apps/web/vercel.json ./vercel.json → apps/web/vercel.json:18 only
$ grep -rn "rtl|RTL|I18nManager|dir=\"rtl\"" apps → no exact matches
$ grep -rn "mailto:|support@" apps/web/app apps/native/src → support@templatehub.pro (both surfaces)
$ grep -oE 'date: "[0-9-]+"' apps/web/lib/blog.ts | sort | tail -1 → date: "2026-08-04"
$ grep -rn "export-data|downloadData|exportAll|gdpr" apps/web/lib/api/routes/user.ts apps/native/src/screens/app/profile-screen.tsx → 0 matches
$ grep -rn "autosave|autoSave|debounce|saveDraft" apps/native/src/screens/cv-editor-screen.tsx apps/native/src/hooks/use-cvs.ts → 0 matches
$ which gh → not found (Actions state therefore NOT re-verified here; §17)

# ---------- the build attempts, and a measurement mistake worth recording ----------
# Attempt 1 — WRONG: $? is tail's status, not the build's
$ npx next build 2>&1 | tail -60 > "$LOCALAPPDATA/Temp/sumaiya-build.out.txt"; echo "EXIT=$?" >> …
  → "EXIT=0"  (meaningless: the build had already failed with "Couldn't find any pages or app
     directory" — it had been run from the repo root, not apps/web)
# Attempt 2 — correct redirection, real status
$ cd apps/web && npx next build > "$LOCALAPPDATA/Temp/sumaiya-build2.out.txt" 2>&1; echo "EXIT=$?" >> …
$ wc -c < sumaiya-build2.out.txt → 34341   |   wc -l → 499
$ grep -n "Compiled successfully|Route (app)|First Load JS|Collecting page data|EXIT=" sumaiya-build2.out.txt
14:  ✓ Compiled successfully
487:   Collecting page data ...
488: unhandledRejection Error [PageNotFoundError]: Cannot find module for page: /_document
499: EXIT=1
  → compilation SUCCEEDED; page-data collection crashed; **no route table, no First Load JS in this
     log**. A clean rebuild is required to get production numbers (queue §20).
# A third attempt (rename .next, then build) was abandoned: the rename failed with Permission
# denied — a leftover node.exe still held handles inside .next — and nothing was moved. No node
# process was killed: on this machine several are running and they cannot be attributed from here.
```

**Scripts committed with this document**

- `scripts/live-state-probe.cjs` — the live-database probe. Prints counts, freshness and RLS/grant
  status and **no row contents and no secrets**; it reads `DATABASE_URL` from the environment or from
  the out-of-repo secrets file the deploys already use. One command answers "is the feed empty",
  "has push ever worked", "is RLS on". Run it from `apps/web` so `postgres` resolves.
