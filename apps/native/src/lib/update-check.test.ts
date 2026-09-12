import {
  compareVersions,
  isUpdateAvailable,
  parseVersion,
  shouldShowPrompt,
} from "./update-check";

describe("parseVersion", () => {
  it("parses plain and v-prefixed dotted versions", () => {
    expect(parseVersion("1.1.1")).toEqual([1, 1, 1]);
    expect(parseVersion("v1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("1.10.2")).toEqual([1, 10, 2]);
    expect(parseVersion("1.2")).toEqual([1, 2]);
    expect(parseVersion("1")).toEqual([1]);
  });
  it("rejects junk safely", () => {
    expect(parseVersion("")).toBeNull();
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion(undefined)).toBeNull();
    expect(parseVersion("latest")).toBeNull();
    expect(parseVersion("1.2.3.4")).toBeNull(); // >3 parts not expected
    expect(parseVersion("abc")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("compares numerically, not lexically", () => {
    expect(compareVersions("1.10.2", "1.9.9")).toBe(1);
    expect(compareVersions("1.9.9", "1.10.2")).toBe(-1);
    expect(compareVersions("1.2.0", "1.2")).toBe(0);
    expect(compareVersions("2", "1.9.9")).toBe(1);
  });
  it("fails safe on garbage (0, no prompt)", () => {
    expect(compareVersions("abc", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0", "latest")).toBe(0);
  });
});

describe("isUpdateAvailable", () => {
  it("true only when strictly newer", () => {
    expect(isUpdateAvailable("1.1.0", "1.1.1")).toBe(true);
    expect(isUpdateAvailable("1.1.1", "1.1.1")).toBe(false);
    expect(isUpdateAvailable("1.1.2", "1.1.1")).toBe(false);
    expect(isUpdateAvailable("1.1.1", "1.1.2")).toBe(true);
  });
});

describe("shouldShowPrompt", () => {
  it("prompts for a newer version not yet dismissed", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.1", null)).toBe(true);
    expect(shouldShowPrompt("1.1.0", "1.1.1", "1.1.0")).toBe(true); // dismissed older ≠ this one
  });
  it("does not re-nag a version the user dismissed", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.1", "1.1.1")).toBe(false);
  });
  it("never prompts when nothing newer or data is junk", () => {
    expect(shouldShowPrompt("1.1.1", "1.1.1", null)).toBe(false);
    expect(shouldShowPrompt("1.2.0", "1.1.1", null)).toBe(false);
    expect(shouldShowPrompt("1.1.0", "latest", null)).toBe(false);
    expect(shouldShowPrompt("1.1.0", "", null)).toBe(false);
  });

  // The reported bug: the sheet reappeared the moment the person had updated,
  // because the manifest still pointed at the build they had just installed.
  it("stays silent for a version already handed to the installer", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.1", null, "1.1.1")).toBe(false);
    expect(shouldShowPrompt("1.1.0", "1.1.2", null, "1.1.2")).toBe(false);
  });
  it("still surfaces a genuinely newer release after an install", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.2", null, "1.1.1")).toBe(true);
  });
  it("treats a missing delivery record as no record", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.1", null, null)).toBe(true);
    expect(shouldShowPrompt("1.1.0", "1.1.1", null, undefined)).toBe(true);
  });
});
