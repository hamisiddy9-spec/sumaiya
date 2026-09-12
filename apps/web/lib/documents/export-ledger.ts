/**
 * The export ledger — one place that records "this document left the app".
 *
 * Background: `download_log` used to be written by a single endpoint
 * (`POST /cv/:id/download`). Cover letters, letters and business cards each
 * bumped their own `downloadCount` and wrote no ledger row at all, and the
 * native app — which is where most documents are actually exported, since it
 * prints the PDF on the device — reported nothing whatsoever. The table held
 * 18 rows, every one of them a CV.
 *
 * That matters beyond bookkeeping. The assistant's context builds the user's
 * library from these rows to answer "have you sent that letter yet?" — with
 * only CVs in the ledger it could never ask, and never knew a letter had left
 * the phone.
 *
 * Rules:
 *   • One canonical spelling per document kind. The two API surfaces disagree
 *     ("business-card" vs "businessCard", "cover-letter" vs "cover_letter"),
 *     so the boundary normalizes instead of trusting the caller.
 *   • Best-effort. Recording an export must never fail the export itself: the
 *     counter bump and the ledger insert are independent, and a ledger failure
 *     is swallowed after being logged.
 */

import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { db, downloadLog, cv, coverLetter, letter, businessCard } from "@/lib/db";

/** The four document families the app can export. */
export const EXPORT_KINDS = ["cv", "cover-letter", "letter", "business-card"] as const;

export type ExportKind = (typeof EXPORT_KINDS)[number];

/** Default ledger title when the caller has nothing better — never blank, so a
 *  row can always be rendered back to the user and to the assistant. */
export const EXPORT_DEFAULT_TITLES: Record<ExportKind, string> = {
  cv: "My CV",
  "cover-letter": "My Cover Letter",
  letter: "My Letter",
  "business-card": "My Business Card",
};

/**
 * Spellings seen in the wild (either API surface, plus the native client and a
 * couple of reasonable human typos) mapped to the canonical kind.
 */
const EXPORT_ALIASES: Record<string, ExportKind> = {
  cv: "cv",
  "cover-letter": "cover-letter",
  cover_letter: "cover-letter",
  coverletter: "cover-letter",
  letter: "letter",
  "business-card": "business-card",
  business_card: "business-card",
  businesscard: "business-card",
  card: "business-card",
};

/** Canonical kind for a caller-supplied string, or null when it is not one. */
export function normalizeExportKind(value: unknown): ExportKind | null {
  if (typeof value !== "string") return null;
  return EXPORT_ALIASES[value.trim().toLowerCase()] ?? null;
}

/**
 * Prefix for a ledger id that deliberately has no row behind it.
 *
 * The native app's cover letter (POST /mobile/apply) is built on demand and
 * never saved, so there is no document to point at. The id is minted with this
 * prefix instead of a real one, which lets the assistant tell "an export of
 * something we never stored" apart from "an export of a document that has since
 * been deleted" — the first is worth surfacing, the second would be a ghost.
 */
export const UNSTORED_EXPORT_PREFIX = "mobile:";

/** True when this ledger id refers to an export with no stored document. */
export function isUnstoredExportId(id: string): boolean {
  return typeof id === "string" && id.startsWith(UNSTORED_EXPORT_PREFIX);
}

/** A fresh ledger id for an export that has no document row. */
export function mintUnstoredExportId(): string {
  return `${UNSTORED_EXPORT_PREFIX}${nanoid(10)}`;
}

/** The ledger row's payload, with the id and title already resolved. */
export interface LedgerRow {
  id: string;
  userId: string;
  documentId: string;
  documentType: ExportKind;
  format: string;
  title: string;
}

/**
 * Build the ledger row. Pure so the shape (and the title fallback, which is the
 * part that shows up in the assistant's context) can be asserted without a DB.
 *
 * An empty or whitespace-only title falls back to the kind's default rather
 * than storing "" — a blank row would read to the user as a nameless document.
 */
export function buildLedgerRow(input: {
  userId: string;
  documentType: ExportKind;
  documentId: string;
  title?: string | null;
  format?: string | null;
  id?: string;
}): LedgerRow {
  const title = (input.title ?? "").trim();
  return {
    id: input.id ?? nanoid(),
    userId: input.userId,
    documentId: input.documentId,
    documentType: input.documentType,
    format: (input.format ?? "").trim() || "pdf",
    title: title || EXPORT_DEFAULT_TITLES[input.documentType],
  };
}

/** Which table backs each kind, for the counter bump. */
function tableFor(kind: ExportKind) {
  switch (kind) {
    case "cv":
      return cv;
    case "cover-letter":
      return coverLetter;
    case "letter":
      return letter;
    case "business-card":
      return businessCard;
  }
}

/**
 * Bump the owning document's own `download_count`, scoped to the owner so a
 * guessed id can never touch someone else's document.
 *
 * `markComplete` is opt-in because the surfaces historically disagreed: the
 * letter and business-card routes flipped `status`, while CV and cover-letter
 * did not. Preserving that exactly matters — a draft CV must not silently
 * become "complete" just because it was downloaded.
 *
 * Returns true when a row was actually updated — i.e. the document exists and
 * belongs to this user. A false here is not an error (an export of a document
 * built on the fly has no row), it just means there is no counter to move.
 */
export async function bumpDocumentExport(input: {
  userId: string;
  documentId: string;
  documentType: ExportKind;
  markComplete?: boolean;
}): Promise<boolean> {
  const table = tableFor(input.documentType);
  const patch = input.markComplete
    ? { downloadCount: sql`${table.downloadCount} + 1`, status: "complete" as const }
    : { downloadCount: sql`${table.downloadCount} + 1` };
  const updated = await db
    .update(table)
    .set(patch)
    .where(sql`${table.id} = ${input.documentId} AND ${table.userId} = ${input.userId}`)
    .returning({ id: table.id });
  return updated.length > 0;
}

/**
 * Record an export: move the counter (if the document is stored) and append to
 * the ledger (always).
 *
 * Deliberately never throws. This runs inside download endpoints whose whole
 * job is to hand the user their file; a bookkeeping failure must not turn a
 * successful download into a 500.
 */
export async function recordExport(input: {
  userId: string;
  documentId: string;
  documentType: ExportKind;
  title?: string | null;
  format?: string | null;
  markComplete?: boolean;
}): Promise<void> {
  try {
    await bumpDocumentExport(input);
  } catch (err) {
    console.error("[export-ledger] counter bump failed", err);
  }
  try {
    await db.insert(downloadLog).values(buildLedgerRow(input));
  } catch (err) {
    console.error("[export-ledger] ledger insert failed", err);
  }
}

/** Recent export rows for one user, newest first — the assistant's view. */
export async function recentExports(userId: string, limit = 20) {
  return db
    .select({
      documentId: downloadLog.documentId,
      documentType: downloadLog.documentType,
      title: downloadLog.title,
      createdAt: downloadLog.createdAt,
    })
    .from(downloadLog)
    .where(eq(downloadLog.userId, userId))
    .orderBy(sql`${downloadLog.createdAt} DESC`)
    .limit(limit);
}
