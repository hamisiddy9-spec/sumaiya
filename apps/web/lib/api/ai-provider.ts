// Shared AI provider call. Tries every configured provider in priority order
// (DeepSeek → OpenRouter → Anthropic → OpenAI) and returns the first non-empty
// completion, or null when none are configured / all fail (callers decide the
// fallback). Every AI feature routes through here so provider logic lives in
// exactly one place.
//
// Thinking effort (Hamis 2026-08-26): users choose a per-conversation thinking
// effort — fast/balanced/deep — instead of a paid strong-model tier. Effort only
// changes generation quality/cost, never the deterministic engines (scores,
// matching, validation are pure code).
//
// OpenRouter (2026-09-07): added as the resilient default. It's OpenAI-API
// compatible and lets a single key reach many models. Within the OpenRouter
// attempt we try a free model first (OPENROUTER_MODEL_FREE) and, if it's rate
// -limited / unavailable, fall back once to a cheap paid model
// (OPENROUTER_MODEL_PAID) — so a free-tier 429 never surfaces to the user.

export type ThinkingEffort = "fast" | "balanced" | "deep";

export const THINKING_EFFORTS: ThinkingEffort[] = ["fast", "balanced", "deep"];

export const EFFORT_LABELS: Record<ThinkingEffort, { en: string; sw: string }> = {
  fast: { en: "Fast", sw: "Haraka" },
  balanced: { en: "Balanced", sw: "Wastani" },
  deep: { en: "Deep", sw: "Kina" },
};

/** The default effort from env (AI_THINKING_EFFORT_DEFAULT), validated. */
export function defaultEffort(): ThinkingEffort {
  const v = process.env.AI_THINKING_EFFORT_DEFAULT;
  return v === "fast" || v === "deep" ? v : "balanced";
}

/** Map effort → DeepSeek model name (pure, testable). */
export function resolveModelForEffort(effort: ThinkingEffort, env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): string {
  if (effort === "deep") return env.DEEPSEEK_MODEL_DEEP || "deepseek-reasoner";
  return env.DEEPSEEK_MODEL || "deepseek-chat";
}

/** Map effort → OpenRouter model slugs (free first, then paid fallback). */
export function resolveOpenRouterModels(
  effort: ThinkingEffort,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): { free: string; paid: string } {
  if (effort === "deep") {
    return {
      free: env.OPENROUTER_MODEL_DEEP || "deepseek/deepseek-r1:free",
      paid: env.OPENROUTER_MODEL_PAID || "deepseek/deepseek-chat",
    };
  }
  return {
    free: env.OPENROUTER_MODEL_FREE || "deepseek/deepseek-chat-v3:free",
    paid: env.OPENROUTER_MODEL_PAID || "deepseek/deepseek-chat",
  };
}

interface CallOpts {
  maxTokens?: number;
  temperature?: number;
  // Abort the provider request after this many ms. Must stay under the API
  // route's `maxDuration` (60s on Hobby) so a slow model returns a clean caught
  // error → the caller sends a friendly 502, instead of the function being hard
  // -killed at the platform limit (which yields a non-JSON 504 the client can't
  // read). Defaults to 52s to leave headroom under the 60s cap.
  timeoutMs?: number;
  // Ask the provider for a strict JSON object response. Cuts latency and makes
  // parsing reliable for extraction tasks (e.g. import-CV). The prompt must
  // still mention "json" for DeepSeek/OpenAI/OpenRouter to honour it.
  jsonMode?: boolean;
  // Thinking effort: fast (chat, no thinking) | balanced (chat with low-budget
  // thinking) | deep (reasoner). Defaults to defaultEffort().
  effort?: ThinkingEffort;
}

export type ProviderName = "litellm" | "deepseek" | "openrouter" | "anthropic" | "openai";

/** Providers with a key set, in the order they'll be tried. */
export function providerOrder(): ProviderName[] {
  const order: ProviderName[] = [];
  // A LiteLLM proxy, when configured, is the model router: it owns model
  // selection, fallbacks, central spend caps and request logging. Prefer it.
  if (process.env.LITELLM_BASE_URL && process.env.LITELLM_API_KEY) order.push("litellm");
  if (process.env.DEEPSEEK_API_KEY) order.push("deepseek");
  if (process.env.OPENROUTER_API_KEY) order.push("openrouter");
  if (process.env.ANTHROPIC_API_KEY) order.push("anthropic");
  if (process.env.OPENAI_API_KEY) order.push("openai");
  return order;
}

export function hasAiProvider(): boolean {
  return activeProvider() !== null;
}

/** Name of the provider that will be tried first, or null if none configured.
 *  Never exposes the key itself. */
export function activeProvider(): ProviderName | null {
  return providerOrder()[0] ?? null;
}

interface ProviderCall {
  prompt: string;
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
  effort: ThinkingEffort;
  signal: AbortSignal;
}

function pickText(data: unknown): string | null {
  const d = data as {
    choices?: [{ message?: { content?: string } }];
    content?: [{ text?: string }];
  };
  return (d.choices?.[0]?.message?.content ?? d.content?.[0]?.text ?? "").trim() || null;
}

async function openAiCompatible(
  url: string,
  key: string,
  model: string,
  cfg: ProviderCall,
  extraHeaders: Record<string, string> = {},
): Promise<string | null> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: cfg.prompt }],
    max_tokens: cfg.maxTokens,
    temperature: cfg.temperature,
  };
  if (cfg.jsonMode) body.response_format = { type: "json_object" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...extraHeaders },
    body: JSON.stringify(body),
    signal: cfg.signal,
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return pickText(await res.json());
}

async function callProvider(provider: ProviderName, cfg: ProviderCall): Promise<string | null> {
  switch (provider) {
    case "litellm": {
      // OpenAI-compatible. The proxy maps LITELLM_MODEL (or our effort model)
      // to whatever upstream it's configured with.
      const base = (process.env.LITELLM_BASE_URL as string).replace(/\/$/, "");
      const model = process.env.LITELLM_MODEL || resolveModelForEffort(cfg.effort);
      return openAiCompatible(
        `${base}/chat/completions`,
        process.env.LITELLM_API_KEY as string,
        model,
        cfg,
      );
    }

    case "deepseek": {
      const body: Record<string, unknown> = {
        model: resolveModelForEffort(cfg.effort),
        messages: [{ role: "user", content: cfg.prompt }],
        max_tokens: cfg.maxTokens,
        temperature: cfg.temperature,
      };
      if (cfg.effort === "balanced") body.chat_template_kwargs = { thinking: true };
      if (cfg.jsonMode) body.response_format = { type: "json_object" };
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: cfg.signal,
      });
      if (!res.ok) throw new Error(`DeepSeek API ${res.status}`);
      return pickText(await res.json());
    }

    case "openrouter": {
      const { free, paid } = resolveOpenRouterModels(cfg.effort);
      // OpenRouter asks for these for attribution / model-ranking; harmless if absent.
      const headers = {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://sumaiya.pro",
        "X-Title": "Sumaiya",
      };
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const key = process.env.OPENROUTER_API_KEY as string;
      try {
        const out = await openAiCompatible(url, key, free, cfg, headers);
        if (out) return out;
        throw new Error("OpenRouter free model returned empty");
      } catch (err) {
        if (cfg.signal.aborted || free === paid) throw err;
        // Free model rate-limited / unavailable / empty → one paid retry.
        console.warn("[AI] OpenRouter free model failed, retrying on paid:", err);
        return openAiCompatible(url, key, paid, cfg, headers);
      }
    }

    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY as string,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: cfg.maxTokens,
          messages: [{ role: "user", content: cfg.prompt }],
        }),
        signal: cfg.signal,
      });
      if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
      return pickText(await res.json());
    }

    case "openai":
      return openAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        process.env.OPENAI_API_KEY as string,
        process.env.OPENAI_MODEL || "gpt-4o-mini",
        cfg,
      );
  }
}

export async function callAi(prompt: string, opts: CallOpts = {}): Promise<string | null> {
  const { maxTokens = 1024, temperature = 0.7, timeoutMs = 52_000, jsonMode = false } = opts;
  const effort = opts.effort ?? defaultEffort();
  // Deep reasoning needs more output headroom — only when the caller didn't
  // pick a specific budget.
  const effectiveMaxTokens = opts.maxTokens === undefined && effort === "deep" ? 2048 : maxTokens;

  // One AbortController for the whole chain — a slow model is aborted cleanly
  // (caught below → we stop, rather than hanging until the function cap).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cfg: ProviderCall = {
    prompt,
    maxTokens: effectiveMaxTokens,
    temperature,
    jsonMode,
    effort,
    signal: controller.signal,
  };

  try {
    for (const provider of providerOrder()) {
      try {
        const out = await callProvider(provider, cfg);
        if (out) return out;
      } catch (err) {
        console.error(`[AI] ${provider} call failed:`, err);
      }
      // A timeout means the whole request budget is spent — don't try the next.
      if (controller.signal.aborted) break;
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
