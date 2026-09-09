"use client";

// template.tsx re-mounts on every navigation within this subtree (layout.tsx
// does not), so it's the one place to give every marketing route the same
// short fade-rise as it settles in — replacing the previous hard cut / grid-
// skeleton flash. Pure CSS (.route-enter in globals.css); reduced-motion → none.
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
