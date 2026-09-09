# AI System Foundation — build status

Implements Stages 1–2 of the system blueprint (the published architecture doc):
the measurement layer, the entitlement seam, the provenance model, and the
capability-metadata layer on the existing assistant tool catalog. All additive —
no existing behaviour changed, `tsc` + full test suite green.

Branch: `feat/ai-system-foundation` (off `rebrand/sumaiya`).

---

## Landed

### 1. Product analytics — real PostHog (`lib/analytics/`)
- `events.ts` — the **typed event catalog**. Every event name + property shape in
  one place; `EVENTS.*` constants so a typo is a compile error. `ACTIVATION_EVENTS`
  defines the funnel north-star. Covers the 14 events the codebase already fires
  plus the AI / tool / trust / outcome / growth events the blueprint needs.
- `index.ts` — client entry (replaces the old `lib/analytics.ts`). `track()` and
  the `posthog` default export are unchanged for existing call sites; now also
  fire **PostHog** (lazy, DNT-respecting, session replay with all inputs + CV
  content masked). New: `capture(name, props)` typed helper, real `identify()` /
  `resetIdentity()`, `getFeatureFlag()`.
- `server.ts` — `posthog-node` for server-only events (AI cost, tool invocations,
  outcomes) that must not be trusted from the client. `serverFeatureFlag()`,
  `flushAnalytics()`.
- `provider.tsx` — `<AnalyticsProvider/>`, mounted in both root layouts. Ties
  events to the signed-in user via Supabase `onAuthStateChange`
  (identify on sign-in / refresh, reset on sign-out — shared phones don't merge).
- **No key set → Vercel-Analytics-only, exactly as before.** Nothing breaks.
- Env: add `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `POSTHOG_API_KEY`) — see `ENV_VARS.md`.

### 2. Entitlement seam (`lib/entitlements.ts`) — blueprint H7
- `can(subject, capability)` — the one function asked by web UI, native UI, the
  API (authoritative), and the assistant (which tools to offer). Pure, sync, no I/O.
- Everything resolves to `{ allowed: true }` today (`PAYMENTS_ENABLED = false`).
  A paid tier is a change to `CAPABILITY_RULES` + a grants lookup, not a refactor.
- Guests are blocked only from account-only capabilities (`application.track`,
  `career.interview`, `outcome.record`) with a stable `reason` the UI localizes.

### 3. Schema + migration (`drizzle/migrations/0009_ai_system_foundation.sql`)
Three additive tables (run `node --env-file=.env.local scripts/migrate-ai-system-foundation.mjs`):
- `tool_invocation` — the capability audit trail. Every guardrail-pipeline call
  leaves a row (caller, policy, outcome, cost class, latency, arg **hash**).
- `provenance` — field/span-level source tracking (blueprint H8).
- `eval_sample` — low-rate sample of generative tool IO for the nightly prod
  eval run.

> ⚠️ `drizzle-kit generate` is **not** this project's workflow — migrations are
> hand-written idempotent SQL + a `scripts/migrate-*.mjs` runner. `0009` follows
> that pattern.

### 4. Provenance model (`lib/provenance.ts` + `components/ui/provenance-chip.tsx`)
- `SourceKind`, `readyForFinal()`, `needsConfirmation()`, bilingual `sourceLabel()`,
  `sourceTone()`, `buildProvenanceRow()` (self-evident spans auto-confirm; AI
  new-fact claims don't).
- `<ProvenanceChip kind=… onClick=…/>` — builds on the shared `Badge`. Tone:
  neutral = your words, pine = AI but grounded, ember = confirm this is true.
- Rule: only **unconfirmed new-fact claims** block "export as final"; AI-tightened
  wording never does.

### 5. Tool capability metadata (`lib/assistant/tools.ts`)
- `AssistantTool` gains optional `policy` / `cost` / `offline` / `capability`.
- `toolMeta(id)` resolves full metadata, one `TOOL_META` map (no edits to the
  ~35-entry catalog), defaults derived from `sideEffect`.
- Encodes blueprint **D3**: anything that creates a named artifact, sends
  externally, or commits a fact is `confirm` — permanently (`cv.tailor`,
  `coverLetter.generate`, `jobs.track`, `letter.*`, `doc.convert`, …).

### Tests
`lib/analytics/events.test.ts`, `lib/entitlements.test.ts`,
`lib/assistant/tool-meta.test.ts`, `lib/provenance.test.ts` — full suite
936 → 960+ passing.

---

## Next pass (not done here — needs a full route rebuild to verify)

1. **`lib/assistant/run-tool.ts`** — the unified guardrail pipeline
   (auth → `can()` → quota → content-boundary → policy gate → execute →
   provenance write → `tool_invoked` event → eval sample). Wire the existing
   assistant-turn route + a couple of endpoints through it, starting with
   `ats.check` (pure) as the reference executor.
2. **Prompt registry** (`lib/ai/prompts/`) — version the big prompts in
   `lib/api/routes/ai.ts` + `mobile.ts`; record `promptVersion` on every
   `ai_call` event so a regression is bisectable.
3. **Model router** — task→model table; cheap model for classify/short-rewrite,
   strong for tailored CV / cover letter / interview.
4. **Wire it up** — `capture()` at the real activation call sites; `can()` in the
   Hono routes; `<ProvenanceChip/>` into the enhance-diff card; nightly prod
   eval job over `eval_sample`.

## What needs you
- Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel + `.env.local` (get it from the
  connected PostHog project → Settings → Project API Key).
- Run `0009` against the DB when ready:
  `node --env-file=.env.local scripts/migrate-ai-system-foundation.mjs`
