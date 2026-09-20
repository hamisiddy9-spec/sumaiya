// Single source of truth for the PDF upload size cap.
//
// This is pinned to Vercel's ~4.5 MB serverless request-body limit: the
// platform rejects a larger request body at the edge, before any handler
// runs, so a server-side cap above that is unreachable in practice. Every
// client-side file picker for this upload path (the ATS checker, the PDF
// tools) MUST import MAX_PDF_UPLOAD_BYTES / MAX_PDF_UPLOAD_MB from here
// instead of hardcoding its own number, so the client and server can never
// drift out of sync again. Do not raise this above 4 MB without changing the
// hosting platform's request-body limit first.
//
// This module must stay client-safe: no server-only imports (hono, pdf-lib,
// unpdf, node builtins) — it is imported directly by client components.
export const MAX_PDF_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_UPLOAD_MB = 4;
