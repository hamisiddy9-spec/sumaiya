import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { MAX_PHOTO_CHARS } from "@/lib/api/photo-limits";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { db, userProfile, cv } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { careerProfileSchema, parseCareerProfile } from "@/types";
import { pickMostCompleteCv, parseCvLoose, stampProfileAllFacts } from "@/lib/career-profile/mapper";
import { ensureProfileRow, seedProfileFromCv } from "@/lib/career-profile/sync";
import { listPendingConfirmations, resolveConfirmations } from "@/lib/career-profile/confirmations";
// jsonb writes are pinned to text with an explicit cast — see lib/db/jsonb.ts
// for why a bare object would be stored as a JSON *string*.
import { jsonbParam } from "@/lib/db/jsonb";

const profileUpdateSchema = z.object({
  fullName: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  linkedin: z.string().max(500).optional(),
  website: z.string().max(500).optional(),
  photo: z.string().max(MAX_PHOTO_CHARS).optional(),
  summary: z.string().max(2000).optional(),
  emailNotifications: z.boolean().optional(),
  // Persisted so server-composed messages (push notifications from a cron
  // job) can be written in the right language — see schema.ts's comment.
  lang: z.enum(["en", "sw"]).optional(),
  // Privacy control for the feedback flywheel: true = record no outcome events.
  analyticsOptOut: z.boolean().optional(),
  // Career Profile — the full structured fact-set (source of truth). When
  // present this REPLACES the stored career profile wholesale (the client owns
  // the whole object). The non-destructive /backfill route is the only path
  // that merges; plain POST/PATCH here is an explicit full save.
  careerProfile: careerProfileSchema.optional(),
  // How the incoming careerProfile was authored. Defaults to "user-edited"
  // (Settings save). The Career Interview sends "interview". Both stamp every
  // fact with that provenance — user-authored facts are authoritative and no
  // derived fact (cv:/conversation) may ever silently overwrite them.
  careerProfileSource: z.enum(["user-edited", "interview", "conversation"]).optional(),
});

export const profileRoutes = new Hono()

  .get("/", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [existing] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    return c.json({
      success: true,
      data: existing ?? null,
    });
  })

  .post("/", zValidator("json", profileUpdateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    await ensureProfileRow(userId);

    // THE SPINE: a wholesale careerProfile save is the user (or interview)
    // authoring facts directly — stamp every fact so no derived fact can ever
    // silently overwrite it. Default: user-edited.
    const payload = { ...body } as Record<string, unknown>;
    if (body.careerProfile) {
      const source: string = body.careerProfileSource ?? "user-edited";
      payload.careerProfile = jsonbParam(stampProfileAllFacts(body.careerProfile, { source, confidence: 1 }));
      delete payload.careerProfileSource;
    }

    const [upserted] = await db
      .insert(userProfile)
      .values({
        id: userId,
        ...payload,
        updatedAt: new Date(),
      } as any)
      .onConflictDoUpdate({
        target: userProfile.id,
        set: { ...payload, updatedAt: new Date() } as any,
      })
      .returning();

    return c.json({ success: true, data: upserted });
  })

  // Fill-only-blanks seed. Used by CV import so an imported CV also populates
  // the shared profile — but NEVER overwrites a field the user already has, so
  // re-importing or importing after editing Settings can't clobber real data.
  .post("/seed", zValidator("json", profileUpdateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    await ensureProfileRow(userId);

    const [existing] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    // Keep only incoming fields that are non-empty AND currently blank on the
    // profile.
    const merged: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (v == null || v === "") continue;
      const cur = existing ? (existing as Record<string, unknown>)[k] : undefined;
      if (cur == null || cur === "") merged[k] = v;
    }

    if (Object.keys(merged).length === 0) {
      return c.json({ success: true, data: existing ?? null, filled: [] });
    }
    // jsonb: the same pin every other career_profile write uses — a bare
    // object here would be stored as a JSON *string*. See lib/db/jsonb.ts.
    if (merged.careerProfile !== undefined) merged.careerProfile = jsonbParam(merged.careerProfile);

    const [upserted] = await db
      .insert(userProfile)
      .values({ id: userId, ...merged, updatedAt: new Date() } as any)
      .onConflictDoUpdate({
        target: userProfile.id,
        set: { ...merged, updatedAt: new Date() } as any,
      })
      .returning();

    return c.json({ success: true, data: upserted, filled: Object.keys(merged) });
  })

  .patch("/", zValidator("json", profileUpdateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");

    const [existing] = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    // Same wholesale-stamp rule as POST: an explicit careerProfile save is a
    // user-authored write, never silently overwritten by derived facts.
    const payload = { ...body } as Record<string, unknown>;
    if (body.careerProfile) {
      const source: string = body.careerProfileSource ?? "user-edited";
      payload.careerProfile = jsonbParam(stampProfileAllFacts(body.careerProfile, { source, confidence: 1 }));
      delete payload.careerProfileSource;
    }

    if (!existing) {
      // Auto-create if not exists
      await ensureProfileRow(userId);
      const [created] = await db
        .insert(userProfile)
        .values({ id: userId, ...payload, updatedAt: new Date() } as any)
        .returning();
      return c.json({ success: true, data: created });
    }

    const [updated] = await db
      .update(userProfile)
      .set({ ...payload, updatedAt: new Date() } as any)
      .where(eq(userProfile.id, userId))
      .returning();

    return c.json({ success: true, data: updated });
  })

  // ── Backfill: populate the Career Profile from a CV (opt-in, non-destructive)
  // The one-way bridge from "my most complete CV" (or an explicit cvId) into
  // the profile. Uses mergeProfileFromCv — fills ONLY empty sections and blank
  // scalars, never overwrites facts the user already has. Existing CVs are
  // never modified; this only writes user_profile.career_profile.
  .post("/backfill", zValidator("json", z.object({
    cvId: z.string().min(1).max(64).optional(),
  }).optional()), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json") ?? {};

    // Source CV: explicit id (owner-checked) or the user's most complete one.
    let sourceCvId: string | null = null;
    let cvData: ReturnType<typeof parseCvLoose> | null = null;

    if (body.cvId) {
      const [doc] = await db
        .select({ id: cv.id, data: cv.data, updatedAt: cv.updatedAt })
        .from(cv)
        .where(and(eq(cv.id, body.cvId), eq(cv.userId, userId)))
        .limit(1);
      if (!doc) return c.json({ error: "CV not found" }, 404);
      sourceCvId = doc.id;
      cvData = parseCvLoose(doc.data);
    } else {
      const docs = await db
        .select({ id: cv.id, data: cv.data, updatedAt: cv.updatedAt })
        .from(cv)
        .where(eq(cv.userId, userId));
      const best = pickMostCompleteCv(docs);
      if (!best) return c.json({ error: "No CV found to backfill from" }, 404);
      sourceCvId = best.id;
      cvData = parseCvLoose(best.data);
    }

    if (!cvData) return c.json({ error: "Couldn't read CV data" }, 422);

    // THE SPINE: the same shared write path every other producer uses —
    // provenance-aware merge + stamp, non-destructive, never throws.
    const { filled } = await seedProfileFromCv(userId, cvData, {
      source: `cv:${sourceCvId}`,
      confidence: 1,
    });

    const [row] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    return c.json({
      success: true,
      data: row ?? null,
      backfilled: { sourceCvId, filled },
    });
  })

  // ── Confirmation trust loop (Phase 2, Workstream A) ────────────────────────
  // AI-drafted prose (summary, experience descriptions) is stamped
  // needs-confirmation. These two endpoints are the ONE resolution path every
  // surface (assistant prompt, Settings card, CV editor badge) writes through:
  // list what's pending, then accept/reject in one call.

  .get("/confirmations", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    const profile = row?.careerProfile ? parseCareerProfile(row.careerProfile) : null;
    return c.json({ success: true, data: listPendingConfirmations(profile) });
  })

  .post("/confirmations/resolve", zValidator("json", z.object({
    keys: z.array(z.string().min(1)).max(100),
    decision: z.enum(["accept", "reject"]),
  })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { keys, decision } = c.req.valid("json");
    await ensureProfileRow(userId);

    const [row] = await db
      .select({ careerProfile: userProfile.careerProfile })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);

    const profile = row?.careerProfile ? parseCareerProfile(row.careerProfile) : null;
    // Only ACTUALLY pending keys may be resolved — an arbitrary key must
    // never be stamped confirmed or have its value deleted. The pure
    // function enforces this too (defense in depth), but intersecting here
    // keeps the response's resolvedCount honest.
    const pendingKeys = new Set(listPendingConfirmations(profile).map((p) => p.key));
    const allowedKeys = keys.filter((k) => pendingKeys.has(k));
    const resolved = resolveConfirmations(profile, allowedKeys, decision);

    await db
      .update(userProfile)
      .set({ careerProfile: jsonbParam(resolved) as never, updatedAt: new Date() })
      .where(eq(userProfile.id, userId));

    const updated = listPendingConfirmations(resolved);

    // Outcome instrumentation (PR-1): trust-loop resolution — accept vs
    // reject. kinds are coarse categories, never the fact keys themselves.
    try {
      const { recordConfirmationResolved } = await import("@/lib/outcomes/events");
      const kinds = [...new Set(allowedKeys.map((k) =>
        k === "summary" ? "summary" : k.endsWith(".description") ? "experience" : "other",
      ))];
      await recordConfirmationResolved(db, userId, {
        decision,
        count: allowedKeys.length,
        kinds,
      });
    } catch {
      // instrumentation never breaks the flow
    }

    return c.json({ success: true, data: updated, resolvedCount: allowedKeys.length });
  });
