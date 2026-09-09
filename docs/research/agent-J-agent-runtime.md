# Agent J — production agent-runtime architecture (2025–26)

## Durable execution engines (ranked for a small Next+Supabase team)
- **DBOS** https://www.dbos.dev — "database-as-runtime," in-process library, persists app data + execution state into **Postgres/SQLite**. Decorators (`@DBOS.workflow/step/transaction`), exactly-once, transactional. `DBOSAgent` wraps Pydantic AI. MIT (Transact lib). **Excellent fit — point it at your Supabase Postgres → durability with ZERO new service.** Verify Supabase pooler compat.
- **Restate** https://restate.dev — lightweight single-binary durable execution server; `ctx.run()` = durable step boundary; "Awakeables" = idempotent suspension resumed by external signal (approval gates). Nov 2025 Vercel AI SDK + Pydantic AI integrations. OSS server (easy to self-host as a sidecar). **Strong — one binary next to your app, low ops tax.**
- **Vercel Workflow (WDK)** https://vercel.com/docs/workflow — TS-native, `"use workflow"`/`"use step"` directives, step-level retry + deterministic replay, token-based HITL resume. OSS (Apache-2.0), public beta since Oct 2025. **The engine underneath eve.** Best-aligned with Next-on-Vercel, no new infra. Beta risk.
- **Inngest** https://inngest.com — event-driven durable functions + queues + observability, serverless-native. `step.run()` retriable/memoized, `step.ai.infer()` offloads long inference, `step.waitForEvent()` suspends at no compute cost. Dev server OSS + managed cloud (generous free tier). **Very good for a small team — managed, TS-native.** Awkward when an agent generates a long dynamic loop vs fixed steps.
- **Temporal** https://temporal.io/solutions/ai — the mature language-agnostic platform. Journaled history, deterministic replay, `wait_condition()` + `@signal` for HITL. Official OpenAI Agents SDK integration GA Mar 2026. MIT self-host (heavy — Cassandra/Postgres + cluster) or Temporal Cloud. **Overkill operationally unless you use Cloud or outgrow lighter options.**
- **Cloudflare Workflows + Durable Objects** — `step.do()` retryable/memoized; **Durable Object per session** = cleanest "shared session state" primitive (single-threaded consistent actor + embedded SQLite). Workers paid ($5/mo base) + usage. Adds a second platform.
- **LangGraph / LangGraph Platform** — graph orchestration for complex branching multi-agent. **Checkpointer, NOT true durable execution** — you own retry/resume/side-effect dedup (a tool call can re-run on resume). First-class `interrupt()`/`Command(resume=)`. OSS MIT; Platform: Plus $39/user/mo + per-node + standby-minute. Best only when the agent logic is a genuinely complex graph you want to visualize.

## eve (github.com/vercel/eve) — announced June 17 2026
Filesystem-first TS framework for durable **backend** agents. "Next.js for agents." An agent = a directory:
```
agent/
  agent.ts          defineAgent() — model + runtime
  instructions.md   system prompt
  tools/            defineTool() + Zod schema; optional needsApproval
  skills/           Markdown procedures, loaded on demand
  connections/      MCP servers / OpenAPI APIs, auth via Vercel Connect (model never sees creds/URLs)
  channels/         Slack/Discord/Teams/Telegram/Twilio/GitHub/Linear adapters; HTTP API on by default
  subagents/        child agents w/ own tools/sandbox, clean context, return result to parent
  schedules/        cron handlers → Vercel Cron Jobs
  evals/            scored suites, run locally or vs deployed, wired into CI for regression detection
```
- **Sessions** = durable workflows on the Workflow SDK, checkpointed; survive crash/deploy, resume on *starting* code version (zero-downtime deploys).
- **Sandboxes** = isolated compute per agent for shell/scripts/file IO, separate security context (Vercel Sandbox deployed; Docker/microsandbox/bash local). Agent-generated code never touches your app runtime.
- **Agent Runs** = OTel spans (model/tool/sandbox calls) → Datadog/Honeycomb/Jaeger + a Vercel tab w/ full traces; queryable via Vercel MCP + `vercel agent-runs` CLI.
- **Ops**: git versioning w/ diffs/reviews, preview deploy per commit, instant rollback, no dashboard config.
- **Readiness**: BETA (API may change before GA). But Vercel runs 100+ agents on it internally in prod (d0 data analyst 30k+ Slack Qs/mo; Vertex support 92% ticket resolution; V router coordinating 100+ agents). Runtime is exercised hard; public API not yet stable.
- **License**: framework **Apache-2.0** free; managed pieces (orchestration/state/sandboxes) part of paid Vercel plan (~$20/mo). Model-agnostic.
- **The only framework packaging ALL SIX concerns** (durable sessions, tool registry, skills, MCP/OpenAPI connections, multi-channel, sandboxed exec, subagents, evals, OTel) into one filesystem convention.
- **Fit**: closest off-the-shelf match to "AI is the system, every capability a file, one channel layer, one eval pipeline." Adopt if you accept Vercel hosting + beta risk; else **steal its directory model** and wire Vercel Workflow + your own channel adapters.

## Tool registry / capability layer patterns
- **Core**: every capability = tool with (a) typed schema (Zod/JSON Schema, validated both directions), (b) policy (who/when/rate limits/scopes), (c) executor. **UI and LLM are equal callers of one executor** → one authz check, one audit entry.
- MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) are **client hints, NOT handler-side enforcement.**
- **MCP as internal bus** + an **MCP Gateway** in front for discovery, per-caller tool filtering, auth, audit. (Kong MCP registry, AWS MCP Gateway & Registry.)
- **Tool-call authz — the key insight** (Cerbos/Andromeda): the real question is "is *this operation on this resource* allowed under *the resource owner's* policy" — not a rule against tool argument names. Authz belongs with the resource, evaluated at execution time, with the **user's identity propagated (not the agent's service identity)**. **→ On Supabase this maps directly onto RLS: run tool DB access as the end user's JWT, and Postgres RLS IS your tool authz layer.** ← this is a big simplification for the blueprint's H7/H8.
  - Policy engines if you outgrow RLS: Cerbos, Permit.io, OPA, AWS Cedar for agents, P0.
  - Two-stage: (1) *tool filtering* — which tools reach the model's context (by role/scope); (2) *runtime access control* — per-call check with actual args + resource + user.
- **Human-approval gates**: tool declares `needsApproval` (static) or a policy returns "requires approval" (dynamic — amount > threshold, external recipient). Durable layer suspends the run, emits an approval request to the channel, resumes on decision. Log every decision (who/what/which policy/allow-deny).

## Observability & eval in production
- **Tracing**: OTel spans (there's now a **GenAI semantic-convention** for LLM spans) around the loop + every tool call. Capture: reasoning trace, tools considered vs invoked, args, responses, tokens/step, latency/hop — one hierarchical replayable trace. Tools: Braintrust, LangSmith, **Langfuse** (OSS self-host), **Arize Phoenix** (OSS), Mastra, Opik, DeepEval.
- **Production eval maturity path** (consensus): (1) get traces flowing; (2) **online scoring on a sample of live traffic** — attach LLM-judge + heuristic scorers to a % of prod traces, regressions surface as they happen; (3) recurring prod failures → **eval cases** (golden set grows from real incidents); (4) **same scorers in CI** to gate releases; (5) anomaly detection on traces (failing runs, new topics, frustrated users, injection patterns, timeout spikes, quality drift). **= exactly eve's `evals/` + CI, and matches TemplateHub's own eval-harness/feedback-flywheel gate.**
- **Replay**: durable-execution journals = deterministic replay (re-run workflow code against recorded step outputs). LangGraph calls it "time-travel." Useful for debugging + re-scoring past runs vs a new rubric.
- **Eval levels** (LangChain): run-level (did this execution succeed), trace-level (was the tool sequence/trajectory right), thread-level (was the multi-turn coherent). Need all three.

## Context assembly / memory
- **2026 consensus: memory is a dedicated architectural component, separate from the context window** (which is a capped per-turn budget). Types: working / episodic / semantic / procedural. Architecture: storage substrates + retrieval + agent control logic.
- **Per-turn pipeline: select → compress → order → isolate.**
  1. Select: recent turns + retrieved facts (vector + keyword + entity match) + relevant skill/procedure + tool schemas for in-scope tools.
  2. Compress/compact: summarize old turns at a token threshold (write-on-summary) or extract salient facts every turn (write-on-event).
  3. Order: most-relevant/recent nearest the query.
  4. Isolate: subagents get clean scoped context, not everything.
- **What works (not "just a vector DB")**: hybrid retrieval (vector + keyword + entity/graph); a fact-extraction layer writing structured memories (Mem0 2026: LoCoMo 92.5 at ~7k tokens/retrieval vs ~26k full-context — **~4× token reduction at equal/better recall**); explicit episodic→semantic consolidation on a schedule; **a structured single-source-of-truth domain object (= the Career Spine)** — authoritative, not embedded blobs.
- **Scoping context by permission (multi-scope memory)**: tag every memory write with identity scopes (`user`/`agent`/`session`/`org`); retrieval **composes scopes at query time** from the caller's identity, so a turn only assembles context the current user may see. **→ On Supabase: RLS on the memory tables + scope columns.**

## Multi-surface agents (one brain, many doors)
- **Gateway** funnels every channel (web, mobile, Slack, WhatsApp/Twilio, Telegram, email) into ONE control plane. Normalizes inbound, preserves per-channel identity + formatting + routing, drops into a **shared session store keyed by stable user identity (not channel)** — start on WhatsApp, continue on web, same session + context.
- **Channel adapters** = thin per-surface (parse inbound, render outbound: Slack blocks vs SMS plain text vs web rich UI, platform webhook/auth). eve's `channels/` + **Vercel Chat SDK** (skill `vercel:chat-sdk` — one `Chat` class, adapters for Slack/Telegram/Teams/Discord/Google Chat/GitHub/Linear, threads/messages/cards/modals/streaming) are direct implementations.
- **Shared session state** = durable: Cloudflare Durable Object per session, or a durable-execution session (eve/Temporal/Restate), or Postgres/Supabase `sessions` + `messages` tables + Realtime for web/mobile.
- **Web/mobile = just another channel** whose adapter also renders tool outputs as interactive UI. UI calls the tool layer directly for deterministic actions, streams the agent for conversational ones — same session record either way.

## The 4 hardest problems
1. **Non-determinism vs durable replay** — orchestration code deterministic + replayable; every non-deterministic op (LLM call, tool call, `Math.random`, `Date.now`) wrapped as a journaled memoized step; side-effects ONLY inside steps. Temporal/Restate/Workflow enforce it; LangGraph's bare checkpointer doesn't (why teams move off it for long-running agents).
2. **Tool-call authz with the right identity** — two-stage: filter tool list by role before the model sees it, then execution-time policy check (Cerbos/Cedar/OPA or **Postgres RLS with the user's JWT**) against the *actual resource + args* with propagated user identity. Never trust model args. Log every decision. Prompt-injection makes this non-negotiable — a compromised model must still not exceed the user's permissions.
3. **Context under a fixed budget without losing the thread** — explicit select/compress/order/isolate + compaction + hybrid retrieval + a structured spine object + fact extraction. Mem0-style ~4× token reduction at equal recall.
4. **Knowing it still works in prod** — OTel trace the full loop → online LLM-judge + heuristic scoring on sampled traffic → recurring failures → golden eval cases → same scorers gate CI → anomaly detection for drift/injection/new-topics. Eval set is a living asset that grows from incidents; gate merges on it.
+ Honorable mention: multi-surface identity resolution (WhatsApp# = web-user = Slack-user) + one durable session across all — gateway + stable identity keys + DO-per-session or durable-workflow-per-session + multi-scope memory tags.

## Reference architecture for "AI is the system" (2026)
Surfaces (Web/Mobile UI · Slack · WhatsApp/SMS · Email · Cron · Public API)
→ thin **Channel adapters** (parse in / render out)
→ **Gateway** (identity resolution, rate limit, routing, session lookup/create)
→ **Agent runtime** (one brain; context assembler; planner/loop) — durable checkpointed workflow, one session record per user-thread; ↔ **memory layer** (multi-scope user/session/org, hybrid retrieval, structured spine + episodic)
→ **Tool layer** (registry: schema + policy + executor; UI and LLM are equal callers)
→ every call passes: **authz/policy** (RLS/Cedar/Cerbos, executes as END USER identity) · **human-approval gate** (suspends durable run) · **audit log** (every call/decision/result)
→ Supabase (Postgres+RLS), external APIs via MCP/OpenAPI, Sandbox for generated code
→ OTel traces → observability + online eval scoring on sampled traffic → CI eval gate

**Defining properties**: (1) tool layer is the only API — no capability outside it; (2) one guardrail pipeline wraps every tool call regardless of caller — guardrails in the execution path, not the prompt; (3) durable sessions survive crashes/deploys, suspend for days at approval; (4) context assembled per turn under a token budget, scoped by caller permissions, memory a separate component; (5) eval continuous + shares code with CI; (6) channels thin and swappable — adding WhatsApp is an adapter file.

**Concrete for Sumaiya**: Next.js (surfaces + channel webhooks + tool executors as route handlers) · Supabase Postgres+RLS as tool-authz + session/memory store + Realtime · a durable engine (**eve or Vercel Workflow** if Vercel-native; **DBOS** on your existing Postgres; **Restate** as sidecar) · MCP gateway for external integrations · Langfuse/Braintrust for traces + eval · Vercel Sandbox for agent-generated code.
