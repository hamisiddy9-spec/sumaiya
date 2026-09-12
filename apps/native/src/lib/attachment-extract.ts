/**
 * Reads the text out of a chat attachment so Sumaiya works from what the file
 * actually says — not from the filename (which is how she used to end up
 * "quoting" content that was never sent).
 *
 *   image      → /api/mobile/ocr (tesseract, same engine as the web scanner)
 *   PDF        → /api/tools/extract-text (unpdf)
 *   .docx      → /api/tools/extract-text (mammoth); old .doc → ask for .docx/PDF
 *   link       → left for the server turn to fetch
 *
 * Every failure ends with a CODE (`extractErrorCode`) plus an honest English
 * sentence for the transcript. The code is what the UI and Sumaiya render, so
 * the user is told the real reason in their own language. Before this, one
 * generic "check your connection" string covered timeouts, auth failures,
 * scanned PDFs and server crashes alike — and because that string was handed to
 * the model, the model invented a diagnosis for it ("muunganisho ulikataa") and
 * the real cause was never recorded anywhere.
 */
// SDK 54+ moved readAsStringAsync to the legacy entrypoint — the new-API
// import throws at runtime for it.
import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { apiClient, ApiError } from "./api-client";
import { reportError } from "./reporting";
import type { Attachment, ExtractFailure } from "../components/chat/chat-types";

const MAX_CHARS = 12000; // keep the prompt bounded

/** Server cap for /api/tools/extract-text (Vercel's edge 4.5 MB body limit). */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Cap for the base64 route. Base64 inflates bytes by ~33% and the Vercel edge
 * rejects bodies over ~4.5 MB, so the raw file has to stay under ~3 MB. Real
 * CVs and letters are far smaller; anything bigger is told so honestly.
 */
const MAX_BASE64_UPLOAD_BYTES = 3 * 1024 * 1024;


/** How many times we try a read before giving up. Uploads are read-only, so a
 *  retry can never double-apply anything — unlike the general POST path. */
const MAX_READ_ATTEMPTS = 2;

/** Localised, cause-specific copy. This is the ONLY place these sentences are
 *  written, so the UI and the model can never disagree about the reason. */
const MESSAGES: Record<ExtractFailure, { en: string; sw: string }> = {
  too_big: {
    en: "That file is bigger than 4 MB, which is more than I can read. Send a smaller PDF, or a photo of it.",
    sw: "Faili hili ni kubwa kuliko 4 MB, kuzidi ninachoweza kusoma. Tuma PDF ndogo, au picha yake.",
  },
  timeout: {
    en: "Reading that file took too long and I had to stop. Try again on a stronger signal — or paste the text.",
    sw: "Kusoma faili hilo kulichukua muda mrefu mno nikawa nimeacha. Jaribu tena ukiwa na mtandao mzuri — au bandika maandishi.",
  },
  network: {
    en: "I couldn't reach my servers to read that file. Check your connection and try again.",
    sw: "Sikuweza kufikia seva zangu kusoma faili hilo. Angalia mtandao kisha ujaribu tena.",
  },
  auth: {
    en: "I couldn't verify your account for that read. Sign in again and retry.",
    sw: "Sikuweza kuthibitisha akaunti yako kwa kusoma hilo. Ingia tena kisha ujaribu.",
  },
  server: {
    en: "My reader failed on that file just now. Try again in a moment — or paste the text.",
    sw: "Kisomaji changu kilishindwa na faili hilo sasa hivi. Jaribu tena baada ya muda mfupi — au bandika maandishi.",
  },
  scanned_pdf: {
    en: "That PDF is a picture of a page, not real text — I can't pull words out of it. Send a photo of the page instead and I'll read it.",
    sw: "PDF hiyo ni picha ya ukurasa, si maandishi halisi — siwezi kutoa maneno. Tuma picha ya ukurasa badala yake, nitaisoma.",
  },
  unsupported: {
    en: "I can't read that file type. Send a PDF, a Word (.docx) file, a photo, or paste the text.",
    sw: "Siwezi kusoma aina hii ya faili. Tuma PDF, Word (.docx), picha, au bandika maandishi.",
  },
  empty: {
    en: "I opened that file but found no readable text in it. If there's a picture of the text, send that as a photo.",
    sw: "Nilifungua faili hilo lakini sikuona maandishi yoyote. Kama yapo kama picha, tuma picha hiyo.",
  },
  unreadable: {
    en: "I couldn't make out the text in that file. A sharper, straight-on photo usually works better.",
    sw: "Sikuweza kufafanua maandishi kwenye faili hilo. Picha kali, moja kwa moja, kawaida hufanya kazi vizuri.",
  },
  device_file: {
    en: "I couldn't open that file from your phone's file manager — I was given a link I'm not allowed to read. Open your Files app and share the file to me, or send a photo of it.",
    sw: "Sikuweza kuifungua faili hiyo kutoka kidhibiti faili cha simu yako — nilipewa kiungo nisichoruhusiwa kukisoma. Fungua Files na isambaze faili hiyo kwangu, au tuma picha yake.",
  },
};

/** The language the copy should be rendered in. Declared as a bare union on
 *  purpose: this module must stay free of the i18n/React/Storage graph so it
 *  can be unit-tested and imported from anywhere. */
export type ExtractLang = "en" | "sw";

/** The user-facing sentence for a failure code, in the caller's language.
 *  Callers pass their language explicitly — the preview sheet has it from
 *  `useLang()`. Defaults to English when a caller doesn't know. */
export function extractFailureMessage(code: ExtractFailure, lang: ExtractLang = "en"): string {
  const m = MESSAGES[code] ?? MESSAGES.unreadable;
  return lang === "sw" ? m.sw : m.en;
}

/** The English sentence handed to the model. Same reason as the UI shows, so
 *  Sumaiya relays the truth instead of inventing one. */
export function extractFailureDetail(code: ExtractFailure, detail?: string): string {
  return `${MESSAGES[code]?.en ?? MESSAGES.unreadable.en}${detail ? ` (${detail})` : ""}`;
}

export type { ExtractFailure };

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

function extForMime(mime?: string): string | null {
  if (!mime) return null;
  const m = mime.toLowerCase();
  if (m.includes("pdf")) return ".pdf";
  if (m.includes("wordprocessingml")) return ".docx";
  if (m.includes("msword")) return ".doc";
  if (m.includes("rtf")) return ".rtf";
  if (m.startsWith("text/")) return ".txt";
  return null;
}

function isImageFile(a: Attachment): boolean {
  return /^image\//.test(a.mimeType ?? "") || /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(a.name);
}
function isPlainText(a: Attachment): boolean {
  return /^text\/|application\/rtf/.test(a.mimeType ?? "") || /\.(txt|rtf|md|csv)$/i.test(a.name);
}

/** Classify a thrown error into a cause code + a technical detail for logs. */
function classify(err: unknown): { code: ExtractFailure; detail?: string } {
  if (err instanceof ApiError) {
    const detail = `HTTP ${err.status}${err.message ? `: ${err.message}` : ""}`;
    if (err.status === 0) {
      return { code: err.kind === "timeout" ? "timeout" : "network", detail };
    }
    if (err.status === 413) return { code: "too_big", detail };
    if (err.status === 401 || err.status === 403) return { code: "auth", detail };
    if (err.status === 415) return { code: "unsupported", detail };
    if (err.status === 429) return { code: "server", detail };
    if (err.status === 422) {
      // The route distinguishes a scan ("no selectable text") from an
      // empty-but-real document ("no readable text"). Keep that distinction —
      // it's the difference between "send a photo" and "that file is blank".
      const m = (err.message || "").toLowerCase();
      if (m.includes("scan") || m.includes("no selectable text")) return { code: "scanned_pdf", detail };
      if (m.includes("no readable text")) return { code: "empty", detail };
      if (m.includes("image") || m.includes("clearer photo")) return { code: "unreadable", detail };
      return { code: "unsupported", detail };
    }
    if (err.status >= 500) return { code: "server", detail };
    return { code: "server", detail };
  }
  return { code: "unreadable", detail: err instanceof Error ? err.message : String(err) };
}

/** Retry only what is worth retrying: no-response failures and server faults. */
function isRetryable(code: ExtractFailure): boolean {
  return code === "timeout" || code === "network" || code === "server";
}

/** OCR a local image file. Shared by camera/library images and picked image
 *  files. */
async function ocrImage(uri: string, mimeType?: string): Promise<Partial<Attachment>> {
  const dataUrl = await toOcrDataUrl(uri, mimeType);
  const { text } = await apiClient.ocrUpload(dataUrl);
  const clean = (text || "").trim();
  return clean
    ? { extractedText: clean.slice(0, MAX_CHARS), extracting: false, extractError: undefined, extractErrorCode: undefined }
    : { extractErrorCode: "unreadable", extractError: extractFailureDetail("unreadable"), extracting: false };
}

/**
 * Guarantee the upload is handed a REAL `file://` path.
 *
 * On Android the document picker routinely returns a `content://` URI (that's
 * what the Downloads/Drive providers hand out). `FileSystem.copyAsync` cannot
 * read a `content://` source, so the copy threw, we silently fell back to the
 * original URI, and React Native's multipart writer then failed to open it —
 * the POST never left the phone and surfaced as a network error, so the server
 * never saw a request and every PDF "couldn't be read". The content resolver
 * CAN be read through readAsStringAsync, so pull the bytes and write them into
 * our own cache instead.
 *
 * Returns null when the file genuinely can't be materialised — the caller then
 * reports a device problem, not a network one.
 */
async function materialiseForUpload(a: Attachment, safeName: string): Promise<string | null> {
  const dest = `${FileSystem.cacheDirectory ?? ""}${safeName}`;

  if (a.uri.startsWith("content://")) {
    try {
      const b64 = await FileSystem.readAsStringAsync(a.uri, { encoding: "base64" });
      if (b64) {
        await FileSystem.writeAsStringAsync(dest, b64, { encoding: "base64" });
        return dest;
      }
    } catch (e) {
    }
    return null;
  }

  try {
    await FileSystem.copyAsync({ from: a.uri, to: dest });
    const info = await FileSystem.getInfoAsync(dest).catch(() => null);
    return dest;
  } catch (e) {
    // A path we couldn't copy AND can't prove we can read must not be sent —
    // the upload would fail invisibly and get blamed on the network.
    const info = await FileSystem.getInfoAsync(a.uri).catch(() => null);
    const readable = !!(info as { exists?: boolean } | null)?.exists;
    return readable && a.uri.startsWith("file://") ? a.uri : null;
  }
}

/**
 * Read one document. Returns the fields to merge back onto the attachment —
 * never throws.
 */
async function readDocument(a: Attachment): Promise<Partial<Attachment>> {
  // Pre-flight the size before burning a slow uplink on a file the server will
  // reject at the edge anyway (Vercel returns an opaque platform error there,
  // not our friendly 413).
  if (a.size && a.size > MAX_UPLOAD_BYTES) {
    return {
      extractErrorCode: "too_big",
      extractError: extractFailureDetail("too_big", `${Math.round((a.size / 1024 / 1024) * 10) / 10} MB`),
      extracting: false,
    };
  }

  const ext =
    (a.name?.match(/\.[A-Za-z0-9]{1,5}$/)?.[0] ?? extForMime(a.mimeType) ?? "").toLowerCase();
  const safeName = `upload-${Date.now()}${ext || ".bin"}`;

  const uploadUri = await materialiseForUpload(a, safeName);
  if (!uploadUri) {
    return {
      extractErrorCode: "device_file",
      extractError: extractFailureDetail("device_file", a.uri.split(":")[0]),
      extracting: false,
    };
  }


  let last: { code: ExtractFailure; detail?: string } = { code: "unreadable" };
  for (let attempt = 1; attempt <= MAX_READ_ATTEMPTS; attempt++) {
    try {
      // Read the bytes here and post them as JSON base64. RN's multipart
      // writer cannot open a `file://` part on this version — proven on the
      // device: the file existed and was readable, the FormData shape was
      // correct, a JSON POST to the same URL returned 400, and the multipart
      // POST failed instantly without reaching the server.
      const info = await FileSystem.getInfoAsync(uploadUri).catch(() => null);
      const bytes = (info as { size?: number } | null)?.size ?? a.size ?? 0;
      if (bytes > MAX_BASE64_UPLOAD_BYTES) {
        return {
          extractErrorCode: "too_big",
          extractError: extractFailureDetail("too_big", `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`),
          extracting: false,
        };
      }
      const base64 = await FileSystem.readAsStringAsync(uploadUri, { encoding: "base64" }).catch(() => "");
      if (!base64) {
        last = { code: "device_file" };
        break;
      }
      const { text } = await apiClient.extractDocumentTextBase64({
        base64,
        name: safeName,
        mimeType: a.mimeType,
      });
      const clean = (text || "").trim();
      if (clean) {
        return { extractedText: clean.slice(0, MAX_CHARS), extracting: false, extractError: undefined, extractErrorCode: undefined };
      }
      last = { code: "empty" };
      break; // a successful-but-empty read won't improve on retry
    } catch (err) {
      last = classify(err);
      // The device may still be able to read an obvious text file with no
      // network at all — try the local read before we call it a failure.
      if (isPlainText(a)) {
        const text = await FileSystem.readAsStringAsync(uploadUri, { encoding: "utf8" }).catch(() => "");
        const clean = text.trim();
        if (clean.length > 20) {
          return { extractedText: clean.slice(0, MAX_CHARS), extracting: false, extractError: undefined, extractErrorCode: undefined };
        }
      }
      if (attempt < MAX_READ_ATTEMPTS && isRetryable(last.code)) {
        await new Promise((r) => setTimeout(r, 700 * attempt));
        continue;
      }
      break;
    }
  }

  return {
    extractErrorCode: last.code,
    extractError: extractFailureDetail(last.code, last.detail),
    extracting: false,
  };
}

/** Returns the fields to merge back onto the attachment. Never throws. */
export async function extractAttachment(a: Attachment): Promise<Partial<Attachment>> {
  try {
    // A camera/library photo, OR a picked file that's actually an image.
    if (a.kind === "image" || (a.kind === "document" && isImageFile(a))) {
      return await ocrImage(a.uri, a.mimeType);
    }
    if (a.kind === "document") return await readDocument(a);
    return { extracting: false }; // link / cv — nothing to extract on device
  } catch (err) {
    // Anything that reaches here is a bug in this file (a read that isn't
    // wrapped), and it used to vanish with no trace. Now it's logged with the
    // attachment's shape so it can actually be fixed from a field report.
    const { code, detail } = classify(err);
    reportError(err, {
      scope: "attachment-extract",
      kind: a.kind,
      name: a.name,
      mime: a.mimeType,
      size: a.size,
      code,
      detail,
    });
    return {
      extractErrorCode: code,
      extractError: extractFailureDetail(code, detail),
      extracting: false,
    };
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
    // The reason is stated for the model and it is told to relay THIS, not a
    // guess. It is also given the recovery step that actually works, so the
    // user isn't sent to retry the thing that just failed.
    const reason = a.extractErrorCode ? extractFailureDetail(a.extractErrorCode) : a.extractError ?? "unknown reason";
    return `- ${label}. YOU HAVE NO TEXT FROM THIS FILE. Reason: ${reason} Tell the user, in their language, that you could not read this specific file and give them exactly that reason and recovery step — do NOT invent a cause (do not blame their connection unless the reason says so).`;
  });
  return `[The user attached ${atts.length} item(s):\n${blocks.join("\n")}\n]`;
}
