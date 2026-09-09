import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, cv } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { StudioClient } from "@/components/studio/studio-client";
import type { CV } from "@/lib/db/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design Studio" };

export default async function StudioPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/studio/${params.id}`)}`);

  let doc: CV | undefined;
  try {
    const [row] = await db
      .select()
      .from(cv)
      .where(and(eq(cv.id, params.id), eq(cv.userId, session.user.id)))
      .limit(1);
    doc = row;
  } catch {
    redirect("/dashboard?error=db_error");
  }
  if (!doc) notFound();

  return <StudioClient initialDoc={doc} accessToken={session.access_token} />;
}
