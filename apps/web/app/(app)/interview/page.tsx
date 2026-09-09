import { headers } from "next/headers";
import { and, eq, desc } from "drizzle-orm";
import { db, cv, application } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InterviewClient } from "@/components/interview/interview-client";
import { parseCVData, type CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Interview Prep" };
export const dynamic = "force-dynamic";

// Condense a CV into a compact context string the coach grounds its questions in.
function cvToContext(d: CVData): string {
  const parts: string[] = [];
  if (d.personal.jobTitle) parts.push(`Target role: ${d.personal.jobTitle}`);
  if (d.summary) parts.push(`Summary: ${d.summary}`);
  if (d.experience.length) {
    parts.push("Experience:\n" + d.experience.map((e) => `- ${e.position || "Role"}${e.company ? " at " + e.company : ""}: ${e.description || ""}`).join("\n"));
  }
  if (d.skills.length) parts.push("Skills: " + d.skills.map((s) => s.name).filter(Boolean).join(", "));
  if (d.education.length) parts.push("Education: " + d.education.map((e) => `${e.degree || ""} ${e.field || ""}${e.institution ? " at " + e.institution : ""}`.trim()).join("; "));
  return parts.join("\n\n").slice(0, 6000);
}

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ cv?: string; app?: string }> }) {
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const { cv: cvId, app: appId } = await searchParams;

  let cvContext = "";
  let jobTitle = "";
  let initialJd = "";

  if (cvId || appId) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // The CV grounds the coach's questions in the candidate's real background.
        if (cvId) {
          const [row] = await db
            .select({ data: cv.data })
            .from(cv)
            .where(and(eq(cv.id, cvId), eq(cv.userId, user.id)))
            .limit(1);
          if (row) {
            const d = parseCVData(row.data);
            jobTitle = d.personal.jobTitle || "";
            cvContext = cvToContext(d);
          }
        }
        // An application tailors the interview to THAT specific job.
        if (appId) {
          const [appRow] = await db
            .select({ jobDescription: application.jobDescription, jobTitle: application.jobTitle })
            .from(application)
            .where(and(eq(application.id, appId), eq(application.userId, user.id)))
            .limit(1);
          if (appRow) {
            initialJd = appRow.jobDescription ?? "";
            if (appRow.jobTitle) jobTitle = appRow.jobTitle;
          }
        }
        // Phase 2 (E): "prep me for the X interview" pulls the real job AND the
        // user's real CV — if no CV was passed explicitly, use their latest.
        if (!cvContext) {
          const [latest] = await db
            .select({ data: cv.data })
            .from(cv)
            .where(eq(cv.userId, user.id))
            .orderBy(desc(cv.updatedAt))
            .limit(1)
            .catch(() => []);
          if (latest) {
            const d = parseCVData(latest.data);
            if (!jobTitle) jobTitle = d.personal.jobTitle || "";
            cvContext = cvToContext(d);
          }
        }
      }
    } catch { /* general prep without CV/job context is fine */ }
  }

  return (
    <InterviewClient
      lang={lang}
      cvContext={cvContext}
      jobTitle={jobTitle}
      hasCv={!!cvContext}
      cvId={cvContext ? cvId : undefined}
      initialJd={initialJd}
    />
  );
}
