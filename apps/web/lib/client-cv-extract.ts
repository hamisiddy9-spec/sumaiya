"use client";

// Extracts text from a CV PDF entirely in the browser, so ANY PDF can be
// imported — including image-only ones (Sumaiya's own pixel-perfect
// exports, or scans) that carry no selectable text layer.
//
// Why client-side: (1) it removes Vercel's ~4.5 MB request-body limit, since
// nothing is uploaded — only the extracted text is sent to the AI; (2) it lets
// us fall back to OCR for image PDFs, which the server extractor (`unpdf` text
// only) cannot read.
//
// Strategy: read the embedded text layer first (fast, exact, works for Word/
// other exports). If there's essentially no text, the pages are images — render
// each page to a canvas and OCR it with Tesseract. pdfjs + Tesseract are both
// dynamically imported so they never touch the initial bundle. We use pdfjs's
// `legacy` build for the widest mobile-browser support, and point its worker at
// a bundler-emitted asset on our own origin (no CDN, so no CSP surprises).

export type ExtractProgress =
  | { stage: "loading" }
  | { stage: "reading-text" }
  | { stage: "ocr"; page: number; total: number; pct: number };

export interface ExtractResult {
  text: string;
  usedOcr: boolean;
  pages: number;
}

/** Custom error class so the import UI can distinguish failure modes. */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code: "TOO_LARGE" | "PARSE_FAILED" | "NO_TEXT" | "TIMEOUT" | "OCR_FAILED" | "MEMORY",
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

const MIN_TEXT_CHARS = 40;
const MAX_FILE_MB = 25;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
// OCR is slow (~5–15s/page); cap the work so a huge scan can't hang the tab.
const MAX_OCR_PAGES = 6;
// A CV / cover letter is a few pages. NEVER iterate an entire large document —
// a 140-page PDF would hang or OOM a phone (this was a real failure). Read only
// the first pages for the text layer; that's always enough for a résumé.
const MAX_TEXT_PAGES = 15;
// Total time budget for pdfjs parsing + text extraction (not OCR). A 13 MB PDF
// with 160+ pages can take 30+ seconds to iterate page text — cap it so the
// browser tab doesn't hang forever.
const TEXT_EXTRACTION_TIMEOUT_MS = 45_000;
// Higher scale = sharper render = better OCR. Tesseract wants ~300 DPI; an A4
// page in CSS px at scale 2 is only ~150 DPI, which mangled dense small text
// (dropped ~40% of characters in testing). Scale 3.5 (~260 DPI) is far more
// accurate; still fits in browser memory rendering one page at a time.
const RENDER_SCALE = 3.5;

// ── D7 perf: lazy-load guard for the tesseract.js OCR engine ──────────────
// tesseract.js (WASM + web worker + ~18 KB min JS) is the heaviest client
// dependency in this module. It must NEVER ride along in the initial bundle of
// a page that merely *offers* OCR — e.g. /snap paste mode, where the photo tab
// is only one of two modes. `loadOcrEngine` is the ONLY entry point: it
// dynamic-imports the engine on the first real OCR call (photo capture /
// image-PDF fallback) and memoizes the module promise so a second OCR attempt
// reuses the already-fetched chunk instead of re-downloading/re-evaluating it.
// On failure the memo is cleared, so a later retry genuinely re-attempts the
// load rather than caching a rejection forever.
type OcrEngine = typeof import("tesseract.js");
let ocrEnginePromise: Promise<OcrEngine> | null = null;

/** Lazy-load (and memoize) the tesseract.js OCR engine — D7. */
export function loadOcrEngine(): Promise<OcrEngine> {
  if (!ocrEnginePromise) {
    ocrEnginePromise = import("tesseract.js").catch((err: unknown) => {
      ocrEnginePromise = null; // transient failure (network blip) → allow retry
      throw err;
    });
  }
  return ocrEnginePromise;
}

async function loadPdfjs() {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Worker is vendored into /public (see public/pdf.worker.min.mjs) so it's
  // served from our own origin — no CDN, no CSP surprises, no bundler asset
  // magic. It MUST match the installed pdfjs-dist version or pdf.js hard-errors
  // and every PDF upload fails. scripts/copy-pdf-worker.mjs (postinstall +
  // prebuild) keeps it in lockstep automatically — do NOT hand-edit the copy.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

/**
 * Race a promise against a timeout. If the timeout wins, the promise is
 * abandoned and we throw ExtractionError with code TIMEOUT.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ExtractionError(
      `${label} timed out after ${(ms / 1000).toFixed(0)}s`,
      "TIMEOUT",
    )), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!));
}

/** OCR a photo/image of a document (JPG/PNG/WebP…) directly with Tesseract.
 *  For the mobile audience this is the common case — a snapshot of a printed CV
 *  or a screenshot of a job posting. */
export async function extractTextFromImage(
  file: File,
  onProgress?: (p: ExtractProgress) => void,
): Promise<ExtractResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_FILE_MB} MB)`, "TOO_LARGE");
  }
  onProgress?.({ stage: "loading" });
  let recognize: any;
  try {
    ({ recognize } = await loadOcrEngine());
  } catch {
    throw new ExtractionError("OCR engine could not be loaded.", "OCR_FAILED");
  }
  let result: any;
  try {
    result = await withTimeout(recognize(file, "eng", {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === "recognizing text") {
          onProgress?.({ stage: "ocr", page: 1, total: 1, pct: Math.round((m.progress ?? 0) * 100) });
        }
      },
    }), 120_000, "Image OCR");
  } catch (e) {
    if (e instanceof ExtractionError) throw e;
    throw new ExtractionError("Couldn't read text from that image.", "OCR_FAILED");
  }
  return { text: (result?.data?.text ?? "").trim(), usedOcr: true, pages: 1 };
}

/** One entry point for ANY supported upload — routes by type to the PDF
 *  extractor, image OCR, or a plain-text read. Callers don't care what it was. */
export async function extractTextFromFile(
  file: File,
  onProgress?: (p: ExtractProgress) => void,
): Promise<ExtractResult> {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return extractCvTextFromPdf(file, onProgress);
  }
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(name)) {
    return extractTextFromImage(file, onProgress);
  }
  if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    if (file.size > MAX_FILE_BYTES) {
      throw new ExtractionError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_FILE_MB} MB)`, "TOO_LARGE");
    }
    onProgress?.({ stage: "reading-text" });
    let mammoth: any;
    try { mammoth = await import("mammoth"); } catch { throw new ExtractionError("Could not load the Word reader.", "PARSE_FAILED"); }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const lib = mammoth.extractRawText ? mammoth : mammoth.default;
      const { value } = await lib.extractRawText({ arrayBuffer });
      return { text: (value || "").trim(), usedOcr: false, pages: 1 };
    } catch {
      throw new ExtractionError("Couldn't read that Word document. Try saving it as PDF.", "PARSE_FAILED");
    }
  }
  if (type.startsWith("text/") || /\.(txt|md|csv|rtf)$/.test(name)) {
    const text = (await file.text()).trim();
    return { text, usedOcr: false, pages: 1 };
  }
  throw new ExtractionError(
    "Unsupported file. Please upload a PDF, a Word (.docx) file, a photo (JPG/PNG), or a text file.",
    "PARSE_FAILED",
  );
}

export async function extractCvTextFromPdf(
  file: File,
  onProgress?: (p: ExtractProgress) => void,
): Promise<ExtractResult> {
  onProgress?.({ stage: "loading" });

  // Guard: bail early for absurdly large files that would OOM the tab rather
  // than hanging for 45 s then failing.
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_FILE_MB} MB)`,
      "TOO_LARGE",
    );
  }

  let data: Uint8Array;
  try {
    data = new Uint8Array(await file.arrayBuffer());
  } catch (e) {
    throw new ExtractionError("Could not read the file in the browser. It may be corrupted.", "PARSE_FAILED");
  }

  const pdfjs = await loadPdfjs();
  let pdf: any;
  try {
    pdf = await withTimeout(pdfjs.getDocument({ data }).promise, TEXT_EXTRACTION_TIMEOUT_MS, "PDF parsing");
  } catch (e) {
    if (e instanceof ExtractionError) throw e;
    throw new ExtractionError(
      "This PDF could not be parsed. It may be encrypted, damaged, or not a valid PDF.",
      "PARSE_FAILED",
    );
  }
  const totalPages: number = pdf.numPages ?? 0;

  // 1) Fast path — embedded text layer. Only the first pages: a résumé is short,
  // and iterating a 140-page document would hang or OOM a phone.
  onProgress?.({ stage: "reading-text" });
  const textPages = Math.min(totalPages, MAX_TEXT_PAGES);
  let embedded = "";
  for (let i = 1; i <= textPages; i++) {
    try {
      const page: any = await withTimeout(pdf.getPage(i), TEXT_EXTRACTION_TIMEOUT_MS, `Page ${i}`);
      const content: any = await withTimeout(page.getTextContent(), TEXT_EXTRACTION_TIMEOUT_MS, `Page ${i} text`);
      embedded += content.items.map((it: any) => it.str ?? "").join(" ") + "\n";
    } catch {
      // Skip a stubborn/slow page rather than failing the whole import; once we
      // already have enough text, stop early.
      if (embedded.replace(/\s/g, "").length >= MIN_TEXT_CHARS) break;
    }
  }
  if (embedded.replace(/\s/g, "").length >= MIN_TEXT_CHARS) {
    return { text: embedded.trim(), usedOcr: false, pages: totalPages };
  }

  // 2) OCR fallback — render each page to a canvas, then recognize.
  let recognize: any;
  try {
    ({ recognize } = await loadOcrEngine());
  } catch {
    throw new ExtractionError("OCR engine could not be loaded.", "OCR_FAILED");
  }
  const pageCount = Math.min(totalPages || MAX_OCR_PAGES, MAX_OCR_PAGES);
  const chunks: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    let page: any;
    try {
      page = await pdf.getPage(i);
    } catch {
      throw new ExtractionError(`Could not read page ${i} of the PDF.`, "PARSE_FAILED");
    }
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    // Check canvas memory budget: viewport.width * viewport.height * 4 bytes
    // at scale 3.5 for an A4 page is ~24 MB per canvas — warn if accumulating
    // too many high-res renders would blow browser memory.
    const canvasBytes = Math.ceil(viewport.width) * Math.ceil(viewport.height) * 4;
    if (canvasBytes > 100 * 1024 * 1024) {
      throw new ExtractionError(
        "This PDF is too large to render for OCR. Try a text-based PDF.",
        "MEMORY",
      );
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    try {
      await withTimeout(page.render({ canvasContext: ctx, viewport }).promise, 30_000, `Page ${i} render`);
    } catch (e) {
      if (e instanceof ExtractionError) throw e;
      throw new ExtractionError(`Failed to render page ${i} for OCR.`, "OCR_FAILED");
    }

    let result: any;
    try {
      result = await withTimeout(recognize(canvas, "eng", {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === "recognizing text") {
            onProgress?.({
              stage: "ocr",
              page: i,
              total: pageCount,
              pct: Math.round((m.progress ?? 0) * 100),
            });
          }
        },
      }), 120_000, `Page ${i} OCR`);
    } catch (e) {
      if (e instanceof ExtractionError) throw e;
      throw new ExtractionError(`OCR failed on page ${i}.`, "OCR_FAILED");
    }
    const pageText: string = result?.data?.text ?? "";
    if (pageText.trim()) chunks.push(pageText.trim());
  }

  return { text: chunks.join("\n\n").trim(), usedOcr: true, pages: totalPages };
}
