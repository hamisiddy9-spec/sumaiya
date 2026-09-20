/**
 * Pins the "wait for the photo to decode before rasterizing" step.
 *
 * The defect this guards against is invisible until it is expensive: the CV
 * photo is a base64 data URL swapped into React state, so the <img> element can
 * exist in the DOM — and the on-screen preview can look perfect — while its
 * pixels are still decoding. html2canvas draws whatever is there at that
 * instant, so the photo silently rasterizes BLANK in the PDF. The candidate
 * only finds out in the file they already sent to an employer.
 *
 * The other half of the contract matters just as much: this must never HANG an
 * export. A broken or unreachable image has to be given up on.
 */
import { describe, it, expect, vi } from "vitest";
import { waitForImages } from "./pdf";

interface FakeImg {
  decode?: () => Promise<void>;
  complete?: boolean;
  naturalWidth?: number;
  addEventListener?: (type: string, cb: () => void, opts?: unknown) => void;
}

function fakeEl(imgs: FakeImg[]) {
  return { querySelectorAll: () => imgs } as unknown as HTMLElement;
}

describe("waitForImages", () => {
  it("returns immediately when the element has no images at all", async () => {
    const started = Date.now();
    await waitForImages(fakeEl([]));
    expect(Date.now() - started).toBeLessThan(50);
  });

  it("awaits decode() on every image — this is what puts the photo on the canvas", async () => {
    const order: string[] = [];
    let release: (() => void) | null = null;
    const blocking = {
      decode: () =>
        new Promise<void>((res) => {
          release = () => {
            order.push("decoded");
            res();
          };
        }),
    };
    const done = waitForImages(fakeEl([blocking]), 5000).then(() => order.push("resolved"));

    // Give the pending decode a tick; the wait must still be outstanding.
    await Promise.resolve();
    expect(order).toEqual([]);

    release!();
    await done;
    expect(order).toEqual(["decoded", "resolved"]);
  });

  it("does not throw when a broken image rejects — it simply gives up on it", async () => {
    await expect(
      waitForImages(fakeEl([{ decode: () => Promise.reject(new Error("bad image")) }]), 500)
    ).resolves.toBeUndefined();
  });

  it("gives up after the timeout instead of hanging the export forever", async () => {
    const never = { decode: () => new Promise<void>(() => {}) };
    const started = Date.now();
    await waitForImages(fakeEl([never]), 60);
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(1500);
  });

  it("falls back to naturalWidth when decode() is unavailable (older Safari)", async () => {
    const loaded = { complete: true, naturalWidth: 600 };
    const started = Date.now();
    await waitForImages(fakeEl([loaded]), 1000);
    expect(Date.now() - started).toBeLessThan(100);
  });

  it("waits for a load event when decode() is missing and the image is not complete yet", async () => {
    let fire: (() => void) | null = null;
    const pending: FakeImg = {
      complete: false,
      naturalWidth: 0,
      addEventListener: (type, cb) => {
        if (type === "load") fire = cb;
      },
    };
    const order: string[] = [];
    const done = waitForImages(fakeEl([pending]), 5000).then(() => order.push("resolved"));
    await Promise.resolve();
    expect(order).toEqual([]);
    fire!();
    await done;
    expect(order).toEqual(["resolved"]);
  });

  it("survives a null element rather than throwing inside the export path", async () => {
    await expect(waitForImages(null as unknown as HTMLElement)).resolves.toBeUndefined();
  });

  it("waits on ALL images, not just the first", async () => {
    const seen: number[] = [];
    const mk = (n: number) => ({
      decode: async () => {
        await new Promise((r) => setTimeout(r, n));
        seen.push(n);
      },
    });
    await waitForImages(fakeEl([mk(30), mk(5), mk(15)]), 5000);
    expect(seen.sort((a, b) => a - b)).toEqual([5, 15, 30]);
  });
});
