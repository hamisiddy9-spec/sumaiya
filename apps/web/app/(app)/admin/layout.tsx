import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const metadata = { title: "Admin" };

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "user" },
  { href: "/admin/templates", label: "Templates", icon: "layers" },
  { href: "/admin/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/admin/submissions", label: "Submissions", icon: "folder" },
  { href: "/admin/insights", label: "Insights", icon: "chart" },
];

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5",
    layers: "M12 3 2 8l10 5 10-5-10-5ZM2 16l10 5 10-5M2 12l10 5 10-5",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    briefcase: "M3 7h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18",
    chart: "M3 3v15a3 3 0 0 0 3 3h15M8 17v-5M13 17V8M18 17v-3",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d={paths[name] ?? paths.grid} />
    </svg>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  // getUser() verifies the JWT with Supabase (getSession() only trusts the
  // cookie) — defense-in-depth for the admin gate on top of middleware.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?callbackUrl=%2Fadmin");
  if (!isAdmin(user.email)) redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-sand text-espresso">
      {/* Espresso sidebar */}
      <aside className="hidden md:flex w-[230px] min-w-[230px] bg-espresso h-screen sticky top-0 flex-col">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ember shadow-[0_2px_0_#A8330F]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5EE" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
            </div>
            <span className="font-display font-extrabold text-cream tracking-tight">Admin</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col px-3 gap-0.5">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium text-cream/70 hover:bg-espresso-2 hover:text-cream transition">
              <NavIcon name={item.icon} /> {item.label}
            </Link>
          ))}
          <div className="mt-auto mb-4 px-1">
            <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-medium text-cream/50 hover:text-cream transition">
              <ChevronLeft className="w-4 h-4" /> Back to app
            </Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden bg-espresso text-cream px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <span className="font-display font-extrabold">Admin</span>
          <div className="flex gap-3 text-xs">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-cream/70 hover:text-cream">{n.label}</Link>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
