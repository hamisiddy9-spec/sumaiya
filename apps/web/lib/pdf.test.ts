import { describe, expect, it } from "vitest";
import { isIOSBrowser, resolveExportScale, resolvePdfDelivery } from "./pdf";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPADOS_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("isIOSBrowser", () => {
  it("detects iPhone / iPad / iPod UAs", () => {
    expect(isIOSBrowser(IPHONE_UA)).toBe(true);
    expect(isIOSBrowser(IPAD_UA)).toBe(true);
  });

  it("detects iPadOS 13+ (Macintosh UA + touch capability)", () => {
    expect(isIOSBrowser(IPADOS_UA, 5)).toBe(true);
  });

  it("does not flag iPadOS-style UA without touch (real Mac / desktop Safari)", () => {
    expect(isIOSBrowser(IPADOS_UA, 0)).toBe(false);
    expect(isIOSBrowser(IPADOS_UA)).toBe(false);
  });

  it("does not flag Android or desktop Chrome", () => {
    expect(isIOSBrowser(ANDROID_UA)).toBe(false);
    expect(isIOSBrowser(DESKTOP_UA)).toBe(false);
  });
});

describe("resolvePdfDelivery — the money moment", () => {
  it("iOS Safari with file-share support → OS share sheet (Save to Files etc.)", () => {
    expect(resolvePdfDelivery(IPHONE_UA, true)).toBe("share");
    expect(resolvePdfDelivery(IPAD_UA, true)).toBe("share");
  });

  it("iOS Safari without file-share → open in new tab (browser's own save)", () => {
    expect(resolvePdfDelivery(IPHONE_UA, false)).toBe("open");
  });

  it("Android / desktop keep the working blob-download path", () => {
    expect(resolvePdfDelivery(ANDROID_UA, true)).toBe("download");
    expect(resolvePdfDelivery(ANDROID_UA, false)).toBe("download");
    expect(resolvePdfDelivery(DESKTOP_UA, false)).toBe("download");
  });
});

describe("resolveExportScale — low-end mobile OOM guard", () => {
  it("keeps the requested scale on desktop", () => {
    expect(resolveExportScale(2, DESKTOP_UA)).toBe(2);
    expect(resolveExportScale(3, DESKTOP_UA)).toBe(3);
  });

  it("caps 'high' (3) to 2 on any mobile", () => {
    expect(resolveExportScale(3, ANDROID_UA)).toBe(2);
    expect(resolveExportScale(3, IPHONE_UA)).toBe(2);
  });

  it("steps down on low-memory devices (deviceMemory < 4GB)", () => {
    expect(resolveExportScale(2, ANDROID_UA, 3)).toBe(1.5); // 2–3 GB → 1.5
    expect(resolveExportScale(3, ANDROID_UA, 3)).toBe(1.5);
    expect(resolveExportScale(2, ANDROID_UA, 1)).toBe(1); // < 2 GB → 1
  });

  it("never goes below 1", () => {
    expect(resolveExportScale(1, ANDROID_UA, 0.5)).toBe(1);
    expect(resolveExportScale(1, ANDROID_UA, 1)).toBe(1);
  });
});
