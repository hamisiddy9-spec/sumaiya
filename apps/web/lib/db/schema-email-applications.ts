import { pgTable, text, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";

/**
 * Email applications: tracking when users send CVs/cover letters via email
 *
 * Schema: email_applications (user sends CV to recruiter via Sumaiya)
 * Purpose: Track recruiter engagement (opens, clicks) and application outcomes
 */

export const emailApplication = pgTable("email_application", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Documents sent
  cvId: text("cv_id"),
  coverLetterId: text("cover_letter_id"),

  // Recipient
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),

  // Job context
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  jobDescription: text("job_description"), // Full JD for AI analysis

  // Email tracking
  trackingId: text("tracking_id").notNull().unique(), // For pixel tracking
  emailSentAt: timestamp("email_sent_at").notNull().defaultNow(),
  emailOpenedAt: timestamp("email_opened_at"), // When tracking pixel was hit
  emailClickedAt: timestamp("email_clicked_at"), // When recipient clicked link
  clickedLinks: jsonb("clicked_links").default([]), // Track which links clicked

  // Documents exported
  documentsGenerated: jsonb("documents_generated").default({}), // { cv: { id, format }, coverLetter: { ... } }

  // Email content (for analysis/replay)
  emailSubject: text("email_subject"),
  emailBodyPreview: text("email_body_preview"), // First 200 chars

  // Deliverability
  deliveryStatus: text("delivery_status").default("pending"), // pending | delivered | bounced | complained
  deliveryError: text("delivery_error"),

  // Export format
  exportFormat: text("export_format").default("pdf"), // pdf | docx | both

  // Metadata
  sourceJobId: text("source_job_id"), // Link to job in database
  campaignId: text("campaign_id"), // UTM/tracking ID

  // AI enhancement details
  aiGeneratedCoverLetter: boolean("ai_generated_cover_letter").default(false),
  aiTailorToJd: boolean("ai_tailor_to_jd").default(false), // If AI tailored to JD

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("email_app_user_idx").on(t.userId),
  trackingIdx: index("email_app_tracking_idx").on(t.trackingId),
  emailIdx: index("email_app_email_idx").on(t.recipientEmail),
  deliveryIdx: index("email_app_delivery_idx").on(t.deliveryStatus),
  sentIdx: index("email_app_sent_idx").on(t.emailSentAt),
}));

export type EmailApplication = typeof emailApplication.$inferSelect;
export type EmailApplicationInsert = typeof emailApplication.$inferInsert;
