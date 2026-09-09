import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, application, cv, coverLetter, atsScoreSnapshot } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";
import { parseCVData } from "@/types";
import { getCVTerms } from "@/lib/job-match";
import { ApplicationWorkspace } from "@/components/dashboard/application-workspace";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/applications/${params.id}`)}`);

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const userId = user.id;

  const [app] = await db
    .select()
    .from(application)
    .where(and(eq(application.id, params.id), eq(application.userId, userId)))
    .limit(1);
  if (!app) notFound();

  // Linked documents + this CV's latest ATS score, all ownership-scoped. The CV
  // and cover letter are optional, so each lookup is guarded.
  // templateId/primaryColor come along so a cover letter generated here can be
  // styled to MATCH the CV (same template family + accent) — one visual set.
  let linkedCv: { id: string; title: string; templateId: string; primaryColor: string } | null = null;
  let atsScore: number | null = null;
  // The linked CV's keyword set, so the workspace can score it against THIS job's
  // description (and re-score live as the JD is edited) — the per-job match.
  let cvTerms: string[] = [];
  if (app.cvId) {
    const [c] = await db
      .select({ id: cv.id, title: cv.title, data: cv.data, templateId: cv.templateId, primaryColor: cv.primaryColor })
      .from(cv)
      .where(and(eq(cv.id, app.cvId), eq(cv.userId, userId)))
      .limit(1);
    linkedCv = c ? { id: c.id, title: c.title, templateId: c.templateId, primaryColor: c.primaryColor } : null;
    if (c) {
      try { cvTerms = [...getCVTerms(parseCVData(c.data))]; } catch { cvTerms = []; }
      const [snap] = await db
        .select({ score: atsScoreSnapshot.score })
        .from(atsScoreSnapshot)
        .where(and(eq(atsScoreSnapshot.documentId, c.id), eq(atsScoreSnapshot.userId, userId)))
        .orderBy(desc(atsScoreSnapshot.createdAt))
        .limit(1);
      atsScore = snap?.score ?? null;
    }
  }

  let linkedCl: { id: string; title: string } | null = null;
  if (app.coverLetterId) {
    const [cl] = await db
      .select({ id: coverLetter.id, title: coverLetter.title })
      .from(coverLetter)
      .where(and(eq(coverLetter.id, app.coverLetterId), eq(coverLetter.userId, userId)))
      .limit(1);
    linkedCl = cl ?? null;
  }

  // M2 — the snap-time match breakdown persisted against THIS application
  // (real parsed data: requirements + keyword matched/missing lists). Loaded so
  // the workspace can render per-requirement evidence without re-parsing the
  // JD or inventing anything. Stored in atsScoreSnapshot.checks (jsonb).
  let snapBreakdown: { requirements: string[]; matched: string[]; missing: string[] } | null = null;
  {
    const [snapRow] = await db
      .select({ checks: atsScoreSnapshot.checks })
      .from(atsScoreSnapshot)
      .where(and(
        eq(atsScoreSnapshot.documentId, app.id),
        eq(atsScoreSnapshot.documentType, "application"),
        eq(atsScoreSnapshot.userId, userId)
      ))
      .orderBy(desc(atsScoreSnapshot.createdAt))
      .limit(1);
    if (snapRow?.checks && typeof snapRow.checks === "object" && !Array.isArray(snapRow.checks)) {
      const ch = snapRow.checks as Record<string, unknown>;
      if (Array.isArray(ch.requirements) || Array.isArray(ch.matched) || Array.isArray(ch.missing)) {
        snapBreakdown = {
          requirements: Array.isArray(ch.requirements) ? (ch.requirements as string[]) : [],
          matched: Array.isArray(ch.matched) ? (ch.matched as string[]) : [],
          missing: Array.isArray(ch.missing) ? (ch.missing as string[]) : [],
        };
      }
    }
  }

  // The user's CVs, so they can attach one to this job if none is linked yet.
  const myCvs = await db
    .select({ id: cv.id, title: cv.title })
    .from(cv)
    .where(eq(cv.userId, userId))
    .orderBy(desc(cv.updatedAt))
    .limit(30);

  return (
    <ApplicationWorkspace
      lang={lang}
      app={{
        id: app.id,
        title: app.title,
        companyName: app.companyName ?? "",
        jobTitle: app.jobTitle ?? "",
        jobDescription: app.jobDescription ?? "",
        jobDescriptionUrl: app.jobDescriptionUrl ?? "",
        status: app.status,
        notes: app.notes ?? "",
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        createdAt: app.createdAt.toISOString(),
        cvId: app.cvId ?? null,
        coverLetterId: app.coverLetterId ?? null,
      }}
      linkedCv={linkedCv}
      linkedCl={linkedCl}
      atsScore={atsScore}
      cvTerms={cvTerms}
      snapBreakdown={snapBreakdown}
      myCvs={myCvs}
    />
  );
}
