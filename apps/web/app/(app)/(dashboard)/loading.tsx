import { headers } from "next/headers";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { label } from "@/lib/i18n/labels";

// Use the grid skeleton (not a lone centered spinner) so navigating to the
// dashboard doesn't flash a spinner then pop the whole grid in — the skeleton
// matches the real layout, so there's no jarring shift.
// It carries the words now: a bare grey grid announced nothing to a screen
// reader and explained nothing to a first-time user on a slow connection.
export default async function DashboardLoading() {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DashboardSkeleton label={label(lang, "loading")} />
    </div>
  );
}
