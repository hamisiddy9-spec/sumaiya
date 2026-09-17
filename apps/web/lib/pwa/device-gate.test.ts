import { describe, it, expect } from "vitest";
import {
  classifyDevice,
  shouldOfferPwaInstall,
  shouldShowInstallBanner,
} from "./install-prompt-logic";

const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; CTKS340F25102000240) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

describe("classifyDevice", () => {
  it("recognises Android", () => {
    expect(classifyDevice(ANDROID)).toBe("android");
  });

  it("recognises iPhone", () => {
    expect(classifyDevice(IPHONE)).toBe("ios");
  });

  it("recognises iPadOS, which reports itself as a Mac", () => {
    // iPadOS 13+ claims to be desktop Safari. Getting this wrong means offering
    // desktop behaviour to a tablet.
    expect(classifyDevice(IPAD_DESKTOP_UA)).toBe("ios");
  });

  it("treats Windows and Mac desktop as desktop", () => {
    expect(classifyDevice(WINDOWS)).toBe("desktop");
    expect(classifyDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("desktop");
  });

  it("survives a missing user agent", () => {
    expect(classifyDevice("")).toBe("desktop");
    expect(classifyDevice(undefined as unknown as string)).toBe("desktop");
  });
});

describe("what we are actually offering", () => {
  it("never offers the PWA install on Android — there is a real app there", () => {
    expect(shouldOfferPwaInstall("android")).toBe(false);
  });

  it("never offers it on iOS — beforeinstallprompt does not fire, the hint handles it", () => {
    expect(shouldOfferPwaInstall("ios")).toBe(false);
  });

  it("offers it on desktop, which has nothing else to install", () => {
    expect(shouldOfferPwaInstall("desktop")).toBe(true);
  });
});

describe("shouldShowInstallBanner — the device gate", () => {
  const fresh = { pathname: "/dashboard", dismissedAt: null, now: 1_700_000_000_000, standalone: false };

  it("suppresses the banner on Android even when every other condition passes", () => {
    expect(shouldShowInstallBanner(fresh.pathname, fresh.dismissedAt, fresh.now, fresh.standalone, "android")).toBe(false);
  });

  it("suppresses the banner on iOS", () => {
    expect(shouldShowInstallBanner(fresh.pathname, fresh.dismissedAt, fresh.now, fresh.standalone, "ios")).toBe(false);
  });

  it("still shows it on desktop when nothing else blocks it", () => {
    expect(shouldShowInstallBanner(fresh.pathname, fresh.dismissedAt, fresh.now, fresh.standalone, "desktop")).toBe(true);
  });

  it("keeps the existing path block on desktop", () => {
    expect(shouldShowInstallBanner("/assistant", null, fresh.now, false, "desktop")).toBe(false);
  });

  it("keeps the already-installed block on desktop", () => {
    expect(shouldShowInstallBanner("/dashboard", null, fresh.now, true, "desktop")).toBe(false);
  });

  it("defaults to desktop when no platform is passed (callers not yet updated)", () => {
    expect(shouldShowInstallBanner("/dashboard", null, fresh.now, false)).toBe(true);
  });
});
