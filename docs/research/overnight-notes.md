# Overnight scan — running notes

## My own thread (web research, 2026-09-09 early AM)

### Local-first / offline sync (directly relevant to blueprint H3)
- **Supabase acquired Triplit (Oct 2025)** — Matt Linkous joined Supabase; open-sourcing everything; triplit.dev now parked, code on GitHub. Not yet integrated into the platform.
- **`@supabase-labs/tanstack-db`** (alpha) — syncs TanStack DB collections to Supabase tables over PostgREST + Realtime. TanStack DB = in-memory reactive store, live queries, optimistic mutations.
- **TanStack DB + RxDB** — RxDB as the local durable store replicating to Supabase Postgres; TanStack DB reads local, writes queue, sync engine flushes on reconnect. This is a real answer to "offline editing" without hand-rolling a queue.
- **Zero (Rocicorp)** — zero-latency reactive queries, server-authoritative cache, query-based sync. BUT offline **writes are rejected** in a fully disconnected state (only queued during brief "connecting"). Bad fit for matatu/load-shedding.
- **PowerSync** — backend change-stream → sync rules → client SQLite + dev-defined upload endpoint. Judged "more stable" than ElectricSQL in early-2026 evals.
- **ElectricSQL** — Postgres→SQLite via declarative "shapes". More powerful ceiling, rough edges around shape mgmt + reconnection as of Feb 2026.

### Dev tools
- **Lightpanda** — headless browser in Zig, ~11x faster than Chrome, 9x less memory, built for AI agents/automation. (Could replace Browserbase/Puppeteer for cheap scraping/QA.)
- **Biome** — Rust formatter+linter for JS/TS, one tool ~zero config. Replaces ESLint+Prettier stack.
- **Coolify** — self-host PaaS, one-click Postgres/Redis/etc + SSL/logs/backups. "Vercel on a cheap VPS you own."
- **CVE Lite CLI** — OWASP incubator; reads lockfile → OSV DB → copy-run fix commands (npm/pnpm/yarn/bun).
- **Context7 MCP** — real-time version-specific docs into the model, kills deprecated-API suggestions.
- **n8n-mcp** — build/edit/test n8n workflows from Claude Code in plain language.
- MCP registry now >9,400 servers; Anthropic SDKs >97M monthly downloads (early 2026).

### Swahili voice (blueprint: voice intake, TTS persona)
- **Facebook MMS fine-tunes for Swahili TTS** on HF (bookbot collection). MMS covers 1000+ langs.
- **Soniox** — real-time Swahili STT API for voice agents, low latency, streaming, 60+ langs.
- **Common Voice-derived Luganda+Swahili TTS dataset** — ~15h validated Swahili, 6 female speakers (matches the "Sumaiya = female voice" brand rule).
- arxiv 2510.16497 — **"Edge-Based Speech Transcription and Synthesis for Kinyarwanda and Swahili"** — on-device, exactly the cheap-Android + offline angle.

### Hermes skills worth a second look (already on disk, ~/.hermes/skills, 64 total)
- `30x-growth-marketing-panel` — 11-expert growth panel distilled from 4000+ YT hrs
- `autonomous-ai-agents`, `daa-agent` (Dynamic Agentic Architecture — agents that learn/evolve)
- `composio` — 1000+ external app integrations via CLI / agent building
- `codebase-memory-mcp-intelligence` — indexes codebase → knowledge graph for structural queries
- `skillclaw-skill-evolution` — collective skill evolution across multi-user agent ecosystems
- `inference-sh`, `jarvis-mission-control`, `deep-dive` (trace → deep-interview pipeline)
- **`codebase-memory-mcp`** (DeusData) — tree-sitter code-intelligence MCP: 155 langs, call graphs, dead-code, HTTP route linking across services, semantic search w/ bundled embeddings (no API key). Linux kernel (28M LOC) indexes in 3 min. **Genuinely useful for the incoming Nx monorepo** (web + native + shared pkgs). Install: `curl -fsSL .../DeusData/codebase-memory-mcp/main/install.sh | bash`
- `daa-agent` (ruflo-core) — agents that adapt from perf metrics + share knowledge. `skillclaw-skill-evolution` (ara.so) — proxy intercepts LLM calls, evolve-server distills sessions → SKILL.md, syncs across an agent cluster.

---

## Agent waves
- Wave 1 (in flight): AI/inference · offline/data · mobile/frontend · comms/emerging-markets/voice
- Wave 2 (queued): security/auth · devops/deploy/observability · design/creative · docs/dataviz gen
- Wave 3 (queued): competitor teardowns · job/ATS infra · growth/referral mechanics · deep-dives from W1
- Wave 4 (queued): wildcard — HN gems, papers, genuinely random
