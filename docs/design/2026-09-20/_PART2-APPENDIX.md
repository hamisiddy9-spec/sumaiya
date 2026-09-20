
---

# PART II — added after the owner looked at the first draft

Three items arrived from the owner, and one of them was found by looking at pixels rather than code.
Two corrections to Part I were also forced by the live device; both are flagged where they occur.

---

## 9 · Web navigation — the nav that was never designed

**Rendered in `07-web-nav.html`.**

Every mockup in this proposal up to that point was a phone surface. The web app's navigation was not
redesigned at all, and the owner named it: *"the web nav bar haha we totally forgot about that."*

### 9.1 · The problem, stated as a number

The signed-in web app has **nine destinations**: dashboard, CV editor, jobs, applications, brief,
assistant, interview, learning, settings. A nav that lists all nine is not a nav, it is a menu — and at
a glance a nine-item row cannot be scanned, cannot be translated, and cannot hold an assistant.

### 9.2 · The recommendation

A hard split between **what you do every session** and **what you do sometimes**.

| Position | Content | Why |
| --- | --- | --- |
| 1 | logo (mark + Sumaiya) | the pre-auth bar already does this; the geometry must not change on sign-in |
| 2 | **four primaries: Nyumbani · CV · Ajira · Maombi** | the four verbs of the product: see the state, write the document, find the opening, track it |
| 3 | the assistant, as a **pill** | on desktop the assistant is a destination *and* a mode; a pill separates it from the four peers without spending a fifth slot |
| 4 | **Zaidi** | the long tail, still **named** — never a bare icon |
| 5 | account avatar | "who am I signed in as" is not a finding-a-destination task, so it never collapses |

**Where the current route reads from:** `usePathname()` prefix match. The active item changes **weight**
*and* gets a `sand-2` fill, so the state survives greyscale and a sunlit screen. **Ember is deliberately
not the nav colour** — it measures 3.89:1 on cream (§1.2) and a nav label is 13.5 px.

**Signed out:** three destinations (Miundo · Ukaguzi wa CV · Ajira) and one verb (Anza bure), no account
menu, no assistant pill. This is the marketing nav's job and it keeps it
(`marketing-nav.tsx`); the signed-in bar must not leak into it.

**Narrow desktop (768–1023 px):** two primaries (**Nyumbani**, **CV**) plus the assistant and **Zaidi**.
Labels drop before objects do. The reason is measurable: Swahili labels are longer than their English
originals (*Nyumbani*, *Mipangilio*, *Mahojiano*), so a four-word bar crowds or wraps earlier here than
it would in English.

**Mobile web (<768 px):** the web already has a phone tab bar (`dashboard/mobile-tab-bar.tsx:81`,
`md:hidden`) — the right idea, but not yet **the same five slots as the APK**. It must be: same labels,
same order, same icons, same active treatment. The user who has both surfaces must not learn two
navigations for one product, which is exactly the drift `AREAS-AND-PARITY-2026-09-20.md` names as the
failure mode. The mobile-web top bar keeps only the logo and the account, so it is not a second nav
competing for the same thumb zone.

### 9.3 · The real APK tab labels (measured, and they corrected this proposal)

Read off the live device's accessibility dump at 1344×2992 / density 408:

> **Nyumbani · CV zangu · Sumaiya · Pakia · Wasifu**

Two corrections to Part I follow from that, and they are in the mockups now:

| Part I said | The device says | Where |
| --- | --- | --- |
| tab label `CV` | **`CV zangu`** | every phone frame |
| quick action `Ukaguzi wa CV` | **`Ukaguzi wa ATS`** | `01-home.html` |

Both are small and both matter: a proposal that renames the user's own tab bar is a proposal that has
not looked at the product.

---

## 10 · One overlay language — the popups are a zoo

**Rendered in `08-overlays.html`.** The owner's words: *"match the pop up boxes accross the platform
like share na sehemu nyingine".*

### 10.1 · Five variants, and only five

| # | Variant | When | Corners | Scrim | Entry / exit | Drag to dismiss |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Bottom sheet** | a choice of 2–6 actions, or a short form | 20 top, 0 bottom | `overlay` | `translateY 360→0` · 220 ms `ease.out` / 160 ms `ease.in` | yes, only under 60% height |
| 2 | **Confirm dialog** | an irreversible or surprising action | 20 all round, max-w 300 | `overlay` | scale `.94→1` + scrim · `spring.gentle` / 140 ms `ease.in` | never |
| 3 | **Toast** | the action already succeeded; nothing to decide | 12 (`input-lg`) | none | 220 ms `ease.out` / 140 ms `ease.in`, dwell 4 s | swipe yes, not drag |
| 4 | **Full-screen sheet** | a task that needs the screen (picking, cropping, reading) | 0 — it *is* the screen | none | slide, 260 ms (`dur.screen`) both ways | never |
| 5 | **Share sheet** | sharing an artefact | 20 top | `overlay` | as variant 1 | as variant 1 |

**Variant 5 differs by platform on purpose.** On the APK it is the OS sheet (`Share.share`) — trusted,
already logged in, and the app must not reimplement it. On the web the app supplies the rows, in the
same order, with **WhatsApp first**: in this market WhatsApp is the connective tissue, so the first row
is the channel the user is already in.

### 10.2 · The shared rules (identical on both platforms)

- **One scrim, from the theme.** `theme.ts:59` (light) is `rgba(33,26,21,.45)`; `theme.ts:84` (dark) is
  `rgba(0,0,0,.6)`. No overlay invents its own, and **none uses pure black**.
- **Three radii, from the token set:** 20 (sheet top, dialog), 12 (toast), 0 (full-screen). The sheet's
  inner rows follow concentrically — a 38 px well inside 16 px padding is 11–12.
- **One stacking order, six levels:** content · sticky/tab bar 40 · toast 60 · sheet 70 · dialog 80 ·
  full-screen 90.
- **Focus:** web traps focus, Escape closes if cancelable, focus returns to the trigger. On the APK the
  hardware back key *is* Escape, and `ui/dialog.tsx:84–86` (`dialog.isOpen()`) already exists for exactly
  this arbitration — it is the reference behaviour.
- **Destructive always gets `haptics.error()`**, and the default focus is the **safe** action, never
  *Futa*.
- **Reduced motion:** every duration collapses to **1 ms, never 0**, drag-to-dismiss is disabled, and in
  exchange **the Close/Ghairi control is always visible**. Nothing here is motion-only.

### 10.3 · The audit — every real overlay

Full table in `08-overlays.html`. The five numbers that are the whole finding:

| Measured | Value |
| --- | --- |
| scrims defined in the theme | **1** (`overlay`) |
| scrims actually used on the web | **6** (`black/40`, `black/50`, `black/60`, `espresso/40`, `espresso/50`, `espresso/60`) |
| of those, pure black instead of the theme's espresso | **3** |
| distinct `z-index` values | **7** (40 · 50 · 60 · 65 · 70 · 80 · 100) |
| native sheet-top radii for the same object | **3** (24 · 22 · 14) |
| spring configs on overlays | **3** (`damping 18`, `20`, and `20/240`) |

The concrete defects, with `file:line`:

- **`chat/attach-sheet.tsx:69`, `chat/attachment-preview-sheet.tsx:92`,
  `chat/job-choice-sheet.tsx:195`, `premium-sheet.tsx:150`** — top radius **24**. **`learning/lesson-sheet.tsx:121`**
  — **22**. **`ui/toast.tsx:133`** and **`ui/list-row.tsx:54`** — **14**, which is not a token.
- **`chat/chat-composer.tsx:30`** — `springify().damping(18)`, which **breaks the motion standard's own
  "damping ≥ 20 everywhere"**.
- **`ui/dialog.tsx:122`** — `damping 20, stiffness 240`, matching neither `spring.gentle` (20/180) nor
  `spring.snappy` (22/260). Everything else about this dialog is the reference implementation.
- **`editor/cv-editor-client.tsx:384`** and **`jobs/targeted-cv-drawer.tsx:240`** use
  **`backdrop-filter` blur** — banned by §7.4, and a full-screen blur is a per-frame full-screen pass.
- **`dashboard/applications-grid.tsx:465`** is an overlay with **no scrim at all**, which at phone width
  reads as a layout bug.
- **`premium-sheet.tsx`** (APK) and **`premium-template-modal.tsx:69`** (web) are the same product moment
  in two different shapes — they must become one object.
- **Already correct, keep:** `components/portal-transition.tsx` (the 340 ms `dur.field` colour-field
  dissolve), `components/connectivity-gate.tsx`, `ui/toast.tsx`'s motion
  (`FadeIn 220` / `FadeOut 140`, `:94–100`), the transparent click-outside backstops that set the z
  floor of 40, and `globals.css`'s reduced-motion net — which **collapses rather than removes**, the same
  contract as 1 ms on native.

**Why it is worth fixing now.** Every one of these overlays is a moment where the user is being asked
something or told something important — a destructive confirm, a share, a paywall. Those are exactly the
moments the app has to read as one object. The fix is mechanical: **one scrim constant, one z-ladder,
three radii, five variants.** No new dependency, no new screen.

---

## 11 · The welcoming path — "different elements stacked together"

**Rendered in `09-welcome.html`.** The owner's words: *"the app onboarding annimations and other
welcomming screen"* and *"they dont match like differente elements stacked togerther"*.

This is a **systems** diagnosis, and the right response is the divergence audit below rather than
redesigning six screens one at a time.

### 11.1 · The audit — what each welcoming screen does differently from its neighbours

| Screen | `file:line` | Entry | Duration | Easing | Origin |
| --- | --- | --- | --- | --- | --- |
| splash mark | `splash-screen.tsx:36` | opacity + scale | **480** | **`back(1.6)`** | **scale, with overshoot** |
| splash word | `:37` | opacity | **420** after 240 delay | `out(cubic)` | fade |
| root mode switch | `nav-config.ts:44–53` | cross-fade | **340** | platform | fade |
| onboarding container | `onboarding-screen.tsx:172` | `FadeIn`/`FadeOut` | **360 / 220** | default | fade |
| onboarding language cards | `:204` | `FadeInDown` | **360**, delay `200+i*80` | default | **rise from below** |
| onboarding art | `:362` | `FadeIn` | **420** | default | fade |
| onboarding collapse | `:318` | `withTiming` on an interpolated value | **320** | `in(cubic)` | **scroll-linked opacity** |
| onboarding CTA | `:415` | `FadeInDown` | **300** (default) | default | **rise** |
| sign-in step | `auth/sign-in-screen.tsx:144` | `FadeInRight`/`FadeOutLeft` | **200 / 140** | default | **horizontal from the right** |
| sign-in inner | `:241` | `FadeIn` | **240** | default | fade |
| sign-in inner | `:265` | `FadeIn` | **200** | default | fade |
| first-run step | `first-run-screen.tsx:553` | `FadeInRight`/`FadeOutLeft` | **260 / 150** | default | **horizontal from the right** |
| home blocks | `home-screen.tsx:305,366,401,432,466` | `FadeInDown` | **320** at delays 40/60/120/170/180 | default | **rise from below** |

### 11.2 · The six divergences, named

1. **Thirteen durations across six screens.** The motion tokens define **seven** (1, 90, 140, 220, 260,
   300, 340). At least eight of the thirteen are not tokens, so no two screens share a rhythm.
2. **Four entry origins** — scale-with-overshoot, rise, horizontal-from-right, cross-fade. An element
   that pops, then one that rises, then one that slides in, then one that fades, reads as four apps.
3. **Five easing families** — `back(1.6)`, `out(cubic)`, `in(cubic)`, `inOut(quad)`, and the library
   default. The overshoot on the splash is the standard's single sanctioned exception; nothing else in
   the sequence is even on the same curve family.
4. **The theme does not cover the whole path.** The pre-auth screens are pinned light
   (`root-navigator.tsx:216,228,240,248,258` — `ThemeScope mode="light"`), but the root **container**
   paints `contentStyle.backgroundColor = c.bg` from the **unpinned** theme (`nav-config.ts:44–53`). On a
   dark-mode phone that means a **dark, blank gap between two cream screens** — and the frames in
   `_device/welcome-contact-sheet.png` show it happening twice. *This is the one divergence the user
   sees as a flash.*
5. **The mark renders in two containers.** A circle, then a rounded square, in one cold start. The logo
   is fixed; its container is not.
6. **Nothing persists across a boundary.** Each screen enters from zero and takes its layout with it, so
   there is no travelling object — and without one, a sequence becomes a queue of screens. This is the
   root cause of *"stacked together"*; the other five are symptoms of it.

### 11.3 · The shared language

- **D1 · One entry idiom — rise.** 12 px (the standard's `rise`), entering at `dur.slow` 300 ms
  `ease.out`, leaving at `dur.fast` 140 ms `ease.in`. If something rises, **everything** rises.
  Horizontal motion is reserved for push/pop; the splash's overshoot stays the standard's one sanctioned
  exception — that is what makes it a signature rather than a mistake.
- **D2 · One duration family — five tokens replace thirteen numbers.** 300 entering, 220 in place, 140
  leaving, 260 a screen push, 340 the root mode switch. Nothing in the welcoming path needs a duration
  that is not already defined.
- **D3 · One progress treatment.** One bar, one geometry, carried across every step — slides and
  first-run alike. Today the slides use three dots and first-run uses a *"Hatua 3 kati ya 8"* line, and
  neither survives its screen. The bar is the cheapest continuity signal available and the one the user
  reads as *"I am X% of the way in"*.
- **D4 · One type and spacing rhythm.** `Display` for the heading, `Body`/`BodySmall` below, 20 screen
  padding, 16 card, gaps from {4, 8, 12, 16, 20, 24, 32}. Same nine roles as everywhere else.
- **D5 · THE HAND-OFF — what actually fixes the complaint.** At every boundary, **one object travels**:

  | Boundary | What persists |
  | --- | --- |
  | launch → language | the mark shrinks to the header and stays |
  | language → slides | the chosen language's code persists as a chip |
  | slides → first run | the progress bar is the *same object* |
  | step → step | the entered value persists where it was typed |
  | first run → sign-in | the name/email already typed is shown, not asked again |
  | sign-in → home | the root fade arrives over an already-painted home |

  No new animation is required for any of these — **each is a layout decision**. Keep one element mounted
  across the boundary and the sequence stops being a queue. The outgoing content leaves at `dur.fast`
  *while* the incoming arrives at `dur.slow`; never one after the other, which is what produces the blank
  beat the user reads as a new app starting.
- **D6 · One theme across the whole path.** The root container must paint the same cream the pinned
  screens use. One line, and the flash disappears. Nothing else changes.

### 11.4 · Cost on a cheap phone

| | |
| --- | --- |
| new downloads | **0 bytes** — no new images, no new fonts |
| new screens | **none** — the path *shrinks* (four slides → one, behind a flag, per §6) |
| animations deleted | the onboarding **scroll-linked opacity** (one continuous per-frame interpolation) and home's **second full set of `FadeInDown` blocks** |
| animation class | `transform` + `opacity` only |
| reduced motion | 1 ms, never 0; the hand-off objects are **static** evidence, so the strongest part of this proposal survives with motion off |

The two deletions are both per-frame work, so the arrival becomes **cheaper** than today's.

---

## 12 · What the live device changed

The phone came back online mid-session. Everything below is a measurement, not an inference, and three
items in Part I had to be corrected because of it.

### 12.1 · Method

`adb` → `screencap` (byte size used as evidence) and `uiautomator dump` (which **worked** here: 24
labelled nodes with exact bounds). Device: **1344×2992, density 408, dark mode, Android, app version
1.6.10**. Captures in `_device/`. No sign-out, no data clearing, no uninstall, no contact messaged.

### 12.2 · The cold start, as pixels

A 6.3 MB `screenrecord`, 12 frames at 0.5 s spacing (`_device/welcome-contact-sheet.png`):

| Frame | What is on screen |
| --- | --- |
| 1 | **cream** background, the mark inside a **circle** |
| 2–3 | **dark** background, **completely blank** (~1 s of nothing) |
| 4 | **cream** background, the mark inside a **rounded square** |
| 5–12 | **dark** home with content |

Background order: **cream → dark → dark → cream → dark.** Exactly the mechanism in §11.2(4), seen on
the device.

The vision model's own reading (*nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free*): *"the
white-to-black switch would be perceived as a flash"* and the logo *"appears twice … the symbol is
identical, but the container differs (circle vs. square), so it is not identical."*

**Where the model disagreed with the owner, and why I report the owner's read.** Asked whether the
sequence reads as one arrival or as unrelated screens, it said *"It reads as ONE continuous cold-start
arrival … not a disjointed stack of separate pieces."* I am not passing that on as a finding, for two
stated reasons: it saw **only the cold start**, whereas the path the owner is most likely describing is
the **slides and first-run steps** — which I could not re-trigger without clearing his app data
(forbidden, and I did not); and *"does this feel like one arrival"* is precisely the class of judgement a
vision transcript is weakest at. Its factual readings (the flash, the two containers, the blank second)
corroborate the owner even where its verdict did not.

### 12.3 · The three corrections the device forced

**1 · The job feed is NOT empty — the inherited claim was wrong.**

A populated feed with real postings: *Sales Officer* (CCBRT), *Head of Marketing* (Ramada Resort by
Wyndham Dar Es Salaam), *Loan officer with driving skills* (Hope Microcredit), *Senior Manager Credit*
and *Manager IT Branches Supports* (CRDB Bank), *Loan Officer and Collection Officer* (Simplepay
Capital) — each with **Lenga CV yangu** and **Fungua tangazo**. §5.3 and the jobs mockup are corrected;
`_device/device-07-jobs-live.png`.

It also showed something no design could: **not one card carried a match score**, because the account has
no career profile, so every posting fell into *Nafasi zote za kazi* rather than
*Zinazoendana na wasifu wako*. **The unmatched list is the default for a new user** — which makes the
quiet status line and the profile nudge more important than the badge.

**2 · The greeting renders an internal value as the user's name.**

The home screen reads **"Habari za leo asubuhi, Backup 1"**. The device-name guard at
`home-screen.tsx:276–281` checks for phone brands and for a 1–4 character string; *"Backup 1"* passes
both, so a machine default is displayed as a person's name on the first screen of the app. This is the
same class of defect as §5.4's profile header, verified on the real device rather than argued from source.

**3 · Real tab labels and a real quick-action label** — `CV zangu`, not `CV`; `Ukaguzi wa ATS`, not
`Ukaguzi wa CV`. Corrected in the mockups (§9.3).

### 12.4 · What the device confirmed

- **The empty state is real and well built.** *"Huna CV bado / Huna CV, rasimu wala iliyokamilika. Ongea
  nami nikutengenezee moja, au pakia CV uliyonayo ili kuanza."* with a filled **Ongea nami** and a
  ghost **Pakia CV**, **vertically centred** — confirming §5.5's centring fix and showing the component
  is already correct.
- **The DANGER ZONE split is real** (§5.4). On the device, **Clear offline data** sits under **ACCOUNT**
  while **Delete account** sits alone under **DANGER ZONE**. Confirmed in pixels.
- **The "+1 order" defect from §5.4** — the profile screen shows no completeness score at all, so the
  screen still never explains why matching is weak.
- **Quick actions really do cost ~29% of the screen.** Measured from the frames: the six tiles occupy
  roughly 875 px of 2992 (≈343 dp), which is the density case for §3.6/§8.4 (336 px → 196 px).
- **The chrome is not free.** Bottom tab bar + gesture area is 2783→2992 = **209 px ≈ 7% of the screen
  height** (≈82 dp). Every layout decision in this proposal has to survive that subtraction.

### 12.5 · What I could NOT get, and one thing I may have caused

- **The onboarding slides and first-run steps were not recorded.** Re-triggering them needs clearing the
  app's data on the owner's live phone. I did not do it. §11.1 is therefore **from source** for those two
  screens and from pixels only for the cold start — and the cold start is not the part the owner is most
  likely describing.
- **No chat capture.** I did not send a message to the assistant, so §5.6's chat mockup is a design
  proposal and not a before/after of a live turn. The assistant itself **is live**: `/api/ai/status`
  returns `{"configured":true,"provider":"deepseek"}` and a real Swahili turn answered in 1.79 s with a
  first-person question back — so §5.6 does **not** overstate a failure state, and the AI-unavailable
  path stays a designed failure path rather than the default.
- **A mixed-language state, possibly caused by me.** The Profile screen rendered in **English**
  (`ACCOUNT`, `Clear offline data`, `DANGER ZONE`, `Delete account`, version 1.6.10) while every other
  screen that session rendered in Swahili, and the tab bar's a11y labels flipped from
  *Nyumbani / CV zangu / …* to *Home / My CVs / …*. **I cannot exclude that one of my tab taps toggled
  it**, so I am recording it as an observation and **not** as a defect.
- **`uiautomator dump` did work** on this build — contrary to the expectation that it returns an empty
  tree on animating screens, it returned 24 labelled nodes with bounds, which is how the tab
  coordinates and the real labels were obtained.

### 12.6 · Sibling work this proposal touches

A sibling agent committed real work the same night. Where it meets these surfaces, the owner should read
one story rather than three:

| Commit | What it is | How it relates |
| --- | --- | --- |
| `b8704a3` | the job picker | the same *Nafasi zote / Zinazoendana* split that §5.3 and §12.3(1) measure on the device |
| `4e6dd51` | the chat spec | §5.6 and §10 both constrain it: the composer must stay instant (D1/§7.5) and any picker it opens must be **variant 1 or 4** of §10.1, not a sixth shape |
| `3b5fa81` | positioning research | the *"sell the outcome, never the mechanism"* line that §5.6's trust line obeys |

None of the three was modified by this proposal, and none of this proposal's files were touched by them
beyond the shared directory.
