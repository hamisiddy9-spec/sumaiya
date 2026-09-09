import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, coverLetter, userProfile } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { CoverLetterEditorClient } from "@/components/editor/cover-letter-editor-client";
import type { UserProfile } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cover Letter Editor" };

interface Props {
  params: { id: string };
  searchParams: { template?: string; fromApp?: string };
}

// When the editor is opened from an Application Workspace, "back" should return
// to that application (the journey), not the generic dashboard. Only accept a
// safe id shape so the param can't be used to craft an arbitrary URL.
function backHrefFrom(fromApp?: string): string {
  return fromApp && /^[A-Za-z0-9_-]+$/.test(fromApp) ? `/applications/${fromApp}` : "/dashboard";
}

const VALID_COVER_LETTER_TEMPLATES = ["classic", "modern"];

export default async function CoverLetterEditorPage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const callbackUrl = `/editor/cover-letter/${params.id}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const user = session.user;

  // The editor UI is fully bilingual, so follow the visitor's language choice.
  const lang: Lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";
  const userId = user.id;

  const isPremium = true; // payment temporarily disabled

  if (params.id === "new") {
    const newId = nanoid();
    const requestedTemplate = VALID_COVER_LETTER_TEMPLATES.includes(searchParams.template ?? "")
      ? searchParams.template!
      : undefined;

    // Pre-fill jobTitle / companyName from saved profile so "Use My Profile"
    // actually seeds data instead of showing an empty letter.
    let prof: UserProfile | null | undefined;
    try {
      [prof] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, userId))
        .limit(1);
    } catch (e) {
      console.error("[CoverLetterEditor] profile read failed:", e);
    }

    try {
      await db.insert(coverLetter).values({
        id: newId,
        userId,
        title: "My Cover Letter",
        content: "",
        jobTitle: prof?.jobTitle ?? null,
        ...(requestedTemplate ? { templateId: requestedTemplate } : {}),
      });
    } catch (err) {
      console.error("[CoverLetterEditor] insert failed:", err);
      redirect("/dashboard?error=cl_create_failed");
    }
    redirect(`/editor/cover-letter/${newId}`);
  }

  let doc: typeof coverLetter.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(coverLetter)
      .where(and(eq(coverLetter.id, params.id), eq(coverLetter.userId, userId)))
      .limit(1);
    doc = result;
  } catch (err) {
    console.error("[CoverLetterEditor] fetch failed:", err);
    redirect("/dashboard?error=db_error");
  }

  if (!doc) notFound();

  // Auto-fill the sender's identity so a generated letter is never signed
  // "Your Name". Source of truth: the saved profile; fall back to the name the
  // user signed up with. Without this, a great AI draft looks half-finished.
  let senderName = "";
  let senderTitle = "";
  try {
    const [prof] = await db
      .select({ fullName: userProfile.fullName, jobTitle: userProfile.jobTitle })
      .from(userProfile)
      .where(eq(userProfile.id, userId))
      .limit(1);
    senderName = prof?.fullName?.trim() ?? "";
    senderTitle = prof?.jobTitle?.trim() ?? "";
  } catch (e) {
    console.error("[CoverLetterEditor] profile read failed:", e);
  }
  if (!senderName) {
    const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
    senderName = (meta?.full_name || meta?.name || "").trim();
  }

  return (
    <CoverLetterEditorClient
      initialDoc={doc!}
      userId={userId}
      isPremium={isPremium}
      lang={lang}
      initialSenderName={senderName}
      initialSenderTitle={senderTitle}
      backHref={backHrefFrom(searchParams.fromApp)}
    />
  );
}
