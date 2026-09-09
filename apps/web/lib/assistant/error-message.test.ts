import { describe, it, expect } from "vitest";
import { s, errorMsg } from "./error-message";

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
