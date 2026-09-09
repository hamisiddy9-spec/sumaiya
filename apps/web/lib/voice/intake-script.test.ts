import { describe, it, expect } from "vitest";
import { VOICE_INTAKE, buildTranscript } from "./intake-script";

describe("voice intake script", () => {
  it("every question has both languages and a stable id", () => {
    const ids = new Set<string>();
    for (const q of VOICE_INTAKE) {
      expect(q.prompt.en.length).toBeGreaterThan(3);
      expect(q.prompt.sw.length).toBeGreaterThan(3);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
    }
    // role first, contact last — matches the assistant's gather order
    expect(VOICE_INTAKE[0].id).toBe("role");
    expect(VOICE_INTAKE[VOICE_INTAKE.length - 1].id).toBe("contact");
  });

  it("buildTranscript pairs each answered question with its prompt, skips blanks", () => {
    const t = buildTranscript({ role: "Mhandisi wa programu", skills: "React, Node", education: "  " }, "sw");
    expect(t).toContain("Unalenga kazi au nafasi gani?");
    expect(t).toContain("Mhandisi wa programu");
    expect(t).toContain("React, Node");
    expect(t).not.toContain("Ulisoma nini"); // blank answer dropped
  });

  it("buildTranscript is empty when nothing was answered", () => {
    expect(buildTranscript({}, "en")).toBe("");
  });
});
