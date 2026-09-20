/**
 * Pins the CV photo pipeline's arithmetic and its caps.
 *
 * The defect this protects against is silent: a photo that is stored at camera
 * resolution does not LOOK wrong in the editor, it just makes every autosave
 * and every CV load heavy — worst on exactly the slow connections Sumaiya's
 * users are on. And a non-square crop makes the face subtly stretched, which no
 * assertion about "the image exists" would ever catch.
 *
 * This suite runs in the project's node-only vitest environment, so it tests
 * the pure crop arithmetic directly and stubs the canvas for the DOM branch
 * rather than pretending a real browser is present.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PHOTO_ACCEPT_MIME,
  PHOTO_TARGET_MAX_DIM,
  MAX_PHOTO_SOURCE_BYTES,
  MAX_PHOTO_STORED_BYTES,
  computeSquareCrop,
  downscalePhotoFile,
  estimateDataUrlBytes,
  isImageDataUrl,
  validatePhotoFile,
} from "./photo-upload";

describe("validatePhotoFile", () => {
  it("accepts a normal phone JPEG", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 4 * 1024 * 1024 })).toBeNull();
  });

  it("rejects an empty file", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: 0 })).toBe("empty");
  });

  it("rejects a source above the pick cap", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: MAX_PHOTO_SOURCE_BYTES + 1 })).toBe(
      "too_large"
    );
  });

  it("accepts exactly the cap", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: MAX_PHOTO_SOURCE_BYTES })).toBeNull();
  });

  it("rejects SVG, which is script-carrying and has no business being a headshot", () => {
    expect(validatePhotoFile({ type: "image/svg+xml", size: 1024 })).toBe("unsupported_type");
  });

  it("accepts every advertised mime type", () => {
    for (const mime of PHOTO_ACCEPT_MIME) {
      expect(validatePhotoFile({ type: mime, size: 1024 })).toBeNull();
    }
  });
});

describe("computeSquareCrop", () => {
  it("takes a square region and preserves aspect exactly (no distortion)", () => {
    const c = computeSquareCrop(4000, 3000, 600);
    expect(c.sw).toBe(c.sh);
    expect(c.out).toBe(600);
    // Source region is square, destination is square => scale is 1:1 on both axes.
    expect(c.sw / c.out).toBeCloseTo(c.sh / c.out, 10);
  });

  it("crops symmetrically from the centre of the long edge", () => {
    const c = computeSquareCrop(4000, 3000, 600);
    expect(c.sx).toBe((4000 - 3000) / 2);
    expect(c.sy).toBe(0);
  });

  it("handles a portrait source the same way", () => {
    const c = computeSquareCrop(3000, 4000, 600);
    expect(c.sw).toBe(3000);
    expect(c.sx).toBe(0);
    expect(c.sy).toBe((4000 - 3000) / 2);
  });

  it("never upscales a small source into interpolation mush", () => {
    const c = computeSquareCrop(200, 200, 600);
    expect(c.out).toBe(200);
    expect(c.sw).toBe(200);
  });

  it("clamps the stored edge to the target for a huge source", () => {
    expect(computeSquareCrop(9000, 9000, PHOTO_TARGET_MAX_DIM).out).toBe(PHOTO_TARGET_MAX_DIM);
  });

  it("rejects nonsense dimensions instead of producing NaN geometry", () => {
    expect(() => computeSquareCrop(0, 100)).toThrow();
    expect(() => computeSquareCrop(100, 0)).toThrow();
    expect(() => computeSquareCrop(Number.NaN, 100)).toThrow();
    expect(() => computeSquareCrop(100, 100, 0)).toThrow();
  });
});

describe("estimateDataUrlBytes", () => {
  it("measures the payload, not the string, and accounts for '==' padding", () => {
    // "QQ==" is one byte.
    expect(estimateDataUrlBytes("data:image/jpeg;base64,QQ==")).toBe(1);
  });

  it("accounts for single '=' padding", () => {
    // "QQQ=" is two bytes.
    expect(estimateDataUrlBytes("data:image/jpeg;base64,QQQ=")).toBe(2);
  });

  it("handles an unpadded payload", () => {
    // "QUJD" is "ABC" => three bytes.
    expect(estimateDataUrlBytes("data:image/jpeg;base64,QUJD")).toBe(3);
  });

  it("is 0 for an empty or malformed value", () => {
    expect(estimateDataUrlBytes("data:image/jpeg;base64,")).toBe(0);
    expect(estimateDataUrlBytes("not-a-data-url")).toBe(0);
  });

  it("stays under a third of the raw string length for a real payload", () => {
    const payload = "A".repeat(4000);
    const bytes = estimateDataUrlBytes(`data:image/jpeg;base64,${payload}`);
    expect(bytes).toBe(3000);
    expect(bytes).toBeLessThan(payload.length);
  });
});

describe("isImageDataUrl", () => {
  it("accepts the encodings this pipeline produces", () => {
    expect(isImageDataUrl("data:image/jpeg;base64,/9j/4AAQ")).toBe(true);
    expect(isImageDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
    expect(isImageDataUrl("data:image/webp;base64,UklGRg==")).toBe(true);
  });

  it("rejects anything else, including a javascript: URL", () => {
    expect(isImageDataUrl("javascript:alert(1)")).toBe(false);
    expect(isImageDataUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(isImageDataUrl("https://example.com/a.jpg")).toBe(false);
    expect(isImageDataUrl(undefined)).toBe(false);
    expect(isImageDataUrl(123)).toBe(false);
  });

  it("rejects an image prefix carrying a non-base64 payload", () => {
    // The whole reason this check is strict: this value is interpolated into an
    // attribute in the provider's string-templated HTML, so a trailing quote
    // would break out of the attribute and become script.
    expect(isImageDataUrl('data:image/jpeg;base64,x" onerror="alert(1)')).toBe(false);
    expect(isImageDataUrl("data:image/jpeg;base64,<script>")).toBe(false);
    expect(isImageDataUrl("data:image/jpeg;base64,")).toBe(false);
    expect(isImageDataUrl("data:image/jpeg;base64,QUJD\nQUJD")).toBe(false);
    expect(isImageDataUrl("data:image/jpeg;base64,QUJD;base64,QUJD")).toBe(false);
  });

  it("accepts a payload with legitimate '=' padding", () => {
    expect(isImageDataUrl("data:image/jpeg;base64,QQ==")).toBe(true);
    expect(isImageDataUrl("data:image/jpeg;base64,QQQ=")).toBe(true);
  });
});

describe("downscalePhotoFile (canvas branch, stubbed)", () => {
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  let canvasWidth = 0;
  let canvasHeight = 0;
  let lastQuality: number | undefined;

  function stubDocument(encodedBytes: number) {
    const canvas = {
      get width() {
        return canvasWidth;
      },
      set width(v: number) {
        canvasWidth = v;
      },
      get height() {
        return canvasHeight;
      },
      set height(v: number) {
        canvasHeight = v;
      },
      getContext: () => ({ fillRect, drawImage, fillStyle: "" }),
      toDataURL: (_type: string, quality?: number) => {
        lastQuality = quality;
        return `data:image/jpeg;base64,${"A".repeat(encodedBytes)}`;
      },
    };
    vi.stubGlobal("document", { createElement: () => canvas });
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    canvasWidth = 0;
    canvasHeight = 0;
    lastQuality = undefined;
  });

  it("draws a square canvas at the target edge and reads a square source region", async () => {
    stubDocument(4);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() }))
    );

    const file = { type: "image/jpeg", size: 3 * 1024 * 1024 } as File;
    const result = await downscalePhotoFile(file);

    expect(canvasWidth).toBe(PHOTO_TARGET_MAX_DIM);
    expect(canvasHeight).toBe(PHOTO_TARGET_MAX_DIM);
    expect(result.width).toBe(PHOTO_TARGET_MAX_DIM);
    expect(result.height).toBe(PHOTO_TARGET_MAX_DIM);

    // drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh)
    const args = drawImage.mock.calls[0];
    expect(args[3]).toBe(args[4]); // square source region
    expect(args[5]).toBe(0); // destination origin
    expect(args[6]).toBe(0);
    expect(args[7]).toBe(PHOTO_TARGET_MAX_DIM);
    expect(args[8]).toBe(PHOTO_TARGET_MAX_DIM);
  });

  it("steps the JPEG quality down until the stored payload fits the cap", async () => {
    // 400KB cap; ~1.33 bytes per base64 char => >533k chars must be refused.
    stubDocument(600_000);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 800, height: 800, close: vi.fn() }))
    );

    const file = { type: "image/png", size: 512 * 1024 } as File;
    const result = await downscalePhotoFile(file);

    expect(lastQuality).toBeLessThan(0.82);
    expect(result.bytes).toBeGreaterThan(0);
    // Even in the pathological case the encoder never leaves the cap unenforced.
    expect(lastQuality).toBeGreaterThanOrEqual(0.3);
  });

  it("reports the stored byte size, not the base64 string length", async () => {
    stubDocument(400);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() }))
    );

    const file = { type: "image/jpeg", size: 1000 } as File;
    const result = await downscalePhotoFile(file);
    expect(result.bytes).toBe(300);
    expect(result.bytes).toBeLessThan(MAX_PHOTO_STORED_BYTES);
  });

  it("refuses an oversized file before doing any decode work", async () => {
    const openBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", openBitmap);
    const file = { type: "image/jpeg", size: MAX_PHOTO_SOURCE_BYTES + 1 } as File;
    await expect(downscalePhotoFile(file)).rejects.toThrow("too_large");
    expect(openBitmap).not.toHaveBeenCalled();
  });

  it("surfaces a decode failure rather than storing a broken image", async () => {
    stubDocument(4);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("bad bytes");
      })
    );
    vi.stubGlobal("URL", { createObjectURL: () => "blob:x", revokeObjectURL: () => {} });
    vi.stubGlobal(
      "Image",
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_v: string) {
          setTimeout(() => this.onerror?.(), 0);
        }
      }
    );
    const file = { type: "image/jpeg", size: 1000 } as File;
    await expect(downscalePhotoFile(file)).rejects.toThrow("decode_failed");
  });
});
