# Sumaiya AI — the cost/efficiency/UX sweet spot

Status: analysis, 2026-09-16. Nothing built. Rates from DeepSeek's published pricing
(deepseek-flash), the provider Sumaiya already uses.

## The lever nobody expects: cache-hit input is ~50× cheaper

| deepseek-flash | per 1M tokens |
|---|---|
| input, cache **miss** | $0.14 |
| input, cache **hit** | **$0.0028** |
| output | $0.28 |

Cache hits only work on an **identical prefix from token 0**. That single fact drives the
whole design: assemble the prompt as *stable prefix first, volatile last*.

## What one conversational turn actually costs

| Piece | Tokens | Rate | Cost |
|---|---|---|---|
| system + memory + profile (stable → **cached**) | 1,500 | hit $0.0028 | $0.0000042 |
| conversation tail + user message (fresh) | 600 | miss $0.14 | $0.000084 |
| model output | 300 | $0.28 | $0.000084 |
| **total** | | | **≈ $0.00017** |

**≈ 0.017¢ — about half a Tanzanian shilling per message.**

At 20 messages/day, a monthly active user costs **≈ $0.10**. Add nightly consolidation
(≈ $0.02) → **≈ $0.12 per user per month** (~320 TZS).

1,000 active users ≈ **$120/month**. 10,000 ≈ **$1,200/month**.

## So the sweet spot is not "use the AI less" — it's "never pay full price for input"

| Decision | Effect |
|---|---|
| **Stable prefix, cached** (system → memory → profile → then the turn) | input ~50× cheaper. The single biggest lever. |
| **Flash by default** | Pro is 3× ($0.435/$0.87). Escalate only on genuinely hard asks. |
| **One call per turn**, not a loop | a 4-step loop costs ≈ **12× a single turn** ($0.002) |
| **Deterministic engine for breadth** | zero cost — ATS, skill gaps, recommendations, template filters |
| **Consolidation batched nightly** | one call per user per day, not per turn |
| **Off-peak when possible** | DeepSeek off-peak is half price; in EAT the cheap window is **afternoon/evening/night** |

## Where UX per token is highest: memory, not tools

The memory block is ~1,500 tokens and costs **$0.0000042 cached**. That is effectively free —
and it is the thing that makes every answer feel like it knows the person.

**Tools/loops are the expensive part and, for most asks, the least valuable.** Anthropic's own
guidance in the research: add multi-step agentic systems only when simpler solutions fall short.

> Spend tokens on **knowing the user** (cheap, huge UX).
> Spend sparingly on **acting across the app** (expensive, marginal UX most of the time).

## The routing ladder (the actual sweet spot)

| Tier | What runs | Cost | Covers |
|---|---|---|---|
| **0 — deterministic** | ATS score, skill gaps, recommendations, template filter, job ranking | **$0** | most taps in the app |
| **1 — one cached call** | the conversation; explain a result; draft CV text | ~$0.00017 | "help me with this" |
| **2 — capped loop** | "build my CV for this posting" (read → score → write) | ~$0.002, **cap 3–4 steps**, Flash only | explicit multi-step asks |
| **3 — nightly batch** | consolidation (episodes → facts), proactive nudges | ~$0.02/user/mo, off-peak | the "it knows me" part |

## Guardrails that keep it honest
1. **Per-user daily cap** (say 50 AI turns) — protects the tail from one heavy user.
2. **Budget exhausted → fall back to Tier 0**, never a dead end. The deterministic engine means
   the app still works with zero AI spend.
3. **Fixed prompt order** — cache misses are 50× the cost; an unstable prefix silently doubles the bill.
4. **Stream** — same total time, a fraction of the *perceived* wait.
5. **Meter loops specifically** — they're 12× a turn. Log which asks trigger them; cap by user.

## The answer in one line
Cache the prefix, keep the deterministic engine for breadth, spend on memory rather than on
loops, and batch the learning overnight — that lands a personalised, system-wide AI coach at
**roughly 320 TZS per user per month**, with the expensive part (tools) reserved for the asks
that actually earn it.
