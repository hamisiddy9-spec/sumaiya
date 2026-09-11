import { Suspense } from "react";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LangProvider } from "@/lib/i18n/context";
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

  const nav = {
    dashboardLabel: lang === "sw" ? "Nyumbani" : "Dashboard",
    settingsLabel:  lang === "sw" ? "Mipangilio" : "Settings",
    userEmail: user?.email,
    userAvatarUrl: user?.user_metadata?.avatar_url as string | undefined,
  };

  return (
    <LangProvider lang={lang}>
      <Suspense fallback={<SidebarFallback />}>
        <DashboardShell nav={nav}>{children}</DashboardShell>
      </Suspense>
    </LangProvider>
  );
}
