// Snap-to-Apply (D3) — PDF export helpers (pure, deterministic).
//
// From the tailored result the user can take the CV and cover letter with them
// as PDFs (lib/pdf.ts exportElementToPdf — incl. the iOS share-sheet / new-tab
// mobile path). These helpers build safe, human-readable file names from the
// REAL job title — never fabricated: an empty/absent title simply drops the
// job part instead of inventing one.

/** Characters that are unsafe in file names across OSes / download headers. */
const UNSAFE = /[\\/:*?"<>|\u0000-\u001f]/g;
const MAX_PART = 60;

/**
 * Turn a job title (or any free-text part) into a safe filename fragment:
 * trimmed, single-spaced, unsafe chars removed, length-capped. Returns "" for
 * empty input so callers can drop the part entirely.
 */
export function sanitizeFilenamePart(input: string | undefined | null): string {
  const cleaned = (input ?? "")
    .replace(UNSAFE, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, MAX_PART).trim();
}

/**
 * Deterministic PDF file name for a snap export, e.g.
 *   kind="cv",     title="Sales Manager"  → "Tailored_CV_Sales_Manager.pdf"
 *   kind="letter", title=""               → "Cover_Letter.pdf"
 * Localized prefixes (sw/en) so the file the user keeps speaks their language.
 */
export function snapExportFilename(
  kind: "cv" | "letter",
  jobTitle: string | undefined,
  sw: boolean,
): string {
  const base =
    kind === "cv"
      ? sw
        ? "CV_Lengwa"
        : "Tailored_CV"
      : sw
        ? "Barua_ya_Maombi"
        : "Cover_Letter";
  const part = sanitizeFilenamePart(jobTitle);
  return part ? `${base}_${part.replace(/ /g, "_")}.pdf` : `${base}.pdf`;
}
