/**
 * Reads the text out of a chat attachment so Sumaiya works from what the file
 * actually says — not from the filename (which is how she used to end up
 * "quoting" content that was never sent).
 *
 *   image      → /api/mobile/ocr (tesseract, same engine as the web scanner)
 *   PDF        → /api/tools/extract-text (unpdf)
 *   .doc/.docx → not supported yet — tell the user to export a PDF
 *   link       → left for the server turn to fetch
 */
// SDK 54+ moved readAsStringAsync to the legacy entrypoint — the new-API
// import throws at runtime for it.
import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { apiClient, ApiError } from "./api-client";
import type { Attachment } from "../components/chat/chat-types";

const MAX_CHARS = 12000; // keep the prompt bounded

/**
 * Downscale + recompress an image to a size the OCR endpoint accepts. A raw
 * phone screenshot is 2–4 MB → ~4–6 MB as base64 in the request body, which
 * the server rejected (413 / timeout) — this is why "I couldn't read that
 * image" kept coming back. Best-effort: on any failure we OCR the original.
 */
async function toOcrDataUrl(uri: string, mimeType?: string): Promise<string> {
  try {
    const ctx = ImageManipulator.manipulate(uri);
    ctx.resize({ width: 1500 });
    const rendered = await ctx.renderAsync();
    const out = await rendered.saveAsync({ compress: 0.72, format: SaveFormat.JPEG, base64: true });
    if (out.base64) return `data:image/jpeg;base64,${out.base64}`;
    const b64 = await FileSystem.readAsStringAsync(out.uri, { encoding: "base64" });
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    return `data:${mimeType || "image/jpeg"};base64,${b64}`;
  }
}

function isPdf(a: Attachment): boolean {
  return a.mimeType === "application/pdf" || /\.pdf$/i.test(a.name);
}
function isWord(a: Attachment): boolean {
  return /officedocument\.wordprocessing|msword/.test(a.mimeType ?? "") || /\.docx?$/i.test(a.name);
}
function isImageFile(a: Attachment): boolean {
  return /^image\//.test(a.mimeType ?? "") || /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(a.name);
}
function isPlainText(a: Attachment): boolean {
  return /^text\/|application\/rtf/.test(a.mimeType ?? "") || /\.(txt|rtf|md|csv)$/i.test(a.name);
}

/** OCR a local image file. Shared by camera/library images and picked image
 *  files. */
async function ocrImage(uri: string, mimeType?: string): Promise<Partial<Attachment>> {
  const dataUrl = await toOcrDataUrl(uri, mimeType);
  const { text } = await apiClient.ocrUpload(dataUrl);
  const clean = (text || "").trim();
  return clean
    ? { extractedText: clean.slice(0, MAX_CHARS), extracting: false }
    : { extractError: "I couldn't read any text in that image. Try a sharper, straight-on shot.", extracting: false };
}

/** Returns the fields to merge back onto the attachment. Never throws. */
export async function extractAttachment(a: Attachment): Promise<Partial<Attachment>> {
  try {
    // A camera/library photo, OR a picked file that's actually an image.
    if (a.kind === "image" || (a.kind === "document" && isImageFile(a))) {
      return await ocrImage(a.uri, a.mimeType);
    }

    if (a.kind === "document" && isPdf(a)) {
      const { text } = await apiClient.extractPdfText({ uri: a.uri, name: a.name, type: "application/pdf" });
      const clean = (text || "").trim();
      return clean
        ? { extractedText: clean.slice(0, MAX_CHARS), extracting: false }
        : { extractError: "That PDF looks like a scan (no selectable text). Take a clear photo of it and I'll read that.", extracting: false };
    }

    if (a.kind === "document" && isPlainText(a)) {
      const text = await FileSystem.readAsStringAsync(a.uri, { encoding: "utf8" }).catch(() => "");
      const clean = text.trim();
      return clean
        ? { extractedText: clean.slice(0, MAX_CHARS), extracting: false }
        : { extractError: "That file came through empty — paste the text here.", extracting: false };
    }

    if (a.kind === "document" && isWord(a)) {
      return {
        extractError:
          "Word files don't extract cleanly on the phone yet. Open it, copy the text and paste it here — or save it as a PDF and resend.",
        extracting: false,
      };
    }

    if (a.kind === "document") {
      return { extractError: "I couldn't read that file type. Paste the text and I'll work from that.", extracting: false };
    }

    return { extracting: false }; // link / cv — nothing to extract on device
  } catch (err) {
    const msg =
      err instanceof ApiError && err.status === 413
        ? "That file is too big for me to read (max ~4 MB). Send a smaller PDF or a photo."
        : err instanceof ApiError && err.status === 422
          ? "That looks like a scanned image with no text I can pull out. Send a photo of it instead."
          : "I couldn't read that file just now — check your connection, or paste the text.";
    return { extractError: msg, extracting: false };
  }
}

/**
 * The context line handed to Sumaiya with the turn. Includes whatever text we
 * managed to pull; is explicit when we got nothing so she never invents it.
 */
export function attachmentsContext(atts: Attachment[]): string {
  if (!atts.length) return "";
  const blocks = atts.map((a) => {
    const label =
      a.kind === "link" ? `job link: ${a.uri}`
      : a.kind === "cv" ? `the user's saved CV "${a.name}"`
      : a.kind === "image" ? `a photo named "${a.name}"`
      : `a document named "${a.name}"`;

    if (a.kind === "link") return `- ${label}`;
    if (a.extractedText) {
      return `- ${label}. Its contents:\n"""\n${a.extractedText}\n"""`;
    }
    if (a.kind === "cv") return `- ${label}`;
    return `- ${label}. YOU HAVE NO TEXT FROM THIS FILE${a.extractError ? ` (${a.extractError})` : ""}. Do NOT guess or invent what it contains — tell the user you couldn't read it and ask them to paste the text.`;
  });
  return `[The user attached ${atts.length} item(s):\n${blocks.join("\n")}\n]`;
}
