import { describe, expect, it } from "vitest";
import { micErrorKey, micErrorMessage } from "./mic-error";

describe("micErrorKey", () => {
  it("classifies permission-denied codes", () => {
    expect(micErrorKey("not-allowed")).toBe("denied");
    expect(micErrorKey("service-not-allowed")).toBe("denied");
    expect(micErrorKey("permission-denied")).toBe("denied");
  });

  it("classifies no-speech", () => {
    expect(micErrorKey("no-speech")).toBe("no-speech");
  });

  it("falls back to generic for anything else", () => {
    expect(micErrorKey("audio-capture")).toBe("generic");
    expect(micErrorKey("network")).toBe("generic");
    expect(micErrorKey("aborted")).toBe("generic");
    expect(micErrorKey("language-not-supported")).toBe("generic");
  });

  it("returns null when there is no error", () => {
    expect(micErrorKey(undefined)).toBeNull();
    expect(micErrorKey("")).toBeNull();
  });
});

describe("micErrorMessage", () => {
  it("gives actionable denial copy in EN and SW", () => {
    const en = micErrorMessage("not-allowed", false)!;
    const sw = micErrorMessage("not-allowed", true)!;
    expect(en).toContain("blocked");
    expect(en).toContain("settings");
    expect(sw).toContain("maikrofoni");
    expect(sw).toContain("mipangilio");
  });

  it("gives retry copy for no-speech in EN and SW", () => {
    expect(micErrorMessage("no-speech", false)).toContain("didn't hear");
    expect(micErrorMessage("no-speech", true)).toContain("Sikusikia");
  });

  it("gives a friendly generic fallback in EN and SW", () => {
    expect(micErrorMessage("audio-capture", false)).toContain("Try again");
    expect(micErrorMessage("audio-capture", true)).toContain("Jaribu tena");
  });

  it("never fabricates a message for a missing error", () => {
    expect(micErrorMessage(undefined, false)).toBeNull();
    expect(micErrorMessage(undefined, true)).toBeNull();
  });
});
