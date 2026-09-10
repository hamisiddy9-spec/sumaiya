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
