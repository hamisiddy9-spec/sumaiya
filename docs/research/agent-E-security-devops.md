# Agent E — auth / app-sec / devops / observability / FinOps (verified active 2025–26)

## Auth (Next.js + Expo)
- **Better Auth** https://github.com/better-auth/better-auth — framework-agnostic TS auth: email/OTP, magic link, passkeys, orgs, multi-session, "revoke all sessions". **Took over Auth.js/NextAuth maintenance Sept 2025 → now the default for new projects.** First-class Expo plugin (SecureStore). MIT, ~16k★. *One auth layer for web + Expo, phone/OTP + magic link built in, no per-MAU pricing (vs Clerk).*
- **expo-better-auth-passkey** (lobehub) https://github.com/lobehub/expo-better-auth-passkey — WebAuthn/passkeys on Android 10+/iOS 16+/web (Better Auth's own passkey plugin is browser-only). Alt: iosazee/expo-passkey. MIT, small but active. *Passwordless for users who hate typing on cracked keyboards; OTP fallback.*
- **Supabase Auth (GoTrue)** https://github.com/supabase/auth — phone OTP, **anonymous sign-in**, MFA, `auth.admin.signOut(userId,'global')`. Custom access-token hook bakes `role`/`plan` into JWT so RLS stays cheap. *Anonymous sign-in = try the AI tools before committing a phone number → activation lift on data-cost-sensitive users.*
- **Stack Auth** https://github.com/stack-auth/stack-auth — self-hostable Clerk alternative, Next-first, pre-built UI, orgs, impersonation. MIT, ~6k★. Backup if Better Auth's hosted-UI story feels too DIY.

## App security
- **Arcjet (`@arcjet/next`)** https://github.com/arcjet/arcjet-js — one SDK: rate limiting + bot detection + WAF/Shield + email validation + PII redaction + **prompt-injection detection**. Runs in Next middleware (edge + Node), offline dev, cached decisions. Apache-2.0 SDK + hosted engine w/ free tier. *One drop-in guard for `/api/enhance-cv` + OTP endpoints; prompt-injection rule protects AI routes.*
- **Unkey** https://github.com/unkey/unkey — API-key issuance/verify + distributed rate limiting (per key/IP/identity) + usage credits + RBAC. Fully self-hostable (MySQL+Redis). `@unkey/ratelimit` standalone. AGPL-3.0 / MIT SDKs, ~4k★. *Per-user AI quota ("20 enhancements/mo free") enforced at edge; keys if a university/partner API tier appears.*
- **rlsautotest** https://github.com/unitautogen/rlsautotest — reads your Supabase RLS policies from the catalog → auto-generates pgTAP suite + seed data + per-identity access matrix + **CI gate that fails on any row leak**. Featured in Supabase's July 2026 update. Beta, single-maintainer — pin versions. *The entire security boundary is RLS; this proves it in CI without hand-writing test SQL — high leverage for a team with no security person.*
- **Gitleaks** https://github.com/gitleaks/gitleaks — fast secret scanner, sub-second pre-commit + CI. ~20k★ MIT. *Stops a Supabase service-role / AI key leaking into the public repo — the single most expensive bootstrapped mistake.*
- **OSV-Scanner** (Google) https://github.com/google/osv-scanner — low-noise SCA over OSV.dev, `osv-scanner fix` remediation. Apache-2.0. *Quiet dependency gate that won't drown a 2-person team.*
- **Syft + Grype** (Anchore) — SBOM gen + weekly re-scan of deployed artifacts against new CVEs. Apache-2.0. ⚠️ **Trivy distribution compromised twice March 2026 — prefer Syft/Grype/OSV or pin Trivy hard.**
- **Nosecone (`@nosecone/next`)** https://github.com/arcjet/arcjet-js/tree/main/nosecone — tiny dependency-free security-headers lib (CSP + nonce helpers, HSTS, COOP/CORP). Modern replacement for semi-abandoned `@next-safe/middleware`. Apache-2.0. *Strict CSP w/ nonces on the web app in ~15 lines.*
- **OpenGrep** https://github.com/opengrep/opengrep — community fork of Semgrep CE (after Semgrep relicensed rules), vendor coalition-backed, pattern SAST for TS/JS. LGPL-2.1. *Free SAST in CI, no lock-in.*

## DevOps / deploy / CI
- **RunsOn** https://github.com/runs-on/runs-on — self-hosted GH Actions runners in *your* AWS, ephemeral EC2/job, GPU runners, 5–13× cheaper. Source-available, ~€300/yr flat, free non-commercial. *If Expo/EAS builds + Playwright E2E eat GH Actions minutes, ~90% CI cost cut on spot.*
- **Ubicloud** https://github.com/ubicloud/ubicloud — open cloud on bare metal (Hetzner), drop-in cheaper GH Actions runners (~7× price-perf, one-line `runs-on:` change) + VMs + managed Postgres. AGPL. ~5k★. *Cheapest CI runner swap, no AWS account; future Postgres escape hatch.*
- **Coolify** https://github.com/coollabsio/coolify — self-host PaaS, Git-triggered **preview deployments that auto-delete on PR close**, scoped env vars, built-in DBs. Apache-2.0, ~40k★, full-time team. *Preview envs on a $10–20/mo VPS instead of Vercel Pro seats; keep Vercel for prod (or move prod here later).*
- **Trigger.dev v4** https://github.com/triggerdotdev/trigger.dev — durable TS background jobs/workflows: retries, cron, queues, concurrency, **no timeout limits** (own machines), full observability. Genuinely self-hostable w/ unlimited runs (vs Inngest's dev-server-only OSS). Apache-2.0, ~11k★. *Long AI jobs (batch CV gen, embeddings backfill, weekly job-match emails) past Vercel's function limits; self-host worker on the Coolify VPS.*
- **GO Feature Flag** https://github.com/thomaspoignant/go-feature-flag — OpenFeature-native, single Go binary, no DB, flags in file/S3/GitHub (GitOps), progressive rollout + A/B. OpenFeature SDKs for JS/React/RN → web + Expo share one client. MIT, no paid core. *Canary a risky AI-prompt change to 5%; dark-launch Swahili features per region, no infra/vendor bill.* (Flagsmith = heavier alt with UI + identity traits.)

## Observability
- **GlitchTip** https://glitchtip.com — Sentry-SDK-compatible error tracking + uptime; switch by changing only the DSN. **Much lighter self-host than Sentry** (which dropped its free self-host license). MIT. *One container next to other services, Next + Expo crashes via standard `@sentry/*` SDKs, no per-event cost.*
- **SigNoz** https://github.com/SigNoz/signoz — OTel-native traces+metrics+logs, ClickHouse-backed. `@vercel/otel` + `instrumentation.ts` wires Next server + edge in minutes. MIT, ~22k★. *One pane for "why is the AI route slow/erroring" across web + API.*
- **HyperDX** https://github.com/hyperdxio/hyperdx — OSS logs/traces/metrics/**session replay** w/ log↔error correlation. Acquired by ClickHouse 2025, now basis of their observability product. MIT, ~8k★. *Session replay of the exact click that broke the CV editor — helps debug low-end Android WebView quirks.*
- **Uptime Kuma** https://github.com/louislam/uptime-kuma — self-host uptime monitor, ~40 monitor types, ~95 notification integrations, built-in public status page, push/heartbeat. MIT. *Monitor site + Supabase REST + a synthetic "AI enhance" heartbeat; free public status page.* Alts: Gatus (YAML-in-Git), Kener (nicer status page).
- **OpenPanel** — (also in Agent B/D) covers web + mobile analytics in one, RN/Expo SDK, cookieless, AGPL-3.0.

## Cost control / FinOps
- **LiteLLM** https://github.com/BerriAI/litellm — proxy over 100+ providers, unified OpenAI API, **hard per-key/per-user/per-team budget caps**, real-time spend, fallbacks, caching, rate limits. MIT, ~18k★. *Route every AI call through it; global monthly cap so a bug/abuse can't produce a surprise $2000 bill. Also enables cheap-model routing.*
- **Langfuse** — per-trace token cost + latency + prompt versioning; attribute spend to features/users. *See that "cover-letter gen" costs 4× "summary enhance" and price/limit accordingly.*
- **GPTCache** — semantic cache; ⚠️ maintenance slowed 2026 → **prefer LiteLLM's built-in caching**.
- **Vercel AI Gateway** — one base-URL change → routing + failover + per-request cost logging, free tier, zero-infra. *Lowest-effort spend visibility if staying on Vercel; combine w/ Supabase Spend Cap + Vercel spend alerts as poor-man's FinOps.*

## ⚠️ Do NOT adopt
- **Highlight.io** — acquired by LaunchDarkly, hosted service deprecated Feb 2026. Use SigNoz/HyperDX/GlitchTip.
- **Trivy** — supply-chain compromise March 2026 (×2); if used, pin action SHA + binary hash.
- **GPTCache** — slowing; use LiteLLM caching.
