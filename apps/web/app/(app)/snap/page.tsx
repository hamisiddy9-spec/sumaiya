import { headers } from "next/headers";
import type { Metadata } from "next";
import type { Lang } from "@/lib/i18n/translations";
import { SnapClient } from "./snap-client";

export const metadata: Metadata = { title: "Snap-to-Apply" };
export const dynamic = "force-dynamic";

// E1 Snap-to-Apply — paste-text slice. Guest-friendly (the (app) subtree is
// NOT in the middleware's protected allowlist, so signed-out visitors reach
// this page; the route itself handles guest vs authed CV resolution).
export default async function SnapPage() {
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  return (
    <main id="main" tabIndex={-1} className="min-h-dvh bg-sand">
      <SnapClient lang={lang} />
    </main>
  );
}
