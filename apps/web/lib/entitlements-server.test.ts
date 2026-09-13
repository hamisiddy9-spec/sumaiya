import { describe, expect, it } from "vitest";
import { premiumViewOf } from "./entitlements-server";

// premiumViewOf is the pure seam between the server subject and the JSON the
// client hook reads, so it is the one part of entitlements-server that needs no
// database. (subjectForUser itself is exercised through the API contract.)

describe("premiumViewOf()", () => {
  it("reports a live window as premium, serialised to ISO", () => {
    const until = new Date(Date.now() + 7 * 86_400_000);
    const view = premiumViewOf({ userId: "u_1", premiumUntil: until });
    expect(view.premium).toBe(true);
    expect(view.premiumUntil).toBe(until.toISOString());
  });

  it("passes an ISO string through unchanged", () => {
    const iso = new Date(Date.now() + 86_400_000).toISOString();
    expect(premiumViewOf({ userId: "u_1", premiumUntil: iso })).toEqual({
      premium: true,
      premiumUntil: iso,
    });
  });

  it("reports an expired window as not premium but still returns the date", () => {
    const iso = new Date(Date.now() - 86_400_000).toISOString();
    expect(premiumViewOf({ userId: "u_1", premiumUntil: iso })).toEqual({
      premium: false,
      premiumUntil: iso,
    });
  });

  it("handles a guest with no window", () => {
    expect(premiumViewOf({ userId: null })).toEqual({
      premium: false,
      premiumUntil: null,
    });
  });

  it("handles an explicit null window", () => {
    expect(premiumViewOf({ userId: "u_1", premiumUntil: null })).toEqual({
      premium: false,
      premiumUntil: null,
    });
  });
});
