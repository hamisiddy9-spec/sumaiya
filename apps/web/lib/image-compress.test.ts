import { describe, it, expect, afterEach, vi } from "vitest";
import {
  fitPhotoDimensions,
  compressPhotoFile,
  PHOTO_MAX_WIDTH,
  PHOTO_JPEG_QUALITY,
} from "./image-compress";

describe("fitPhotoDimensions", () => {
  it("scales a portrait photo by width, keeping the ratio", () => {
    // The measured production row: a 1086x1448 PNG in a ~100px slot.
    const out = fitPhotoDimensions(1086, 1448);
    expect(out.width).toBe(PHOTO_MAX_WIDTH);
    expect(out.height).toBe(Math.round(1448 * (400 / 1086)));
    expect(Math.abs(out.width / out.height - 1086 / 1448)).toBeLessThan(0.002);
  });

  it("scales a landscape photo by width too — the cap is a WIDTH cap", () => {
    expect(fitPhotoDimensions(4000, 3000)).toEqual({ width: 400, height: 300 });
  });

  it("scales a square photo to a square", () => {
    expect(fitPhotoDimensions(2000, 2000)).toEqual({ width: 400, height: 400 });
  });

  it("NEVER upscales — an image already within the cap is untouched", () => {
    expect(fitPhotoDimensions(320, 240)).toEqual({ width: 320, height: 240 });
    expect(fitPhotoDimensions(400, 900)).toEqual({ width: 400, height: 900 });
  });

  it("honours an explicit maxWidth", () => {
    expect(fitPhotoDimensions(1000, 500, 100)).toEqual({ width: 100, height: 50 });
  });

  it("never rounds the short edge down to zero", () => {
    // 10000x1 scaled to 400 wide rounds the height to 0 without the clamp.
    const out = fitPhotoDimensions(10000, 1);
    expect(out.width).toBe(400);
    expect(out.height).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ["zero width", 0, 100],
    ["zero height", 100, 0],
    ["negative", -5, 100],
    ["NaN", Number.NaN, 100],
    ["Infinity", 100, Number.POSITIVE_INFINITY],
  ])("returns 0x0 for %s, so the caller fails loudly", (_label, w, h) => {
    expect(fitPhotoDimensions(w, h)).toEqual({ width: 0, height: 0 });
  });

  it("returns 0x0 when maxWidth itself is unusable", () => {
    expect(fitPhotoDimensions(800, 600, 0)).toEqual({ width: 0, height: 0 });
  });
});

/** Captures what the compression path asked the canvas to do. */
function stubPipeline(natural: { width: number; height: number }, close = () => {}) {
  const record = {
    canvas: null as null | { w: number; h: number },
    drawn: null as null | { w: number; h: number },
    fillStyle: null as null | string,
    format: undefined as string | undefined,
    quality: undefined as number | undefined,
  };

  vi.stubGlobal("createImageBitmap", async () => ({
    width: natural.width,
    height: natural.height,
    close,
  }));

  vi.stubGlobal("document", {
    createElement: () => {
      const el: Record<string, unknown> = { width: 0, height: 0 };
      el.getContext = () => ({
        set fillStyle(v: string) {
          record.fillStyle = v;
        },
        get fillStyle() {
          return record.fillStyle ?? "";
        },
        fillRect: () => {},
        drawImage: (_s: unknown, _x: number, _y: number, w: number, h: number) => {
          record.canvas = { w: el.width as number, h: el.height as number };
          record.drawn = { w, h };
        },
      });
      el.toDataURL = (format: string, quality?: number) => {
        record.format = format;
        record.quality = quality;
        return `data:${format};base64,STUB`;
      };
      return el;
    },
  });

  return record;
}

describe("compressPhotoFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("draws the fitted image into a canvas of the fitted size, as JPEG 0.7", async () => {
    const record = stubPipeline({ width: 1086, height: 1448 });

    const out = await compressPhotoFile(new File([new Uint8Array(4)], "p.png"));

    const expected = fitPhotoDimensions(1086, 1448);
    expect(record.canvas).toEqual({ w: expected.width, h: expected.height });
    expect(record.drawn).toEqual({ w: expected.width, h: expected.height });
    expect(record.format).toBe("image/jpeg");
    expect(record.quality).toBe(PHOTO_JPEG_QUALITY);
    expect(record.quality).toBe(0.7);
    expect(out).toBe("data:image/jpeg;base64,STUB");
  });

  it("fills white before drawing, because JPEG has no alpha channel", async () => {
    const record = stubPipeline({ width: 800, height: 800 });
    await compressPhotoFile(new File([new Uint8Array(4)], "transparent.png"));
    expect(record.fillStyle).toBe("#ffffff");
  });

  it("closes the decoded bitmap it opened", async () => {
    const close = vi.fn();
    stubPipeline({ width: 500, height: 500 }, close);
    await compressPhotoFile(new File([new Uint8Array(4)], "p.jpg"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("REJECTS an image whose dimensions cannot be read instead of storing it raw", async () => {
    // The regression guard: the old code handed the file's data URL straight to
    // the store, which is how a 1.9MB data URI reached the database.
    stubPipeline({ width: 0, height: 0 });
    await expect(
      compressPhotoFile(new File([new Uint8Array(4)], "broken.png")),
    ).rejects.toThrow(/unusable dimensions/);
  });
});
