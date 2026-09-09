"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/context";
import { signOut } from "@/lib/auth-client";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { LogOut } from "lucide-react";

interface Props {
  dashboardLabel: string;
  settingsLabel: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: "grid" | "cv" | "mail" | "card" | "letter" | "gear" | "briefcase" | "spark";
  match?: string; // path prefix for active state
}

export function DashboardHeader({
  dashboardLabel,
  settingsLabel,
  userEmail,
  userAvatarUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const [accountOpen, setAccountOpen] = useState(false);

  // Close the account menu whenever the route changes.
  useEffect(() => { setAccountOpen(false); }, [pathname]);

  async function handleSignOut() {
    setAccountOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  // usePathname()/useSearchParams() are SSR-safe (unlike window.location, which
  // is undefined during server render and previously crashed every dashboard
  // page with "window is not defined"). `search` includes the leading "?".
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const search = qs ? `?${qs}` : "";
  const sw = lang === "sw";

  // Nav labels respect language (the sidebar previously ignored its own props
  // and hard-coded English). `dashboardLabel` / `settingsLabel` come from the
  // server layout; the tab labels are localized here.
  const DOC_NAV: NavItem[] = [
    { label: dashboardLabel,                          href: "/dashboard",                    icon: "grid" },
    { label: "Sumaiya",                               href: "/assistant",                    icon: "spark" },
    { label: sw ? "CV Zangu" : "My CVs",              href: "/dashboard?tab=cv",             icon: "cv",     match: "/dashboard?tab=cv" },
    { label: sw ? "Barua za Maombi" : "Cover Letters", href: "/dashboard?tab=cover-letter",  icon: "mail",   match: "/dashboard?tab=cover-letter" },
    { label: sw ? "Kadi za Biashara" : "Business Cards", href: "/dashboard?tab=business-card", icon: "card", match: "/dashboard?tab=business-card" },
    { label: sw ? "Barua Rasmi" : "Formal Letters",   href: "/dashboard?tab=letter",         icon: "letter", match: "/dashboard?tab=letter" },
    { label: sw ? "Kazi" : "Jobs",                    href: "/jobs",                         icon: "briefcase" },
  ];
  const BOTTOM_NAV: NavItem[] = [{ label: settingsLabel, href: "/settings", icon: "gear" }];

  const initial = userEmail ? userEmail[0].toUpperCase() : "U";

  return (
    <>
      {/* ── Desktop: espresso sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex w-[230px] min-w-[230px] bg-espresso h-screen sticky top-0 flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Logo
            className="text-cream [&_span]:!text-cream [&_span]:!opacity-100"
            showWordmark
            size="md"
          />
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col px-3 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">
          {/* Document nav group */}
          <div className="flex flex-col gap-0.5">
            {DOC_NAV.map((item) => {
              const active = pathname === item.href || (item.match && pathname + search === item.match) || (item.href === "/dashboard" && pathname === "/dashboard" && !search.includes("tab="));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium transition ${
                    active
                      ? "bg-ember/10 text-ember"
                      : "text-cream/70 hover:bg-espresso-2 hover:text-cream"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className={active ? "text-ember" : "text-cream/60"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 mx-4 h-px bg-espresso-line" />

          {/* Settings */}
          <div className="flex flex-col gap-0.5">
            {BOTTOM_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium transition ${
                    active
                      ? "bg-ember/10 text-ember"
                      : "text-cream/70 hover:bg-espresso-2 hover:text-cream"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className={active ? "text-ember" : "text-cream/60"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Spacer to push usage card to bottom */}
          <div className="flex-1 min-h-4" />

          {/* Access card — everything is unlocked (payments intentionally off),
              so no fake "free plan" usage bar / upgrade nudge. */}
          <div className="mx-2 mb-5 bg-espresso-2 rounded-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="check" size={14} className="text-gold" />
              <p className="text-xs font-semibold text-cream tracking-wide">
                {sw ? "Umefunguliwa Kila Kitu" : "Full access"}
              </p>
            </div>
            <p className="text-[11px] text-cream/50 leading-relaxed">
              {sw ? "Kila kitu kipo tayari kutumika." : "All features unlocked."}
            </p>
          </div>
        </nav>
      </aside>

      {/* ── Mobile: slim top bar (branding + account). All navigation lives in
          the bottom tab bar — there is no separate hamburger drawer, so the two
          overlapping mobile navs are now one. The avatar opens Settings, where
          account + sign-out live. ─────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border h-16">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/dashboard" aria-label={dashboardLabel}>
            <Logo showWordmark size="md" />
          </Link>

          {/* Account menu — tapping the avatar opens identity + settings +
              sign-out (the expected profile-menu behaviour), instead of
              jumping straight into Settings. */}
          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              aria-label={sw ? "Akaunti" : "Account"}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40"
            >
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAvatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-pine flex items-center justify-center text-cream text-sm font-bold">
                  {initial}
                </span>
              )}
            </button>

            {accountOpen && (
              <>
                {/* click-catcher to close */}
                <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-50 w-60 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-card shadow-floating overflow-hidden"
                >
                  {userEmail && (
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-[11px] text-text-muted">{sw ? "Umeingia kama" : "Signed in as"}</p>
                      <p className="text-sm font-medium text-espresso truncate">{userEmail}</p>
                    </div>
                  )}
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-espresso hover:bg-sand transition"
                  >
                    <Icon name="gear" size={18} className="text-text-muted" />
                    {settingsLabel}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-espresso hover:bg-sand transition border-t border-border"
                  >
                    <LogOut className="w-[18px] h-[18px] text-text-muted" />
                    {sw ? "Toka" : "Sign out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
