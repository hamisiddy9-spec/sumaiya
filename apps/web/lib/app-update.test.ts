import { describe, it, expect } from "vitest";
import { compareVersions, notesFromBody, versionFromTag } from "@/lib/app-update";

describe("versionFromTag", () => {
  it("reads our own release tags", () => {
    expect(versionFromTag("mobile-v1.6.7")).toBe("1.6.7");
    expect(versionFromTag("  mobile-v2.0.0  ")).toBe("2.0.0");
  });

  it("ignores anything that isn't ours — other projects ship from the same repo", () => {
    expect(versionFromTag("mobile-v1.6")).toBeNull();
    expect(versionFromTag("mobile-v1.6.7-beta")).toBeNull();
    expect(versionFromTag("v1.6.7")).toBeNull();
    expect(versionFromTag("desktop-v1.6.7")).toBeNull();
    expect(versionFromTag("")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("sorts by number, not by string — 1.6.10 is newer than 1.6.9", () => {
    expect(compareVersions("1.6.10", "1.6.9")).toBeGreaterThan(0);
    expect(compareVersions("1.6.9", "1.6.10")).toBeLessThan(0);
    expect(compareVersions("1.6.7", "1.6.7")).toBe(0);
    expect(compareVersions("1.7.0", "1.6.99")).toBeGreaterThan(0);
  });
});

describe("notesFromBody", () => {
  const fallback = { en: "fallback en", sw: "fallback sw" };

  it("reads SW: and EN: blocks written with the release", () => {
    const body = "Release notes\nSW: Marekebisho mapya\nEN: New fixes";
    expect(notesFromBody(body, fallback)).toEqual({ en: "New fixes", sw: "Marekebisho mapya" });
  });

  it("keeps the shipped notes when the release body says nothing useful", () => {
    expect(notesFromBody(null, fallback)).toEqual(fallback);
    expect(notesFromBody("just a plain line", fallback)).toEqual(fallback);
  });

  it("falls back per language when only one block is present", () => {
    expect(notesFromBody("SW: Marekebisho", fallback)).toEqual({ en: "Marekebisho", sw: "Marekebisho" });
  });
});
