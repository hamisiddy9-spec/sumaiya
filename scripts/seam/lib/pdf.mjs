/**
 * SEAM TEST — what the downloaded PDF actually IS.
 *
 * "The download button worked" is a UI claim. This module answers the questions
 * that can be answered from the FILE: how many bytes, how many pages, and what
 * text does it contain. The CV exporter embeds an invisible ATS text layer
 * (lib/pdf.ts `textLayer`), so a real export is searchable — which makes it
 * possible to assert that the document contains the name typed into the editor,
 * a claim no screenshot can support.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import fs from "node:fs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const req = createRequire(path.join(REPO, "package.json"));

export async function pdfFacts(filePath) {
  const bytes = fs.readFileSync(filePath);
  const { PDFDocument } = req("pdf-lib");
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  let text = "";
  let textError = null;
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const proxy = await getDocumentProxy(new Uint8Array(bytes));
    const out = await extractText(proxy, { mergePages: true });
    text = Array.isArray(out.text) ? out.text.join("\n") : out.text;
  } catch (err) {
    textError = err.message;
  }
  return {
    file: filePath,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex").slice(0, 16),
    header: bytes.subarray(0, 5).toString("latin1"), // must be "%PDF-"
    eofMarker: bytes.subarray(-6).toString("latin1").includes("%%EOF"),
    pages: doc.getPageCount(),
    pageSizes: doc.getPages().map((p) => {
      const { width, height } = p.getSize();
      return `${Math.round(width)}x${Math.round(height)}`;
    }),
    textChars: text.length,
    text: text.replace(/\s+/g, " ").trim(),
    textError,
  };
}

/** Does the extracted text contain each needle (case-insensitive)? */
export function containsAll(text, needles) {
  const hay = (text || "").toLowerCase();
  return needles.map((n) => ({ needle: n, found: hay.includes(String(n).toLowerCase()) }));
}
