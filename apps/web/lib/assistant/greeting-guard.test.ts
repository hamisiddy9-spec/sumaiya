import { describe, it, expect } from "vitest";
import { guardGreetingLanguage, hasWrongLanguageGreeting } from "./greeting-guard";

describe("guardGreetingLanguage — R1 live-QA language-fidelity backstop", () => {
  it("swaps a leading Swahili greeting in an English reply", () => {
    const out = guardGreetingLanguage("Karibu Grace! Let's get your CV ready.", "en", 0);
    expect(out).toBe("Hello Grace! Let's get your CV ready.");
    expect(hasWrongLanguageGreeting(out, "en")).toBe(false);
  });

  it("rotates English greetings so even the opener varies", () => {
    const a = guardGreetingLanguage("Karibu Grace!", "en", 0);
    const b = guardGreetingLanguage("Karibu Grace!", "en", 1);
    const c = guardGreetingLanguage("Karibu Grace!", "en", 2);
    expect(new Set([a, b, c]).size).toBe(3);
    expect(a).toMatch(/^(Hello|Hi|Welcome)\b/);
  });

  it("swaps a leading English greeting in a Swahili reply", () => {
    const out = guardGreetingLanguage("Welcome Juma! Tuandae CV yako.", "sw");
    expect(out).toBe("Karibu Juma! Tuandae CV yako.");
    expect(hasWrongLanguageGreeting(out, "sw")).toBe(false);
  });

  it("swaps Hi/Hello too, not just Welcome", () => {
    expect(guardGreetingLanguage("Hi Grace, let's begin.", "sw")).toBe("Karibu Grace, let's begin.");
    expect(guardGreetingLanguage("Hello Grace!", "sw")).toBe("Karibu Grace!");
  });

  it("passes through replies that already match the language (common case)", () => {
    const en = "Hi Grace, let's get your CV ready.";
    expect(guardGreetingLanguage(en, "en")).toBe(en);
    const sw = "Karibu Juma! Tuandae CV yako.";
    expect(guardGreetingLanguage(sw, "sw")).toBe(sw);
  });

  it("passes through replies with no greeting at all", () => {
    const plain = "Let's get your CV ready. What role are you targeting?";
    expect(guardGreetingLanguage(plain, "en")).toBe(plain);
    expect(guardGreetingLanguage(plain, "sw")).toBe(plain);
  });

  it("does not touch Karibu in the middle of a reply", () => {
    const mid = "I heard you say karibu sana — now let's start.";
    expect(guardGreetingLanguage(mid, "en")).toBe(mid);
  });

  it("handles empty input", () => {
    expect(guardGreetingLanguage("", "en")).toBe("");
    expect(guardGreetingLanguage("  ", "sw")).toBe("  ");
  });
});
