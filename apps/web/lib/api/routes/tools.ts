import { Hono, type Context } from "hono";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { rateLimitDurable, clientIp } from "@/lib/api/rate-limit";
// Text extraction uses `unpdf` — a serverless-safe build of pdfjs. Unlike
// `pdf-parse`/`pdfjs-dist`, it does NOT touch the browser-only `DOMMatrix` at
// load and imports in ~1ms (pdf-parse cost ~2.8s of cold-start time, which on a
// cold Vercel lambda pushed extract-text past the function timeout and hung the
// upload forever). It is loaded lazily inside the handler so its cost is only
// paid on the one route that needs it.

// Vercel serverless functions reject request bodies over ~4.5 MB at the
// platform edge, before this handler runs — so a larger cap here was never
// actually reachable. Cap at 4 MB so our own 413 is consistent with reality
// and the message is friendly rather than an opaque platform error.
const MAX_PDF_BYTES = 4 * 1024 * 1024; // 4 MB (under Vercel's ~4.5 MB body limit)

// pdf-lib can only embed PNG and JPEG. WEBP is intentionally excluded — it was
// previously accepted here but fell through to embedJpg and threw a 500
// ("something went wrong"). Reject it up front with a clear message instead.
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const ALLOWED_IMAGE_EXTS = [".png", ".jpg", ".jpeg"];

function isImageFile(file: File): boolean {
  const contentType = file.type.toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(contentType)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTS.some((ext) => name.endsWith(ext));
}

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

/**
 * Parse page range strings like "1,3,5-7" into an array of 0-indexed page numbers.
 * Returns sorted unique page numbers.
 */
function parsePageRanges(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(",").map((p) => p.trim());

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      // Clamp to the valid page range BEFORE looping. Otherwise input like
      // "1-999999999" on a 3-page PDF spins ~1e9 iterations, blocking the event
      // loop and risking a serverless timeout (a cheap CPU-DoS vector).
      start = Math.max(1, start);
      end = Math.min(end, totalPages);
      for (let i = start; i <= end; i++) {
        pages.add(i - 1);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) pages.add(num - 1);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function collectFiles(formData: Record<string, unknown>): File[] {
  const files: File[] = [];
  for (const value of Object.values(formData)) {
    if (value instanceof File) {
      files.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) files.push(item);
      }
    }
  }
  return files;
}

/** First uploaded PDF from a form body, or null. */
function firstPdf(formData: Record<string, unknown>): File | null {
  return collectFiles(formData).find(isPdfFile) ?? null;
}

/** A string field from a parsed form body. */
function field(formData: Record<string, unknown>, key: string): string {
  const v = formData[key];
  return typeof v === "string" ? v : "";
}

// Every tool shares the same per-IP budget: 10 requests/minute.
const TOOL_RATE = { max: 10, windowMs: 60_000 } as const;

/** Per-tool IP rate limit. Returns a 429 response to short-circuit, or null to proceed. */
async function rateLimited(c: Context, tool: string) {
  const rl = await rateLimitDurable(`tools:${tool}:${clientIp(c.req.raw)}`, TOOL_RATE);
  return rl.allowed
    ? null
    : c.json({ error: "Rate limit exceeded. Try again in a minute." }, 429);
}

/** Binary PDF download response with the given filename. */
function pdfDownload(c: Context, bytes: Buffer, filename: string) {
  // A Node Buffer is a Uint8Array at runtime; the cast satisfies Hono's body
  // overload, which wants Uint8Array<ArrayBuffer> rather than Buffer's looser type.
  return c.body(bytes as unknown as Uint8Array<ArrayBuffer>, 200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
}

export const toolsRoutes = new Hono()

  // ── Image-to-PDF ──────────────────────────────────────────────────────────
  .post("/image-to-pdf", async (c) => {
    const limited = await rateLimited(c,"image-to-pdf");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const files = collectFiles(formData);

      if (files.length === 0) {
        return c.json({ error: "No files uploaded. Please upload at least one image." }, 400);
      }

      for (const file of files) {
        if (!isImageFile(file)) {
          return c.json(
            { error: `Invalid file type: "${file.name}". Only PNG and JPG images are allowed.` },
            400
          );
        }
      }

      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const contentType = file.type.toLowerCase();

        let image;
        if (contentType === "image/png" || file.name.toLowerCase().endsWith(".png")) {
          image = await pdfDoc.embedPng(bytes);
        } else {
          image = await pdfDoc.embedJpg(bytes);
        }

        const { width, height } = image;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, { x: 0, y: 0, width, height });
      }

      const pdfBytes = Buffer.from(await pdfDoc.save());
      return pdfDownload(c, pdfBytes, "images-converted.pdf");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to convert images to PDF";
      return c.json({ error: message }, 500);
    }
  })

  // ── Merge PDFs ────────────────────────────────────────────────────────────
  .post("/merge", async (c) => {
    const limited = await rateLimited(c,"merge");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const files = collectFiles(formData);

      if (files.length < 2) {
        return c.json({ error: "Please upload at least two PDF files to merge." }, 400);
      }

      for (const file of files) {
        if (!isPdfFile(file)) {
          return c.json({ error: `"${file.name}" is not a valid PDF file.` }, 400);
        }
      }

      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        for (const page of copiedPages) mergedPdf.addPage(page);
      }

      const pdfBytes = Buffer.from(await mergedPdf.save());
      return pdfDownload(c, pdfBytes, "merged.pdf");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to merge PDFs";
      return c.json({ error: message }, 500);
    }
  })

  // ── Split PDF ─────────────────────────────────────────────────────────────
  .post("/split", async (c) => {
    const limited = await rateLimited(c,"split");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const pagesStr = field(formData, "pages").trim();
      if (!pagesStr) return c.json({ error: "Please provide page numbers (e.g., '1,3,5-7')." }, 400);

      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      const pageIndices = parsePageRanges(pagesStr, totalPages);

      if (pageIndices.length === 0) {
        return c.json(
          { error: `No valid pages found in range "${pagesStr}". PDF has ${totalPages} pages (1-${totalPages}).` },
          400
        );
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      for (const page of copiedPages) newPdf.addPage(page);

      const pdfBytes = Buffer.from(await newPdf.save());
      return pdfDownload(c, pdfBytes, "split.pdf");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to split PDF";
      return c.json({ error: message }, 500);
    }
  })

  // ── Protect PDF (password) ───────────────────────────────────────────────
  .post("/protect", async (c) => {
    const limited = await rateLimited(c,"protect");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const password = field(formData, "password");
      if (!password) return c.json({ error: "Please provide a password." }, 400);

      const bytes = Buffer.from(await pdfFile.arrayBuffer());

      // pdf-lib does not support encryption, so we shell out to Python's pypdf.
      const fs = await import("fs");
      const tmpDir = "/tmp/sumaiya-pdf";
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
      const stamp = `${Date.now()}-${Math.round(bytes.length)}`;
      const inputPath = `${tmpDir}/input-${stamp}.pdf`;
      const outputPath = `${tmpDir}/protected-${stamp}.pdf`;
      const scriptPath = `${tmpDir}/script-${stamp}.py`;

      const cleanup = () => {
        for (const p of [inputPath, outputPath, scriptPath]) {
          try { fs.unlinkSync(p); } catch {}
        }
      };

      try {
        fs.writeFileSync(inputPath, bytes);

        // The password is passed via argv (never the script body), and we invoke
        // the interpreter with execFileSync + an args array so NOTHING the user
        // supplies is ever parsed by a shell — no command-injection surface.
        const pyScript = `import sys, pypdf
reader = pypdf.PdfReader(sys.argv[1])
writer = pypdf.PdfWriter()
for page in reader.pages:
    writer.add_page(page)
writer.encrypt(sys.argv[3])
writer.write(sys.argv[2])
`;
        fs.writeFileSync(scriptPath, pyScript);

        const { execFileSync } = await import("child_process");
        execFileSync("python3", [scriptPath, inputPath, outputPath, password], {
          timeout: 30000,
          stdio: "ignore",
        });

        const protectedBytes = fs.readFileSync(outputPath);
        return pdfDownload(c, protectedBytes, "protected.pdf");
      } finally {
        cleanup();
      }
    } catch (err) {
      // Encryption shells out to Python's pypdf, which isn't available on all
      // runtimes (e.g. Vercel). Fail with a clear message instead of leaking
      // the raw command error.
      console.error("[tools:protect] failed:", err);
      return c.json({ error: "Password protection isn't available right now. Please try another tool." }, 501);
    }
  })

  // ── Rotate PDF pages ─────────────────────────────────────────────────────
  .post("/rotate", async (c) => {
    const limited = await rateLimited(c,"rotate");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const angle = parseInt(field(formData, "angle") || "90", 10);
      if (![90, 180, 270].includes(angle)) {
        return c.json({ error: "Rotation must be 90, 180, or 270 degrees." }, 400);
      }

      const pagesStr = field(formData, "pages").trim();
      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = pdfDoc.getPageCount();
      const targets = pagesStr
        ? new Set(parsePageRanges(pagesStr, total))
        : new Set(Array.from({ length: total }, (_, i) => i));

      pdfDoc.getPages().forEach((page, i) => {
        if (targets.has(i)) {
          page.setRotation(degrees((page.getRotation().angle + angle) % 360));
        }
      });

      const out = Buffer.from(await pdfDoc.save());
      return pdfDownload(c, out, "rotated.pdf");
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : "Failed to rotate PDF" }, 500);
    }
  })

  // ── Watermark PDF ────────────────────────────────────────────────────────
  .post("/watermark", async (c) => {
    const limited = await rateLimited(c,"watermark");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const rawText = field(formData, "text").trim();
      if (!rawText) return c.json({ error: "Please enter watermark text." }, 400);
      if (rawText.length > 60) return c.json({ error: "Watermark text is too long (max 60 characters)." }, 400);
      // The standard PDF font only encodes Latin-1; drop anything outside it
      // (emoji, CJK, …) so drawText can't throw a "WinAnsi cannot encode" 500.
      const text = rawText.replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
      if (!text) return c.json({ error: "Watermark text must use standard Latin characters." }, 400);

      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        const size = Math.max(24, Math.min(width, height) / 12);
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size,
          font,
          color: rgb(0.85, 0.29, 0.11), // ember, muted by opacity
          rotate: degrees(45),
          opacity: 0.18,
        });
      }

      const out = Buffer.from(await pdfDoc.save());
      return pdfDownload(c, out, "watermarked.pdf");
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : "Failed to watermark PDF" }, 500);
    }
  })

  // ── Add page numbers ─────────────────────────────────────────────────────
  .post("/page-numbers", async (c) => {
    const limited = await rateLimited(c,"page-numbers");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      pages.forEach((page, i) => {
        const { width } = page.getSize();
        const label = `${i + 1} / ${total}`;
        const size = 10;
        const textWidth = font.widthOfTextAtSize(label, size);
        page.drawText(label, {
          x: width / 2 - textWidth / 2,
          y: 24,
          size,
          font,
          color: rgb(0.29, 0.24, 0.19), // espresso
        });
      });

      const out = Buffer.from(await pdfDoc.save());
      return pdfDownload(c, out, "numbered.pdf");
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : "Failed to add page numbers" }, 500);
    }
  })

  // ── Delete pages ─────────────────────────────────────────────────────────
  .post("/delete-pages", async (c) => {
    const limited = await rateLimited(c,"delete-pages");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const pdfFile = firstPdf(formData);
      if (!pdfFile) return c.json({ error: "Please upload a PDF file." }, 400);

      const pagesStr = field(formData, "pages").trim();
      if (!pagesStr) return c.json({ error: "Please provide page numbers to remove (e.g., '2,5-6')." }, 400);

      const bytes = Buffer.from(await pdfFile.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = pdfDoc.getPageCount();
      const remove = parsePageRanges(pagesStr, total);

      if (remove.length === 0) {
        return c.json({ error: `No valid pages in "${pagesStr}". PDF has ${total} pages (1-${total}).` }, 400);
      }
      if (remove.length >= total) {
        return c.json({ error: "Can't remove every page — at least one must remain." }, 400);
      }

      // Remove from the end so earlier indices stay valid.
      for (const idx of [...remove].sort((a, b) => b - a)) {
        pdfDoc.removePage(idx);
      }

      const out = Buffer.from(await pdfDoc.save());
      return pdfDownload(c, out, "edited.pdf");
    } catch (err) {
      return c.json({ error: err instanceof Error ? err.message : "Failed to delete pages" }, 500);
    }
  })

  // ── Extract Text from a document ────────────────────────────────────────
  // Content-sniffed, not name/MIME-trusted: phones (and share sheets) label
  // files unreliably. Handles PDF, .docx, RTF and plain text; clear messages
  // for old binary .doc and image-only PDFs.
  .post("/extract-text", async (c) => {
    const limited = await rateLimited(c,"extract-text");
    if (limited) return limited;

    try {
      const formData = await c.req.parseBody({ all: true }) as Record<string, unknown>;
      const file = collectFiles(formData)[0] ?? null;
      if (!file) return c.json({ error: "No file uploaded." }, 400);
      if (file.size > MAX_PDF_BYTES) {
        return c.json({ error: "That file is too large (max 4 MB). Send a smaller one, or paste the text." }, 413);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const head = buffer.subarray(0, 8);
      const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
      const isZip = head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07); // PK..
      const isOle = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // legacy .doc/.xls
      const asText = buffer.toString("utf8");
      const isRtf = asText.startsWith("{\\rtf");

      if (isOle) {
        return c.json(
          { error: "That's an old Office file — open it and choose Save As → .docx or PDF, then resend." },
          422,
        );
      }

      if (isPdf) {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { totalPages, text } = await extractText(pdf, { mergePages: true });
        const clean = (typeof text === "string" ? text : (text as string[]).join("\n")).trim();
        if (!clean) {
          return c.json({ error: "That PDF has no selectable text — it's a scan. Send a clear photo of it instead." }, 422);
        }
        return c.json({ success: true, text: clean, pages: totalPages });
      }

      if (isZip && (asText.includes("word/document.xml") || /\.docx$/i.test(file.name))) {
        const mammoth = await import("mammoth");
        const lib = (mammoth as { extractRawText?: unknown }).extractRawText
          ? (mammoth as typeof import("mammoth"))
          : ((mammoth as { default: typeof import("mammoth") }).default);
        const { value } = await lib.extractRawText({ buffer });
        const clean = (value || "").trim();
        if (!clean) return c.json({ error: "That Word file has no readable text." }, 422);
        return c.json({ success: true, text: clean, pages: 1 });
      }

      if (isRtf) {
        // Strip RTF: drop control words / groups, unescape hex + common escapes.
        const clean = asText
          .replace(/\\'[0-9a-fA-F]{2}/g, " ")
          .replace(/\\par[d]?/g, "\n")
          .replace(/\\[a-zA-Z]+-?\d* ?/g, "")
          .replace(/[{}]/g, "")
          .replace(/\r/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        if (clean.length < 20) return c.json({ error: "Couldn't read that RTF file." }, 422);
        return c.json({ success: true, text: clean, pages: 1 });
      }

      // Plain text? Accept if it decodes clean (few control bytes, mostly printable).
      const control = (asText.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
      if (asText.trim().length >= 20 && control / Math.max(asText.length, 1) < 0.02) {
        return c.json({ success: true, text: asText.trim().slice(0, 60000), pages: 1 });
      }

      return c.json(
        { error: "Couldn't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text." },
        415,
      );
    } catch (err) {
      console.error("[tools:extract-text] failed:", err);
      return c.json({ error: "Couldn't read that file. Try a PDF or paste the text." }, 500);
    }
  });
