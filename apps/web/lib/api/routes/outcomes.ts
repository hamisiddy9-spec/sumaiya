import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { outcomeReport } from "@/lib/db/schema-outcome";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/id-generator";

/**
 * Outcome tracking API
 *
 * Purpose: Close the feedback loop by collecting user-reported outcomes
 * from CV/cover letter usage (got interview? offer? rejection?)
 *
 * This lets AI learn which CVs/formats/suggestions actually help users get hired
 */

const outcomeReportSchema = z.object({
  outcome: z.enum(["none_yet", "interview", "offer", "rejection", "not_sent"]),
  cvId: z.string().optional(),
  coverLetterId: z.string().optional(),
  companyName: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
  appliedVia: z.string().default("unknown"),
  aiHelpfulRating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().max(500).optional(),
});

export const outcomeRoutes = new Hono()
  /**
   * POST /api/outcomes
   *
   * Submit an outcome report for a CV/cover letter
   * Called after user downloads CV or after they report success
   *
   * Body: {
   *   outcome: "interview" | "offer" | "rejection" | "none_yet" | "not_sent",
   *   cvId?: "uuid",
   *   companyName?: "Acme Corp",
   *   aiHelpfulRating?: 1-5,
   *   feedbackText?: "This CV got me 3 interviews!"
   * }
   *
   * Returns: { success: true, outcomeId: "uuid" }
   */
  .post("/", zValidator("json", outcomeReportSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");
    const id = generateId();

    try {
      await db.insert(outcomeReport).values({
        id,
        userId,
        outcome: body.outcome,
        cvId: body.cvId || null,
        coverLetterId: body.coverLetterId || null,
        companyName: body.companyName || null,
        jobTitle: body.jobTitle || null,
        appliedVia: body.appliedVia,
        aiHelpfulRating: body.aiHelpfulRating || null,
        feedbackText: body.feedbackText || null,
        outcomeReportedAt: new Date(),
      });

      return c.json({
        success: true,
        outcomeId: id,
        message: "Thank you for helping us improve!",
      });
    } catch (error) {
      console.error("Failed to save outcome:", error);
      return c.json({ error: "Failed to save outcome" }, 500);
    }
  })

  /**
   * GET /api/outcomes/stats
   *
   * Get aggregate outcome statistics for the current user
   * Shows: total CVs, interviews, offers, conversion rates
   *
   * Returns: {
   *   cvCount: number,
   *   outcomesReported: number,
   *   interviewCount: number,
   *   offerCount: number,
   *   interviewRate: "23%",
   *   offerRate: "8%"
   * }
   */
  .get("/stats", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const outcomes = await db
        .select()
        .from(outcomeReport)
        .where(eq(outcomeReport.userId, userId));

      const interviewCount = outcomes.filter((o) => o.outcome === "interview").length;
      const offerCount = outcomes.filter((o) => o.outcome === "offer").length;
      const reportedCount = outcomes.filter((o) => o.outcome !== "none_yet" && o.outcome !== "not_sent").length;

      return c.json({
        success: true,
        data: {
          outcomesReported: outcomes.length,
          interviewCount,
          offerCount,
          interviewRate: reportedCount > 0 ? `${Math.round((interviewCount / reportedCount) * 100)}%` : "0%",
          offerRate: reportedCount > 0 ? `${Math.round((offerCount / reportedCount) * 100)}%` : "0%",
        },
      });
    } catch (error) {
      console.error("Failed to fetch outcome stats:", error);
      return c.json({ error: "Failed to fetch stats" }, 500);
    }
  })

  /**
   * PUT /api/outcomes/:outcomeId
   *
   * Update an existing outcome report
   * Called when user wants to change their earlier report
   */
  .put("/:outcomeId", zValidator("json", outcomeReportSchema.partial()), async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const outcomeId = c.req.param("outcomeId");
    const body = c.req.valid("json");

    try {
      // Verify ownership
      const existing = await db
        .select()
        .from(outcomeReport)
        .where(eq(outcomeReport.id, outcomeId));

      if (!existing.length || existing[0].userId !== userId) {
        return c.json({ error: "Not found" }, 404);
      }

      await db
        .update(outcomeReport)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(outcomeReport.id, outcomeId));

      return c.json({ success: true, outcomeId });
    } catch (error) {
      console.error("Failed to update outcome:", error);
      return c.json({ error: "Failed to update outcome" }, 500);
    }
  });
