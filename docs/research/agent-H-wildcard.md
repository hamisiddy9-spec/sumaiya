# Agent H — wildcard: speech tech, on-device AI, resilient computing, indie

## Speech / low-resource language (most relevant)
- **Meta Omnilingual ASR** https://ai.meta.com/blog/omnilingual-asr-advancing-automatic-speech-recognition/ · paper https://arxiv.org/abs/2511.09690 — open ASR for **1,600+ languages, Apache 2.0**, 300M (low-power devices) → 7B. **Bring-your-own-language via in-context learning** — a few paired audio/text examples extend it to a new language/dialect, no retraining. *THE biggest unlock: on-device Swahili + Sheng/coastal-dialect transcription on cheap Android, add user code-switching by example.*
- **Omnilingual ASR Corpus** — CC-BY, largest ultra-low-resource spontaneous ASR dataset, 350 underserved langs. Free fine-tuning/eval data.
- **African Next Voices (Gates Foundation)** https://lanfrica.com/en/blog/insight/understanding-the-african-next-voices-datasets/ — ~9,000 hrs everyday speech across 18 African langs (Swahili low-thousands of hrs), recorded in agri/health/**education** settings — natural, not read prompts. *The education slice is close to the domain; realistic accented/noisy Swahili.*
- **Swivuriso — SA Next Voices** https://huggingface.co/datasets/dsfsi-anv/za-african-next-voices — 3,000+ hrs, 7 SA langs, CC-BY-4.0, Dec 2025, Vukosi Marivate's DSFSI. ⚠️ license forbids TTS/voice-cloning (ASR/NLU only). *Not Swahili but the DSFSI group = who to partner with for EA expansion.*
- **AfriHuBERT** https://arxiv.org/abs/2409.20201 — self-supervised speech rep model, 1,226 African langs. Cheaper ASR/LID fine-tuning base than Euro-centric wav2vec2.
- **Benchmarking Sociolinguistic Diversity in Swahili NLP** https://arxiv.org/html/2508.14051 — eval from 2,170 free-text Kenyan responses, deliberately captures Sheng / urban vernacular / code-mixing / loanwords. Standard models fail on real registers. **Use as the acceptance test** — users type "naomba nihelp na CV yangu" not textbook Swahili.
- **Artificially Fluent: Swahili AI Benchmarks** https://arxiv.org/abs/2509.04516 — empirically: English-trained-then-translated pipelines **do NOT close the gap** vs natively-trained Swahili models. *Direct evidence against "just translate around GPT" — read before committing to that shortcut.*
- **SwaQuAD-24** https://arxiv.org/abs/2410.14289 — Swahili extractive-QA benchmark (SQuAD-style). For evaluating a "answer from documents" / RAG feature.

## On-device / local AI
- **"Small Language Models are the Future of Agentic AI"** (NVIDIA Research) https://arxiv.org/abs/2506.02153 — most agent calls are narrow/repetitive/format-constrained → 1–8B model handles them; big model only as occasional router/fallback. Includes conversion methodology. **The cost model for East Africa** — heterogeneous system keeps per-session cost ~zero + works with patchy connectivity.
- **VoxCPM2 (OpenBMB)** https://github.com/OpenBMB/VoxCPM — tokenizer-free diffusion-AR TTS, 2B, 30 langs, Apache 2.0, 48kHz, ~0.3 RTF, streaming, voice-design-from-prompt. ~37k★. No Swahili OOTB but architecture + license make fine-tuning feasible (need TTS-cleared data).
- **Kokoro-82M** https://huggingface.co/hexgrad/Kokoro-82M + Kokoro.js (100% in-browser WASM/WebGPU) — 82M TTS, Apache 2.0, quality far above size, sub-1GB, no voice cloning. *Runs client-side on a mid-range phone browser — zero inference cost, offline once cached. Swahili not yet, but sets the tiny-model bar.*
- **Chatterbox Multilingual (Resemble AI)** — open weights, ~23 langs, per-clip watermark, beat ElevenLabs in own blind A/B. Watermarking-by-default matters for provenance of generated guidance.
- **Simon Willison — "last six months in LLMs in five minutes"** https://simonwillison.net/2026/may/19/5-minute-llms/ — open-weight Gemma 4 + Qwen3.x MoE (~20GB, laptop-runnable) now matching last year's frontier; coding agents crossed to "daily driver" ~Nov 2025.

## Offline / resilient / data
- **sqlite-sync (SQLite AI)** https://github.com/sqliteai/sqlite-sync — CRDT offline-first sync as a SQLite extension, any SQLite DB → conflict-free replica syncing to Postgres/Supabase, no backend code, RLS, block-level LWW for text. ~560★ Elastic License 2.0 (commercial license for prod). *Removes the hardest part of offline-first (merge logic) for near-zero effort — user edits CV on the bus, reconciles when signal returns.*
- **DuckDB built-in UI + MCP server + AES-256 at rest** https://duckdblab.org/en/post/duckdb-builtin-ui/ — single-file analytics shippable inside an app or on a $40 VPS; MCP server = agent answers "which skills show up most in Nairobi postings this month" against a local Parquet dump in natural language.
- **Vortex columnar format** — next-gen Parquet alt, faster on TPC-H, readable by DuckDB. Watch for a jobs/skills data pipeline; not switch-now.
- **L-RAG: Entropy-Based Lazy Loading** https://arxiv.org/abs/2601.06551 — training-free: only retrieve when output entropy says it's needed. ~8–26% fewer retrievals at ~equal accuracy, 80–210ms saved/query. *Cuts latency + vector-DB cost on a bandwidth-constrained deployment.*

## Dev tools / indie
- **bestofshowhn.com** https://bestofshowhn.com/2026 — maintained Show HN aggregator by month/YC-batch. Standing hunting ground. Recent: "uvx ptn" (scan QR → terminal session on your phone), OpenWorkers (self-host CF-Workers-compatible runtime in Rust), Claude Reflect (auto-converts your corrections to Claude into persistent config), live HN threads on "$25 Walmart phone as primary dev machine" (directly relevant to users' hardware reality).
- **Console.dev** https://console.dev + **localfirstnews.com** https://www.localfirstnews.com — two low-noise curation feeds (weekly devtools; local-first/sync/CRDT). Better signal than TLDR for this niche.
- **OpenCode** (MIT, provider-agnostic) / **Aider** (Apache 2.0, deep git, works w/ local Ollama) — terminal coding agents that run against a local quantized model — beats a metered-API agent for intermittent-connectivity dev in Nairobi.

## Watchlist (lighter verification)
- **AgenticQwen / "dual data flywheel"** https://arxiv.org/abs/2604.21590 — bootstrap a small agentic model's tool-use data from its own traffic. Relevant once you accumulate real Swahili transcripts → distill a cheaper model.
- **PyRAG (executable multi-hop RAG)** https://arxiv.org/abs/2605.12975 — multi-hop retrieval as a Python program with deterministic intermediate state; easier to debug than CoT retrieval.
- **"Voice of a Continent: Mapping Africa's Speech Technology Frontier"** https://arxiv.org/pdf/2505.18436 — landscape survey for partnership mapping.

## Act on first
1. **Omnilingual ASR + corpus** — prototype on-device Swahili voice input; in-context language extension fits code-switching users.
2. **The two Swahili benchmarks (2508.14051, 2509.04516)** — wire into CI NOW, before architecture lock-in, so "translate around an English LLM" gets falsified early.
3. **sqlite-sync** — if offline-first is real, removes the merge-logic problem for near-zero effort.
