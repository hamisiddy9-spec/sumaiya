import { describe, expect, it } from "vitest";
import {
  can,
  allowed,
  entitlementsFor,
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
