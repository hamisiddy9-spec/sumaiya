import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";

/**
 * User-reported outcomes from CV/cover letter usage
 * Tracks: did user get interview, offer, rejection, etc. after building document
 *
 * Schema: outcomes (user-reported CV outcomes for ML feedback loop)
 * Purpose: Close the feedback loop — know if our AI improvements actually help users get hired
 */

export const outcomeReport = pgTable("outcome_report", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Which document(s) this outcome is about
  cvId: text("cv_id"),
  coverLetterId: text("cover_letter_id"),

  // What happened: none_yet | interview | offer | rejection | not_sent
  outcome: text("outcome").notNull().default("none_yet"),

  // Context (optional) — helps AI learn what worked
  companyName: text("company_name"),
  jobTitle: text("job_title"),
  appliedVia: text("applied_via").default("unknown"), // "sumaiya-email", "linkedin", "indeed", "manual"

  // Timeline
  documentCreatedAt: timestamp("document_created_at").notNull().defaultNow(),
  applicationSentAt: timestamp("application_sent_at"),
  outcomeReportedAt: timestamp("outcome_reported_at").notNull().defaultNow(),

  // Interview details (if outcome = "interview")
  interviewDate: timestamp("interview_date"),
  interviewType: text("interview_type"), // "phone", "video", "in-person", "unknown"

  // Offer details (if outcome = "offer")
  offerAccepted: text("offer_accepted"), // "yes", "no", "pending"
  offerSalaryMin: integer("offer_salary_min"), // KES/USD
  offerSalaryMax: integer("offer_salary_max"),

  // User feedback on how helpful the AI was
  aiHelpfulRating: integer("ai_helpful_rating"), // 1-5 scale
  feedbackText: text("feedback_text"), // "This CV got me 3 interviews", etc.

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("outcome_user_idx").on(t.userId),
  cvIdx: index("outcome_cv_idx").on(t.cvId),
  outcomeIdx: index("outcome_outcome_idx").on(t.outcome),
}));

export type OutcomeReport = typeof outcomeReport.$inferSelect;
export type OutcomeReportInsert = typeof outcomeReport.$inferInsert;
