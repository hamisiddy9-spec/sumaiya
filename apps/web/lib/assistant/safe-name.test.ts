import { describe, it, expect } from "vitest";
import { normalizeNameToken, isDeviceLikeName, safeFirstName } from "./safe-name";

describe("normalizeNameToken", () => {
  it("lowercases and collapses non-letters to single spaces", () => {
    expect(normalizeNameToken("  HiSense  TV ")).toBe("hisense tv");
    expect(normalizeNameToken("Android-TV")).toBe("android tv");
    expect(normalizeNameToken("")).toBe("");
  });
});

describe("isDeviceLikeName — the Hisense leak guard", () => {
  it("flags known device/brand tokens", () => {
    for (const bad of [
      "Hisense",
      "hisense",
      "Samsung",
      "Samsung TV",
      "AndroidTV",
      "Android TV",
      "smarttv",
      "Roku",
      "FireTV",
      "Chromecast",
      "Xiaomi",
      "LG",
      "bravia",
      "TCL",
      "nvidia shield",
    ]) {
      expect(isDeviceLikeName(bad), `should flag "${bad}"`).toBe(true);
    }
  });

  it("flags generic/placeholder tokens", () => {
    for (const bad of ["guest", "user", "unknown", "device", "smart", "tv", "browser", "anonymous", "null", "undefined", "na"]) {
      expect(isDeviceLikeName(bad), `should flag "${bad}"`).toBe(true);
    }
  });

  it("flags gibberish and junk-laden names", () => {
    expect(isDeviceLikeName("tv123")).toBe(true);
    expect(isDeviceLikeName("hisense-abc")).toBe(true);
    expect(isDeviceLikeName("a1b2c3")).toBe(true);
    expect(isDeviceLikeName("x")).toBe(true); // too short
    expect(isDeviceLikeName("thisisaverylongmetadatablobthatisnotaname")).toBe(true); // too long
    expect(isDeviceLikeName("user_123!@#")).toBe(true);
    expect(isDeviceLikeName("")).toBe(true); // empty = not usable
  });

  it("accepts real human first names", () => {
    for (const good of ["Hamis", "Aisha", "Neema", "Baraka", "Grace", "John", "Zawadi", "Ezekiel", "Mariamu"]) {
      expect(isDeviceLikeName(good), `should accept "${good}"`).toBe(false);
    }
  });
});

describe("safeFirstName — real fact store first, auth metadata only when human", () => {
  it("prefers the career-profile full name", () => {
    expect(safeFirstName("Aisha Mwakyusa", "Hisense", "aisha@example.com")).toBe("Aisha");
  });

  it("skips a device-like metadata name and falls through to email prefix", () => {
    expect(safeFirstName("", "Hisense", "hamis@example.com")).toBe("hamis");
  });

  it("returns empty when every candidate is device-like or junk", () => {
    expect(safeFirstName("", "Android TV", "androidtv@example.com")).toBe("");
    expect(safeFirstName("", "Hisense", "")).toBe("");
    expect(safeFirstName("", "", "")).toBe("");
    expect(safeFirstName(null, null, null)).toBe("");
  });

  it("uses a clean metadata name when there is no profile", () => {
    expect(safeFirstName("", "Neema", "neema@example.com")).toBe("Neema");
  });

  it("takes only the first word of a multi-word name", () => {
    expect(safeFirstName("Baraka Juma Said", "", "")).toBe("Baraka");
  });

  it("never lets a device name through even when it is the only candidate", () => {
    // Exact live repro from #259: smart-TV browser auto-fill.
    expect(safeFirstName("", "Hisense", "hisense@tv.local")).toBe("");
  });
});
