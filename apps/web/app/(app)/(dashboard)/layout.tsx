import { Suspense } from "react";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LangProvider } from "@/lib/i18n/context";
import { subjectForUser } from "@/lib/entitlements-server";
import { isPremiumActive } from "@/lib/entitlements";
import type { Lang } from "@/lib/i18n/translations";

/** Sidebar placeholder shown during streaming Suspense for the dashboard
 *  header component that uses useSearchParams(). */
function SidebarFallback() {
  return (
    <div className="hidden md:block w-[230px] min-w-[230px] bg-espresso h-screen sticky top-0" />
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const h = await headers();
  const lang = (h.get("x-lang") ?? "sw") as Lang;

  // The account's REAL Premium state, resolved from the same
  // `profile.premiumUntil` the /api/entitlements route answers from (one
  // indexed lookup; lib/entitlements-server.ts already degrades to "no
  // Premium" on a DB blip rather than throwing). The sidebar's access card
  // claims what the account has, so it must not guess — D2 was a card that told
  // every account "everything is unlocked" while this flag was false.
  const premium = isPremiumActive((await subjectForUser(user?.id ?? null)).premiumUntil);

  const nav = {
    dashboardLabel: lang === "sw" ? "Nyumbani" : "Dashboard",
    settingsLabel:  lang === "sw" ? "Mipangilio" : "Settings",
    userEmail: user?.email,
    userAvatarUrl: user?.user_metadata?.avatar_url as string | undefined,
    premium,
  };

  return (
    <LangProvider lang={lang}>
      <Suspense fallback={<SidebarFallback />}>
        <DashboardShell nav={nav}>{children}</DashboardShell>
      </Suspense>
    </LangProvider>
  );
}
