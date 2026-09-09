import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, businessCard, userProfile } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { BusinessCardEditorClient } from "@/components/editor/business-card-editor-client";
import { BUSINESS_CARD_TEMPLATES } from "@/types";
import { seedBusinessCardData } from "@/lib/profile-mappers";
import type { UserProfile } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Business Card Editor" };

interface Props {
  params: { id: string };
  searchParams: { template?: string };
}

export default async function BusinessCardEditorPage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const callbackUrl = params.id === "new"
      ? "/editor/business-card/new"
      : `/editor/business-card/${params.id}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const user = session.user;

  // The editor UI is fully bilingual, so follow the visitor's language choice.
  const lang: Lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";
  const userId = user.id;

  const isPremium = true; // payment temporarily disabled

  if (params.id === "new") {
    const requestedTemplate = searchParams.template ?? "";
    const matchedTemplate = BUSINESS_CARD_TEMPLATES.find((t) => t.id === requestedTemplate);
    const chosenTemplate = matchedTemplate ?? BUSINESS_CARD_TEMPLATES[0];
    const newId = nanoid();

    let prof: UserProfile | null | undefined;
    try {
      [prof] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, userId))
        .limit(1);
    } catch (e) {
      console.error("[BusinessCardEditor] profile read failed:", e);
    }

    try {
      await db.insert(businessCard).values({
        id: newId,
        userId,
        title: "My Business Card",
        templateId: chosenTemplate.id,
        primaryColor: chosenTemplate.previewColor,
        data: seedBusinessCardData(prof),
      });
    } catch (err) {
      console.error("[BusinessCardEditor] insert failed:", err);
      redirect("/dashboard?error=bc_create_failed");
    }
    redirect(`/editor/business-card/${newId}`);
  }

  let doc: typeof businessCard.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(businessCard)
      .where(and(eq(businessCard.id, params.id), eq(businessCard.userId, userId)))
      .limit(1);
    doc = result;
  } catch (err) {
    console.error("[BusinessCardEditor] fetch failed:", err);
    redirect("/dashboard?error=db_error");
  }

  if (!doc) notFound();

  return (
    <BusinessCardEditorClient
      initialDoc={doc!}
      userId={userId}
      isPremium={isPremium}
      lang={lang}
    />
  );
}
