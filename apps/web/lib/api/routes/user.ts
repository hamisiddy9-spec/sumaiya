import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getUserId } from "@/lib/api/auth";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { db, cv, coverLetter, businessCard, letter, payment, subscription, downloadLog, profile, aiUsage, application, atsScoreSnapshot, documentVersion, jobRecommendation, templateSubmission } from "@/lib/db";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export const userRoutes = new Hono()

  .get("/subscription", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    // Payments retired — every feature is free, so everyone is "premium".
    return c.json({ success: true, data: { isPremium: true, subscription: null } });
  })

  .post("/update-user", zValidator("json", updateSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = c.req.valid("json");
    if (Object.keys(body).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    try {
      // Update profile in our DB
      await db
        .insert(profile)
        .values({ id: userId, name: body.name ?? "", email: body.email ?? "", updatedAt: new Date() })
        .onConflictDoUpdate({ target: profile.id, set: { ...body, updatedAt: new Date() } });

      // Also update Supabase auth user metadata
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: { getAll: () => [], setAll: () => {} },
      });
      // Use service role for admin update if available, otherwise skip
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createServerClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          cookies: { getAll: () => [], setAll: () => {} },
          auth: { persistSession: false },
        });
        await adminClient.auth.admin.updateUserById(userId, {
          email: body.email,
          user_metadata: body.name ? { name: body.name } : undefined,
        });
      }

      return c.json({ success: true });
    } catch (err) {
      console.error("Update user error:", err);
      return c.json({ error: "Failed to update profile" }, 500);
    }
  })

  .post("/delete-user", async (c) => {
    const userId = await getUserId(c);
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    try {
      // GDPR / privacy: purge EVERY table keyed by userId, not just the main
      // doc types — otherwise the account is gone but quota rows, applications,
      // ATS snapshots, document versions, job recommendations and template
      // submissions survive forever as orphaned PII.
      await db.delete(aiUsage).where(eq(aiUsage.userId, userId));
      await db.delete(application).where(eq(application.userId, userId));
      await db.delete(atsScoreSnapshot).where(eq(atsScoreSnapshot.userId, userId));
      await db.delete(documentVersion).where(eq(documentVersion.userId, userId));
      await db.delete(jobRecommendation).where(eq(jobRecommendation.userId, userId));
      await db.delete(templateSubmission).where(eq(templateSubmission.userId, userId));
      await db.delete(downloadLog).where(eq(downloadLog.userId, userId));
      await db.delete(payment).where(eq(payment.userId, userId));
      await db.delete(subscription).where(eq(subscription.userId, userId));
      await db.delete(coverLetter).where(eq(coverLetter.userId, userId));
      await db.delete(businessCard).where(eq(businessCard.userId, userId));
      await db.delete(letter).where(eq(letter.userId, userId));
      await db.delete(cv).where(eq(cv.userId, userId));
      // user_profile cascades via FK onDelete:cascade when profile is deleted.
      await db.delete(profile).where(eq(profile.id, userId));

      // Delete Supabase auth user via service role
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createServerClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          cookies: { getAll: () => [], setAll: () => {} },
          auth: { persistSession: false },
        });
        await adminClient.auth.admin.deleteUser(userId);
      }

      return c.json({ success: true });
    } catch (err) {
      console.error("Delete user error:", err);
      return c.json({ error: "Failed to delete account" }, 500);
    }
  });
