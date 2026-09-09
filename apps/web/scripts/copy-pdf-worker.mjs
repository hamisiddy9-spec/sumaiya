// Keep public/pdf.worker.min.mjs in lockstep with the installed pdfjs-dist.
//
// The browser CV/attachment extractor (lib/client-cv-extract.ts) loads pdfjs's
// worker from our own origin at /pdf.worker.min.mjs. pdf.js hard-errors when the
// API version (the imported package) and the worker version differ — which
// silently broke EVERY PDF upload once pdfjs-dist was bumped but the vendored
// worker wasn't. Running this on postinstall guarantees the two never drift:
// whatever pdfjs version is installed, its matching legacy worker is copied.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

if (!existsSync(src)) {
  // pdfjs-dist not installed yet (or path changed) — don't fail the install.
  console.warn(`[copy-pdf-worker] source not found, skipping: ${src}`);
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("[copy-pdf-worker] synced public/pdf.worker.min.mjs to installed pdfjs-dist");
