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
