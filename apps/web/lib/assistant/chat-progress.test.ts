import { describe, expect, it } from "vitest";

import { charCountLabel } from "./chat-motion";
import { buildTurnSteps, currentStep, finishedSteps, receiptLabel } from "./chat-progress";

// The real grouping helper, not a stub: the count a user reads must be the same
// one both platforms print (`herufi 1,204`).
const chars = charCountLabel;

describe("the web progress rail's model (§3.3)", () => {
  it("names the steps it has not run yet instead of faking them", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true }, chars);
    expect(steps.map((s) => s.id)).toEqual(["received", "think"]);
    expect(steps.map((s) => s.state)).toEqual(["done", "current"]);
  });

  it("never has more than one current step, and nothing done comes after it", () => {
    const cases = [
      { received: true, awaiting: true },
      { received: true, awaiting: false, answering: true },
      { received: true, awaiting: false, answering: false, files: [{ name: "a.pdf" }] },
      { received: true, awaiting: false, answering: true, outcome: "ok" as const },
    ];
    for (const c of cases) {
      const steps = buildTurnSteps(c, chars);
      expect(steps.filter((s) => s.state === "current").length).toBeLessThanOrEqual(1);
      const first = steps.findIndex((s) => s.state !== "done");
      for (let i = first + 1; i < steps.length && first >= 0; i++) {
        expect(steps[i].state).not.toBe("done");
      }
    }
  });

  it("caps the rail at four rows", () => {
    const steps = buildTurnSteps(
      { received: true, awaiting: false, answering: true, files: [{ name: "cv.pdf", chars: 2340 }], outcome: "ok" },
      chars,
    );
    expect(steps.length).toBeLessThanOrEqual(4);
    expect(steps.map((s) => s.id)).toEqual(["received", "read", "think", "answer"]);
  });

  it("reports the file's real count, and the real reason when it failed", () => {
    const ok = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 1204 }] }, chars);
    expect(ok.find((s) => s.id === "read")?.state).toBe("done");
    expect(ok.find((s) => s.id === "read")?.detail).toBe("herufi 1,204");

    const failed = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", error: "Sikuweza kutoa maneno" }] }, chars);
    expect(failed.find((s) => s.id === "read")?.state).toBe("failed");
    expect(failed.map((s) => s.id)).toEqual(["received", "read"]);
  });

  it("counts only the steps that really ran", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 10 }] }, chars);
    expect(finishedSteps(steps)).toBe(2);
    expect(currentStep(steps)?.id).toBe("think");
    expect(receiptLabel(steps)).toBe("Nilifanya hivi: hatua 2");
  });

  it("ends on a terminal state — no rail that forgets to stop", () => {
    const ok = buildTurnSteps({ received: true, awaiting: false, answering: true, outcome: "ok" }, chars);
    expect(currentStep(ok)).toBeUndefined();
    const failed = buildTurnSteps({ received: true, awaiting: false, answering: false, outcome: "failed" }, chars);
    expect(currentStep(failed)).toBeUndefined();
    expect(failed.some((s) => s.state === "failed")).toBe(true);
  });
});
