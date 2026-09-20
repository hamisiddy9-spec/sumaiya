# Sumaiya Web — Responsive, Loading & Transition Standard — 2026-09-20

**Status:** the enforced standard for `apps/web`. This is the sibling of
`docs/MOTION-STANDARD-2026-09-20.md` (which owns *timing and easing*) and
`docs/SWAHILI-STANDARD-2026-09-20.md` (which owns *words*). This document owns
**layout per environment** and **the shape of the wait**.

**Authority chain:** `apps/web/tailwind.config.ts` (`theme.screens`) and
`apps/web/app/globals.css` carry the numbers. If a number changes it changes
here, in those two files, and in the test that pins them — in one commit.

**Evidence state (read this before trusting a line number).** Every `file:line`
in this document was read from the **working tree of
`C:\Users\hamis\projects\sumaiya` on 2026-09-20**, at a moment when six
`apps/web` files carried *uncommitted* edits from another agent
(`app/globals.css`, `app/(app)/(auth)/sign-in/sign-in-form.tsx`,
`components/editor/cv-editor-client.tsx`, `components/editor/template-picker.tsx`,
`components/editor/template-selection-modal.tsx`,
`components/settings/career-profile-card.tsx`). Where a claim depends on
something that exists **only** in the working tree and not in `main`, the text
says so explicitly — the two `.swap-*` classes in §A.3.3 are the important case.
Line numbers in those six files can differ from `main` by roughly ten lines;
search by the quoted class or identifier, not by the number alone.

**Scope:** every reachable web surface. The Android app (`apps/native`) is a
separate product with its own standard and is only referenced where a behaviour
must NOT be copied to web.

**How to read severity labels:** following the motion standard —
**H** = a state change the user is actively watching; **M** = visible but not
load-bearing; **L** = only noticeable if you look for it. **JUDGEMENT** marks an
opinion, not a measurement. Everything factual carries `file:line` (repo) or a
URL (market).

---

## 0. The complaint, restated as a defect

> *"web page transition loading show illustrations of boxes when loading pages …
> audit also find a way to make mobile web and desktop environments research
> them individually against the world and adjust to best as you can … i feel the
> web versions mobile and desktop have not been given thought to"*

Two defects, both real and both reproducible in the code:

**Defect 1 — "illustrations of boxes".** The web app's loading states are
*abstract* boxes, not a picture of the page that is coming. The clearest
instance is `components/dashboard/dashboard-skeleton.tsx:5`, which renders **nine**
placeholder cards, each an A4-proportioned empty rectangle plus two grey lines,
in a `grid-cols-2` on a phone. Nine tall grey rectangles is exactly what the
user described. Meanwhile `app/(app)/loading.tsx:7` and the marketing loaders
render **a 2px progress bar and then an otherwise empty page** — the
internationally-documented anti-pattern: NN/g calls it a *frame-display skeleton
screen* and says it "should not be used as a progress indicator because they do
not give users any sense that the page is gradually transitioning into its final
format" and that users "will assume the page isn't working"
(https://www.nngroup.com/articles/skeleton-screens/). We shipped both bad
options at once: abstract boxes where a skeleton exists, and emptiness where it
does not.

**Defect 2 — one layout, two environments.** The web app is a phone layout with
`md:`/`lg:` branches bolted on. The evidence is countable: across
`apps/web/{app,components}` there are **185 `sm:` prefixes, 165 `md:`, 87 `lg:`,
8 `xl:` and 0 `2xl:` occurrences**. A 1920×1080 laptop — the common desktop for
a Tanzanian office jobseeker — is served a layout whose widest designed tier is
1280px, and above 1536px nothing was designed at all. There is **no
`touch-action` declaration anywhere** (0 occurrences), **no `@media print`
rule** (0 `print:` prefixes in the whole app), and 41 uses of
`h-screen`/`100vh` — which on a phone browser is taller than the visible
viewport while the address bar is expanded
(https://web.dev/blog/viewport-units: "elements sized to be 100vh tall will
bleed out of the viewport").

Everything below fixes those two defects as **two designed environments**, not a
stretched one.

---

# A. LOADING STATES — the audit, the defect list, and the skeleton system

## A.1 The inventory: every async surface, and what it currently renders

Method: every `loading.tsx` / `template.tsx` in `apps/web/app` was read, then
every client component that owns a `loading`/`isLoading`/`sending`/`building`
boolean was grepped. "Blank" means the user sees an empty content region (no
shape, no text) — the defect class the user complained about.

### A.1.1 Route-level loading (`loading.tsx`) — what shows during navigation

| # | Route | File | What it renders today | Verdict | Sev |
| --- | --- | --- | --- | --- | --- |
| R1 | all `/(app)` non-dashboard routes | `app/(app)/loading.tsx:7` | `<RouteProgress/>` — a 2px sweeping bar, empty page below | **BLANK** (frame-display) | **H** |
| R2 | `/assistant`, `/snap`, `/studio`, `/import-cv`, `/interview`, `/voice`, `/brief`, `/career-interview`, `/cv/[slug]`-adjacent app routes | inherits R1 | 2px bar, empty page | **BLANK** | **H** |
| R3 | every `[locale]` route | `app/[locale]/loading.tsx:10` | 2px bar, empty page | **BLANK** | **H** |
| R4 | marketing (`/`, `/jobs`, `/tools`, `/templates`, `/blog`, `/pro`, …) | `app/[locale]/(marketing)/loading.tsx:11` | 2px bar, empty page | **BLANK** — and `/jobs` is `force-dynamic` with a DB query (`app/[locale]/(marketing)/jobs/page.tsx:26,44-50`), so this is the *normal* path, not an edge case. Verified live: `curl https://sumaiya.app/en/jobs` returns `route-progress` markup and no content skeleton | **H** |
| R5 | `/dashboard` | `app/(app)/(dashboard)/loading.tsx:9` → `dashboard-skeleton.tsx:5` | 9 cards × (h-48 grey rectangle + 2 lines), `grid-cols-2 lg:3 xl:4`, `animate-pulse` | **SHAPE-ACCURATE BUT WRONG ON MOBILE** — the card shape mirrors the real CV card (`dashboard-cv-grid.tsx:110,116,144`: ScaledPreview 794×1123 + `h-[62px]` footer), but 9 of them at 2-up on a phone is the "illustrations of boxes" complaint, and `animate-pulse` is a bare opacity pulse (not the shimmer), without the `motion-safe:` guard its sibling uses (`applications-grid.tsx:185`) | **H** |
| R6 | `/editor/*` (both auth and guest) | `app/(app)/(dashboard)/editor/loading.tsx:9`, `app/(app)/editor/loading.tsx:9` | 2px bar, empty page — the comment says this was deliberate ("the grid skeleton it used to look nothing like the editor") | **BLANK** — the diagnosis is right, the remedy is wrong: the fix is an *editor-shaped* skeleton, not no skeleton | **H** |
| R7 | `/cv/[slug]` (public share page) | `app/(app)/cv/[slug]/loading.tsx:4-33` | A4 sheet (aspect 794/1123) with header block, 3 text lines, 3 section blocks, `animate-pulse` | **THE BEST ONE IN THE APP** — shape-accurate, honest, still wrong in three ways: `animate-pulse` not shimmer; the sheet is *page*-shaped but the real page is `min-h-dvh bg-sand-2` + a toolbar the skeleton omits; and there is no hand-off (it unmounts on one frame) | **M** |
| R8 | dashboard route changes (`?tab=`) | `app/(app)/(dashboard)/template.tsx:7` | `.route-enter` (240ms fade-rise, `globals.css:128-134`) | **OK** — the only route transition in the app that is a motion beat; it fades the content pane, not the persistent sidebar (correct) | — |
| R9 | marketing route changes | `app/[locale]/template.tsx:8` | same `.route-enter` | **OK**, but note it fires on *every* navigation including back/forward, and does not know where you came from | **M** |

### A.1.2 Component-level async — spinners where a shape belongs

| # | Surface | File:line | What renders today | Verdict | Sev |
| --- | --- | --- | --- | --- | --- |
| C1 | Sign-in / sign-up shell | `app/(app)/(auth)/sign-in/sign-in-form.tsx:389` | `<Suspense>` **with no `fallback` prop** → React renders `null` | **BLANK FLASH** — the sign-in page body is empty until the client component renders. This is the single worst loading state on the site because it is the first screen a returning user sees | **H** |
| C2 | Template picker (family → templates) | `components/editor/template-picker.tsx:125-127` | centred `Loader2` spinner in an empty region, then the whole grid at once | **SPINNER → SNAP** | **M** |
| C3 | Template selection modal | `components/editor/template-selection-modal.tsx:131-133` | same | **SPINNER → SNAP** | **M** |
| C4 | Career profile card (Settings) | `components/settings/career-profile-card.tsx:139` | one line of `animate-pulse` text where 3 rows of chips arrive | **TEXT PULSE → LAYOUT SHIFT** — the card grows from ~20px to ~200px | **M** |
| C5 | Targeted-CV drawer (jobs) | `components/jobs/targeted-cv-drawer.tsx:274-277` | pulsing wand icon + "Inachambua…" line where analysis rows arrive | **TEXT PULSE → SNAP** | **M** |
| C6 | Shared profile panel (editor) | `components/editor/shared-profile-panel.tsx:142` | 10px pulsing text where 7 form fields arrive | **TEXT PULSE → LAYOUT SHIFT** | **L** |
| C7 | Applications grid | `components/dashboard/applications-grid.tsx:179-192` | shape-mirroring skeletons with `motion-safe:animate-pulse` | **OK** — the reference implementation for the shape idea and the reduced-motion guard; needs shimmer + hand-off | — |
| C8 | Assistant (chat) | `components/assistant/cv-assistant-client.tsx` (`sending`, `building`, `exporting`, `uploading` state, e.g. `:1018`) | inline spinners and a "Inasoma faili yako…" string | **SPINNER, acceptable for a message send** — a chat turn may legitimately be a spinner *inside the bubble it will occupy*; it may not blank the transcript | **M** |
| C9 | Job feed (`/jobs`, marketing) | `components/jobs/jobs-feed.tsx` (no loading state at all — `:76-87` shows only filter state) | jobs arrive **server-rendered**, so the whole `RouteProgress` bar period (R4) is the wait, with an empty page | **BLANK** — filtering is client-side and instant; the wait is the DB query | **H** |
| C10 | Public CV, studio, snap, import-cv, interview, voice, letter/business-card editors | `components/studio/studio-client.tsx`, `components/pdf-tools/import-cv-client.tsx`, `app/(app)/snap/snap-client.tsx`, `components/interview/interview-client.tsx`, `components/editor/{letter,business-card}-editor-client.tsx` | `Loader2`/`animate-spin` (grep: 30 files contain a spinner) | **SPINNER** — each of these has a known shape (a canvas, a page, a list) and therefore none of them should use a spinner for first paint | **M** |
| C11 | Settings form | `components/settings/settings-form.tsx`, `career-profile-card.tsx` | server-rendered initial values, then client fetch for counts | mixed — see C4 | **M** |
| C12 | Auth callbacks (`/verify`) | `app/(app)/(auth)/verify/page.tsx` (spinner) | spinner full-screen | **SPINNER** — acceptable *only* if it stays ≥300ms; it currently has no minimum-visible-time guard, so a fast success blinks | **L** |

**Count: 7 of the 12 async route groups never render a shape for the page that
is coming, and 2 of the 12 render the right shape at the wrong size. Two
surfaces flash genuinely blank (C1, and every R1/R3/R4/R6 route).**

## A.2 The defect list (this is the user's complaint, itemised)

Ordered by what a user hits first.

1. **D1 — Sign-in body is blank until hydration.** `sign-in-form.tsx:389`:
   `<Suspense>` with no fallback. Fix: give it the auth-card skeleton (§A.4.1).
2. **D2 — Every route without its own `loading.tsx` shows a 2px bar over an
   empty page.** `app/(app)/loading.tsx:7`, `app/[locale]/loading.tsx:10`,
   `app/[locale]/(marketing)/loading.tsx:11`. Fix: replace with per-archetype
   skeletons, and keep `RouteProgress` only as the *thin* second signal above a
   real skeleton.
3. **D3 — The editor, the app's heaviest screen, shows nothing.** R6. Fix:
   editor-shaped skeleton (§A.4.5) at both editor loaders.
4. **D4 — The dashboard skeleton renders nine A4 boxes on a phone.** R5. Fix:
   3 cards below `md`, `6` at `md`, `8` at `xl` (a grid that matches the real
   card count visible above the fold at each size) and the shimmer class.
5. **D5 — Public CV page snaps.** R7. Fix: shimmer + hand-off beat (§A.5).
6. **D6 — Text-pulse stand-ins for structural content.** C4/C5/C6. A pulsing
   *word* where a *form* will appear is a lie in both directions: it promises
   text, it delivers a layout shift.
7. **D7 — Wrong reduced-motion guard.** `dashboard-skeleton.tsx:9` uses bare
   `animate-pulse`; `applications-grid.tsx:185` uses `motion-safe:animate-pulse`.
   The app-wide `prefers-reduced-motion` net in `globals.css:203` collapses
   Tailwind's pulse, but the two are inconsistent by accident, not by rule.
8. **D8 — No minimum-visible time and no maximum.** Nothing in the app decides
   "do not show a skeleton for a 40ms wait" (a 40ms skeleton is a *flash*, which
   is worse than nothing) or "stop pretending at 10s, say what is happening".
   Fix: §A.6.

## A.3 The skeleton system

### A.3.1 Primitives (one file, one vocabulary)

New: `apps/web/components/ui/skeleton.tsx` is **rewritten** around three
primitives plus one wrapper. The existing `Skeleton`/`CardSkeleton`/`GridSkeleton`
(`components/ui/skeleton.tsx:1-57`) are kept as thin aliases so no caller breaks
while screens migrate.

```
<Sk />                     // one bar; props: w, h, r (default 8px), tone
<SkText lines={3} />       // line heights 14px, gaps 8px, last line 60% width
<SkBox ratio="794/1123" /> // an A4 sheet or any covered rectangle
<SkShimmer>{children}</SkShimmer>  // the sweep, clipped to the children
```

Rules that make it look like the page and not like boxes:

- **Geometry comes from the real element**, in this order of preference:
  (1) reuse of the real component with empty data, (2) a measured constant copied
  into the skeleton with a comment naming the source file, (3) a guess — which
  must be marked `// JUDGEMENT: approximate` so the next person can fix it.
- **Every text block is 2–4 lines** with the last line 60% width. A single line
  where a paragraph lands is a layout shift waiting to happen.
- **A square photo frame is a square.** The CV photo is 600×600 / 1:1
  (`lib/photo-upload.ts`: 600px square, per `docs/CLAUDE-QUEUE-2026-09-20.md`
  §0.8). A skeleton avatar must be a square with `rounded-full` only where the
  final UI is round.
- **Radius, padding, border and gap must match the real card** — copy the classes
  from the real component in the same commit, and name it in a comment:
  `// mirrors components/dashboard/dashboard-cv-grid.tsx:110`.
- **Counts are chosen per breakpoint to match what is actually above the fold**,
  3/6/8 rather than a fixed 9 (`9` was the defect).
- **No new layout skeleton below a 300ms expectation.** See §A.6.

### A.3.2 Shimmer, and why it is a *sweep* not a *pulse*

```
.skeleton-shimmer {
  background: linear-gradient(90deg,
     var(--sk-b) 0%, var(--sk-a) 45%, var(--sk-b) 90%);
  background-size: 300% 100%;
  animation: skeleton-sweep 1.4s linear infinite;
}
@keyframes skeleton-sweep {
  0%   { background-position: 160% 0; }
  100% { background-position: -60% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer { animation: none; background-position: 40% 0; }
}
```

- 1.4s, **linear**, left→right, one sweep (NN/g notes a shimmer "that moves from
  left to right" is the pattern, and warns that such animations "can potentially
  be distracting, annoying, or even create accessibility problems for some
  users" — hence the reduced-motion hold, and hence 1.4s rather than 0.8s:
  https://www.nngroup.com/articles/skeleton-screens/).
- **Never `animate-pulse` for a skeleton.** Opacity pulsing on 9 large
  rectangles makes the whole page breathe; a sweep inside each shape reads as
  "work in progress" and costs one compositor layer instead of a repaint. The
  existing `.skeleton` class (`globals.css:87-91`) already does the sweep —
  it is applied to **nothing** in the app today (grep: `.skeleton` appears only
  in `globals.css`). The token exists; the screens never adopted it.
- Colours: `--sk-b: #EFE7DA` (sand), `--sk-a: #E9E0D4` (border) on light;
  `espresso-2`/`espresso-line` on dark, matching `skeleton.tsx:14`'s existing
  pair. One palette, both themes.
- `contain: content` on each skeleton block (JUDGEMENT: cheap, standard, and it
  keeps the sweep from invalidating the whole page's paint).

### A.3.3 Skeleton → content: the hand-off (a motion beat, not a snap)

The defect in every `{loading ? <A/> : <B/>}` in this repo — 30 files contain a
spinner and roughly a dozen contain this ternary — is that React unmounts A and
mounts B **in the same commit**: the slot is empty for zero frames in theory and
for one frame in practice, and the content lands at full opacity with no
relationship to the placeholder it replaced. The motion standard calls this a
"boom" (`docs/MOTION-STANDARD-2026-09-20.md` §2.4, §3.5 "Loading → content:
placeholder `FadeOut` 140ms **while** content enters").

The web implementation of that row already exists **in the working tree, not in
`main`** (an uncommitted sibling edit; `git show HEAD:apps/web/app/globals.css`
contains neither class — verify before relying on it):

```
.swap-out { animation: swap-out 0.14s cubic-bezier(0.32, 0, 0.67, 0) both; }   /* globals.css:313 (wt) */
.swap-in  { animation: snap-rise 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }    /* globals.css:312 (wt) */
```

In the working tree `.swap-in` is applied in six places
(`template-picker.tsx:130,134`, `template-selection-modal.tsx:137,141`,
`career-profile-card.tsx:142,144`) and **the matching `.swap-out` is applied in
none** — so the placeholder is deleted instantly and only the arrival is
animated. That is half a beat, and whoever authored `.swap-in` left the other
half of the pair unused. Land both classes with their first real caller
(`AsyncSlot`), or neither.

The rule:

> **A wait hands over, it does not swap.** The placeholder leaves *while* the
> content arrives, in the same region, for 140ms/300ms respectively; the
> container's height is reserved for the content (or animates `transform`-only)
> so nothing below it moves; and the pair is implemented **once**, in
> `<AsyncSlot>`, not by each screen.

```tsx
// components/ui/async-slot.tsx  (new)
// pending:  the skeleton, same box the content will occupy
// ready:    the content
// minVisibleMs: do not show a skeleton for a shorter wait than this
// holdMs:       once shown, do not replace it for at least this long
<AsyncSlot pending={<DashboardSkeleton/>} minVisibleMs={300} holdMs={220}>
  {loaded ? <Grid…/> : null}
</AsyncSlot>
```

- Exiting shape: `.swap-out` (140ms, `ease.in`, opacity only).
- Entering content: `.swap-in` (300ms, `ease.out`, opacity + 6px rise) — the
  same rate as `.rise` so a loaded list and an arriving list feel identical.
- **Interruptible by construction:** if data resolves during the exit, the exit
  is cancelled and the content rises into place (CSS `animation` on a
  re-rendered node does exactly this; no JS clock is involved).
- Reduced motion: both collapse to `0.01ms` via `globals.css:203-208`, and the
  content is simply present — the standard's "collapse, never remove".
- **Zero layout shift is the acceptance criterion** (CLS 0 for the swap): the
  skeleton and the content must agree on their box. Where they cannot (a
  variable-height list), the container gets `min-height` equal to the skeleton's
  height.

## A.4 Per-screen skeleton specifications

Each spec is what to build, with the real geometry named. Boxes are drawn at
their true proportions, not decoratively.

### A.4.1 Auth (`/sign-in`, `/sign-up`, `/verify`) — fixes D1

Real screen: a centred card, logo, h1 (24px), one sub-line, 2 inputs (44px),
a primary button (48px), a divider, a Google button, one footer line.

```
┌─────────────────────────────┐ ← card  max-w-[400px] px-6 py-8 rounded-card-lg
│      ▭▭▭  (mark 28×28)      │    mirrors app/(app)/(auth)/*/page.tsx
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬  (h1 24px) │
│   ▬▬▬▬▬▬▬▬▬▬   (sub 14px,60%)│
│  ┌───────────────────────┐  │
│  │ label 12px ▬▬▬        │  │  ← input 44px, border 1px,
│  └───────────────────────┘  │    radius from ui/input
│  ┌───────────────────────┐  │
│  │ label 12px ▬▬▬        │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │  ← button 48px, full width
│  └───────────────────────┘  │
│  ──────────  or  ────────── │
│  ┌───────────────────────┐  │  ← Google button 48px
│  └───────────────────────┘  │
└─────────────────────────────┘
```

Fix for `sign-in-form.tsx:389`: `<Suspense fallback={<AuthCardSkeleton/>}>`. The
fallback must be the **same card component** with skeleton children, so the
input positions are identical and the real inputs do not move by a pixel when
they mount.

### A.4.2 Job feed (`/jobs`) — fixes R4/C9

Real screen (from `app/[locale]/(marketing)/jobs/page.tsx:34+` and
`components/jobs/jobs-feed.tsx:149+`): a dark page header, a filter bar (search
input + 4 selects + a sort control), then a vertical list of job rows.

```
dark band  ▬▬▬ h1 (32px)      ← page header, espresso bg
filter bar [ search 44px ][ select ][ select ][ select ]   ← sticky on mobile
─────────────────────────────────────────────────────────
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (18px)     │  ← job title, 2 lines max
│ ▬▬▬▬▬▬▬ (13px)             │  ← employer · location
│ [chip 64×22] [chip 88×22]  │  ← match score, tags
└────────────────────────────┘ × 4 (mobile) / 6 (desktop)
```

The filter bar is **real and interactive immediately** (it is client-side,
`jobs-feed.tsx:79-85`) — only the rows are pending. So the skeleton is the list
only; filters must never be skeletons. Real rows are the ones linked from the
feed; measure one (`jobs-feed.tsx:335` region) and copy its padding and
hierarchy.

### A.4.3 Dashboard (`/dashboard`) — fixes R5

Real card: `dashboard-cv-grid.tsx:110` (`rounded-card-lg border bg-card`),
`:116` a `ScaledPreview` of a 794×1123 page, `:144` a `h-[62px]` footer with
border-t, icon and title. Grid: `:250` `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`.

```
┌──────────┐ ┌──────────┐        ← 2 up below md (unchanged — a 794/1123 page
│  (page)  │ │  (page)  │          is width-limited, not count-limited)
│          │ │          │
│          │ │          │
├──────────┤ ├──────────┤
│ ▬▬▬▬  ▭  │ │ ▬▬▬▬  ▭  │        ← h-[62px] footer, 2 lines + icon
└──────────┘ └──────────┘
```

Changes: **3 cards on mobile, 6 at `md`, 8 at `xl`** (today: 9 always). Above the
grid, the dashboard's summary strip (count tiles) and the signal banner are also
pending — they get their own two-bar shapes at their real height, not one bar.

### A.4.4 Templates gallery (`/templates`, `/dashboard` template picker) — fixes C2/C3

Real item: a thumbnail of a real page (A4 ratio) + title + family chip, in a
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`-class grid (the gallery is a client
component over static data, `components/template-gallery-client.tsx:32`, so it
loads fast — the skeletons here exist for the **modal** case where families are
fetched per selection, `template-picker.tsx:125`).

```
┌─────────────┐ ┌─────────────┐
│   (page)    │ │   (page)    │   ← aspect 794/1123, real thumbnail box
│             │ │             │
│             │ │             │
├─────────────┤ ├─────────────┤
│ ▬▬▬▬▬▬▬  ▬▬ │ │ ▬▬▬▬▬▬▬  ▬▬ │   ← name (14px) + family chip (11px)
└─────────────┘ └─────────────┘
```

Replace the `Loader2` (`template-picker.tsx:126`) with **3 of these**. A spinner
in a region that will hold a 4-up grid of A4 pages tells the user nothing; three
page-shaped boxes tell them exactly what is coming.

### A.4.5 Editor (`/editor/cv/[id]`, `/editor/cv/try`, cover-letter, letter, business-card) — fixes R6/D3

The editor's real desktop geometry already exists and the skeleton must copy it
verbatim (`cv-editor-client.tsx:3065-3184`):

```
┌────────────┬──────────────────────────────┬────────────┐
│ left panel │           preview            │  right     │
│ 290px      │  (a real A4 page, centred)   │  280px     │
│ ─ section  │  ┌────────────────────────┐  │ ─ design   │
│ ─ section  │  │ photo ▢   name ▬▬▬▬▬   │  │ ─ colours  │
│ ─ section  │  │ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬        │  │ ─ font     │
│            │  │ ─ section ──────────── │  │            │
│            │  │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │  │            │
│            │  └────────────────────────┘  │            │
└────────────┴──────────────────────────────┴────────────┘
                      ↑ lg: and up
```

Below `lg:` the real editor shows one pane at a time with a 3-tab bottom bar
(`cv-editor-client.tsx:3692`, height 56px, `lg:hidden`). Therefore:

- **Mobile skeleton:** the top bar (title + save), the **preview pane** (the
  centre piece — it is the pane the user will see most), and the 56px tab
  strip with three labels. Not three columns squeezed.
- **Desktop skeleton:** the three panes above, at their real widths, with the
  left/right panels as 4–5 stacked field bars each and the centre as a real A4
  sheet with a **square** photo frame, 3 name/title bars, and 3 section blocks.
- The editor skeleton must be **static HTML with no editor JS**, so it streams
  in the `loading.tsx` while the ~30-chunk editor bundle loads. This is the one
  place where the payload matters enough to keep the skeleton dependency-free.

### A.4.6 Assistant (`/assistant`) — fixes R2 (the blank cockpit)

Real screen: a header, a transcript region, and a fixed composer (textarea,
`max-h-[25vh]`, send button, attachment/mic — `cv-assistant-client.tsx:3098`).
The empty-but-ready state already exists (`showChips` at `:673`).

```
┌───────────────────────────────────────────┐
│ ▭  Sumaiya            [▬▬▬] [▬▬▬]          │ ← header, real
├───────────────────────────────────────────┤
│  ╭──────────────────────────╮             │ ← Sumaiya bubble: left, 78% max,
│  │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │   the bubble's own radius and padding
│  │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬       │
│  ╰──────────────────────────╯
│  ╭───────────────────────╮                │ ← user bubble: right, 70%
│  ╰───────────────────────╯
├───────────────────────────────────────────┤
│ [ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ] [▭] [▭] [▭]            │ ← composer, real height
└───────────────────────────────────────────┘
```

The composer must be **real and focusable during the skeleton** (it is the
screen's purpose). Two bubbles, one left one right — that is the whole shape,
and it is the shape of the real transcript.

### A.4.7 Settings / profile — fixes C4, C11

Real screen: `max-w-2xl mx-auto px-4 py-12` (`settings/page.tsx:40`), h1, sub,
then cards. Each card: icon + title (14px semibold) + hint line + rows of
`label + input` (44px) or chips.

```
│ ⚙  ▬▬▬▬▬▬▬▬▬▬                │  ← card header, real
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ (hint 12px)
│  label ▬▬▬   [ ▬▬▬▬▬▬▬▬▬ ]    │ × 3   ← field rows, 44px each
```

`career-profile-card.tsx:139`'s single pulsing line becomes 3 field rows. The
card's height must be the same loaded and loading — that is the point.

### A.4.8 Public CV (`/cv/[slug]`) — fixes D5

Keep the existing shape (`cv/[slug]/loading.tsx`) — it is right. Add: the
toolbar strip above the sheet (`min-h-dvh bg-sand-2` container, real toolbar
height), the shimmer instead of `animate-pulse`, and the hand-off (§A.3.3).

### A.4.9 Applications / workspace / drawer — fixes C5

Applications grid already has shape (`applications-grid.tsx:179-192`): keep,
swap to shimmer. The targeted-CV drawer (`targeted-cv-drawer.tsx:274`) gets 4
analysis rows at the real row height (title 13px bar + 2-line body) instead of
the pulsing wand.

### A.4.10 Studio, Snap, Import-CV, Interview, Voice

All four are canvas/workflow screens whose first paint is a *page* or an *upload
zone*:
- Studio: left tool rail (desktop) / bottom sheet (mobile) + the canvas sheet.
- Import-CV: one large dashed drop-zone (real height 180px mobile / 220px
  desktop) + one button.
- Snap: the photo frame (1:1 if it will be a CV photo, otherwise the real
  capture aspect) + the 3-tab strip.
- Interview / Voice: a card with a question bar (2 lines), an options list
  (3 rows), and the mic control (56px circle).

Each replaces its `Loader2` with the shape *of its own first frame*.

### A.4.11 Marketing routes (`/`, `/pro`, `/tools`, `/blog`, templates detail)

Marketing routes are statically prerendered and arrive in tens of milliseconds
(`app/[locale]/(marketing)/loading.tsx:6-8` says so) — measured: `/en` TTFB
0.68s, `/en/templates` 0.72s on this connection (§C.5 appendix). **A layout
skeleton here would flash.** The honest treatment is:

1. keep the thin `RouteProgress` bar as the *only* signal for a prerendered
   route, and
2. give the **one** slow marketing route its own shape: `/jobs` (R4) — because
   it is `force-dynamic` and hits the DB.

This is the "same product, adapted" rule applied to loading states: **a skeleton
is for a known, slow, shaped wait. Everything else gets the bar and nothing
else** — plus the 300ms gate in §A.6 so a skeleton never flashes.

## A.5 What "a motion beat rather than a snap" means, operationally

| Transition | Today | Standard |
| --- | --- | --- |
| Route chunk loads | 2px bar over emptiness | skeleton (if >300ms) → bar stays, 2px, on top; content enters with `.route-enter` |
| Skeleton → content, same region | one-frame unmount/mount | `.swap-out` 140ms + `.swap-in` 300ms, overlapping, container height reserved (§A.3.3) |
| Spinner → content (pickers, drawers) | snap | `.swap-out` the spinner region + `.swap-in` the content; the spinner is replaced by *shape*, not animated away |
| Button label → spinner | handled in native (`docs/MOTION-STANDARD…` M11); on web, `Loader2` swaps in place | label and spinner cross-fade over each other, 220ms (`dur.base`) — one element, two children, `opacity` |
| Tab/route panel | `.route-enter` (240ms) | keep; add direction (forward/back) per §B |
| Empty state after load | appears with `.swap-in` (`empty-state.tsx`) | keep; it must be the *same* slot as the skeleton so the beat reads as one hand-off |

**Nothing here is a "boom"**: no full-screen flash, no white frame, no content
that appears at full opacity with no relationship to its predecessor.

## A.6 The two timing gates (fixes D8)

1. **`minVisibleMs = 300`.** Never show a skeleton for a wait that may finish
   sooner. Implementation: `AsyncSlot` renders `null` for the first 300ms and
   the skeleton only after; if data arrives before 300ms, the content appears
   immediately with `.swap-in` and no skeleton ever existed. A 300ms threshold
   is also the point below which a skeleton reads as a glitch rather than as
   progress (JUDGEMENT, and consistent with NN/g's caution that skeleton screens
   are for *full-page loads* — https://www.nngroup.com/articles/skeleton-screens/).
2. **`holdMs = 220`.** Once a skeleton is visible, keep it visible for at least
   220ms so it is never a single-frame flash. 220ms is `dur.base`, the app's
   existing "in-place change" token (`docs/MOTION-STANDARD-2026-09-20.md` §3.1).
3. **`slowMs = 8000`.** After 8s of a skeleton on a route with no incremental
   signal, the skeleton gains one line of real text ("Bado inapakia… / Still
   loading…" plus a retry affordance), because at that point an endless shimmer
   is a lie. On a metered Tanzanian connection (§C.5) this path is reachable, so
   it must be designed rather than discovered.

## A.7 How to verify the loading work (not optional)

1. **Slow the network to what the audience actually has**, and screenshot the
   first 2 seconds of each route:
   ```bash
   # a 400 kbps / 400ms-RTT profile is the honest floor for this audience
   # chrome devtools protocol: Network.emulateNetworkConditions
   ```
   The measurement in §C.5 (401 KiB for a marketing first load) means a
   400 kbps link needs ~8s for that page **cold**; the skeleton is not
   decoration, it is most of the experience.
2. **The two-frame test** (the same test that caught the native defects in the
   motion standard): screen-record the transition at 60fps and check the frames
   between skeleton and content. Interpolated = several frames of moderate
   change with shrinking distance-to-final. Pop = one frame of total change.
   The script already exists: `scripts/motion-frames.py` (repo root).
3. **CLS must be 0** across the swap: run Lighthouse (`Performance` →
   `Cumulative Layout Shift`) on `/dashboard` and `/jobs` at 390×844 and at
   1440×900.
4. **Reduced motion:** `prefers-reduced-motion: reduce` must remove the sweep and
   the rise and leave a legible static placeholder (`globals.css:203-208`).

---

# B. PAGE AND VIEW TRANSITIONS

## B.1 What happens today

Three separate mechanisms, none coordinated:

| Mechanism | Where | Duration / curve | Problem |
| --- | --- | --- | --- |
| `.route-enter` fade-rise | `app/(app)/(dashboard)/template.tsx:7`, `app/[locale]/template.tsx:8`, `globals.css:128-134` | 240ms, `cubic-bezier(0.16, 1, 0.3, 1)`, opacity 0→1 + `translateY(6px)`→0 | Fires on **every** navigation in the subtree with no direction and no origin: going "back" to `/dashboard` and going "forward" into `/jobs` are visually identical. It also animates the *whole* pane including its scroll position. |
| `RouteProgress` bar | `components/ui/route-progress.tsx:14`, `globals.css:106-126` | 1.1s `cubic-bezier(0.65, 0, 0.35, 1)` infinite sweep, 40% wide, 2px | `top: 0` of the **viewport**, so it sits under the browser chrome on iOS in PWA standalone mode and under a sticky header on desktop; and it is *indeterminate*, so it conveys nothing about progress on the one route where progress is knowable (`/jobs`). |
| Template picker → editor entry | `components/editor/template-picker.tsx`, `template-selection-modal.tsx` → `/editor/cv/new?template=…` (`app/(app)/(dashboard)/editor/cv/[id]/page.tsx:44-45`) | Full page navigation; `editor/loading.tsx:9` = bar only | The user has just tapped a *page-shaped thumbnail* and the response is an **empty screen**. This is the worst transition in the product: the strongest affordance followed by the weakest acknowledgement. The thumbnail they tapped should be the thing that becomes the page (`origin-aware`). |

Also relevant: `app/(app)/(dashboard)/layout.tsx:33` renders the sidebar inside
`<Suspense fallback={<SidebarFallback/>}>` (a bare 230px espresso rectangle) —
correct in intent, but it means the sidebar is *replaced* by a flat rectangle on
hard navigations rather than persisting.

## B.2 What it should be

### Rule 1 — transitions are **origin-aware**

The transition must show where the new view came from. Three cases, and only
three:

| Case | Motion | Implementation |
| --- | --- | --- |
| Deeper in the same tree (list → detail, gallery → editor) | the new view **rises 6px** and the old fades under it; if the trigger was a *card*, the card's box is the origin | `template.tsx` can read `usePathname()` and compare depth; the card-origin case uses a **View Transition** with a named element (`view-transition-name: template-card-<id>`) |
| Back / up | the reverse: the view that is being *returned to* fades in **from 0**, and the view being left leaves *forwards* (6px down, 140ms). Never the same motion as forward | detect with a `router.back()` wrapper + `popstate`; a `nav-direction` module (new, `lib/nav-direction.ts`) is the single source |
| Lateral (tab to tab in the dashboard, `/dashboard?tab=cv` → `?tab=applications`) | **no positional motion at all**: cross-fade only, `dur.base` 220ms. Tabs are peers; moving sideways is not moving deeper | the tab strip already owns the selection indicator; only the panel cross-fades |

The platform mechanism for this, where supported, is the **View Transition
API** — `document.startViewTransition()` for same-document navigations, and
`PageRevealEvent`/`pagereveal` for cross-document ones
(https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API). Two
warnings from that page that shape the design here:

- "Cross-document view transitions (i.e., across navigations between different
  pages in MPAs) have historically been impossible" — so a Next.js App Router
  app gets these for free only in browsers that implement it; **every transition
  must therefore be defined twice**: a CSS-class fallback (works everywhere,
  today) and an optional view-transition enhancement. Never a
  view-transition-only experience.
- Accessibility: "loss of reading position, focus confusion, and strange live
  region announcement behavior can also result from having the new and old
  content both present in the DOM at once." Therefore: **no transition on the
  editor's canvas or any region holding focus**, and the transition must not
  include content that a screen reader is currently reading.

### Rule 2 — transitions are **interruptible**

A navigation animation is never a gate (motion standard §2.2). Concretely:
`.route-enter` is a 240ms CSS animation on mount, so a second navigation
mid-animation simply mounts a new element and the old animation dies with its
node — already interruptible, and it must stay CSS (not a JS clock, not
`framer-motion` with `AnimatePresence` around a route, which queues exits and
would introduce exactly the "lock behind" the standard forbids).

### Rule 3 — the transition must **never be the wait**

Today the only thing a user sees during a 1.6s dynamic-route wait is a 2px bar
(R4). Fix: the skeleton from §A appears under the bar, so the transition is
"shape arrives → content replaces shape", and the bar becomes a secondary,
honest signal. On the marketing subtree (prerendered) the bar is the *whole*
signal and should stay subtle — 2px, no skeleton, per §A.4.11.

### Rule 4 — the template picker → editor entry (the flagship transition)

This is where "origin-aware" earns its keep, and it is small enough to ship first:

1. The tapped template thumbnail gets `view-transition-name: tpl-<id>` before
   navigating (or, in the CSS fallback, the thumbnail is retained as the
   skeleton's first frame — see 3).
2. On the editor route, the **editor skeleton** (§A.4.5) renders the *same box*
   (A4 ratio, same radius, same shadow) in the same viewport position the
   thumbnail occupied. So the page travels from thumbnail-size to page-size
   rather than cutting.
3. The editor's real canvas then fades in over the skeleton with `.swap-in`,
   *anchored* to the same box.
4. Reduced motion: the thumbnail is simply replaced by the skeleton in place, no
   scale.

Cost check: steps 2–3 need one shared element and a reserved box; they do **not**
need a full view-transition implementation, so this is implementable this week
(see queue item R7).

### Rule 5 — scroll and focus, not just pixels

- **Scroll restoration:** Next.js restores scroll for back/forward; it must not
  for a forward navigation to a *different* route, and the transition must not
  run on a restored scroll position (it currently does — `.route-enter`
  animates the pane while the browser jumps the scroller, which is why a back
  from the editor sometimes looks like a double movement). Fix: the pane
  animation is applied to an inner wrapper that is not the scroll container;
  the scroll container is untouched.
- **Focus:** after a route change the h1 receives focus (`tabIndex={-1}`) on
  marketing pages already (`app/[locale]/(marketing)/templates/page.tsx:53`
  shows the pattern). Keep that, and never let a transition hide the focused
  element: WCAG 2.2 SC 2.4.11 requires that a focused component "is not entirely
  hidden due to author-created content"
  (https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- **Keyboard/`aria`:** the route progress bar is `role="status"` +
  `aria-live="polite"` (`route-progress.tsx:16`) — correct; the skeleton adds
  `aria-hidden="true"` on the shapes and a single `role="status"` with a
  Swahili label on the group, so a screen reader hears one sentence, not 40
  boxes.

---

# C. RESEARCH — EACH ENVIRONMENT, SEPARATELY, AGAINST THE WORLD

Every claim below is cited. Where I could not verify a claim I say so in
§C.6 — I have not filled gaps with plausible numbers.

## C.1 Mobile web — what the world does, and what it means here

### C.1.1 How the phone is actually held (and the myth to avoid)

Josh Clark / Steven Hoober's observational study (2,000+ observations) found
people touch the screen in three ways: **one handed 49%, cradled 36%, two handed
15%** — and, in their reach charts, green = easy reach, yellow = a stretch, red =
requires shifting the grip
(https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php).

**What transfers:** the *shape* of the conclusion — the top of a phone screen is
the expensive zone, especially for the 49% one-handed users, and the
bottom-centre is cheap. **What does not transfer:** the "design only for a thumb
arc" genre of advice that grew out of it, and the two-handed figures taken as a
fixed constant — the source itself is explicit that people change grip
constantly while using a device, so a design that *depends* on one grip is
fragile. For Sumaiya (a CV builder where the primary actions are long-form text
entry and a download) the practical consequence is narrow and stated in §D.4:
**primary actions belong in the bottom third; destructive and rare actions may
live anywhere.**

### C.1.2 Bottom navigation vs top navigation

NN/g's mobile-navigation survey describes the tab bar as "a close relative of
the top navigation bar … It can appear at the top (Android mostly) or at the
bottom of the page (iOS mostly)", and notes it shares the drawbacks of the
navigation bar (it consumes screen space and reduces the content area)
(https://www.nngroup.com/articles/mobile-navigation-patterns/).

Platform guidance is unambiguous where it exists: Android's own accessibility
documentation sets the floor — "we recommend that each interactive UI element
have a focusable area, or touch target size, of at least 48dpx48dp. Larger is
even better", with a note that precise input (mouse/trackpad) may be smaller
(https://developer.android.com/guide/topics/ui/accessibility/apps). Apple's
design tips page says "Create controls that measure at least 44 points x 44
points so they can be accurately tapped with a finger", and "Text should be at
least 11 points"
(https://developer.apple.com/design/tips/).

**What Sumaiya already does right:** a five-slot bottom tab bar on mobile
(`components/dashboard/mobile-tab-bar.tsx:26-66`) with the create action in the
dead centre; it is hidden on the editor and studio routes (`:68`) where those
screens own their own bottom chrome (`cv-editor-client.tsx:3692`). This is the
correct model, and §D.4 keeps it.

**What is wrong today:** (a) the tab bar is hidden on the **editor**, which is
the screen where a jobseeker spends the most time, and the editor's own 3-tab
bar is a *different* navigation model in the same session; (b) the bar's own
hit area is not specified anywhere — each tab is `flex-1 flex-col … py-1.5`
with a 22px icon (`mobile-tab-bar.tsx:172-176`) and the create pill is a 36px
`h-9 w-9` span (`:156`); (c) on **marketing** routes there is no bottom
navigation at all — a hamburger (`components/ui/marketing-nav.tsx:151`), so
`/jobs`, `/tools`, `/templates` and `/` are reachable only through a top-right
menu on a phone.

### C.1.3 Touch targets

- **Floor (WCAG 2.2 AA, SC 2.5.8):** "The size of the target for pointer inputs
  is at least 24 by 24 CSS pixels", with a spacing exception for undersized
  targets (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
  That is a *conformance* floor, not a design target — the same page points to the
  stricter SC 2.5.5 (Enhanced) for important controls.
- **Platform target:** 48dp (Android) / 44pt (Apple), cited above.
- **Repo reality:** the utility classes in use cluster at `h-8` (34 uses), `h-9`
  (20), `h-10` (22), `h-12` (12) — i.e. **54 declarations below 44px** where 48
  or higher is asked for. Some are legitimately non-interactive (skeleton bars,
  dividers, decorative chips), but a plain count shows how far the default
  vocabulary is from the floor. `mobile-tab-bar.tsx:156`'s 36px create pill is
  the most-tapped element in the app.
- **Standard:** §D.4. Short version: **44px minimum hit area on touch, achieved
  with padding, not with bigger glyphs.**

### C.1.4 Forms and the keyboard

- `inputmode` "hints at the type of data that might be entered … This allows a
  browser to display an appropriate virtual keyboard"
  (https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode).
  A phone number field without `inputmode="tel"` costs a Tanzanian user a
  keyboard swap on every entry; the CV editor has ~40 numeric/short-text fields
  (dates, levels, scores) and none of the greps show `inputmode` in `apps/web`.
- **iOS auto-zoom:** "If the font-size of an `<input>` is 16px or larger, Safari
  on iOS will focus into the input normally. But as soon as the font-size is
  15px or less, the viewport will zoom into that input"
  (https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/).
  **Already handled**: `globals.css:262-268` forces 16px on text inputs below
  768px with a comment explaining exactly this. Good — but it is a `max-width:
  767px` breakpoint, so a **landscape phone (e.g. 844×390)** gets 12px inputs and
  the zoom. That is a real bug in the current responsive thinking: a phone in
  landscape is still a phone.
- **Keyboard covering the field:** iOS Safari's visual viewport shrinks; the
  app declares `interactiveWidget: "resizes-content"`
  (`app/[locale]/layout.tsx:78`) which is the right lever, but any container
  using `100vh`/`h-screen` (41 occurrences) will still be measured against the
  *layout* viewport. With the keyboard open, a bottom-anchored action inside a
  `h-screen` column lands under the keyboard. See §D.3 (`dvh` rule).

### C.1.5 Viewport and safe areas

- `100vh` on mobile is too tall while the address bar is expanded and "elements
  sized to be 100vh tall will bleed out of the viewport"; the standards answer is
  `svh`/`lvh`/`dvh` (Chrome 108+, Safari and Firefox already had them)
  (https://web.dev/blog/viewport-units).
- `env()` gives access to the device's insets: `env(safe-area-inset-top)`,
  `-bottom`, `-left`, `-right`, with fallback syntax
  `env(safe-area-inset-bottom, 1em)`
  (https://developer.mozilla.org/en-US/docs/Web/CSS/env).
- **Already handled:** `viewportFit: "cover"` (`app/[locale]/layout.tsx:76`) and
  9 uses of `env(safe-area-inset-…)` (e.g. `mobile-tab-bar.tsx:107`,
  `dashboard-header.tsx:85`). **Not handled:** the 41 `h-screen`/`100vh` uses,
  and there is no single `--safe-*` token — each call site repeats a raw
  `env()`, which is how one gets missed.

### C.1.6 Scroll performance

- Animate only `transform` and `opacity`; "Avoid any property that triggers
  layout or paint unless it's absolutely necessary", and use `will-change`
  sparingly ("we don't recommend using it early in your optimization process …
  only if you notice graphics issues")
  (https://web.dev/articles/animations-guide). Repo check: the app's motion
  classes (`.route-enter`, `.rise`, `.snap-rise`, `.swap-*`) are all
  transform/opacity only — **compliant**, and this must stay true of the
  skeleton sweep (background-position on a fixed-size element, i.e. paint, not
  layout — acceptable, and the reason the skeleton block gets `contain`).
- Long lists: `content-visibility: auto` "enables the user agent to skip an
  element's rendering work, including layout and painting, until it is needed",
  gives a "7x rendering performance boost on initial load" in the author's demo,
  with browser support noted as Chrome 85/Edge 85/Safari 18/Firefox 125
  (https://web.dev/articles/content-visibility). Applicable to the job feed on
  a 100-job list (`app/[locale]/(marketing)/jobs/page.tsx:50` — `limit(100)`)
  and to the dashboard grids.
- **The bigger cost is not animation, it is the payload** — §C.5.

### C.1.7 What a Tanzanian jobseeker on a cheap Android phone tolerates

Anchored on measured data, not assumption:

- Tanzania in early 2025: **79.0 million cellular mobile connections = 114% of
  the population**, but only **20.2 million internet users = 29.1% penetration**;
  population 69.5 million, **38.5% urban / 61.5% rural**
  (https://datareportal.com/reports/digital-2025-tanzania). Read together: the
  audience is overwhelmingly **mobile-first and mobile-only**, and roughly
  three in five live outside urban centres where fixed broadband is not the
  access path.
- Therefore (JUDGEMENT, from those numbers): assume intermittent 3G/4G, a
  prepaid bundle purchased in small amounts, a ≤2GB monthly allowance, and an
  entry-level Android with a 720×1600-class screen. There is no published
  statistic I could verify for the *device* mix of this specific audience, so
  the design targets the low end of the Android accessibility guidance (48dp
  targets, no sub-11px text) rather than a specific model.
- Consequences this document enforces: skeleton-first (not spinner-first)
  because the wait is measured in seconds on first load; no layout that depends
  on hover; no interaction that requires two simultaneous pointers; every screen
  legible at 360 CSS px wide with no horizontal scrolling (`tailwind.config.ts`
  declares `xs: 360px` as the smallest screen token, which is the right floor).

## C.2 Desktop — what the world does, and what it means here

### C.2.1 Information density and multi-column

The desktop question is not "make it wider", it is "what does the extra width
buy". Three reference classes, each verified at the source:

- **Document/editor class (Google Docs, Figma).** Both publish a keyboard-first
  model: Google Docs ships a documented shortcut set including a shortcut to open
  the shortcut list itself ("press Ctrl + / (Windows, Chrome OS) or ⌘ + / (Mac)")
  (https://support.google.com/docs/answer/179738); Figma documents creating
  objects by keyboard, including reaching the toolbar with F6/Ctrl-F6 and
  arrowing to a tool (https://help.figma.com/hc/en-us/articles/360040328653).
  **What transfers:** a wide desktop layout is worth building *only* if it also
  becomes keyboard-operable, because width without keys is just more mouse.
- **Creation class (Notion, Canva).** Notion states it "is fully equipped with
  keyboard and Markdown shortcuts so you can do everything you need without ever
  touching your mouse" (https://www.notion.com/help/keyboard-shortcuts) — i.e.
  the density affordance and the keyboard affordance are the same feature.
  Canva publishes a shortcut reference for its editor
  (https://www.canva.com/help/keyboard-shortcuts/).
- **Document-market class (Novoresume).** Their templates page frames the flow
  as "Start by selecting one of our professional resume templates, then use our
  AI resume builder" and advertises "expertly designed layouts, ATS-friendly
  formatting"
  (https://novoresume.com/resume-templates). **What transfers:** pick a template
  first, then edit — which is exactly Sumaiya's flow
  (`template-picker.tsx` → `/editor/cv/new?template=…`), so the desktop IA
  should make the *picker* a wide, browsable gallery and the *editor* a
  three-pane workspace, rather than making both the same width.

### C.2.2 Hover and focus are different capabilities, and CSS knows the difference

- `@media (hover: hover)` tests "whether the user's primary input mechanism can
  hover over elements"; `none` means the primary mechanism "cannot hover at all
  or cannot conveniently hover (e.g., many mobile devices emulate hovering when
  the user performs an inconvenient long tap)" — available across browsers since
  December 2018 (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover).
- `pointer: coarse` = "a pointing device of limited accuracy, such as a finger
  on a touchscreen"; `fine` = "an accurate pointing device, such as a mouse"
  (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer).
- Focus indicators differ by modality on purpose: `:focus-visible` "is useful to
  provide a different focus indicator based on the user's input modality (mouse
  vs. keyboard)" (https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible).
- WCAG 2.2 SC 2.4.11 (AA): "When a user interface component receives keyboard
  focus, the component is not entirely hidden due to author-created content"
  (https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

**Repo reality:** there are **692 `hover:` occurrences and 59 `focus-visible:`**
in `apps/web/{app,components}`. That ratio is the desktop problem in one line:
hover is used as a *primary* state everywhere, and it is a state that 29%
internet-penetration Tanzania mostly cannot produce. Worse, on a touch device a
`hover:` style fires on tap-and-hold and then sticks — the "inconvenient long
tap" the spec names.

**The rule (§D.5):** any visual that is *only* available on hover must have a
non-hover equivalent (always-visible, or on focus, or on tap). Wrap genuinely
desktop-only flourishes in `@media (hover: hover) and (pointer: fine)`.

### C.2.3 Large screens used for value, not whitespace

Concrete repo evidence that this was never designed: **8 uses of `xl:` and 0 of
`2xl:`** across the entire app, and the dashboard's own grid stops at
`xl:grid-cols-4` (`dashboard-cv-grid.tsx:250`). At 2560px wide the sidebar is
still 230px (`dashboard-header.tsx:74`) and the content is capped by
`max-w-7xl` (1280px) with the remainder as empty sand — a 1280px column in the
middle of a 2560px screen.

Design stance (§D.3): on screens ≥1536px the *number of visible things* grows
(4 cards → 5/6, a third editor pane becomes permanently visible, the job feed
shows list + detail side by side). The reading measure (max text width) does
**not** grow — 65–75 characters stays the cap, because that is a legibility
constraint, not a preference.

### C.2.4 Drag and drop, and print/PDF

- **Drag and drop:** the editor already uses `@dnd-kit` with both
  `PointerSensor` and `KeyboardSensor` (`cv-editor-client.tsx:14-19`) — i.e.
  reordering CV sections is already keyboard-operable via
  `sortableKeyboardCoordinates`. That is better than most web editors and must
  not regress. **Gap:** there is no visible affordance to *start* a keyboard
  reorder on desktop (a "move up/down" button pair, or an announced instruction)
  — a `KeyboardSensor` nobody knows about is a keyboard feature nobody has.
- **Print and PDF:** the app exports via client-side rendering
  (`lib/pdf.ts`: `renderElementToPdfBlob`), so a *user-visible* print path is not
  the primary export. But `Ctrl+P` is a reflex on desktop and the browser will
  happily print the *app chrome* today: there are **0 `print:` prefixes in
  `apps/web`**. The standards tooling is trivial — a print stylesheet via
  `<link media="print">`, plus `@media`/`@page` for page margins
  (https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing).
  Minimum viable rule: on `/cv/[slug]` and the editor preview, `@media print`
  hides the chrome and prints the sheet at its true A4 ratio (794×1123 CSS px —
  the ratio already used by `cv/[slug]/loading.tsx:10`). Deeper PDF work
  (`@page { size: A4; margin: 0 }`) is a bonus, not the fix.
- **Multi-tab:** a document edited in two tabs currently diverges silently.
  `BroadcastChannel` "represents a named channel that any browsing context of a
  given origin can subscribe to. It allows communication between different
  documents (in different windows, tabs, frames or iframes) of the same origin"
  (https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel). Minimal
  version: on save, broadcast `{ docId, version }`; another tab holding an older
  version shows a non-blocking "This CV changed in another tab — reload" line.
  **This is a gap, not a priority** (§E.9) — named here because it is a
  *desktop-only* class of bug that a phone-first design would never surface.

## C.3 What transfers to this product, product by product

| Product | What I verified | What transfers | What does **not** transfer |
| --- | --- | --- | --- |
| Canva | Publishes an editor shortcut reference (https://www.canva.com/help/keyboard-shortcuts/) | The editor-shaped skeleton idea: their loading is the canvas, not a generic spinner (JUDGEMENT from using the product; not verified by source) | Their infinite canvas and template volume. Sumaiya has one artefact (A4) and should keep the picker a *list of pages*, not a design surface |
| Figma | Keyboard object creation incl. F6/Ctrl-F6 to the toolbar (https://help.figma.com/hc/en-us/articles/360040328653) | Full keyboard operation of a canvas-like surface | Their multi-panel density. Nothing in a CV editor justifies a 4-pane desktop layout; the 3 panes Sumaiya has (`cv-editor-client.tsx:3065-3184`) is the right ceiling |
| Notion | "keyboard and Markdown shortcuts so you can do everything you need without ever touching your mouse" (https://www.notion.com/help/keyboard-shortcuts) | Keyboard-first as a *product promise*, and the rule that a wide layout must ship with keys | Their document-scroll model (an infinitely long page). A CV is a page; pagination is the product |
| Zety / Novoresume | Novoresume: "Start by selecting one of our professional resume templates, then use our AI resume builder", "ATS-friendly formatting" (https://novoresume.com/resume-templates) | Template-first flow; ATS-safe formatting as a marketing promise (Sumaiya already has an ATS panel, `components/editor/ats-panel.tsx`) | Their pricing/paywall funnel before download. Sumaiya's direction is free-and-unlocked (`CLAUDE-QUEUE-2026-09-20.md` §0.7 context: "Payments retired — everything is free") |
| Google Docs | Ctrl+/ opens the shortcut list (https://support.google.com/docs/answer/179738) | A **discoverable** shortcut layer — the shortcut list itself is a feature | Its document-diff/versioning surface as a first-class screen |
| Stripe / Linear | **NOT VERIFIED.** `linear.app/method` returned a client-rendered shell (1,047 chars of text) and I did not extract verifiable statements about either | Nothing is claimed (see §C.6) | — |

## C.4 The one thing the research changes about the plan

The mobile findings (49% one-handed, bottom-heavy reach, 48dp/44pt target floor,
the 16px iOS zoom floor) and the desktop findings (hover is a *capability query*,
density must buy keyboard operability) point at the same conclusion from
opposite directions:

> **Mobile web is not a narrower desktop, and desktop is not a wider phone. They
> are the same product with two different *commitments*: mobile commits to the
> thumb and to the download; desktop commits to the keyboard and to the pane.**

That boundary is made explicit in §D.6.

---

## C.5 Data cost — measured, not estimated

The audience is metered (§C.1.7), so the payload *is* a design parameter. These
are measurements taken from the live site on 2026-09-20 with
`curl --compressed` (wire bytes), from this machine in Nairobi-region network
conditions — they are this app's real numbers, not an industry statistic:

| Page | HTML on the wire | JS chunks in the first-load HTML | JS on the wire (sum of referenced chunks) | Total first load | TTFB |
| --- | --- | --- | --- | --- | --- |
| `/en` (marketing home) | 25,553 B | 32 | 384,898 B | **≈ 401 KiB** | 0.68 s |
| `/en/templates` | 23,699 B | (same shell) | — | ≈ 400 KiB | 0.72 s |
| `/en/jobs` | 10,152 B | (same shell) | — | ≈ 390 KiB | 0.90 s |
| `/en/tools` | 11,036 B | — | — | — | 0.84 s |
| `/en/pro` | 18,572 B | — | — | — | 1.29 s |

Derived (arithmetic only, no invented inputs): 401 KiB per page view means
**~2,616 page views per 1 GiB** of bundle. The largest single chunk is
`/_next/static/chunks/1dd3208c-….js` at **55,128 B** on the wire, and
`polyfills-42372ed130431b0a.js` is **41,343 B** — 10% of the JS payload is
polyfills for browsers a cheap-Android audience may not even be running.

**What this means (JUDGEMENT, arithmetic shown):**

1. On a 400 kbps effective link a cold marketing page is **~8 s** of transfer
   before first paint. The skeleton is not polish; it is most of the first
   impression. That is the whole reason Defect 1 matters.
2. 32 separate chunk requests on a high-RTT link costs more than the bytes
   (each request risks a second round trip). Reducing *requests* is as valuable
   as reducing bytes for this audience.
3. The `<title>` of `/en/templates` is **"Sumaiya designs it for you"** while
   its `generateMetadata` sets `tr.title` from `translations[lang].templates`
   (`app/[locale]/(marketing)/templates/page.tsx:19`) — a mismatch between the
   intended title and the served one, found while measuring. **Reported, not
   diagnosed** (it may be an intentional override elsewhere); it is not a
   responsive defect.

Commands (verbatim) are in §F.2.

## C.6 What I could NOT verify (stated, not papered over)

- **Stripe and Linear.** Both were named as reference products. `linear.app/method`
  is client-rendered and returned 1,047 characters of extracted text; I did not
  obtain a verifiable statement about either product's responsive behaviour.
  **No claim is made about them in this document.** Anyone extending §C.3 should
  verify at the source before citing.
- **Zety.** `https://zety.com/resume-builder` and `https://www.zety.com/resume-builder`
  both failed to fetch (curl exit 000 — blocked/timed out). Their competitor
  Novoresume was used instead (verified), and Zety's behaviour is **not**
  characterised here.
- **m3.material.io** and **developer.apple.com/design/human-interface-guidelines**
  are JavaScript shells to a non-browser fetch ("This website requires
  JavaScript"). The 48dp and 44pt figures were therefore taken from source pages
  that *do* render as static text: developer.android.com and
  developer.apple.com/design/tips/ (both cited in §C.1.2).
- **No browser-interaction measurements on the live site.** A browser-driving
  session on `https://sumaiya.app/en/templates` timed out (420 s), so the tap-target
  and horizontal-overflow figures for the *live* pages are **not measured**.
  Everything in §C.1.3 and §C.2.2 is a count of source occurrences, which is a
  weaker claim and is labelled as such.
- **No published device-mix statistic for the Tanzanian jobseeker audience** was
  found and verified, so no specific phone model is asserted as the target
  (§C.1.7 labels the profile a JUDGEMENT derived from the cited connectivity
  data).

---

# D. THE SYSTEM

## D.1 Breakpoints, in actual pixels

`apps/web/tailwind.config.ts` already declares the right ladder. The standard
now says what each rung is *for*, so a `md:` class is never added out of habit:

| Token | Min width | Named environment | What it is for |
| --- | --- | --- | --- |
| (none) | 0 | **small phone** | the floor. 360px must be complete, not truncated |
| `xs:` | **360px** | phone (declared, rarely used) | reserved for the few places that need a slightly roomier phone (2-up card grids) |
| `sm:` | **640px** | large phone / small tablet portrait | still a **touch** environment: single column, bottom nav still present |
| `md:` | **768px** | tablet portrait / small laptop | the **first** desktop tier: sidebar appears (`dashboard-header.tsx:74` `md:flex`), two-column content begins |
| `lg:` | **1024px** | desktop / laptop | the **workhorse** desktop tier: the editor's three panes (`cv-editor-client.tsx:3068,3184`), sidebar layouts, the picker's 4-up gallery |
| `xl:` | **1280px** | large desktop | the dashboard's 4-up grid (`dashboard-cv-grid.tsx:250`), wide tables |
| `2xl:` | **1536px** | big desktop / 2560 screens | **newly used**: 4→5/6 cards, a docked job-detail pane, editor panes at comfortable widths |

**Rules that make the ladder honest:**

1. **Layout changes at `md` and `lg` and `2xl` — not in between.** No ad-hoc
   `@media (min-width: 900px)` anywhere; if a real layout need exists at 900px,
   it belongs to `lg` with a `max-w` constraint, not to a new breakpoint.
2. **Orientation is not a breakpoint.** A phone in landscape is `max-height`, not
   `min-width`. The 16px input rule (`globals.css:262`) must key off
   `(max-width: 767px) and (pointer: coarse)` — or, better,
   `(hover: none) and (pointer: coarse)` — so landscape phones keep it. **This is
   a bug fix, not a preference.**
3. **`md:` means "touch is still possible".** Tablets in portrait are `md:` and
   have no hover; so `md:` may introduce a sidebar but may not introduce a
   hover-only affordance.
4. **Do not use `max-sm:`/`max-md:` variants** (0 uses today). Rules are written
   mobile-first so that the absence of a class means "the phone behaviour".

## D.2 What changes per breakpoint, and what deliberately does not

| Concern | 0–639 (phone) | 640–767 | 768–1023 (tablet/small laptop) | 1024–1279 | 1280–1535 | ≥1536 |
| --- | --- | --- | --- | --- | --- | --- |
| Navigation | **bottom tab bar** + top header (avatar) | same | **left sidebar 230px**, no bottom bar | sidebar | sidebar | sidebar |
| Marketing nav | hamburger, top | hamburger | inline links (today) | inline | inline | inline |
| Dashboard grid | 2 up, **3 skeleton cards** | 2 up | 2 up → 3 at top of range | 3 up | 4 up | **5–6 up** (`2xl`) |
| Editor | **one pane at a time** + 56px tab bar | one pane | one pane (today) → two panes at 1024 | **three panes** 290 / flex / 280 | three panes, wider | three panes + a 4th "history/versions" rail (only if built) |
| Templates picker | 1 up, list-like | 2 up | 3 up | 4 up | 4 up + sticky family filter | 5 up |
| Job feed | list only, filters in a sticky bar | list | list + sticky filter column 260px | list + filter column | list + filter column | **list + detail pane** (240px/1fr/1fr) |
| Forms | 1 column, 16px inputs, 44px targets | 1 col | 2 col for label/value pairs | 2 col | 2 col, `max-w-2xl` centred | `max-w-2xl` centred, **content column does not grow** |
| Modals | bottom sheet, `rounded-t`, `max-h-[90dvh]` | bottom sheet | centred dialog `max-w-*` | centred | centred | centred, still `max-w-*` |
| Tables | **cards** (see §E.3) | cards | table with horizontal scroll allowed | table | table | table, 5–6 columns comfortable |
| Tooltips / hover | **none** | none | only if also on focus | hover + focus | hover + focus | hover + focus |
| Print | sheet only, no chrome | same | same | same | same | same |

**What deliberately does NOT change:**

- **Type scale and reading measure.** Body text is 14–16px at every width; a
  paragraph is capped at ~70 characters at every width. Desktop does not get
  "smaller text for more content" — that is the density trap that makes a
  desktop UI unreadable for the 38.5%-rural / low-vision part of the audience.
- **Minimum touch target.** 44px at every width, including desktop: the same
  product is opened on a touchscreen laptop.
- **The bottom tab bar's existence on mobile.** It is the product's spine on a
  phone (§D.4); it is replaced by the sidebar at `md:`, not duplicated.
- **The A4 ratio of the artefact.** 794×1123 CSS px, everywhere, in the skeleton
  and in the preview (`cv/[slug]/loading.tsx:10`, `dashboard-cv-grid.tsx:116`).
- **Colour, radius, shadows.** No responsive styling of identity tokens.
- **Every number in `docs/MOTION-STANDARD-2026-09-20.md`.** Motion does not get
  faster on desktop or slower on mobile. Same tokens.

## D.3 Desktop information architecture — which screens earn a wide layout

The test for "earns a wide layout": *does the second column change what the user
can do, or does it just move whitespace around?* Judged per screen:

| Screen | Verdict | Wide layout |
| --- | --- | --- |
| **CV editor** | **earns it** (already built) | three panes: sections (290px) │ the A4 page │ design (280px) — `cv-editor-client.tsx:3068,3118,3184`. At ≥1536 the two rails go to 320/300px and the page gets a comfortable gutter |
| **Cover letter / letter / business-card editor** | **earns it** | same shape — the same component family already shares the pattern |
| **Templates picker** | **earns it** | 4–5 up gallery with a **persistent family filter rail** (today the family picker and the grid are stacked, so choosing a family scrolls the grid off screen) |
| **Job feed** | **earns it at ≥1536 only** | below that, a 260px filter rail + list; at `2xl`, list + detail so "apply" does not lose the list scroll position |
| **Dashboard** | **earns it** (already: sidebar + grid) | 5–6 up at `2xl`; the count strip goes horizontal above 1024 |
| **Assistant** | **earns it, narrowly** | at `lg`+, a 2-pane: transcript + a **context rail** (active CV, matched jobs, pending confirmations) — the data is already assembled server-side (`app/(app)/assistant/page.tsx:52-56`) and is currently hidden behind chips |
| **Settings** | **does NOT** | `max-w-2xl` centred at every width (`settings/page.tsx:40`). Nothing is gained by stretching a form |
| **Auth** | **does NOT** | one card, centred, 400px, every width |
| **Public CV `/cv/[slug]`** | **does NOT** (the artefact is the layout) | the sheet at 794px wide with a toolbar; on a wide screen it is simply centred with sand around it — that is correct |
| **Marketing home / pro / tools** | **partially** | hero copy stays `max-w-2xl`; the *demo* (template gallery strip, job card preview) may go 2-up at `md`. No full-bleed hero at 2560px — the audience is 29% internet penetration, and a hero sized for a 27" monitor is a hero nobody sees |
| **Admin tables** | **earns it** | already tables; they need the mobile card fallback (§E.3) |

**One sentence version:** the *work* screens (editor, picker, feed, dashboard,
assistant) earn width; the *reading* screens (settings, auth, public CV,
marketing copy) do not.

## D.4 The mobile-web navigation model

**Keep** the five-slot bottom tab bar (`mobile-tab-bar.tsx:26-66`) — it is the
correct pattern (§C.1.2) — and fix four things:

1. **It must not vanish on the editor.** Today `mobile-tab-bar.tsx:68` hides it on
   `/editor` and `/studio`, and the editor renders a *different* three-tab bar
   (`cv-editor-client.tsx:3692`). Two navigation models in one session, on the
   screen where users spend the most time. **Resolution:** the editor's three tabs
   are *pane selection*, not navigation, so they belong — but they must be
   visually subordinate to the product's one bar: same height (56px), same surface,
   and the editor keeps the bottom bar's create-slot as its "Done/preview" action.
   At minimum the two bars must never be stacked, and the editor's tab bar must
   carry the same labels' language rules as the main bar.
2. **Marketing needs a bottom anchor too.** `/jobs`, `/tools`, `/templates`, `/`
   are currently reachable only through a hamburger (`marketing-nav.tsx:151`) in
   the top-right — the least reachable corner for a one-handed user (§C.1.1). Add
   a **3-slot bottom bar on marketing routes** (Nyumbani · Ajira · Unda) whose
   third slot is the same primary action the app bar has. This is the single
   highest-value mobile-web change after the skeletons, because it turns the
   marketing site from "a website with a menu" into "the same product".
3. **Minimum hit area: 44×44 CSS px, enforced by padding.** For the tab bar:
   `min-height: 56px` on the row, each tab `min-width: 64px`, `min-height: 48px`,
   and the create slot's visual 36px pill (`:156`) stays 36px *visually* inside a
   56px touch area. Icon 22px, label 10px → both stay, but the label must never
   be the only cue (icons stay).
4. **Safe area is a token, not a copy-paste.** Add to `globals.css`:
   ```css
   :root {
     --safe-t: env(safe-area-inset-top, 0px);
     --safe-b: env(safe-area-inset-bottom, 0px);
     --safe-l: env(safe-area-inset-left, 0px);
     --safe-r: env(safe-area-inset-right, 0px);
     --tabbar-h: 56px;
     --tabbar: calc(var(--tabbar-h) + var(--safe-b));
   }
   ```
   and then: every scrollable page under the tab bar gets
   `padding-bottom: var(--tabbar)`, not a magic `pb-28`. (Today
   `cv/[slug]/loading.tsx:7` uses `pb-28` = 112px, which is a guess that happens
   to work on one device.)

**Keyboard/forms on mobile:**

- 16px inputs on **all** coarse-pointer devices, not just `max-width: 767px` (§D.1.2).
- `inputmode` on every field that has a keyboard type: `tel` for phone,
  `email` for email, `numeric` for years/levels/percentages, `url` for
  linkedin/website (`inputmode` cited §C.1.4). `enterkeyhint="next"` between
  fields in a group, `enterkeyhint="done"` on the last.
- **Sticky action above the keyboard:** any form with a save button uses
  `position: sticky; bottom: var(--tabbar)` inside a `dvh`-sized container, never
  `h-screen` (41 occurrences today; see §D.5 rule 3).
- Never `autofocus` on mobile: it raises the keyboard before the user has seen
  the screen.

## D.5 The desktop rules that keep it from being a stretched phone

1. **Hover is an enhancement, never the only state.** Pattern:
   ```css
   @media (hover: hover) and (pointer: fine) {
     .card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
   }
   .card:focus-visible { outline: 2px solid var(--ember); outline-offset: 2px; }
   ```
   Every interactive element must be fully usable with keyboard only, and its
   focus ring must satisfy WCAG 2.4.11 (§C.2.2). 692 `hover:` occurrences is the
   audit list; the rule is not "remove hover", it is "an element that is *only*
   discoverable on hover is a defect".
2. **Keyboard reachability is part of the desktop deliverable for any screen that
   gets a wide layout.** Minimum: tab order follows visual order; the wide layout
   never creates a tab trap (modals already need a focus trap — see §E.4);
   shortcut hints are discoverable (`kbd` hints in the picker, plus a `?` sheet).
   The editor already ships `KeyboardSensor` (`cv-editor-client.tsx:14-19`) but
   with no visible affordance — add move-up/move-down buttons to each section row.
3. **Viewport height, everywhere:** replace `h-screen`/`min-h-screen` with `dvh`
   on any element that must fill the visual viewport
   (`min-h-dvh`, `h-dvh`, `max-h-[90dvh]`). Already half-adopted (18 `dvh` uses,
   e.g. `cv-editor-client.tsx:893`), but 41 `h-screen`/`100vh` remain. `min-h-screen`
   on a *page wrapper* is acceptable on desktop and wrong on mobile; use
   `min-h-dvh`.
4. **Large screens buy content, not margins.** `max-w-7xl` remains for reading
   columns; grids and the feed use `2xl:` tiers instead of stretching. A 2560px
   screen must show more cards, not bigger cards.
5. **Drag and drop gets a non-drag path on every breakpoint** (move up/down
   buttons), because drag is unreliable on touch and invisible on keyboard.
6. **Print/PDF:** `@media print` on the public CV and the editor preview hides
   chrome and prints the sheet at A4 (`794×1123`); the existing client-side PDF
   export (`lib/pdf.ts`) stays the primary path.
7. **Multi-tab:** last-writer-wins is currently silent. Minimum: a
   `BroadcastChannel` (`localStorage` event as fallback) that shows "updated in
   another tab" rather than losing work (§C.2.4, §E.9).

## D.6 The boundary: "the same product, adapted" vs "a different product"

**Same product, adapted (must stay recognisably one thing):**

- Identity: mark, type, colour, radius, shadows, the A4 artefact, Swahili-first
  copy, the AI assistant's voice.
- Content model and data: same CVs, same jobs, same profile, same applications.
- Motion tokens: identical numbers.
- Every capability is *reachable* from every environment. A user who starts a CV
  on a phone can finish it on a desktop, and vice versa. **Nothing is
  desktop-only or mobile-only except where a device genuinely cannot do it.**

**A different product (deliberately different, and named here so nobody "fixes"
the difference):**

| Environment | What it is | What it is NOT |
| --- | --- | --- |
| **Android app (native)** | the offline-first product. Works with no connection. Camera, share-APK, local store | not a web view; not required to match web's IA |
| **Mobile web** | the *reachable* product: a phone browser, on a metered connection, often one-handed. Bottom navigation, skeletons over spinners, minimal payload, no hover, no drag-only interactions, every screen at 360px | not a shrunk desktop. It does not get the three-pane editor, the wide feed, or admin tables |
| **Desktop web** | the *work* product: keyboard-first, multi-pane, dense, uses width for simultaneous views, print-aware | not a stretched phone. It does not get a bottom tab bar, bottom sheets (below `md`), or thumb-sized spacing on a 27" monitor |

**Where the two web environments differ, it is because the input device differs
(thumb vs keyboard+pointer) — never because the user is treated as a lesser
user.** Concretely: a feature that exists on desktop must exist on mobile web in
*some* form; if it cannot, that is a bug to log, not a design decision to enjoy.

## D.7 Type scale and target minimums (the enforceable numbers)

| Token | Mobile | Desktop | Floor from |
| --- | --- | --- | --- |
| Body text | 16px | 16px | legibility; 11pt Apple minimum (§C.1.2) |
| Secondary/meta | 13px | 13px | — |
| Label / tab label | 11px | 11–12px | Apple: text "at least 11 points" |
| **Absolute minimum text** | **11px** | **11px** | Apple (§C.1.2). Today's 10px tab labels (`mobile-tab-bar.tsx:180`) and 10px hints (`shared-profile-panel.tsx:142`) are **below the floor** |
| Form input font | 16px | 14px | iOS zoom floor 16px (§C.1.4) |
| Touch target | **44×44 min**, 48 preferred | 44×44 (touch laptops) | WCAG 2.5.8 24px is the conformance floor; Android 48dp / Apple 44pt is the design floor (§C.1.3) |
| Line height | 1.5 body | 1.5 body | — |
| Reading measure | ≤ 70ch | ≤ 70ch | does not change with width |

---

# E. GAPS FOUND — places where neither environment was considered

The user asked for more than the loading fix. This is the whole-surface audit.
Each item: what is there, why it is a gap, what to do. Severity uses the same
labels as §A.

## E.1 Forms — the largest untouched surface (H)

- 14 `<form>` elements and 90 `<label>` elements across `apps/web`, but only
  **2** occurrences of `aria-invalid` or `aria-describedby` combined. So when a
  field fails validation the message is visually adjacent and programmatically
  invisible — no screen reader user learns which field failed. That is a
  conformance and a usability defect, on the product's core task (filling a CV).
- **No `inputmode` anywhere** (§C.1.4) — the phone keyboard is wrong for every
  numeric and phone field in the editor.
- **Two-column labels:** the editor's field rows are label-above-input at every
  width, so a desktop user gets the phone's vertical rhythm: a 1280px-wide pane
  with one input per row and 200px of empty space beside it. The `md:` two-column
  form is in §D.2 and is not implemented.
- **Save affordance:** `cv-editor-client.tsx` saves with a header button; on a
  phone the header scrolls out of reach in a long form, and there is no sticky
  save. Fix: sticky action bar above `var(--tabbar)` when the form is dirty.
- **`AutoTextarea`** (`components/ui/auto-textarea.tsx`) is used in the editor;
  it must not fight the mobile keyboard (`interactiveWidget: "resizes-content"`
  is declared, `app/[locale]/layout.tsx:78`).

## E.2 The editor canvas (H)

- The three-pane desktop layout exists (`cv-editor-client.tsx:3065-3184`) but
  **only from `lg:` (1024px)**. A 900px-wide laptop — and every iPad in
  landscape — gets the phone's one-pane-at-a-time model with a bottom tab bar.
  That is the "phone layout stretched" complaint in its most expensive form,
  because the editor is where the work happens.
- **The canvas is scaled by CSS transform** (`components/dashboard/scaled-preview.tsx`,
  `components/templates/template-canvas.tsx`) with `designW={794} designH={1123}`.
  On a phone, an A4 page at 794px design width scaled into ~350px is a 44%
  scale: 12px body text on the CV renders at ~5px. **The user cannot read their
  own CV on the phone they are writing it on.** Fix options (pick one, in order):
  1. zoom affordance: a "read" mode that scales the *content* to fit width with
     a horizontal pan for the rest, plus pinch-zoom enabled
     (`touch-action` is currently undeclared — 0 occurrences, so `pinch-zoom` is
     at the browser default but nothing guarantees it),
  2. `content-visibility: auto` + a fit-width mode that reflows sections rather
     than scaling,
  3. at minimum, a visible read-at-full-size toggle that renders the page at 1:1
     with scroll, accepting horizontal panning.
  This is the single biggest *mobile* defect after the skeletons, and it is not
  a skeleton problem at all — it is the artefact's legibility.
- **"Boot the editor" has no skeleton** (R6/D3) — the screen with the largest
  client bundle is the one with the emptiest wait.

## E.3 Tables (M, admin-only in practice)

- `app/(app)/admin/page.tsx:78` renders a `<table className="w-full text-sm">`
  with no wrapper: on a 360px screen a 5-column table either overflows the body
  (horizontal page scroll — which the standard forbids) or crushes the columns.
  Its sibling `app/(app)/admin/users/page.tsx:47,51` *does* wrap in
  `overflow-x-auto` and sets `min-w-[560px]` — so the pattern exists and was
  applied inconsistently. Fix: one `<DataTable>` component that renders a table
  at `md:` and labelled cards below, with `overflow-x-auto` as the fallback.
  Every admin table then inherits it.
- **No table anywhere in the audience-facing product** (grep: all `<table>` uses
  are under `app/(app)/admin/`) — so this is a *future* gap: the moment
  applications or jobs get a tabular view, the mobile card fallback must ship
  with it in the same commit.

## E.4 Modals and sheets (H)

- 25 `fixed inset-0` modal/drawer surfaces; only **7** files contain
  `aria-modal` (`applications-grid.tsx`, `mobile-tab-bar.tsx`,
  `ai-suggestion-modal.tsx`, `create-entry-options.tsx`, `share-cv-modal.tsx`,
  `targeted-cv-drawer.tsx`) and **zero** occurrences of `focus-trap`/`inert`.
  So: keyboard focus escapes into the page behind the modal, and a screen reader
  is not told that a dialog opened. This matters most on desktop (where keyboard
  is the point) and it is exactly the class of bug the user meant by "the desktop
  environment was not given thought to".
- **Sheet vs dialog consistency:** the good pattern exists —
  `applications-grid.tsx:469` uses `max-h-[90vh] … rounded-t-card-lg sm:rounded-card-lg`
  with `pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]`; `cv-editor-client.tsx:893,2723,2771`
  uses `max-h-[92dvh]`. Others use `max-h-[90vh]` (v **d** vh — the letter
  matters, §D.5 rule 3) or nothing. Fix: one `<Sheet>` primitive for below `md`
  and one `<Dialog>` for `md:+`, both with a focus trap, `role="dialog"`,
  `aria-modal`, `aria-labelledby`, an Escape handler, a scroll lock
  (`lib/hooks/use-body-scroll-lock` already exists and is used by the tab bar),
  and `max-h-[90dvh]`.
- **Nested modals in the editor are 90–92dvh sheets with `overflow-hidden`**
  (`cv-editor-client.tsx:893`): with the on-screen keyboard open on a phone, the
  inner textarea can be scrolled out of reach. Needs a keyboard-aware inset
  (`visualViewport` height, or simply `max-h-[70dvh]` when a field inside has
  focus).

## E.5 The template picker (M)

- Two components implement the same thing (`template-picker.tsx` and
  `template-selection-modal.tsx`) with the same spinner (`:125` / `:131`) and the
  same grid — and one of them uses `bg-white`/`gray-*` Tailwind colours
  (`template-selection-modal.tsx:87,89`) while the rest of the app uses the warm
  `cream`/`sand`/`espresso` tokens. It is a *visible* inconsistency on the
  picker, which is the screen a new user sees first.
- The family filter and the grid are stacked, so choosing a family on mobile
  scrolls the grid below the fold. Fix: family chips sticky above the grid on
  mobile; filter rail at `lg:` (§D.3).
- No keyboard affordance: cards are `<button>`/`<a>` (good) but there is no
  focus ring standard visible in this file, and no `kbd` hints.

## E.6 Error states (H — and they are English)

- `app/global-error.tsx` is a bare inline-styled page: `background: "#fff"`,
  `minHeight: "100vh"`, `<html lang="en">`, and the copy is
  **"Something went wrong"** — hardcoded English, no Swahili, no logo, no
  support route. For a **Swahili-first** product (the standing rule in
  `docs/SWAHILI-STANDARD-2026-09-20.md`; see also `docs/PRODUCT-DIRECTION-2026-09-20.md`),
  the page shown when everything else has failed is the one page that must not
  be in the wrong language.
- `app/[locale]/error.tsx` picks its language with
  `document.cookie.includes("lang=sw")` (`:33`) — a substring test on the whole
  cookie string. It works by luck; a cookie named `xlang=sw` or a value
  containing that substring changes the language. Fix: read the language from
  the same context the rest of the app uses (`lib/i18n/context`), with the cookie
  as a documented fallback only.
- Both use `min-h-screen`/`100vh` (41 occurrences app-wide, §D.5).
- **Nothing in the error path is a designed environment**: neither page has a
  mobile-specific layout (a short, thumb-reachable retry) or a desktop layout
  (an explanation with the digest visible for support). Fix: the error surfaces
  get the same two-treatment rule as everything else, and the digest is shown
  in a copyable form on `md:+`.

## E.7 Empty states (M)

- `components/ui/empty-state.tsx` is a good, simple shape
  (icon · title · message · action) but is used in only **two places**
  (`app/(app)/(dashboard)/dashboard/page.tsx`,
  `app/[locale]/(marketing)/jobs/page.tsx`). Everywhere else — the CV grid, the
  cover-letter grid, the business-card grid, the letter grid, the applications
  grid, the template picker family and the templates gallery — the empty case is
  either ad-hoc or absent. On a brand-new account the dashboard is therefore a
  *grid of nothing* plus a dashed "add" tile
  (`dashboard-cv-grid.tsx:256` `min-h-[220px]`), which is the visual equivalent
  of the loading complaint.
- Fix: `EmptyState` must be the only empty treatment, must accept the four
  variants that actually exist (nothing yet / nothing matched a filter /
  nothing after an error / nothing shared), and must arrive with `.swap-in` like
  content does (§A.5) — because an empty state **is** the loaded result.
- The `EmptyState` action button has no `focus-visible` style
  (`empty-state.tsx:24` uses only `bg-ember hover:bg-ember-hover`), so a
  keyboard user cannot see where they are.

## E.8 "Responsive" that is merely unstyled, and vice versa (M)

- **`bg-white` on a themed card.** `components/editor/template-selection-modal.tsx:87`
  uses `bg-white` in a dark-capable app; `globals.css` defines a dark theme
  (`darkMode: "class"`, `tailwind.config.ts`, plus `dark:` variants used widely).
  Several editor surfaces mix raw Tailwind greys (`text-gray-400`,
  `template-picker.tsx:127`) with the token palette. These read as "not designed"
  in both environments.
- **`max-w-7xl` without an `xl:`/`2xl:` plan** — the pattern that produces the
  stretched look at 2560px (§C.2.3).
- **41 `h-screen`/`100vh`** — "responsive" in the sense that the CSS is valid,
  not in the sense that it works in a mobile browser with a dynamic toolbar.
- **`pb-28`** (`cv/[slug]/loading.tsx:7`) — a magic number standing in for
  `var(--tabbar)` (§D.4.4).
- **10px text** (`mobile-tab-bar.tsx:180`, `shared-profile-panel.tsx:142`,
  `targeted-cv-drawer.tsx` hint) is below the 11px floor (§D.7).
- **`animate-pulse` as a skeleton** (`dashboard-skeleton.tsx:9`,
  `career-profile-card.tsx:139`, `targeted-cv-drawer.tsx:275`,
  `shared-profile-panel.tsx:142`) where the app already owns `.skeleton`
  (`globals.css:87-91`) — the right class exists and is used by nothing.
- **A `dark:` variant for nearly every surface but no dark-mode *test*.** In
  both environments the dark theme is the one nobody looks at. Not this
  document's scope, but it is the same class of gap: a treatment applied by
  convention rather than by design.

## E.9 Environment-blind by definition (L, named so they are not forgotten)

- **Multi-tab** (§C.2.4): silent last-writer-wins.
- **Print** (§C.2.4): 0 `print:` rules; `Ctrl+P` prints the chrome.
- **Install/PWA:** `components/install-prompt.tsx` and `components/ios-install-hint.tsx`
  exist (good); they must not compete with the new mobile bottom bar for the
  bottom of the screen — the install prompt must sit *above* `var(--tabbar)`.
- **Zoomed text / large font settings:** the app sets `initialScale: 1` and no
  `maximumScale` (correct — never disable zoom, `app/[locale]/layout.tsx:73-79`);
  but reflow at 200% zoom (WCAG 1.4.10) has never been tested. Test it at 360px
  with 200% text size as part of the responsive QA (§F.1).
- **Reduced motion + reduced data:** `prefers-reduced-motion` is honoured
  (`globals.css:203-208`), but `prefers-reduced-data` is not, and for this
  audience that is at least as relevant — a user on a metered bundle should be
  able to turn off images/animations. Logged as a gap, not scheduled.

---

# F. Verification, evidence, and open questions

## F.1 How to verify this standard (the acceptance gates)

1. **Loading:** for each of the 12 surfaces in §A.1, slow the network to ~400 kbps
   / 400 ms RTT and screenshot at 0.5s, 1.5s, 3s. Each must show a shape
   recognisable as that screen. **No screenshot may show an empty content
   region** (that is D2).
2. **Hand-off:** screen-record the skeleton→content swap; the two-frame test in
   §A.7 must return "interpolated", never "pop".
3. **CLS = 0** on `/dashboard`, `/jobs`, `/cv/[slug]` at 390×844 and 1440×900.
4. **Breakpoints:** screenshot the editor, dashboard, picker, feed and settings at
   **360, 414, 640, 768, 1024, 1280, 1536, 1920, 2560** px. Assert: no horizontal
   page scroll at any of them (`document.documentElement.scrollWidth <= clientWidth`).
5. **Touch:** at 390×844 every interactive element's hit box ≥ 44×44
   (`getBoundingClientRect()` sweep, the check that the timed-out browser session
   was for).
6. **Keyboard:** tab through the editor, picker, a modal and settings with no
   mouse; focus must be visible at every step (WCAG 2.4.11), never trapped
   behind a modal, and the section reorder reachable without drag.
7. **Reduced motion:** with the OS setting on, no shimmer, no rise, and every
   screen still legible.
8. **Zoom:** 200% text at 360px, no content loss (WCAG 1.4.10).
9. **Print:** `Ctrl+P` on `/cv/[slug]` prints the sheet, not the toolbar.

## F.2 Commands used to produce the evidence in this document

```bash
# Repo inventory (all counts in §0, §C.1.3, §C.2.2)
cd /c/Users/hamis/projects/sumaiya/apps/web
for p in "sm:" "md:" "lg:" "xl:" "2xl:" "h-screen\|100vh" "hover:" "focus-visible:" "print:" "touch-action"; do
  echo "$p : $(grep -ro "$p" --include=*.tsx --include=*.ts components app | wc -l)"
done
find app -name "loading.tsx" -o -name "template.tsx"

# Live payload measurements (§C.5) — wire bytes, gzip on
BASE=https://sumaiya.app
curl -s -m 25 --compressed -o h.html -w "%{size_download} %{time_starttransfer}\n" $BASE/en
grep -o '/_next/static/chunks/[a-zA-Z0-9_./-]*\.js' h.html | sort -u > chunks.txt
total=0; while read -r p; do
  b=$(curl -s -m 25 --compressed -o c.js -w "%{size_download}" "$BASE$p"); total=$((total+b)); done < chunks.txt
echo "chunks=$(wc -l < chunks.txt) js_wire_bytes=$total"

# Market sources: fetched with curl and read as text (the extractor API returned
# 403 for several of them; curl + a tag-stripping pass was used instead)
curl -sL -A "Mozilla/5.0 … Chrome/124" <url> -o page.html
```

## F.3 Open questions this document does not answer

1. **Which chunk is the editor's?** I measured *marketing* first loads. The
   editor's bundle size was not measured, so D3's urgency is argued from
   structure (a large client component tree), not from a number. Measure it
   before deciding whether to split it.
2. **Does `/templates` really serve the wrong title?** §F.2's curl run reports the
   observed `<title>`; the cause was not traced.
3. **Is `md:` (768px) the right first desktop tier?** It is where the sidebar
   already appears (`dashboard-header.tsx:74`); a 230px sidebar plus content at
   768px leaves 538px, which is tight. `lg:` as the desktop tier is the safer
   choice (JUDGEMENT) — this needs a look at a real 768px device, which I did not
   have.
4. **Should mobile web have its own "Create" flow distinct from guest mode?**
   Today the guest editor is the create path (`app/(app)/editor/cv/try/page.tsx`)
   and it resets to a blank guest doc. On a phone that is a 30-chunk bundle for
   a demo. Not resolved here.
5. **Nothing in this document was driven in a browser on the live site** (the
   session timed out). Every claim about the *live* behaviour of `/en/jobs` is
   from the served HTML; every claim about the UI is from the source. Both are
   labelled where they appear.

---
