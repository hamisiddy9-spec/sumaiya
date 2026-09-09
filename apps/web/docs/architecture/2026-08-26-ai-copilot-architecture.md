# Sumaiya AI-First Career Copilot — Architecture Proposal

**Date:** 2026-08-26
**Status:** Proposal for review (Hermes → Hamis/Claude)
**Scope:** Evolve Sumaiya from "CV builder with AI" into an AI-first document & career copilot where **AI Chat is the orchestration layer** and the editor, templates, scoring engines, and application tracker remain the execution surfaces.

---

## 0. Executive Summary

The master directive describes 35 requirements. Codebase reconnaissance (this proposal's evidence base — read-only, file:line cited) shows **~70% of the directive already exists** in some form. Per Sumaiya's standing rule ("GPT strategy docs are a market scan, not an execution plan — translate BUILD → CONNECT / DEEPEN / SKIP"), this proposal:

- **CONNECTS** the golden path: paste JD → match → tailor → cover letter → track → interview prep is already implemented across `/api/ai/snap`, the assistant tool chain, and the application workspace.
- **DEEPENS** the thin spots: no single authoritative score, thin/ephemeral JD analysis, no typed chat-action contract, no AI auto-versioning, no RLS, no provider failover.
- **SKIPS** anything that would duplicate existing systems (a second scoring engine, a second evidence layer, a second conversation store).

**The single most important finding:** the directive's *"Sumaiya Score must be explainable with deterministic components"* does not exist as a composite — but every component it asks for already exists as a pure deterministic engine (`matchCvToJd`, `atsScore`, `analyzeJob`, `classifyRequirements`, `extractMetrics`). The work is **composition, not invention**.

**The golden path (directive §31) is ~85% built today.** The missing 15%: auto-version snapshots on AI applies, a visible before→after score card, per-tool input schemas, and application-id context for the tracker tools.

---

## 1. Evidence Base — What Exists Today

### 1.1 Chat / orchestration layer

| Capability | Where | State |
|---|---|---|
| Tool registry — 34 tools, read/write typed, needsCv/needsFile | `lib/assistant/tools.ts` | ✅ EXISTS |
| Orchestrator — deterministic next-action chain (`jobs.match→cv.tailor→coverLetter.generate→jobs.track→interview.prep`), server recomputes scores (client spoof-proof) | `lib/assistant/orchestrator.ts` | ✅ EXISTS |
| In-chat cards — 15 CardData kinds (ats, match, tailor, jobs, summary, skills, coverLetter, trackJob, docIntel, smartFit, skillGap, cvCompare, confirmations, signals, trackUpdate) | `components/assistant/cv-assistant-client.tsx` L78–93 | ✅ EXISTS |
| Read tools instant / write tools preview→confirm | tools.ts sideEffect + client dispatch | ✅ EXISTS |
| Evidence hard-gate — Apply disabled until AI-invented claims confirmed | client L2812/2903/3064 + apply handlers | ✅ EXISTS |
| Signals — 6 types with priorities (confirmations 100 … skillGap 50), dedupe by signalKey | `lib/assistant/signals.ts` | ✅ EXISTS |
| Context assembler — profile, active CV, applications, matched jobs, unconfirmed facts, recent activity | `lib/assistant/context.ts` | ✅ EXISTS |
| Conversation persistence — device-local v4 store (localStorage), multi-conversation, lang-aware | `lib/assistant/conversation-store.ts` | ✅ EXISTS (device-local only) |
| Provider abstraction — DeepSeek → Anthropic → OpenAI, first-configured wins | `lib/api/ai-provider.ts` | ⚠️ PARTIAL (no failover, no tiering) |
| Quota — burst 10/min + durable daily cap 60/day, refund on failure, guest caps | `lib/api/ai-limit.ts` | ✅ EXISTS |
| Guardrails — TRUTH_CONSTRAINT, repeat-guard, greeting-guard, safe-name, JD guard, SSRF guard, sanitizePromptText at 20+ boundaries, validateBuiltDocShape | `lib/api/ai-guardrails.ts`, `lib/assistant/*`, evals | ✅ EXISTS |

### 1.2 Job / match / score / tailor layer

| Capability | Where | State |
|---|---|---|
| Deterministic JD analysis — title, skills (known-tool lexicon), seniority, employmentType, keywords, requirement phrasings (capped 12) | `lib/job-analysis.ts` `analyzeJob` | ⚠️ THIN (no importance, salary, niceToHave, confidence; never persisted) |
| Keyword match score — `scoreTerms` = matched/jobTerms × 100, Set-based + fuzzy containment | `lib/job-match.ts` L116–131 | ✅ EXISTS (order-invariant — tailoring cannot raise it by construction) |
| ATS readiness — 11 weighted checks (112 pts), 4 pillars, line findings, 4 evidence-backed auto-fixes | `lib/ats-score.ts` (426 lines), `lib/ats-explain.ts` | ✅ EXISTS (the *honest* tailor-lift metric) |
| Per-requirement evidence — detected/partial/missing + learning-resource KB | `lib/requirement-evidence.ts` | ✅ EXISTS |
| Skill gap — deterministic facts + AI learning plan (graceful null) | `lib/skill-gap.ts` | ✅ EXISTS |
| Targeted CV builder — verified facts only, real before/after scores, `toConfirm` list | `lib/targeted-cv.ts`, `/api/jobs/targeted-cv`, `targeted-cv-drawer.tsx` | ✅ EXISTS |
| Full JD→tailor pipeline — guards (NOT_A_JOB/NO_PROFILE), quota, evidence re-check, honest re-score, refund-on-no-value, PII-free share | `/api/ai/snap`, `lib/api/snap-apply.ts` | ✅ EXISTS |
| AI jd-keywords — must/nice importance, ≤22 terms | `ai.ts` L1027–1066 | ⚠️ THIN (importance only; not persisted) |
| Jobs aggregation engine — 13 sources, ingest/dedup/authenticity/lifecycle/recommend, daily cron | `lib/jobs/` | ✅ EXISTS (2,228 jobs live) |
| Application tracker — statuses draft→applied→interviewing→offer + terminal, legal transitions, ownership checks, follow-up math, weekly email cron | `lib/applications.ts`, `routes/applications.ts`, `cron/follow-ups` | ✅ EXISTS |
| Chat ↔ tracker — jobs.track, application.update tools, TrackUpdateCard, followUp signal | tools.ts L111–129, client L1804–1873 | ✅ EXISTS (context lacks app ids — see §3 G-5) |
| Cover letter in flow — snap one-round-trip; orchestrator tailor→letter; `/api/ai/cover-letter` lang-aware | `routes/snap.ts` L139–151, `ai.ts` L309–346 | ✅ EXISTS |
| Interview intelligence — turn-by-turn coach grounded in JD+CV, career-interview Q bank, interview.prep chain action | `/api/ai/interview-turn`, `app/(app)/interview/page.tsx`, `lib/career-interview/` | ✅ EXISTS (prep state client-local) |
| Importability — browser PDF/DOCX extract + OCR, `/api/ai/parse-cv`, pasted text | `lib/client-cv-extract.ts`, `import-cv/page.tsx` | ✅ EXISTS |
| Anti-fabrication enforcement — `verifyAiContent` (metrics/skills/employers), TRUTH_CONSTRAINT, confirmations trust loop, `toConfirm` | `lib/career-profile/evidence.ts`, `confirmations.ts` | ✅ EXISTS (strong) |

### 1.3 Data / mobile / security layer

| Capability | Where | State |
|---|---|---|
| Career spine — `career_profile` jsonb single source of truth, provenance iron-rule (`sourceRank`, `maySupersede`), ONE shared write path `seedProfileFromCv` | `lib/career-profile/sync.ts`, `mapper.ts` | ✅ EXISTS |
| FactMeta — `confirmed|needs-confirmation|ai-suggested|inferred|unverified` + source + confidence | `types/index.ts` L203–224 | ✅ EXISTS |
| Confirmations trust loop — list/resolve, pending-key intersection, accept→user-edited / reject→delete | `lib/career-profile/confirmations.ts` | ✅ EXISTS |
| Document versioning — `document_version` table, POST/create + prune 20, owner-checked, restore client-composed; **3 call sites only (PDF download, pre-restore, manual button); CV-only UI** | `lib/api/routes/versions.ts`, `cv-editor-client.tsx` L1407/1486/2564 | ⚠️ EXISTS BUT UNDERWIRED |
| Mobile offline CVs — SQLite `cvs`+`syncQueue`, FIFO backoff collapse delete-wins, idempotent clientId wire protocol, guests stay local | `mobile/src/db.ts`, `lib/sync-queue.ts`, `services/sync.ts` (PR #297) | ✅ EXISTS (CVs only) |
| Mobile domain objects — duplicated `CvData`/`TEMPLATES` (hand-copied 38), mapping shims | `mobile/src/types.ts` | ⚠️ DUPLICATED |
| RLS — **zero policies anywhere**; app-level `getUserId`+`eq(userId)` scoping is consistent and thorough | all routes; grep `create policy` = 0 | ❌ MISSING (defense-in-depth) |
| Outcome instrumentation — user_hash, PII sanitize, opt-out, never-throws; seams tailor.lift/match.scored/application.*/signal.shown/tool.executed/confirmation.resolved | `lib/outcomes/`, migration 0008 | ✅ EXISTS |
| AI-action audit — none beyond PII-free outcome events + version snapshots | — | ❌ MISSING (see §3 G-7) |

---

## 2. Target Architecture

Three cooperating surfaces + one shared core, per directive §3:

```
                        TEMPLATEHUB
                              │
                       ┌──────┴──────┐
                       │   AI CHAT   │  ← orchestration layer (exists, deepens)
                       └──────┬──────┘
                              │ typed actions (NEW contract)
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
  Document Canvas      Jobs / JD             Applications
  (editor + diff +     (JobProfile NEW,      Tracker
   versions)           jobs feed)            (exists + chat)
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                 SHARED CORE (deterministic, ONE source of truth)
        Sumaiya Score (NEW composite) · matchCvToJd · atsScore ·
        analyzeJob → JobProfile · classifyRequirements · verifyAiContent ·
        career spine / factMeta · document_version · sync queue
```

**Design rule:** all intelligence is deterministic-first. AI adds extraction quality and natural language — never numbers, never facts, never scores.

---

## 3. Gap Analysis (the real work)

| # | Gap | Directive § | Severity |
|---|---|---|---|
| G-1 | **No single authoritative composite score.** Two separate engines (keyword match, ATS) used in different surfaces; no job-relevance × skills × experience × achievement × education × ATS composite; no structured explanation taxonomy (good/missing/weak/improvable/needs-user-input). | §6, §7 | P0 |
| G-2 | **JD analysis is thin + ephemeral.** No persisted `JobProfile`; no importance per requirement/skill, no salary, no responsibilities/qualifications/niceToHave split, no confidence. AI `jd-keywords` adds must/nice only. | §5 | P0 |
| G-3 | **No typed chat-action contract.** Actions are `{tool,args}` + CardData kinds; no `AssistantAction` union; **no per-tool input schema** (args pass unvalidated server-side). | §21, §22 | P1 |
| G-4 | **No document diff view + AI changes don't auto-version.** DocIntel shows full-text preview, not before/after; only 3 manual version call sites; a regretted AI rewrite is unrecoverable. | §10, §11 | P1 |
| G-5 | **`application.update` can't reliably target an app.** Context block lists counts + latest title, not app ids → model guesses or asks user. | §13 | P1 |
| G-6 | **No provider failover / model tiering.** First-configured provider only; no cheap-vs-strong routing; no runtime fallback chain. | §19, §20 | P2 |
| G-7 | **No RLS.** Zero Postgres policies; single-layer app scoping. (Flag: DB migration territory — needs explicit approval before touching.) | §25 | P1 (flagged) |
| G-8 | **Prompt-injection hardening incomplete.** No explicit system/user/document separation instruction; guest profile block interpolated unsanitized/unbounded (`ai.ts` L557–561). | §24 | P1 |
| G-9 | **Mobile: no applications/tracker/jobs; no pull sync; duplicated types.** Mobile is CV+chat only; no offline tracker; no server→client change feed; hand-copied templates. | §17, §18 | P1 |
| G-10 | **Interview prep state is client-local** (localStorage); no server record, no link to requirement-evidence gaps. | §14 | P2 |
| G-11 | **No FACT/INFERENCE/SUGGESTION/UNKNOWN taxonomy surfaced** — enforcement exists (confirmed/needs-confirmation, detected/partial/missing) but vocabulary is implicit. | §8, §9 | P2 |
| G-12 | **Follow-ups email-only** — no in-app/chat reminder surface, no user-set dates. (Signal `application.followUp` exists; cron email exists.) | §13 | P2 |

**Already satisfied (no work):** anti-fabrication/evidence-bound rewriting (§8, §9, §25-core), cover letter in flow (§15), importability (§16), offline-first CVs (§18-partial), localization/EN-SW chat (§27), honest UX copy philosophy (§28 — TRUTH_CONSTRAINT + "score is a guide" messaging), no giant dashboard (§29 — progressive reveal via signals/chain), success-metric seams (§32 — outcome_event), most of the testing matrix (§33 — evals already pin match stability, tailor truth, language fidelity, anti-fabrication).

---

## 4. Design Decisions

### D-1: ONE authoritative Sumaiya Score (P0 — G-1)

Build `lib/score/composite.ts` — pure, deterministic, **calls the existing engines** (never re-implements):

```
compositeScore(cvData, jd, profile?) → {
  score: 0–100,
  components: {
    jobRelevance:      (title + seniority alignment via analyzeJob)          — 25%
    keywordCoverage:   (matchCvToJd.score)                                   — 20%
    skillsAlignment:   (matched known-tools vs JD skills)                    — 20%
    experienceRelevance: (rankExperienceForJob overlap)                      — 15%
    achievementStrength: (metrics found in CV bullets via extractMetrics)    — 10%
    educationQualification: (classifyRequirements on JD requirements)        — 5%
    atsQuality:        (atsScore normalized)                                 — 5%
  },
  explanation: ScoreExplanation  // structured, machine-readable
}
```

- **Weights are a starting proposal** — validate against the golden-pair eval pins; the eval suite (`evals/match-stability.test.ts`) is the arbiter. Weight changes ship in the same PR as their pin updates.
- **`ScoreExplanation { good[], missing[], weak[], improvable[], needsUserInput[] }`** — derived deterministically from the components. This is what powers the chat card, the orchestrator reason strings, and the workspace panel. Replaces ad-hoc string explanations.
- **Engineering truth to respect (from the eval harness):** `matchCvToJd` is Set-based/order-invariant — truthful tailoring *cannot* raise keyword coverage. The composite must therefore weight ATS + achievement + education so **tailoring honestly moves the score** (ATS lift is the proven honest metric). The before→after story the directive wants (§31 "Recalculate score / Show improvement") comes from ATS + achievement + education components moving, not keyword coverage.
- **Anti-spoof (existing rule):** the score is ALWAYS recomputed server-side; client-provided scores are informational only.
- **One engine, everywhere:** dashboard job cards, targeted-cv drawer, snap result, chat MatchResultCard, application workspace, application detail page. Kill the two-score confusion in the UI copy.

### D-2: JobProfile — deep, persisted JD intelligence (P0 — G-2)

Extend `analyzeJob`'s output into a persisted `JobProfile`:

```
type JobProfile = {
  title, company?, location?, employmentType?, seniority?
  requirements: { text, category, importance: critical|high|medium|low, evidence? }[]
  skills: { name, category, importance }[]
  keywords: string[]
  responsibilities: string[]
  qualifications: string[]
  niceToHave: string[]
  salary?: { min?, max?, currency? }
  confidence: number   // hybrid: deterministic base + AI extraction confidence
}
```

- **Deterministic base** extends `analyzeJob` (importance from requirement phrases "must/certified/required" → critical; "preferred/nice to have" → niceToHave; salary via TZS/USD regexes).
- **AI upgrade** extends the existing `/api/ai/jd-keywords` pattern into a full structured-extraction tool with zod schema + `validateBuiltDocShape`-style shape validation; **on AI failure, fall back to the deterministic profile** (graceful degradation pattern already proven in skill-gap).
- **Persistence:** new `job_profile` table (or extend `application` row) keyed by JD hash + per-application snapshot. Cache per hash so the same JD re-used doesn't re-parse. Store the deterministic profile + the AI deltas separately so the AI layer can be re-run without touching facts.
- **JD is untrusted data** (directive §24): sanitizePromptText already applies at route boundaries; the parser treats the JD as data, never instructions.

### D-3: Typed chat actions + per-tool schemas (P1 — G-3)

Introduce a thin typed contract **on top of** the existing CardData/tool system — do NOT rip out the working dispatch:

```
type AssistantAction =
  | { type: "show_match_score";    data: { score, explanation } }
  | { type: "show_missing_keywords"; data: KeywordGap[] }
  | { type: "show_document_diff";  data: DocumentDiff }
  | { type: "create_document";     data: DocumentCreation }
  | { type: "update_application";  data: ApplicationUpdate }
  | { type: "ask_confirmation";    data: Confirmation }
```

- Each maps 1:1 to an existing card (MatchResultCard, TailorPreviewCard, TrackUpdateCard, ConfirmationsCard…). The action is the *contract*; the card is the *render*.
- **Per-tool input schema:** add `argsSchema: z.ZodType` to every `AssistantTool` in `tools.ts`. The assistant-turn route validates `action.args` server-side before dispatch (currently only client handlers + downstream endpoint schemas guard). Covers `cv.addSkills` non-array args, `pdf.rotate` bad angles, etc.
- **Auditability:** the typed action + tool id flows into the existing outcome `tool.executed` seam (PII-free). No new log system for v1 — the typed contract IS the audit shape; version snapshots (§D-4) are the before/after record.

### D-4: Chat→Canvas diff + AI auto-versioning (P1 — G-4)

- **`lib/document-diff.ts`** (pure, deterministic): section/line-level diff between current CV and proposed edit → `DocumentDiff { sections: [{ sectionId, before, after, changed: boolean }] }`.
- **Chat card upgrade:** Tailor/DocIntel cards render the diff (Before / After / Accept / Reject / Edit) instead of full-text preview. The user sees exactly what changes — the trust mechanic the directive demands (§10).
- **Auto-snapshot:** every AI write tool (applyTailor, applySummary, applySkills, applyDocIntel, applySmartFit, build-doc) calls the **existing** `POST /api/documents/versions` before applying. The versions route, table, ownership check, and prune-to-20 all exist — this is pure wiring. Snapshot title: `AI: <tool> (<timestamp>)`. Restore stays client-composed (existing pattern) and is itself pre-snapshot (existing pattern) so restore is undoable.
- Cover letter / letter / business card get the same version surface (currently CV-only UI).

### D-5: Context completeness for tracker tools (P1 — G-5)

- `context.ts` already loads applications (≤20 light rows). Add the **id + status** of each to the prompt block (`WHAT YOU ALREADY KNOW`): `app:<id> = <title> — <status>`. Then `application.update { applicationId }` becomes reliable, and the orchestrator's `jobs.track→interview.prep` href already carries the id.
- Add the same ids to the mobile chat context when mobile chat deepens (§D-8).

### D-6: DeepSeek-first with user-selectable thinking effort (P2 — G-6)

**Decision (Hamis 2026-08-26): the AI stays DeepSeek — it's cheap. No paid strong-model tier. Instead, users choose a "thinking effort" per conversation.**

- **Provider stays DeepSeek** (`deepseek-chat` / `deepseek-reasoner`). The existing Anthropic → OpenAI chain remains ONLY as an emergency fallback if DeepSeek is down — never a routing tier.
- **Thinking-effort selector** — a small control in the chat UI, per conversation, persisted in the conversation store:
  - **Haraka / Fast** — `deepseek-chat`, no thinking. Classification, extraction, simple rewrites, JD parsing.
  - **Wastani / Balanced** (default) — `deepseek-chat` with thinking enabled at a low budget. Everyday matching, tailoring, cover letters.
  - **Kina / Deep** — `deepseek-reasoner` (full reasoning), higher token budget. Opt-in per chat: complex document reasoning, tricky job matches, nuanced recommendations.
- **Implementation:** `callAi(prompt, { effort })` in `lib/api/ai-provider.ts` maps effort → model + params; `AI_THINKING_EFFORT_DEFAULT` env sets the default; the conversation store carries the user's choice; the assistant-turn request schema gains `effort`. Deterministic code keeps doing all scoring/validation (already true) — effort changes generation quality only, never numbers.
- **Cost control:** default = balanced/cheap; "Kina" is user-initiated per chat, so the expensive path is opt-in. Model actual per-call cost before pricing decisions (open question #4).
- Route-level graceful degradation already exists (null → refund → friendly localized error / local heuristic) — untouched. The selector never exposes provider internals in the UX.

### D-7: Security & privacy (P1 — G-7, G-8)

- **RLS (flagged — DB migration + auth territory):** add Postgres RLS policies per table (`auth.uid() = user_id`), `FORCE RLS` on user-owned tables. This is defense-in-depth on top of the existing app-level scoping. **Per flywheel non-negotiable, this workstream is explicitly flagged `⏸️ NEEDS HAMIS` before any migration runs.** The `mobile/src/env.ts` anon-key comment already *assumes* this posture — make reality match it.
- **Prompt-injection hardening:** add an explicit SEPARATION block to the Sumaiya system prompt — `SYSTEM INSTRUCTIONS / USER INTENT / DOCUMENT CONTENT / JOB DESCRIPTION CONTENT / AI OUTPUT` — stating document/JD content is data, never instructions, and can never override tool permissions. Sanitize + bound the guest profile block (`ai.ts` L557–561, schema L504–508: max lengths on profile strings).
- **No cross-user retrieval** already holds at app level (owner checks everywhere) — RLS makes it structural.

### D-8: Mobile — tracker + shared types + chat read-tools (P1 — G-9)

- **Shared types:** extend the proven generation pattern (`scripts/gen-mobile-templates.mjs` already generates 266 templates) to generate `mobile/src/types.gen.ts` from the web registry — kills the hand-copied `CvData`/`TEMPLATES` drift.
- **Mobile tracker (NA-5):** applications on mobile with SQLite + the existing sync-queue pattern (FIFO, backoff, collapse, delete-wins, clientId idempotency — the web API already derives `m_` row ids + sha256(userId:clientId) so the protocol extends cleanly). Offline: create/track/update applications; sync when online+authed. Same `toWireShape` discipline.
- **Mobile chat read-tools:** `ChatScreen` currently sends `hasCv:false` and executes nothing. Wire read tools (jobs.match, ats.check, career.skillGap) so mobile chat returns cards like web. Write tools stay preview→confirm. This is the mobile slice of the golden path.
- **No pull sync in v1** (server→client change feed) — documented limitation; web stays the source of truth for multi-device until a change feed is warranted.

### D-9: Golden path + first-run polish (P1)

- **First-run (directive §30):** assistant page's empty state becomes task-oriented chips: "Tailor my CV to a job" → opens the JD paste flow (jobs.match path already exists); "Create a CV"; "Improve my existing CV"; "Create a cover letter"; "Prepare for an interview"; "Track an application". Each chip seeds the conversation with the right tool intent — no generic welcome.
- **Chat match card v2 (directive §4):** the MatchResultCard gains the composite `Sumaiya Score` + structured explanation (good / holding-you-back / needs-your-input) + buttons **Review Changes / Apply Changes / Keep Original** wired to the diff + auto-snapshot (§D-4). This is the single highest-visibility UI change.
- **Score honesty copy (directive §7, §28):** card footer: *"This score estimates how closely your CV aligns with the job description. It is a guide, not a hiring prediction."* EN+SW. TRUTH_CONSTRAINT-style seam-gate eval asserts the copy stays.

### D-10: Metrics (P2)

- Add outcome events at the new seams: `score.generated` (composite before/after on tailor accept), `version.created` (AI auto-snapshot). Existing seams (tailor.lift, match.scored, application.*, signal.shown, tool.executed, confirmation.resolved) already cover the directive's activation/product-value/retention/AI-quality axes. Never optimize for "messages sent" — the funnel events already exist.

### D-11: Super-interactive chat — animation, streaming, progress (Hamis direction 2026-08-26)

**"The chat should be super interactive and intuitive — animation and progress."** The chat is the product center; it must FEEL alive while staying honest (cards + evidence gates untouched).

- **Stage-progress pipeline:** multi-stage tools (jobs.match, cv.tailor, snap) emit live stage events so the user watches the pipeline run: *Kuchambua kazi → Kulinganisha CV → Kuhesabu score → Kuandaa mabadiliko → Tayari*. Progress bar per stage + check animation. Deterministic stages only — never fake progress.
- **Streaming replies:** assistant-turn gains an SSE mode (`stream: true`) — reply text streams token-by-token while structured payloads (action, cards, signals, score) arrive in the final event. Cards still render as cards; only prose streams. Non-streaming path stays as automatic fallback on any failure.
- **Typing/reading indicator** before the first token (existing skeleton states upgraded to animated dots).
- **Card entrance + exit motion:** framer-motion (already a dependency) — rise-reveal per card (reuse `lib/motion.ts` from RF5), layout animations when cards resolve, smooth expand for diffs.
- **Score feedback:** animated count-up on the Sumaiya Score, progress ring around the score (WS-1), confetti (canvas-confetti already a dependency) on score improvement after Apply / successful export — celebration only when a real metric moved.
- **Button micro-interactions:** consistent press/hover states (RF4 tap-target rules), loading states with stage labels instead of bare spinners.
- **Rules:** motion respects `prefers-reduced-motion` (RF5 convention); animations never delay or block the underlying action; all of it is presentation over the existing deterministic pipeline — no new business logic.

---

## 5. Workstream Plan (each = one independent PR off latest master)

Ordered by value; **WS-1→WS-4 form the golden-path core (directive §14: make JD → Match → Tailor → Export excellent first).**

| WS | Deliverable | Files (new/primary) | Depends |
|---|---|---|---|
| **WS-1** | Sumaiya Score composite + structured explanation + evals (golden-pair pins) | `lib/score/composite.ts`, `lib/score/explain.ts`, tests, eval pins | — |
| **WS-2** | JobProfile deep parse (deterministic deepen + AI structured extraction w/ schema + persistence) | extend `lib/job-analysis.ts`, `lib/api/routes/jobs.ts`, migration `job_profile` | — |
| **WS-3** | Typed AssistantAction + per-tool zod schemas + server-side args validation | `lib/assistant/tools.ts` (+argsSchema), `lib/assistant/actions.ts`, assistant-turn route | — |
| **WS-4** | Document diff + AI auto-versioning on all write tools + version UI for letter/BC | `lib/document-diff.ts`, `components/assistant/*`, wire `versions.ts` into apply paths | WS-3 (action shape) |
| **WS-5** | Context: app ids in prompt block + application.update reliability | `lib/assistant/context.ts` | — |
| **WS-6** | DeepSeek thinking-effort: `callAi({effort})` model mapping + per-chat selector (Haraka/Wastani/Kina) + emergency fallback chain stays | `lib/api/ai-provider.ts`, conversation-store, assistant-turn schema, chat selector UI | — |
| **WS-7** | Security: RLS policies + prompt-injection separation + guest-profile sanitize | migrations + `lib/api/routes/ai.ts` | **FLAG NEEDS HAMIS** (migrations) |
| **WS-8** | Mobile: tracker (offline SQLite + sync), generated shared types, chat read-tools | `mobile/src/screens/ApplicationsScreen.tsx`, `mobile/src/db.ts`, `scripts/gen-mobile-types.mjs`, `mobile/src/screens/ChatScreen.tsx` | — |
| **WS-9** | First-run task chips + chat match card v2 (score + diff + Review/Apply/Keep) | `app/(app)/assistant/page.tsx`, MatchResultCard | WS-1, WS-3, WS-4 |
| **WS-10** | Score/version outcome events | `lib/outcomes/` | WS-1 |
| **WS-11** | Super-interactive chat: SSE streaming, stage-progress pipeline, animated cards (framer-motion), score count-up + confetti, thinking-effort selector UI | assistant-turn SSE mode, `components/assistant/*`, `lib/motion.ts` reuse | WS-1 (score), WS-3 (action contract), WS-6 (effort) |

**Sequencing note:** WS-1/WS-2/WS-3 are independent and can ship in parallel worktrees. WS-4 and WS-9 build on WS-3/WS-1. WS-7 requires Hamis sign-off before migrations run.

---

## 6. Non-Negotiables (inherit the standing rules)

1. **One authoritative scoring system** — the composite calls existing engines; no second keyword/ATS implementation. Eval pins move only in the same PR as a reviewed scoring change.
2. **Anti-fabrication is enforced, not prompted** — every AI→CV write path keeps its evidence gate (`card.evidence?.length && !card.confirmed`); the FACT/INFERENCE/SUGGESTION/UNKNOWN vocabulary is layered onto existing FactStatus/RequirementStatus, never a parallel system.
3. **AI never computes numbers** — scores, keyword matches, and validation stay deterministic server-side code. Client scores are informational.
4. **Fresh branch off origin/master per PR, one commit, gates green** (tsc 0 · vitest · evals), "used it with real data" proof in the PR body.
5. **Never touch auth-middleware or DB migrations without `⏸️ NEEDS HAMIS`** — applies to WS-7 (RLS) and WS-2 (job_profile table).
6. **No duplicate systems** — if reconnaissance says it exists, we CONNECT/DEEPEN. The version route, provider seam, confirmations loop, sync queue, and outcome events are all reused as-is.

---

## 7. Open Questions for Hamis / Claude

1. **Score weights** — approve the proposed component weights (25/20/20/15/10/5/5) or adjust before WS-1 pins them in evals?
2. **RLS scope** — approve running RLS migrations (WS-7) on the production DB? (Currently app-level scoping only.)
3. ~~AI tiering budget~~ — **RESOLVED (Hamis 2026-08-26): AI stays DeepSeek (cheap); users choose per-chat thinking effort (Haraka/Wastani/Kina) instead of a paid strong-model tier. Implemented as WS-6.**
4. **Pricing/lifetime SKU** (§26) — separate product decision; recommend modeling AI cost per composite-score generation before setting a Pro price/lifetime anchor.
5. **Mobile tracker (WS-8)** — ship after the current 4 mobile PRs (#296–#299) land, or in parallel?
