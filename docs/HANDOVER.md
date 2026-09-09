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
| **web** | `tsc` · `next lint` · vitest (full suite) · `next build` |
| **web-evals** | anti-fabrication / repeat-guard / tone eval suite |
| **whatsapp** | `node --test` (worker unit tests) |
| **native** | `tsc` · `jest` · `expo export` (Android bundle) |

Run it yourself: push any branch and open a PR, or push to `main`.
`nightly-evals.yml` runs 02:17 UTC (needs the `DATABASE_URL` **secret** on the
repo) — a report, not a gate.

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
- **Generative executors** — `cv.improveSummary` / `cv.tailor` /
  `coverLetter.generate` run inside `run-tool`: prompt from the CV in context →
  model → evidence engine → `ProvenanceSpan[]` (ai_tightened, or ai_suggested
  when a claim isn't backed by the real CV). `executableTools()` lists them.
- **Provenance write-through** — `run-tool` persists every returned span
  (`writeProvenance`, one `invocationId`) when the caller passes
  `context.extra.docId` + `docType`. `lib/ai/prompts.ts` versions stamp the
  `eval_sample`.
- **"What changed" diff** — `lib/text-diff.ts` + `<WhatChanged>`; wired into
  the CV enhance modal and the shared `<AiSuggestionModal>` (cover-letter +
  letter editors). The user sees exactly which words the AI touched, with the
  source chip, before applying.
- **Tool row-ownership authz** — `lib/assistant/tool-authz.ts`: a tool naming an
  `applicationId` / existing `docId` can't act on another user's row.
- **Model router** — a `litellm` provider (tried first when `LITELLM_BASE_URL` +
  `LITELLM_API_KEY` are set) + `lib/ai/budget.ts` per-user **monthly USD
  ceiling** (`AI_USER_MONTHLY_USD`, off by default) enforced in the pipeline.
- **Outcome loop** — `<OutcomeCheck>` on an application sat on 4+ days:
  one-tap "Any news from {company}?" → `outcome.record` through the pipeline
  (the only path that logs the terminal "hired" signal).
- **Referral loop** — `referral_code` / `referral_claim` (migration `0011`),
  `/api/referral{,/claim,/shared}`, `<ReferralCatch>` (captures `?ref=`, redeems
  on sign-in, mounted in both layouts), `<ReferralCard>` on the dashboard.
- **WhatsApp worker** — `apps/whatsapp/` (dependency-free Node 20) + Bearer
  `POST /api/whatsapp/turn`. Guest-mode career coaching over WhatsApp,
  per-sender daily cap. Env-gated on `WHATSAPP_WORKER_SECRET`. See
  `apps/whatsapp/README.md` for the Meta setup.
- **Voice intake** — `/voice`: guided bilingual Q&A, browser SpeechRecognition
  (free, Swahili supported) → `/api/ai/build-cv` → editor. Types-only fallback
  when unsupported. "Sema CV / Voice CV" action on the dashboard.
- **Nightly prod evals** — `scripts/run-prod-evals.ts` +
  `.github/workflows/nightly-evals.yml`: re-scores the PII-free `eval_sample`.
- **Reserved packages** — `@sumaiya/core`, `@sumaiya/analytics`.
- **Prompt registry** — `lib/ai/prompts.ts` — versioned prompt ids.
- **Native ↔ server** — `@sumaiya/api-client.runCapability()` +
  `registerPushToken()`; Bearer `PUT /api/mobile/device-token` (fixes blueprint
  H2 — the old cookie-only route is deleted).
- **Web push** — `lib/push/` + `/api/push/*` + SW handlers. Env-gated `VAPID_*`.
- **DB** — migrations `0009` (tool_invocation, provenance, eval_sample),
  `0010` (device_token, web_push_subscription), `0011` (referral_code,
  referral_claim). **Not applied yet** — see below.

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
   New optional env this cycle (all features no-op without them):
   - `WHATSAPP_WORKER_SECRET` — shared secret, also set on the worker.
     `WHATSAPP_AI_PER_DAY` (default 40) caps free replies per sender.
   - `LITELLM_BASE_URL` + `LITELLM_API_KEY` (+ `LITELLM_MODEL`) — route all AI
     through a LiteLLM proxy for central spend caps / routing / logging.
   - `AI_USER_MONTHLY_USD` — per-user monthly AI spend ceiling (e.g. `2`).
   - `EVAL_FLAG_RATE_ALARM` (repo **variable**, default `0.15`) for the nightly
     eval job; its `DATABASE_URL` is a repo **secret**.
3. **Run the new migrations** against the DB:
   ```
   cd apps/web
   node --env-file=.env.local scripts/migrate-ai-system-foundation.mjs   # 0009
   node --env-file=.env.local scripts/migrate-push-tokens.mjs             # 0010
   node --env-file=.env.local scripts/migrate-referral-loop.mjs           # 0011
   ```
4. **Domains** — buy `sumaiya.pro` + `sumaiya.app`, attach to the project;
   keep `templatehub.pro` on the same project 301-redirecting to `sumaiya.pro`.
5. GitHub repo **Settings → Variables** for CI: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`,
   `NEXT_PUBLIC_POSTHOG_HOST`.
6. Later: Supabase Pro, Resend sending domain `sumaiya.pro` (SPF/DKIM/DMARC),
   Google OAuth redirect for `sumaiya.pro`, a new Android keystore for
   `pro.sumaiya.app`, regenerate the icon/OG PNGs from the three-blade mark.
7. **WhatsApp** (optional rail) — `apps/whatsapp/README.md`: create the Meta
   app, deploy the worker, set the webhook, set `WHATSAPP_WORKER_SECRET` on
   both sides.
8. **Nightly evals** — add `DATABASE_URL` as a repo **secret** so
   `nightly-evals.yml` can score `eval_sample`.

## Engineering left (deliberately not done)

- **Routing the mature `/api/ai/{enhance,tailor-cv,cover-letter}` endpoints and
  the assistant client's tool dispatch through `run-tool`.** The guardrail
  pipeline is real and load-bearing for `/api/capabilities` + the generative
  executors; those legacy endpoints already carry quota + content-boundary +
  the evidence check, and the assistant client's preview/confirm/evidence flow
  is heavily tested. Re-plumbing it is a large refactor with real regression
  risk and little user-visible gain — left for a focused pass, not bundled here.
- **Account linking for WhatsApp** (a code texted from inside the app) — the
  worker is guest-mode today.
- **RLS at the Postgres layer.** Ownership is enforced in `run-tool`
  (`tool-authz.ts`); pushing it into Supabase RLS policies is a separate,
  DB-side project.

See the published artifacts: rebrand proposal · product audit · system blueprint ·
competitor teardown · overnight scan · stack research-delta (links in the session
index, and in the `sumaiya-session-artifacts` note).
