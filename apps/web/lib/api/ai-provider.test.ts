import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveModelForEffort, defaultEffort, EFFORT_LABELS, THINKING_EFFORTS, resolveOpenRouterModels, providerOrder } from "@/lib/api/ai-provider";

describe("thinking effort (WS-6)", () => {
  it("fast/balanced use deepseek-chat, deep uses deepseek-reasoner", () => {
    const env = {};
    expect(resolveModelForEffort("fast", env)).toBe("deepseek-chat");
    expect(resolveModelForEffort("balanced", env)).toBe("deepseek-chat");
    expect(resolveModelForEffort("deep", env)).toBe("deepseek-reasoner");
  });

  it("honours env model overrides per effort", () => {
    const env = { DEEPSEEK_MODEL: "deepseek-v3", DEEPSEEK_MODEL_DEEP: "deepseek-r1" };
    expect(resolveModelForEffort("fast", env)).toBe("deepseek-v3");
    expect(resolveModelForEffort("deep", env)).toBe("deepseek-r1");
  });

  it("default effort is balanced unless env says otherwise", () => {
    expect(defaultEffort()).toBe("balanced");
  });

  it("effort labels are bilingual", () => {
    expect(EFFORT_LABELS.fast.sw).toBe("Haraka");
    expect(EFFORT_LABELS.deep.sw).toBe("Kina");
    expect(EFFORT_LABELS.balanced.en).toBe("Balanced");
  });

  it("three distinct efforts exist", () => {
    expect(THINKING_EFFORTS).toEqual(["fast", "balanced", "deep"]);
  });
});

describe("OpenRouter models", () => {
  /**
   * There is no default free slug, and that is the fix, not an oversight.
   * OpenRouter retired every `deepseek/*:free` slug, so the old defaults
   * (`deepseek/deepseek-chat-v3:free`, `deepseek/deepseek-r1:free`) answered
   * 404 on every request — a guaranteed wasted round trip per AI call, plus a
   * warning on every call. Verified against the live model list 2026-09-13.
   */
  it("defaults free to the paid slug when no real free slug is configured", () => {
    const env = {};
    expect(resolveOpenRouterModels("fast", env)).toEqual({
      free: "deepseek/deepseek-chat",
      paid: "deepseek/deepseek-chat",
    });
    expect(resolveOpenRouterModels("deep", env)).toEqual({
      free: "deepseek/deepseek-chat",
      paid: "deepseek/deepseek-chat",
    });
    // free === paid is what makes callProvider skip the free attempt entirely.
    expect(resolveOpenRouterModels("balanced", env).free).toBe(
      resolveOpenRouterModels("balanced", env).paid,
    );
  });

  it("never defaults to a retired ':free' deepseek slug", () => {
    for (const effort of ["fast", "balanced", "deep"] as const) {
      expect(resolveOpenRouterModels(effort, {}).free).not.toMatch(/deepseek.*:free/);
    }
  });

  it("honours env overrides", () => {
    const env = { OPENROUTER_MODEL_FREE: "x/free", OPENROUTER_MODEL_PAID: "x/paid", OPENROUTER_MODEL_DEEP: "x/deep" };
    expect(resolveOpenRouterModels("balanced", env)).toEqual({ free: "x/free", paid: "x/paid" });
    expect(resolveOpenRouterModels("deep", env)).toEqual({ free: "x/deep", paid: "x/paid" });
  });

  it("a configured free slug still wins, so the tier can be turned back on", () => {
    expect(resolveOpenRouterModels("fast", { OPENROUTER_MODEL_FREE: "vendor/model:free" }).free).toBe(
      "vendor/model:free",
    );
  });
});

describe("providerOrder", () => {
  // Scoped stubs, restored after every test. The previous version of this suite
  // mutated `process.env` directly and put `process.env = saved` on the LAST
  // line of each test — so a key this file invented ("***") stayed visible to
  // every test file that ran afterwards in the same worker (pool: forks,
  // maxWorkers: 1, fileParallelism: false), and nothing was restored at all if
  // an assertion threw first. File order decided whether other suites reached
  // the network.
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no provider is configured at baseline — the suite never calls out", () => {
    // Tripwire for test/hermetic-ai-env.ts. If this fails, tests are making real
    // requests to a paid provider: ~1s per generative test, real spend, and
    // vitest timeouts that trip the moment the box is busy.
    expect(providerOrder()).toEqual([]);
  });

  it("tries DeepSeek → OpenRouter → Anthropic → OpenAI, skipping unset keys", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "***");
    expect(providerOrder()).toEqual(["openrouter"]);
    vi.stubEnv("DEEPSEEK_API_KEY", "***");
    vi.stubEnv("ANTHROPIC_API_KEY", "***");
    vi.stubEnv("OPENAI_API_KEY", "***");
    expect(providerOrder()).toEqual(["deepseek", "openrouter", "anthropic", "openai"]);
  });

  it("a configured LiteLLM proxy is tried first (it's the router)", () => {
    vi.stubEnv("LITELLM_BASE_URL", "https://proxy.example");
    vi.stubEnv("LITELLM_API_KEY", "***");
    vi.stubEnv("DEEPSEEK_API_KEY", "***");
    expect(providerOrder()[0]).toBe("litellm");
  });
});
