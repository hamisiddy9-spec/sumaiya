import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, cv, userProfile } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { CVEditorClient } from "@/components/editor/cv-editor-client";
import { TEMPLATES } from "@/types";
import { seedCvData } from "@/lib/profile-mappers";
import type { CV, UserProfile } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CV Editor" };

interface Props {
  params: { id: string };
  searchParams: { template?: string; fresh?: string; fromApp?: string };
}

// Opened from an Application Workspace? "Back" returns to that application, not
// the dashboard. Safe id shape only, so the param can't craft an arbitrary URL.
function backHrefFrom(fromApp?: string): string | undefined {
  return fromApp && /^[A-Za-z0-9_-]+$/.test(fromApp) ? `/applications/${fromApp}` : undefined;
}

export default async function CVEditorPage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const callbackUrl = params.id === "new"
      ? "/editor/cv/new"
      : `/editor/cv/${params.id}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const user = session.user;

  // The editor UI is fully bilingual, so follow the visitor's language choice.
  const uiLang: Lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";
  const userId = user.id;

  const isPremium = true; // payment temporarily disabled

  if (params.id === "new") {
    const templateId = searchParams.template ?? "nakuru";
    const validTemplate = TEMPLATES.find((t) => t.id === templateId) ? templateId : "nakuru";
    const newId = nanoid();
    const fresh = searchParams.fresh === "true";

    // best-effort: missing/failed profile must NOT block doc creation
    let prof: UserProfile | null | undefined;
    if (!fresh) {
      try {
        [prof] = await db
          .select()
          .from(userProfile)
          .where(eq(userProfile.id, userId))
          .limit(1);
      } catch (e) {
        console.error("[CVEditor] profile read failed:", e);
      }
    }

    try {
      await db.insert(cv).values({
        id: newId,
        userId,
        title: "My CV",
        templateId: validTemplate,
        primaryColor: TEMPLATES.find((t) => t.id === validTemplate)?.previewColor ?? "#DA4A1C",
        data: seedCvData(prof),
      });
    } catch (err) {
      console.error("[CVEditor] insert failed:", err);
      redirect("/dashboard?error=cv_create_failed");
    }
    redirect(`/editor/cv/${newId}`);
  }

  let doc: CV | undefined;
  try {
    const [result] = await db
      .select()
      .from(cv)
      .where(and(eq(cv.id, params.id), eq(cv.userId, userId)))
      .limit(1);
    doc = result;
  } catch (err) {
    console.error("[CVEditor] fetch failed:", err);
    redirect("/dashboard?error=db_error");
  }

  if (!doc) notFound();

  return <CVEditorClient initialDoc={doc!} userId={userId} isPremium={isPremium} uiLang={uiLang} accessToken={session.access_token} backHref={backHrefFrom(searchParams.fromApp)} />;
}
