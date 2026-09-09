import type { Metadata } from "next";
import { headers } from "next/headers";
import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return lang === "sw"
    ? { title: "Weka Nywila Mpya", description: "Weka nywila mpya ya akaunti yako ya Sumaiya." }
    : { title: "Set New Password", description: "Set a new password for your Sumaiya account." };
}

// Landed on by the password-reset email link (via /api/auth/confirm, which
// verifies the recovery token and establishes a session, then redirects
// here) and, for accounts created via Google, this is also how they get a
// password at all — Google sign-in issues no password, and until mobile
// supports Google auth directly, a password is the only way in from the app.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return <ResetPasswordForm lang={lang} />;
}
