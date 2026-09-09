import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, letter, userProfile } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { LetterEditorClient } from "@/components/editor/letter-editor-client";
import { createEmptyLetterData, LETTER_TEMPLATES, type LetterType } from "@/types";
import { seedLetterSender } from "@/lib/profile-mappers";
import type { UserProfile } from "@/lib/db/schema";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Letter Editor" };

interface Props {
  params: { id: string };
  searchParams: { type?: string; template?: string };
}

export default async function LetterEditorPage({ params, searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const callbackUrl = params.id === "new"
      ? "/editor/letter/new"
      : `/editor/letter/${params.id}`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  const user = session.user;

  // The editor UI is fully bilingual, so follow the visitor's language choice.
  const lang: Lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";
  const userId = user.id;

  const isPremium = true; // payment temporarily disabled

  if (params.id === "new") {
    const letterType = (searchParams.type as LetterType) ?? "reference";
    const defaultTemplate =
      LETTER_TEMPLATES.find((t) => t.id === searchParams.template) ??
      LETTER_TEMPLATES[0];
    const newId = nanoid();

    let prof: UserProfile | null | undefined;
    try {
      [prof] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, userId))
        .limit(1);
    } catch (e) {
      console.error("[LetterEditor] profile read failed:", e);
    }

    const letterData = createEmptyLetterData(letterType, lang);
    const seededFrom = seedLetterSender(prof);
    const data = { ...letterData, from: { ...letterData.from, ...seededFrom.from } };

    try {
      await db.insert(letter).values({
        id: newId,
        userId,
        title: "My Letter",
        letterType,
        templateId: defaultTemplate.id,
        primaryColor: defaultTemplate.previewColor,
        data,
      });
    } catch (err) {
      console.error("[LetterEditor] insert failed:", err);
      redirect("/dashboard?error=letter_create_failed");
    }
    redirect(`/editor/letter/${newId}`);
  }

  let doc: typeof letter.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(letter)
      .where(and(eq(letter.id, params.id), eq(letter.userId, userId)))
      .limit(1);
    doc = result;
  } catch (err) {
    console.error("[LetterEditor] fetch failed:", err);
    redirect("/dashboard?error=db_error");
  }

  if (!doc) notFound();

  return (
    <LetterEditorClient
      initialDoc={{
        ...doc!,
        data: doc!.data as Record<string, unknown>,
        createdAt: doc!.createdAt.toISOString(),
        updatedAt: doc!.updatedAt.toISOString(),
      }}
      userId={userId}
      isPremium={isPremium}
      lang={lang}
    />
  );
}
