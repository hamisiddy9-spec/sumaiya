/**
 * How big a stored profile/CV photo may be.
 *
 * Both clients compress before upload — native resizes to 400px wide and
 * encodes JPEG q0.7 (~30–80 KB of base64); web does the same in the editor. So
 * this cap is deliberately generous headroom, not a target. It was 500
 * characters, which rejected every real photo with a validation error and made
 * "add your photo" silently impossible; a photo is data, and the schema has to
 * admit that.
 *
 * Roughly 300 KB of binary once the base64 wrapper is stripped — enough for a
 * good headshot, far too small to let a raw 5 MB camera upload through.
 */
export const MAX_PHOTO_CHARS = 400_000;
