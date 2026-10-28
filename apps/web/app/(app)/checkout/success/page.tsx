import { headers } from "next/headers";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/translations";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment received" };

export default async function CheckoutSuccessPage() {
  const h = await headers();
  const lang = (h.get("x-lang") ?? "sw") as Lang;
  const sw = lang === "sw";

  return (
    <div className="bg-sand min-h-screen">
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-espresso text-cream">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-espresso mb-2">
          {sw ? "Asante — malipo yamepokelewa" : "Thank you — payment received"}
        </h1>
        <p className="text-text-muted mb-8">
          {sw
            ? "Premium yako imewashwa. Miundo yote na vipengele vya ziada sasa vinapatikana."
            : "Your Premium is now active. All designs and extra features are unlocked."}
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-xl bg-espresso px-6 py-3 font-semibold text-cream"
        >
          {sw ? "Rudi kwenye dashibodi" : "Back to dashboard"}
        </Link>
      </div>
    </div>
  );
}
