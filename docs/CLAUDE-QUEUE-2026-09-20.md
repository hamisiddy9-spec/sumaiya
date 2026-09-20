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

### 0.6. GOOGLE SIGN-IN ON THE WEB — still broken, reproduced
`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}`

The two clients use **different** code paths:
- **web** `apps/web/lib/auth-client.ts:49` → `supabase.auth.signInWithOAuth({provider:"google"})`
  → goes **through Supabase** → needs the **Supabase Google CLIENT SECRET**, which is unset.
- **native** `apps/native/src/contexts/auth-context.tsx:15` → `@react-native-google-signin`
  → talks to **Google directly**, gets an ID token, hands it to Supabase → **needs no secret**.
  That is why sign-in worked on the phone and fails on the web.

Two possible fixes, in order of cost:
1. **Paste the client secret** into Supabase → Auth → Providers → Google (owner action; the
   page and the Google Cloud credentials page for project `811013224847` are already open
   in the phone's Chrome).
2. **Remove the dependency entirely**: use Google Identity Services in the browser to obtain
   an ID token and call `supabase.auth.signInWithIdToken({provider:"google", token})` — the
   same shape the working native path already uses. **Claude can build this; it does not
   need the secret at all.** Prefer this: it makes web and native use one mechanism.

Redirect URI that must exist in Google Cloud (verified: the Supabase callback returns 303):
`https://duywnmibgiqulqzunsmh.supabase.co/auth/v1/callback`

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
