// Eval-side AI access. The app's ai-provider supports DeepSeek → Anthropic →
// OpenAI; the eval harness additionally accepts an OpenRouter key
// (sk-or-v…) so verification runs work on machines configured with one —
// WITHOUT touching app code. Cached probe so the AI layer skips cleanly in CI
// (no keys) and on machines whose key is unreachable: a broken key must never
// fail the deterministic merge gate.
import { callAi, hasAiProvider } from "@/lib/api/ai-provider";

let cached: boolean | null = null;

/** True when SOME AI provider is configured AND reachable right now with a
 *  realistic generation budget (a 5-token ping proves nothing — a free-tier
 *  key can pass a ping and fail a real generation with 402). */
export async function aiReady(): Promise<boolean> {
  if (cached !== null) return cached;
  cached = await probe();
  return cached;
}

const PROBE_TOKENS = 300;

async function probe(): Promise<boolean> {
  if (hasAiProvider()) {
    const res = await callAi("Reply with exactly: OK", { maxTokens: PROBE_TOKENS, temperature: 0, timeoutMs: 15_000 });
    if (res && res.trim().toUpperCase().includes("OK")) return true;
  }
  if (openRouterKey()) {
    const res = await callOpenRouter("Reply with exactly: OK", { maxTokens: PROBE_TOKENS, temperature: 0, timeoutMs: 15_000 });
    if (res && res.trim().toUpperCase().includes("OK")) return true;
  }
  return false;
}

function openRouterKey(): string {
  const k = process.env.OPENAI_API_KEY ?? "";
  return k.startsWith("sk-or-v") ? k : "";
}

interface EvalCallOpts {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

/** Call whichever provider works: the app chain first, OpenRouter as fallback. */
export async function evalCallAi(prompt: string, opts: EvalCallOpts = {}): Promise<string | null> {
  if (hasAiProvider()) {
    const res = await callAi(prompt, opts);
    if (res) return res;
  }
  const key = openRouterKey();
  if (key) return callOpenRouter(prompt, opts, key);
  return null;
}

async function callOpenRouter(prompt: string, opts: EvalCallOpts, key?: string): Promise<string | null> {
  const k = key ?? openRouterKey();
  if (!k) return null;
  const { maxTokens = 1024, temperature = 0.7, timeoutMs = 52_000, jsonMode = false } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body: Record<string, unknown> = {
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    };
    if (jsonMode) body.response_format = { type: "json_object" };
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${k}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenRouter API ${res.status}`);
    const data = (await res.json()) as { choices?: [{ message?: { content?: string } }] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[eval] OpenRouter call failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
