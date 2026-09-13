import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TemplateGalleryClient } from "@/components/template-gallery-client";
import { MarketingNav } from "@/components/ui/marketing-nav";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { translations, type Lang } from "@/lib/i18n/translations";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const lang = (params.locale ?? "sw") as Lang;
  const tr = translations[lang].templates;
  // Absolute og image — this page's openGraph REPLACES the marketing layout's
  // (Next shallow-merges at the openGraph key), so the image must be declared
  // here or the template gallery ships without a social preview.
  const ogImage = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.app"}/og-image.png`;
  return {
    alternates: { canonical: "/templates" },
    title: tr.title,
    description: translations[lang].nav.templates + " — " + tr.subtitle,
    openGraph: {
      title: `${tr.title} — Sumaiya`,
      description: tr.subtitle,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Sumaiya — Professional CV & document builder with an AI assistant" }],
    },
  };
}

export default async function TemplatesPage({ params }: { params: { locale: string } }) {
  const lang = (params.locale ?? "sw") as Lang;
  const tr = translations[lang].templates;

  return (
    <div className="min-h-screen bg-cream">
      <MarketingNav />

      {/* Dark header band */}
      <section className="bg-espresso">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 text-center">
          <p className="font-mono text-[11px] text-ember-hover tracking-[0.2em] uppercase mb-4">
            BROWSE TEMPLATES
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-cream mb-4">
            {tr.title}
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            {tr.subtitle}
          </p>
        </div>
      </section>

      <main id="main" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <TemplateGalleryClient />

        {/* CTA section */}
        <section className="mt-16 md:mt-20 bg-espresso rounded-card-lg py-12 md:py-16 px-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-cream mb-3">
            {tr.ctaHeading}
          </h2>
          <p className="text-text-muted mb-2 max-w-md mx-auto text-sm">
            {tr.ctaDescription}
          </p>
          <p className="text-text-muted/60 text-xs mb-8 max-w-md mx-auto">
            {tr.ctaSwitch}
          </p>
          <Link
            href="/editor/cv/try?template=nakuru"
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-8 md:px-10 py-3.5 md:py-4 rounded-input-lg transition active:scale-[0.98] shadow-ember-hard active:shadow-ember-active active:translate-y-[2px]"
          >
            {tr.ctaButton} <ChevronRight className="w-5 h-5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
