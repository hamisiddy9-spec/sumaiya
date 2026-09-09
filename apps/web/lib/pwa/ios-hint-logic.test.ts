import { describe, expect, it } from "vitest";
import { isIOSSafari, isInAppBrowser, shouldShowIosHint } from "./ios-hint-logic";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPADOS_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const IG_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 Instagram 307.0.0.28.103";
const FB_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 FBAN/FBIOS;FBAV/430.0.0.28.103";
const DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("isIOSSafari", () => {
  it("detects iPhone Safari", () => {
    expect(isIOSSafari(IPHONE_SAFARI)).toBe(true);
  });

  it("detects iPadOS 13+ (Macintosh UA + touch)", () => {
    expect(isIOSSafari(IPADOS_SAFARI, 5)).toBe(true);
  });

  it("excludes Chrome/Firefox/Opera on iOS (they use the install banner)", () => {
    expect(isIOSSafari(IPHONE_CHROME)).toBe(false);
  });

  it("excludes Android and desktop Safari without touch", () => {
    expect(isIOSSafari(ANDROID)).toBe(false);
    expect(isIOSSafari(DESKTOP_SAFARI, 0)).toBe(false);
  });
});

describe("isInAppBrowser", () => {
  it("flags Instagram and Facebook webviews", () => {
    expect(isInAppBrowser(IG_WEBVIEW)).toBe(true);
    expect(isInAppBrowser(FB_WEBVIEW)).toBe(true);
  });

  it("does not flag plain Safari", () => {
    expect(isInAppBrowser(IPHONE_SAFARI)).toBe(false);
  });
});

describe("shouldShowIosHint", () => {
  it("shows once for iOS Safari, not installed, never dismissed", () => {
    expect(shouldShowIosHint(IPHONE_SAFARI, 5, false, null)).toBe(true);
    expect(shouldShowIosHint(IPADOS_SAFARI, 5, false, null)).toBe(true);
  });

  it("never shows when already installed (standalone)", () => {
    expect(shouldShowIosHint(IPHONE_SAFARI, 5, true, null)).toBe(false);
  });

  it("never re-shows after dismissal (one-time hint)", () => {
    expect(shouldShowIosHint(IPHONE_SAFARI, 5, false, "1700000000000")).toBe(false);
  });

  it("never shows in in-app browsers", () => {
    expect(shouldShowIosHint(IG_WEBVIEW, 5, false, null)).toBe(false);
    expect(shouldShowIosHint(FB_WEBVIEW, 5, false, null)).toBe(false);
  });

  it("never shows on Chrome-on-iOS, Android, or desktop", () => {
    expect(shouldShowIosHint(IPHONE_CHROME, 5, false, null)).toBe(false);
    expect(shouldShowIosHint(ANDROID, 5, false, null)).toBe(false);
    expect(shouldShowIosHint(DESKTOP_SAFARI, 0, false, null)).toBe(false);
  });
});
