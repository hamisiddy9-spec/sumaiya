# apps/web — AI-assisted development guide

**Last verified: 2026-09-18; template-provider section updated 2026-09-19** (`aee08ae`, D1 — the
remote TemplateHub provider was deleted; see `docs/DECISIONS.md`). Every statement below was
checked against the **code in this working tree** (`git rev-parse HEAD` was `37e0b5b`, branch
`main`, on 2026-09-18), with the commands
quoted. Nothing was carried over from other markdown in this repo; the previous version
of this file described a product that does not exist (it named a `mobile/` directory, an
`npm run build:android` script, a `documents` table, and three commits that are not in
this repo's history — see *Corrections* at the bottom).

Re-run the gate commands before trusting any number here.

---

## What the product is

**Sumaiya** is a bilingual (Swahili/English) career-intelligence web app: users build a
CV, tailor it to a job description, check it against ATS rules, and apply. The phone app
is the second client and lives in `apps/native` (Expo / React Native 0.86, SDK ~57).
The en/sw split is enforced by parity tests, not by convention —
`lib/i18n/translations.test.ts` and `lib/snap-strings.test.ts` fail if a key exists in
one language and not the other.

---

## Where things live (verified paths)

```
apps/web/
├─ app/                     App Router, locale routing ([locale]), API routes
│  └─ api/[[...route]]/     Hono-style catch-all API entry
├─ components/
│  ├─ editor/               cv-editor-client, template-picker, dynamic-template-renderer,
│  │                        template-selection-modal, ats-panel, share-cv-modal, …
│  ├─ templates/            269 .tsx files, 266 of them template sources (the real gallery)
│  ├─ ui/                   primitives (badge.tsx, …)
│  └─ admin/, marketing/    admin screens, landing pages
├─ lib/
│  ├─ templates/            see next section — the provider layer
│  ├─ cv-builder/           template-integration.ts, template-adapter.ts,
│  │                        use-template-provider.ts, use-cv-export.ts
│  ├─ db/schema.ts          Drizzle schema (30 tables)
│  ├─ i18n/                 translations.ts + parity tests
│  ├─ snap-*.ts             the Snap-to-Apply surface
│  └─ client-cv-extract.ts  browser-side OCR path (lazy tesseract.js)
├─ drizzle/migrations/      SQL migrations
├─ scripts/                 generators, verifiers, migrate-*.mjs
└─ evals/                   anti-fabrication eval harness (run as `npm run evals`)
```

**Snap-to-Apply is not one file.** There is no `lib/snap-apply.ts`; the behaviour is
split across `lib/snap-application.ts`, `snap-ocr.ts`, `snap-prefill.ts`,
`snap-export.ts`, `snap-share.ts`, `snap-a11y.ts`, `snap-strings.ts` (each with a
colocated `.test.ts`).

---

## The template system (the part that is real)

`lib/templates/` — provider layer, verified by reading and by running its unit test:

| File | What it is |
|---|---|
| `schema.ts` | `TemplateProvider`, `TemplateMetadata`, `TemplateFamily`, `RenderedDocument`, `EditableFieldSpec` |
| `native-provider.ts` | `NativeTemplateProvider` — serves the local registry |
| `registry.ts` | **generated** (266 entries). Regenerate: `node scripts/generate-template-registry.mjs` |
| `curation.ts` | 47 curated ids, of which 7 are premium — the single source of truth for what is *offered* |
| `tiers.ts` | `getCvTemplateTier()` → `premium` / `core` / `legacy` |
| `families.ts` | **STUB** (see below) |
| `schemas.ts` | `STANDARD_CV_SCHEMA` (14 fields) + a `TEMPLATE_SCHEMAS` map with no real overrides |
| `index.ts` | `selectProvider()` + the `templateProvider` singleton used by the UI |
| `migrations.ts`, `database-schema.sql` | SQL kept alongside the provider layer — **the `documents` table they describe is not the live schema** |

**Counts, measured 2026-09-19:** 269 `.tsx` files in `components/templates/` → **266**
template sources (`template-canvas.tsx` and `template-utils.tsx` are helpers, not registry
entries) → **266** registry entries → **265** distinct names (`"Herald"` is duplicated, as
`herald` and `herald-cv`) → **47** offered (**7** premium). All 266 registry entries are
`category: "cv"`. The number **273 appears nowhere in the tree**.

**`families.ts` is a stub and must not be described as shipped.** It declares 8 families,
but 5 of the template ids it references (`simple-cv`, `professional-cv`, `ats-cv`,
`artemis`, `aurora`) do not exist in the registry, and it carries the comment
*"IMPORTANT: This is a STUB showing the pattern."* In the generated registry, **260 of
266 templates have `family: "pending"`**; only 6 have a real family. Likewise
`TEMPLATE_SCHEMAS` in `schemas.ts` maps 10 ids to the *same* standard schema — there are
zero per-template overrides today (the file has a TODO saying so), and 5 of those keys are
the same non-existent ids.

The singleton is wired into the editor for real: `components/editor/template-picker.tsx`,
`template-selection-modal.tsx`, `dynamic-template-renderer.tsx` and
`lib/cv-builder/template-integration.ts` all import `templateProvider`.
`selectProvider()` in `index.ts` returns `nativeTemplateProvider` unconditionally — no env
var, no remote branch, no fallback — and `lib/templates/provider-select.test.ts` pins exactly
that, including assertions that `TemplateHubProvider` is not exported and that `index.ts`
contains no `templatehub` / `TEMPLATE_HUB` string.

---

## Database

`lib/db/schema.ts` (Drizzle) defines **30 tables**. The CV-family tables are still
separate: `cv`, `cover_letter`, `letter`, plus `document_version` for history, whose
payload column is **`snapshot` (jsonb)**.

There is **no `documents` table** and **no `content_snapshot` column**. Any migration file
under `lib/templates/` that describes one is a design document, not the applied schema.

---

## Commands that must pass before a change is "done"

### This app uses VITEST (there is no jest here)

```bash
cd apps/web
npx tsc --noEmit     # clean
npm run lint         # next lint
npx vitest run       # 127 files pass, 1 skipped · 2052 tests pass, 3 skipped (2026-09-19)
npm run evals        # anti-fabrication gate: 9 files, 135 tests (133 pass, 2 skip)
npm run build        # next build
```

Full gate in one command (what `npm run verify` runs, via `scripts/verify-all.sh`):
`npx tsc --noEmit` → `npm run lint` → `npm test` → `npm run evals` → `npm run build` →
cross-browser Playwright E2E (`playwright.config.ts`) → Lighthouse → DB checks. It exits
non-zero on the first failure and logs to `e2e/reports/verify.log`.

Other real scripts in this workspace: `test:watch`, `test:e2e` (`scripts/e2e-smoke.mjs`),
`test:e2e:local` (Playwright), `lh`, `verify:visual:update`, `db:generate`, `db:migrate`,
`db:push`, `db:studio`, `evals:prod`.

**Not from this workspace:** `npm run evals` does not exist at the repo root — call it as
`npm -w @sumaiya/web run evals`. There is no `build:android` script anywhere.

These also run in CI (`/.github/workflows/ci.yml`, jobs `web` and `web-evals`), so a
change that passes locally but breaks `web:build` will still fail the PR.

---

## Corrections to the previous version of this file

| Previous claim | Reality |
|---|---|
| Active branch `chore/release-manifest-1.6.15` | active branch is **`main`**; that branch exists (local + origin) but is stale |
| Branching from `claude/sumaiya-continuation-ife7xj`, merging `hermes/native-scan`, `hermes/native-offline`, `hermes/native-template-picker`, `hermes/native-settings-eas` | **none of those branches exist.** The real `hermes/*` branches are `hermes/ai-spine`, `hermes/crash-funnel-wip`, `hermes/native-a11y`, `hermes/native-e2e`, `hermes/native-empty-states-analytics`, `hermes/native-faq-privacy`, `hermes/web-template-dedup` |
| `apps/mobile/` with `src/screens`, `src/components`, `src/services`, `src/state`, `src/hooks`, `eas.json`, `NATIVE_APP_SPEC.md` | the app is **`apps/native`**; it has `src/screens`, `src/components`, `src/services`, `src/hooks`, **`src/contexts`** (not `src/state`), and `eas.json` — but **no `NATIVE_APP_SPEC.md`** anywhere in the repo |
| 273 templates (and "267 templates" in the sibling file) | 269 `.tsx` files, 266 of them template sources → 266 registry entries → 47 offered; 273 is not a real figure |
| `documents` table "replaces fragmented cv/letter/reference tables" | no `documents` table exists; `cv`, `cover_letter`, `letter` are all still present |
| "Content snapshot" field for versioning | `document_version.snapshot` (jsonb) |
| `.github/workflows/verify.yml`, `apk-build.yml`, `mobile-apk-build.yml` | only `ci.yml`, `nightly-evals.yml`, `health-cron.yml` exist |
| `npm run build` covers "Next.js + Expo"; `npx vitest run` = "800+ tests" | web and native are separate builds and **different runners**; real counts are 2052 (vitest, web, 2026-09-19) and 1201 (jest, native) |
| "All 800+ tests green", "master branch is production-ready" | the branch is `main`; measured counts above, and both suites were green at verification time |
| Commit `8d908c9` ("as of"), `c8a3fe1`, `7838ab9` | **not in this repo's history** (`git log` fails on all three) |
| `lib/learning-resources.ts` = "34 URLs verified live" | the file contains **51 distinct URLs**; the verifier is `scripts/verify-learning-urls.sh` in *this* workspace, not at the repo root |
| `lib/snap-apply.ts` | does not exist — the surface is `snap-application.ts` + siblings |
| PR numbers (#279–#295, #296–#299) | not verifiable here (no `gh` CLI, no PR data in the tree) |

Claims that **did** hold up: Expo 57 / RN 0.86 (`apps/native/package.json`); 14 editable
fields in `STANDARD_CV_SCHEMA`; en/sw parity tests exist and are recursive over the key
tree; `lib/motion.ts` exports `easeOutCubic`, `countUpValueAt`, `riseClass`; the `Badge`
primitive exists (`components/ui/badge.tsx`); privacy Section 5 "Conversation Logging for
AI Improvement" (opt-out + 12-month retention) is really in
`app/[locale]/(marketing)/privacy/page.tsx`; the template-phase commits
`799dc62`…`79307fa` all exist (2026-09-15); `app/[locale]/(marketing)/privacy/page.tsx`
and `apps/native/eas.json` exist at the stated paths.

---

## Plans (NOT current facts)

1. **Native app work** — the phone app is a real, built app (`apps/native`, version 1.6.29,
   versionCode 10623) with 218 template implementations, not a 4-week greenfield spec.
   Anything still planned (camera/OCR round-trips, offline sync hardening, store
   submission) should be written as a plan in `docs/`, not asserted here.
2. **Template curation** — give the 260 `family: "pending"` templates a real
   classification or retire them, and fix/delete the non-existent ids in `families.ts`
   and `schemas.ts`.
3. **This file** — if a claim here goes stale, fix the claim; do not let a new document
   restate it.

---

## Could NOT be verified

- **PR numbers and their titles** (#279–#299) — no `gh` CLI, no PR metadata locally.
- **"34 URLs verified live"** — only the current file can be counted (51 distinct URLs);
  whether they resolved when claimed cannot be reconstructed.
- **"48-file contrast sweep"**, **"36px modal close targets"** (10 `w-9 h-9` occurrences in
  8 files), **"800+"** phrasing — no reproducible source.
- **Deployed state** — Vercel/Neon/Supabase/production behaviour is outside this tree;
  nothing about "production-ready" can be confirmed from the repo alone.
