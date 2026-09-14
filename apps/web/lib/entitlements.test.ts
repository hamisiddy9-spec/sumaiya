import { describe, expect, it } from "vitest";
import {
  can,
  allowed,
  entitlementsFor,
  isPremiumActive,
  type Capability,
  type EntitlementSubject,
} from "./entitlements";

const guest: EntitlementSubject = { userId: null };
const user: EntitlementSubject = { userId: "u_1" };

describe("can()", () => {
  it("allows every free capability for a signed-in user", () => {
    const caps: Capability[] = [
      "cv.create",
      "cv.enhance",
      "cv.tailor",
      "ats.check",
      "assistant.chat",
      "doc.export",
    ];
    for (const c of caps) expect(can(user, c).allowed).toBe(true);
  });

  it("lets guests use the core building + AI flow (guest-first funnel)", () => {
    expect(can(guest, "cv.create").allowed).toBe(true);
    expect(can(guest, "cv.enhance").allowed).toBe(true);
    expect(can(guest, "ats.check").allowed).toBe(true);
    expect(can(guest, "doc.export").allowed).toBe(true);
  });

  it("blocks account-only capabilities for guests with a stable reason", () => {
    const r = can(guest, "application.track");
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("guest_only");
    expect(can(guest, "career.interview").reason).toBe("guest_only");
    expect(can(guest, "outcome.record").reason).toBe("guest_only");
  });

  it("honours explicit grants even against a rule", () => {
    const granted: EntitlementSubject = {
      userId: null,
      grants: ["application.track"],
    };
    expect(can(granted, "application.track").allowed).toBe(true);
  });

  it("rejects an unknown capability rather than allowing it", () => {
    const r = can(user, "does.notExist" as Capability);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("disabled");
  });
});

describe("allowed() / entitlementsFor()", () => {
  it("allowed() is the boolean of can()", () => {
    expect(allowed(user, "cv.create")).toBe(true);
    expect(allowed(guest, "application.track")).toBe(false);
  });

  it("entitlementsFor() returns a full capability map", () => {
    const map = entitlementsFor(user);
    expect(map["cv.create"]).toBe(true);
    expect(map["application.track"]).toBe(true);
    // guest map differs only on account-gated caps
    const gmap = entitlementsFor(guest);
    expect(gmap["cv.create"]).toBe(true);
    expect(gmap["application.track"]).toBe(false);
  });
});

// ─── template.premium — the first plan-gated capability ─────────────────────
//
// Referrals have always granted real Premium time (profile.premiumUntil, see
// lib/referral.ts) but nothing consulted it: `isPremiumActive` had zero call
// sites, so a referrer was congratulated on Premium and then locked out of the
// premium designs anyway. These pin the fix.

const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const premiumUser: EntitlementSubject = {
  userId: "u_1",
  premiumUntil: days(7),
};

describe("can() — template.premium", () => {
  it("is refused for a signed-in free user, with an upsell reason", () => {
    const r = can(user, "template.premium");
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("requires_plan");
  });

  it("is allowed for a user with a live earned Premium window (ISO string)", () => {
    expect(can({ userId: "u_1", premiumUntil: days(7).toISOString() }, "template.premium").allowed).toBe(true);
  });

  it("is allowed for a user with a live earned Premium window (Date)", () => {
    expect(can(premiumUser, "template.premium").allowed).toBe(true);
  });

  it("is refused again once the earned window has passed", () => {
    const expired = can({ userId: "u_1", premiumUntil: days(-1).toISOString() }, "template.premium");
    expect(expired.allowed).toBe(false);
    expect(expired.reason).toBe("requires_plan");
  });

  it("is refused when no window was ever earned (null / undefined)", () => {
    expect(can({ userId: "u_1", premiumUntil: null }, "template.premium").allowed).toBe(false);
    expect(can({ userId: "u_1" }, "template.premium").allowed).toBe(false);
  });

  it("is allowed on a paid plan even with no earned window", () => {
    expect(can({ userId: "u_1", plan: "pro" }, "template.premium").allowed).toBe(true);
  });

  it("honours an explicit grant", () => {
    expect(can({ userId: "u_1", grants: ["template.premium"] }, "template.premium").allowed).toBe(true);
  });

  it("answers a guest with the upsell, not 'sign in'", () => {
    // Deliberate: a guest tapping a premium design should hear "premium", and
    // earning Premium needs an account anyway — so `requires_plan` is the more
    // useful answer than `guest_only`.
    const r = can(guest, "template.premium");
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("requires_plan");
  });

  it("does not leak into the free capabilities", () => {
    // The gate must be surgical: adding it must not accidentally plan-gate the
    // rest of the product for free users.
    const map = entitlementsFor(user);
    expect(map["template.premium"]).toBe(false);
    expect(map["cv.create"]).toBe(true);
    expect(map["doc.export"]).toBe(true);
    expect(map["assistant.chat"]).toBe(true);
  });

  it("shows true in the map for a premium subject", () => {
    expect(entitlementsFor(premiumUser)["template.premium"]).toBe(true);
  });
});

describe("isPremiumActive()", () => {
  it("is false for absent or unparseable values", () => {
    expect(isPremiumActive(null)).toBe(false);
    expect(isPremiumActive(undefined)).toBe(false);
    expect(isPremiumActive("")).toBe(false);
  });

  it("is false at the exact expiry instant (boundary is exclusive)", () => {
    expect(isPremiumActive(new Date())).toBe(false);
  });

  it("is true one second before expiry and false one second after", () => {
    expect(isPremiumActive(new Date(Date.now() + 1000))).toBe(true);
    expect(isPremiumActive(new Date(Date.now() - 1000))).toBe(false);
  });
});
