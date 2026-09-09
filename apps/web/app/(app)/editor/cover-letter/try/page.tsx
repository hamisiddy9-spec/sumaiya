import { CoverLetterEditorClient } from "@/components/editor/cover-letter-editor-client";
import type { CoverLetter } from "@/lib/db/schema";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const VALID_COVER_LETTER_TEMPLATES = ["classic", "modern"];
const DEFAULT_TEMPLATE = "classic";

export default async function GuestCoverLetterPage({
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
  const requestedTemplateId = VALID_COVER_LETTER_TEMPLATES.includes(params.template ?? "")
    ? params.template!
    : null;

  if (user) {
    redirect(requestedTemplateId ? `/editor/cover-letter/new?template=${requestedTemplateId}` : "/dashboard");
  }
  const templateId = requestedTemplateId ?? DEFAULT_TEMPLATE;

  const guestDoc: CoverLetter = {
    id: "guest",
    userId: "guest",
    title: "My Cover Letter",
    templateId,
    primaryColor: "#1e293b",
    fontFamily: "Georgia, serif",
    content: "",
    jobTitle: null,
    companyName: null,
    cvId: null,
    status: "draft",
    downloadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const lang = (await headers()).get("x-lang") === "en" ? "en" : "sw";

  return <CoverLetterEditorClient initialDoc={guestDoc} userId="guest" guestMode lang={lang} />;
}
