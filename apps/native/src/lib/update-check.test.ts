import {
  compareVersions,
  isBelowFloor,
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

describe("isBelowFloor", () => {
  it("is false when there is no usable floor", () => {
    expect(isBelowFloor("1.6.11", undefined)).toBe(false);
    expect(isBelowFloor("1.6.11", null)).toBe(false);
    expect(isBelowFloor("1.6.11", "")).toBe(false);
    // Fails safe: a typo must never wall every user.
    expect(isBelowFloor("1.6.11", "latest")).toBe(false);
    expect(isBelowFloor("not-a-version", "1.1")).toBe(false);
  });

  it("is true only when the installed build is numerically below the floor", () => {
    expect(isBelowFloor("1.0.0", "1.1")).toBe(true);
    expect(isBelowFloor("1.1.0", "1.1")).toBe(false);
    expect(isBelowFloor("1.1.1", "1.1")).toBe(false);
  });

  // THE TRAP, pinned as a test so nobody "fixes" a version reset with a floor.
  // Measured: 1.6.11 is ABOVE 1.1, so a floor of "1.1" does not catch the very
  // builds a reset needs to reach. That is why `lineReset` exists.
  it("does NOT catch a higher-numbered installed build (why lineReset exists)", () => {
    expect(isBelowFloor("1.6.11", "1.1")).toBe(false);
    expect(shouldShowPrompt("1.6.11", "1.1", null, null, "1.1")).toBe(false);
  });
});

describe("shouldShowPrompt — a restarted version line", () => {
  // The real shape: installs are on 1.6.11, the product restarts at 1.1.
  // Without lineReset the prompt can never fire, because 1.1 is not "newer".
  it("prompts an off-line build even though the advertised version is lower", () => {
    expect(shouldShowPrompt("1.6.11", "1.1", null, null, null, true)).toBe(true);
  });

  it("still prompts a build that was previously dismissed", () => {
    // A user who tapped "Baadaye" on 1.6.11 is off the line and must be told.
    expect(shouldShowPrompt("1.6.11", "1.1", "1.6.11", null, null, true)).toBe(true);
  });

  it("self-terminates once the user is on the advertised build", () => {
    expect(shouldShowPrompt("1.1", "1.1", null, null, null, true)).toBe(false);
    expect(shouldShowPrompt("1.1.0", "1.1", null, null, null, true)).toBe(false);
  });

  // Documented limitation, pinned so it is a known trade-off and not a surprise:
  // while a reset is declared, "ahead of the manifest" is the ONLY signal for
  // "from the old numbering", so a build genuinely ahead of a stale manifest is
  // also prompted. The manifest must therefore advertise the newest build (it
  // already does), and `lineReset` must be unset once the fleet has moved.
  it("while a reset is declared, an ahead-of-manifest build is also prompted", () => {
    expect(shouldShowPrompt("1.1.3", "1.1", null, null, null, true)).toBe(true);
  });

  it("never re-nags a build already handed to the installer", () => {
    expect(shouldShowPrompt("1.6.11", "1.1", null, "1.1", null, true)).toBe(false);
  });

  it("stays silent when the advertised version is junk", () => {
    // compareVersions returns 0 for unparseable input, so this cannot fire.
    expect(shouldShowPrompt("1.6.11", "", null, null, null, true)).toBe(false);
    expect(shouldShowPrompt("1.6.11", "latest", null, null, null, true)).toBe(false);
  });

  it("leaves normal releases completely unchanged when no reset is declared", () => {
    expect(shouldShowPrompt("1.1.0", "1.1.1", null, null, null, false)).toBe(true);
    expect(shouldShowPrompt("1.1.1", "1.1.1", null, null, null, false)).toBe(false);
    expect(shouldShowPrompt("1.2.0", "1.1.1", null, null, null, false)).toBe(false);
    expect(shouldShowPrompt("1.1.0", "1.1.1", "1.1.1", null, null, false)).toBe(false);
    expect(shouldShowPrompt("1.1.0", "1.1.1", null, null, null, undefined)).toBe(true);
  });
});
