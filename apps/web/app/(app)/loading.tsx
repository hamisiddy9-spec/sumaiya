import { headers } from "next/headers";
import { RouteProgress } from "@/components/ui/route-progress";
import { label } from "@/lib/i18n/labels";

export default async function RootLoading() {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return <RouteProgress label={label(lang, "loading")} />;
}
