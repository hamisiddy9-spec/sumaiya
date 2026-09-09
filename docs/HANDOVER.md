# Sumaiya — handover

State of the `sumaiya` monorepo as handed over. Verified in GitHub Actions
(`.github/workflows/ci.yml`) — this dev box can't run the full 946-test suite
(7.6 GB RAM), so **CI is the source of truth**.

## What's here

```
apps/web/     Next.js 14 — marketing, editor, dashboard, the Hono API, 273 templates
apps/native/  Expo 57 / RN 0.86 — the Android app
packages/     @sumaiya/{types,utils,hooks,api-client,templates,design-tokens} — shared source
```

Two package trees: web + packages are an npm workspace (React 18); **apps/native is a
standalone `npm` project** (React 19) with `@sumaiya/*` as `file:` links. See `README.md`.

## Verified green in CI

| job | covers |
|---|---|
| **web** | `tsc` · `next lint` · **946 vitest** · `next build` |
| **web-evals** | anti-fabrication / repeat-guard / tone eval suite |
| **native** | `tsc` · `jest` (74) · `expo export` (Android bundle) |

Run it yourself: push any branch and open a PR, or push to `main`.

## What was built this cycle (all additive — no existing user flow changed)

- **Rebrand** TemplateHub → Sumaiya (name, domain `sumaiya.pro`, package id
  `pro.sumaiya.app`, the three-blade mark, storage keys, `su-cache` SW).
- **Analytics** — real PostHog (client + server + `identify`), a typed event
  catalog (`lib/analytics/events.ts`), `<AnalyticsProvider>`. No key set → Vercel
  Analytics only, exactly as before.
- **Entitlements** — `can(subject, capability)` (`lib/entitlements.ts`). All "free"
  today; the seam is real.
- **Capability layer** — `lib/assistant/run-tool.ts`: one guardrail pipeline
  (validate → precondition → entitlement → content-boundary → AI quota → policy
  gate → execute → `tool_invocation` row → `tool_invoked` event → eval sample).
  Reference executors: `ats.check`, `jobs.match`, `outcome.record`.
  `POST /api/capabilities/:toolId` — additive; nothing calls it yet by design.
- **Provenance** — `lib/provenance.ts` + `lib/provenance-write.ts` +
  `<ProvenanceChip>`. Model + writer ready; not yet wired into the enhance card.
- **Prompt registry** — `lib/ai/prompts.ts` — versioned prompt ids.
- **Native ↔ server** — `@sumaiya/api-client.runCapability()` +
  `registerPushToken()`; Bearer `PUT /api/mobile/device-token` (fixes blueprint
  H2 — the old cookie-only route is deleted).
- **Web push** — `lib/push/` + `/api/push/*` + SW handlers. Env-gated `VAPID_*`.
- **DB** — migrations `0009` (tool_invocation, provenance, eval_sample) and `0010`
  (device_token, web_push_subscription). **Not applied yet** — see below.

## What you do — in order

1. **Fix the Vercel card** → upgrade the team to Pro → create a Vercel project
   from `hamisiddy9-spec/sumaiya`, **root directory `apps/web`**, framework Next.js.
2. **Env vars** on the new project (same Supabase `ayczgaddnufdxnhizpcr`):
   `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, `DEEPSEEK_API_KEY`, `CRON_SECRET`, and add
   `NEXT_PUBLIC_POSTHOG_KEY` (+ `POSTHOG_API_KEY`), `OUTCOME_SALT` (any long
   random string — the outcome loop no-ops without it), optionally
   `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
   (`npx web-push generate-vapid-keys`).
3. **Run the new migrations** against the DB:
   ```
   cd apps/web
   node --env-file=.env.local scripts/migrate-ai-system-foundation.mjs   # 0009
   node --env-file=.env.local scripts/migrate-push-tokens.mjs             # 0010
   ```
4. **Domains** — buy `sumaiya.pro` + `sumaiya.app`, attach to the project;
   keep `templatehub.pro` on the same project 301-redirecting to `sumaiya.pro`.
5. GitHub repo **Settings → Variables** for CI: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`,
   `NEXT_PUBLIC_POSTHOG_HOST`.
6. Later: Supabase Pro, Resend sending domain `sumaiya.pro` (SPF/DKIM/DMARC),
   Google OAuth redirect for `sumaiya.pro`, a new Android keystore for
   `pro.sumaiya.app`, regenerate the icon/OG PNGs from the three-blade mark,
   WhatsApp Cloud API business setup.

## Next engineering (Stage 3 core + Stage 5 rest — not started)

- Wire the assistant-turn route + enhance/tailor routes **through** `runTool`
  (currently dispatch directly). Migrate one tool at a time.
- Generative executors (`cv.section.enhance`, `cv.tailor`, `coverLetter.generate`)
  → return `ProvenanceSpan[]`; render the chip + "what changed" diff in the
  enhance card.
- Model router: LiteLLM proxy + hard per-user budget caps.
- Outcome-loop UI (the `outcome.record` tool exists), referral loop, WhatsApp
  worker (`apps/whatsapp`), guided Swahili voice intake.
- RLS-as-tool-authz (run tool DB access as the user's JWT).
- Nightly prod eval job over `eval_sample`.

See the published artifacts: rebrand proposal · product audit · system blueprint ·
competitor teardown · overnight scan · stack research-delta (links in the session
index, and in the `sumaiya-session-artifacts` note).
