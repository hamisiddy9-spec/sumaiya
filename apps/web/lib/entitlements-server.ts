// entitlements-server — resolve an `EntitlementSubject` from a user id.
//
// `can()` in lib/entitlements.ts is deliberately pure and synchronous, which
// means somebody has to do the one I/O it needs: reading `profile.premium_until`
// (the referral-earned Premium window — see lib/referral.ts). That is this file,
// so every caller (the /api/entitlements route, the capability pipeline, a
// server page that already renders dynamically) resolves Premium the same way
// and none of them re-implement the query.

import { eq } from "drizzle-orm";
import { db, profile } from "@/lib/db";
import {
  allowed,
  isPremiumActive,
  type Capability,
  type EntitlementSubject,
} from "@/lib/entitlements";

/**
 * Build the subject for a signed-in user (or a guest when `userId` is null).
 *
 * One indexed lookup on the profile primary key. A missing profile row is NOT
 * an error — it means the user has never earned Premium, which is exactly the
 * free-tier answer we want.
 */
export async function subjectForUser(
  userId: string | null,
): Promise<EntitlementSubject> {
  if (!userId) return { userId: null };

  try {
    const [row] = await db
      .select({ premiumUntil: profile.premiumUntil })
      .from(profile)
      .where(eq(profile.id, userId))
      .limit(1);
    return { userId, premiumUntil: row?.premiumUntil ?? null };
  } catch (err) {
    // A database blip must not silently hand out Premium, and must not 500 a
    // page either — fall back to the free tier.
    console.error("[entitlements] premium lookup failed:", err);
    return { userId, premiumUntil: null };
  }
}

/** Convenience: resolve the subject and answer one capability. */
export async function canForUser(
  userId: string | null,
  capability: Capability,
): Promise<boolean> {
  return allowed(await subjectForUser(userId), capability);
}

/** The Premium-window view of a subject, for handing to the client. */
export function premiumViewOf(subject: EntitlementSubject): {
  premium: boolean;
  premiumUntil: string | null;
} {
  const until = subject.premiumUntil;
  return {
    premium: isPremiumActive(until),
    premiumUntil:
      until instanceof Date ? until.toISOString() : until ?? null,
  };
}
