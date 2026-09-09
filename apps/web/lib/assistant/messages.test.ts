import { describe, it, expect } from "vitest";
import { toApiMessages, nonEmptyMessages } from "./messages";

describe("toApiMessages — client-side history filter (ZodError regression)", () => {
  it("drops a card-only message (empty content + card) — the Wave 3 live 400 repro", () => {
    // Thread state right after the user confirmed facts in the ConfirmationsCard:
    // the card message sits in history as { role: "assistant", content: "", card: {...} }.
    const history = [
      { role: "user" as const, content: "Nataka kutengeneza CV" },
      { role: "assistant" as const, content: "Sawa! Unatarget kazi gani?" },
      { role: "user" as const, content: "Sales Manager" },
      { role: "assistant" as const, content: "", card: { kind: "confirmations" } },
      { role: "user" as const, content: "Ndio, zote ni sahihi" },
    ];
    const api = toApiMessages(history);
    // Every sent message has non-empty content — no 400 from zod min(1).
    expect(api).toHaveLength(4);
    expect(api.every((m) => m.content.trim().length > 0)).toBe(true);
    expect(api.some((m) => m.content === "")).toBe(false);
    // Order preserved (the card slot is gone, not replaced).
    expect(api.map((m) => m.content)).toEqual([
      "Nataka kutengeneza CV",
      "Sawa! Unatarget kazi gani?",
      "Sales Manager",
      "Ndio, zote ni sahihi",
    ]);
  });

  it("drops whitespace-only content too", () => {
    const history = [
      { role: "assistant" as const, content: "   ", card: { kind: "signals", items: [] } },
      { role: "user" as const, content: "Habari" },
    ];
    expect(toApiMessages(history)).toEqual([{ role: "user", content: "Habari" }]);
  });

  it("prefers apiContent over content (attached-document messages)", () => {
    const history = [
      { role: "user" as const, content: "Hii ni CV yangu", apiContent: "[attached CV] full text…" },
    ];
    expect(toApiMessages(history)).toEqual([{ role: "user", content: "[attached CV] full text…" }]);
  });

  it("keeps real assistant replies with text", () => {
    const history = [
      { role: "assistant" as const, content: "Karibu! Unafanya kazi gani?" },
      { role: "user" as const, content: "Developer" },
    ];
    expect(toApiMessages(history)).toEqual(history);
  });

  it("empty history → empty payload", () => {
    expect(toApiMessages([])).toEqual([]);
  });
});

describe("nonEmptyMessages — server-side transcript backstop", () => {
  it("drops empty/whitespace entries, keeps real turns", () => {
    const messages = [
      { role: "user", content: "Habari" },
      { role: "assistant", content: "" },
      { role: "user", content: "   " },
      { role: "assistant", content: "Sawa — na target kazi gani?" },
    ];
    expect(nonEmptyMessages(messages).map((m) => m.content)).toEqual([
      "Habari",
      "Sawa — na target kazi gani?",
    ]);
  });

  it("all-real thread is unchanged", () => {
    const messages = [
      { role: "user", content: "A" },
      { role: "assistant", content: "B" },
    ];
    expect(nonEmptyMessages(messages)).toEqual(messages);
  });
});
