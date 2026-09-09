import { BusinessCardEditorClient } from "@/components/editor/business-card-editor-client";
import { createEmptyBusinessCardData, BUSINESS_CARD_TEMPLATES } from "@/types";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GuestBusinessCardPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  // The guest editor is only for logged-out visitors. A signed-in user who
  // picked a template gets a NEW editor seeded with it (not bounced to the
  // dashboard, which drops the choice).
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const params = await searchParams;
  const requestedTemplateId = BUSINESS_CARD_TEMPLATES.some((t) => t.id === params.template)
    ? params.template!
    : null;

  if (user) {
    redirect(requestedTemplateId ? `/editor/business-card/new?template=${requestedTemplateId}` : "/dashboard");
  }
  const templateId = requestedTemplateId ?? "classic";

  const guestDoc = {
    id: "guest",
    title: "My Business Card",
    templateId,
    primaryColor: "#1e293b",
    data: createEmptyBusinessCardData(),
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";

  return <BusinessCardEditorClient initialDoc={guestDoc} userId="guest" guestMode isPremium lang={lang} />;
}
