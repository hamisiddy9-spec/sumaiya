import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CvAssistantClient, type AssistantProfile } from "@/components/assistant/cv-assistant-client";
import { assembleUserContext } from "@/lib/assistant/context";
import { safeFirstName } from "@/lib/assistant/safe-name";
import type { CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  return {
    title: lang === "sw" ? "Sumaiya — Msaidizi wako wa Kazi" : "Sumaiya — Your Career Assistant",
  };
}
export const dynamic = "force-dynamic";

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ cv?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  const { cv: activeCvId } = await searchParams;

  // Logged-out visitors get a guest CV flow (frictionless funnel) instead of a
  // sign-in wall; they hand off to the guest editor and sign up only to save.
  if (!user) {
    return (
      <main id="main" tabIndex={-1}>
        <CvAssistantClient lang={lang} guest />
      </main>
    );
  }

  // PHASE 2 (B): the cockpit reads the SAME unified context every surface
  // uses — profile + active CV + applications + matched jobs + unconfirmed
  // facts. The assistant turn re-assembles it server-side too, so Sumaiya's
  // "what you already know" block and the opening message are continuous.
  // Non-fatal: a failed read just means an unpersonalised chat.
  let profile: AssistantProfile | null = null;
  let activeCv: CVData | null = null;
  let activeCvTitle = "";
  let initialUnconfirmed = 0;
  // The CV the assistant actually works with. assembleUserContext resolves the
  // `?cv=` param, and when none is given it falls back to the user's most
  // recent CV (cvRows[0]) — so a plain /assistant visit still has a real CV to
  // tailor/apply to. Previously we only passed the raw searchParam, which made
  // every apply action (tailor/summary/skills) silently no-op outside cockpit
  // mode: the buttons rendered enabled but the handlers returned early on
  // `!activeCvId`. Now the id comes from the resolved context, not the URL.
  let activeCvIdResolved: string | undefined;
  try {
    const ctx = await assembleUserContext(user.id, { activeCvId });
    const p = ctx.profile?.personal;
    profile = {
      fullName: p?.fullName ?? "", jobTitle: p?.jobTitle ?? "", email: p?.email ?? "",
      phone: p?.phone ?? "", location: p?.location ?? "",
      linkedin: p?.linkedin ?? "", website: p?.website ?? "",
      summary: ctx.profile?.summary ?? ctx.profileSummary,
    };
    if (ctx.activeCv) {
      activeCv = ctx.activeCv.data;
      activeCvTitle = ctx.activeCv.title;
      activeCvIdResolved = ctx.activeCv.id;
    }
    initialUnconfirmed = ctx.unconfirmed.length;
  } catch { /* unpersonalised is fine */ }

  const firstName = safeFirstName(
    profile?.fullName,
    String(user.user_metadata?.name ?? ""),
    user.email ?? "",
  );

  return (
    <main id="main" tabIndex={-1}>
      <CvAssistantClient
        lang={lang}
        firstName={firstName}
        profile={profile}
        userId={user.id}
        activeCv={activeCv}
        activeCvId={activeCv ? (activeCvIdResolved ?? activeCvId ?? undefined) : undefined}
        activeCvTitle={activeCvTitle}
        initialUnconfirmed={initialUnconfirmed}
      />
    </main>
  );
}
