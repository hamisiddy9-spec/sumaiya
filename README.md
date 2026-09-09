# Sumaiya

**Get hired with AI.** A bilingual (Swahili / English) AI career assistant — CV builder,
ATS matching, job tailoring, application tracking — for East Africa, built mobile-first
for cheap Android phones.

> Rebranded from "TemplateHub" (2026-09). Planning docs: `docs/` and the session index
> artifact. Architecture direction: `docs/AI_SYSTEM_FOUNDATION.md` + the system blueprint.

## Layout

```
sumaiya/
├─ apps/
│  ├─ web/       Next.js 14 (App Router) — marketing, editor, dashboard, the Hono API.  @sumaiya/web
│  └─ native/    Expo 57 / RN 0.86 — the Android app.                                    @sumaiya/native
├─ packages/     Source-first internal packages, shared by native (web has its own lib/):
│  ├─ types/          @sumaiya/types
│  ├─ core/           (reserved — deterministic engine extraction, blueprint Stage 1)
│  ├─ analytics/      (reserved — shared event schema)
│  ├─ utils/          @sumaiya/utils        (OCR, template-match, sync-queue, offline-storage)
│  ├─ hooks/          @sumaiya/hooks
│  ├─ api-client/     @sumaiya/api-client   (one typed client for the Hono API, Bearer auth)
│  ├─ templates/      @sumaiya/templates
│  └─ design-tokens/  @sumaiya/design-tokens
├─ turbo.json         task graph for the web workspace
└─ tsconfig.base.json shared compiler options + @sumaiya/* path map
```

## Package management — two trees

Web needs React 18 (Next 14.2); native needs React 19 (Expo 57). They can't share one
hoisted `node_modules`, and `pnpm install` OOMs on the current dev box. So:

- **`apps/web` + `packages/*`** are an **npm workspace** (root `package.json`) — React 18 tree.
- **`apps/native`** is a **standalone npm project** — its own `node_modules` (React 19),
  `@sumaiya/*` referenced as `file:../../packages/*` (symlinked).

## Commands

```bash
# from the repo root
npm install                 # web + packages
npm run native:install      # native (standalone) — first run, then: cd apps/native && npm ci

npm run web:typecheck       # tsc, apps/web
npm run web:build           # next build (serialized static gen — see next.config.mjs)
npm run web:test            # vitest (946 tests)
npm run web:dev             # next dev

npm run native:typecheck    # tsc, apps/native
npm run native:test         # jest-expo
npm run native:export       # expo export --platform android  (bundle check)
npm run native              # expo start
```

## Build notes (7.6 GB dev box)

- `next build` OOMs with default parallel prerender of the 273 templates.
  `apps/web/next.config.mjs` serializes it (`cpus: 1`, `staticGenerationMaxConcurrency: 1`).
  CI with more RAM: set `NEXT_BUILD_CPUS`.
- Big installs: `NODE_OPTIONS=--max-old-space-size=2048 npm install --maxsockets 3`; native
  via `npm ci --prefer-offline --ignore-scripts` in the foreground.

## Status

| | typecheck | build | tests |
|---|---|---|---|
| web | ✅ | ✅ `next build` | ✅ 946 vitest |
| native | ✅ | ✅ `expo export` (3203 modules) | see `npm run native:test` |

Seeded from `~/TemplateHub` (`feat/ai-system-foundation`) + `~/templatehub-native`.
Both source repos remain on GitHub as backups.
