// Referral loop — server side (system blueprint — Stage 5).
//
// Word of mouth is the growth rail for a product bought by people who share one
// phone and one data bundle. One stable code per referrer; one claim per
// referred user; `activatedAt` stamped lazily once the referred user has built
// something real.

import "server-only";
import { customAlphabet, nanoid } from "nanoid";
import { and, eq, isNull, inArray, count } from "drizzle-orm";
import { db, referralCode, referralClaim, cv, profile } from "@/lib/db";
import { captureServer } from "@/lib/analytics/server";

// Unambiguous alphabet — no 0/O/1/I/l — so a code read aloud or typed on a
// cheap keypad still resolves.
const genCode = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 7);

/** Days of Sumaiya Premium granted to the referrer per activated friend. */
export const PREMIUM_DAYS_PER_REFERRAL = 7;

export function referralUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.templatehub.pro";
  return `${base}/?ref=${code}`;
}

export async function getOrCreateCode(userId: string): Promise<string> {
  const existing = await db
    .select({ code: referralCode.code })
    .from(referralCode)
    .where(eq(referralCode.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0].code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genCode();
    try {
      await db.insert(referralCode).values({ id: nanoid(), userId, code });
      return code;
    } catch {
      // unique collision on code, or a race on user_id — re-read and retry
      const row = await db
        .select({ code: referralCode.code })
        .from(referralCode)
        .where(eq(referralCode.userId, userId))
        .limit(1);
      if (row[0]) return row[0].code;
    }
  }
  throw new Error("could not allocate a referral code");
}

export type ClaimResult = { ok: true } | { ok: false; reason: "unknown_code" | "self" | "already_claimed" };

export async function claimReferral(code: string, referredUserId: string): Promise<ClaimResult> {
  const clean = code.trim().toLowerCase().slice(0, 16);
  if (!clean) return { ok: false, reason: "unknown_code" };

  const owner = await db
    .select({ userId: referralCode.userId })
    .from(referralCode)
    .where(eq(referralCode.code, clean))
    .limit(1);
  if (!owner[0]) return { ok: false, reason: "unknown_code" };
  if (owner[0].userId === referredUserId) return { ok: false, reason: "self" };

  const prior = await db
    .select({ id: referralClaim.id })
    .from(referralClaim)
    .where(eq(referralClaim.referredUserId, referredUserId))
    .limit(1);
  if (prior[0]) return { ok: false, reason: "already_claimed" };

  try {
    await db.insert(referralClaim).values({
      id: nanoid(),
      code: clean,
      referrerUserId: owner[0].userId,
      referredUserId,
    });
    captureServer(owner[0].userId, "referral_converted", {});
    return { ok: true };
  } catch {
    return { ok: false, reason: "already_claimed" };
  }
}

export interface ReferralStats {
  code: string;
  url: string;
  joined: number;
  activated: number;
  /** ISO timestamp, or null. Premium earned via referrals — see PREMIUM_DAYS_PER_REFERRAL. */
  premiumUntil: string | null;
}

export async function referralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateCode(userId);

  const claims = await db
    .select({ id: referralClaim.id, referredUserId: referralClaim.referredUserId, activatedAt: referralClaim.activatedAt })
    .from(referralClaim)
    .where(eq(referralClaim.referrerUserId, userId));

  // Lazy activation: a referred user is "activated" once they have a CV row.
  const pendingIds = claims.filter((c) => !c.activatedAt).map((c) => c.referredUserId);
  let newlyActivated = 0;
  let premiumUntil: Date | null = null;
  if (pendingIds.length) {
    const withCv = await db
      .select({ userId: cv.userId })
      .from(cv)
      .where(inArray(cv.userId, pendingIds))
      .groupBy(cv.userId);
    const activeSet = new Set(withCv.map((r) => r.userId));
    const toStamp = claims.filter((c) => !c.activatedAt && activeSet.has(c.referredUserId));
    if (toStamp.length) {
      await db
        .update(referralClaim)
        .set({ activatedAt: new Date() })
        .where(
          and(
            eq(referralClaim.referrerUserId, userId),
            isNull(referralClaim.activatedAt),
            inArray(referralClaim.referredUserId, toStamp.map((c) => c.referredUserId)),
          ),
        );
      newlyActivated = toStamp.length;
      premiumUntil = await grantPremiumDays(userId, PREMIUM_DAYS_PER_REFERRAL * toStamp.length);
    }
  }

  if (premiumUntil === null) {
    const row = await db.select({ premiumUntil: profile.premiumUntil }).from(profile).where(eq(profile.id, userId)).limit(1);
    premiumUntil = row[0]?.premiumUntil ?? null;
  }

  const activated = claims.filter((c) => c.activatedAt).length + newlyActivated;
  return { code, url: referralUrl(code), joined: claims.length, activated, premiumUntil: premiumUntil?.toISOString() ?? null };
}

/** Extends (or starts) a user's Premium window by `days`, stacking on top of
 *  any time still remaining rather than overwriting it. Returns the new
 *  expiry. Exported for the referral activation path and for tests. */
export async function grantPremiumDays(userId: string, days: number): Promise<Date> {
  const row = await db.select({ premiumUntil: profile.premiumUntil }).from(profile).where(eq(profile.id, userId)).limit(1);
  const now = new Date();
  const base = row[0]?.premiumUntil && row[0].premiumUntil > now ? row[0].premiumUntil : now;
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  await db.update(profile).set({ premiumUntil: next, updatedAt: now }).where(eq(profile.id, userId));
  captureServer(userId, "referral_premium_granted", { days, premiumUntil: next.toISOString() });
  return next;
}

// Small helper kept for symmetry with count() import (used by tests/aggregation).
export async function totalClaims(): Promise<number> {
  const r = await db.select({ n: count() }).from(referralClaim);
  return r[0]?.n ?? 0;
}
