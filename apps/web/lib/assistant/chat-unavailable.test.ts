import { describe, expect, it } from "vitest";

import {
  UNAVAILABLE_COPY,
  WORKS_WITHOUT_A_MODEL,
  isModelUnavailableStatus,
  isRawServerEnglish,
  safeUnavailableText,
} from "./chat-unavailable";

describe("the web unavailable state (§3.6)", () => {
  it("catches the literal bubble QA caught on the web: 'AI is not configured.'", () => {
    // The exact body of the 503 from apps/web/lib/api/routes/ai.ts:546.
    expect(isRawServerEnglish("AI is not configured.")).toBe(true);
    const shown = safeUnavailableText("AI is not configured.", true);
    expect(shown).toBe(UNAVAILABLE_COPY["mid-turn"].title.sw);
    expect(shown).not.toMatch(/AI is not configured/);
  });

  it("catches the transport's English and raw HTTP status lines", () => {
    for (const s of [
      "Network error. Check your connection.",
      "Request timed out. Check your connection.",
      "500 Internal Server Error",
      "503 Service Unavailable",
      "Unauthorized",
      "Too many requests",
    ]) {
      expect(isRawServerEnglish(s)).toBe(true);
      // …and none of them survives to the screen.
      expect(safeUnavailableText(s, true)).not.toBe(s);
    }
  });

  it("never rewrites copy that is already the user's language", () => {
    for (const s of [
      "Nina shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.",
      "Sikuweza kufikiri ombi hili.",
    ]) {
      expect(isRawServerEnglish(s)).toBe(false);
      expect(safeUnavailableText(s, true)).toBe(s);
    }
    expect(safeUnavailableText("", true)).toBe(UNAVAILABLE_COPY["mid-turn"].title.sw);
    expect(safeUnavailableText(undefined, false)).toBe(UNAVAILABLE_COPY["mid-turn"].title.en);
  });

  it("keeps every variant first-person, code-free and blameless", () => {
    for (const variant of ["known", "mid-turn", "partial"] as const) {
      const c = UNAVAILABLE_COPY[variant];
      const sw = `${c.title.sw} ${c.why.sw} ${c.missing.sw} ${c.promise.sw}`;
      const en = `${c.title.en} ${c.why.en} ${c.missing.en} ${c.promise.en}`;
      expect(sw).not.toMatch(/Sumaiya\s+(ana|ata)/);
      expect(sw).not.toMatch(/\b(404|429|500|502|503|504)\b/);
      expect(en.toLowerCase()).not.toContain("sorry");
      expect(/^(Sina|Sikuweza|Kuandika|Kinachokosekana|Nimehifadhi|Nitaleta|Hatua|Sababu|Huduma|Sikutaka)/.test(sw)).toBe(true);
    }
  });

  it("rules out the wrong cause on the mid-turn variant", () => {
    expect(UNAVAILABLE_COPY["mid-turn"].why.sw).toContain("Si mtandao wako, na si maandishi yako");
  });

  it("offers only model-free actions, with no mechanism named in Swahili", () => {
    expect(WORKS_WITHOUT_A_MODEL.length).toBe(3);
    for (const a of WORKS_WITHOUT_A_MODEL) {
      expect(a.label.sw.length).toBeGreaterThan(0);
      expect(`${a.label.sw} ${a.hint.sw}`).not.toMatch(/\bATS\b|\bAI\b/);
    }
  });

  it("treats every model-missing failure as one state", () => {
    for (const s of [429, 502, 503, 504, 0]) expect(isModelUnavailableStatus(s)).toBe(true);
    expect(isModelUnavailableStatus(401)).toBe(false);
    expect(isModelUnavailableStatus(undefined)).toBe(false);
  });
});
