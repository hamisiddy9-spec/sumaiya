import { describe, it, expect } from "vitest";
import { s, errorMsg, SERVER_ERROR_SW } from "./error-message";

describe("errorMsg — never render [object Object]", () => {
  it("surfaces Error.message", () => {
    expect(errorMsg(new Error("email rate limit exceeded"), false, "fallback")).toBe("email rate limit exceeded");
  });

  it("passes through plain strings", () => {
    expect(errorMsg("direct message", false, "fallback")).toBe("direct message");
    expect(errorMsg("", false, "fallback")).toBe("fallback");
    expect(errorMsg("   ", false, "fallback")).toBe("fallback");
  });

  it("unwraps object payloads", () => {
    expect(errorMsg({ message: "quota exceeded" }, false, "fallback")).toBe("quota exceeded");
    expect(errorMsg({ error: "server exploded" }, false, "fallback")).toBe("server exploded");
    expect(errorMsg({ code: 500, message: "boom" }, false, "fallback")).toBe("boom");
  });

  it("falls back for objects without a string message", () => {
    expect(errorMsg({}, false, "fallback")).toBe("fallback");
    expect(errorMsg({ code: 500 }, false, "fallback")).toBe("fallback");
    expect(errorMsg({ message: 42 }, false, "fallback")).toBe("fallback");
  });

  it("falls back for undefined/null/numbers and NEVER yields [object Object]", () => {
    for (const bad of [undefined, null, 42, NaN, { nested: { deep: true } }, ["a"], true]) {
      const out = errorMsg(bad, true, "Imeshindwa. Jaribu tena.");
      expect(out).toBe("Imeshindwa. Jaribu tena.");
      expect(out).not.toContain("[object Object]");
    }
  });

  it("uses the localized fallback", () => {
    expect(errorMsg(undefined, true, "Imeshindwa. Jaribu tena.")).toBe("Imeshindwa. Jaribu tena.");
    expect(errorMsg(undefined, false, "Something went wrong.")).toBe("Something went wrong.");
  });
});

describe("s — string-or-empty", () => {
  it("keeps strings, empties everything else", () => {
    expect(s("hello")).toBe("hello");
    expect(s(42)).toBe("");
    expect(s({ message: "x" })).toBe("");
    expect(s(null)).toBe("");
    expect(s(undefined)).toBe("");
  });
});

describe("errorMsg — the API's English never lands in a Swahili conversation", () => {
  // The shipped bug: the assistant's bubble rendered the raw server string
  // "AI is not configured." inside an otherwise Swahili thread
  // (docs/QA-WEB-JOURNEYS-2026-09-20.md D3).
  it("translates the provider-off error, however it arrives", () => {
    const sw = "Uandishi wa AI haupatikani kwa sasa. Jaribu tena baada ya muda mfupi.";
    expect(errorMsg("AI is not configured.", true, "fallback")).toBe(sw);
    expect(errorMsg({ error: "AI is not configured." }, true, "fallback")).toBe(sw);
    expect(errorMsg(new Error("AI is not configured."), true, "fallback")).toBe(sw);
    // A route that wraps the sentence still gets the Swahili.
    expect(errorMsg("Error: AI is not configured.", true, "fallback")).toBe(sw);
  });

  it("translates the other English route errors a chat can surface", () => {
    expect(errorMsg("Unauthorized", true, "fallback")).toBe("Kikao chako kimeisha. Ingia tena ili kuendelea.");
    expect(errorMsg("You've reached the free limit. Sign up free to keep going.", true, "fallback")).toContain("kikomo");
  });

  it("leaves English callers alone", () => {
    expect(errorMsg("AI is not configured.", false, "fallback")).toBe("AI is not configured.");
  });

  it("passes an unknown error through rather than hiding it", () => {
    // A new server string shows up untranslated (visible, fixable) instead of
    // being replaced by a vague fallback that hides what actually happened.
    expect(errorMsg("Some brand new server failure", true, "fallback")).toBe("Some brand new server failure");
  });

  it("never leaves English inside the Swahili translation it does return", () => {
    for (const key of Object.keys(SERVER_ERROR_SW)) {
      const out = SERVER_ERROR_SW[key];
      expect(out.trim().length).toBeGreaterThan(0);
      expect(out).not.toMatch(/ is not configured|please try again|Unauthorized/i);
    }
  });
});
