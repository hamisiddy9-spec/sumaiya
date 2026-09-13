import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ callAi: vi.fn() }));
vi.mock("../api/ai-provider", () => ({ callAi: mocks.callAi }));

import { checkNoFabrication } from "./fabrication-check";

describe("checkNoFabrication", () => {
  beforeEach(() => {
    mocks.callAi.mockReset();
  });

  it("passes empty generated text without calling the AI", async () => {
    const verdict = await checkNoFabrication("Name: Hisense\nCurrent role: Shop manager", "");
    expect(verdict.fabricated).toBe(false);
    expect(mocks.callAi).not.toHaveBeenCalled();
  });

  it("flags a fabricated senior role invented from the job posting", async () => {
    mocks.callAi.mockResolvedValue(
      JSON.stringify({ fabricated: true, reason: "Claims to be a Principal Sales Engineer, which is not in the candidate facts." }),
    );
    const verdict = await checkNoFabrication(
      "Name: Hisense\nCurrent role: Shop manager and sales\nWork history: Mfanyakazi wa duka @ Duka la Jumla Mbezi Beach",
      "Mhandisi mkuu wa mauzo mwenye uzoefu wa kuongoza mkakati wa kiufundi wa mauzo...",
    );
    expect(verdict.fabricated).toBe(true);
    expect(verdict.reason.length).toBeGreaterThan(5);
  });

  it("passes a truthful reframing of real experience", async () => {
    mocks.callAi.mockResolvedValue(JSON.stringify({ fabricated: false, reason: "" }));
    const verdict = await checkNoFabrication(
      "Name: Hisense\nCurrent role: Shop manager and sales",
      "Customer-facing retail professional with hands-on experience serving customers and managing store operations.",
    );
    expect(verdict.fabricated).toBe(false);
  });

  it("fails open (not fabricated) when the AI call returns null", async () => {
    mocks.callAi.mockResolvedValue(null);
    const verdict = await checkNoFabrication("facts", "some summary text here");
    expect(verdict.fabricated).toBe(false);
  });

  it("fails open when the AI returns malformed JSON", async () => {
    mocks.callAi.mockResolvedValue("not json");
    const verdict = await checkNoFabrication("facts", "some summary text here");
    expect(verdict.fabricated).toBe(false);
  });

  it("fails open when callAi throws", async () => {
    mocks.callAi.mockRejectedValue(new Error("timeout"));
    const verdict = await checkNoFabrication("facts", "some summary text here");
    expect(verdict.fabricated).toBe(false);
  });

  it("fails open when the response has no boolean fabricated field", async () => {
    mocks.callAi.mockResolvedValue(JSON.stringify({ reason: "x" }));
    const verdict = await checkNoFabrication("facts", "some summary text here");
    expect(verdict.fabricated).toBe(false);
  });
});
