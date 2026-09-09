import { describe, expect, it } from "vitest";
import { INSTALL_DISMISS_MS, isInstallBlockedPath, shouldShowInstallBanner } from "@/lib/pwa/install-prompt-logic";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("isInstallBlockedPath", () => {
  it("blocks routes with fixed bottom action bars (click-steal zones)", () => {
    expect(isInstallBlockedPath("/assistant")).toBe(true);
    expect(isInstallBlockedPath("/assistant?cv=abc")).toBe(true);
    expect(isInstallBlockedPath("/editor")).toBe(true);
    expect(isInstallBlockedPath("/editor/cv/try")).toBe(true);
    expect(isInstallBlockedPath("/import-cv")).toBe(true);
    expect(isInstallBlockedPath("/studio")).toBe(true);
  });

  it("allows marketing / dashboard routes where the banner may show", () => {
    expect(isInstallBlockedPath("/")).toBe(false);
    expect(isInstallBlockedPath("/templates")).toBe(false);
    expect(isInstallBlockedPath("/dashboard")).toBe(false);
    expect(isInstallBlockedPath("/pricing")).toBe(false);
    expect(isInstallBlockedPath("/sw/templates")).toBe(false);
    expect(isInstallBlockedPath("/tools")).toBe(false);
  });
});

describe("shouldShowInstallBanner", () => {
  it("shows when never dismissed", () => {
    expect(shouldShowInstallBanner("/", null, NOW, false)).toBe(true);
  });

  it("hides when dismissed within the window", () => {
    expect(shouldShowInstallBanner("/", String(NOW - DAY), NOW, false)).toBe(false);
  });

  it("re-shows after the dismissal window (timestamp, not a forever-flag)", () => {
    expect(shouldShowInstallBanner("/", String(NOW - INSTALL_DISMISS_MS - 1), NOW, false)).toBe(true);
  });

  it("never shows when already installed (standalone PWA window)", () => {
    expect(shouldShowInstallBanner("/", null, NOW, true)).toBe(false);
    expect(shouldShowInstallBanner("/", String(NOW - 100), NOW, true)).toBe(false);
  });

  it("never shows on blocked paths even when never dismissed", () => {
    expect(shouldShowInstallBanner("/assistant", null, NOW, false)).toBe(false);
    expect(shouldShowInstallBanner("/editor/cv/try", null, NOW, false)).toBe(false);
  });

  it("treats corrupt stored values as never dismissed", () => {
    expect(shouldShowInstallBanner("/", "garbage", NOW, false)).toBe(true);
    expect(shouldShowInstallBanner("/", "", NOW, false)).toBe(true);
  });
});
