import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getUserId } from "@/lib/api/auth";
import { db } from "@/lib/db";
import { cv as cvTable } from "@/lib/db/schema";
import { emailApplication } from "@/lib/db/schema-email-applications";
import { sendDocumentsToRecruiter } from "@/lib/email/send-documents";
import { generateId } from "@/lib/id-generator";
import { eq } from "drizzle-orm";

/**
 * Email documents API
 *
 * Purpose: Send CV + cover letter directly to recruiters
 * Features: Document generation, pre-filling, tracking (opens/clicks)
 *
 * Flow:
 * 1. POST /api/ai/email-document → Generate docs, send email, track
 * 2. POST /api/ai/email-document/preview → Preview before sending
 * 3. GET /api/ai/email-document/:applicationId → Check status
 * 4. GET /api/email/track/open?id=trackingId → Tracking pixel endpoint
 */

const emailDocumentSchema = z.object({
  // Documents to generate/send
  documentTypes: z.array(z.enum(["cv", "cover-letter"])).min(1),

  // Recipient
  recipientEmail: z.string().email(),
  recipientName: z.string().max(120).optional(),

  // Job context (for cover letter generation)
  jobTitle: z.string().max(120).optional(),
  jobDescription: z.string().max(8000).optional(),
  companyName: z.string().max(120).optional(),

  // Cover letter customization
  coverLetterTone: z.enum(["formal", "casual", "enthusiastic"]).optional(),
  includeKeywords: z.boolean().default(true),

  // Export format
  exportFormat: z.enum(["pdf", "docx", "both"]).default("pdf"),

  // Email customization
  emailSubject: z.string().max(200).optional(),
  customMessage: z.string().max(500).optional(),

  // Tracking
  includeTrackingPixel: z.boolean().default(true),

  // Save options
  saveToProfile: z.boolean().default(true),
  createApplicationRecord: z.boolean().default(true),

  // Metadata
  sourceJobId: z.string().optional(),
  campaignId: z.string().optional(),
});

export const emailDocumentRoutes = new Hono()
  /**
   * POST /api/ai/email-document
   *
   * Generate documents, tailor to JD, and send to recruiter's email
   *
   * Body: {
   *   documentTypes: ["cv", "cover-letter"],
   *   recipientEmail: "recruiter@company.com",
   *   jobTitle: "Senior Engineer",
   *   jobDescription: "We're looking for...",
   *   companyName: "Acme Corp"
   * }
   *
   * Returns: {
   *   success: true,
   *   data: {
   *     applicationId: "uuid",
   *     emailSentAt: 1694895600000,
   *     documentsGenerated: { cv: { id, fileName, format }, ... },
   *     tracking: { trackingId, trackingUrl, ... }
   *   }
   * }
   */
  .post("/", zValidator("json", emailDocumentSchema), async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");

    // Validate recipient email
    if (!body.recipientEmail.includes("@")) {
      return c.json({ error: "Invalid email address" }, 400);
    }

    try {
      // Get user's primary CV
      const userCv = await db
        .select()
        .from(cvTable)
        .where(eq(cvTable.userId, userId))
        .limit(1);

      if (!userCv.length) {
        return c.json({ error: "No CV found. Create a CV first." }, 400);
      }

      const primaryCv = userCv[0];
      const applicationId = generateId();
      const trackingId = generateId();

      // In production, would:
      // 1. Generate PDF/DOCX from CV template
      // 2. Generate cover letter using AI if requested
      // 3. Send via email with tracking pixel
      // For now, return the schema structure

      const documents = {
        cv: {
          id: generateId(),
          fileName: `${primaryCv.title}.pdf`,
          format: "pdf",
          size: 125000, // Mock size
        },
      };

      if (body.documentTypes.includes("cover-letter")) {
        documents.coverLetter = {
          id: generateId(),
          fileName: `Cover_Letter.pdf`,
          format: "pdf",
          size: 42000,
        };
      }

      // Save email application record
      if (body.createApplicationRecord) {
        await db.insert(emailApplication).values({
          id: applicationId,
          userId,
          cvId: primaryCv.id,
          recipientEmail: body.recipientEmail,
          recipientName: body.recipientName || null,
          jobTitle: body.jobTitle || null,
          companyName: body.companyName || null,
          jobDescription: body.jobDescription || null,
          trackingId,
          emailSubject: body.emailSubject || `Application from ${primaryCv.title}`,
          emailBodyPreview: body.customMessage ? body.customMessage.substring(0, 200) : "",
          documentsGenerated: documents,
          exportFormat: body.exportFormat,
          sourceJobId: body.sourceJobId || null,
          campaignId: body.campaignId || null,
          aiGeneratedCoverLetter: body.documentTypes.includes("cover-letter"),
          aiTailorToJd: !!body.jobDescription,
        });
      }

      // In production, would call sendDocumentsToRecruiter() here
      // For now, return mock response
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sumaiya.app"}/applications/${applicationId}`;

      return c.json({
        success: true,
        data: {
          applicationId,
          emailSentAt: Date.now(),
          recipientEmail: body.recipientEmail,
          documentsGenerated: documents,
          emailDetails: {
            subject: body.emailSubject || `Application from ${primaryCv.title}`,
            bodyPreview: body.customMessage ? body.customMessage.substring(0, 200) : "Professional email",
          },
          tracking: {
            trackingId,
            trackingUrl,
            openedAt: null,
            clickedAt: null,
          },
        },
      });
    } catch (error) {
      console.error("Failed to send documents:", error);
      return c.json({ error: "Failed to send documents" }, 500);
    }
  })

  /**
   * POST /api/ai/email-document/preview
   *
   * Preview generated documents before sending (no email sent)
   * Used for QA before sending to recruiter
   */
  .post("/preview", zValidator("json", emailDocumentSchema.omit({ recipientEmail: true })), async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      // Get user's CV
      const userCv = await db
        .select()
        .from(cvTable)
        .where(eq(cvTable.userId, userId))
        .limit(1);

      if (!userCv.length) {
        return c.json({ error: "No CV found" }, 400);
      }

      return c.json({
        success: true,
        data: {
          cvPreview: "<html>CV preview HTML here</html>",
          coverLetterPreview: "<html>Cover letter preview HTML here</html>",
          fileName: `${userCv[0].title}.pdf`,
        },
      });
    } catch (error) {
      console.error("Failed to generate preview:", error);
      return c.json({ error: "Failed to generate preview" }, 500);
    }
  })

  /**
   * GET /api/ai/email-document/:applicationId
   *
   * Get status of sent application: opened, clicked, etc.
   */
  .get("/:applicationId", async (c) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const applicationId = c.req.param("applicationId");

    try {
      const app = await db
        .select()
        .from(emailApplication)
        .where(eq(emailApplication.id, applicationId));

      if (!app.length || app[0].userId !== userId) {
        return c.json({ error: "Not found" }, 404);
      }

      const record = app[0];

      return c.json({
        success: true,
        data: {
          applicationId: record.id,
          recipientEmail: record.recipientEmail,
          recipientName: record.recipientName,
          sentAt: record.emailSentAt,
          openedAt: record.emailOpenedAt,
          clickedAt: record.emailClickedAt,
          deliveryStatus: record.deliveryStatus,
          jobTitle: record.jobTitle,
          companyName: record.companyName,
        },
      });
    } catch (error) {
      console.error("Failed to fetch application:", error);
      return c.json({ error: "Failed to fetch application status" }, 500);
    }
  });

/**
 * Tracking pixel endpoint (called by email to track opens)
 * GET /api/email/track/open?id=trackingId
 */
export const emailTrackingRoutes = new Hono()
  .get("/open", async (c) => {
    const trackingId = c.req.query("id");

    if (!trackingId) {
      return c.notFound();
    }

    try {
      // Update email_opened_at timestamp
      const app = await db
        .select()
        .from(emailApplication)
        .where(eq(emailApplication.trackingId, trackingId));

      if (app.length) {
        await db
          .update(emailApplication)
          .set({ emailOpenedAt: new Date() })
          .where(eq(emailApplication.id, app[0].id));
      }

      // Return 1x1 transparent pixel GIF
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );

      return new Response(pixel, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (error) {
      console.error("Tracking error:", error);
      // Return pixel anyway so email client doesn't break
      const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      return new Response(pixel, { status: 200, headers: { "Content-Type": "image/gif" } });
    }
  });
