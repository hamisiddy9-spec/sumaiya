// provenance-write — the server side of blueprint H8.
//
// lib/provenance.ts is pure (types + rules + the chip's label/tone). This module
// writes `provenance` rows. A run-tool executor that changes a document returns
// ProvenanceSpan[]; run-tool (or a route) calls writeProvenance() so every
// AI-touched span has a source on record, and the editor can render the chip and
// the "revert to my words" control.
//
// Best-effort: a failed provenance write must never break the edit it describes
// (the edit is still shown as a preview the user accepts). But an executor that
// *commits* to a document should await this and treat a failure as a hard error.

import "server-only";
import { nanoid } from "nanoid";
import { db, provenance } from "@/lib/db";
import { buildProvenanceRow, type NewProvenanceRow, type ProvenanceSpan } from "@/lib/provenance";

export interface DocRef {
  userId: string;
  /** cv | cover_letter | letter | business_card | career_profile */
  docType: string;
  docId: string;
}

/**
 * Persist provenance for a set of spans against one document.
 * Returns the number of rows written (0 on a swallowed failure).
 */
export async function writeProvenance(
  doc: DocRef,
  spans: ProvenanceSpanInput[],
  invocationId?: string,
): Promise<number> {
  if (!spans.length) return 0;
  try {
    const rows = spans.map((s) => {
      const built = buildProvenanceRow({
        userId: doc.userId,
        docType: doc.docType,
        docId: doc.docId,
        fieldPath: s.fieldPath,
        spanStart: s.spanStart ?? 0,
        spanEnd: s.spanEnd ?? 0,
        sourceKind: s.sourceKind,
        sourceRef: s.sourceRef,
        invocationId,
      } satisfies NewProvenanceRow);
      return {
        id: nanoid(),
        userId: built.userId,
        docType: built.docType,
        docId: built.docId,
        fieldPath: built.fieldPath,
        spanStart: built.spanStart,
        spanEnd: built.spanEnd,
        sourceKind: built.sourceKind,
        sourceRef: built.sourceRef ?? "",
        invocationId: invocationId ?? null,
        confirmedAt: built.confirmedAt,
      };
    });
    await db.insert(provenance).values(rows);
    return rows.length;
  } catch (err) {
    console.error("[provenance] write failed (swallowed):", err);
    return 0;
  }
}

export interface ProvenanceSpanInput {
  fieldPath: string;
  spanStart?: number;
  spanEnd?: number;
  sourceKind: ProvenanceSpan["sourceKind"];
  sourceRef?: string;
}

/**
 * Read the current provenance for a document — the editor uses this to render
 * source chips and to decide `readyForFinal`.
 */
export async function readProvenance(
  docType: string,
  docId: string,
): Promise<ProvenanceSpan[]> {
  try {
    const { eq, and } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(provenance)
      .where(and(eq(provenance.docType, docType), eq(provenance.docId, docId)));
    return rows.map((r) => ({
      fieldPath: r.fieldPath,
      spanStart: r.spanStart,
      spanEnd: r.spanEnd,
      sourceKind: r.sourceKind as ProvenanceSpan["sourceKind"],
      sourceRef: r.sourceRef,
      confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    }));
  } catch (err) {
    console.error("[provenance] read failed (swallowed):", err);
    return [];
  }
}

/**
 * Mark a span confirmed (the user tapped "yes, that's true" on an ai_suggested
 * span). Idempotent.
 */
export async function confirmProvenance(id: string, userId: string): Promise<boolean> {
  try {
    const { eq, and } = await import("drizzle-orm");
    await db
      .update(provenance)
      .set({ confirmedAt: new Date() })
      .where(and(eq(provenance.id, id), eq(provenance.userId, userId)));
    return true;
  } catch (err) {
    console.error("[provenance] confirm failed:", err);
    return false;
  }
}
