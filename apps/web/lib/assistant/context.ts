/**
 * The unified context assembler — the read-side of the Career Spine.
 *
 * Phase 2 (B): every surface (assistant turn, dashboard, cockpit) assembles
 * the SAME picture of the user: profile + active CV + tracked applications +
 * saved/matched jobs + unconfirmed facts + proactive signals + recent
 * activity. One assembler, one shape — so Sumaiya is continuous across
 * sessions and surfaces, never amnesiac, and no surface ever re-derives a
 * different view of the same truth.
 *
 * Pure-ish: DB reads only (no writes), safe to call once per request from a
 * server component or route. Everything read already exists — this unifies
 * the reads, it doesn't invent data.
 */
import { db, userProfile, cv, application, job, jobRecommendation, coverLetter, letter, businessCard } from "@/lib/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { parseCVData, parseCareerProfile, type CVData } from "@/types";
import { listPendingConfirmations, type PendingConfirmation } from "@/lib/career-profile/confirmations";
import type { Signal } from "./signals";

/** Light application shape — enough for nudges/context, never the full JD. */
export interface ContextApplication {
  id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  status: string;
  appliedAt: string | null;
  createdAt: string | null;
  updatedAt: string;
}

/** Light job shape — score + deadline + role, never the full JD in prompts. */
export interface ContextJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  category: string;
  applicationDeadline: string | null;
  score: number;
  reason: string;
  /** When the job listing itself was ingested — drives the "new match" signal. */
  postedAt: string;
  /** Full JD text — internal only, for the deterministic skill-gap keyword
   *  diff in signals.ts. Never put this into contextToPromptBlock's output —
   *  see that function's own "never dumps full job descriptions" guarantee. */
  description: string;
}

export interface RecentActivity {
  type: "cv" | "cover-letter" | "letter" | "business-card" | "application" | "job";
  label: string;
  at: string;
}

export interface UnifiedContext {
  /** Parsed Career Profile (the fact store), or null. */
  profile: ReturnType<typeof parseCareerProfile> | null;
  /** user_profile.summary — the assistant's compact memory. */
  profileSummary: string;
  /** The active CV (explicit id when provided, else the most recently updated). */
  activeCv: { id: string; title: string; data: CVData } | null;
  /** Tracked applications (draft → applied → interviewing → offer/rejected). */
  applications: ContextApplication[];
  /** Jobs the user has matched/saved (recommendation rows), strongest first. */
  matchedJobs: ContextJob[];
  /** Facts awaiting the user's confirmation (Phase 2 A). */
  unconfirmed: PendingConfirmation[];
  /** Proactive nudges computed from this context (Phase 2 C). */
  signals: Signal[];
  /** The last few things that happened in the account. */
  recentActivity: RecentActivity[];
}

const MAX_APPLICATIONS = 20;
const MAX_MATCHED = 8;
const MAX_ACTIVITY = 5;

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

/**
 * Assemble the unified context for a user. Never throws — every read is
 * isolated so a failing table can't blank the whole picture (the caller gets
 * empty collections instead). Cache per request by the caller (this function
 * itself is stateless).
 */
export async function assembleUserContext(
  userId: string,
  opts: { activeCvId?: string } = {},
): Promise<UnifiedContext> {
  const empty: UnifiedContext = {
    profile: null,
    profileSummary: "",
    activeCv: null,
    applications: [],
    matchedJobs: [],
    unconfirmed: [],
    signals: [],
    recentActivity: [],
  };

  const [profRows, cvRows, appRows, recRows] = await Promise.all([
    db.select().from(userProfile).where(eq(userProfile.id, userId)).limit(1).catch(() => []),
    db.select({ id: cv.id, title: cv.title, data: cv.data, updatedAt: cv.updatedAt }).from(cv).where(eq(cv.userId, userId)).orderBy(desc(cv.updatedAt)).limit(5).catch(() => []),
    db.select().from(application).where(eq(application.userId, userId)).orderBy(desc(application.updatedAt)).limit(MAX_APPLICATIONS).catch(() => []),
    db.select({
      jobId: jobRecommendation.jobId,
      score: jobRecommendation.score,
      reason: jobRecommendation.reason,
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      category: job.category,
      applicationDeadline: job.applicationDeadline,
      updatedAt: jobRecommendation.updatedAt,
      postedAt: job.createdAt,
      description: job.description,
    })
      .from(jobRecommendation)
      .innerJoin(job, eq(jobRecommendation.jobId, job.id))
      .where(and(eq(jobRecommendation.userId, userId), eq(job.status, "published")))
      .orderBy(desc(jobRecommendation.score))
      .limit(MAX_MATCHED)
      .catch(() => []),
  ]);

  const prof = profRows[0];
  const profile = prof?.careerProfile ? parseCareerProfile(prof.careerProfile) : null;

  // Active CV: explicit id (owned) wins, else the most recently updated.
  let activeCv: UnifiedContext["activeCv"] = null;
  if (opts.activeCvId) {
    const found = cvRows.find((r) => r.id === opts.activeCvId);
    if (found) activeCv = { id: found.id, title: found.title, data: parseCVData(found.data) };
  }
  if (!activeCv && cvRows[0]) {
    activeCv = { id: cvRows[0].id, title: cvRows[0].title, data: parseCVData(cvRows[0].data) };
  }

  const applications: ContextApplication[] = appRows.map((a) => ({
    id: a.id,
    title: a.title,
    companyName: a.companyName ?? "",
    jobTitle: a.jobTitle ?? "",
    status: a.status,
    appliedAt: iso(a.appliedAt),
    createdAt: iso(a.createdAt),
    updatedAt: iso(a.updatedAt) ?? "",
  }));

  const matchedJobs: ContextJob[] = recRows.map((r) => ({
    id: r.jobId,
    title: r.title,
    company: r.company,
    location: r.location,
    employmentType: r.employmentType,
    category: r.category,
    applicationDeadline: r.applicationDeadline ? iso(r.applicationDeadline) : null,
    score: r.score,
    reason: r.reason,
    postedAt: iso(r.postedAt) ?? new Date(0).toISOString(),
    description: r.description ?? "",
  }));

  // Recent activity — the last few things that happened, across every surface.
  const activity: Array<{ type: RecentActivity["type"]; label: string; at: Date }> = [];
  for (const c of cvRows.slice(0, 2)) activity.push({ type: "cv", label: c.title, at: c.updatedAt });
  for (const a of appRows.slice(0, 2)) activity.push({ type: "application", label: a.title, at: a.updatedAt });
  for (const r of recRows.slice(0, 1)) activity.push({ type: "job", label: r.title, at: r.updatedAt });
  // Document activity (cover letters / letters / cards) — a light count query
  // would be nice but the read set above is enough for a context summary.
  const recentActivity: RecentActivity[] = activity
    .sort((x, y) => y.at.getTime() - x.at.getTime())
    .slice(0, MAX_ACTIVITY)
    .map((a) => ({ type: a.type, label: a.label, at: a.at.toISOString() }));

  return {
    profile,
    profileSummary: prof?.summary ?? "",
    activeCv,
    applications,
    matchedJobs,
    unconfirmed: listPendingConfirmations(profile),
    signals: [], // Phase 2 C computes the proactive signal engine from this context.
    recentActivity,
  };
}

/** Light, prompt-safe rendering of the context for Sumaiya's "what you know" block. */
export function contextToPromptBlock(ctx: UnifiedContext): string {
  const lines: string[] = [];
  const p = ctx.profile?.personal;
  if (p?.fullName) lines.push(`Name: ${p.fullName}`);
  if (p?.jobTitle) lines.push(`Current role/title: ${p.jobTitle}`);
  if (p?.email) lines.push(`Email: ${p.email}`);
  if (p?.phone) lines.push(`Phone: ${p.phone}`);
  if (p?.location) lines.push(`Location: ${p.location}`);
  if (ctx.profileSummary) lines.push(`Profile summary: "${ctx.profileSummary.slice(0, 400)}"`);
  if (ctx.activeCv) lines.push(`Active CV: "${ctx.activeCv.title}" (${ctx.activeCv.data.experience?.length ?? 0} roles, ${ctx.activeCv.data.skills?.length ?? 0} skills)`);
  if (ctx.applications.length) {
    const byStatus = ctx.applications.reduce((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    lines.push(`Tracked applications (${ctx.applications.length}): ${Object.entries(byStatus).map(([k, n]) => `${k} ${n}`).join(", ")}`);
    // WS-5 — the model needs the application IDs so application.update can
    // target the right record without asking the user to paste it.
    const appList = ctx.applications.slice(0, 8).map((a) => `app:${a.id} = "${a.title}" (${a.status})`);
    lines.push(`Applications (use app:<id> as applicationId for application.update): ${appList.join(" | ")}`);
    const latest = ctx.applications[0];
    lines.push(`Latest application: "${latest.title}" (${latest.status})`);
  }
  if (ctx.matchedJobs.length) {
    lines.push(`Top matched jobs (${ctx.matchedJobs.length}): ${ctx.matchedJobs.slice(0, 3).map((j) => `"${j.title}" at ${j.company} (${j.score}%)`).join(", ")}`);
  }
  if (ctx.unconfirmed.length) {
    lines.push(`Unconfirmed drafted facts (${ctx.unconfirmed.length}): ${ctx.unconfirmed.map((u) => u.label.en).join("; ")} — treat as TENTATIVE`);
  }
  if (ctx.recentActivity.length) {
    lines.push(`Recent activity: ${ctx.recentActivity.map((r) => `${r.type} "${r.label}"`).join(" → ")}`);
  }
  if (!lines.length) return "";
  return `\nWHAT YOU ALREADY KNOW about this user (unified context — treat them like a returning friend, never re-ask what's here):\n${lines.map((l) => "• " + l).join("\n")}\n`;
}
