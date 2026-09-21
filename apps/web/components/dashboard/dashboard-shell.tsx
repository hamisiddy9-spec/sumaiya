"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

export interface DashboardNav {
  dashboardLabel: string;
  settingsLabel: string;
  userEmail?: string;
  userAvatarUrl?: string;
  /** Server-resolved Premium state — see lib/access-copy.ts. */
  premium?: boolean;
}

/**
 * Decides the app chrome per route. Editor and Studio run full-screen with their
 * own toolbars — they must NOT get the dashboard sidebar / mobile header / bottom
 * tab bar (which previously bled in and squeezed the editor on mobile). Every
 * other dashboard route gets the sidebar (desktop) that stacks to a top header on
 * mobile (md:flex, not flex), plus the bottom tab bar.
 */
export function DashboardShell({ nav, children }: { nav: DashboardNav; children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = /^\/(editor|studio)(\/|$)/.test(pathname);

  if (fullBleed) return <>{children}</>;

  return (
    <>
      <div className="min-h-screen md:flex">
        <DashboardHeader {...nav} />
        <main className="flex-1 bg-sand min-h-screen">{children}</main>
      </div>
      <MobileTabBar />
    </>
  );
}
