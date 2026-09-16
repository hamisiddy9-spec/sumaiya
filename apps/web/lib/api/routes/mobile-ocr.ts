import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { extractCvFields } from "@/lib/api/routes/mobile";

// POST /api/mobile/ocr — OCR a photo of a CV/document for the NATIVE app.
//
// Why a server route: React Native cannot run tesseract.js (it needs canvas +
// DOM). The native ScanScreen captures a photo, compresses it with
// expo-image-manipulator, and sends base64 here. We run the SAME tesseract.js
// engine the web app uses client-side, so both platforms share one OCR stack.
//
// Guards (all pure, unit-tested):
//   - max body size (4 MB base64 ≈ 3 MB image — Vercel serverless limit is 4.5 MB)
//   - reject non-JPEG/PNG/WebP data URLs
//   - refuse empty/undecodable payloads before tesseract ever spins up

const MAX_BASE64_BYTES = 4 * 1024 * 1024; // 4 MB base64 string
const OCR_TIMEOUT_MS = 15_000; // tesseract.js: target <3s for typical CV; 15s hard limit

const bodySchema = z.object({
  imageBase64: z.string().min(1).max(MAX_BASE64_BYTES),
});

/** Validate the base64 data URL prefix (pure — unit tested). */
export function sniffImageMime(dataUrl: string): string | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(dataUrl);
  return m ? m[1] : null;
}

/** Strip the data-URL prefix and return raw base64, or null if malformed. */
export function stripDataUrl(dataUrl: string): string | null {
  const idx = dataUrl.indexOf("base64,");
  if (idx < 0) return null;
  const raw = dataUrl.slice(idx + "base64,".length);
  return raw.length > 0 ? raw : null;
}

/** Estimate decoded byte length from a base64 string (pure — unit tested). */
export function base64DecodedBytes(b64: string): number {
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/** Minimal sanity gate so we don't feed garbage to tesseract (pure). */
export function isOcrTextUsable(text: string): boolean {
  const t = (text || "").trim();
  if (t.length < 20) return false; // too short to be a CV page
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  if (letters < 10) return false; // symbol soup / binary noise
  return true;
}

export const mobileOcrRoutes = new Hono()
  .post("/ocr", zValidator("json", bodySchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);

    const { imageBase64 } = c.req.valid("json");

    const mime = sniffImageMime(imageBase64);
    if (!mime) {
      return c.json({ success: false, error: "Image must be a data URL (image/jpeg|png|webp)" }, 400);
    }
    const raw = stripDataUrl(imageBase64)!;
    if (base64DecodedBytes(raw) < 1_000) {
      return c.json({ success: false, error: "Image payload is empty or too small" }, 400);
    }

    let text: string;
    try {
      text = await runOcr(raw, mime, OCR_TIMEOUT_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OCR failed";
      return c.json({ success: false, error: `OCR failed: ${msg}` }, 502);
    }

    if (!isOcrTextUsable(text)) {
      return c.json({ success: false, error: "Couldn't read text from that image — try a clearer photo" }, 422);
    }

    // Best-effort structured extraction on top of the raw OCR text. Not fatal
    // if it fails (no AI provider, quota, bad model output) — the client
    // already has `text` and can fall back to manual entry.
    let fields: unknown = null;
    try {
      fields = await extractCvFields(text, userId);
    } catch (e) {
      console.error("mobile OCR field extraction error:", e);
    }

    return c.json({ success: true, text: text.trim(), fields, confidence: fields ? 0.85 : null });
  });

// Lazy tesseract worker — created once per server instance, terminated after use.
async function runOcr(rawBase64: string, mime: string, timeoutMs: number): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const buffer = Buffer.from(rawBase64, "base64");

  const worker = await createWorker("eng");
  try {
    const timer = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), timeoutMs),
    );
    const recognize = (async () => {
      const { data } = await worker.recognize(buffer, {}, {});
      return data.text || "";
    })();
    return await Promise.race([recognize, timer]);
  } finally {
    await worker.terminate().catch(() => {});
  }
}
