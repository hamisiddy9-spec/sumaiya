import {
  UNAVAILABLE_COPY,
  WORKS_WITHOUT_A_MODEL,
  isModelUnavailableStatus,
  isRawServerEnglish,
  safeUnavailableText,
} from "./chat-unavailable";

describe("the unavailable state (§3.6)", () => {
  it("catches the literal bubble QA caught: 'AI is not configured.'", () => {
    expect(isRawServerEnglish("AI is not configured.")).toBe(true);
    expect(isRawServerEnglish("ai is not configured")).toBe(true);
    // …and never lets it reach a Swahili screen.
    const shown = safeUnavailableText("AI is not configured.", "sw");
    expect(shown).toBe(UNAVAILABLE_COPY["mid-turn"].title.sw);
    expect(shown).not.toMatch(/AI is not configured/);
    expect(shown).toBe("Sikuweza kufikiri ombi hili.");
  });

  it("catches the transport's own English and raw HTTP status lines", () => {
    for (const s of [
      "Network error. Check your connection.",
      "Request timed out. Check your connection.",
      "500 Internal Server Error",
      "503 Service Unavailable",
      "Unauthorized",
      "Too many requests",
    ]) {
      expect(isRawServerEnglish(s)).toBe(true);
    }
  });

  it("never rewrites copy that is already the user's language", () => {
    for (const s of [
      "Nina shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.",
      "Sikuweza kufikiri ombi hili.",
      "Huduma inayoniwezesha kufikiri haipatikani sasa hivi.",
    ]) {
      expect(isRawServerEnglish(s)).toBe(false);
      expect(safeUnavailableText(s, "sw")).toBe(s);
    }
    // An empty or missing string falls back to her own sentence, not to "".
    expect(safeUnavailableText("", "sw")).toBe(UNAVAILABLE_COPY["mid-turn"].title.sw);
    expect(safeUnavailableText(undefined, "sw")).toBe(UNAVAILABLE_COPY["mid-turn"].title.sw);
    expect(safeUnavailableText(null, "en")).toBe(UNAVAILABLE_COPY["mid-turn"].title.en);
  });

  it("keeps every variant in the first person and blames nobody", () => {
    for (const variant of ["known", "mid-turn", "partial"] as const) {
      const c = UNAVAILABLE_COPY[variant];
      const sw = `${c.title.sw} ${c.why.sw} ${c.missing.sw} ${c.promise.sw}`;
      const en = `${c.title.en} ${c.why.en} ${c.missing.en} ${c.promise.en}`;
      // No code, no third-person self-description, no begging.
      expect(sw).not.toMatch(/Sumaiya\s+(ana|ata|haja)/);
      expect(sw).not.toMatch(/\b(404|429|500|502|503|504)\b/);
      expect(sw.toLowerCase()).not.toContain("tafadhali jaribu tena baada");
      expect(en.toLowerCase()).not.toContain("sorry");
      // First person, about herself.
      expect(/^(Sina|Sikuweza|Kuandika|Kinachokosekana|Nimehifadhi|Nitaleta|Hatua|Sababu|Huduma|Sikutaka)/.test(sw)).toBe(true);
    }
  });

  it("rules out the wrong cause on the mid-turn variant", () => {
    const { why } = UNAVAILABLE_COPY["mid-turn"];
    expect(why.sw).toContain("Si mtandao wako, na si maandishi yako");
    expect(why.en).toContain("not your network");
  });

  it("offers only things that work with no model, and always at least one", () => {
    expect(WORKS_WITHOUT_A_MODEL.length).toBe(3);
    for (const a of WORKS_WITHOUT_A_MODEL) {
      expect(a.label.sw.length).toBeGreaterThan(0);
      expect(a.hint.sw.length).toBeGreaterThan(0);
      // Never a mechanism named in Swahili (§6 rule 5 of the Swahili standard).
      expect(`${a.label.sw} ${a.hint.sw}`).not.toMatch(/\bATS\b|\bAI\b/);
    }
  });

  it("treats every model-missing failure as one state", () => {
    expect(isModelUnavailableStatus(503)).toBe(true);
    expect(isModelUnavailableStatus(429)).toBe(true);
    expect(isModelUnavailableStatus(502)).toBe(true);
    expect(isModelUnavailableStatus(0)).toBe(true);
    expect(isModelUnavailableStatus(401)).toBe(false);
    expect(isModelUnavailableStatus(undefined)).toBe(false);
  });
});
