import { signalAction } from "./signal-actions";
import type { MobileSignal } from "@sumaiya/api-client";

function sig(overrides: Partial<MobileSignal> = {}): MobileSignal {
  return {
    type: "career.skillGap",
    tool: "career.skillGap",
    priority: 50,
    title: { en: "t", sw: "t" },
    detail: { en: "d", sw: "d" },
    trigger: "x",
    ...overrides,
  };
}

describe("signalAction — career.skillGap", () => {
  it("names the specific missing skill via the Learning Hub's own catalogue label when it matches", () => {
    const act = signalAction(sig({ missingSkills: ["excel"] }));
    expect(act.cta.en).toBe("Learn Microsoft Excel");
    expect(act.target.screen).toBe("LearningHub");
  });

  it("falls back to a capitalised raw keyword when nothing in the curated catalogue covers it", () => {
    const act = signalAction(sig({ missingSkills: ["some-niche-tool"] }));
    expect(act.cta.en).toBe("Learn Some-niche-tool");
  });

  it("stays generic when the signal carries no missing skills", () => {
    const act = signalAction(sig({ missingSkills: undefined }));
    expect(act.cta.en).toBe("See what to learn");
  });
});
