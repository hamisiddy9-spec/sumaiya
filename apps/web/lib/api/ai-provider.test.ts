import { describe, it, expect } from "vitest";
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
  it("defaults: free chat model for fast/balanced, r1 for deep, paid fallback shared", () => {
    const env = {};
    expect(resolveOpenRouterModels("fast", env)).toEqual({
      free: "deepseek/deepseek-chat-v3:free",
      paid: "deepseek/deepseek-chat",
    });
    expect(resolveOpenRouterModels("deep", env)).toEqual({
      free: "deepseek/deepseek-r1:free",
      paid: "deepseek/deepseek-chat",
    });
  });

  it("honours env overrides", () => {
    const env = { OPENROUTER_MODEL_FREE: "x/free", OPENROUTER_MODEL_PAID: "x/paid", OPENROUTER_MODEL_DEEP: "x/deep" };
    expect(resolveOpenRouterModels("balanced", env)).toEqual({ free: "x/free", paid: "x/paid" });
    expect(resolveOpenRouterModels("deep", env)).toEqual({ free: "x/deep", paid: "x/paid" });
  });
});

describe("providerOrder", () => {
  it("tries DeepSeek → OpenRouter → Anthropic → OpenAI, skipping unset keys", () => {
    const saved = { ...process.env };
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    process.env.OPENROUTER_API_KEY = "test";
    expect(providerOrder()).toEqual(["openrouter"]);
    process.env.DEEPSEEK_API_KEY = "test";
    process.env.OPENAI_API_KEY = "test";
    expect(providerOrder()).toEqual(["deepseek", "openrouter", "openai"]);
    process.env = saved;
  });
});
