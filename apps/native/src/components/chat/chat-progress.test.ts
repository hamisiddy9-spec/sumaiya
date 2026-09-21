import { buildTurnSteps, charCountLabel, currentStep, fileDetail, finishedSteps, receiptLabel } from "./chat-progress";

describe("the progress rail's model (§3.3)", () => {
  it("names the steps it has not run yet instead of faking them", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true });
    expect(steps.map((s) => s.id)).toEqual(["received", "think"]);
    expect(steps.map((s) => s.state)).toEqual(["done", "current"]);
  });

  it("never has more than one current step, and everything before it is done", () => {
    const cases = [
      { received: true, awaiting: true },
      { received: true, awaiting: false, answering: true },
      { received: true, awaiting: false, answering: false, files: [{ name: "a.pdf" }] },
      { received: true, awaiting: false, answering: true, outcome: "ok" as const },
    ];
    for (const c of cases) {
      const steps = buildTurnSteps(c);
      expect(steps.filter((s) => s.state === "current").length).toBeLessThanOrEqual(1);
      const firstPendingOrCurrent = steps.findIndex((s) => s.state !== "done");
      for (let i = firstPendingOrCurrent + 1; i < steps.length && firstPendingOrCurrent >= 0; i++) {
        expect(steps[i].state).not.toBe("done");
      }
    }
  });

  it("caps the rail at four rows", () => {
    const steps = buildTurnSteps({
      received: true,
      awaiting: false,
      answering: true,
      files: [{ name: "cv.pdf", chars: 2340 }],
      outcome: "ok",
    });
    expect(steps.length).toBeLessThanOrEqual(4);
    expect(steps.map((s) => s.id)).toEqual(["received", "read", "think", "answer"]);
  });

  it("reports the file's real count, and the real reason when it failed", () => {
    expect(charCountLabel(2340)).toBe("herufi 2,340");
    expect(charCountLabel(0)).toBe("herufi 0");
    expect(fileDetail({ chars: 1204 })).toBe("herufi 1,204");
    expect(fileDetail({ error: "PDF hii ni picha ya ukurasa" })).toBe("PDF hii ni picha ya ukurasa");
    expect(fileDetail({})).toBeUndefined();

    const ok = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 1204 }] });
    expect(ok.find((s) => s.id === "read")?.state).toBe("done");
    expect(ok.find((s) => s.id === "read")?.detail).toBe("herufi 1,204");

    const failed = buildTurnSteps({
      received: true,
      awaiting: true,
      files: [{ name: "cv.pdf", error: "Sikuweza kutoa maneno" }],
    });
    expect(failed.find((s) => s.id === "read")?.state).toBe("failed");
    expect(failed.find((s) => s.id === "read")?.detail).toBe("Sikuweza kutoa maneno");
  });

  it("ends the run at a failed read instead of pretending to think on", () => {
    const steps = buildTurnSteps({
      received: true,
      awaiting: true,
      files: [{ name: "cv.pdf", error: "haikuwa maandishi" }],
    });
    expect(steps.map((s) => s.id)).toEqual(["received", "read"]);
    expect(steps.some((s) => s.id === "think")).toBe(false);
  });

  it("counts only the steps that really ran, and the bar follows it", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 10 }] });
    expect(finishedSteps(steps)).toBe(2);
    expect(currentStep(steps)?.id).toBe("think");
    expect(receiptLabel(steps)).toBe("Nilifanya hivi: hatua 2");
  });

  it("ends on a terminal state — no rail that forgets to stop", () => {
    const ok = buildTurnSteps({ received: true, awaiting: false, answering: true, outcome: "ok" });
    expect(currentStep(ok)).toBeUndefined();
    expect(ok.every((s) => s.state === "done")).toBe(true);

    const failed = buildTurnSteps({ received: true, awaiting: false, answering: false, outcome: "failed" });
    expect(currentStep(failed)).toBeUndefined();
    expect(failed.some((s) => s.state === "failed")).toBe(true);
  });
});
