# Agent B — offline-first / data / Postgres / analytics infra

## Sync engines
- **PowerSync** https://github.com/powersync-ja — **best match**: streams Postgres changes → on-device SQLite, full offline read+write w/ automatic upload queue + retries, official RN/Expo SDK, sync rules = server-side per-user row filtering. Client SDKs Apache-2.0; sync service FSL (→Apache after 2y). Runs against Supabase Postgres directly. Generous free tier.
- **ElectricSQL** https://github.com/electric-sql/electric — Postgres read-path only ("shapes" over HTTP, CDN-scalable, stateless). Joined **Databricks** Aug 2026. You own the write path. Good for pushing curated read data (jobs, courses).
- **Zero (Rocicorp)** https://github.com/rocicorp/zero — 1.0 June 2026. Best perceived latency (optimistic + fine-grained reactivity). Needs a `zero-cache` server beside Postgres + persistent connection. **Offline writes rejected when fully disconnected.** Not a Supabase drop-in.
- **Triplit** https://github.com/aspen-cloud/triplit — acqui-hired by Supabase Aug 2025, **now community-maintained, no full-time team** → watch, don't adopt.
- **TanStack DB** https://tanstack.com/db — v0.6 (Mar 2026) added SQLite persistence + offline (web, RN/Expo, Node, Electron, Tauri). Slots into existing TanStack Query apps incrementally; pluggable sync (Electric/Zero/plain REST); keep Supabase PostgREST as sync source. **Lowest-commitment "local-first-ish" path.**
- **Jazz** https://github.com/garden-co/jazz — local-first DB w/ built-in auth/permissions/E2E encryption; nice guest→account model; but wants its own sync cloud → architecture swap, not add-on. 2.0 alpha.
- **Evolu** https://github.com/evoluhq/evolu — TS local-first, SQLite + CRDT, E2E encrypted relay. MIT. **Encrypted relay = server can't query user data** → kills server-side matching/AI over profiles.
- **LiveStore** https://github.com/livestorejs/livestore — event-sourcing + reactive SQLite, full history/audit, first-class Expo. Apache-2.0. But you run its sync backend (Cloudflare) → Supabase becomes just auth/storage.
- **TinyBase** https://github.com/tinyplex/tinybase — tiny (~5–11kB) reactive store + persisters for everything (IndexedDB/SQLite/PGlite/PowerSync/Electric/Yjs/Automerge). MIT. Pragmatic glue for a lean guest-first app.
- **cr-sqlite** (vlcn) https://github.com/vlcn-io/cr-sqlite — SQLite extension turning tables into CRDTs (`crsql_as_crr('table')`). v0.15.1 Sept 2026. Bus-factor 1, fiddly in Expo → experimental.
- **Yjs / Automerge** — only if you add real-time collaborative editing (two people one CV). Overkill + heavy per-doc for single-user.
- **Dexie + Dexie Cloud** — web/PWA only (IndexedDB, no RN). Background Sync even after tab close.

## SQLite↔Postgres sync-queue patterns
- **sqlite-sync (SQLite AI)** https://github.com/sqliteai/sqlite-sync — CRDT sync as a SQLite extension, direct to Postgres/Supabase, server-enforced RLS partial sync. **Elastic License 2.0 (commercial license for prod)** — the catch.
- **expo-sqlite + Drizzle + roll-your-own outbox** — the 2026 default local stack. `expo-sqlite` + Drizzle typed queries + `useLiveQuery` + `drizzle-kit` migrations on-device. You implement: `pending_mutations` outbox, `updated_at` LWW, retry-backoff, `deleted_at` tombstones. **The realistic baseline — fully under your control, no infra, no licensing.**
- **RxDB** https://github.com/pubkey/rxdb — reactive client DB, pluggable storage, backend-agnostic replication protocol, community Supabase plugins, explicit conflict handlers. ~22k★ Apache-2.0 core (some premium plugins paid).
- **WatermelonDB** https://github.com/Nozbe/WatermelonDB — RN-first SQLite ORM, documented `synchronize()` protocol. **Official Supabase blog walkthrough exists** (`_changed`/`_status` cols, Postgres pull function, RPC push). Good reference architecture even if unused. MIT.

## Edge / embedded DBs
- **Turso Database** https://github.com/tursodatabase/turso — SQLite rewritten in Rust: async, native vectors, MVCC, `BEGIN CONCURRENT`, built-in sync primitives. Embedded-replica model compelling for offline Android — but it's a 2nd DB system vs Supabase. Pre-1.0. Watch.
- **PGlite** https://github.com/electric-sql/pglite — full Postgres in WASM, <3MB gzip, pgvector + PostGIS (v0.4 Mar 2026), live queries, Electric sync. 1M→13M weekly downloads in a year. Now a Databricks project. **Killer for the PWA/web build** ("same SQL on device and server"); NOT for RN (no WASM Postgres on Hermes).
- **Official SQLite Wasm** https://github.com/sqlite/sqlite-wasm — v3.53 (Apr 2026), OPFS `opfs-wl` VFS. Old Worker1/Promiser1 APIs deprecated → use OPFS SAHPool. Web only.

## Postgres tooling
- **Atlas (Ariga)** https://github.com/ariga/atlas — "Terraform for DB schema": declare schema, diff+plan migrations, CI linting for destructive changes, **RLS policies in version control**. Valuable for a guest-first app where RLS is the whole security model.
- **pgroll (Xata)** https://github.com/xataio/pgroll — zero-downtime reversible migrations by serving multiple schema versions simultaneously. Single Go binary. **Solves "old app version still syncing against new schema."** Adopt at first painful migration.
- **dbmate** https://github.com/amacneil/dbmate — minimal language-agnostic plain-SQL migration CLI, single binary. For migrations outside Supabase CLI.
- **Neon** — a branch per feature/PR = cheap isolated Postgres to test migrations + sync logic before prod. (Supabase + Xata now have branching too.)

## Self-host analytics / warehouse
- **OpenPanel** https://github.com/Openpanel-dev/openpanel — product + web analytics (Mixpanel/PostHog-lite), one `docker compose`, 2.3kB SDK, runs on ~€8/mo VPS. AGPL-3.0. **Realistic self-hosted choice; check offline event batching.**
- **Pug** https://pug.sh — single Go binary product analytics (Postgres + ClickHouse + NATS). Younger — pilot it.
- **ClickHouse** — only when event volume outgrows Postgres (needs ~4CPU/8GB). Know it's the next step.
- **DuckDB** — in-process OLAP, `pip install duckdb`, reads Parquet/Postgres directly. **Perfect for the team's own offline analysis** (pull a Parquet dump, query locally, no infra). Not in-app.

## "Same query device + server"
- **Drizzle ORM** — same query builder targets `expo-sqlite` on device and Supabase Postgres on server; code reads identically. **Most pragmatic for this exact stack.**
- PGlite + Electric = literal same Postgres dialect (web only).
- PowerSync = consistent row sets, not identical SQL (best for Expo).

## Bottom line
1. **Baseline now:** expo-sqlite + Drizzle + hand-rolled outbox/LWW queue vs Supabase (WatermelonDB protocol as reference). No new infra, no licensing.
2. **Queue solved for you:** PowerSync (accept FSL or use their cloud).
3. **PWA/web:** PGlite or SQLite Wasm + Electric read sync.
4. **Analytics:** `events` table in Supabase → self-hosted OpenPanel if volume grows → DuckDB for own analysis.
5. **Migrations:** Supabase CLI + pgroll when one threatens to lock prod / break mid-sync clients.
6. **Watch don't adopt:** Triplit (no maintainers), cr-sqlite/sqlite-sync (bus-factor/license), Turso (pre-1.0, 2nd DB), Jazz/Evolu (replace Supabase, not extend).
