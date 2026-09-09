import { LetterEditorClient } from "@/components/editor/letter-editor-client";
import { createEmptyLetterData, LETTER_TEMPLATES } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GuestLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; type?: string }>;
}) {
  // The guest editor is only for logged-out visitors. A signed-in user who
  // picked a template/type gets a NEW editor seeded with it (not bounced to the
  // dashboard, which drops the choice).
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const params = await searchParams;
  const requestedTemplateId = LETTER_TEMPLATES.some((t) => t.id === params.template)
    ? params.template!
    : null;

  if (user) {
    const q = new URLSearchParams();
    if (requestedTemplateId) q.set("template", requestedTemplateId);
    if (params.type) q.set("type", params.type);
    const qs = q.toString();
    redirect(qs ? `/editor/letter/new?${qs}` : "/dashboard");
  }

  const templateId = requestedTemplateId ?? "formal";
  const letterType = params.type ?? "reference";
  const lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";

  const guestDoc = {
    id: "guest",
    title: "My Letter",
    letterType,
    templateId,
    primaryColor: "#1e293b",
    data: createEmptyLetterData(letterType as any, lang) as unknown as Record<string, unknown>,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return <LetterEditorClient initialDoc={guestDoc} userId="guest" guestMode isPremium lang={lang} />;
}
