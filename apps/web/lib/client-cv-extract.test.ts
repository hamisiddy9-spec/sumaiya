// Unit tests for the D7 lazy-load guard (loadOcrEngine) — the memoization and
// retry semantics that keep tesseract.js (WASM OCR) OUT of the /snap paste
// path and prevent re-downloading the engine chunk on repeated photo attempts.
//
// Deterministic, no browser, no real tesseract: the dynamic import is mocked
// per-test with vi.doMock (the mocked module is re-evaluated on each import).

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("loadOcrEngine — D7 lazy-load guard", () => {
  beforeEach(() => {
    vi.resetModules(); // memo is module-level → fresh state per test
  });

  it("loads the engine lazily and memoizes the module promise (single fetch)", async () => {
    vi.doMock("tesseract.js", () => ({
      recognize: vi.fn(async () => ({ data: { text: "ok" } })),
    }));
    const { loadOcrEngine } = await import("@/lib/client-cv-extract");
    const first = loadOcrEngine();
    const second = loadOcrEngine();
    // Concurrent callers share ONE import() — the chunk is fetched once even
    // if two photo attempts overlap.
    expect(first).toBe(second);
    await expect(first).resolves.toHaveProperty("recognize");
  });

  it("clears the memo on failure so a later attempt genuinely retries", async () => {
    // Simulate a transient network blip: the first chunk fetch fails…
    let fail = true;
    vi.doMock("tesseract.js", () => {
      if (fail) throw new Error("simulated OCR chunk load failure");
      return { recognize: vi.fn(async () => ({ data: { text: "ok" } })) };
    });
    const { loadOcrEngine } = await import("@/lib/client-cv-extract");
    const failed = loadOcrEngine();
    // Vitest wraps the factory throw, so only assert that the load failed.
    await expect(failed).rejects.toThrow();
    // …then the blip clears and the next call must be a real re-attempt.
    fail = false;
    const retry = loadOcrEngine();
    expect(retry).not.toBe(failed); // not the cached rejection
    await expect(retry).resolves.toHaveProperty("recognize");
  });
});
