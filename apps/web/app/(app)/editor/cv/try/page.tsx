import { CVEditorClient } from "@/components/editor/cv-editor-client";
import { createEmptyCVData, TEMPLATES } from "@/types";
import type { CV } from "@/lib/db/schema";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function GuestEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  // Authenticated users shouldn't land on the guest editor — it resets to a
  // blank guest doc. They're redirected below (to a new editor when they picked
  // a template, else the dashboard).
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  // The guest editor is only for logged-out visitors (it resets to a blank
  // guest doc). But a SIGNED-IN user who picked a template on the landing page
  // must not be dumped on the dashboard — that silently drops their choice.
  // Send them into a NEW editor seeded with that template instead. With no
  // template (a generic "Try free" click), the dashboard is still the right
  // home so we don't spawn a blank CV on every click.
  const { data: { user } } = await supabase.auth.getUser();

  const params = await searchParams;
  const requestedTemplateId = TEMPLATES.some((t) => t.id === params.template)
    ? params.template!
    : null;

  if (user) {
    redirect(requestedTemplateId ? `/editor/cv/new?template=${requestedTemplateId}` : "/dashboard");
  }

  const templateId = requestedTemplateId ?? "nakuru";

  const guestDoc: CV = {
    id: "guest",
    userId: "guest",
    title: "My CV",
    data: createEmptyCVData(),
    templateId,
    primaryColor: "#DA4A1C",
    fontFamily: "Inter",
    downloadCount: 0,
    status: "draft",
    isPublic: false,
    publicSlug: null,
    publicShowContact: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Follow the visitor's language (Swahili-first) so the guest editor matches
  // the marketing site instead of defaulting to English.
  const uiLang = (await headers()).get("x-lang") === "en" ? "en" : "sw";

  return <CVEditorClient initialDoc={guestDoc} userId="guest" guestMode requestedTemplateId={requestedTemplateId} uiLang={uiLang} />;
}
