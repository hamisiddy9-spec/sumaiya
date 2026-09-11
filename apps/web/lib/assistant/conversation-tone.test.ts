import { describe, it, expect } from "vitest";
import { detectMessageTone, detectConversationTone } from "./conversation-tone";

describe("detectMessageTone", () => {
  it("detects formal Swahili", () => {
    expect(detectMessageTone("Shikamoo, naomba msaada wa kutengeneza CV yangu")).toBe("formal");
  });

  it("detects casual Swahili", () => {
    expect(detectMessageTone("Mambo! Vipi, unaweza kunisaidia na CV?")).toBe("casual");
  });

  it("detects formal English", () => {
    expect(detectMessageTone("Dear Sir, I would like to request assistance with my CV.")).toBe("formal");
  });

  it("detects casual English", () => {
    expect(detectMessageTone("hey can u help me make my cv lol")).toBe("casual");
  });

  it("returns null on no signal — never guesses", () => {
    expect(detectMessageTone("Can you help with my CV")).toBeNull();
    expect(detectMessageTone("")).toBeNull();
  });
});

describe("detectConversationTone", () => {
  it("returns null with no user messages", () => {
    expect(detectConversationTone([{ role: "assistant", content: "Dear Sir" }])).toBeNull();
  });

  it("majority-votes across the last few user messages", () => {
    const msgs = [
      { role: "user", content: "Dear Sir, I would like to build a CV" },
      { role: "assistant", content: "Sure" },
      { role: "user", content: "Kindly help with my experience section" },
      { role: "assistant", content: "OK" },
      { role: "user", content: "help with skills" },
    ];
    expect(detectConversationTone(msgs)).toBe("formal");
  });

  it("a tie returns null", () => {
    const msgs = [
      { role: "user", content: "hey lol" },
      { role: "user", content: "Kindly assist" },
    ];
    expect(detectConversationTone(msgs)).toBeNull();
  });
});
