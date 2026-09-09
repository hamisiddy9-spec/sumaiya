# Agent A — AI agents / inference / RAG (verified active 2025–2026)

## 1. Lean agent frameworks
- **smolagents** (HF) https://github.com/huggingface/smolagents — agents "think in code" (write Python actions, not JSON tool calls); ~1000 LOC core; model-agnostic (local transformers/Ollama/llama.cpp/LiteLLM/API); ~17k★ Apache-2.0. Code-action cuts token cost + round-trips.
- **Pydantic AI** https://github.com/pydantic/pydantic-ai — type-safe, structured outputs, DI, model-agnostic. v2.0 (June 2026) added "Capabilities API" + first-party eval Harness. ~10k★ MIT, Pydantic/Logfire-backed.
- **Atomic Agents** https://github.com/BrainBlend-AI/atomic-agents — ultra-light IPO schema-driven building blocks; no hidden control flow; leaner LangChain/CrewAI alt. ~3.5k★ MIT.
- **RouteLLM** (LMSYS) https://github.com/lm-sys/RouteLLM — learned routers: easy→cheap model, hard→premium. Ships pretrained routers; claims ~85% cost cut retaining ~95% quality. ~3.8k★ Apache-2.0.
- **OpenAI Agents SDK** https://github.com/openai/openai-agents-python — provider-agnostic (100+ models via LiteLLM), lean primitives (agents/handoffs/guardrails/sessions/tracing). Apache-2.0.

## 2. Structured output / tool-calling
- **BAML** (BoundaryML) https://github.com/BoundaryML/baml — DSL for typed LLM functions → native Py/TS clients w/ guaranteed structured output. **"Schema-Aligned Parsing" works on models with NO native structured-output mode** (i.e. most small/open ones). ~8.4k★ Apache-2.0, YC. *Killer feature for weak/local models.*
- **XGrammar** (MLC) https://github.com/mlc-ai/xgrammar — CFG constrained decoding, <40µs/token, backend in vLLM/SGLang/TensorRT-LLM. ~97% vs Outlines ~76% schema accuracy on hard nested cases; no compile stalls. Apache-2.0.
- **Outlines** (dottxt) https://github.com/dottxt-ai/outlines — best-known; JSON Schema/Pydantic/regex/EBNF; transformers/llama.cpp/vLLM/MLX. Weakness: 3–12s first-compile on complex schemas. ~11k★ Apache-2.0.
- **Instructor** https://github.com/567-labs/instructor — patch any client → validated Pydantic + auto-retry on failure. Py + TS/Go/Rust/Elixir ports, 15+ providers incl local. ~9k★ MIT. *Lowest-effort typed output.*

## 3. On-device / small models
- **MLC LLM** https://github.com/mlc-ai/mlc-llm — compiler-based universal deploy (Android/iOS/WebGPU/Vulkan/Metal/CUDA via TVM). Fastest documented Android path — Snapdragon Hexagon NPU, ~40 tok/s Qwen3-1.7B on Galaxy S25. Also WebLLM (in-browser). ~20k★ Apache-2.0.
- **llama.cpp** https://github.com/ggml-org/llama.cpp — de-facto portable runtime, GGUF, ARM64 NEON/i8mm. The realistic baseline for cheap Android (no NPU). ~70k★ MIT.
- **PyTorch ExecuTorch** https://github.com/pytorch/executorch — Meta's on-device runtime, NPU delegation (Vulkan/CoreML/Qualcomm/MediaTek); engine behind on-device Llama in Meta apps. 1.0 (2025). Most "official" native-Android route.
- **Unsloth** https://github.com/unslothai/unsloth — 2× faster / −70% VRAM LoRA/QLoRA + **Dynamic GGUF quants** (per-layer bit-width, >10% better top-1 at same size). ~40k★ Apache-2.0. *Fine-tune a 1–3B on Swahili CV data on one rented GPU.*
- Target models: **Qwen3-1.7B/4B** (strong multilingual incl Swahili, good tool-calling), **Gemma 3n E2B/E4B** (built for on-device, multimodal, Per-Layer-Embeddings), **SmolLM3-3B** (fully open, 64k ctx), **LFM2-1.2B** (Liquid, edge-optimized). → Qwen3-small + Gemma 3n most credible for Swahili on-device; benchmark Swahili directly.

## 4. Eval / observability / guardrails
- **Opik** (Comet) https://github.com/comet-ml/opik — eval + tracing + prompt mgmt + prod monitoring; fully Apache-2.0 **no feature-gating**; 6 built-in prompt-optimization algos. ~7k★. *Self-host, catch Swahili quality regressions, version prompts.*
- **Langfuse** https://github.com/langfuse/langfuse — most-adopted OSS observability; OTel-native; MIT core. ~10k★.
- **Arize Phoenix** https://github.com/Arize-ai/phoenix — notebook-first, best at RAG debugging (retrieval viz, embedding drift). ELv2 (not OSI-open).
- **promptfoo** — MIT, but **OpenAI acquired it ~March 2026** — watch direction. → **DeepEval** https://github.com/confident-ai/deepeval (Apache-2.0, pytest-style LLM asserts) for CI gating.
- **LLM Guard** https://github.com/protectai/llm-guard — MIT scanners (PII, prompt-injection, toxicity, secrets), import-and-call. *Concrete near-term use: PII scrub on uploaded CVs (names/phones/ID numbers).*
- **NeMo Guardrails** (NVIDIA) — Apache-2.0, programmable rails via Colang; topic control, PII, grounding, multilingual.

## 5. RAG (2026 production)
- **ColBERT / PyLate / RAGatouille** (late-interaction, multi-vector, MaxSim) — near cross-encoder accuracy at ~bi-encoder speed; robust to domain shift + short queries where tiny dense embedders fail. PyLate https://github.com/lightonai/pylate (LightOn), RAGatouille https://github.com/AnswerDotAI/RAGatouille. *A small ColBERT is cheap + forgiving for a low-resource Swahili careers/labor-law corpus.*
- **Contextual Retrieval** (Anthropic cookbook technique) — prepend LLM-generated 1–2 sentence context to each chunk before embedding; big retrieval-failure drop. Do it offline once → zero runtime cost.
- Standard stack: BM25 + dense (+ late-interaction) → rerank → generate. **Rerankers matter more than the embedder**: bge-reranker-v2-m3 (multilingual, small, CPU), Jina, mxbai-rerank.

## 6. Cost / latency
- **semantic-router** (Aurelio) https://github.com/aurelio-labs/semantic-router — classify utterance by embedding similarity to example routes instead of an LLM call; µs-latency, fully local. MIT ~2.7k★. *Replace the assistant's "what does the user want" LLM call — free, instant, offline.*
- **LMCache** https://github.com/LMCache/LMCache — KV-cache reuse across requests/nodes/tiers for vLLM/SGLang; 3–10× TTFT on shared-prefix; PyTorch Foundation. Only if self-hosting at scale.
- **GPTCache** https://github.com/zilliztech/GPTCache — semantic cache (Faiss/Redis/Milvus/Qdrant). MIT. *FAQ-style career Qs repeat constantly → serve from local cache, zero LLM calls, works offline for hits.* (lighter: Redis 8 vector sets / Upstash Semantic Cache)
- Speculative decoding — built into vLLM/SGLang/llama.cpp (`--draft-model`); 2–3× on code/structured/stable dialogue.
- Providers: **OpenRouter** (routing+fallback+cheap open models, one API) default; **DeepInfra** low-cost backend; Groq/Cerebras extreme speed w/ capacity walls; Baseten/Fireworks/Together reliable middle.

## Shortlist for Sumaiya
| Need | Pick |
|---|---|
| Offline inference cheap phone | llama.cpp + Qwen3-1.7B/Gemma-3n GGUF (Unsloth Dynamic quant) |
| Offline flagship phone | MLC LLM (NPU) / ExecuTorch |
| Reliable JSON from weak model | BAML (or Instructor) |
| Intent w/o LLM call | semantic-router |
| Repeated-question cost | GPTCache / Redis semantic cache |
| Cheap↔premium routing | RouteLLM + OpenRouter |
| Swahili corpus retrieval | ColBERT/PyLate + contextual chunks + CPU reranker |
| Eval / regressions | Opik (self-host) + DeepEval in CI |
| PII scrub on CVs | LLM Guard |
| Agent glue | smolagents / Pydantic AI |
