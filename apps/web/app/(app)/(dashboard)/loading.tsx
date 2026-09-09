import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

// Use the grid skeleton (not a lone centered spinner) so navigating to the
// dashboard doesn't flash a spinner then pop the whole grid in — the skeleton
// matches the real layout, so there's no jarring shift.
export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DashboardSkeleton />
    </div>
  );
}
