import {
  buildTurnSteps,
  charCountLabel,
  currentStep,
  fileDetail,
  finishedSteps,
  RAIL_HEADER,
  RAIL_STOP_MIN_DP,
  receiptLabel,
  stepRowTone,
  stepStateChip,
  turnEndingOf,
  writtenCountLabel,
} from "./chat-progress";

describe("the progress rail's model (§3.3 + §9's vocabulary)", () => {
  it("names the steps it has not run yet instead of faking them", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true });
    expect(steps.map((s) => s.id)).toEqual(["write", "deliver"]);
    expect(steps.map((s) => s.state)).toEqual(["current", "pending"]);
  });

  it("never has more than one current step, and everything before it is done", () => {
    const cases = [
      { received: true, awaiting: true },
      { received: true, awaiting: false, answering: true },
      { received: true, awaiting: false, answering: false, files: [{ name: "a.pdf" }] },
      { received: true, awaiting: false, answering: true, outcome: "ok" as const },
      { received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 1204 }] },
      { received: true, awaiting: false, answering: false, outcome: "stopped" as const, files: [{ name: "cv.pdf", chars: 12 }] },
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
    expect(steps.map((s) => s.id)).toEqual(["read", "write", "match", "deliver"]);
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
    expect(steps.map((s) => s.id)).toEqual(["read"]);
    expect(steps.some((s) => s.id === "write")).toBe(false);
  });

  it("counts only the steps that really ran, and the bar follows it", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", chars: 10 }] });
    expect(finishedSteps(steps)).toBe(1);
    expect(currentStep(steps)?.id).toBe("write");
    expect(receiptLabel(steps)).toBe("Nilifanya hivi: hatua 1");
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

/**
 * §9's own content, asserted word for word. The guide adopts Stitch's layout,
 * hierarchy and copy, so the rail's vocabulary and its state chips are not a
 * matter of taste — and a later edit that drifts back to a generic
 * ("I'm thinking about your request") vocabulary fails here.
 */
describe("§9's vocabulary, row for row", () => {
  const label = (c: Parameters<typeof buildTurnSteps>[0], id: string) =>
    buildTurnSteps(c).find((s) => s.id === id)?.label;

  it("writes the CV, matches it to the advert, prepares the letter", () => {
    const c = { received: true, awaiting: true, files: [{ name: "tangazo.pdf", chars: 900 }] };
    expect(label(c, "write")).toEqual({ en: "Writing your CV", sw: "Kuandika CV yako" });
    expect(label(c, "match")).toEqual({ en: "Matching it to the advert", sw: "Kuilinganisha na tangazo" });
    expect(label(c, "deliver")).toEqual({ en: "Preparing your cover letter", sw: "Kuandaa barua ya maombi" });
  });

  it("keeps the file row the design has no row for, with its real count", () => {
    const c = { received: true, awaiting: true, files: [{ name: "tangazo.pdf", chars: 900 }] };
    const read = buildTurnSteps(c).find((s) => s.id === "read");
    expect(read?.label.sw).toBe("Ninasoma faili yako");
    expect(read?.detail).toBe("herufi 900");
  });

  it("names a match against an advert only when there IS one", () => {
    const withFile = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "tangazo.pdf" }] });
    expect(withFile.some((s) => s.id === "match")).toBe(true);
    const withoutFile = buildTurnSteps({ received: true, awaiting: true });
    expect(withoutFile.some((s) => s.id === "match")).toBe(false);
  });

  it("prints §9's own sub-line, and only from a count somebody really has", () => {
    expect(writtenCountLabel(2340)).toBe("herufi 2,340 zimekamilika");

    const counted = buildTurnSteps({ received: true, awaiting: false, answering: true, outcome: "ok", writtenChars: 2340 });
    expect(counted.find((s) => s.id === "write")?.detail).toBe("herufi 2,340 zimekamilika");

    // No count reported → no number. Never a placeholder, never an estimate.
    const uncounted = buildTurnSteps({ received: true, awaiting: false, answering: true, outcome: "ok" });
    expect(uncounted.find((s) => s.id === "write")?.detail).toBeUndefined();
  });

  it("carries the design's state chips, and a real failure is never softened", () => {
    expect(stepStateChip("done")).toEqual({ en: "READY", sw: "TAYARI" });
    expect(stepStateChip("current")).toEqual({ en: "CHECKING", sw: "INAKAGUA" });
    expect(stepStateChip("pending")).toEqual({ en: "LATER", sw: "BAADAYE" });
    expect(stepStateChip("failed").sw).not.toBe("BAADAYE");

    const failedRead = buildTurnSteps({ received: true, awaiting: true, files: [{ name: "cv.pdf", error: "si maandishi" }] });
    expect(stepStateChip(failedRead[0].state).sw).toBe("IMESHINDIKANA");
  });

  it("gives every state its own row wash (§9's three, plus the failure)", () => {
    expect(stepRowTone("done")).toBe("well");
    expect(stepRowTone("current")).toBe("tint");
    expect(stepRowTone("pending")).toBe("plain");
    expect(stepRowTone("failed")).toBe("error");
  });

  it("never marks the CV written while the request is still out", () => {
    const steps = buildTurnSteps({ received: true, awaiting: true });
    expect(steps.find((s) => s.id === "write")?.state).toBe("current");
    expect(finishedSteps(steps)).toBe(0);
  });

  it("says what is happening, in the design's own sentence, and keeps `Acha` at the §8 floor", () => {
    expect(RAIL_HEADER.sw).toBe("Sumaiya anaandika…");
    expect(RAIL_HEADER.en).not.toBe(RAIL_HEADER.sw);
    // §8: no tap target below 44 dp — the stop control is the smallest one the
    // design allows, and it is never smaller than the floor.
    expect(RAIL_STOP_MIN_DP).toBeGreaterThanOrEqual(44);
  });
});

/**
 * REGRESSION — the rail must not lie (device defect, 1.6.25, 2026-09-21).
 *
 * Both replies below are quoted VERBATIM off the screen
 * (docs/QA-NATIVE-1625-2026-09-21.md §2.4). The user asked for a CV summary and
 * got a menu; the rail still printed `✓ Hii hapa jibu lako`. The old rail
 * emitted that string for ANY turn that returned a reply, so the first test here
 * fails on the old behaviour by construction: with these replies the finished
 * row's label was exactly "Hii hapa jibu lako" / "Here's your answer".
 */
const DEFLECTION_FRESH =
  "Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili — tuchukue hatua inayofuata: naweza kukagua CV yako, kuilinganisha na kazi unayoitaka, au kutengeneza hati mpya. Ni ipi?";

const DEFLECTION_REPEAT =
  "Umekwisha niambia hivyo, asante! Hebu tuende hatua inayofuata — gusa hapa chini: ukaguzi wa CV, linganisha kazi, au tengeneza hati. Tutafanya nini kwanza?";

const REAL_SUMMARY =
  "Muhtasari wa CV yako: Msaidizi wa huduma kwa mteja mwenye uzoefu wa miaka mitatu katika " +
  "mapokezi, kushughulikia malalamiko na kuhudumia wateja kwa heshima. Nimezoea kufanya kazi " +
  "kwa mfumo wa kompyuta na kutunza rekodi za wateja kwa usahihi.";

describe("the rail never claims an answer it did not receive", () => {
  it("classifies the two measured deflections as QUESTIONS", () => {
    expect(turnEndingOf(DEFLECTION_FRESH)).toBe("question");
    expect(turnEndingOf(DEFLECTION_REPEAT)).toBe("question");
  });

  it("classifies a real written summary as an ANSWER", () => {
    expect(turnEndingOf(REAL_SUMMARY)).toBe("answer");
    expect(turnEndingOf("- Msaidizi wa huduma kwa mteja\n- Kutunza rekodi za wateja\n- Mapokezi")).toBe("answer");
  });

  it("a bare acknowledgement is neither — and is never dressed up as an answer", () => {
    expect(turnEndingOf("Asante, nimekuelewa.")).toBe("other");
    expect(turnEndingOf("")).toBe("other");
  });

  it.each<(["sw" | "en", string])>([
    ["sw", "Hii hapa jibu lako"],
    ["en", "Here's your answer"],
  ])("does NOT print \"%s\" for a turn whose reply only asks a question", (lang, answerLabel) => {
    for (const reply of [DEFLECTION_FRESH, DEFLECTION_REPEAT]) {
      const steps = buildTurnSteps({
        received: true,
        awaiting: false,
        answering: true,
        outcome: "ok",
        ending: turnEndingOf(reply),
      });
      const last = steps[steps.length - 1];
      expect(last.id).toBe("deliver");
      expect(last.state).toBe("done");
      expect(last.label[lang]).not.toBe(answerLabel);
      expect(last.label.sw).toBe("Nimekuuliza kitu");
      expect(last.label.en).toBe("I've asked you something");
    }
  });

  it("DOES print it when the reply really carries the deliverable", () => {
    const steps = buildTurnSteps({
      received: true,
      awaiting: false,
      answering: true,
      outcome: "ok",
      ending: turnEndingOf(REAL_SUMMARY),
    });
    expect(steps[steps.length - 1].label.sw).toBe("Hii hapa jibu lako");
    expect(steps[steps.length - 1].label.en).toBe("Here's your answer");
  });

  it("makes no answer claim when the caller never reported how the reply read", () => {
    const steps = buildTurnSteps({ received: true, awaiting: false, answering: true, outcome: "ok" });
    expect(steps[steps.length - 1].label.sw).toBe("Nimejibu");
  });

  it("does not name the letter as written when the turn asked a question instead", () => {
    const steps = buildTurnSteps({
      received: true,
      awaiting: false,
      answering: true,
      outcome: "ok",
      ending: "question",
    });
    // The plan's own words are gone the moment the turn ends without one.
    expect(steps.some((s) => s.label.sw === "Kuandaa barua ya maombi")).toBe(false);
  });
});
