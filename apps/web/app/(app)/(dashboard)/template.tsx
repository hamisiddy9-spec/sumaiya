"use client";

// Fades the dashboard content pane (not the persistent sidebar/header, which
// live in the layout) on every navigation between dashboard routes — the same
// .route-enter treatment the marketing subtree uses. Reduced-motion → none.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
