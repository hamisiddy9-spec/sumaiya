// Single source of truth for the PDF upload size caps.
//
// There are TWO different limits, and confusing them is what produced the
// silent failure this file now documents:
//
//   1. MAX_PDF_UPLOAD_BYTES (4 MB) — what may travel over the NETWORK to our API
//      routes. This is pinned to Vercel's ~4.5 MB serverless request-body limit:
//      the platform rejects a larger body at the edge, BEFORE any handler runs,
//      so the route's own friendly 413 never executes and the request never
//      settles. A 27 MB PDF sat on the assistant's "· inasoma…" chip for 177 s
//      with no error, no completion and no way forward; the raw platform body
//      took 91,377 ms to appear (measured 2026-09-20, results-recheck-huge.json
//      + results-server-extract.json). Therefore NO client may ever POST a body
//      above this, and the AI Assistant's server fallback must check it BEFORE
//      it fetches. Do not raise this above 4 MB without changing the hosting
//      platform's request-body limit first.
//
//   2. MAX_LOCAL_PARSE_BYTES (25 MB) — what the BROWSER may try to read by
//      itself (pdf.js text layer, Tesseract OCR). Nothing is uploaded on that
//      path, so it is only about what the tab can survive. It is NOT a network
//      limit and must never be used as the server-fallback threshold.
//
// A file between the two is readable locally but NOT sendable: when the local
// reader fails on it, the honest answer is "too big to send — send a shorter
// PDF, or paste the text", never a request that cannot settle.
//
// Every client-side file picker for the upload path (the ATS checker, the PDF
// tools, the AI Assistant) MUST import these from here instead of hardcoding a
// number, so client and server can never drift out of sync again.
//
// This module must stay client-safe: no server-only imports (hono, pdf-lib,
// unpdf, node builtins) — it is imported directly by client components.
export const MAX_PDF_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_UPLOAD_MB = 4;
export const MAX_LOCAL_PARSE_BYTES = 25 * 1024 * 1024;
export const MAX_LOCAL_PARSE_MB = 25;

/** What a file's SIZE says about a path that may end in a network request. */
export type AttachmentSizeVerdict =
  /** Under both caps: read it locally, and the server fallback is allowed. */
  | { kind: "ok"; mb: number }
  /** Over the local-reader cap: never even try to read it. */
  | { kind: "too-large-to-read"; mb: number; limitMb: number }
  /**
   * Readable on the device, but NOT sendable: the server fallback must be
   * skipped, because a body this size never gets a response.
   */
  | { kind: "too-large-to-send"; mb: number; limitMb: number };

/**
 * The ONE decision function for "how big is this file, and what may we do with
 * it". Pure and shared so the rule can be pinned by a test instead of living
 * implicitly inside two fetch call sites — the 27 MB PDF that hung the import
 * forever came from exactly that gap (a locally-known TOO_LARGE that still went
 * out to the server).
 */
export function attachmentSizeVerdict(bytes: number): AttachmentSizeVerdict {
  const mb = bytes / (1024 * 1024);
  if (bytes > MAX_LOCAL_PARSE_BYTES) return { kind: "too-large-to-read", mb, limitMb: MAX_LOCAL_PARSE_MB };
  if (bytes > MAX_PDF_UPLOAD_BYTES) return { kind: "too-large-to-send", mb, limitMb: MAX_PDF_UPLOAD_MB };
  return { kind: "ok", mb };
}

/** May a file this size be POSTed to our API routes? */
export function maySendToServer(bytes: number): boolean {
  return attachmentSizeVerdict(bytes).kind === "ok";
}

/**
 * How long the AI Assistant waits on the server extractor before giving up. The
 * route answers in 1.4–4.6 s on every honest input measured
 * (results-server-extract.json), so a request still open after this is not
 * coming back — and the user gets a message instead of a chip that never stops
 * spinning.
 */
export const SERVER_EXTRACT_TIMEOUT_MS = 30_000;
