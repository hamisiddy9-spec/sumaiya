import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignInFormWrapper } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return lang === "sw"
    ? {
        title: "Ingia",
        description: "Ingia Sumaiya kufikia CV, barua za maombi na hati zako za kikazi. Hakuna nywila — tunatumia kiungo cha kuingia (magic link).",
      }
    : {
        title: "Sign In",
        description: "Sign in to Sumaiya to access your CVs, cover letters, and professional documents. No password needed — we use magic links.",
      };
}

// Don't cache the auth page — a stale copy served on Back after login is exactly
// the "I'm logged in but see the sign-in screen" bug users hit.
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  // Already signed in? Skip the form entirely (handles fresh navigations here).
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = (await headers()).get("x-lang") ?? "sw";
  return <SignInFormWrapper lang={lang} />;
}
