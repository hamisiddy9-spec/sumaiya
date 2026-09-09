import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, profile } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/settings/settings-form";
import { t } from "@/lib/i18n/translations";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const h = await headers();
  const user = session?.user;
  if (!user) redirect("/sign-in?callbackUrl=%2Fsettings");

  const lang = (h.get("x-lang") ?? "sw") as Lang;
  const userId = user.id;

  let dbProfile: typeof profile.$inferSelect | undefined;
  try {
    const [result] = await db
      .select()
      .from(profile)
      .where(eq(profile.id, userId))
      .limit(1);
    dbProfile = result;
  } catch (err) {
    console.error("[Settings] profile fetch failed:", err);
  }

  // Payments retired — everything is free & unlocked.
  const planLabel = lang === "sw" ? "Bure" : "Free";

  return (
    <div className="bg-sand min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-espresso mb-2">{t(lang, "settings.title")}</h1>
        <p className="text-text-muted mb-10">{t(lang, "settings.subtitle")}</p>

        <SettingsForm
          lang={lang}
          userId={userId}
          initialName={dbProfile?.name ?? user.user_metadata?.name ?? ""}
          initialEmail={dbProfile?.email ?? user.email ?? ""}
          planLabel={planLabel}
          userInitial={(dbProfile?.name ?? user.user_metadata?.name ?? "")[0]?.toUpperCase() ?? "U"}
        />
      </div>

      {/* Closing brand band */}
      <div className="relative bg-espresso overflow-hidden py-16">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.15] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #F2A93B 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <p className="text-cream/60 text-sm font-medium tracking-wider uppercase">
            Sumaiya
          </p>
          <p className="text-cream/40 text-xs mt-2">
            &copy; {new Date().getFullYear()} Sumaiya. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
