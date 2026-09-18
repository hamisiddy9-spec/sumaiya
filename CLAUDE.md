# CLAUDE.md — Sumaiya repo: what exists, where, and what must pass

**Last verified: 2026-09-18** — verified against the **code in this working tree**
(`git rev-parse HEAD` → `37e0b5b`, branch `main`), by reading files and running the
commands quoted below. **Not** verified against the other markdown files in this repo:
several of those describe a product that does not exist (see *Claims in this repo that
are false*). Re-run the commands before trusting any number here — the repo is actively
committed to (HEAD moved twice while this file was being written).

---

## What this repo is

Sumaiya is a bilingual (Swahili/English) CV + job-application product: a Next.js web
app, an Expo/React Native phone app, a WhatsApp worker, and shared TypeScript packages.
Confirmed from the tree:

```
apps/web        Next.js app (App Router, locale routing, Drizzle+Postgres, AI features)
apps/native     Expo / React Native app (SDK ~57.0.16, React Native 0.86.3)
apps/whatsapp   Node worker, tested with `node --test`
packages/       8 private packages: analytics, api-client, core, design-tokens,
                hooks, templates, types, utils  (all "private": true, @sumaiya/*)
```

- Root `package.json` `workspaces` is `["apps/web", "packages/*"]`.
  **`apps/native` and `apps/whatsapp` are not npm workspaces** — they are installed and
  run from their own directories (`npm -C apps/native ...`, as the root scripts do).
- There is **no `mobile/` directory and no `apps/mobile`**. The native app is `apps/native`.
- Earliest plausible entry points: `README.md`, `docs/HANDOVER.md`,
  `apps/native/NIGHT_LOG.md`, `lib/templates/README.md`.
  (`apps/web/README.md` does not exist, despite being cited elsewhere.)

---

## Templates — the real numbers

`apps/web/components/templates/` holds the web template sources. Measured:

| What | Count | How |
|---|---|---|
| `.tsx` template files in `components/templates/` | **267** | `ls -1 components/templates/*.tsx \| wc -l` |
| Entries in `lib/templates/registry.ts` | **266** | the generator skips `template-utils.tsx` |
| Distinct registry ids | 266 | every id unique |
| Distinct display names | **265** | `"Herald"` appears twice |
| Registry category | 266 × `"cv"` | no other category is populated |
| Registry `family` | **260 × `"pending"`**, 4 × `professional-minimal`, 1 × `ats-optimized`, 1 × `modern-specialist` | grep on `registry.ts` |
| Curated (offered in gallery/picker) | **47** | `CURATED_CV_TEMPLATE_IDS` in `lib/templates/curation.ts` |
| Premium flagships | **7** (`rift, zahabu, nuru, pemba, malachite, coral, kioo`) | `PREMIUM_TEMPLATE_IDS` |
| Native (phone) template implementations | **218** files in `apps/native/src/lib/templates/` (+ `registry.ts`, `types.ts`) | `ls -1 *.ts \| grep -vE '^(registry\|types)\.ts$' \| wc -l` |
| Native bespoke (hand-built) ids | 48 | `BESPOKE_IDS` in `apps/native/src/lib/templates/registry.ts` |
| Mobile template index | 267 entries, 267 distinct ids | `node scripts/gen-mobile-templates.mjs` → `apps/native/src/data/templates.json` |

So the three numbers that circulate in this repo are all measuring different things:
**267** = `.tsx` files, **266** = registry entries, **273** = does not exist anywhere in
the tree. 47 templates are actually offered; the rest are the legacy/recolor tail that
still renders but is not surfaced (`getCvTemplateTier()` in `lib/templates/tiers.ts`).

**The 8-template-family structure is a stub, not a fact.** `lib/templates/families.ts`
declares 8 family records, but 5 of the template ids it references
(`simple-cv`, `professional-cv`, `ats-cv`, `artemis`, `aurora`) are **not in the
registry**, and the file itself says: *"IMPORTANT: This is a STUB showing the pattern."*
Real family assignment exists for 6 of 266 templates. Same story in
`lib/templates/schemas.ts`: `STANDARD_CV_SCHEMA` has 14 editable fields (true), but
`TEMPLATE_SCHEMAS` holds 10 keys that **all alias the standard schema** — there are zero
real per-template overrides, and 5 of those keys are the same non-existent ids.

---

## TemplateProvider (the one abstraction that is real)

`apps/web/lib/templates/index.ts` exports a `selectProvider()` and a `templateProvider`
singleton: `native` (default) → local `NativeTemplateProvider`; `templatehub`/`remote`
**with** URL + key → `TemplateHubProvider`; remote without credentials → graceful
fallback to native. Covered by `lib/templates/provider-select.test.ts`.

It is genuinely wired into UI: `components/editor/template-picker.tsx`,
`template-selection-modal.tsx`, `dynamic-template-renderer.tsx`,
`lib/cv-builder/template-integration.ts` all import the singleton.

`lib/templates/templatehub-provider.ts` (295 lines) is a working HTTP client whose own
header says *"Currently: STUB only. Not yet integrated."*

**Reconciling the two contradictory claims about TemplateHub** (both of which appeared
in this file's previous version):

- *"Sumaiya contains NO TemplateHub code"* — **true only in the server sense.** The tree
  contains no TemplateHub server, no Docker/Dockerfile, no SQL schema, and no API route
  for it (verified by directory and file search). Sumaiya *does* contain an HTTP
  **client** for it and marketing references to templatehub.pro.
- *"Sumaiya consumes TemplateHub templates"* — **not currently true.** Nothing fetches
  remote templates unless `NEXT_PUBLIC_TEMPLATE_PROVIDER=templatehub|remote` plus
  `TEMPLATE_HUB_API_URL` + `TEMPLATE_HUB_API_KEY` are set, and those variables are
  **absent from `apps/web/.env.example`**. Production behaviour is therefore to serve
  the local registry. Treat remote consumption as a plan, not a fact.

`packages/templates` is **dead scaffolding**: 5 mock templates with
`https://example.com/...` preview URLs, comment *"In production, this would be
dynamically generated from the template engine"*, imported only by
`packages/api-client/src/index.ts`. Do not cite it as a template source.

---

## Database

Schema lives in `apps/web/lib/db/schema.ts` (Drizzle, 29 `pgTable` definitions) with SQL
under `apps/web/drizzle/migrations/`.

**There is no `documents` table.** `cv`, `cover_letter` and `letter` still exist as
separate tables; nothing consolidates them. Document history lives in
`document_version`, whose payload column is **`snapshot` (jsonb)** — there is no
`content_snapshot` column anywhere.

---

## Commands that must pass before a change is "done"

Per-app test runners are **different** — this is the single most common mistake here.

### apps/web — VITEST

```bash
cd apps/web
npx tsc --noEmit            # clean
npm run lint                # next lint
npx vitest run              # 127 files: 126 pass, 1 skipped; 2042 tests: 2039 pass, 3 skipped
npm run evals               # anti-fabrication gate: 9 files, 135 tests (133 pass, 2 skip)
npm run build               # next build
```

### apps/native — JEST (**never** run vitest here)

```bash
cd apps/native
npx tsc --noEmit            # clean, exit 0
npx jest                    # 42 suites, 1201 tests, all passing
node scripts/test-release-invariants.js
npm run export              # expo export --platform android
```

> `apps/native` uses `jest-expo` (jest ^30.5.1). Running `vitest` inside `apps/native`
> reports ~39 bogus failures — the suite does not exist there. `apps/web` has no jest.

### apps/whatsapp

```bash
cd apps/whatsapp && node --test
```

### One-command web gate

`cd apps/web && npm run verify` runs `scripts/verify-all.sh`: tsc → lint → vitest →
evals → build → cross-browser Playwright E2E → Lighthouse → DB checks, failing on any
step.

### Root convenience scripts (these exist)

`npm run web:typecheck`, `web:test`, `web:build`, `web:dev`, `native:typecheck`,
`native:test`, `native:install`, `native:export`, `whatsapp:test`, plus turbo
`build`/`dev`/`lint`/`typecheck`/`test`.

**These do NOT exist:** `npm run evals` at the root (it lives in the web workspace —
`npm -w @sumaiya/web run evals`), and `npm run build:android` anywhere (native builds go
through `npm -C apps/native run export` / Expo EAS).

---

## CI (what actually runs)

`.github/workflows/ci.yml` on PRs and pushes to `main`:

- **web** — `web:typecheck`, `lint`, `web:test`, `web:build`
- **web-evals** — `-w @sumaiya/web run evals`
- **whatsapp** — `node --test` in `apps/whatsapp`
- **native** — `typecheck`, `test` (jest), `node scripts/test-release-invariants.js`, `export`

`.github/workflows/nightly-evals.yml` scores an `eval_sample` of real traffic nightly —
an alarm, not a merge gate. `.github/workflows/health-cron.yml` exists.

**No `verify.yml`, `apk-build.yml` or `mobile-apk-build.yml` exist.** Android artefacts
are built with EAS config in `apps/native/eas.json` (plus `npm -C apps/native run
export`); the process is written up in `docs/aso-play-store.md` and
`docs/audit/launch-native.md` — not in a workflow in this repo.

---

## Claims in this repo that are false (do not repeat them)

| Claim | Reality |
|---|---|
| `mobile/` directory, `apps/mobile` | neither exists; the app is `apps/native` |
| 273 templates (also: "266 or 273?" open question) | 267 `.tsx`, 266 registry entries, 47 offered |
| "8 families (267 total)" with a mapping per template | 8 stub family records; 260/266 templates are `family: "pending"`; 5 referenced ids don't exist |
| `documents` table consolidating cv/letter/reference | no such table; `cv`, `cover_letter`, `letter` are separate |
| `content_snapshot` field for versioning | the column is `snapshot` on `document_version` |
| `verify.yml` / `apk-build.yml` / `mobile-apk-build.yml` | only `ci.yml`, `nightly-evals.yml`, `health-cron.yml` |
| `npm run build:android` → APK | no such script |
| "All 800+ tests green", "master production-ready" | branch is `main`; web 2042 tests, native 1201 (jest), evals 135 |
| commit `8d908c9`, `c8a3fe1`, `7838ab9` | do not exist in this repo's history |
| `TEMPLATE_IMPLEMENTATION_CHECKLIST.md` | missing (as are `NATIVE_APP_SPEC.md`, `mobile/NATIVE_APP_SPEC.md`) |
| `lib/snap-apply.ts`, `lib/ocr.ts`, `lib/template-matcher.ts`, `lib/sync-queue.ts` | missing in `apps/web/lib` |
| `scripts/verify-learning-urls.sh` at repo root | it is at `apps/web/scripts/verify-learning-urls.sh` |
| `lib/learning-resources.ts` has "34 URLs" | it has 51 distinct URLs (52 occurrences) |

Claims that **did** check out, for the record: Expo 57 / RN 0.86; 14 editable CV fields in
the standard schema; `EMAIL_OTP_DIGITS = 8` in `apps/native/src/lib/auth-code.ts`;
privacy policy Section 5 "Conversation Logging for AI Improvement" (opt-out, 12-month
retention) in `app/[locale]/(marketing)/privacy/page.tsx`; `lib/motion.ts` exports
`easeOutCubic`, `countUpValueAt`, `riseClass`; en/sw parity tests
(`lib/i18n/translations.test.ts`, `lib/snap-strings.test.ts`); the docs' cited template
commits `799dc62`…`79307fa` (all dated 2026-09-15).

---

## Plans (explicitly NOT current facts)

These are intent, restated so nobody re-reads them as shipped state:

1. **Remote TemplateHub serving** — swap `templateProvider` to the remote client per
   environment, add the env vars to `.env.example`, integration-test both providers with
   native fallback. Not wired today.
2. **Real template families** — replace `families.ts` stub with a curated classification
   of the registry, and either populate or delete the non-existent ids referenced by
   `families.ts` and `schemas.ts`.
3. **Native template parity** — reconcile 218 native implementations / 267 mobile index
   entries / 266 web registry entries into one governed number.
4. **Docs cleanup** — the same false claims appear in `README.md`, `FINAL_STATUS.md`,
   `LAUNCH_READY.md`, `docs/HANDOVER.md`, `TEMPLATEHUB_REFACTOR_SESSION.md` and others.
   They need the same code-first treatment. Consider gating this file's numbers in CI so
   it cannot drift again.

---

## Could NOT be verified

- **PR numbers** (#279–#295, #296–#299): no `gh` CLI on this machine and no PR data in
  the working tree, so those attributions are unverifiable here. Commits are the only
  thing that can be checked locally.
- **"34 KB URLs verified live"** — the count in the file is 51; whether any were
  reachable when claimed cannot be reconstructed.
- **"48-file contrast sweep"**, "36px modal close taps" (only 10 `w-9 h-9` occurrences
  across 8 files), the "800+" and "100+" phrasing, and any claims about deployed
  production state (Vercel/Neon/Supabase) — none are verifiable from this repo.
- **Whether any deployment runs with remote templates enabled** — depends on
  environment configuration outside this tree.
