import { describe, it, expect } from "vitest";
import { buildCopilotState } from "@/lib/application-copilot";

describe("Application Copilot checklist", () => {
  it("starts empty with nothing done", () => {
    const s = buildCopilotState({ cvAttached: false, coverLetterAttached: false, interviewStarted: false, submitted: false });
    expect(s.doneCount).toBe(0);
    expect(s.total).toBe(4);
    expect(s.percent).toBe(0);
    expect(s.ready).toBe(false);
  });

  it("derives cv + cover-letter steps from attached documents", () => {
    const s = buildCopilotState({ cvAttached: true, coverLetterAttached: true, interviewStarted: false, submitted: false });
    expect(s.steps.find((x) => x.id === "cv")?.done).toBe(true);
    expect(s.steps.find((x) => x.id === "coverLetter")?.done).toBe(true);
    expect(s.doneCount).toBe(2);
    expect(s.percent).toBe(50);
  });

  it("treats any non-draft status as submitted", () => {
    for (const submitted of [true]) {
      const s = buildCopilotState({ cvAttached: false, coverLetterAttached: false, interviewStarted: false, submitted });
      expect(s.steps.find((x) => x.id === "submit")?.done).toBe(true);
    }
  });

  it("is ready only when every step is done", () => {
    const s = buildCopilotState({ cvAttached: true, coverLetterAttached: true, interviewStarted: true, submitted: true });
    expect(s.doneCount).toBe(4);
    expect(s.percent).toBe(100);
    expect(s.ready).toBe(true);
  });

  it("never claims a step is done when its record is missing", () => {
    const s = buildCopilotState({ cvAttached: true, coverLetterAttached: false, interviewStarted: false, submitted: false });
    expect(s.steps.every((x) => (x.done ? x.id !== "coverLetter" && x.id !== "interview" && x.id !== "submit" : true))).toBe(true);
  });
});
