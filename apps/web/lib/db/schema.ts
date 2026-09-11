import {
  pgTable, text, timestamp, jsonb, integer, boolean,
  pgEnum, index, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

// ─── App Enums ────────────────────────────────────────────────────────────────

export const documentStatusEnum = pgEnum("document_status", ["draft", "complete"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active", "trialing", "cancelled", "expired", "past_due",
]);
export const planEnum = pgEnum("plan_type", ["trial", "monthly", "annual"]);
export const currencyEnum = pgEnum("currency_type", ["USD", "KES", "TZS"]);
export const letterTypeEnum = pgEnum("letter_type", [
  "reference", "resignation", "application",
  "employment-verification", "salary-increase", "promotion",
  "leave-of-absence", "job-offer", "appointment-confirmation",
  "termination", "business-proposal", "complaint",
  "apology", "inquiry", "authorization",
  "partnership-mou", "vacate-notice", "scholarship",
  "internship", "sponsorship",
  "quotation", "invoice", "letterhead",
]);

// ─── Profiles (extends Supabase auth.users) ───────────────────────────────────

export const profile = pgTable("profile", {
  id: text("id").primaryKey(), // references auth.users.id
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── CVs ─────────────────────────────────────────────────────────────────────

export const cv = pgTable("cv", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("My CV"),
  templateId: text("template_id").notNull().default("nakuru"),
  primaryColor: text("primary_color").notNull().default("#2563EB"),
  fontFamily: text("font_family").notNull().default("Inter"),
  data: jsonb("data").notNull().default({}),
  status: documentStatusEnum("status").notNull().default("draft"),
  downloadCount: integer("download_count").notNull().default(0),
  // ── Public share ("CV yako mtandaoni") ──
  // Opt-in, off by default. When on, the CV is served at /cv/<publicSlug>. The
  // link is unlisted + noindex (shareable, never in search). publicShowContact
  // lets the owner hide email/phone from the public page.
  isPublic: boolean("is_public").notNull().default(false),
  publicSlug: text("public_slug").unique(),
  publicShowContact: boolean("public_show_contact").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("cv_user_idx").on(t.userId),
  publicSlugIdx: index("cv_public_slug_idx").on(t.publicSlug),
}));

// ─── Cover Letters ────────────────────────────────────────────────────────────

export const coverLetter = pgTable("cover_letter", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  cvId: text("cv_id").references(() => cv.id, { onDelete: "set null" }),
  title: text("title").notNull().default("My Cover Letter"),
  templateId: text("template_id").notNull().default("classic"),
  primaryColor: text("primary_color").notNull().default("#2563EB"),
  fontFamily: text("font_family").notNull().default("Georgia, serif"),
  content: text("content").notNull().default(""),
  jobTitle: text("job_title"),
  companyName: text("company_name"),
  status: documentStatusEnum("status").notNull().default("draft"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("cover_letter_user_idx").on(t.userId),
}));

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  plan: planEnum("plan").notNull().default("trial"),
  status: subscriptionStatusEnum("status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  provider: text("provider"),
  pesapalOrderId: text("pesapal_order_id"),
  pesapalSubscriptionId: text("pesapal_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subscriptionId: text("subscription_id").references(() => subscription.id),
  amount: integer("amount").notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"),
  // Payment provider: "pesapal" (legacy) or "payme" (PayMe Africa). New rows
  // are "payme"; the default stays "pesapal" so historical rows read correctly.
  provider: text("provider").notNull().default("pesapal"),
  // Our merchant reference sent to the provider (TH-xxxxx), and the provider's
  // own transaction id returned on the callback. Generic across providers.
  providerRef: text("provider_ref"),
  providerTxnId: text("provider_txn_id"),
  pesapalOrderId: text("pesapal_order_id"),
  pesapalTrackingId: text("pesapal_tracking_id"),
  paymentMethod: text("payment_method"),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("payment_user_idx").on(t.userId),
}));

// ─── Business Cards ───────────────────────────────────────────────────────────

export const businessCard = pgTable("business_card", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("My Business Card"),
  templateId: text("template_id").notNull().default("classic"),
  primaryColor: text("primary_color").notNull().default("#1e293b"),
  data: jsonb("data").notNull().default({}),
  status: documentStatusEnum("status").notNull().default("draft"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("business_card_user_idx").on(t.userId),
}));

// ─── Letters ─────────────────────────────────────────────────────────────────

export const letter = pgTable("letter", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("My Letter"),
  letterType: letterTypeEnum("letter_type").notNull().default("reference"),
  templateId: text("template_id").notNull().default("formal"),
  primaryColor: text("primary_color").notNull().default("#1e293b"),
  data: jsonb("data").notNull().default({}),
  status: documentStatusEnum("status").notNull().default("draft"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("letter_user_idx").on(t.userId),
}));

// ─── Download Logs ────────────────────────────────────────────────────────────

export const downloadLog = pgTable("download_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull(),
  format: text("format").notNull().default("pdf"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── AI Usage (per-user daily quota) ──────────────────────────────────────────

export const aiUsage = pgTable("ai_usage", {
  userId: text("user_id").notNull(),
  day: text("day").notNull(), // YYYY-MM-DD (UTC)
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.day] }),
}));

// ─── User Profile (shared identity across all doc types) ──────────────────────

export const userProfile = pgTable("user_profile", {
  id: text("id").primaryKey().references(() => profile.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull().default(""),
  jobTitle: text("job_title").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  location: text("location").notNull().default(""),
  linkedin: text("linkedin").default(""),
  website: text("website").default(""),
  photo: text("photo").default(""),
  summary: text("summary").notNull().default(""),
  // The Career Profile — the single verified career fact-set (experience,
  // education, skills, certifications, languages, projects, achievements,
  // volunteer, references, preferences) that CVs are derived from. Stored as
  // one jsonb column so the migration is additive and existing rows are
  // untouched (NULL = empty profile). Shape: CareerProfile in types/index.ts.
  careerProfile: jsonb("career_profile").$type<import("@/types").CareerProfile | null>().default(null),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  // Privacy control for the feedback flywheel: when true, NO outcome events
  // are recorded for this user (the write path checks this flag per event).
  analyticsOptOut: boolean("analytics_opt_out").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Application Kits (CV + cover letter + JD grouped as one unit) ────────────

export const application = pgTable("application", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("My Application"),
  companyName: text("company_name").default(""),
  jobTitle: text("job_title").default(""),
  jobDescription: text("job_description").default(""),
  jobDescriptionUrl: text("job_description_url").default(""),
  cvId: text("cv_id").references(() => cv.id, { onDelete: "set null" }),
  coverLetterId: text("cover_letter_id").references(() => coverLetter.id, { onDelete: "set null" }),
  matchScore: integer("match_score"),
  // Structured JD intelligence (JobProfile) captured when the application was
  // created from a job description — deterministic, never AI-generated numbers.
  jobProfile: jsonb("job_profile"),
  status: text("status").notNull().default("draft"),
  appliedAt: timestamp("applied_at"),
  notes: text("notes").default(""),
  // Last time we emailed a follow-up nudge for this application, so the daily
  // cron reminds at most once per week per job instead of every day.
  followUpRemindedAt: timestamp("follow_up_reminded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("application_user_idx").on(t.userId),
}));

// ─── ATS Score History (score-over-time tracking) ─────────────────────────────

export const atsScoreSnapshot = pgTable("ats_score_snapshot", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull().default("cv"),
  userId: text("user_id").notNull(),
  score: integer("score").notNull(),
  checks: jsonb("checks").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  docIdx: index("ats_snapshot_doc_idx").on(t.documentId),
  userIdx: index("ats_snapshot_user_idx").on(t.userId),
}));

// ─── Document Version History ─────────────────────────────────────────────────
// A point-in-time snapshot of a document's full payload so a user can restore an
// earlier version after an edit (or an AI rewrite) they regret. Documents are
// stored as JSON blobs, so a "version" is just a copy of that payload plus the
// styling fields. Scoped per user; the app prunes to the most recent N per doc.
export const documentVersion = pgTable("document_version", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull().default("cv"), // cv | cover-letter | letter | business-card
  title: text("title").notNull().default(""),
  // Full restorable payload: { title, templateId, primaryColor, fontFamily, data }
  snapshot: jsonb("snapshot").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  docIdx: index("document_version_doc_idx").on(t.documentId),
  userIdx: index("document_version_user_idx").on(t.userId),
}));

// ─── Jobs (discovery feed) ────────────────────────────────────────────────────
// Curated/aggregated job listings shown to seekers, each scored against their CV.
// The wedge into the "middleman" position: no employers required to be useful —
// listings can be admin-curated to start, then employer-posted later.
//
// Lifecycle: draft → published → expiring → expired (plus rejected).
//   - published:   visible in the feed
//   - expiring:    application deadline within EXPIRING_WINDOW (3 days) — shown
//                  with a "closing soon" badge so seekers prioritise them
//   - expired:     deadline passed, or the source stopped verifying it
//   - draft:       ingested but awaiting admin review (manual/curated sources)
//   - rejected:    admin rejected (duplicate, spam, out-of-scope)
// Verification: the pipeline refreshes last_verified_at every time a source
// still lists the job; a published job that hasn't been verified in
// VERIFY_GRACE_DAYS (30) is auto-expired so stale listings don't linger forever.
export const job = pgTable("job", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull().default(""),
  location: text("location").notNull().default(""),
  category: text("category").notNull().default(""),
  employmentType: text("employment_type").notNull().default(""), // full-time, part-time, contract, internship…
  description: text("description").notNull().default(""),         // the JD — used for the per-CV match
  applyUrl: text("apply_url").notNull().default(""),              // external apply link or contact
  source: text("source").notNull().default(""),                  // source key (remotive, jobicy, admin…)
  sourceName: text("source_name").notNull().default(""),          // human-readable source label
  sourceUrl: text("source_url").notNull().default(""),            // canonical listing URL on the source
  externalId: text("external_id").notNull().default(""),          // source's own job id (dedup/update key)
  corroboratedSources: jsonb("corroborated_sources")
    .notNull()
    .default([]), // source keys that also carry this posting (cross-source dedup signal)
  postedBy: text("posted_by"),                                   // admin/user id, nullable for curated
  status: text("status").notNull().default("published"),          // draft | published | expiring | expired | rejected
  applicationDeadline: timestamp("application_deadline"),         // from source when provided
  lastVerifiedAt: timestamp("last_verified_at"),                  // when the pipeline last confirmed it's live
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("job_status_idx").on(t.status),
  // DB-level dedup for API-sourced listings (source + externalId unique).
  sourceExternalIdx: uniqueIndex("job_source_external_uniq").on(t.source, t.externalId),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type CV = typeof cv.$inferSelect;
export type NewCV = typeof cv.$inferInsert;
export type CoverLetter = typeof coverLetter.$inferSelect;
export type CoverLetterInsert = typeof coverLetter.$inferInsert;
export type BusinessCard = typeof businessCard.$inferSelect;
export type NewBusinessCard = typeof businessCard.$inferInsert;
export type Letter = typeof letter.$inferSelect;
export type NewLetter = typeof letter.$inferInsert;
export type Application = typeof application.$inferSelect;
export type NewApplication = typeof application.$inferInsert;
export type AtsScoreSnapshot = typeof atsScoreSnapshot.$inferSelect;
export type NewAtsScoreSnapshot = typeof atsScoreSnapshot.$inferInsert;
export type Subscription = typeof subscription.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type AiUsage = typeof aiUsage.$inferSelect;

// ─── Marketplace: user-submitted template designs (moderation queue) ──────────
// v1 stores only a color/font/section-order combo over a built-in base template
// — never arbitrary layout code (security). Gated behind a feature flag.
export const templateSubmission = pgTable("template_submission", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  submitterName: text("submitter_name").notNull().default(""),
  docType: text("doc_type").notNull().default("cv"), // cv | cover-letter | business-card | letter
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default(""),
  baseTemplateId: text("base_template_id").notNull(),
  primaryColor: text("primary_color").notNull().default("#DA4A1C"),
  fontFamily: text("font_family").notNull().default("Inter"),
  sectionOrder: jsonb("section_order").notNull().default([]),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | changes
  reviewNote: text("review_note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("template_submission_status_idx").on(t.status),
}));

// ─── Signal Notifications (dispatch ledger) ───────────────────────────────────
// The proactive signal engine (lib/assistant/signals.ts) computes nudges but,
// on its own, only reaches a user who happens to open the app. This is the
// claim/cooldown ledger for the dispatcher (cron/signals) that pushes the
// other signal types out — same mark-before-send pattern as the older
// follow-up reminder, generalized: one row per (user, notifKey), notifKey =
// `${type}|${jobId ?? applicationId ?? "profile"}` (coarser than the
// in-thread signalKey, which embeds day-counts and would re-notify daily).
export const signalNotification = pgTable("signal_notification", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  notifKey: text("notif_key").notNull(),
  type: text("type").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
}, (t) => ({
  userKeyUniq: uniqueIndex("signal_notification_user_key_uniq").on(t.userId, t.notifKey),
}));

export type SignalNotification = typeof signalNotification.$inferSelect;
export type NewSignalNotification = typeof signalNotification.$inferInsert;

// ─── Job Recommendations (per-user, cached) ───────────────────────────────────
// Top matches between a user's most recent CV and the live job feed, computed by
// the heuristic scorer (lib/job-match.ts) and cached so the dashboard and feed
// render instantly. Refreshed nightly by the cron and on-demand when a cached
// row is older than RECOMMENDATION_TTL_MS (lib/jobs/recommend.ts).
export const jobRecommendation = pgTable("job_recommendation", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: text("job_id").notNull().references(() => job.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  reason: text("reason").notNull().default(""),
  matchedTerms: jsonb("matched_terms").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("job_recommendation_user_idx").on(t.userId, t.updatedAt),
  userJobUniq: uniqueIndex("job_recommendation_user_job_uniq").on(t.userId, t.jobId),
}));

// ─── Outcome Events (feedback flywheel — PR-1) ───────────────────────────────
// The raw material of the "did the AI advice actually work?" loop. Every event
// is anonymized at write time: only a SHA-256 hash of the user id is stored
// (aggregation still works per-user WITHOUT exposing who the user is), and the
// payload carries NO raw PII by construction (numbers, counts, statuses, tool
// ids). Respects the user's analytics_opt_out flag (user_profile column).
// Aggregation + the private admin insights view live in lib/outcomes/.
export const outcomeEvent = pgTable("outcome_event", {
  id: text("id").primaryKey(),
  /** SHA-256(userId + OUTCOME_SALT) — the per-user aggregation key. */
  userHash: text("user_hash").notNull(),
  /** Event type: tailor.lift | match.scored | application.created |
   *  application.status | signal.shown | tool.executed | confirmation.resolved */
  type: text("type").notNull(),
  /** Typed, PII-free payload (lib/outcomes/types.ts). */
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  typeIdx: index("outcome_event_type_idx").on(t.type, t.createdAt),
  userIdx: index("outcome_event_user_idx").on(t.userHash),
}));

export type TemplateSubmission = typeof templateSubmission.$inferSelect;
export type NewTemplateSubmission = typeof templateSubmission.$inferInsert;
export type Job = typeof job.$inferSelect;
export type NewJob = typeof job.$inferInsert;
export type JobRecommendation = typeof jobRecommendation.$inferSelect;
export type NewJobRecommendation = typeof jobRecommendation.$inferInsert;

// ─── Tool invocations (system blueprint — the capability audit trail) ─────────
// Every call that goes through the guardrail pipeline (lib/assistant/run-tool)
// leaves one row, whether the caller was a button, the assistant, cron or the
// WhatsApp worker. This is the cost dashboard, the "what did the AI do for this
// user" trail, and the input to per-tool eval sampling. `inputHash` is a digest
// of the args, never the raw args (a JD or CV can be huge and is PII).
export const toolInvocation = pgTable("tool_invocation", {
  id: text("id").primaryKey(),
  userId: text("user_id"), // null for guest / anonymous callers
  tool: text("tool").notNull(),
  /** ui | assistant | cron | whatsapp | api */
  caller: text("caller").notNull(),
  /** auto | preview | confirm | blocked */
  policy: text("policy").notNull(),
  /** executed | previewed | awaiting_confirm | blocked_* | failed */
  outcome: text("outcome").notNull(),
  /** none | cheap-ai | full-ai */
  costClass: text("cost_class").notNull().default("none"),
  latencyMs: integer("latency_ms").notNull().default(0),
  inputHash: text("input_hash").notNull().default(""),
  /** short error class when outcome = failed; never a raw message with PII */
  errorCode: text("error_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("tool_invocation_user_idx").on(t.userId, t.createdAt),
  toolIdx: index("tool_invocation_tool_idx").on(t.tool, t.createdAt),
}));

// ─── Provenance (system blueprint H8 — "AI haibuni" made structural) ─────────
// Every span of a document or Career Spine field that the AI touched gets a
// row. The editor reads these to render source chips ("from your 2021 role")
// and the "revert to my words" control; unconfirmed spans are visually distinct
// and block "export as final". A tool that writes to a document CANNOT commit
// without writing provenance for each changed span (enforced in run-tool).
export const provenance = pgTable("provenance", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  /** cv | cover_letter | letter | business_card | career_profile */
  docType: text("doc_type").notNull(),
  docId: text("doc_id").notNull(),
  /** dotted path within the doc, e.g. "summary" or "experience.0.description" */
  fieldPath: text("field_path").notNull(),
  /** character range within the field's text, [start,end] */
  spanStart: integer("span_start").notNull().default(0),
  spanEnd: integer("span_end").notNull().default(0),
  /** user_written | user_dictated | ai_tightened | ai_from_evidence | ai_suggested | imported */
  sourceKind: text("source_kind").notNull(),
  /** what it was drawn from — an evidence id, a prior span, a JD ref. Free text, PII-light. */
  sourceRef: text("source_ref").notNull().default(""),
  /** the tool_invocation that produced it */
  invocationId: text("invocation_id"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  docIdx: index("provenance_doc_idx").on(t.docType, t.docId),
  userIdx: index("provenance_user_idx").on(t.userId),
}));

// ─── Eval samples (system blueprint — the moat's live tripwire) ──────────────
// A sampled slice of real generative tool calls (input + output), stored so the
// nightly job can re-run the anti-fabrication / repeat-guard / tone suites
// against production traffic and alert on a rate regression. Sampled at a low
// rate; rows expire (a cleanup cron prunes older than N days). Content is the
// model IO only — the user is referenced by hash, not id.
export const evalSample = pgTable("eval_sample", {
  id: text("id").primaryKey(),
  userHash: text("user_hash").notNull(),
  tool: text("tool").notNull(),
  promptVersion: text("prompt_version").notNull().default(""),
  model: text("model").notNull().default(""),
  input: jsonb("input").notNull().default({}),
  output: jsonb("output").notNull().default({}),
  /** filled by the nightly run: pass | fail | flagged, plus which suite */
  verdict: text("verdict"),
  verdictDetail: jsonb("verdict_detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  evaluatedAt: timestamp("evaluated_at"),
}, (t) => ({
  toolIdx: index("eval_sample_tool_idx").on(t.tool, t.createdAt),
  pendingIdx: index("eval_sample_pending_idx").on(t.evaluatedAt),
}));

export type ToolInvocation = typeof toolInvocation.$inferSelect;
export type NewToolInvocation = typeof toolInvocation.$inferInsert;
export type Provenance = typeof provenance.$inferSelect;
export type NewProvenance = typeof provenance.$inferInsert;
export type EvalSample = typeof evalSample.$inferSelect;
export type NewEvalSample = typeof evalSample.$inferInsert;

// ─── Device tokens (push) — blueprint H2 ────────────────────────────────────
// One row per (user, device). Written by PUT /api/mobile/device-token, which is
// Bearer-authed on the Hono API — the older /api/auth/device-token was
// cookie-only, so the native app could never register. `platform` is
// ios | android | web (web push subscriptions live in webPushSubscription).
export const deviceToken = pgTable("device_token", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  deviceId: text("device_id").notNull(),
  pushToken: text("push_token").notNull(),
  platform: text("platform").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  deviceUniq: uniqueIndex("device_token_device_uniq").on(t.deviceId),
  userIdx: index("device_token_user_idx").on(t.userId),
}));

// ─── Web push subscriptions — blueprint Stage 5 (own the push, no FCM) ──────
// A PushSubscription from an installed Android/desktop PWA. `endpoint` is the
// browser's push service URL; keys are the client's p256dh + auth. Sent with
// the `web-push` library + a VAPID keypair (env: VAPID_PUBLIC_KEY /
// VAPID_PRIVATE_KEY). Prune 404/410 endpoints on send.
export const webPushSubscription = pgTable("web_push_subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
}, (t) => ({
  endpointUniq: uniqueIndex("web_push_endpoint_uniq").on(t.endpoint),
  userIdx: index("web_push_user_idx").on(t.userId),
}));

export type DeviceToken = typeof deviceToken.$inferSelect;
export type NewDeviceToken = typeof deviceToken.$inferInsert;
export type WebPushSubscription = typeof webPushSubscription.$inferSelect;
export type NewWebPushSubscription = typeof webPushSubscription.$inferInsert;

// ─── Referral loop — blueprint Stage 5 (word-of-mouth is the growth rail) ───
// One code per referrer (referralCode). Each person who signs up via a
// ?ref=<code> link gets one referralClaim row. `activatedAt` is stamped lazily
// (on stats read) once the referred user has actually built something — the
// metric that matters is activated invites, not raw sign-ups.
export const referralCode = pgTable("referral_code", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  codeUniq: uniqueIndex("referral_code_code_uniq").on(t.code),
  userUniq: uniqueIndex("referral_code_user_uniq").on(t.userId),
}));

export const referralClaim = pgTable("referral_claim", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  referrerUserId: text("referrer_user_id").notNull(),
  referredUserId: text("referred_user_id").notNull(),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  activatedAt: timestamp("activated_at"),
}, (t) => ({
  referredUniq: uniqueIndex("referral_claim_referred_uniq").on(t.referredUserId),
  referrerIdx: index("referral_claim_referrer_idx").on(t.referrerUserId),
}));

export type ReferralCode = typeof referralCode.$inferSelect;
export type ReferralClaim = typeof referralClaim.$inferSelect;
