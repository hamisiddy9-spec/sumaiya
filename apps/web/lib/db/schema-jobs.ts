import { pgTable, text, timestamp, integer, jsonb, boolean, index } from "drizzle-orm/pg-core";

/**
 * Jobs database
 *
 * Schema: jobs (job postings, aggregated from Indeed, LinkedIn, Wellfound)
 * Purpose: Power job matching algorithm + salary benchmarking
 */

export const job = pgTable("job", {
  id: text("id").primaryKey(),

  // Source
  sourceJobId: text("source_job_id"), // Original ID from Indeed, LinkedIn, etc.
  source: text("source").notNull().default("unknown"), // indeed, linkedin, wellfound, otta, angel-list
  sourceUrl: text("source_url"), // Link to original job posting

  // Basic info
  title: text("title").notNull(), // Senior Software Engineer
  company: text("company").notNull(), // Acme Corp
  industry: text("industry"), // technology, finance, healthcare, etc.

  // Location
  location: text("location"), // Nairobi, Kenya
  country: text("country"), // Kenya
  isRemote: boolean("is_remote").default(false),

  // Job details
  description: text("description"), // Full job description
  requirements: jsonb("requirements").default([]), // ["Python", "Docker", "AWS"]
  responsibilities: jsonb("responsibilities").default([]),

  // Compensation
  salaryMin: integer("salary_min"), // In KES or USD
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("KES"),
  salaryPeriod: text("salary_period").default("annual"), // annual, monthly
  equity: text("equity"), // E.g., "0.1%-0.5%"
  benefits: jsonb("benefits").default([]), // ["Health insurance", "Flexible hours"]

  // Experience level
  experienceLevel: text("experience_level"), // entry, mid, senior, director, executive
  yearsExperienceMin: integer("years_experience_min"),
  yearsExperienceMax: integer("years_experience_max"),

  // Skills matching (computed)
  requiredSkills: jsonb("required_skills").default([]), // Extracted from description
  niceToHaveSkills: jsonb("nice_to_have_skills").default([]),

  // Post metadata
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),

  // Engagement metrics
  viewCount: integer("view_count").default(0),
  applicationCount: integer("application_count").default(0),

  // For matching
  hashTags: jsonb("hash_tags").default([]), // ["full-stack", "startup", "remote"]

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  companyIdx: index("job_company_idx").on(t.company),
  titleIdx: index("job_title_idx").on(t.title),
  locationIdx: index("job_location_idx").on(t.location),
  sourceIdx: index("job_source_idx").on(t.source),
  activeIdx: index("job_active_idx").on(t.isActive),
  postedIdx: index("job_posted_idx").on(t.postedAt),
}));

export type Job = typeof job.$inferSelect;
export type JobInsert = typeof job.$inferInsert;

/**
 * User job matches (cached, for faster feed)
 *
 * Schema: job_matches (pre-computed matches for personalized feed)
 * Purpose: Show users 3-5 jobs/day without recalculating every time
 */
export const jobMatch = pgTable("job_match", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: text("job_id").notNull(),

  // Match score (0-100)
  matchScore: integer("match_score").notNull(), // 95 = excellent match

  // Why matched
  matchReasons: jsonb("match_reasons").default([]), // ["Knows Python", "Senior level", "Remote OK"]
  missingSkills: jsonb("missing_skills").default([]), // ["Kubernetes", "GraphQL"]

  // Interaction
  isClicked: boolean("is_clicked").default(false),
  isApplied: boolean("is_applied").default(false),
  isIgnored: boolean("is_ignored").default(false),
  ignoredReason: text("ignored_reason"), // too_junior, wrong_location, salary_mismatch

  // Feedback
  userFeedback: text("user_feedback"), // If user reported: "Not interested", "Applied", etc.

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("job_match_user_idx").on(t.userId),
  jobIdx: index("job_match_job_idx").on(t.jobId),
  scoreIdx: index("job_match_score_idx").on(t.matchScore),
  userJobIdx: index("job_match_user_job_idx").on(t.userId, t.jobId),
}));

export type JobMatch = typeof jobMatch.$inferSelect;
export type JobMatchInsert = typeof jobMatch.$inferInsert;

/**
 * User saved jobs (bookmarked)
 */
export const savedJob = pgTable("saved_job", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: text("job_id").notNull(),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("saved_job_user_idx").on(t.userId),
  jobIdx: index("saved_job_job_idx").on(t.jobId),
}));
