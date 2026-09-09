# Eval harness — the anti-fabrication & quality moat

Sumaiya's regression net. Every PR that touches the AI engines, the
deterministic scoring, the evidence layer, the orchestrator, or the prompt
builders runs these evals in CI. A PR that regresses match quality or
anti-fabrication **fails the merge gate**.

## Run

```bash
npm run evals          # the merge gate (deterministic layer, always)
npm run evals:ai       # + AI-generative layer (needs a provider key)
```

The AI layer is skipped automatically when no provider key is set
(`DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) — CI runs the
deterministic layer only. Locally, vitest does **not** load `.env.local`, so
export the key explicitly for an AI run:

```bash
DEEPSEEK_API_KEY=... npm run evals:ai
```

## What is guarded

| Suite | Guards | Layer |
|---|---|---|
| `match-stability` | Golden CV+JD pairs stay pinned (score drift = fail); semantic matched/missing invariants; the hard-negative pair stays low | deterministic |
| `tailor-quality` | `buildTargetedCv` never lowers the real score, never fabricates, surfaces gaps as `toConfirm`; AI tailor lifts the real ATS score truthfully | deterministic + AI |
| `language-fidelity` | Every generation route embeds the hard language constraint; Swahili generation stays Swahili (rubric-scored) | deterministic + AI |
| `orchestrator` | Given real state, the right next action is proposed; client scores are ignored; reasons carry real engine numbers | deterministic |
| `anti-fabrication` | The evidence engine catches EVERY fabrication-bait input (metrics/skills/employers); the AI→CV write-path gates stay in place | deterministic |

## Pins & fixtures

Golden data lives in `evals/fixtures/golden-pairs.ts` — synthetic personas only,
no real personal data. Match scores are pinned at authoring time; re-measure
with:

```bash
npx tsx evals/probe-pins.ts
```

A score pin may only move **in the same PR as a reviewed, deliberate scoring
change** — never silently.

## Rubric

AI-generative outputs are non-deterministic, so the AI layer scores
**properties** (language ratio, truthfulness share, structure completeness,
quality lift) against thresholds in `evals/lib/rubric.ts` instead of asserting
exact strings. Hard invariants (e.g. zero fabricated claims) are still plain
assertions — the rubric is the scored view on top.

## CI

`.github/workflows/evals.yml` runs `npm run evals` on every pull request and
push to master. It is a **merge gate**: failing evals block the merge.
