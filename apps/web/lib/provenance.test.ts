import { describe, expect, it } from "vitest";
import {
  isAiSource,
  needsConfirmation,
  readyForFinal,
  unconfirmedCount,
  sourceLabel,
  sourceTone,
  buildProvenanceRow,
  type ProvenanceSpan,
} from "./provenance";

const span = (over: Partial<ProvenanceSpan>): ProvenanceSpan => ({
  fieldPath: "summary",
  spanStart: 0,
  spanEnd: 10,
  sourceKind: "user_written",
  sourceRef: "",
  confirmedAt: null,
  ...over,
});

describe("provenance rules", () => {
  it("classifies AI vs user sources", () => {
    expect(isAiSource("user_written")).toBe(false);
    expect(isAiSource("imported")).toBe(false);
    expect(isAiSource("ai_tightened")).toBe(true);
    expect(isAiSource("ai_from_evidence")).toBe(true);
    expect(isAiSource("ai_suggested")).toBe(true);
  });

  it("only unconfirmed new-fact claims need confirmation", () => {
    expect(needsConfirmation(span({ sourceKind: "ai_suggested" }))).toBe(true);
    expect(
      needsConfirmation(
        span({ sourceKind: "ai_suggested", confirmedAt: "2026-09-08" }),
      ),
    ).toBe(false);
    // tightened wording never blocks
    expect(needsConfirmation(span({ sourceKind: "ai_tightened" }))).toBe(false);
    expect(needsConfirmation(span({ sourceKind: "ai_from_evidence" }))).toBe(false);
  });

  it("readyForFinal is false while any span needs confirmation", () => {
    const spans = [
      span({ sourceKind: "user_written" }),
      span({ sourceKind: "ai_tightened" }),
      span({ sourceKind: "ai_suggested" }),
    ];
    expect(readyForFinal(spans)).toBe(false);
    expect(unconfirmedCount(spans)).toBe(1);

    spans[2] = span({ sourceKind: "ai_suggested", confirmedAt: "2026-09-08" });
    expect(readyForFinal(spans)).toBe(true);
    expect(unconfirmedCount(spans)).toBe(0);
  });

  it("gives a bilingual label and a tone for every kind", () => {
    const kinds = [
      "user_written",
      "user_dictated",
      "ai_tightened",
      "ai_from_evidence",
      "ai_suggested",
      "imported",
    ] as const;
    for (const k of kinds) {
      expect(sourceLabel(k, false)).toBeTruthy();
      expect(sourceLabel(k, true)).toBeTruthy();
      expect(sourceLabel(k, false)).not.toBe(sourceLabel(k, true));
      expect(["neutral", "info", "action"]).toContain(sourceTone(k));
    }
    expect(sourceTone("ai_suggested")).toBe("action");
    expect(sourceTone("user_written")).toBe("neutral");
  });

  it("buildProvenanceRow auto-confirms self-evident spans, not AI claims", () => {
    expect(
      buildProvenanceRow({
        userId: "u1",
        docType: "cv",
        docId: "c1",
        fieldPath: "summary",
        spanStart: 0,
        spanEnd: 5,
        sourceKind: "user_written",
      }).confirmedAt,
    ).toBeInstanceOf(Date);

    expect(
      buildProvenanceRow({
        userId: "u1",
        docType: "cv",
        docId: "c1",
        fieldPath: "summary",
        spanStart: 0,
        spanEnd: 5,
        sourceKind: "ai_suggested",
      }).confirmedAt,
    ).toBeNull();
  });
});
