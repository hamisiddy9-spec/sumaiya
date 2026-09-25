# CLAUDE QUEUE — 2026-09-20

**User's instruction (verbatim):** *"nakupa hivo vyote unote akirudi umpe usifanye wewe"* —
note all of this, and when Claude returns, give it to him. **Do not do it yourself.**

**Claude's session limit resets 13:40 Africa/Nairobi.** Every `claude -p` exits 1 with
`You've hit your session limit · resets 1:40pm (Africa/Nairobi)` until then.

**This file is the handover.** Work is queued here, not implemented by hand.

---

## How to hand each item to Claude

```bash
export PATH="$PATH:/c/Users/hamis/.local/bin"
claude -p "$(cat <brief-file>)" --dangerously-skip-permissions --output-format text \
  > "$LOCALAPPDATA/Temp/<name>.out.txt" 2>&1; echo "EXIT=$?"
```

**Always redirect to a file.** A background `claude -p` run was killed mid-flight and its
result was lost — 592 seconds of work with nothing to show. Read the file afterwards.

Before accepting anything Claude wrote: read the diff yourself, run the gates
(`apps/web`: `npx tsc --noEmit` then `npx vitest run`; `apps/native`: `npx tsc --noEmit`
then `npx jest`), and stage named paths only — **never `git add -A`**.

---

## THE QUEUE

### 0. SHARE WITHOUT DATA — approved by the user ("weka option ya share without data")
**The problem:** the APK is the real product, but there is no way for it to reach people.
Tanzanians do not download APKs from websites; they **share files phone-to-phone**
(WhatsApp, Xender, SHAREit, Bluetooth). A download link also costs the receiver data.

**Build:** a **"Nitumie Sumaiya"** share action that hands the app to someone standing
next to you, costing them **zero data**.

- Place it: first-run screen, home, and settings. Visible, not buried.
- Mechanics: the app reads **its own APK** via `ApplicationInfo.sourceDir` (no root
  needed), copies it to cache, and shares it through `Intent.ACTION_SEND` with
  `application/vnd.android.package-archive`. That reaches WhatsApp, Xender, SHAREit,
  Bluetooth and Nearby Share — the channels people actually use.
- **Measure it:** each shared APK must carry the sharer's identity (a referral code in the
  shared filename or a paired deep link) so the growth loop is **attributable**, not
  anecdotal. This is the same gap as the campaign: without attribution the loop is
  unprovable.
- Handle the install reality: the receiver will hit **"Install unknown apps"** — the
  sharing flow must explain that step in Swahili, in one sentence, before they hit it.
  A confused receiver abandons.
- Size: the minified APK is 43.45 MiB, inside WhatsApp's file limit, but confirm the
  actual transfer works. Never ship a share flow that produces a file the receiving app
  refuses.
- Offline by design: this must work with **no connection at all** — it is a local file
  transfer. Verify it with airplane mode ON.

**Acceptance test:** on the Pixel, with airplane mode on, share the app to a second
device (or to a file manager) and confirm the received APK installs and signs in. Report
the actual bytes and the actual result.

### 0.5. THE SEAM TEST — the structural fix (the user's question: "why do we keep making such mistakes")
Every bug on 2026-09-20 lived at a **seam between components**, and every piece passed its
own tests in isolation:

```
app sends 8 digits        vs  server sends 6                  <- seam
web goes via Supabase     vs  app goes via Google directly    <- seam
config says X             vs  deployed env holds Y            <- seam
tests pass                vs  the product does not work       <- seam
```

**Build one command that walks the whole journey and asserts against SERVER state, not UI
state:** guest opens → builds a CV → downloads it → signs in → sees their data back →
and the assertions come from the database and the API, never from what the screen shows.

Rules to encode with it:
- **Two surfaces exist (web + APK). One passing proves NOTHING about the other.**
- **Never report "works"** — report *"I ran X and observed Y"*. If X was not run, the answer
  is **"unverified"**.
- **A child agent's report is a self-report, not a fact.** Verify externally-visible
  effects (rows, URLs, status codes) before repeating the claim.
- The repo already ships `npm run evals` (anti-fabrication harness). It did not run today.
  Put it in the seam test.

### 0.6. GOOGLE SIGN-IN ON THE WEB — FIXED (2026-09-20, no Supabase secret needed)

**Status: implemented + gated + probed on a real page. One owner action left to see a
completed sign-in** (see "Remaining" at the end of this item).

`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`
was reproduced again before the fix (curl, `…/auth/v1/authorize?provider=google`, HTTP 400).

The two clients used **different** code paths:
- **web** `apps/web/lib/auth-client.ts` → `supabase.auth.signInWithOAuth({provider:"google"})`
  → goes **through Supabase** → needs the **Supabase Google CLIENT SECRET**, which is unset.
- **native** `apps/native/src/contexts/auth-context.tsx` → `@react-native-google-signin`
  → talks to **Google directly**, gets an ID token, hands it to Supabase → **needs no secret.**

**Fix taken: option 2 (remove the dependency).** The web app now uses Google Identity
Services in the browser to obtain an ID token and calls
`supabase.auth.signInWithIdToken({provider:"google", token})` — the same shape as native.
No Supabase-hosted secret is involved anywhere on the web path any more.

- New: `apps/web/lib/google-identity.ts` (GIS loader + `requestGoogleIdToken`, all DOM
  injected so it is unit-testable; ships the public web client ID as a fallback so the
  button works with no env change).
- `apps/web/lib/auth-client.ts`: `signIn.social` (OAuth redirect) **deleted**, replaced by
  `signIn.google()`. Both call sites updated (`sign-in-form.tsx`, `cv-editor-client.tsx`).
- `apps/web/lib/security/csp.mjs`: GIS needs `https://accounts.google.com` in `script-src`,
  `style-src`, `connect-src` AND `frame-src` (there was no `frame-src` at all, so
  `default-src 'self'` was silently blocking Google's sheet).
- **Seam test** (the point of §0.5): `apps/web/lib/signin-mechanism-parity.test.ts` reads
  BOTH source trees and fails if web and native stop using the same shape, if the OAuth
  redirect comes back, if the two client IDs differ, or if CSP stops allowing Google.
  Verified by mutation: reintroducing `signInWithOAuth` into `auth-client.ts` fails 2 of
  its assertions; reverting makes them pass.
- Email/OTP untouched and still covered (`apps/web/lib/auth-client.test.ts`).

**Evidence:** `npx tsc --noEmit` → exit 0; `npx vitest run` → 139 files passed | 1 skipped,
2188 tests passed | 3 skipped (baseline was 2157 | 3). Real page probe (headless Chrome on
`next dev`): clicking the button loads `https://accounts.google.com/gsi/client` (200) and
runs the FedCM flow (`gsi/fedcm.json` 200, `listaccounts` 200); **no request to
`*.supabase.co`** is made any more. Supabase side: `POST /auth/v1/token?grant_type=id_token`
now answers `400 "Bad ID token"` for a fake token — i.e. the route works and only the token
was fake — versus the old route's `missing OAuth secret`.

**Remaining (owner action, cannot be done from code):**
1. Google Cloud → OAuth client `811013224847-…` → **Authorized JavaScript origins** must
   list the sites that serve the button (`https://sumaiya.app`, `https://www.sumaiya.app`,
   and `http://localhost:3000` for dev). Until then GIS answers
   `Provider's accounts list is empty` / `FedCM get() rejects with NetworkError`, which is
   the exact observed failure in the probe — sign-in stops at Google, not at Supabase.
2. Deploy the web app (the live site still runs the old bundle).


### 0.6.1 GOOGLE OAUTH — VERIFIED STATE (read off the console, not assumed)
Verified 2026-09-20 by reading the OAuth client page in the Google Cloud console
(project `sumaiya-508116`) on the device browser.

**Web client** `811013224847-1g6ml0490hhfngrips635ropm8tka4ep.apps.googleusercontent.com`
(name "Sumaiya", type Web application, created Sep 9 2026):
- **Authorized JavaScript origins: `https://sumaiya.app`** — SET. This is exactly the value the
  shipped GIS + `signInWithIdToken` fix needs, so **the last external blocker for web Google
  sign-in is satisfied**; the fix only needs deploying.
- Authorized redirect URIs, all three read verbatim: `https://sumaiya.app/auth/callback`,
  `http://localhost:3000/auth/callback`,
  `https://fskokfnunjlrvxspkftx.supabase.co/auth/v1/callback`
- Second client: **Android**, `811013224847-esth…`

**Three discrepancies — all owner actions, all cheap:**
1. **`https://sumaiya.app/auth/callback` returns 404 on the live site** (verified: curl -> 404).
   The route that exists is `https://sumaiya.app/api/auth/callback` (curl -> 307). The console
   therefore points at a path the app does not serve. Harmless for the ID-token flow, which uses
   no redirect URI at all, but wrong configuration.
2. The third redirect URI points at `fskokfnunjlrvxspkftx` — the FIRST new project ref, **not the
   live `duywnmibgiqulqzunsmh`**. Leftover from the rebuild, and the same class of stale-ref
   mistake that broke the Vercel deploy.
3. `http://localhost:3000` is configured as a **redirect URI but not as a JavaScript origin**, so
   GIS cannot be exercised on a local dev server at all — it fails origin validation before
   minting a token. Add it to **Authorized JavaScript origins** to make the flow testable
   locally, and add `https://www.sumaiya.app` if the www host serves the app.

**Not needed any more:** do NOT configure a Supabase-hosted Google client secret for the web
path. The shipped fix removed that dependency (`lib/auth-client.ts`, enforced by
`lib/signin-mechanism-parity.test.ts`).

### 0.7. MOBILE WEB vs DESKTOP — never designed, only stretched
**User's words:** *"web page transition loading show illustrations of boxes when loading pages ... audit also find a way to make mobile web and desktop environments research them individually against the world and adjust to best as you can ... i feel the web versions mobile and desktop have not been given thought to"*

**He is right, and this is a genuine product gap not a polish item.** The web app was built
phone-first and the desktop experience appears to be the phone layout stretched. Nobody has
designed for the two environments separately.

**A. Loading states — "illustrations of boxes".** Every async surface must show a
**skeleton in the SHAPE of the content that is coming** (the actual boxes: a header block, a
line of text, a square photo frame), not a spinner and never a blank flash. That means a
skeleton per screen that mirrors that screen's real layout, with a subtle shimmer — and the
transition from skeleton to real content must be a motion beat, not a snap (see §3). Audit
every route: editor, templates gallery, job feed, dashboard, assistant, profile.

**B. Page/view transitions.** Navigation between pages needs a transition rather than an
instant swap — same rules as §3 (origin-aware, interruptible, nothing "booms").

**C. RESEARCH EACH ENVIRONMENT SEPARATELY, against the world.** Do not reason from taste —
gather what best-in-class products actually do, with citations:
- **mobile web** (a real phone browser, not the native app): thumb-reach zones, bottom
  navigation vs top, touch target sizes, keyboard behaviour on forms, scroll performance,
  data cost, viewport handling, what the jobseeker audience tolerates.
- **desktop web**: information density, multi-column layouts, hover and focus states,
  keyboard navigation, large-screen use of space, drag-and-drop, print/PDF affordances,
  multi-tab behaviour.
- Study products that do BOTH well - the editor/creation class (Canva, Figma, Notion),
  the document class (Zety, Novoresume, Google Docs), and the marketing class (Stripe,
  Linear) - and state what transfers to a Tanzanian career product and what does not.
- Cite URLs for every claim.

**D. THEN DESIGN AND IMPLEMENT** the responsive system: breakpoints, what changes and what
does not, the desktop information architecture (screen real estate used for value, not
whitespace), and the mobile-web navigation model. Explicitly define the boundary between
"the same product, adapted" and "a different product" - the Android app stays the offline
product; mobile web and desktop are the reachable ones.

**E. FIND MORE GAPS.** The user asked for more: audit the whole web surface for places
where neither environment was considered - forms, tables, modals, the editor canvas, the
template picker, error and empty states, and anything described as "responsive" that is
merely unstyled.

**THE FULL BRIEF, THE AUDIT AND THE NUMBERS ARE IN
`docs/RESPONSIVE-STANDARD-2026-09-20.md`.** Read that document before starting
anything below; every item here cites a section of it. **Sections 0.7.1–0.7.5
are the implementable work.** Do them in order — 0.7.1 alone removes the user's
actual complaint.

#### 0.7.1. Kill the "illustrations of boxes" — the skeleton system (doc §A.3, §A.4)

**The defect, with lines:** the loading states are abstract boxes, not the page
that is coming. Worst instance:
`apps/web/components/dashboard/dashboard-skeleton.tsx:5` — **nine** placeholder
cards (A4-shaped grey rectangle + 2 bars each) in a `grid-cols-2` on a phone.
Second instance: `apps/web/app/(app)/loading.tsx:7`,
`apps/web/app/[locale]/loading.tsx:10` and
`apps/web/app/[locale]/(marketing)/loading.tsx:11` render a **2px bar over an
empty page** (NN/g's documented anti-pattern, doc §0). Third:
`apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx:389` is a `<Suspense>` **with
no `fallback`** → the sign-in body is blank until hydration. Fourth:
`apps/web/app/(app)/(dashboard)/editor/loading.tsx:9` and
`apps/web/app/(app)/editor/loading.tsx:9` show a bar over an empty page for the
app's heaviest screen.

**Build:**

1. **`components/ui/skeleton.tsx` — rewrite** around `<Sk/>`, `<SkText lines/>`,
   `<SkBox ratio/>`, `<SkShimmer>`; keep the current exports
   (`Skeleton`, `CardSkeleton`, `GridSkeleton`) as aliases so no caller breaks.
   Geometry must be copied from the real component and named in a comment
   (`// mirrors components/dashboard/dashboard-cv-grid.tsx:110`).
2. **One shimmer:** move `.skeleton-shimmer` into `app/globals.css` as the single
   sweep (§A.3.2 has the exact keyframes, 1.4s linear, `background-position`,
   `contain: content`, reduced-motion holds static). **Do not add
   `animate-pulse` to any skeleton** — `globals.css:87-91` already owns the right
   class (`.skeleton`) and nothing uses it. Replace the four bare `animate-pulse`
   stand-ins: `dashboard-skeleton.tsx:9`, `settings/career-profile-card.tsx:139`,
   `jobs/targeted-cv-drawer.tsx:275`, `editor/shared-profile-panel.tsx:142`.
3. **`components/ui/async-slot.tsx` (new)** implementing the hand-off
   (§A.3.3): `pending`, `children`, `minVisibleMs=300`, `holdMs=220`; exit with
   the existing `.swap-out` (140ms) **while** the content enters with `.swap-in`
   (300ms). **Both classes exist only in the uncommitted working tree**
   (`git show HEAD:apps/web/app/globals.css | grep -c swap-in` → `0`); entry is
   applied in six places and **exit in none** — that is the half-beat to finish,
   and the pair must be landed together with its first real caller.
4. **Per-screen skeletons, exactly as specified in §A.4**: auth (`A.4.1`),
   job feed (`A.4.2`), dashboard — **3 cards below `md`, 6 at `md`, 8 at `xl`**
   (`A.4.3`), templates picker replacing both `Loader2`s
   (`template-picker.tsx:126`, `template-selection-modal.tsx:132`) (`A.4.4`),
   **editor** (`A.4.5`, desktop = the real 290/flex/280 panes from
   `cv-editor-client.tsx:3068,3118,3184`; mobile = preview pane + the real 56px
   tri-tab bar), assistant transcript bubbles + real composer (`A.4.6`), settings
   field rows (`A.4.7`), public CV keep + toolbar + shimmer (`A.4.8`),
   applications/drawer (`A.4.9`), studio/snap/import/interview/voice (`A.4.10`).
5. **Marketing routes keep the bar and get NO skeleton** except `/jobs`
   (it is `force-dynamic`, `app/[locale]/(marketing)/jobs/page.tsx:26,44-50`) —
   §A.4.11. Prerendered routes arrive in <1s (measured, doc §C.5); a skeleton
   there would flash.
6. **The two timing gates** (§A.6): `minVisibleMs=300` so a fast route never
   flashes a skeleton, `holdMs=220` so a shown skeleton is never a one-frame
   flash, and one line of real text + retry after 8s.
7. **Accessibility:** skeleton shapes `aria-hidden="true"`, one `role="status"`
   + Swahili label per group (not 40 announcements). Reduced motion collapses,
   never removes (`app/globals.css:203-208` already does this — verify it covers
   the new keyframes).

**Acceptance:** at ~400 kbps / 400 ms RTT, screenshot each of the 12 surfaces at
0.5 s / 1.5 s / 3 s — **no screenshot may show an empty content region**, and
each must be recognisable as that screen. CLS = 0 on `/dashboard`, `/jobs`,
`/cv/[slug]` at 390×844 and 1440×900. Report the screenshots.

#### 0.7.2. Page and view transitions (doc §B)

- `apps/web/app/(app)/(dashboard)/template.tsx:7` and
  `apps/web/app/[locale]/template.tsx:8` currently apply the same `.route-enter`
  to every navigation in the subtree — forward, back and lateral are visually
  identical. Add direction: new `lib/nav-direction.ts` (path-depth comparison
  plus a `popstate`/`router.back()` signal), and the three cases in §B.2 Rule 1
  (deeper = 6px rise; back = reverse, 140ms; lateral tab switch = cross-fade
  only, 220ms, no position change).
- The pane animation must **not** wrap the scroll container (§B.2 Rule 5) — wrap
  an inner element, so a restored scroll position is not animated.
- **Nothing may depend on the View Transition API alone** (MDN: cross-document
  transitions "have historically been impossible", and co-present old/new content
  causes "loss of reading position, focus confusion, and strange live region
  announcement behavior" — doc §B.2). Ship the CSS-class fallback first; add
  `view-transition-name` as an enhancement only.
- **Zero `framer-motion` `AnimatePresence` around a route**: CSS animation on a
  mounted node is interruptible by construction; a queued exit is not.
- `components/ui/route-progress.tsx:14` is `role="status" aria-live="polite"`
  (correct) but its 2px bar is `position: fixed; top: 0` — it must not sit under
  the sticky header; render it inside the content shell with
  `top: 0` of the shell, or offset by `var(--safe-t)`.

#### 0.7.3. The template picker → editor entry (doc §B.2 Rule 4)

The strongest affordance in the product (a page-shaped thumbnail) leads to the
emptiest response (a bar over a blank screen). Make it origin-aware: the tapped
thumbnail and the editor's new A4-shaped skeleton **occupy the same box**, so the
page travels from thumbnail size to page size, then the real canvas
`.swap-in`s over the skeleton. Reduced motion: replaced in place, no scale.
Files: `components/editor/template-picker.tsx`,
`components/editor/template-selection-modal.tsx`,
`app/(app)/(dashboard)/editor/loading.tsx`,
`app/(app)/(dashboard)/editor/cv/[id]/page.tsx:44-45`.

#### 0.7.4. Two environments, not one stretched layout (doc §D)

1. **Breakpoint rules bind:** `md` 768 / `lg` 1024 / `xl` 1280 / **`2xl` 1536
   (currently 0 uses app-wide)**; no ad-hoc media queries; no `max-sm:`/`max-md:`;
   layout changes only at those rungs (doc §D.1).
2. **Fix the landscape-phone zoom bug:** `app/globals.css:262` keys the 16px
   input rule off `max-width: 767px`, so a phone in landscape (844×390) still
   zooms on focus (css-tricks, doc §C.1.4). Re-key it to
   `(hover: none) and (pointer: coarse)`.
3. **`h-screen`/`100vh` → `dvh`** on anything that fills the visual viewport
   (41 occurrences; `dvh` is already used 18 times, e.g.
   `cv-editor-client.tsx:893`). `min-h-screen` on the page wrapper → `min-h-dvh`.
4. **Safe-area tokens:** add `--safe-t/-b/-l/-r`, `--tabbar-h: 56px`,
   `--tabbar` to `app/globals.css`; replace the magic `pb-28`
   (`app/(app)/cv/[slug]/loading.tsx:7`) and the repeated raw `env()` calls.
5. **Mobile-web navigation (doc §D.4):** keep the five-slot bottom bar
   (`components/dashboard/mobile-tab-bar.tsx:26-66`); give the **marketing routes
   a 3-slot bottom bar** (today they have only a top-right hamburger,
   `components/ui/marketing-nav.tsx:151` — the least reachable corner for the 49%
   who use one hand); bump every tab to `min-height: 48px` (the create pill at
   `:156` is a 36px `h-9 w-9` span); make the editor's own 56px tri-tab bar
   (`cv-editor-client.tsx:3692`) visually consistent with the main bar instead of
   being a second navigation language.
6. **Desktop IA (doc §D.3):** the editor keeps three panes and gains a `2xl`
   width; the templates picker gets a persistent family rail (today the family
   chips scroll the grid off screen); the dashboard goes 5–6 up at `2xl`; the job
   feed gets list + detail at `2xl`; the assistant gets a context rail at `lg:`
   (the data is already assembled server-side,
   `app/(app)/assistant/page.tsx:52-56`). **Settings, auth, the public CV and
   marketing copy stay centred — they do not earn width.**
7. **Hover is a capability, not a default (doc §D.5):** 692 `hover:` uses vs 59
   `focus-visible:` in `apps/web`. Any state that is *only* available on hover is
   a defect; wrap desktop-only flourishes in
   `@media (hover: hover) and (pointer: fine)` and give every interactive element
   a `:focus-visible` ring (WCAG 2.4.11, doc §C.2.2).
8. **`<= 11px` text is below the floor** — `mobile-tab-bar.tsx:180` and
   `shared-profile-panel.tsx:142` are 10px (Apple's minimum is 11pt, doc §C.1.2/§D.7).

#### 0.7.5. The gaps the audit found (doc §E)

- **Empty states:** `components/ui/empty-state.tsx` is used in only two places;
  every grid's empty case is ad-hoc or absent, and its action button has no
  `focus-visible` (`:24`). Make it the only empty treatment (4 variants) and let
  it arrive with `.swap-in` like content.
- **Error states are English.** `app/global-error.tsx` is a bare inline-styled
  page (`#fff`, `100vh`, `lang="en"`, "Something went wrong") in a
  **Swahili-first** product; `app/[locale]/error.tsx:33` picks its language with
  `document.cookie.includes("lang=sw")` — a substring test that works by luck.
  Give both the same two-environment treatment (short thumb-reachable retry on
  mobile; digest visible/copyable at `md:+`) and real Swahili.
- **Forms:** 14 `<form>` / 90 `<label>` but only **2** `aria-invalid`/
  `aria-describedby` combined, and **no `inputmode` anywhere** — the phone
  keyboard is wrong for every numeric field in the editor (doc §C.1.4, §E.1).
  Add `inputmode` (`tel`, `email`, `numeric`, `url`), `enterkeyhint`, and
  programmatic error association; two-column field rows at `md:`.
- **Modals:** 25 `fixed inset-0` surfaces, only 7 files with `aria-modal`, and
  **zero** focus traps. Build one `<Sheet>` (below `md`) + one `<Dialog>`
  (`md:+`) with focus trap, `role="dialog"`, `aria-labelledby`, Escape, scroll
  lock (`lib/hooks/use-body-scroll-lock` exists), `max-h-[90dvh]`.
- **Admin tables:** `app/(app)/admin/page.tsx:78` has no overflow wrapper while
  `admin/users/page.tsx:47,51` does — build one `<DataTable>` (table at `md:`,
  labelled cards below) and use it everywhere.
- **The editor canvas on a phone is unreadable** (doc §E.2): an A4 page designed
  at 794px scaled into ~350px renders 12px CV text at ~5px. Ship a
  read-at-full-size mode + guaranteed pinch-zoom (`touch-action` is undeclared —
  0 occurrences app-wide). This is the biggest non-skeleton mobile defect.
- **Print:** 0 `print:` rules app-wide; `Ctrl+P` prints the app chrome. Add
  `@media print` to the public CV and the editor preview (sheet only, A4
  794×1123).
- **Multi-tab:** silent last-writer-wins. `BroadcastChannel` notice, as a small
  item, not now.

#### 0.7.6. Numbers to pin, and how this is verified

- Put the breakpoint/target numbers behind a test the way motion is pinned
  (extend `apps/web/lib/ui-tokens.test.ts`, the existing home for token tests —
  do not add a parallel file): breakpoints, `--tabbar-h`, 44px target minimum,
  11px text minimum, `minVisibleMs=300` / `holdMs=220`.
- Verification gates are listed in full in doc §F.1 (screenshots at 360/414/640/
  768/1024/1280/1536/1920/2560 with no horizontal page scroll; the two-frame
  interpolation test; CLS = 0; a 44×44 hit-box sweep at 390×844; keyboard-only
  pass; 200% zoom at 360px; print).
- **Do not change any number in `docs/MOTION-STANDARD-2026-09-20.md`** — the
  timings reused here (140/220/300ms) are that standard's existing tokens
  (`dur.fast`/`dur.base`/`dur.slow`), and they are mirrored in
  `apps/native/src/components/ui/motion.tsx` + `apps/web/lib/motion.ts` and
  pinned by tests. Reuse, do not redefine.

### 0.8. PROFILE PHOTO WITH CAMERA, GUIDES, AND AI ADJUSTMENT — all versions
**User's words:** *"thought a take profile picture and AI adjust so camera and guides for a good profile photo feature research and add to list for all versions"*

A CV photo is already supported (§2 / commit `12f2d9f`) but the user cannot take a GOOD one.
Build the guided capture path:
- **Camera capture inside the product** — web (getUserMedia) and native (the Expo camera
  module already in the app), not "upload from gallery" as the only route.
- **Live guides while framing**: a face-position oval, a distance/head-size guide, lighting
  feedback (too dark / backlit), a straighten cue, and a plain-language tip in Swahili.
  Guides must be helpful, never blocking.
- **AI adjustment after capture**: background normalisation, exposure and white balance,
  a straightening/crop that respects the guide, and a professional finish - with the
  original always preserved and every adjustment discardable. Also a plain-language
  explanation of what was changed, because silently editing someone's face is unacceptable.
- **Research first**: what the world does (LinkedIn photo guidance, Canva/Photoroom-style
  cleanup, passport/visa photo tools' guides), with cited sources; what is appropriate for a
  Tanzanian jobseeker; and what the Gulf market expects (the photo is expected there).
- **Cover ALL versions**: mobile web, desktop web, and the native app.
- **Constraints**: it must work on a cheap phone front camera, offline-first where possible,
  and must not upload a raw multi-MB image (follow `lib/photo-upload.ts`: the 12 MB source
  cap, 600px square, JPEG q0.82, 400 KB ceiling already exist).

**Research done, spec written: `docs/PHOTO-CAPTURE-SPEC-2026-09-20.md`** — read it before starting; it
carries the citations (LinkedIn, US/UK passport rules, Bayt/GCC, the PSRS "must upload recent Passport
Size Photo" condition), the exact thresholds, the cost table, and the cultural do-not list. The items
below are ready to execute with no further research.

#### 0.8.1 — Shared guide logic + thresholds (do this first, everything imports it)
- **Build**: `packages/utils/src/photo-guides.ts` exporting `FaceBox`, `FrameStats`, `GuideHint`,
  `evaluateGuides()` and the `PHOTO_GUIDE_TOLERANCES` constants; add `"./photo-guides"` to the
  `exports` map in `packages/utils/package.json` and re-export from `packages/utils/src/index.ts`.
  Pure, DOM-free, zero dependencies — same contract style as `packages/utils/src/cv-shape.ts`.
- **Constants (copy verbatim from spec §2.3)**: `LUMA_MIN 80 / LUMA_MAX 185 / HARD_DARK 60 /
  HARD_BRIGHT 210`; `BACKLIT_DELTA 55`; `SIDE_LIT_DELTA 40`; `FACE_H_MIN 0.35 / FACE_H_MAX 0.68`;
  `FACE_W_MIN 0.25 / FACE_W_MAX 0.60`; `EDGE_MARGIN 0.04`; `CENTRE_X_TOL 0.08`; `EYE_LINE_Y 0.30–0.48`;
  `ROLL_OK 5° / ROLL_WARN 10°`; `YAW_MAX 0.20`; `DEVICE_ROLL_OK 3°`; `BG_VARIANCE_MAX 45`.
- **Hint priority** (one hint per tick, first match wins): `no_face` → too dark/bright → `backlit`
  → `side_lit` → `too_far`/`too_close` → edge margin → `off_centre` → `not_frontal` → `tilted` →
  `phone_tilted` → busy background → `ok`.
- **Hard rule**: `face === null` returns severity `"tip"` and **never** a block, warning score, or
  disabled shutter (NIST FRVT demographic-differential evidence; spec §2.3 bias rule). No skin-tone
  heuristic anywhere.
- **Tests**: `apps/web/lib/photo-guides.test.ts` (table-driven, one case per hint code) +
  `apps/native/src/lib/photo-guides.test.ts` (thin import check, mirroring how `cv-shape` is tested
  from both apps).
- **Acceptance**: `cd apps/web && npx vitest run lib/photo-guides.test.ts` green;
  `cd apps/native && npx jest src/lib/photo-guides.test.ts` green; `npx tsc --noEmit` clean in both.

#### 0.8.2 — Web capture sheet (mobile web + webcam), on-device guides
- **Build**: `apps/web/components/editor/photo-capture-dialog.tsx` — a modal with a visible
  `<video muted playsInline autoPlay>`, the overlay from spec §2.1, one Swahili hint line, torch
  toggle (via `track.applyConstraints({ advanced: [{ torch: true }] })` when supported, hidden
  otherwise), shutter, "Piga tena", "Tumia picha hii", and a permanent "Chagua picha iliyopo"
  fallback that opens the existing file input.
- **Capture**: `canvas.drawImage(video, …)` → `toBlob("image/jpeg", 0.9)`. **Never** call
  `ImageCapture` — caniuse has it unsupported on iOS Safari today; the canvas path works everywhere.
- **Detection tiers**: (1) `'FaceDetector' in window` → native shape detection; (2) else lazy-load
  MediaPipe Tasks Vision BlazeFace short-range (224 KB measured) **only when the sheet opens**;
  (3) else degraded mode = oval + luma/variance maths only, which needs no model at all. Degraded
  mode must be genuinely usable, not an error state.
- **Measurement**: 64×64 sampling canvas every 250 ms, luma `0.2126R+0.7152G+0.0722B`, feeding
  `evaluateGuides()`. Feature-detect `navigator.mediaDevices?.getUserMedia` and fall through to the
  file input when absent (secure context is a hard requirement of the API).
- **Acceptance**: `cd apps/web && npx vitest run lib/photo-capture-hints.test.ts` (hint-mapping
  logic) green; manual matrix in spec §5 (dark room, backlit window, too far, tilted phone, iOS
  Safari stream renders and captures) recorded with screenshots.

#### 0.8.3 — Extend the existing pipeline, do not fork it
- **Build**: in `apps/web/lib/photo-upload.ts` add `computeGuidedSquareCrop(srcW, srcH, faceBox|null,
  target)` — identical output to `computeSquareCrop` when `faceBox` is `null` (so existing tests are
  untouched) and face-anchored otherwise; and an optional `adjustments?: AdjustmentPlan` parameter on
  `downscalePhotoFile()` applied to the **same canvas** between decode and encode.
- **Invariants that must still hold**: 12 MB source cap, EXIF-aware decode, 600px square, q0.82 with
  stepped fallback, ≤400 KB stored data URL, `isImageDataUrl()` still true for the returned value.
- **Acceptance**: `npx vitest run lib/photo-upload.test.ts` green **unmodified**; new cases: face box
  present → crop shifts toward the face; face box null → byte-identical output to today for the same
  input fixture.

#### 0.8.4 — On-device adjustments (web), all discardable, all explained
- **Build**: `packages/utils/src/photo-adjust.ts` — pure `computeAdjustments(stats)` returning
  `{ rotateDeg, cropRect, gamma, channelGains, reasons[] }`; apply it in the capture flow's canvas
  step. Toggles in the sheet's post-capture view, each with its Swahili line from spec §3.5.
- **Clamps**: straighten ≤±6°; exposure ≤±0.5 stop equivalent; WB channel gains ≤±12% and attenuated
  toward 1.0 by the skin-pixel share so skin is never neutralised; background matte via the MediaPipe
  selfie segmenter (244 KB measured) loaded **only** when the user taps "Badilisha mandhari ya nyuma".
- **Banned (enforce in code review)**: any face retouch — smoothing, whitening, slimming, skin-tone
  shift — and any pixel write inside the face box other than the clamped global transform.
- **Hard rules**: original bytes retained for the session; `Rudisha kama ilivyokuwa` restores it;
  every change individually discardable; the identity-document warning line always visible
  (`Kwa picha ya paspoti, visa, au maombi ya Ajira Portal — tumia picha ya awali bila marekebisho.`).
- **Acceptance**: unit tests for the clamps and the "no face-box pixel writes" invariant; a recorded
  session showing the original restored after undo, and each toggle's Swahili explanation on screen.

#### 0.8.5 — Native capture screen (Phase 1 now, Phase 2 gated on a compatibility check)
- **Phase 1 (no new native dependency)**: new screen using the existing `expo-camera ^57.0.4`
  (`CameraView`, `useCameraPermissions`, `enableTorch`, `takePictureAsync({ quality: 0.85 })` — the
  `apps/native/src/screens/app/scan-screen.tsx:5,20,28-42,125` pattern) with `facing="front"`, the
  in-app overlay from spec §2.1, torch button, and the instructional tips. Guides are instructional
  only: `expo-camera`'s `CameraView` exposes no face boxes or pixel access in this SDK and
  `expo-face-detector` is deprecated/removed (Expo FYI `face-detector-removed.md`).
- **Phase 2 (do not start until the check passes)**: first verify `react-native-vision-camera` +
  an ML Kit / BlazeFace frame processor against **RN 0.86.3 / Expo SDK 57** on a real device. If it
  lines up, run detection in a frame processor on-device (offline, free, bundled 224 KB model) and
  feed the **same** `evaluateGuides()` from `packages/utils`. If it does not line up, stop at Phase 1
  on native and ship measurement on web only — do not force a broken native module.
- **Acceptance**: `cd apps/native && npx tsc --noEmit && npx jest` clean; APK smoke test on a real
  Android phone: capture in dark room → torch hint; too far → distance hint; overlay and hint line
  legible on a small screen at 320 px width.

#### 0.8.6 — Desktop web: check the file the user already has
- **Build**: keep the existing file input as the primary desktop route
  (`cv-editor-client.tsx:2070-2099`); add a secondary "Tumia kamera ya kompyuta" button that opens the
  0.8.2 sheet. After `validatePhotoFile()` and after decode, measure the same `FrameStats` on a
  downscaled copy of the picked image and show the guidance as a **report, never a gate** (e.g.
  `Uso ni mdogo kwenye picha. Picha itakatwa kuzunguka uso wako.`).
- **Acceptance**: picking a deliberately bad photo (tiny face) shows the report, still saves, and the
  guided crop centres on the face; `npx vitest run lib/photo-upload.test.ts` still green.

#### 0.8.7 — Optional, consented AI critique via `deepseek-flash` Vision
- **Build**: a Next.js API route that posts the **already-processed 600px / ≤400 KB** JPEG to
  `https://api.deepseek.com/chat/completions` with `model: "deepseek-flash"` and an OpenAI-compatible
  `content` array containing a `{"type":"image_url","image_url":{"url":"data:image/jpeg;base64,…"}}`
  part, `jsonMode: true` for a structured verdict. Route it through the existing
  `apps/web/lib/api/ai-provider.ts` so provider fallback and timeouts are unchanged.
- **What it is for and what it is not**: it produces the *critique and the Swahili explanation*; it
  cannot edit an image (no image-output endpoint exists). Never let its prose override a measurement
  the deterministic maths made — the model sees a ~384-token downscale, the maths sees the frame.
- **Gating**: opt-in only, **after** the on-device path has finished, with the Swahili consent line
  naming the recipient and the country (PDPA s.23(2) wants notice before collection;
  `docs/ai-memory-disclosure.md` already flags the cross-border transfer). Refusal changes nothing —
  no degradation, no nag.
- **Cost guard**: ≈$0.0002–0.0003 per photo at published rates (384 image tokens + ~250 output
  tokens). Cap it: one call per photo, cached, never on autosave, never in a loop.
- **Acceptance**: a recorded run showing the consent line before the request, the request only after
  consent, a structured response rendered as Swahili guidance, and a clean silent skip when
  `DEEPSEEK_API_KEY` is empty (it is empty in Vercel — this must not 503 the editor).

#### 0.8.8 — One stored photo format across both apps + the Swahili strings
- **Reconcile the divergence**: native compresses to 400 px wide at q0.7
  (`apps/native/src/lib/pick-photo.ts:44-47`) while web stores 600 px square at q0.82
  (`photo-upload.ts:35-39`). Move native to **600 px / q0.82 / same 400 KB ceiling** so both apps
  store the same thing and the `PhotoCircle`/`photoCircle` renderers get the same input.
- **Swahili copy**: add every string from spec §3.5 and §2.3 (guide hints, toggle explanations,
  consent line, identity-document warning) in both docs' agreed register; run the lint tripwires.
- **Acceptance**: `npx vitest run lib/swahili-lint.test.ts` (web) and `cd apps/native && npx jest
  src/lib/swahili-lint.test.ts` green; a native capture and a web capture produce the same
  dimensions and quality; **the owner has approved the Swahili wording in writing** (none of it is
  written by a native speaker — ship as a proposal, per `docs/SWAHILI-STANDARD-2026-09-20.md` §3).

#### 0.8.9 — Privacy surface for photos (PDPA + Play data safety)
- **Build**: extend the existing editor consent note (`cv-editor-client.tsx:2108-2115`) rather than
  duplicating it; state that the photo is stored in the CV, that adjustment happens on the device by
  default, and that the optional AI critique sends the image to DeepSeek outside Tanzania. Update the
  Google Play Data safety declaration to include photos, and the PDPA record of processing.
- **Acceptance**: the note is visible before any off-device send; the Play data-safety form lists
  photo collection with its purpose; no off-device request occurs without consent in the recorded
  run from 0.8.7.

#### 0.8.10 — Verification with evidence (gate on this before calling it done)
- Real cheap Android phone, real iOS Safari: run the matrix in spec §5 and attach screenshots
  (dark-room torch hint, backlit hint, too-far hint, tilt hint, successful capture, undo restoring
  the original). 3G-throttled load must be usable with **zero** model downloads until the user taps
  the background button. Report failures as failures — a green test suite is not a working camera.

### 1. Swahili language programme — HIGHEST PRIORITY
Two native-speaker catches already prove non-native audit fails at first glance:
- **`Mgusiko`** — not a word. `Mguso mmoja, hakuna nywila.` is the intended line.
- **`omba kwa ujanja`** — `ujanja` means street trickery, not cleverness. A job product
  telling Tanzanians to apply "by trickery" is a brand-damaging error.

Claude must complete, from the audit artefacts the agents produced:
- Research real Tanzanian job-market vocabulary (cite URLs; the agent already collected
  ~141 lines of market terms).
- Build the glossary + the **"words to avoid → use instead"** table: `ujanja`, `janja`,
  `mjanja`, `kiburi`, `uchoyo`, `ubabe`, `kupiga chenga`, `chakachua`, and anything else
  whose dictionary gloss is neutral but whose street register is loaded.
- Rewrite every affected string; run `swahili-lint` + `no-ats-jargon` tripwires; keep the
  two SEO `keywords:` arrays that deliberately retain `alama ya ATS` (search intent).
- **Everything ships as a proposal for the user to approve** — not as "correct".

### 2. CV photo support — market access, not decoration
A photo is expected on a Gulf CV, and the Gulf is the stated expansion path. Ground truth:
`native-provider.ts renderDocument` emits **one generic HTML string** — 266 template names
share one renderer — so no template can have a photo slot until the data model and the
renderer both carry one. Claude must: add the field end-to-end (schema → editor upload/
crop/remove → renderer → PDF export), downscale client-side (mobile data), never distort
the aspect ratio, and degrade gracefully when no photo is set. **Correct on the curated 47
beats broken across 266.**

### 3. Motion — "the Apple way", no "boom"
Implement `docs/MOTION-STANDARD-*.md` against the audit's list of booms: screens mounting
with no transition, lists appearing fully formed, modals popping, loading→content snapping.
Tokens for durations/curves/springs/stagger, **origin-aware motion** (comes from the thing
you tapped, returns there), interruptibility, and an explicit list of what must stay
**instant** (typing, taps, scrolling). Respect reduced motion. The
`Reanimated: RetryableMountingLayerException` warnings during splash→screen are a
concrete boom — investigate. **Sized for a low-end Android phone: jank is worse than
instant.**

### 4. Campaign attribution
`?src=poster` arrives and **nothing writes `campaign_event`** — the posters cannot be
measured. Fix the capture, then verify by simulating the visit and showing the row.

### 5. Product direction — retention, and the AI hands-on
Implement from `docs/PRODUCT-DIRECTION-*.md`:
- **"mtu akiingia hatoki"** — the retention loop. The unique asset is that Sumaiya knows
  whether the user got the job (`outcome_report` already exists); competitors cannot copy
  that. Build the loop around the **outcome**, not the tool.
- **AI hands-on** — inline in the editor, generating/reviewing/explaining/nudging, not a
  chat nobody opens. Offline behaviour defined.

### 6. Device QA fixes and market-readiness blockers
Whatever the QA pass found, and the ranked launch blockers from
`docs/MARKET-READINESS-*.md`.

---

## BLOCKED ON THE USER — do not attempt

| Blocker | Why Claude cannot fix it |
|---|---|
| `DEEPSEEK_API_KEY` | Empty in Vercel; only the owner has the value. Fixes all AI 503s and the cron's 503. |
| GitHub Actions billing | Account-level: *"recent account payments have failed"*. Only the owner can clear it. |
| Email OTP sign-in | Supabase dashboard, not code. Known: app wants **exactly 8 digits** (`auth-code.ts`), template needs `{{ .Token }}`. Google sign-in already works. |
| Job feed is empty | The rebuilt database has no jobs seeded. Data, not code. |
| Publishing the APK | Requires a device smoke test of the minified build first. |

## Also outstanding
- **5 commits are local, unpushed** — the upload-limit and Swahili-jargon fixes are not
  live on `sumaiya.app` until they are pushed.
- **The minified APK (43.45 MiB, down from 51.47) is unverified on a device** — R8 can
  strip reflection-only code. Sign-in is the sharpest smoke test.
- **Own idea still unanswered:** the app cannot be distributed — Tanzanians share files
  phone-to-phone (WhatsApp/Xender), they do not download APKs from websites. A
  "share the app" button turning the APK into a local file transfer costs ~a day and
  costs the receiver zero data. Awaiting the user's go.

---

# QUEUE II — from the unexamined-areas study (`docs/AREAS-AND-PARITY-2026-09-20.md`)

**Two corrections to the notes above, both measured on 2026-09-20:**
- *"5 commits are local, unpushed"* is **stale**. `git ls-remote origin HEAD` and
  `git rev-parse HEAD` both return `28030721b471e16552f6420bb1547c751d54273b`.
- The daily jobs/signals/follow-ups crons live in **`apps/web/vercel.json:18-22`**, not in the
  repo-root `vercel.json`, which has no `crons` key and sets `outputDirectory: apps/web/.next`.
  Whichever Vercel reads decides whether those crons exist (§7 below).

Everything below was measured from the live database, the live site, the device, or the source,
by the committed probe `scripts/live-state-probe.cjs`. Priorities: **P0** before any promotion,
**P1** this week, **P2** next.

---

### 7. SECURITY — ~~the whole database is readable and writable with the public key~~ · VERIFIED FIXED 2026-09-25

> **Verified fixed 2026-09-25, by live probe rather than by reading code.** Read-only catalogue
> queries against production: **RLS is ON for all 33 public tables**, and `{authenticated}`
> owner-scoped policies (`<table>_owner_select|insert|update|delete`) exist on every user-data
> table. Then the decisive test — the **public anon key against the live REST API**:
>
> ```
> READ  cv / profile / user_profile / application / app_event / job / referral_code  → 401 (42501)
> WRITE cv  insert / patch / delete                                                  → 401 (42501)
> a probe insert then checked as service_role → nothing persisted
> ```
>
> The anon key is refused at the **GRANT** layer for both reads and writes. The vulnerability
> described here is closed.
>
> **What is still true, and is the only part worth watching:** the default ACL for the `public`
> schema gives `anon` `arwdDxtm` on tables created by `postgres`, so **a future table is born open
> with RLS off**. `scripts/assert-rls.mjs` (163 lines) exists precisely to catch that, and
> `.github/workflows/rls-guard.yml` wires it up — but **CI cannot run at all** while GitHub reports
> failed account payments. Until billing is restored the guard is a script, not a guard.
> `npm run assert:rls` runs it by hand in the meantime.

**Measured, not inferred:**
```
public tables 33 · RLS on 0 · RLS off 33
anon grants: DELETE=33 INSERT=33 REFERENCES=33 SELECT=33 TRIGGER=33 TRUNCATE=33 UPDATE=33
default ACL for new tables: {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,...}
$ curl -s -o /dev/null -w "%{http_code}" "$URL/rest/v1/profile?select=*&limit=1" -H "apikey: <public anon key>"
profile / cv / application / device_token / job / ai_usage → 200 (all six)
```
`NEXT_PUBLIC_SUPABASE_ANON_KEY` ships in the browser bundle **by design** — `ci.yml:22-23` says so
in a comment. So anyone who reads the bundle can read every table and, because INSERT/UPDATE/
DELETE/TRUNCATE are granted to `anon` on all 33 (and to future tables via the default ACL), can
alter or wipe them. The app never notices because all product reads/writes go through Drizzle as
`postgres`, which bypasses RLS.

**Build:**
1. **Revoke (preferred — the app does not use PostgREST for `public` data):**
   `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`
   `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`
   The only two PostgREST data routes are dead code — `app/api/applications/list/route.ts` and
   `app/api/jobs/[id]/apply/route.ts` (they target a non-existent `applications` table; nothing
   calls them). Delete them in the same change so nobody re-adds the grant "to fix" them.
2. **Or enable RLS** on all 33 tables with per-table policies, if PostgREST is ever needed.
3. **CI guard so it cannot silently return:** `scripts/assert-rls.mjs` (or a vitest file) that runs
   `select relname, relrowsecurity from pg_class …` **and** the `anon` grant query above, and fails
   if any public table has RLS off while `anon` holds a privilege. Wire it into `.github/workflows/ci.yml`
   and into `scripts/verify-all.sh`. This is the check that belongs next to the release invariants.
4. **Extend the health endpoint** (`app/api/health`) to prove it in production: it returns
   `{"ok":true,"db":"connected"}` today; add a `security: {anonCanReadProtectedTable: false}` probe.

**Acceptance test:** the probe prints `RLS off 0` + `anon grants: (none)`, every table still
returns its expected count through the app (sign in on the web, open a CV), and the CI guard fails
if you manually `GRANT SELECT ON public.cv TO anon`.

### 8. THE PDF HAS NO TEXT LAYER — the web export is not ATS-parsable · P0 (assert) / P1 (fix)

`lib/pdf.ts:166-280` rasterizes the DOM with html2canvas and embeds **JPEG** pages in jsPDF, so the
exported CV is an image: no text layer, nothing for a parser to read — the one mechanism the
product is sold on in English. Native uses `expo-print` (WebView print → real text), so the same
template produces two structurally different files. No test anywhere extracts text from a PDF.

**Build:**
1. **Assert first (½ day), so the claim is decided by a command not an opinion:** a test that renders
   the guest CV, exports the PDF, runs `pdfjs-dist` text extraction (already a dependency; the
   server pattern exists in `lib/api/routes/tools.ts` `POST /tools/extract-text`) and asserts the
   CV's name + job title appear. It will fail on web today — that is the point.
2. **Then fix, cheapest-first:** (a) overlay a real text layer on the raster (a "sandwich" PDF via
   `pdf-lib` — invisible but extractable, no template work), or (b) generate the PDF from structured
   data with `pdf-lib` text primitives, or (c) print HTML through headless Chromium
   (`@sparticuz/chromium` + `puppeteer-core` on Vercel). (a) is the smallest change that makes the
   artifact parseable; (c) is the one that also fixes print fidelity.
3. **Print-correctness:** there is **no** `@media print` / `@page` rule anywhere in `apps/web`
   (`grep` → 0 matches), so Ctrl-P prints an unstyled page. Add a print stylesheet for the CV
   preview routes.
4. **Do not build any of this on `lib/templates/native-provider.ts`** — its `renderDocument()`
   emits one generic string for all 266 template ids (`docs/FEATURE-INVENTORY.md:203-209`).

**Acceptance test:** `node -e` / test extracts text from a generated PDF and finds `"<name>"`;
the same test passes for a native-exported PDF pulled off the phone; the fix is recorded in
`docs/CV_DESIGN_AUDIT.md` or a new entry here with the before/after extraction output.

### 9. SUPPORT GOES TO ANOTHER COMPANY'S DOMAIN · P0

Both surfaces send users for help to **`support@templatehub.pro`** — the parked product
(`docs/DECISIONS.md` D3) — for help with Sumaiya: `apps/native/src/lib/app-hosts.ts:53`,
`apps/web/app/[locale]/(marketing)/contact/page.tsx:26`. The guard test asserts only
`expect(SUPPORT_EMAIL.startsWith("support@")).toBe(true)`
(`apps/native/src/__tests__/app-hosts.test.ts:64`), so it stays green over the wrong domain.

**Build:**
1. Decide the real address (e.g. `msaada@sumaiya.app` / `support@sumaiya.app`) and create it.
2. Change both call sites to one exported constant; **assert its identity** —
   `expect(SUPPORT_EMAIL).toBe("support@sumaiya.app")` — not its shape. Add the same assertion for
   the web copy so the two cannot diverge (this is the §2.4 rule in practice).
3. Put the address on the paths users actually hit when something breaks: the sign-in error state,
   the editor's export-failure toast, and settings ("Wasiliana nasi").
4. Add a "report a problem" action that prefills app version + device + the request id from §12, and
   keep the FAQ (`help-faq-screen.tsx`) as the first stop.
5. WhatsApp remains the channel this market uses; the worker exists (`apps/whatsapp/`) but is
   health-only without Meta provisioning — note it as an owner task rather than rebuilding it.

**Acceptance test:** `grep -rn "templatehub" apps/web/app apps/native/src` returns nothing outside
deliberate history notes; both tests assert the literal address; a mailto from the phone opens a
composer addressed to the new domain.

### 10. THE EMAIL OTP IS 8 DIGITS ON THE PHONE AND 6 ON THE WEB · P0

`apps/native/src/lib/auth-code.ts:3` → `export const EMAIL_OTP_DIGITS = 8;` (with a comment saying
Supabase production is configured for 8). `apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx:257,259`
→ `maxLength={6}` and `.replace(/\D/g,"").slice(0, 6)`. One Supabase project, two expectations; the
web form silently accepts 6 digits and fails verification, or blocks the 8th keystroke.

**Build:**
1. Confirm the truth on the project (Supabase → Auth → Email templates must contain `{{ .Token }}`,
   and the token length is a project setting) — do not guess, read it.
2. Move the constant into `packages/core` (`IDENTITY.EMAIL_OTP_DIGITS`) and have **both** apps
   import it; delete the web literals.
3. Add the **configuration contract test** from §2.4: one test asserting the deployed setting
   equals the constant, so a dashboard change fails a build instead of a user.
4. While in there: the same file's web `emailCode` path signs in with
   `verifyOtp({ email, token, type: "email" })` (`lib/auth-client.ts:29-45`) — make sure the message
   copy tells the user the length from the constant, in both languages.

**Acceptance test:** a real code from a real email is accepted on the web **and** in the app; the
test that asserts length identity fails if you change one side only.

### 11. JOB FEED: EMPTY IN PRODUCTION, AND NOBODY CAN TELL WHY · ~~P0~~ VERIFIED FIXED (2026-09-24)

> **Verified fixed 2026-09-24** by live probe, before anyone spent a session on it:
> `GET https://sumaiya.app/api/jobs?limit=3` returns `{"success":true,"data":[…]}` with real
> listings (HV Electrician · Barrick · Tanzania), and the database holds **1,874** jobs with the
> freshest ingested the same morning. `/api/feed`, `/api/mobile/jobs` and `/api/jobs/feed` are
> 404 — `/api/jobs` is the live path. Left here as history rather than deleted, so the next
> reader can see the symptom was real and the fix was never recorded.

```
$ curl -s https://sumaiya.app/api/jobs      → {"success":true,"data":[]}
live DB: count job = 0 · newest job = null
```
The cron is declared (`apps/web/vercel.json:19`, `0 6 * * *`) and 14 adapters exist, but "has never
run", "ran and found nothing" and "failed silently" are indistinguishable. Sources that need keys
(Adzuna, Jooble, Careerjet, Talent, USAJobs) are skipped silently. And a **dead mock still ships**:
`app/api/jobs/feed/route.ts` returns 8 hardcoded jobs (Kilimanjaro Retail, Jangwani Telecom) and has
zero references.

**Build:**
1. Delete `apps/web/app/api/jobs/feed/route.ts` (verify zero references first — the command is in
   `docs/RESEARCH-2026-09-20.md` Appendix C).
2. Give the cron a **run report**: one row per run (a `job_ingest_run` table or reuse `app_event`)
   with `started_at, finished_at, per_source: [{source, fetched, accepted, rejected, skipped_reason,
   error}]`. Surface it in `app/(app)/admin/jobs` — live vs skipped counts per source.
3. Log the skipped-reason for every key-gated source instead of `if (!key) continue`.
4. Only then decide about data: the feed needs real listings, and the terms of each board decide
   whether they may be fetched (do not scrape against terms to pad a number).
5. Until the feed has rows, drop `/jobs` from `app/sitemap.ts:29` (it is `priority: 0.8,
   changeFrequency: "weekly"` and currently indexed while empty).

**Acceptance test:** one cron run produces a report row the admin page renders, with at least one
source showing `fetched > 0` or an explicit `skipped_reason`; `curl /api/jobs` returns non-empty
data or the page states honestly that no jobs matched.

### 12. NATIVE: GUEST MODE AND AUTOSAVE · P0

**Guest mode.** Every native screen is behind `!user ? <Auth/>`
(`apps/native/src/navigation/root-navigator.tsx:245`), so the rule "a guest finishes and downloads a
CV before being asked for an account" is honoured on the web (`app/(app)/editor/cv/try/page.tsx`,
live at `https://sumaiya.app/editor/cv/try` → 200) and violated on the surface that is the product.
**Port it, using the web as the reference:** draft stashed locally → export → *then* the account ask →
`lib/migrate-guest-failure.ts` (9 tests) + `app/(app)/migrate-guest/page.tsx` for the conversion step.

**Autosave.** Searching `apps/native/src/screens/cv-editor-screen.tsx` and `src/hooks/use-cvs.ts`
for `autosave|autoSave|debounce|saveDraft` returns **zero** matches — saving is an explicit button
(`:309`) with an unsaved-work guard (`:101-123`). A user who backs out or loses battery loses the
edit; the web autosaves. Reuse `use-offline-sync` + `offlineStorage` (the queue and retry already
exist), debounce into SQLite, and flush on background.

**Acceptance test:** fresh install, airplane mode **on**, build a CV, export it, sign in with Google,
and see the CV in the list — on the phone. Plus: type in the editor, kill the app, reopen, and the
text is still there.

### 13. PARITY: MAKE `@sumaiya/core` REAL, AND STOP THE COPIES · P1

Measured today (`grep -rhoE "@sumaiya/[a-z-]+"` per app):
`@sumaiya/utils` — web 7 / native 26 · `@sumaiya/types` — web **0** / native 32 ·
`@sumaiya/api-client` — web **0** / native 20 · `@sumaiya/core` — **0 everywhere**, despite its own
header declaring it the home for shared non-UI logic. Meanwhile the same feature is implemented
twice: ATS scoring (`lib/ats-score.ts`+`ats-text.ts`+`ats-explain.ts` vs `src/lib/ats.ts`), the
Swahili lint, the OTP digit count, the support address, and **motion tokens created in both apps
today and still untracked**.

**Build:**
1. Move into `packages/core` (with their existing tests): the ATS scoring engine, the Swahili lint
   banned-word table, `IDENTITY.EMAIL_OTP_DIGITS`, the support address, route/status vocabularies,
   and `sanitizeCampaignSource`. Both apps import them; delete the local copies.
2. Move web's document types into `@sumaiya/types`; make web use `@sumaiya/api-client` for its
   browser calls so endpoint paths exist once.
3. Make `apps/web/tailwind.config.ts` **import** `@sumaiya/design-tokens` instead of mirroring it
   (the package's own header admits the mirror is hand-maintained).
4. Land the motion tokens as one shared file rather than two (see the uncommitted work in the tree —
   coordinate, do not overwrite another writer).
5. Add the **import-graph test**: assert both apps resolve a named list of modules from the packages
   and that no file under `apps/*/src/lib` re-implements one. Cheap, and it catches the next copy on
   the day it is written.
6. Put the brief template + the per-surface definition of done from §2.3/§2.6 of the study into
   `CLAUDE.md`, so the next feature starts with the rule instead of learning it again.

**Acceptance test:** `grep -rn "EMAIL_OTP_DIGITS\|support@templatehub" apps/web apps/native` finds
only package imports; the same CV scores identically through both apps' ATS calls; the import-graph
test fails if you paste a copy of `ats-score.ts` into either app.

### 14. GOOGLE SIGN-IN: ONE MECHANISM, THREE TESTS · P1 (this supersedes §0.6's option list)

§0.6 already names the fix (use Google Identity Services in the browser → `signInWithIdToken`, the
shape the working native path uses). What it does not yet say is what stops it recurring:

**Build:**
1. Implement the web path per Supabase's own guide
   ([docs](https://supabase.com/docs/guides/auth/social-login/auth-google) shows GSI →
   `handleSignInWithGoogle(response)` → `signInWithIdToken({provider:'google', token: response.credential})`,
   the same exchange the app already uses), with the nonce when convenient.
2. Extract the exchange to `packages/api-client/src/auth.ts` (`signInWithGoogleIdToken`), so web and
   native call one function; each app keeps only the credential-acquisition file
   (`lib/google-identity.ts`).
3. **Source-graph test:** fail if `signInWithOAuth(` or `signInWithIdToken(` appears outside
   `packages/api-client` — the test that would have caught this on day one.
4. **Per-surface E2E:** Playwright `chromium-desktop` + `chromium-pixel7` (both already configured)
   and the Maestro native flow; each asserts **server state** (a session exists, `/api/user/profile`
   returns the same email), never "we are on /dashboard".
5. Keep the Supabase client secret unset — the point is not to need it.

**Acceptance test:** sign in with Google on desktop web, mobile web and the phone; all three land on
the same account and the profile row has the same email; `grep` shows no second exchange call site.

### 15. OBSERVABILITY: SOMEBODY HAS TO BE TOLD · P1

`lib/observability/report-error.ts:26-41` writes one structured JSON line to the console and stops
there — the docstring admits Vercel function logs are the only destination. Nothing watches them, so
a route that starts 500ing is discovered when a user complains, and there is nowhere to complain
(§9). The AI 503s are honest but uncounted (`lib/api/routes/ai.ts` × 8).

**Build:** (1) a log drain or Sentry server-side — one destination, one alert rule on error rate;
(2) a request id generated per API call, echoed in error responses, shown in the toast and prefilled
into support messages; (3) `/api/health` → deep health (§7 item 4, plus AI-provider presence and the
job-source key report); (4) an admin panel line showing today's error count by scope.

**Acceptance test:** throw a test error on a staging route; it appears in the destination within a
minute with a request id that also appears in the user-visible toast.

### 16. NOTIFICATIONS: PROVE ONE, THEN GIVE A SWITCH · P1

The machinery is real (`lib/push/expo.ts:45-97` chunks, prunes dead tokens; `dispatch-signals.ts`
dedupes on `(user_id, notif_key)`; two crons in `apps/web/vercel.json:20-21`) and the live counters
are all **zero**: `device_token 0`, `web_push_subscription 0`, `signal_notification 0`. So the
registration path (`PUT /api/mobile/device-token`, `lib/api/routes/mobile.ts:583`) is unproven, and
there is **no user-facing opt-out** anywhere (the only match for permissions is a comment in
`src/lib/push.ts:55`).

**Build:** register a token on the device and assert a row appears; fire one signal and assert one
delivery (screenshot); add a notifications preference in settings with a matching server check;
report the daily counts in admin.

**Acceptance test:** `device_token` ≥ 1 after opening the app, a notification arrives on the Pixel
from `/api/cron/signals`, and turning the preference off stops it.

### 17. ARABIC / RTL: DECIDE NOW, PLUMB NOW, TRANSLATE LATER · P1 (decision) / P2

`grep -rn "rtl\|I18nManager\|dir=\"rtl\""` over both apps → **no exact matches**. No direction
plumbing, no logical CSS properties, no Arabic strings or fonts, no RTL template proof. RTL is a
layout direction, not a translation: retrofitting it means touching all 266 templates and every
physical margin in the codebase. The Gulf is the stated expansion and the market is bilingual
(Naukrigulf runs an Arabic jobseeker section; see `docs/RESEARCH-2026-09-20.md` §1c).

**Build:** (1) write the decision with a date — is Arabic in scope before a Gulf employer
relationship exists? (2) If yes, the cheap irreversible-proofing: a `dir` attribute plumbed through
the locale layout, logical CSS properties (`ms-`/`me-`/`ps-`/`pe-` or `margin-inline-start`),
`I18nManager.forceRTL` wired on native, Arabic strings added to the shared catalogue, and **one**
template rendered RTL as a proof; (3) add the Gulf CV fields the research identified as mandatory
(nationality, visa status, availability-to-join) next to the photo that already landed.

**Acceptance test:** `?lang=ar` renders right-to-left with mirrored layout and no clipped text on
one real template, and `npx tsc --noEmit` passes on both apps.

### 18. THE MOBILE-WEB / DESKTOP DEFINITION OF DONE GOES INTO CLAUDE.md · P1

§2.3 (feature brief with numbered requirements + `FORKS`) and §2.6 (per-surface definition of done)
are the parts that stop the next Google sign-in. They are worth nothing in a doc nobody opens at the
start of a feature.

**Build:** add both to the repo `CLAUDE.md` (and `apps/web/CLAUDE.md` if it exists) as the required
shape of a feature PR; add the import-graph test (§13.5) and the RLS guard (§7.3) as named gates in
the "before accepting anything" list at the top of this queue file.

**Acceptance test:** a new feature started after this has a brief with requirement IDs and a PROOF
block per surface.

### 19. THE USER'S OWN DATA: EXPORT, DRAFTS, AND THE TRACKER · P1/P2

No export path exists (`grep export-data|downloadData|exportAll|gdpr` → 0 matches) even though
deletion is thorough (`lib/api/routes/user.ts:65-103` purges 14 tables then the auth user). The web
guest draft is one `localStorage` key, so a second guest CV silently overwrites the first
(`sumaiya-guest-cv`). The native application tracker is local SQLite only (`applications-store.ts`,
`application` table = 0 rows) — change phone, lose the tracker.

**Build:** `GET /api/user/export` returning one JSON of the user's rows + a "Download my data" row in
settings; key guest drafts by id and list them; either sync the tracker to the server or stop
describing it as durable.

**Acceptance test:** the export downloads and contains the CV the user made; two guest CVs both
survive; a tracker entry made on the phone appears on the web (once synced).

### 20. PERFORMANCE: MEASURE, THEN CUT · P1 (measure) / P2 (cut)

Dynamic imports are used for the heavy libraries (`lib/pdf.ts:167-170`), and repeat visits are cheap
because the SW stale-while-revalidates statics (`public/sw.js:97-110`). The gaps: **no production
bundle measurement**, **no export timing**, **no virtualization** (`jobs-feed.tsx:318-329` maps every
job; native slices to 40 at `jobs-screen.tsx:185`; `applications-screen.tsx:74` maps the tracker;
the only `FlatList` is the template gallery), and **no image pipeline** (`next/image` imported by 0
files, 6 raw `<img>`, campaign posters served raw at 256–364 KB each, `pdf.worker.min.mjs` 1.4 MB).

**Build:** record `next build`'s First Load JS per route in the repo (a committed table); add
`performance.now()` around the rasterize and report it as an event property; virtualize the three
long lists; pre-encode AVIF/WebP at two widths for the poster/marketing images and use `next/image`
or explicit `srcset`.

**Acceptance test:** a committed table of First Load JS per route with a before/after, and an export
duration visible in `app_event` from the phone.

### 21. FIRST-RUN ON THE WEB, AND THE ACTIVATION NUMBER · P2

Native first-run is genuinely well built and instrumented — 8 steps with
`firstrun.start` / `firstrun.step` and `prev_seconds`, no PII
(`apps/native/src/screens/first-run-screen.tsx:45,146-147,169-178`). The web has no equivalent: a
search visitor lands on a marketing page with no guided route to the guest editor, and with **0 CVs
in the database** there is no evidence anyone has ever finished the journey.

**Build:** define the aha-moment ("a CV they can send") and one event for it; mirror the native
wizard's shape in 3–5 web steps that end at a downloaded CV; put the number in admin next to the
guest→export conversion.

**Acceptance test:** a fresh browser session reaches a downloaded CV through the guided path, and the
event lands in `app_event`.

### 22. MONETIZATION: WRITE THE BOUNDARY, MEASURE THE WALL · P2

`PAYMENTS_ENABLED = false` (`lib/features.ts:8`), `/pricing` and `/checkout` 307 home
(`next.config.mjs:59-60`), and `cv-editor-client.tsx:975-976` shadows the `isPremium` prop with
`const isPremium = true`, which makes the upgrade modal dead code. No TZS price exists anywhere;
nothing records a user *trying* a premium template, so the one number that would price the product
is not collected. The market already pays on mobile money — Careergo TZS 600/hour, SwiftKazi
KES 20/CV ([careergo.co/tz](https://careergo.co/tz), [swiftkazi.co.ke](https://swiftkazi.co.ke/)).

**Build:** write down what is paid (Gulf pack? extra templates? AI volume?) and what is never paid
(the guest's first CV and its download); instrument the attempt honestly — log it, allow it, no dark
patterns; keep the rail as a plan until there is a receiving account.

**Acceptance test:** a document with the boundary, and a premium-template attempt visible in
analytics without the user being blocked.

