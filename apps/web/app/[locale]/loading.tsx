"use client";

import { useLang } from "@/lib/i18n/context";
import { RouteProgress } from "@/components/ui/route-progress";

// Client component on purpose: loading files receive no params, and reading a
// request header here would risk forcing the static subtree dynamic.
export default function LocaleLoading() {
  const lang = useLang();
  return <RouteProgress label={lang === "sw" ? "Inapakia…" : "Loading…"} />;
}
