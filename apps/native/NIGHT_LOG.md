# Overnight work log — 2026-09-09 → 09-10

Branch: `feat/interaction-model`. Not merged, not built, not deployed.
User's directive: native app focus; free tier = templates + courses; premium =
advanced/complex; research + improvements, scope open; discuss in the morning.

## Session start state
- 26 commits ahead of `main`. tsc clean, 74 jest green, full `expo export` OK.
- Open items from the audit: chat→CV, template parity, remaining Swahili,
  device testing, deploy of the assistant prompt fixes.

---

## Plan for the night

| Wave | Scope | Status |
|---|---|---|
| A | Finish Swahili + finish the bug-hunt sweep (application-detail, pdf-tools, profile, use-applications, shared components) | ⏳ |
| B | Chat → CV: a real "Sumaiya builds your CV in the chat" path (mobile endpoint + in-chat CvPreviewCard) | ⏳ |
| C | In-app templates — 3–4 looks in the free tier, a couple premium; real picker; `cv-html` multi-template | ⏳ |
| D | Courses — first-party short guides, free tier + premium, in the Learning hub | ⏳ |
| E | Polish pass — empty/loading/error states, a11y, haptics, micro-animation consistency | ⏳ |
| F | Research notes for the morning (pricing, competitor teardown deltas, what to build next) | ⏳ |

Everything env-gated / structural where it touches money — no real charging,
no provisioning. Commit frequently.

---

## Progress

(appended as I go)

### 23:24–23:45 — Waves A/B/C/D

**A. Swahili + bug sweep (done)**
- profile-screen alerts localised. application-detail + pdf-tools were already
  fully localised (audit was over-cautious there).
- Confirmed UI components (button/screen/text-field/card/list-row…) clean.

**C. CV templates (`cb66b23`)**
- cv-html.ts → 6 layouts: classic / modern / minimal / sidebar (free),
  executive / compact (premium). Shared content blocks, print-safe CSS.
- `useEntitlements()` (local flag, no billing) + `PremiumSheet` (explains the
  tier, "notify me" → local waitlist flag).
- CvPreviewCard: template row + colour row; locked ones open PremiumSheet.
- Editor persists the chosen template; preview + PDF use it.

**D. First-party guides (`2a426cf`)**
- lib/guides.ts — 4 free (ATS, 6 interview Qs, follow-up, "no experience"),
  3 premium stubs (salary nego, career change, LinkedIn). Bilingual, offline.
- GuideScreen + "Guides from Sumaiya" section atop the Learning hub.

**B. Chat → CV (`a4a2abc`)** — the big open item
- POST /api/mobile/build-cv (web): transcript + profile → CVData JSON, anti-
  fabrication, refuses when too thin.
- api-client.buildCv(); native chat "Build my CV from this chat" bar (appears
  after 2 real turns); Sumaiya drops a CvPreviewCard in the thread with
  Save to My CVs / Download / Open editor. New 'cv-ready' message type.

State: 31 commits. tsc clean, 74 native jest + 81 web api tests green.
NOT built. NOT deployed. WebView / google-signin / new endpoint need device +
a deployed backend to actually exercise.

### Next
- E. Polish pass (empty/error/loading states, a11y, haptic + motion consistency)
- F. Research notes (pricing, competitor deltas, what's next)

### 00:00–01:30 — Waves E/F + extra features

**E. Polish**
- `f383e63` tip-of-the-day on Home; premium row in Profile; scan-error escape hatch
- `b54aedf` useCvs refreshes on focus; "one of my CVs" attach works (was a stub)
- `4a8f08d` PromptModal (cross-platform, Alert.prompt is iOS-only); SumaiyaMark
  only holds a frame loop while spinning
- `2a70d84` profile alerts localised
- `a46b84f` (earlier) no theme flash between screens

**Extra features built tonight**
- `e822210` schematic template thumbnails (TemplateThumb) in the picker
- `5c48718` smarter JD matcher — phrases + light stemming (+ test, 75 total)
- `3909f3d` referral loop — InviteScreen, api-client methods, ?ref= capture + claim
- `837977f` "Sumaiya's verdict" — premium AI CV review in the ATS checker

**F. Research** — `dd3d92a` docs/RESEARCH_2026-09-10.md
- Pricing: free everything essential; premium = one-off ~KES 150 unlock (the
  "gateway" payment East African micropayment research says you need) + an
  annual pass ~KES 2,000. M-Pesa rails needed (Pesapal). Careful: Play Store
  rules on payment outside Play billing.
- Competitors filling up fast (SwiftKazi, Careergo, Kompeaa, Fuzu). Sumaiya's
  edge: bilingual done right + offline + one persona + local guides.
- Ranked next-build list in the doc.

**Verification:** full `expo export` green (3219 modules → 6.6MB hbc) at
`837977f`~2. tsc clean, 75 jest green. Still NOT built as APK, NOT deployed.

### Open for the morning
- Deploy web (`build-cv`, `verdict` reuse, assistant prompts) or nothing new works
- M-Pesa / billing decision → flip `useEntitlements` from local flag to real
- Premium course content (needs a writer)
- Device test everything

### 02:00–03:30 — hardening + more polish

- `f17a1e6` **top-level ErrorBoundary** — a screen crash shows a calm "your
  data is safe / Try again" recovery instead of a white void
- `27d8ed1` **push registration** (env-gated on EAS projectId) + notification
  tap-routing + app.json plugin. Needs `eas init` + a backend sender.
- `ac95cb2` handover doc updated (push provisioning, branch deploy, billing seam)
- `f3d29d3` a11y — accessibilityLabel on Button, role+label on Card
- `543625a` CvPreviewCard thumbnail loader (no white flash); natural CV-build opener
- `7377a64` consistent loading states (skeletons for lists, spinners for forms)
- `80c130c` chat suggestion chips — bilingual, matched on both sides, all route real
- `fd89f0a` localized the chat greeting quick-actions (were English in SW)

**Total this session: 23 commits since "keep cooking" (48 ahead of main).**
tsc clean, 75 jest green throughout. expo export verified clean earlier
(3219 modules); nothing added a dependency after that except expo-clipboard
(commit `3909f3d`) and expo-notifications config — both standard Expo modules,
both tsc-resolve. A real APK build confirms.

### 03:30–04:30 — web assistant bug hunt (from a live screenshot)

User reported: attached a CV, Sumaiya kept asking for one; then topic-thrash,
invented job title, dead-end jobs search.

- `5899945` **attached file never reached the AI when attached mid-reply** —
  onAttachFile silently no-op'd if busy. Now held in pendingFileRef and read
  the moment the turn ends; chip shows filename + reading…/✓/failed + Retry.
- `b719847` **jobs.search** — token-scored matching (whole-phrase substring
  returned nothing for "pharmacy sales rep"); honest "no jobs listed" vs
  "nothing matched" messaging.
- `1c9cdff` **assistant prompt** — never re-ask an ignored question; no "Sorry"
  unless genuinely wrong; a business owner isn't a "sales representative".
- `23c8df6` attaching a file no longer force-switches the chat into CV mode.

All on `feat/interaction-model` — **need the web deploy to take effect**.
tsc clean, web 222 route/assistant tests green.

### Known gaps (not attempted — need a rebuild / device / decision)
- **Native voice input** — web assistant has a mic (STT); native has none.
  "tap > speak > type" is core to the low-literacy brief. Needs a native STT
  module + a config-plugin prebuild. Not half-built blind.
- Push **sender** (native registration done, env-gated).
- Premium **billing** (entitlements seam in place).

### Verification (04:30)
- **Full web suite: 982 passed / 3 skipped / 0 fail** (this box CAN run it now)
- native: tsc 0 errors, 75 jest green
- Total commits since "keep cooking": ~35. Nothing built, nothing deployed.

### 04:30–05:15 — offline CV sync layer (deeper hunt)
- `0502cfd` **CV edits made offline were silently lost** — update_cv PUT the
  local id, server row is m_hash(userId:clientId) → 404 every time. Both
  create_cv + update_cv now POST with clientId (server upsert).
- `2385e1c` **duplicates** (synced CV shows twice: local id + m_ id) →
  cv-dedupe.ts, precise signature match, 4 tests. **delete-while-offline was
  resurrected** on next sync → queued now, id-shape-aware.

These last two were regressions from my own offline-first useCvs (87768b1) —
caught + fixed + tested before anyone hit them.

**Session total: ~42 commits since "keep cooking". 79 native jest, 982 web,
tsc clean both. Nothing built, nothing deployed.**

### 05:15 — offline CV id-space, fully consistent
- `afc09a0` editing a synced CV forked a new server row (local id used as
  clientId after the row already had a server id). Now every op branches on
  the id shape: m_… → PUT by id; local → upsert by clientId. create / update /
  delete, in both useCvs and the sync processor.

**Offline CV layer is now internally consistent.** Wants a device test of the
full create → sync → edit → delete loop before shipping.

## Where things stand (05:20)
- 64 commits ahead of main. tsc 0/0, native 79 jest, web 982.
- Nothing built, nothing deployed.
- Deploy the branch → build-cv, verdict, all the assistant + attach fixes go live.
- Then: eas init (push projectId + real APK), billing seam, device test.

### 05:40 — first-run guided profile setup (user request)
- `2e6ac84` **new users landed cold on the home screen** — the career profile
  existed only as a buried editor, so Sumaiya re-asked name / role / skills
  every chat. Now: after sign-in, a first-time user gets a 7-step guided
  wizard (intro → name → target role → contact → recent job → skills → pick a
  look), one question per screen, big fields, progress bar, Skip anywhere.
  Saves to the career profile + a device-local default CV template
  (`lib/prefs.ts`) that `CvPreviewCard` and the CV editor now fall back to
  when no template is passed. Gated on `sumaiya_first_run_done`; nav gate sits
  between `!user` and `App` in root-navigator.
- tsc 0/0, 79 jest green.

### 05:55 — first-run: fixes + customization
- `first-run` back nav reachable on every step; Icon pulled out of `<Text>`
  (renders badly on Android).
- **Customization**: the "Default CV look" picker now also lives in the career
  profile screen, writing the same `prefs.ts` default. Set it once in
  first-run, change it any time from Profile.
- tsc 0/0, 79 jest.

### 06:30 — code-tightness pass ("is the app tight and well coded")
Audit found: untyped nav props (~13 screens), CV type drift, thin tests, no
crash reporting. Worked it:
- **Navigation fully typed** — every screen takes a real
  `NativeStackScreenProps` composite; `AppTabParamList` carries
  `NavigatorScreenParams` so the nested `navigate("CVsTab",{screen,params})`
  form is checked. tsc caught nothing broken — all cross-stack routes
  already resolved.
- **`any` count 33 → 6** (the 6 left: a catch clause, a documented
  lib-type impedance cast, a raw SQLite row). CV-data reads in
  job-apply/ats/chat now typed via `CVData`.
- **`reporting.ts`** — error-reporting seam. Boundary + sync give-up + chat +
  auth + push + db-init route through `reportError()`; no-op until
  `setReporter()` wires a real reporter.
- **+18 tests** (79 → 97): reporting, prefs default/fallback,
  profileIsEmpty/promptBlock, attachmentsContext anti-fabrication.
- first-run save decision now uses shared `profileIsEmpty()`.
- tsc 0/0, 97 jest, expo export exit 0.

**Still not done (needs deploy / device / decisions):** offline-sync
integration test on a phone, native voice input, push sender, billing.

### 08:40 — DEPLOYED (user said "deploy and build")
- feat/interaction-model fast-forwarded onto main, pushed. Vercel auto-deployed
  to production (sumaiyaai.vercel.app) — 2m build, green. Backup tag +
  branch also pushed.
- Web verify before push: tsc clean, 408 assistant/api/eval vitest green.
- Live prod check: new hero "Kutana na Sumaiya" ok; /assistant shows the new
  start-chooser ok; /api/mobile/build-cv -> 400 bad body / 401 no-auth (wired,
  LIVE); tools/ats-checker/snap-to-apply 200.
- Found + fixed a pre-existing 500 (de820e2): bare /editor, /dashboard fell
  through the marketing layout with locale="editor" -> translations[lang]
  undefined -> 500 whole marketing tree. Clamped to en|sw like root layout.
  Live 16h+ (count 9). /editor now 200, no new errors.
- APK: expo prebuild --clean (kept box-tuned gradle.properties), gradle
  assembleRelease running, debug-keystore signed (internal/installable).
- Can't test the authed assistant conversation (no login) — user's session test.

### 09:00–09:30 — APK build: BLOCKED on this box
Tried 6 ways to produce a release APK locally. Every gradle `assembleRelease`
run gets memory-killed by the harness — several within the config phase,
before any real compilation, despite:
- single ABI (arm64), no daemon, no parallel, --max-workers=1
- gradle heap tried at 3584m / 2560m / 1536m / 1024m; kotlin daemon capped
- pre-building the JS bundle with `expo export` / `expo export:embed` (both
  succeed standalone) then feeding it to gradle — but `-x
  createBundleReleaseJsAndAssets` fails: `mapReleaseSourceSetPaths` reads that
  task's output provider and errors if it's skipped
- `dangerouslyDisableSandbox: true` (survives longer — one run reached
  `mapReleaseSourceSetPaths` — but still killed on the full run)

`expo export --platform android` alone: GREEN (6.7MB Hermes bundle).
Kotlin/Java compile of all native modules: cached & GREEN (UP-TO-DATE).
The wall is Metro + gradle JVM coexisting during the bundle task.

**Path forward = EAS cloud build.** Needs the user to run `npx eas login`
(no saved creds, no EXPO_TOKEN). Then: `eas init` (also writes
extra.eas.projectId → unblocks push) + `eas build -p android --profile
preview` (eas.json already has that profile, apk, env → sumaiyaai.vercel.app).

gradle.properties restored to committed (box-tuned) values. dist/ left in
place (gitignored).

### 10:00 — LIVE WEBSITE TEST (Playwright vs prod) — 2 serious findings
Ran a headless-Chromium sweep of sumaiyaai.vercel.app (desktop + Pixel 7).

**P0 — email sign-in is DOWN in production.** POST /auth/v1/otp → 500
`{"code":"unexpected_failure","message":"Error sending magic link email"}`.
Supabase auth_logs: **SMTP `535 "Authentication credentials invalid"`**. Hits
BOTH magic-link and 6-digit-code. Only Google OAuth works (hamisiddy9@ has been
logging in fine via oidc). Auth config was reloaded 2026-09-09 ~16:00 & ~17:45
— creds likely broke then. FIX: Supabase → Auth → SMTP settings (wrong user/pass
or dead API key), or disable custom SMTP to fall back to the built-in sender.
=> blocked the whole authed test (chat / upload / export / dashboard).

**P1 — 7 public tables, no RLS, anon-key read+write** (Supabase security
advisor, ERROR): device_token, web_push_subscription, referral_code,
referral_claim, tool_invocation (leaks rows today), provenance, eval_sample.
Confirmed: all return 200 to the anon key. Most empty now, but it's a live
write hole (referral fraud, telemetry poisoning, token injection). Memory says
Postgres RLS was deferred ("authz is in run-tool") — but PostgREST exposes
these tables directly, so that reasoning doesn't hold for them.

**P2 — /assistant desktop layout**: big empty band above the greeting bubble on
≥1024px (content bottom-anchored). Fine on mobile.

**Green:** all public routes 200, no console errors, i18n (sw/en) OK, guest CV
editor solid, /editor 500 fix confirmed live, start-chooser live, mobile renders.

### 10:45 — LIVE TEST cont'd: full GUEST flow works end-to-end
Auth P0 blocks logged-in testing, but the assistant has a guest mode — tested
that fully against prod:
- multi-turn chat, fact-tracking: GOOD (tracked employers, dates, CPA, skills)
- anti-fabrication: GOOD — "mwenye famasi yako mwenyewe" not "sales rep";
  built CV had zero invented facts (all from what the tester said)
- file upload + text extraction: WORKS ("Nimeona CV yako... historia ya famasi")
- guest conversation survives a page reload (localStorage)
- "Nimemaliza — tengeneza sasa" → in-chat CV preview card (template + colour
  switch) → "Pakua PDF" downloads a real, clean, well-structured CV as a GUEST
  (no signup wall)

New bugs (all polish, none blocking):
- **PDF export emits a blank page 2** — CV fits on p1, download is 2 pages.
- **"Tengeneza CV yangu" build bar still shows AFTER the CV is built** (below
  the finished preview card).
- **Assistant re-asks an unanswered question verbatim** — the 1c9cdff
  anti-loop prompt is unreliable when the user sidesteps a question. Escape
  hatch (build-now bar) mitigates.
- **401 /api/profile/confirmations on every guest load** — client should skip
  it when guest.
- CPA(K) double-classified as skill + certification; greeting says press "CV"
  but the card is "Nataka CV".

### 11:00 — fixing the live-test findings (while user takes Supabase)
- `100b3c9` **PDF blank trailing page** — a CV filling the page almost exactly
  counted as 2 (source PAGE_H a hair over jsPDF's a4-px + full-height sidebar).
  `computePageCount()` absorbs <2% overflow. +3 tests.
- `100b3c9` **"Create my CV" bar showed after a guest CV was built** — gated on
  `!guestCvReady`.
- `100b3c9` **401 /api/profile/confirmations on every guest load** — skipped for
  guests (both call sites).
- `100b3c9` **/assistant desktop dead band** — greeting+chooser centred before
  the first user turn, bottom-anchored after.
- `100b3c9` greeting copy: "tap one below" not "tap 'CV'" (card says "Make my CV").
- `1121d4d` **CPA(K) double-listed** as skill + certification — deduped in
  `toCvData` (credentials live in Certifications). +1 test.
- `a012eb5`+`af8adc4` **target-role question loop** — 2 prompt passes; now VERIFIED
  on prod: role asked once, then flows role → work → detail → education, no
  repeats.
  want" and re-asked it every turn; now a stated profession is enough, ask
  "what job?" at most once.
Also `8c77039` sign-in logo (bigger + wordmark + cream, verified on prod).

Supabase P0 (SMTP 535) + P1 (RLS on 7 tables) handed to the user with a guide.
All web changes: tsc 0, targeted vitest green, deployed to prod as pushed.

### 11:30 — live-test fixes verified on prod
All 7 findings from the guest-flow test confirmed fixed against
sumaiyaai.vercel.app:
- PDF: 1 page now (was 2 w/ blank trailing) ✓
- stale "Create my CV" bar after build: gone ✓
- 401 /api/profile/confirmations: gone (guest) ✓
- /assistant greeting+chooser: centred, no dead band ✓
- greeting copy "Gusa kimoja hapa chini" ✓
- target-role loop: FIXED — asked once, then role→work→detail→education ✓
- CPA(K) dedup: code+test (not re-run live)
- sign-in logo: verified earlier
Supabase P0/P1 still with the user.
