# SUMAIYA — WEB OVERHAUL BRIEF

**Status:** work order. Supersedes nothing; extends `docs/DESIGN-GUIDE.md` to the web surface.
**Precedent:** the mobile overhaul (`feat/design-ground-up`) — same method, same laws, different surface.
**Readwith:** `docs/DESIGN-GUIDE.md` (binding), `docs/design/`, `docs/briefs/2026-10-12-money-register.md`.

---

## 0. WHY THIS EXISTS

The Android app was rebuilt ground-up against the design guide and is now the reference for what
Sumaiya looks like and how it behaves. The web app did **not** get that treatment. It carries the
brand only partially: `tailwind.config.ts` defines 16 warm tokens (with guide citations in the
comments) and `globals.css` echoes them, but **326 files hardcode a raw hex** instead of using those
tokens, and **10 files still import a foreign palette** (`emerald-`, `indigo-`, `slate-*`,
`blue-###`) — the same defect class that had to be stripped out of the Stitch mobile package.

So the web is not unbranded; it is **inconsistently branded**. A visitor moving from
`sumaiya.app` → the dashboard → a shared CV sees three different products. That is the thing this
brief fixes.

**Target state:** web and Android read as one product — same ember, same type ramp, same laws, on a
surface that is honestly web (responsive, server-rendered, accessible, fast) rather than a phone
layout stretched to 1440px.

---

## 1. BINDING REFERENCES

| Reference | Binds how |
|---|---|
| `docs/DESIGN-GUIDE.md` | **Colour, type, spacing, the laws.** Its §1 palette is a decision, not a starting point. |
| The mobile rebuild (`apps/native`) | **Behaviour and copy parity.** Where a screen exists on both, the copy is written once and matches. |
| `app/globals.css` + `tailwind.config.ts` | The token layer to adopt — extend it, don't reinvent it. |
| This brief | Web structure: surfaces, breakpoints, SEO, i18n, performance. |
| `docs/DESIGN-GUIDE.md` §laws | Applies to **every** surface below, including admin. |

**The guide's screen inventory is Android-only.** It derives its structure from the Stitch APK spec
(9 screens). Do not force its screen list onto the web — take its **brand and laws**, and use §3 of
this brief for the web's own surface inventory.

---

## 2. SCOPE — WHAT CHANGES, WHAT IS FROZEN

**Rebuilt (presentation layer):** page structure and layout, the component library's styling,
copy and microcopy (both languages), motion, focus/keyboard behaviour, responsive behaviour,
loading/empty/error states, metadata and OG images, and the token migration.

**FROZEN (do not touch):** API routes under `app/api/**`, the DB schema and migrations, the job
ingest pipeline (`lib/jobs/**`), the CV renderer and the template registry, auth, entitlements/referral
logic, the AI spine, and the export/print path. The web twin of a mobile screen may **call** these;
it may not reimplement them.

*(Template numbers, measured — do not re-derive or round: `components/templates/` holds 268 `.tsx`
files, the registry exposes 266 entries, **47 are curated** for the picker, and `apps/native` carries
218 implementations. "273 templates" appears nowhere in the tree and must not be written. The
`families.ts` "8 families" is a **stub** — 260 of 266 entries are `family: "pending"` — so no surface
may present families as a shipped fact.)*

**Rule of the boundary, phrased once:** the engine decides *what is true*; the surface decides *how
it looks*. When a design asks for something the engine cannot back, **the design changes, not the
engine** — and if it is the copy that is wrong, the copy changes and the reasoning goes in a comment
so a later lane cannot "restore" it.

---

## 3. SURFACE INVENTORY (52 pages)

Grouped by what they are for. Each group lists its pages and its acceptance test. Admin is
explicitly *functional, not beautiful* — it gets tokens and a11y, not a redesign.

### A. Marketing — `[locale]/(marketing)/*`
Home, about, ats-checker, blog, blog/[slug], contact, **pro**, privacy, + sibling marketing pages.
**This is the first impression and the SEO surface.** Bilingual (SW/EN) by construction, with real
`hreflang`, per-locale metadata, and sitemap coverage.
*Accept:* both locales render server-side with the same information; no layout shift; every claim on
the page is backed by a shipped feature (no parity promises we cannot keep).

**Known defect to clear in this lane — another product's name on Sumaiya's surface.** The
`templatehub.pro` domain still appears in `vercel.json`, `.env.example` and `twa-manifest.json`, there
is a marketing page at `/pro/`, the native gallery label reads "TemplateHub Premium", and the support
address users see is `support@templatehub.pro` (confirmed on the Android device, in Support and in the
Profile row). A Sumaiya user who writes to it lands in another brand's mailbox. Every one of these
needs a Sumaiya address or an honest removal — **do not invent a domain or a mailbox; flag it and use
what exists.**

### B. Auth — `(app)/(auth)/*`
sign-in, sign-up, verify, reset-password.
*Accept:* one shared shell; keyboard and password-manager friendly; errors state the cause, not a code.

### C. Product / dashboard — `(app)/(dashboard)/*` and `(app)/*`
dashboard, brief, career-interview, applications/[id], settings, import-cv, assistant, interview,
voice, migrate-guest.
*Accept:* parity with the equivalent mobile screens in copy and in state honesty — the same empty
states, the same "no score yet", the same salary/deadline formatting rules.

### D. Editors — `editor/{cv,cover-letter,letter,business-card}/[id]` + `/try`
The heaviest surface: four editors, each with a public try-mode twin.
*Accept:* the editor's preview matches the exported/printed document; try-mode never requires an
account and never loses work on refresh; the four editors share one shell, one toolbar, one inspector.

### E. Public artifacts — `cv/[slug]`, `snap/**`, `studio/[id]`
A shared CV and a shared snap are **the most public thing this product produces** — they are seen by
employers who have never heard of Sumaiya. They carry the brand's reputation at zero cost.
*Accept:* an OG image that looks designed at 1200×630; the document is readable on a phone; the page
is a real, complete page (not an app shell that needs JS to show anything).

### F. Admin — `(app)/admin/**` (9 pages)
users, jobs, templates, submissions, campaigns, insights, app.
*Accept:* tokens and accessibility only. Density is a virtue here; do not redesign admin for beauty.

### G. Global work (runs parallel to all of the above)
1. **Token migration** — replace hardcoded hex with the `tailwind.config.ts` tokens across the 326
   files carrying raw colour. Mechanical, reviewable, one lane.
2. **Foreign-palette purge** — 10 files, measured: `components/assistant/confirmations-card.tsx`,
   `components/contact-form.tsx`, `components/dashboard/dashboard-cover-letter-grid.tsx`,
   `components/editor/authentic-writing-panel.tsx`, `components/editor/dynamic-template-renderer.tsx`,
   `components/editor/template-picker.tsx`, `components/editor/template-selection-modal.tsx`,
   `components/settings/career-profile-card.tsx`, `components/settings/settings-form.tsx`,
   `app/(app)/snap/snap-client.tsx`.
   The offending classes are **~112 amber-, ~28 emerald-, 4 blue-**. The config already carries the
   right end-points (`success: #186A22`, `warning: #B45309`, `error: #BA1A1A`), so the mapping is
   `amber → warning`, `emerald → success`, `blue → ember`, with the soft tints (`*-50/100/200`) becoming
   opacity variants of those tokens rather than a flat colour. **Map by intent, not by hue** — amber is
   not always a warning, and a blind sweep that turns a "pending" state into an error is worse than the
   drift it fixes. Each of the 10 surfaces gets looked at afterwards.
3. **Type ramp** — one scale for the whole web, matching the guide (Bricolage display / Hanken body /
   JetBrains numeric), with no page inventing its own sizes.
4. **Focus and keyboard** — every interactive element reachable and visibly focused; skip links on
   long pages; Esc closes overlays; no focus trapped behind a modal.
5. **Motion** — one duration/easing vocabulary. Motion is confirmation, never decoration, and never
   the sole carrier of meaning (a value that must be correct must not ride an animation).
6. **States** — loading, empty, error and offline for every data-bearing page. An empty state that
   claims a number is a lie; the honest version is "nothing yet, and here is how to start".

---

## 4. THE LAWS (non-negotiable, all surfaces)

Carried from the mobile rebuild and the guide. A lane that violates one of these has failed the task,
regardless of how the page looks.

1. **Ember is the root.** `#DA4A1C` and its derived warm scale only. No second accent, no foreign
   palette, no Material tonal leftovers.
2. **No pure `#FFFFFF` as a surface.** White is for text/icons **on** ember. Surfaces are the warm
   scale (base / raised / sunken).
3. **Never print `ATS` in Swahili-facing copy.** The English term may appear where an English-speaking
   user expects it; the Swahili side says what the feature *does*.
4. **No fabricated numbers, scores, counts or timers.** A number appears only when the engine produced
   it. Empty states say so plainly.
5. **Salary honesty.** Never an employer's salary that we predicted rather than read; never a figure
   without its period; never a `"70k"`-style guess.
6. **No version pills, no bell/notification chrome, no decorative badges** that imply an unbuilt feature.
7. **Honest premium.** Payment methods may be named; a price may not be invented. The mobile wording is
   the standard: *"Paying isn't open yet."* — and sell only what is actually gated.
8. **Provenance stays internal.** Internal source fields are not product facts and do not reach a user.
9. **Bilingual parity.** Every user-facing string exists in SW and EN, in the same tone — Swahili is not
   a translation of the English, it is the other half of the product.
10. **The name is a memorial.** Sumaiya is named for the user's late sister. Copy is held to that
    standard: no jokes at the product's expense, nothing cheap, nothing that a family would wince at.

---

## 5. GATES (all must pass before a PR is offered)

1. `npx tsc --noEmit` clean; `npx vitest run` green (**vitest is the web runner — jest is not
   installed here**); `npm run lint`; `next build` succeeds.
   `npm run verify` already chains these plus Playwright E2E, Lighthouse and DB checks — use it.
1b. `npm run evals` — the repo's **anti-fabrication gate** — must stay green. It exists to stop a
   surface from asserting something the product cannot back; that is the same law as §4.4, enforced
   by CI.
2. **EN + SW server-render verify** — fetch each changed route in both locales and confirm the
   information is present in the HTML, not only after hydration.
3. **Real-data check.** Open every surface the change touches with real data and report what was seen.
   Tests and a clean build are not evidence that a page works.
4. **Responsive** at 360 / 768 / 1280 / 1440 — no horizontal scroll, no clipped controls, no
   phone-layout stretched to desktop.
5. **Core Web Vitals budget** on marketing and shared-artifact pages: LCP < 2.5s, INP < 200ms, CLS < 0.1.
6. **Accessibility**: WCAG AA contrast, full keyboard path, visible focus, semantic headings, alt text.
7. **No-JS check** on public pages — a shared CV must render without JavaScript.
8. **Secrets**: never commit a key; `.env` stays ignored; example files carry placeholders only.

---

## 6. LANE PLAN

Runs as parallel lanes on one repo, each owning disjoint files, **none of them running git** — the
parent stage-and-commits named paths only.

| Lane | Owns | Depends on |
|---|---|---|
| **G — groundwork** | Token migration, foreign-palette purge, type ramp, focus, motion | none — **this goes first** |
| **A — marketing** | `[locale]/(marketing)/**` | G |
| **B — auth** | `(app)/(auth)/**` | G |
| **C — dashboard** | `(app)/(dashboard)/**`, assistant, interview, voice | G |
| **D — editors** | `editor/**` (4 editors + 4 try-modes) | G |
| **E — artifacts** | `cv/[slug]`, `snap/**`, `studio/**`, OG images | G |
| **F — admin** | `(app)/admin/**` | G |

Groundwork first because every other lane would otherwise re-decide colour and type. Lanes A–F are
independent of each other; their only shared surface is the component library, so the token layer and
shared components must be settled before they start.

---

## 7. DEFINITION OF DONE

- Every surface in §3 passes its acceptance test, with evidence (screenshots at the four widths, both
  locales, real data).
- Zero hardcoded brand hex outside the token layer; zero foreign palettes.
- One type ramp, one motion vocabulary, one focus treatment across all 52 pages.
- Both languages render server-side, complete, on every public page.
- The web and the Android app, seen side by side, are unmistakably the same product.

---

## 8. KNOWN RISKS (address in the lane, not later)

- **Hydration**: moving presentation into server components is the goal, but a client/server mismatch
  is a blank page. Verify with JS disabled *and* with JS enabled.
- **i18n sprawl**: `[locale]` routing plus dashboard routes that are not locale-prefixed invites string
  duplication. One dictionary, no inline literals.
- **Token migration scale**: 326 files is a mechanical change that touches almost everything — do it as
  its own reviewed lane, not folded into feature work.
- **OG images**: they are generated, cached and indexed, so a wrong one is sticky. Check the rendered
  1200×630 output, not the code.
- **Admin**: the temptation is to redesign what should only be made consistent. Resist it.
