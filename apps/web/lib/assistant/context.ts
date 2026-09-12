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
import { db, userProfile, cv, application, job, jobRecommendation, coverLetter, letter, businessCard, downloadLog } from "@/lib/db";
import {
  normalizeExportKind,
  isUnstoredExportId,
  EXPORT_DEFAULT_TITLES,
} from "@/lib/documents/export-ledger";
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

/**
 * One thing in the user's own library: a document they generated, plus whether
 * they have ever taken it OUT of the app.
 *
 * The context used to stop at CVs and applications, so Sumaiya could not see a
 * single cover letter, letter or business card the user had made — and had no
 * idea what they had exported. That gap is the difference between an assistant
 * and a CV form: she could not ask "did you send that letter?" because she did
 * not know the letter existed.
 */
export interface ContextDocument {
  id: string;
  type: "cv" | "cover-letter" | "letter" | "business-card";
  title: string;
  /** For a targeted document: the job it was written for. */
  jobTitle: string;
  companyName: string;
  status: string;
  updatedAt: string;
  /** How many times they have downloaded it, as the document itself records. */
  downloads: number;
  /** The last time they exported it — the moment a follow-up becomes fair. */
  lastDownloadedAt: string | null;
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
  /**
   * Everything in the user's library, newest first — CVs, cover letters,
   * letters, business cards — each with whether it has ever been exported.
   * This is what makes a follow-up ("did you send that letter?") possible at
   * all, and what a Documents screen will read from.
   *
   * Optional so every existing caller and test fixture keeps working: a context
   * without a library simply renders no library block.
   */
  documents?: ContextDocument[];
}

const MAX_APPLICATIONS = 20;
/** How many library documents ride along in the context. */
const MAX_DOCUMENTS = 25;
/** How far back to look for exports. Enough to catch "I sent it last week". */
const MAX_DOWNLOADS = 60;
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
    documents: [],
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

  // ── The library ──────────────────────────────────────────────────────────
  // The context used to stop at CVs and applications. Sumaiya could not see a
  // single cover letter, letter or card this person had made, and had no idea
  // whether they had ever taken one out of the app — so she could not ask the
  // only question that matters after an export: "did you send it?".
  const [clRows, letterRows, cardRows, downloadRows] = await Promise.all([
    db
      .select({
        id: coverLetter.id, title: coverLetter.title, jobTitle: coverLetter.jobTitle,
        companyName: coverLetter.companyName, status: coverLetter.status,
        downloads: coverLetter.downloadCount, updatedAt: coverLetter.updatedAt,
      })
      .from(coverLetter).where(eq(coverLetter.userId, userId)).orderBy(desc(coverLetter.updatedAt)).limit(MAX_DOCUMENTS).catch(() => []),
    db
      .select({ id: letter.id, title: letter.title, status: letter.status, downloads: letter.downloadCount, updatedAt: letter.updatedAt })
      .from(letter).where(eq(letter.userId, userId)).orderBy(desc(letter.updatedAt)).limit(MAX_DOCUMENTS).catch(() => []),
    db
      .select({ id: businessCard.id, title: businessCard.title, status: businessCard.status, downloads: businessCard.downloadCount, updatedAt: businessCard.updatedAt })
      .from(businessCard).where(eq(businessCard.userId, userId)).orderBy(desc(businessCard.updatedAt)).limit(MAX_DOCUMENTS).catch(() => []),
    // Exports. Newest first, so the first hit per document is the latest one.
    // `title`/`documentType` ride along because an export does not always have a
    // document row behind it — the native app's on-demand cover letter does not.
    db
      .select({
        documentId: downloadLog.documentId,
        documentType: downloadLog.documentType,
        title: downloadLog.title,
        createdAt: downloadLog.createdAt,
      })
      .from(downloadLog).where(eq(downloadLog.userId, userId)).orderBy(desc(downloadLog.createdAt)).limit(MAX_DOWNLOADS).catch(() => []),
  ]);

  const lastDownload = new Map<string, string>();
  const exportCount = new Map<string, number>();
  for (const d of downloadRows) {
    if (!lastDownload.has(d.documentId)) lastDownload.set(d.documentId, d.createdAt.toISOString());
    exportCount.set(d.documentId, (exportCount.get(d.documentId) ?? 0) + 1);
  }

  const stored: ContextDocument[] = [
    ...cvRows.map((c) => ({
      id: c.id, type: "cv" as const, title: c.title, jobTitle: "", companyName: "",
      status: "complete", updatedAt: iso(c.updatedAt) ?? "", downloads: exportCount.get(c.id) ?? 0,
      lastDownloadedAt: lastDownload.get(c.id) ?? null,
    })),
    ...clRows.map((r) => ({
      id: r.id, type: "cover-letter" as const, title: r.title, jobTitle: r.jobTitle ?? "",
      companyName: r.companyName ?? "", status: r.status, updatedAt: iso(r.updatedAt) ?? "",
      downloads: r.downloads, lastDownloadedAt: lastDownload.get(r.id) ?? null,
    })),
    ...letterRows.map((r) => ({
      id: r.id, type: "letter" as const, title: r.title, jobTitle: "", companyName: "",
      status: r.status, updatedAt: iso(r.updatedAt) ?? "", downloads: r.downloads,
      lastDownloadedAt: lastDownload.get(r.id) ?? null,
    })),
    ...cardRows.map((r) => ({
      id: r.id, type: "business-card" as const, title: r.title, jobTitle: "", companyName: "",
      status: r.status, updatedAt: iso(r.updatedAt) ?? "", downloads: r.downloads,
      lastDownloadedAt: lastDownload.get(r.id) ?? null,
    })),
  ];

  // Exports that have no document row behind them.
  //
  // The native app's cover letter (POST /mobile/apply) is generated on demand
  // and never saved, so its only trace in the world is its ledger row. Without
  // this, the one export the user actually asked about — "why is my letter PDF
  // blank?" — was invisible to Sumaiya: no cover_letter row, so no library entry,
  // so no follow-up. Only `mobile:`-prefixed ids qualify; an id that points at
  // nothing but was never minted as unstored belongs to a document that has since
  // been deleted, and reporting that as if it still exists would be a ghost.
  const knownIds = new Set(stored.map((d) => d.id));
  const unstored: ContextDocument[] = [];
  for (const d of downloadRows) {
    if (knownIds.has(d.documentId) || !isUnstoredExportId(d.documentId)) continue;
    // Newest-first, so the first ledger row seen for an id is its latest export.
    if (unstored.some((e) => e.id === d.documentId)) continue;
    const kind = normalizeExportKind(d.documentType) ?? "letter";
    const at = d.createdAt.toISOString();
    unstored.push({
      id: d.documentId,
      type: kind,
      title: (d.title ?? "").trim() || EXPORT_DEFAULT_TITLES[kind],
      jobTitle: "",
      companyName: "",
      status: "complete",
      updatedAt: at,
      downloads: exportCount.get(d.documentId) ?? 1,
      lastDownloadedAt: at,
    });
  }

  const documents: ContextDocument[] = [...stored, ...unstored]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_DOCUMENTS);

  // Recent activity — the last few things that happened, across every surface.
  const activity: Array<{ type: RecentActivity["type"]; label: string; at: Date }> = [];
  for (const c of cvRows.slice(0, 2)) activity.push({ type: "cv", label: c.title, at: c.updatedAt });
  for (const a of appRows.slice(0, 2)) activity.push({ type: "application", label: a.title, at: a.updatedAt });
  for (const r of recRows.slice(0, 1)) activity.push({ type: "job", label: r.title, at: r.updatedAt });
  // Documents are part of "what happened" now, not a missing count query.
  for (const d of documents.slice(0, 2)) {
    activity.push({ type: d.type, label: d.title, at: new Date(d.updatedAt || Date.now()) });
  }
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
    documents,
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
  // Their own documents — what exists, and what has actually left the app.
  const docs = ctx.documents ?? [];
  if (docs.length) {
    const shown = docs
      .slice(0, 6)
      .map((d) => `${d.type} "${d.title}"${d.jobTitle ? ` for ${d.jobTitle}` : ""}${d.lastDownloadedAt ? " [exported]" : ""}`);
    lines.push(`Their library (${docs.length}): ${shown.join(" | ")}`);

    // The follow-up. An export is the last thing this app can observe; whether
    // the letter was actually sent happens out in the world, and nobody else
    // here can ask. So she asks — once, warmly, and only if it fits.
    const exported = docs
      .filter((d) => d.lastDownloadedAt)
      .sort((a, b) => (b.lastDownloadedAt ?? "").localeCompare(a.lastDownloadedAt ?? ""));
    const latest = exported[0];
    if (latest?.lastDownloadedAt) {
      const days = Math.max(0, Math.floor((Date.now() - new Date(latest.lastDownloadedAt).getTime()) / 86_400_000));
      lines.push(
        `LAST EXPORTED: "${latest.title}"${latest.jobTitle ? ` for ${latest.jobTitle}` : ""}, ${days} day(s) ago. ` +
          `Nothing here knows whether they actually sent it. If it fits what they came to talk about, ask ONCE, the way a friend would ("did that one go through?") and offer one concrete next step — follow up, or log it in their applications. Never nag, never ask twice, and drop it immediately if they move on.`,
      );
    }
  }
  if (ctx.recentActivity.length) {
    lines.push(`Recent activity: ${ctx.recentActivity.map((r) => `${r.type} "${r.label}"`).join(" → ")}`);
  }
  if (!lines.length) return "";
  return `\nWHAT YOU ALREADY KNOW about this user (unified context — treat them like a returning friend, never re-ask what's here):\n${lines.map((l) => "• " + l).join("\n")}\n`;
}
