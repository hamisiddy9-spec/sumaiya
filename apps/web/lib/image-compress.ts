/**
 * Downscale + re-encode a picked image before it is stored in CV data.
 *
 * WHY THIS EXISTS: the CV photo is stored as a base64 data URI, and every
 * template with a photo slot inlines that URI into the rendered document. The
 * web editor used to store the picked file verbatim — read the file, hand the
 * data URL to the store, autosave. A measured production row proves the cost:
 * one 1086x1448 PNG (1.83 MB) became a 1.93 MB data URI, a 2.5 MB `cv` row, a
 * 2.5 MB rendered page, and a multi-megabyte PDF, for a slot that renders at
 * about 100px.
 *
 * The native app never had this problem: `compressPhotoUri()` has always gone
 * through expo-image-manipulator at 400px wide / JPEG 0.7. The two platforms
 * produced ~40 KB and ~1.9 MB photos for the same user action.
 *
 * The constants below deliberately mirror the native numbers so one CV looks
 * the same whichever platform wrote it. If you change them, change
 * apps/native/src/lib/pick-photo.ts in the same breath.
 *
 * The only guard the web path had was `file.size > 2MB` — which rejected the
 * user's file rather than shrinking it, and did nothing about the 2MB-to-base64
 * expansion (~4/3×) that happened immediately afterwards.
 */

/** Matches expo-image-manipulator's `resize: { width: 400 }` in the native app. */
export const PHOTO_MAX_WIDTH = 400;

/** Matches the native `compress: 0.7`. */
export const PHOTO_JPEG_QUALITY = 0.7;

/**
 * Largest picked file we will even attempt to decode. This is a bound on decode
 * memory, not a product rule — the output is compressed either way. A 2MB limit
 * still admits a 10000x10000 PNG, so this is deliberately a first gate only.
 */
export const PHOTO_MAX_INPUT_BYTES = 2 * 1024 * 1024;

/**
 * Scale `width`x`height` down so the width is at most `maxWidth`, preserving
 * aspect ratio. NEVER upscales: an image already narrower than `maxWidth` is
 * returned unchanged, because enlarging it would add bytes and no detail.
 *
 * Returns `{0, 0}` for input that cannot describe an image (zero, negative,
 * NaN, Infinity) so the caller can fail loudly instead of producing a 0-px
 * canvas that throws somewhere less informative.
 */
export function fitPhotoDimensions(
  width: number,
  height: number,
  maxWidth: number = PHOTO_MAX_WIDTH,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxWidth) ||
    width <= 0 ||
    height <= 0 ||
    maxWidth <= 0
  ) {
    return { width: 0, height: 0 };
  }
  if (width <= maxWidth) {
    return { width: Math.round(width), height: Math.max(1, Math.round(height)) };
  }
  const scale = maxWidth / width;
  return { width: Math.round(maxWidth), height: Math.max(1, Math.round(height * scale)) };
}

/** Draw a decoded source into a canvas at `size`, then return a JPEG data URI. */
function rasterize(
  source: CanvasImageSource,
  size: { width: number; height: number },
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("image-compress: no 2d context");

  // JPEG carries no alpha, and an unpainted canvas is transparent black — so a
  // transparent PNG would come out with a black background. Fill white first.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.drawImage(source, 0, 0, size.width, size.height);

  return canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY);
}

/** Fallback decode for engines without `createImageBitmap`'s options bag. */
async function decodeViaImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // The element has already decoded; the object URL is no longer needed.
    URL.revokeObjectURL(url);
  }
}

/**
 * Decode `file`, downscale it to at most `PHOTO_MAX_WIDTH`, and return a JPEG
 * data URI ready to store in `CVData.personal.photo`.
 *
 * Uses `createImageBitmap` with `imageOrientation: "from-image"` so a phone
 * photo shot in portrait is not stored sideways — the EXIF rotation is applied
 * to the pixels rather than trusted to survive the round trip. Falls back to an
 * `<img>` decode for engines that reject the options bag.
 *
 * Throws on anything it cannot process (not an image, corrupt, no canvas). The
 * caller must surface that: silently storing the raw file is the bug this
 * function exists to fix.
 */
export async function compressPhotoFile(file: File): Promise<string> {
  let source: CanvasImageSource;
  let natural: { width: number; height: number };
  let release: () => void = () => {};

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bitmap;
    natural = { width: bitmap.width, height: bitmap.height };
    release = () => bitmap.close();
  } catch {
    const img = await decodeViaImageElement(file);
    source = img;
    natural = { width: img.naturalWidth, height: img.naturalHeight };
  }

  try {
    const size = fitPhotoDimensions(natural.width, natural.height);
    if (!size.width || !size.height) {
      throw new Error(
        `image-compress: unusable dimensions ${natural.width}x${natural.height}`,
      );
    }
    return rasterize(source, size);
  } finally {
    release();
  }
}
