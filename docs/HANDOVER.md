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

## Live now (2026-09-09)

Vercel project **`sumaiya.ai`** (team `hamisiddy9-9360s-projects`), git-connected
to `main`, root `apps/web`, Node 22. Serving on **`https://sumaiyaai.vercel.app`**
and **`https://templatehub.pro`** (the domain is attached to this project).

- Env vars set for Production + Development (not Preview — do that in the
  dashboard if you want PR previews to work): Supabase (`DATABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`),
  `DEEPSEEK_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`,
  `OUTCOME_SALT`, `SNAP_SHARE_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY/HOST`,
  `NEXT_PUBLIC_APP_URL`, `BROWSERBASE_*`.
- Migrations **0009 · 0010 · 0011 applied** to the production DB (verified: all
  7 tables present).
- Crons trimmed to 2 daily (`follow-ups`, `jobs`) for Hobby; the every-6h
  health check moved to `.github/workflows/health-cron.yml` (needs repo
  secrets `CRON_SECRET` + `PROD_URL`).

### Fixes shipped this session (found by real-use headless testing)

- **CSP was blocking PostHog** — analytics was fully dead in prod; fixed.
- **Cover-letter templates were English-only** ("Dear Hiring Manager," /
  "Sincerely,") regardless of language; now bilingual.
- **Bare unknown URLs returned 500** instead of 404 (no root layout for the
  fall-through); middleware now routes them through the `[locale]` tree.
- Brand icons (web favicon/PWA/OG + native icon/adaptive/splash) regenerated
  from the Sumaiya mark — they were still the old TemplateHub artwork.
- Swahili copy: "kazi" (work) vs "ajira" (employment) differentiated;
  "wa Aua" → "wa AI".
- PWA sign-in: 6-digit **code** flow for installed PWAs (a tapped magic link
  opens the browser and the session lands there). **Needs one Supabase step**
  → see below.

## What you still do

1. **Supabase — enable the OTP code.** Authentication → Email Templates →
   **Magic Link** → add a line with `{{ .Token }}` (e.g. `Your code: {{ .Token }}`).
   Without it the code sign-in for installed PWAs can't complete.
2. **Supabase — auth redirect URLs.** Authentication → URL Configuration → add
   `https://sumaiyaai.vercel.app/**` (and `https://sumaiya.pro/**` once bought)
   to Redirect URLs.
3. **GitHub repo → Settings → Secrets and variables → Actions**
   - Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, optionally
     `EVAL_FLAG_RATE_ALARM`.
   - Secrets: `DATABASE_URL` (nightly evals), `CRON_SECRET` + `PROD_URL`
     (health-cron).
4. **Domains** — buy `sumaiya.pro` (+ `.app`), attach to `sumaiya.ai`, then set
   `NEXT_PUBLIC_APP_URL` → `https://sumaiya.pro` and redeploy. Keep
   `templatehub.pro` for its SEO, 301 → sumaiya.pro.
5. **Vercel Pro** (when the card is fixed) — restores the every-6h health cron
   (move it back into `apps/web/vercel.json`, delete `health-cron.yml`), lifts
   cron limits, and unblocks a bigger build container.
6. **APK** — a debug-signed test build is being produced locally
   (`apps/native/android/app/build/outputs/apk/release/`). For a proper
   distributable: `cd apps/native && npx eas login && npx eas init &&
   npx eas build -p android --profile preview` (your Expo account; the build
   runs on Expo's cloud). Testers reinstall once — the package id changed.
7. **Optional infra** (all no-op until set):
   - `VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT` — web push
     (`npx web-push generate-vapid-keys`).
   - `AI_USER_MONTHLY_USD` — per-user monthly AI spend ceiling.
   - **Model router** — set `LITELLM_BASE_URL` + `LITELLM_API_KEY` (+
     `LITELLM_MODEL`) to a LiteLLM proxy **or to Vercel AI Gateway**
     (`https://ai-gateway.vercel.sh/v1`, OpenAI-compatible — the `litellm`
     provider speaks it directly) for failover, spend caps, and per-request
     cost logging.
   - **WhatsApp** — `apps/whatsapp/README.md`: Meta app, deploy the worker,
     webhook, `WHATSAPP_WORKER_SECRET` on both sides.
8. Later: Supabase Pro (stop the 7-day idle pause), Resend sending domain
   `sumaiya.pro` (SPF/DKIM/DMARC), Google OAuth redirect, a real Android
   release keystore for Play Store, regenerate OG/store screenshots.

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
