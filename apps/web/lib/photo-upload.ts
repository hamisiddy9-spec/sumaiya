// Single source of truth for the CV profile photo pipeline.
//
// WHY THIS MODULE EXISTS
// A CV photo is stored as a base64 data URL in a Postgres `text` column
// (lib/db/schema.ts — `photo`), which means the stored string is ~1.37x the
// real image size, it travels inside every CV JSON payload, and it is written
// on every autosave. Storing what a phone camera produces (3-6 MB) is therefore
// not an option: on a 2G/3G connection in Tanzania that is minutes of upload,
// and it bloats every subsequent read of the document.
//
// So the photo is reduced IN THE BROWSER before it ever leaves the device:
// decode (honouring EXIF rotation, or a portrait photo arrives sideways),
// centre-crop to a SQUARE (the templates render it in a square/circle frame —
// see components/templates/template-utils.tsx PhotoCircle/PhotoSquare, which
// both use objectFit: "cover"), scale that square down, and encode as JPEG.
//
// This mirrors lib/upload-limits.ts: a small, client-safe module holding the
// caps plus the reasoning, so the editor, the PDF path and the tests all agree
// on one set of numbers instead of each hardcoding its own.
//
// This module must stay client-safe: no server-only imports, no node builtins.
// The crop arithmetic is split into the pure `computeSquareCrop` so it can be
// unit-tested in this project's node-only vitest environment (no canvas there).

/** The largest FILE the user may pick. Deliberately generous: a modern phone
 *  JPEG is often 4-8 MB and the user should not have to pre-shrink it by hand.
 *  This is NOT the stored size — the stored image is always re-encoded below. */
export const MAX_PHOTO_SOURCE_BYTES = 12 * 1024 * 1024;
export const MAX_PHOTO_SOURCE_MB = 12;

/** Longest edge of the STORED square image. 600px is ~2.5x the largest frame
 *  any template draws (the biggest photoSize in the template layer is 96px), so
 *  it stays sharp at 2x export scale (lib/pdf.ts resolveExportScale) without
 *  paying for pixels no layout can show. */
export const PHOTO_TARGET_MAX_DIM = 600;

/** JPEG quality for the stored image. 0.82 is the point where a headshot is
 *  visually indistinguishable from the source at these dimensions. */
export const PHOTO_JPEG_QUALITY = 0.82;

/** Hard ceiling on the STORED data URL. If a 600px JPEG at PHOTO_JPEG_QUALITY
 *  somehow exceeds this (a very noisy photo), the encoder steps down until it
 *  fits, so one bad photo cannot bloat every future autosave. */
export const MAX_PHOTO_STORED_BYTES = 400 * 1024;

/** Accepted source types. SVG is deliberately excluded: it is a script-carrying
 *  format and there is no reason to accept it for a headshot. */
export const PHOTO_ACCEPT_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** The `accept` attribute for the editor's file input, derived from the list
 *  above so the picker and the validator can never drift apart. */
export const PHOTO_ACCEPT_ATTR = PHOTO_ACCEPT_MIME.join(",");

export type PhotoUploadError = "too_large" | "unsupported_type" | "empty" | "decode_failed";

/** The shape the validator actually needs. A real `File` satisfies it
 *  structurally, and so does a plain object in a test. */
export interface PhotoSourceLike {
  type: string;
  size: number;
}

/**
 * Validate a picked file before spending any work decoding it.
 * Returns null when acceptable, otherwise the reason.
 */
export function validatePhotoFile(file: PhotoSourceLike): PhotoUploadError | null {
  if (!file || file.size <= 0) return "empty";
  if (file.size > MAX_PHOTO_SOURCE_BYTES) return "too_large";
  if (!(PHOTO_ACCEPT_MIME as readonly string[]).includes(file.type)) return "unsupported_type";
  return null;
}

export interface SquareCrop {
  /** Source rectangle to read from the decoded image. */
  sx: number;
  sy: number;
  /** Source rectangle size — always equal on both axes (a square region). */
  sw: number;
  sh: number;
  /** Size of the square actually drawn, after the scale-down. */
  out: number;
}

/**
 * The arithmetic behind the resize, with no browser APIs in it.
 *
 * A square region is taken from the CENTRE of the source (a headshot's subject
 * is centred, so cropping the long edge symmetrically is the sensible default
 * crop) and scaled so the long edge lands on `target`.
 *
 * Because the source region is square and the destination is square, the aspect
 * ratio is preserved exactly — this is what makes the result undistorted.
 */
export function computeSquareCrop(
  srcW: number,
  srcH: number,
  target: number = PHOTO_TARGET_MAX_DIM
): SquareCrop {
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) {
    throw new Error("computeSquareCrop: source dimensions must be positive numbers");
  }
  if (!Number.isFinite(target) || target <= 0) {
    throw new Error("computeSquareCrop: target must be a positive number");
  }
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) / 2;
  const sy = (srcH - side) / 2;
  // Never upscale: a 200px source stays 200px rather than being blown up to 600
  // and interpolated into mush on a 2x export.
  const out = Math.max(1, Math.round(Math.min(side, target)));
  return { sx, sy, sw: side, sh: side, out };
}

/**
 * Real byte size of a base64 data URL's payload (not the string length).
 * Used to report and to enforce MAX_PHOTO_STORED_BYTES.
 */
export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return 0;
  const payload = dataUrl.slice(comma + 1);
  if (payload.length === 0) return 0;
  let padding = 0;
  if (payload.endsWith("==")) padding = 2;
  else if (payload.endsWith("=")) padding = 1;
  const bytes = Math.floor((payload.length * 3) / 4) - padding;
  return Math.max(0, bytes);
}

/** Is this a safe image data URL to put in an <img src>?
 *
 * Strict on purpose. This value is interpolated into an *attribute* by the
 * string-templated HTML in lib/templates/native-provider.ts, so a value that
 * merely STARTS with `data:image/jpeg;base64,` is not enough — a trailing
 * `x" onerror="alert(1)` would break out of the attribute and become script.
 * The whole payload must therefore be base64 characters and nothing else.
 *
 * lib/templates/native-provider.ts imports this rather than keeping its own
 * copy, so the HTML path and the editor can never accept different values.
 */
export function isImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

export interface DownscaledPhoto {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/** Decode to something canvas can draw, honouring EXIF orientation. */
async function decodeSource(file: File): Promise<{ src: CanvasImageSource; w: number; h: number }> {
  // createImageBitmap with imageOrientation:"from-image" is the only way to get
  // EXIF rotation applied for free. Chrome/Firefox/Safari all support it; the
  // HTMLImageElement branch below is the fallback for anything older.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { src: bmp, w: bmp.width, h: bmp.height };
    } catch {
      /* fall through to the <img> path */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = url;
    });
    return { src: img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Reduce a picked file to a stored-ready square JPEG data URL.
 * Throws an Error whose `message` is a PhotoUploadError when validation fails.
 */
export async function downscalePhotoFile(file: File): Promise<DownscaledPhoto> {
  const invalid = validatePhotoFile(file);
  if (invalid) throw new Error(invalid);
  if (typeof document === "undefined") throw new Error("decode_failed");

  let decoded: { src: CanvasImageSource; w: number; h: number };
  try {
    decoded = await decodeSource(file);
  } catch {
    throw new Error("decode_failed");
  }

  const crop = computeSquareCrop(decoded.w, decoded.h);
  const canvas = document.createElement("canvas");
  canvas.width = crop.out;
  canvas.height = crop.out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("decode_failed");
  // White matte: a transparent PNG would otherwise encode to black in JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, crop.out, crop.out);
  ctx.drawImage(decoded.src, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.out, crop.out);
  if (typeof (decoded.src as ImageBitmap).close === "function") {
    (decoded.src as ImageBitmap).close();
  }

  // Step the quality down if a very noisy photo overshoots MAX_PHOTO_STORED_BYTES.
  let quality = PHOTO_JPEG_QUALITY;
  let dataUrl = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    dataUrl = encode(canvas, quality);
    if (estimateDataUrlBytes(dataUrl) <= MAX_PHOTO_STORED_BYTES) break;
    quality -= 0.15;
    if (quality < 0.3) {
      dataUrl = encode(canvas, 0.3);
      break;
    }
  }

  return { dataUrl, width: crop.out, height: crop.out, bytes: estimateDataUrlBytes(dataUrl) };
}
