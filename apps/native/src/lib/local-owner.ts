/**
 * WHO OWNS A LOCALLY-STORED CV — and how a guest's work follows them into an
 * account.
 *
 * Every CV row on the device carries an owner id (cvs.userId). Two rules make
 * guest mode work, and both live here so there is one answer to "where does a
 * guest's CV live?":
 *
 *   1. A signed-in user owns their rows by account id; everyone else owns them
 *      as GUEST_OWNER_ID. The CV list, the editor and the CV it saves must all
 *      agree on this. They used to disagree: the editor wrote `userId: "me"`
 *      while the list read the account id, so a CV saved offline was in the
 *      database and invisible in the app — the list said "you have no CVs"
 *      about a CV the user had just saved. That seam is why this file exists.
 *
 *   2. ON SIGN-IN, a guest's rows are moved to the account, never copied and
 *      never dropped: the row keeps its id, so re-owning it is a single write
 *      that cannot half-happen, and the CV is then queued for upload so it
 *      reaches the account even if the claim happens offline (a queue item is
 *      retried by the sync engine; nothing is lost if the upload fails).
 *
 * THE GUEST PATH NEVER NEEDS THE NETWORK. `claimGuestWork` is the only function
 * here that talks to the server, and it is only ever called once the person has
 * an account (which they cannot get without a network anyway).
 */
import { offlineStorage } from "@sumaiya/utils";
import type { CV } from "@sumaiya/types";

/** Owner id for everything made before there is an account. */
export const GUEST_OWNER_ID = "guest";

/**
 * Owner ids that mean "no account", from earlier versions of this app. Rows
 * written under them are still the guest's work; the claim below moves them
 * too, so a device that already holds one does not keep a CV the app can no
 * longer see.
 */
export const LEGACY_GUEST_OWNER_IDS: readonly string[] = ["signed-out"];

/** The only place the app decides which owner a local row belongs to. */
export function ownerIdFor(user: { id?: string | null } | null | undefined): string {
  const id = user?.id;
  return typeof id === "string" && id.length > 0 ? id : GUEST_OWNER_ID;
}

/** True when this owner id means "no account" (current or legacy). */
export function isGuestOwner(ownerId: string): boolean {
  return ownerId === GUEST_OWNER_ID || LEGACY_GUEST_OWNER_IDS.includes(ownerId);
}

/** Every CV on the device that belongs to nobody's account, current and legacy
 *  (deduped by id — a row can only have one owner, but a device may hold both
 *  spellings from different versions). */
export async function guestOwnedCvs(): Promise<CV[]> {
  const byId = new Map<string, CV>();
  for (const owner of [GUEST_OWNER_ID, ...LEGACY_GUEST_OWNER_IDS]) {
    try {
      const rows = await offlineStorage.getCVsOffline(owner);
      for (const cv of rows) byId.set(cv.id, cv);
    } catch {
      /* storage unavailable for this owner — try the next spelling */
    }
  }
  return [...byId.values()];
}

export interface ClaimResult {
  /** CVs now owned by the account (and queued for upload). */
  claimed: number;
  /** CVs the claim could not re-own. Their guest rows are untouched. */
  failed: number;
}

export interface ClaimDeps {
  listGuest: () => Promise<CV[]>;
  /** Move the row to the account. Same id → one atomic write. */
  reown: (cv: CV, userId: string) => Promise<void>;
  /** Get it to the server, one way or another (see defaultClaimDeps). */
  publish: (cv: CV, userId: string) => Promise<void>;
}

export const defaultClaimDeps: ClaimDeps = {
  listGuest: guestOwnedCvs,
  reown: (cv, userId) => offlineStorage.saveCVOffline({ ...cv, userId }),
  // Try the upload NOW (the person has just signed in, so there is a network),
  // and fall back to the sync queue — which the editor's sync loop retries —
  // if the server is unhappy. Either way the local row already belongs to the
  // account, so nothing is lost in the gap.
  //
  // Two attempts, because this runs in the same breath as the sign-in: the
  // fresh session token can still be in flight when the first request goes out
  // (the profile pull below retries for exactly this reason), and a CV that is
  // already the account's should not have to wait for the editor to be opened
  // before it reaches the server.
  publish: async (cv, userId) => {
    const { apiClient } = await import("./api-client");
    const owned = { ...cv, userId };
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1200));
      try {
        await apiClient.createCV({ ...owned, clientId: cv.id });
        return;
      } catch {
        /* last attempt falls through to the queue */
      }
    }
    await offlineStorage.addToSyncQueue({
      id: `claim_cv-${cv.id}-${Date.now()}`,
      cvId: cv.id,
      operation: "create_cv",
      data: owned,
      timestamp: Date.now(),
      retries: 0,
    } as never);
  },
};

/**
 * Move everything a guest built on this device onto the account they just
 * signed into. Safe to call on every sign-in: there is nothing to do once the
 * guest bucket is empty, and an upload is idempotent (the server upserts a CV
 * by (userId, clientId), and the clientId is the row's own local id).
 */
export async function claimGuestWork(
  userId: string,
  deps: ClaimDeps = defaultClaimDeps,
): Promise<ClaimResult> {
  const result: ClaimResult = { claimed: 0, failed: 0 };
  if (!userId || isGuestOwner(userId)) return result;

  let guests: CV[];
  try {
    guests = await deps.listGuest();
  } catch {
    return result;
  }

  for (const cv of guests) {
    try {
      await deps.reown(cv, userId);
      result.claimed += 1;
    } catch {
      // The re-own failed, so the row is still the guest's — which is exactly
      // what we want: a failed claim must never delete or half-move the CV.
      result.failed += 1;
      continue;
    }
    try {
      await deps.publish(cv, userId);
    } catch {
      // publish() queues its own retry; a throw here would only be storage
      // being unavailable, and the CV is already owned by the account.
    }
  }

  return result;
}

/** How many CVs this device holds for a given owner — the offline half of
 *  "is this person new?", used to skip the first-run wizard for someone who
 *  has just carried a CV in from guest mode. */
export async function countOwnedCvs(userId: string): Promise<number> {
  try {
    const rows = await offlineStorage.getCVsOffline(userId);
    return rows.length;
  } catch {
    return 0;
  }
}
