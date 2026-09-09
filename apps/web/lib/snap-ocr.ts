// Snap-to-Apply (E2) — OCR slice pure helpers.
//
// The OCR itself runs client-side (tesseract.js WASM — free, on-device, no API
// key, CSP-approved; reused from lib/client-cv-extract.ts). These helpers gate
// the extracted text before it reaches the shared /api/ai/snap pipeline:
// empty / symbol-only OCR output must never be sent — the user gets warm retry
// guidance instead. The server's looksLikeJobDescription guard still runs on
// whatever text IS sent, so a bad read can never become a fabricated JD.

export const MIN_OCR_TEXT_CHARS = 40;

/**
 * Is the OCR-extracted text worth sending to the pipeline?
 * Rejects empty/whitespace output and symbol-only garbage (a blank or blurry
 * photo). Requires real letters — OCR of a blank poster returns "" or a few
 * stray symbols, which must trigger retry guidance, never a pipeline call.
 */
export function isOcrTextUsable(text: string): boolean {
  const t = (text ?? "").trim();
  if (t.length < MIN_OCR_TEXT_CHARS) return false;
  // Must contain at least one real word (letters incl. accented Latin).
  return /[A-Za-z\u00C0-\u024F]{4,}/.test(t);
}

/** Warm copy when OCR found no usable text — never a dead end. */
export function snapOcrNoTextMessage(sw: boolean): string {
  return sw
    ? "Hatukuweza kusoma maandishi yoyote kwenye picha hiyo."
    : "We couldn't read any text from that photo.";
}

/** Warm retry guidance for a poor image / screenshot. */
export function snapOcrRetryMessage(sw: boolean): string {
  return sw
    ? "Hakikisha tangazo lina mwanga wa kutosha, liko wazi na linajaza skrini — kisha jaribu tena."
    : "Make sure the poster or screenshot is well-lit, in focus and fills the frame — then try again.";
}
