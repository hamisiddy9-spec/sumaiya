# Sumaiya AI — whole-system access + memory ("make it like Hermes")

Status: design study, 2026-09-16. Nothing built.

## The ask
1. Give the AI access to the whole system.
2. Make it learn patterns + user preferences (like Hermes).
3. Make it a career coach that evolves and personalises per person.

## The one correction that matters
**"Access to the whole system" must NOT mean putting the app's state into the prompt.**

The researched pattern is tool calling: the model gets a list of *named capabilities*
(name, purpose, arguments, output) and asks the app to run them. The app keeps the
database, the authorization, and the boundaries — *"the model never receives a database
connection."* Dumping state into the prompt is the naive version: it burns context, goes
stale, and mixes instructions with data.

Second correction, from Anthropic's own guidance quoted in the research: *"add multi-step
agentic systems only when simpler solutions fall short."* A tool loop costs 2–10 model
calls per request. On Tanzanian mobile data that is the difference between usable and not.

## The Hermes mapping (this is the right mental model)
Hermes works because it separates three things. Sumaiya needs the same three:

| Hermes | Sumaiya equivalent | What it is |
|---|---|---|
| Memory (facts) | **Semantic memory** | stable facts + preferences about the user |
| Skills (procedures) | **Procedural memory** | playbooks that worked, reused |
| Session history | **Episodic memory** | what happened — events, attempts, outcomes |

That is exactly the CoALA structure the literature converges on: episodic / semantic /
procedural are *functional roles within long-term memory*, not three parallel stores.

## Architecture

```
Sumaiya AI
├── Tools — the "whole system" door (app owns access)
│     read_profile · update_profile
│     read_cv · edit_cv_section · score_ats(jobDescription)
│     list_applications · add_application
│     search_templates(style, industry) · search_jobs(location, role)
│     get_learning_progress · recommend_course
│
├── Memory
│     semantic   — preferences + stable facts        ("kazi za logistics", "brief Swahili")
│     episodic   — events with time + outcome        (applied to X, exported CV, asked about interviews)
│     procedural — advice that worked → playbooks    ("ATS < 40 + logistics → fix X first, then Y")
│
└── Consolidation (scheduled, offline-safe)
      episodes → facts (evidence threshold) · conflict handling · prune · expire
```

### The rule that makes it "learn" rather than just "store"
Storage is not memory. *"Event storage does not automatically produce reliable semantic
knowledge. Converting repeated episodes into a generalized fact is a consolidation
operation"* — requiring evidence thresholds, conflict handling, and supersession.

So: one question asked three weeks running ⇒ *episodes* ⇒ **consolidation promotes it** to a
fact ("keeps running into interviews — coach this"), which then shows up proactively. That is
the difference between a chatbot with history and a coach that knows you.

### Bounded, gated, pruned (not a junk drawer)
The neuro-inspired designs (CraniMem) gate what enters memory by utility, keep a bounded
episode buffer, and periodically replay high-utility traces into long-term while pruning the
rest. On a phone this is not optional — storage, context budget, and battery all argue for it.

### Preference drift
PAMU tracks preferences with a sliding window (recent behaviour) fused with an exponential
moving average (long-term tendency), and only updates memory when the two **diverge past a
threshold** — so one bad day does not rewrite who you are, but a real change does.

## The constraint that decides the design
**The APK must work offline.** So the AI cannot be the only brain:

- **Offline (always):** the deterministic engine stays. `recommendations.ts` is *already*
  "deterministic and offline" — that is a feature, keep it. It answers with no network.
- **Online (enriched):** the LLM reads memory + calls tools, and can say more.
- **Memory writes** queue locally and sync later — the user must never lose what the coach
  learned because the network dropped.

## Cost discipline (mobile data is the budget)
- Default: **one model call** with assembled context (memory block + profile + what's on screen).
- Reserve the **tool loop** for genuinely multi-step asks ("build my CV for this posting" =
  read profile → read job → score → edit sections → write CV).
- Stream tokens so the wait doesn't read as a hang.

## What this delivers against your original vision
| Your words | This design |
|---|---|
| "different buttons, different systems, all link to one big AI" | every surface opens the same assistant **with context attached**; the tools are the system |
| "the AI is alive, learns, understands" | episodic → semantic consolidation; it accumulates instead of resetting |
| "advice for each user individually" | memory-conditioned prompts; the coach knows your field, level, and history |
| "personal job assistant that evolves" | procedural memory = playbooks that worked, reused on the next person like you |

## Build order (smallest useful first)
1. **Light up the ATS→chat door** with context attached. One screen, proves "many doors, one AI".
2. **Semantic memory store** (small, local, offline-safe) + write it into the prompt.
3. **Consolidation pass** — episodes → facts, thresholded. This is where "alive" actually begins.
4. **Tools v1** — `read_profile`, `score_ats`, `list_applications`. Read-only first.
5. **Procedural playbooks** — the Hermes-skills equivalent.
6. **Proactive nudges** from memory, not a fixed rotation.

## Honest risks
- **Cost per user** — every tool loop is real money on a free-tier career app. Ship tools read-only, meter the loop.
- **Privacy** — this stores inferences about people's careers. Needs an export + delete path from day one, not later.
- **Confidently wrong coach** — a memory-driven coach can entrench a bad inference. Every fact needs a "why do you think that?" surface the user can correct.
