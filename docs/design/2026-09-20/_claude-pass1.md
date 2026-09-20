# Sumaiya — Design Review

## 1. Design System

### (a) Type scale — named roles, exact values
Consolidated from the sizes already in use (11–36px). No new sizes; roles pick from the existing set so nothing has to be re-cut in either codebase.

| # | Role | Size | Line-height | Weight | Letter-spacing | Where |
|---|---|---|---|---|---|---|
| 1.1 | `Display` | 30 | 36 | 800 | −0.5 | Onboarding hero titles, first-run step titles |
| 1.2 | `ScreenTitle` | 28 | 34 | 800 | −0.5 | One per screen, top of `Screen`. Never two on one screen. |
| 1.3 | `SectionTitle` | 18 | 24 | 800 | 0 | `SectionHeader`, dashboard `<h2>` |
| 1.4 | `CardTitle` | 15.5 | 21 | 700 | 0 | Card/list-row primary line (job title, CV title) |
| 1.5 | `Body` | 14.5 | 21 | 600–700 | 0 | Buttons, quick-action labels, primary readable text |
| 1.6 | `BodySmall` | 13.5 | 19 | 600 | 0 | Secondary line under a `CardTitle`, hints |
| 1.7 | `Caption` | 12.5 | 18 | 400–600 | 0 | Muted metadata (dates, counts, sublabels) |
| 1.8 | `Micro` | 11–11.5 | 14 | 700 | 0.4–0.5 | Uppercase eyebrows, badge numerals, "ROLE 1" kickers |
| 1.9 | `Stat` | 24–26 | 1.0 (tight) | 800 | 0 | A number the user reads as a headline (CV count, pipeline stage count) — never for a % they're comparing (see motion rule 6f/§4 STAYS INSTANT) |

Rule: every text node maps to exactly one of these nine. If a new size feels needed, it means a tenth role is being invented — stop and pick the nearest existing one instead.

### (b) Spacing rhythm
2.1 Base unit is 4px. The only gaps allowed: **4, 8, 12, 16, 20, 24, 32.**
2.2 Screen horizontal padding is always 20 (native) / matches `max-w-7xl mx-auto px-4` (web) — never override per-screen.
2.3 Card internal padding is always 16, row internal padding 14–16 (10 for a compact/inline row, e.g. `hint` card in home-screen.tsx:313).
2.4 Icon-to-label gap in a row is always 8, or 12 when the icon sits in its own tinted chip (the 38×38/44×44 icon well pattern used everywhere).
2.5 Grid gutter is always 12. Vertical rhythm between stacked sections is always 20–24, never the ad-hoc 9/10/11 currently scattered through inline `gap` props (e.g. `gap: 9`, `gap: 11` in cv-editor-screen.tsx, jobs-screen.tsx) — round those to 8 or 12.

### (c) Concentric radii
3.1 Formula: **inner radius = outer radius − outer padding**, clamped to the nearest token below it.
3.2 Tokens: `pill 999`, `card-lg 20`, `card 16`, `input-lg 12`, `input 8`.
3.3 Worked example already in the codebase, correctly: a `card` (16) with 16px padding holding a 38×38 icon well → inner radius 11–12 (`input-lg`). Wrong example, also in the codebase: `groupBox` in profile-screen.tsx:232 uses `borderRadius: 14` — not a token. Fix to 16 (card) since it holds full-bleed rows, not an inset icon.
3.4 Never hand-write a radius number outside {8, 9(icon-well exception, see 3.5), 11–12, 14→16, 16, 18(device), 20, 999}. The 9/11/12 spread currently used for icon wells (30×30→9, 38×38→11/12, 44×44→12) is the concentric rule already working — keep it, just stop also using 14 for card-level containers.

### (d) Elevation / surface treatment
4.1 Screen background: `cream`/`sand` only — never `card`/white behind the whole screen.
4.2 A **static, non-interactive** content block (card row, list item, info box): white/`bgElevated` + 1px `border` — **no shadow**. Shadows are an extra offscreen compositing pass; on a Redmi-class GPU that cost buys nothing for content that doesn't move.
4.3 A **pressable** card gets `shadow.card` only on `:active`/press-state feedback (native) or `hover:shadow-card-hover` (web, meaningless on touch but free on desktop) — never a resting shadow.
4.4 Shadows are reserved for things that are genuinely above the content plane: dialogs, sheets, the floating build-bar (`sumaiya-chat-screen.tsx:463`), toasts. Use `shadow.floating`, never `shadow.card` for these (card is for the illusion of a resting surface, floating is for something over another surface).
4.5 Dashed border = empty/placeholder state only (already correct in home-screen.tsx:540). Never use dashed for anything else.

### (e) Density rules for a cheap phone
5.1 Minimum tap target 44×44 including `hitSlop` — audit `hitSlop: 6` (cv-editor-screen.tsx:554,561) up to 8 minimum.
5.2 No node may stack more than 2 translucent/composited layers (tinted background + border + shadow = 3 — pick 2 max). Tinted-fill icon wells (`c.accent + "14"`) plus a border plus a shadow, as seen stacked occasionally, is the pattern to avoid.
5.3 Cap simultaneous mounted `Animated.View`/shared-value nodes per screen at ~100 per the Reanimated budget already cited — Stagger's own cap (6 items / 270ms, already implemented) is the enforcement point; extend the same cap to any `FlatList`/`ScrollView.map` that isn't already going through `Stagger`.
5.4 Prefer flat lists of rows over grids of cards where content is text-primary (jobs, CVs) — a card-per-item costs a border + radius + padding recompute per item; a row costs less to lay out and repaint on scroll.
5.5 Images (profile photo, CV photo) are always pre-compressed before display, never resized-in-layout from a multi-MB source — already the pattern in `pick-photo.ts`; keep it as the only path, no new one.

### (f) Iconography rules
6.1 Three sizes only: **14** (inline with text/badges), **18** (row/list leading icon, primary header actions), **20** (icon-well centerpiece, empty-state icon). Anything currently at 15/16/19 (scattered across home-screen.tsx, jobs-screen.tsx, cv-editor-screen.tsx) rounds to the nearest of these three.
6.2 Stroke width: outline, 1.75–2, always — this is a Lucide/Feather-style icon set already (`chevron-right`, `alert-circle`, etc.); introducing filled icons anywhere but the two exceptions below breaks the set's visual weight.
6.3 Filled is reserved for exactly two cases: (a) the active tab bar icon, (b) the branded `SumaiyaMark` glyph. Nothing else is ever filled.
6.4 An icon never carries meaning alone — every icon that isn't purely decorative (chevrons, drag handles) has an adjacent text label or an `accessibilityLabel`. This is already the pattern; keep it as a hard rule so it survives future screens.

### (g) Motion — extending the standard, not replacing it
The existing standard already names every composite this app needs (§3.5). The gap in the current codebase is **adoption**, not missing rules — several screens (jobs-screen.tsx, home-screen.tsx's Recent-CVs block, ats-checker-screen.tsx) still hard-swap `loading ? <Skeleton/> : <content/>` instead of using the already-defined "Loading → content" composite (placeholder `FadeOut` 140ms `ease.in` while content enters via its own `FadeInDown`/`Stagger`).

7.1 **Adopt, don't invent**: every `{loading ? A : B}` ternary in the tree must resolve to the "Loading → content" composite (§3.5 row 7). This is a checklist item for code review, not new design work.
7.2 **New composite — "Metric refresh" (extends §4's "numbers being compared" rule):** a match-score badge (`MatchBadge`, ATS score) that changes value while on screen updates its digits and color tone **instantly** (§4 already bans animating compared numbers) but its container may use `dur.micro`(90)/`ease.inOut` for the background-tint change only — so the number itself never animates, but a fresh score doesn't look identical to a stale one. Add this row to §3.5.
7.3 **New composite — "Banner stack" (web dashboard):** when more than one nudge/banner is server-rendered above the fold, they do not each get their own entrance animation (that's a wall of things arriving at once, which reads as noise, not hierarchy) — collapse to a single `Reveal`-equivalent (opacity+rise) on the *group*, not per banner. Add this row to §3.5 and use it to enforce rule 2's dashboard consolidation.
7.4 **Banned, explicitly, beyond §4's existing list:** parallax on scroll, blur/backdrop-filter transitions, spring-based list-item entrances (timing curves only, per principle 6), any decorative loop without a 2-cycle bound and a `cancelAnimation` cleanup (this is what N1/N15 in the existing audit already caught — the rule is "every `withRepeat` needs a bound and a cleanup," not "no loops").
7.5 A composite not written into §3.5 does not ship — this is already rule 9.1 in the standard; repeating it here because it's the rule most likely to be skipped under deadline pressure.

---

## 2. Screen-by-screen

- **HomeScreen** (`home-screen.tsx`) — the rotating hint card (line 220) mixes a genuine proactive signal with a self-promotional "224 designs for every document" TemplateHub ad in the *same* rotation slot, so a first-time user's most urgent nudge can get buried behind an ad for a feature already promoted in Quick Actions two inches below. **Change:** drop the `templatehub` entry from the `hints` array (lines 220–234) entirely.

- **CvEditor** (`cv-editor-screen.tsx`) — the header row stacks four competing elements (Back, sync-status pill, Preview pill, ATS pill) at the exact top of a 20px-padded screen. **Change:** move the ATS pill (lines 499–507) into the footer's action row next to Save/Export, leaving the header to Back + sync-status only.

- **JobsScreen** (`jobs-screen.tsx`) — the job-match `%` badge (`MatchBadge`) and the ATS-score badge elsewhere in the app render pixel-identically (same pill, same tone logic) but measure two unrelated things. **Change:** add the word "Match" inside the badge (`MatchBadge`, line 14–23) so it can never be read as an ATS score.

- **CvListScreen** (`cv-list-screen.tsx`) — Delete sits as an equal-width, equal-weight third button (lines 201–211) directly beside Edit and Download, distinguished only by icon tint — a fast three-tap mis-hit risk on a small screen. **Change:** move Delete off the primary row into a long-press or overflow affordance.

- **ProfileScreen** (`profile-screen.tsx`) — destructive actions are split across two places: "Clear offline data" lives in the neutral "Account" group (line 401) while "Delete account" gets its own "Danger zone" (line 450), so severity doesn't read as a gradient. **Change:** merge both into one "Danger zone" group, clear-cache first, delete-account last.

- **FirstRunScreen** (`first-run-screen.tsx`) — the "photo" step (lines 300–339) is fully optional yet costs a whole step with the same Continue button as required steps, and the exact same photo-picker UI already exists in the CV editor (`cv-editor-screen.tsx:537`). **Change:** delete the standalone photo step; fold it into the "look" step's header as an optional add-on.

- **Onboarding** (`onboarding-screen.tsx`) — after the language pick, four sequential explanatory slides (lines 38–71) stand between install and sign-in for an audience that already knows what a CV app does. **Change:** collapse to one slide (see §5 below for how to propose this safely).

- **Chat** (`sumaiya-chat-screen.tsx`) — the empty state offers 4 parallel quick-action chips (`INITIAL_QUICK_ACTIONS`) plus a free-text composer, so the first thing a user sees is a decision grid instead of an invitation to just type. **Change:** cut to 2 chips (cv-builder, job-letter — the two already promoted from Home); the input field itself already affords free typing, so a "free-chat" chip that just focuses it is redundant.

- **Web dashboard** (`dashboard/page.tsx`) — up to seven near-identical `bg-card rounded-card-lg` banner blocks (DB error, create-failed, pipeline hero, daily brief, up to 3 signals, confirmations, pre-application nudge) can all render above the tab content in one load. **Change:** route "daily brief" and "pre-application nudge" through the existing `computeSignals` engine instead of being separately hardcoded blocks (lines 342–369, 435–462), so there's one ranked list capped at 2–3, not five independent `!dbError && …` sections.

- **Web CV editor** (`cv-editor-client.tsx`) — five separate AI-assist surfaces (`AtsPanel`, `AtsExplain`, `WhatChanged`, `AuthenticWritingPanel`, `JobTargetPanel`) are each independently triggered floating panels competing with the actual editing toolbar (Save/Export/Share/Template) for the same limited header space. **Change:** consolidate the five into one tabbed side-panel with a single entry point.

---

## 3. 2025-26 trends — transfer or fashion

- **iOS 26 Liquid Glass / translucent materials** — FASHION. Blur/translucency is a full-screen compositing pass on every frame it's visible; costs battery and frame budget for zero comprehension gain on a CV app.
- **Material 3 Expressive motion+bold type** — FASHION for the motion half (spring-heavy, per-item) — the existing standard already correctly rejects springs for repeated elements. Bold type transfers cheaply (it's just weight/size, already in the type scale).
- **Glassmorphism** — FASHION. Same blur cost as above, plus it degrades contrast, which actively hurts a Swahili-first low-literacy-tolerant audience.
- **Video / animated hero** — FASHION, and actively hostile here: this audience is on metered mobile data; an autoplay video hero is a direct cash cost to the user.
- **Blur / backdrop-filter** — FASHION. Same GPU/compositing cost as glassmorphism; banned in rule 7.4.
- **Skeleton shimmer** — TRANSFERS, already implemented (`skeleton.tsx`), already bounded/cleaned-up per the motion audit (N15) — keep it, don't expand it into decoration elsewhere.
- **Illustration-heavy empty states** — MOSTLY FASHION here: an SVG illustration adds a bundle-size/decode cost with no functional benefit over an icon + two lines of text, which is what `EmptyState` already does correctly.
- **Parallax scroll** — FASHION. Scroll-linked motion is explicitly banned by the standard (§4) — costs frame budget on every scroll tick for a decorative effect.
- **Haptics everywhere** — TRANSFERS *selectively*: the app already uses haptics correctly (selection/success/error/warning as distinct signals) — the risk is haptic fatigue if extended to every tap rather than every state-change.
- **Dark mode as default** — TRANSFERS as an *option* (already built, `useColorScheme`), FASHION as a *default*: OLED savings only apply to OLED screens, which this price tier of Android often isn't; forcing it doesn't reliably save the user anything.
- **Large display type** — TRANSFERS, cheaply: it's free (just a size token), and helps low-vision/older users read a CV app on a small cheap screen.
- **Bottom sheets vs full screens** — TRANSFERS: sheets are cheaper to mount/dismiss than a full screen push (no new stack entry, reuses the current screen's mounted content) — already used correctly for Premium/Preview/Attach in this app.

---

## 4. Five highest-value motion fixes (obeying the existing standard, not inventing new "boom" moments)

These are drawn from the standard's own audit (§8) — items with active work in this session (splash, empty-state, Stagger, button, skeleton, help-faq, cv-list, applications, learning-hub) are excluded so nothing here duplicates in-flight work.

1. **`jobs-screen.tsx:120`** — `{loading ? <SkeletonList/> : …}` is a hard swap (audit N4, severity H). Apply the "Loading → content" composite: skeleton `FadeOut` 140ms while the recs/rest lists enter via their existing `Stagger`.
2. **`home-screen.tsx:473`** (Recent CVs) — same hard swap on the skeleton→content boundary (audit N6, severity H); the error-state branch already correctly uses `Reveal`, the loading→content boundary does not.
3. **`ats-checker-screen.tsx:125`** — bare loading `<Text>` that hard-swaps to the full analysis (audit N8, called out in the standard itself as "the worst loading state in the app, in both senses"). Apply the same composite.
4. **`components/jobs/targeted-cv-drawer.tsx:274`** (web, audit W5) — every branch (`loading`/`error`/`result`) is an instant swap inside a drawer the user is watching closely (it's mid-tailoring-flow). Apply CSS-class equivalents of "Loading → content."
5. **`components/settings/career-profile-card.tsx:139`** (web, audit W4) — `animate-pulse` text hard-swaps to real chips. Lowest severity of the five, but cheapest fix (one class change) and it's the one screen here a returning user hits every session.

---

## 5. The risk most likely to get a "no" — and how to make that cheap

**The risk:** cutting the onboarding slide count (screen 2 above) and consolidating the dashboard's banner stack (screen 9 above) aren't just visual trims — they sit on top of instrumentation the owner already built specifically to answer "where do people drop off" (`track("firstrun.step", …)`, `track("onboarding.slide", …)`, the `computeSignals` proactive engine). Cutting them by design instinct, without data, risks reversing a decision that was made for a reason not visible in the UI — engagement/monetization funnels (TemplateHub, Premium) the owner is tracking that a designer wouldn't see from the screen alone.

**How to present it so he can say no for free:** don't propose deleting the slides or banners — propose gating the trimmed version behind a flag, running it for one cohort against the telemetry that already exists (`firstrun.step`/`onboarding.slide` events, `signals` ranking), and comparing completion rate and time-to-first-CV against the current version. If the numbers don't move, revert with one flag flip — no code was deleted, no argument was aesthetic, and he was never asked to trust taste over his own data.
