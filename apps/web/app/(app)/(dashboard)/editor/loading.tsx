import { headers } from "next/headers";
import { RouteProgress } from "@/components/ui/route-progress";
import { label } from "@/lib/i18n/labels";

// The editor mounts a large client bundle; a top bar is the honest signal (the
// grid skeleton it used to show looked nothing like the editor).
export default async function EditorLoading() {
  const lang = (await headers()).get("x-lang") ?? "sw";
  return <RouteProgress label={label(lang, "openingEditor")} />;
}
