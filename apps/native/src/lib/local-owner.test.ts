/**
 * A guest must not lose their work.
 *
 * The promise is narrow and testable: whatever a guest built is STILL THERE
 * when they sign in, and it belongs to the account afterwards. The failure mode
 * this guards against is the one the old code had — the editor wrote rows under
 * owner "me" while the CV list read the account id, so a CV the user had just
 * saved sat in the database and was invisible everywhere in the app.
 *
 * Two invariants, both asserted below:
 *   1. the row keeps its id (a re-own is one write on one row — nothing is
 *      copied, so nothing can be half-copied);
 *   2. a claim that fails changes NOTHING (a failed claim must never delete or
 *      half-move the CV; the guest's row stays exactly where it was).
 */
jest.mock("@sumaiya/utils", () => ({ offlineStorage: {} }));
jest.mock("./api-client", () => ({ apiClient: {} }));

import { offlineStorage } from "@sumaiya/utils";
import type { CV } from "@sumaiya/types";
import {
  GUEST_OWNER_ID,
  claimGuestWork,
  guestOwnedCvs,
  isGuestOwner,
  ownerIdFor,
  type ClaimDeps,
} from "./local-owner";

function makeCv(id: string, owner: string): CV {
  return {
    id,
    userId: owner,
    templateId: "classic",
    title: `CV ${id}`,
    data: {} as CV["data"],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

describe("ownerIdFor — one answer to 'whose CV is this on this device'", () => {
  it("uses the account id when there is one", () => {
    expect(ownerIdFor({ id: "8f2c-user" })).toBe("8f2c-user");
  });

  it("falls back to the guest bucket for nobody signed in", () => {
    expect(ownerIdFor(null)).toBe(GUEST_OWNER_ID);
    expect(ownerIdFor(undefined)).toBe(GUEST_OWNER_ID);
    expect(ownerIdFor({ id: "" })).toBe(GUEST_OWNER_ID);
  });

  it("treats the legacy 'signed-out' bucket as a guest, not as an account", () => {
    // Rows written under the old spelling are still the guest's work: the claim
    // moves them, and no account can ever be named that.
    expect(isGuestOwner("signed-out")).toBe(true);
    expect(isGuestOwner(GUEST_OWNER_ID)).toBe(true);
    expect(isGuestOwner("8f2c-user")).toBe(false);
  });
});

describe("guestOwnedCvs — reads every spelling of 'no account'", () => {
  const getCvs = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (offlineStorage as unknown as Record<string, unknown>).getCVsOffline = getCvs;
  });

  it("unions the current and legacy guest buckets, deduped by id", async () => {
    getCvs.mockImplementation(async (owner: string) =>
      owner === GUEST_OWNER_ID
        ? [makeCv("a", GUEST_OWNER_ID), makeCv("b", GUEST_OWNER_ID)]
        : [makeCv("b", "signed-out"), makeCv("c", "signed-out")],
    );

    const rows = await guestOwnedCvs();
    expect(rows.map((cv) => cv.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("returns nothing rather than throwing when storage is unavailable", async () => {
    getCvs.mockRejectedValue(new Error("Database not initialized"));
    await expect(guestOwnedCvs()).resolves.toEqual([]);
  });
});

describe("claimGuestWork — the move onto the account", () => {
  function depsFor(rows: CV[]) {
    const reowned: { id: string; userId: string }[] = [];
    const published: string[] = [];
    const deps: ClaimDeps = {
      listGuest: async () => rows,
      reown: async (cv, userId) => {
        reowned.push({ id: cv.id, userId });
      },
      publish: async (cv) => {
        published.push(cv.id);
      },
    };
    return { deps, reowned, published };
  }

  it("moves every guest CV onto the account, keeping each row's own id", async () => {
    const rows = [makeCv("a", GUEST_OWNER_ID), makeCv("b", GUEST_OWNER_ID)];
    const { deps, reowned, published } = depsFor(rows);

    const result = await claimGuestWork("8f2c-user", deps);

    expect(result).toEqual({ claimed: 2, failed: 0 });
    expect(reowned).toEqual([
      { id: "a", userId: "8f2c-user" },
      { id: "b", userId: "8f2c-user" },
    ]);
    // Uploaded as well, so the CV reaches the account itself and not only this
    // phone's copy of it.
    expect(published).toEqual(["a", "b"]);
  });

  it("leaves a CV alone when re-owning it fails — and never publishes it", async () => {
    const rows = [makeCv("a", GUEST_OWNER_ID), makeCv("b", GUEST_OWNER_ID)];
    const published: string[] = [];
    const deps: ClaimDeps = {
      listGuest: async () => rows,
      reown: async (cv) => {
        if (cv.id === "b") throw new Error("readonly database");
      },
      publish: async (cv) => {
        published.push(cv.id);
      },
    };

    const result = await claimGuestWork("8f2c-user", deps);

    // Reported, not hidden — and 'b' was not uploaded as if it had worked.
    expect(result).toEqual({ claimed: 1, failed: 1 });
    expect(published).toEqual(["a"]);
  });

  it("still claims locally when the upload cannot happen (offline sign-in)", async () => {
    // Local ownership is written first; publish() queues its own retry. A
    // publish failure must not undo the claim.
    const { deps, reowned } = depsFor([makeCv("a", GUEST_OWNER_ID)]);
    const failing: ClaimDeps = {
      ...deps,
      publish: async () => {
        throw new Error("offline");
      },
    };

    const result = await claimGuestWork("8f2c-user", failing);

    expect(result).toEqual({ claimed: 1, failed: 0 });
    expect(reowned).toEqual([{ id: "a", userId: "8f2c-user" }]);
  });

  it("refuses to claim onto a guest (or empty) id", async () => {
    const { deps, reowned } = depsFor([makeCv("a", GUEST_OWNER_ID)]);

    expect(await claimGuestWork(GUEST_OWNER_ID, deps)).toEqual({ claimed: 0, failed: 0 });
    expect(await claimGuestWork("", deps)).toEqual({ claimed: 0, failed: 0 });
    expect(reowned).toEqual([]);
  });

  it("is a no-op on a device with nothing built as a guest", async () => {
    const { deps, reowned } = depsFor([]);
    expect(await claimGuestWork("8f2c-user", deps)).toEqual({ claimed: 0, failed: 0 });
    expect(reowned).toEqual([]);
  });
});
