"use client";

import { useLang } from "@/lib/i18n/context";
import { RouteProgress } from "@/components/ui/route-progress";

// Marketing routes are statically prerendered — they arrive almost instantly, so
// a layout-shaped skeleton only flashed a wrong-looking page first. A thin bar
// signals the transition honestly. Client component: see the [locale] loader.
export default function MarketingLoading() {
  const lang = useLang();
  return <RouteProgress label={lang === "sw" ? "Ninapakia…" : "Loading…"} />;
}
