import { describe, expect, it } from "vitest";
import {
  TTS_CLOUD_MODEL,
  clampTtsRate,
  ttsCloudConfigured,
  ttsCloudEnabled,
  ttsVoiceForLang,
} from "./cloud-config";

describe("ttsVoiceForLang", () => {
  it("maps English and Swahili to their voices", () => {
    expect(ttsVoiceForLang("en-US")).toBe("21m00Tcm4TlvDq8ikWAM");
    expect(ttsVoiceForLang("sw-TZ")).toBe("21m00Tcm4TlvDq8ikWAM");
  });

  it("falls back to the English voice for unknown languages", () => {
    expect(ttsVoiceForLang("xx-XX")).toBe("21m00Tcm4TlvDq8ikWAM");
    expect(ttsVoiceForLang("")).toBe("21m00Tcm4TlvDq8ikWAM");
  });

  it("is case-insensitive on the language code", () => {
    expect(ttsVoiceForLang("EN-gb")).toBe("21m00Tcm4TlvDq8ikWAM");
    expect(ttsVoiceForLang("Sw")).toBe("21m00Tcm4TlvDq8ikWAM");
  });
});

describe("clampTtsRate", () => {
  it("clamps into the supported range", () => {
    expect(clampTtsRate(0.1)).toBe(0.5);
    expect(clampTtsRate(10)).toBe(2);
    expect(clampTtsRate(1)).toBe(1);
    expect(clampTtsRate(1.5)).toBe(1.5);
  });

  it("coerces degenerate input to the default rate", () => {
    expect(clampTtsRate(Number.NaN)).toBe(1);
    expect(clampTtsRate(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("env gating", () => {
  it("is deterministic about the model id", () => {
    expect(TTS_CLOUD_MODEL).toBe("eleven_multilingual_v2");
  });

  it("enabled/configured flags read the env without throwing in tests", () => {
    // No flags in the test env → both false (graceful off by default).
    expect(ttsCloudEnabled()).toBe(false);
    expect(ttsCloudConfigured()).toBe(false);
  });
});
