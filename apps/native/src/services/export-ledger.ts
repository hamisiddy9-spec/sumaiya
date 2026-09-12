/**
 * Export reporting for the native app.
 *
 * The app prints PDFs locally (expo-print) and hands them to the OS share
 * sheet, so an export never touched the server: `download_log` only ever held
 * rows written by the web editor, and Sumaiya's library block could not see
 * that a letter or a CV had actually left the phone.
 *
 * This reports the export after the fact. Two rules:
 *   • Fire-and-forget. The user already has their file; a bookkeeping failure
 *     must never surface as an error, delay the share sheet, or change what
 *     they see.
 *   • Report what is true. The call sites report the document that was
 *     generated, with the same title the file was given, so the ledger and the
 *     filename agree.
 */
import { apiClient } from "../lib/api-client";

export type NativeExportKind = "cv" | "cover-letter" | "letter" | "business-card";

/**
 * Record one export. Never throws, never awaits a result the caller needs —
 * `void` it, or await it if you want the report to land before the screen
 * unmounts (it is a single small POST either way).
 */
export async function reportExport(input: {
  documentType: NativeExportKind;
  /** The stored row's id, when the document has one. Omitted for a letter
   *  built on demand by /apply, which the server keys by a minted id. */
  documentId?: string | null;
  /** Human name of the document, matching the exported file's name. */
  title?: string | null;
}): Promise<void> {
  try {
    await apiClient.recordExport({
      documentType: input.documentType,
      ...(input.documentId ? { documentId: input.documentId } : {}),
      ...(input.title ? { title: input.title } : {}),
      format: "pdf",
    });
  } catch {
    // Silent on purpose — see the module comment. Telemetry-grade concern.
  }
}
