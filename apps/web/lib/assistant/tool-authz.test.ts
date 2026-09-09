import { describe, it, expect } from "vitest";
import { checkRowOwnership } from "./tool-authz";

// No DATABASE_URL in this suite: a lookup errors → fail OPEN (we can't prove a
// violation). The one thing that always blocks is a guest naming an owned row.

describe("checkRowOwnership", () => {
  it("passes through when no owned-resource arg is present", async () => {
    expect(await checkRowOwnership("u1", {}, undefined)).toBeNull();
    expect(await checkRowOwnership(null, { jobDescription: "x" }, undefined)).toBeNull();
  });

  it("blocks a guest that names an applicationId", async () => {
    expect(await checkRowOwnership(null, { applicationId: "app_1" }, undefined)).toBe("not_owner");
  });

  it("blocks a guest that names an existing doc target", async () => {
    expect(
      await checkRowOwnership(null, {}, { docId: "cv_1", docType: "cv", docExists: true }),
    ).toBe("not_owner");
  });

  it("does not enforce doc ownership for a not-yet-created doc", async () => {
    expect(
      await checkRowOwnership(null, {}, { docId: "cv_new", docType: "cv" }),
    ).toBeNull();
  });

  it("fails open for an authed user when the lookup can't run (no DB)", async () => {
    expect(await checkRowOwnership("u1", { applicationId: "app_1" }, undefined)).toBeNull();
  });
});
