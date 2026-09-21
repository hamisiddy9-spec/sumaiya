/**
 * The one shared write-path that seeds the Career Profile from a CV (or a
 * conversation-built CV). Every producer — CV create/save/import, the
 * assistant's build-cv/build-doc, the Settings backfill button — funnels
 * through here so the merge rules and provenance stamps can never drift.
 *
 * Never throws: a profile-sync failure must not break the CV save that
 * triggered it (the CV is the primary artifact; the profile is a byproduct).
 */
import { db, profile, userProfile } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseCareerProfile } from "@/types";
import { mergeProfileFromCv, parseCvLoose, type Provenance } from "./mapper";
import { jsonbParam } from "@/lib/db/jsonb";

// user_profile.id is a FK to profile.id, and a profile row is only created
// lazily on the first Settings save. Ensure the parent row exists first.
export async function ensureProfileRow(userId: string) {
  await db.insert(profile).values({ id: userId }).onConflictDoNothing();
}

export interface SeedResult {
  filled: string[];
}

/**
 * Merge `cvData` into the user's Career Profile with the given provenance and
 * persist the result. Non-destructive + iron-rule respecting (see mapper).
 */
export async function seedProfileFromCv(
  userId: string,
  cvData: ReturnType<typeof parseCvLoose>,
  p: Provenance,
): Promise<SeedResult> {
  try {
    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    const existing = row?.careerProfile ? parseCareerProfile(row.careerProfile) : null;
    const { profile: merged, filled } = mergeProfileFromCv(existing, cvData, p);
    if (!filled.length) return { filled };

    await ensureProfileRow(userId);
    // jsonb: pinned to JSON text + an explicit cast (lib/db/jsonb.ts) — handed a
    // bare object, drizzle/postgres-js store a JSON *string* and every SQL jsonb
    // operator over the career profile reads NULL.
    await db
      .insert(userProfile)
      .values({ id: userId, careerProfile: jsonbParam(merged) as never, updatedAt: new Date() } as never)
      .onConflictDoUpdate({
        target: userProfile.id,
        set: { careerProfile: jsonbParam(merged) as never, updatedAt: new Date() } as never,
      });
    return { filled };
  } catch (e) {
    console.error("[profile-sync] seedProfileFromCv failed:", e);
    return { filled: [] };
  }
}
