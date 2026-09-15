import { pickVersion } from "./pick-version";

describe("pickVersion", () => {
  it("takes the native (installed) version when it is present", () => {
    // The regression this pins: config-first ordering reported 1.6.10 on a
    // 1.6.15 install. The installed version must win.
    expect(pickVersion(["1.6.15", "1.6.10", undefined])).toBe("1.6.15");
  });

  it("falls back to the config version only when the native one is missing", () => {
    expect(pickVersion([undefined, "1.6.15", "1.0.0"])).toBe("1.6.15");
    expect(pickVersion([null, "1.6.15"])).toBe("1.6.15");
  });

  it("skips empty and whitespace-only candidates", () => {
    expect(pickVersion(["", "   ", "1.6.15"])).toBe("1.6.15");
    expect(pickVersion([null, undefined, ""])).toBe("0.0.0");
  });

  it("trims, so a padded value cannot reach the UI or a comparison", () => {
    expect(pickVersion(["  1.6.15  "])).toBe("1.6.15");
  });

  it("returns an obviously-wrong sentinel rather than a plausible version", () => {
    // "0.0.0" is chosen so a missing version is visibly broken instead of
    // silently claiming a real release.
    expect(pickVersion([])).toBe("0.0.0");
    expect(pickVersion([undefined])).toBe("0.0.0");
  });
});
