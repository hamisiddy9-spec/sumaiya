// Provenance — "where did this line come from?" (system blueprint H8).
//
// The positioning line is "AI haibuni" (the AI doesn't invent). Provenance
// makes that visible: every span of text the AI touched carries a source, the
// editor renders it as a small chip, and unconfirmed AI spans block "export as
// final" until the user has seen them.
//
// This module is pure — types, the localized chip label, and the rules for
// "is this document safe to present as final". Writing rows to the `provenance`
// table happens in lib/assistant/run-tool.ts (a write tool cannot commit
// without them). Diffing already lives in lib/document-diff.ts.

export type SourceKind =
  | "user_written" // the user typed it
  | "user_dictated" // came from voice intake, transcribed
  | "ai_tightened" // the user's own words, rephrased — no new facts
  | "ai_from_evidence" // drawn from a verified Career Spine fact
  | "ai_suggested" // AI proposed it; needs the user to confirm it's true
  | "imported"; // parsed from an uploaded CV

export interface ProvenanceSpan {
  fieldPath: string;
  spanStart: number;
  spanEnd: number;
  sourceKind: SourceKind;
  sourceRef: string;
  confirmedAt: string | null;
}

/** Which source kinds represent AI-originated content the user should review. */
const AI_KINDS: ReadonlySet<SourceKind> = new Set<SourceKind>([
  "ai_tightened",
  "ai_from_evidence",
  "ai_suggested",
]);

/** Which kinds assert a *new fact* and therefore need explicit confirmation. */
const NEEDS_CONFIRM: ReadonlySet<SourceKind> = new Set<SourceKind>([
  "ai_suggested",
]);

export function isAiSource(kind: SourceKind): boolean {
  return AI_KINDS.has(kind);
}

export function needsConfirmation(span: ProvenanceSpan): boolean {
  return NEEDS_CONFIRM.has(span.sourceKind) && !span.confirmedAt;
}

/**
 * A document is "safe to present as final" (export without the draft
 * watermark, share publicly, attach to an application) only when no span still
 * needs confirmation. AI-tightened wording does NOT block — only unconfirmed
 * new-fact claims do.
 */
export function readyForFinal(spans: ProvenanceSpan[]): boolean {
  return !spans.some(needsConfirmation);
}

export function unconfirmedCount(spans: ProvenanceSpan[]): number {
  return spans.filter(needsConfirmation).length;
}

/** Short label for the source chip, bilingual. */
export function sourceLabel(kind: SourceKind, sw: boolean): string {
  const en: Record<SourceKind, string> = {
    user_written: "your words",
    user_dictated: "you said this",
    ai_tightened: "your words, tightened",
    ai_from_evidence: "from your profile",
    ai_suggested: "confirm this is true",
    imported: "from your uploaded CV",
  };
  const swh: Record<SourceKind, string> = {
    user_written: "maneno yako",
    user_dictated: "ulisema haya",
    ai_tightened: "maneno yako, yameboreshwa",
    ai_from_evidence: "kutoka wasifu wako",
    ai_suggested: "thibitisha ni kweli",
    imported: "kutoka CV uliyopakia",
  };
  return (sw ? swh : en)[kind];
}

/** Chip visual tone — the UI maps this to a colour token. */
export function sourceTone(
  kind: SourceKind,
): "neutral" | "info" | "action" {
  if (kind === "ai_suggested") return "action"; // ember — needs attention
  if (isAiSource(kind)) return "info"; // pine — AI, but grounded
  return "neutral"; // sand — the user's own
}

export interface NewProvenanceRow {
  userId: string;
  docType: string;
  docId: string;
  fieldPath: string;
  spanStart: number;
  spanEnd: number;
  sourceKind: SourceKind;
  sourceRef?: string;
  invocationId?: string;
  /** user-written / dictated / imported spans are self-evidently confirmed */
  confirmedAt?: Date | null;
}

/** Build the row payload, applying the "self-evident spans are confirmed" rule. */
export function buildProvenanceRow(
  input: NewProvenanceRow,
): NewProvenanceRow & { confirmedAt: Date | null } {
  const selfEvident =
    input.sourceKind === "user_written" ||
    input.sourceKind === "user_dictated" ||
    input.sourceKind === "imported" ||
    input.sourceKind === "ai_tightened";
  return {
    ...input,
    sourceRef: input.sourceRef ?? "",
    confirmedAt:
      input.confirmedAt ?? (selfEvident ? new Date() : null),
  };
}
