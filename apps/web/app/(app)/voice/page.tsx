import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VoiceIntake } from "@/components/voice/voice-intake";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const sw = (await headers()).get("x-lang") !== "en";
  return { title: sw ? "Tengeneza CV kwa kusema — Sumaiya" : "Build your CV by voice — Sumaiya" };
}

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?callbackUrl=%2Fvoice&reason=voice");

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;

  return (
    <main id="main" tabIndex={-1}>
      <VoiceIntake lang={lang} />
    </main>
  );
}
