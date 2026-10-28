import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { alternatesFor } from "@/lib/seo";
import { PAYMENTS_ENABLED } from "@/lib/features";
import { PLANS } from "@/lib/payments/plans";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/pricing", params.locale),
    title: sw ? "Bei" : "Pricing",
    description: sw
      ? "Tengeneza CV na upakue PDF bila malipo. Premium hufungua miundo yote ya kitaalamu — lipa kwa simu, kwa bei nafuu."
      : "Build a CV and download the PDF for free. Premium unlocks every professional design — pay by mobile money, affordably.",
  };
}

function formatTzs(amount: number): string {
  return `TSh ${new Intl.NumberFormat("en-US").format(amount)}`;
}

export default function PricingPage({ params }: { params: { locale: string } }) {
  const sw = params.locale !== "en";

  const freePerks = sw
    ? ["Jenga CV na upakue PDF", "Kiingereza na Kiswahili", "Kikagua CV (ATS)", "Barua za maombi na kadi za biashara"]
    : ["Build a CV & download the PDF", "English & Kiswahili", "ATS readability check", "Cover letters & business cards"];

  const premiumPerks = sw
    ? ["Kila kitu cha bure", "Miundo YOTE ya kitaalamu (premium)", "Hakuna alama ya maji", "Unasaidia bidhaa ya Kitanzania"]
    : ["Everything in Free", "ALL premium designs unlocked", "No watermark", "You support a Tanzanian product"];

  return (
    <>
      <MarketingNav />
      <main id="main" className="bg-sand min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <header className="text-center mb-12">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-espresso mb-3">
              {sw ? "Bei nyepesi na ya wazi" : "Simple, honest pricing"}
            </h1>
            <p className="text-text-muted max-w-xl mx-auto">
              {sw
                ? "Kuanza ni bure kabisa. Premium ni kwa wanaotaka miundo yote — lipa kwa simu, hakuna kadi."
                : "Getting started is completely free. Premium is for people who want every design — pay by mobile money, no card."}
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Free */}
            <section className="rounded-2xl bg-white border border-black/5 p-7 shadow-sm">
              <h2 className="font-display font-bold text-espresso mb-1">{sw ? "Bure" : "Free"}</h2>
              <p className="font-display font-extrabold text-3xl text-espresso mb-5">
                {formatTzs(0)}
              </p>
              <ul className="space-y-2.5 mb-6">
                {freePerks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-espresso">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-espresso/60" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/editor/cv/try"
                className="block text-center rounded-xl border border-espresso/20 px-4 py-3 font-semibold text-espresso hover:bg-espresso/5 transition-colors"
              >
                {sw ? "Anza bure" : "Start free"}
              </Link>
            </section>

            {/* Premium */}
            <section className="rounded-2xl bg-espresso text-cream p-7 shadow-sm relative overflow-hidden">
              <h2 className="font-display font-bold mb-1">{sw ? "Premium" : "Premium"}</h2>
              <p className="font-display font-extrabold text-3xl mb-1">
                {formatTzs(PLANS.monthly.amount.TZS)}
                <span className="text-cream/70 text-base font-normal">{sw ? " / mwezi" : " / month"}</span>
              </p>
              <p className="text-cream/70 text-sm mb-5">
                {sw
                  ? `au ${formatTzs(PLANS.annual.amount.TZS)} kwa mwaka (miezi 2 bure)`
                  : `or ${formatTzs(PLANS.annual.amount.TZS)} a year (2 months free)`}
              </p>
              <ul className="space-y-2.5 mb-6">
                {premiumPerks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              {PAYMENTS_ENABLED ? (
                <div className="space-y-2.5">
                  <Link
                    href="/checkout?plan=monthly"
                    className="block text-center rounded-xl bg-cream px-4 py-3 font-semibold text-espresso hover:opacity-90 transition-opacity"
                  >
                    {sw ? `Lipa kwa mwezi — ${formatTzs(PLANS.monthly.amount.TZS)}` : `Go monthly — ${formatTzs(PLANS.monthly.amount.TZS)}`}
                  </Link>
                  <Link
                    href="/checkout?plan=annual"
                    className="block text-center rounded-xl border border-cream/30 px-4 py-3 font-semibold text-cream hover:bg-cream/10 transition-colors"
                  >
                    {sw ? `Lipa kwa mwaka — ${formatTzs(PLANS.annual.amount.TZS)}` : `Go annual — ${formatTzs(PLANS.annual.amount.TZS)}`}
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl bg-cream/10 px-4 py-3 text-center text-sm text-cream/80">
                  {sw
                    ? "Premium inakuja hivi karibuni. Kwa sasa kila kitu ni bure."
                    : "Premium is coming soon. For now, everything is free."}
                </div>
              )}
            </section>
          </div>

          <p className="text-center text-xs text-text-muted mt-8">
            {sw
              ? "Malipo kwa njia ya simu (M-Pesa, Airtel, Tigo, Halopesa). Unaweza kughairi wakati wowote."
              : "Mobile-money payment (M-Pesa, Airtel, Tigo, Halopesa). Cancel anytime."}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
