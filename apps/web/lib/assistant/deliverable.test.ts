import { describe, expect, it } from "vitest";
import {
  classifyTurnEnding,
  replyCarriesDeliverable,
  replyIsQuestionOrOfferOnly,
  requestedDeliverable,
} from "./deliverable";

/**
 * The two replies below are quoted VERBATIM from the live device run
 * (native 1.6.25, docs/QA-NATIVE-1625-2026-09-21.md §2.4). They are the
 * evidence for this module: a request for a CV summary was answered with a
 * menu, and the progress rail still printed "✓ Hii hapa jibu lako".
 */
const DEFLECTION_REPEAT_VARIANT =
  "Umekwisha niambia hivyo, asante! Hebu tuende hatua inayofuata — gusa hapa chini: ukaguzi wa CV, linganisha kazi, au tengeneza hati. Tutafanya nini kwanza?";

const DEFLECTION_FRESH =
  "Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili — tuchukue hatua inayofuata: naweza kukagua CV yako, kuilinganisha na kazi unayoitaka, au kutengeneza hati mpya. Ni ipi?";

describe("requestedDeliverable", () => {
  it("the exact request from the device run is a summary request", () => {
    expect(requestedDeliverable("Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja.")).toBe("summary");
  });

  it("holds for every deliverable type, not just the one that was caught", () => {
    expect(requestedDeliverable("Nisaidie kuandika barua ya maombi ya kazi ya udereva")).toBe("cover-letter");
    expect(requestedDeliverable("Can you write me a cover letter for this job?")).toBe("cover-letter");
    expect(requestedDeliverable("Niandikie ujumbe mfupi kwa mwajiri kuhusu kazi hii")).toBe("message");
    expect(requestedDeliverable("Nisaidie kuandika kuhusu mimi kwa muhtasari wa CV")).toBe("summary");
    expect(requestedDeliverable("Nijenge uzoefu wangu vizuri kwenye CV")).toBe("experience");
    expect(requestedDeliverable("Help me write my skills section")).toBe("skills");
    expect(requestedDeliverable("Write me a professional summary in English")).toBe("summary");
    expect(requestedDeliverable("niandikie barua rasmi ya kuomba likizo")).toBe("letter");
  });

  it("does NOT fire on smalltalk or a passing mention", () => {
    expect(requestedDeliverable("Nimeona kazi ya mauzo nikiwa sokoni")).toBeNull();
    expect(requestedDeliverable("Nimepata barua kutoka kwa mwajiri")).toBeNull();
    expect(requestedDeliverable("Habari ya asubuhi")).toBeNull();
    expect(requestedDeliverable("Vipi matokeo ya mpira jana?")).toBeNull();
    expect(requestedDeliverable("asante")).toBeNull();
  });
});

describe("replyCarriesDeliverable — the defect detectors", () => {
  it("the two measured deflections carry NO deliverable", () => {
    expect(replyCarriesDeliverable(DEFLECTION_FRESH)).toBe(false);
    expect(replyCarriesDeliverable(DEFLECTION_REPEAT_VARIANT)).toBe(false);
  });

  it("the two measured deflections are the question/offer shape", () => {
    expect(replyIsQuestionOrOfferOnly(DEFLECTION_FRESH)).toBe(true);
    expect(replyIsQuestionOrOfferOnly(DEFLECTION_REPEAT_VARIANT)).toBe(true);
  });

  it("a real written summary DOES carry one", () => {
    const summary =
      "Muhtasari wa CV yako: Msaidizi wa huduma kwa mteja mwenye uzoefu wa miaka mitatu " +
      "katika mapokezi, kushughulikia malalamiko na kuhudumia wateja kwa heshima. " +
      "Nimezoea kufanya kazi kwa mfumo wa kompyuta na kutunza rekodi za wateja kwa usahihi. " +
      "Natafuta nafasi ya kuhudumia wateja ambapo naweza kuongeza kuridhika kwa wateja. " +
      "Ni ipi inayofuata?";
    expect(replyCarriesDeliverable(summary)).toBe(true);
  });

  it("a question-only reply with a long-ish ack is still not an answer", () => {
    const reply =
      "Nimekuelewa. Hebu tuangalie hatua inayofuata pamoja. " +
      "Unaweza kuchagua mojawapo ya haya: kagua CV yako, linganisha na kazi, au tengeneza hati mpya. " +
      "Ni ipi unayoanza nayo leo?";
    expect(replyCarriesDeliverable(reply)).toBe(false);
    expect(classifyTurnEnding(reply)).toBe("question");
  });

  it("a bare acknowledgement is 'other', never reported as an answer", () => {
    expect(classifyTurnEnding("Karibu!")).toBe("other");
    expect(classifyTurnEnding("Asante, nimekuelewa.")).toBe("other");
    expect(classifyTurnEnding("")).toBe("other");
  });

  it("classifyTurnEnding says 'answer' only when a deliverable is present", () => {
    expect(classifyTurnEnding(DEFLECTION_FRESH)).toBe("question");
    expect(
      classifyTurnEnding(
        "Muhtasari wa CV yako: mtu mwenye nidhamu, uzoefu wa miaka miwili katika mauzo ya " +
          "duka la nguo, na uwezo wa kuhudumia wateja kwa subira na heshima. Nimeongeza " +
          "utunzaji wa kumbukumbu na matumizi ya kompyuta katika kazi zangu za nyuma.",
      ),
    ).toBe("answer");
  });
});
