import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TEMPLATES } from "@/types";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { getSampleCV } from "@/lib/sample-cv";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { FitFrame } from "@/components/templates/fit-frame";
import { resolveFontStack } from "@/lib/fonts";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { alternatesFor } from "@/lib/seo";

// One indexable, rankable landing page per template — the core of organic
// acquisition ("<name> CV template", "free ATS CV template", etc.). Static at
// build time for BOTH locales (the middleware rewrites /templates/x →
// /[locale]/templates/x), so they're fast and fully crawlable.
export function generateStaticParams() {
  return TEMPLATES.flatMap((t) => [
    { slug: t.id, locale: "sw" },
    { slug: t.id, locale: "en" },
  ]);
}

function findTemplate(slug: string) {
  return TEMPLATES.find((t) => t.id === slug);
}

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const t = findTemplate(params.slug);
  if (!t) return {};
  const title = `${t.name} CV Template — Free & ATS-Ready`;
  const description = `${t.name}: ${t.description}. Build a professional, ATS-friendly CV with the free ${t.name} template and an AI assistant. Edit online and download a perfect PDF in minutes.`;
  return {
    title,
    description,
    alternates: alternatesFor(`/templates/${t.id}`, params.locale),
    openGraph: {
      title: `${title} | Sumaiya`,
      description,
      url: `/templates/${t.id}`,
      // og:image is supplied by the sibling opengraph-image.tsx (a live,
      // per-template branded preview card).
    },
  };
}

// A4 preview. The sheet is FITTED to whatever column it lands in by FitFrame;
// this constant is only the cap that keeps the preview from ballooning on a wide
// screen. It used to be a fixed width with a matching hand-computed scale, which
// pinned the sheet to the column's left edge and clipped it on any viewport
// narrower than ~412px (measured at 390px: a 380px sheet in a 358px column).
const MAX_PREVIEW_W = 380;

export default function TemplateDetailPage({ params }: { params: { slug: string; locale: string } }) {
  const t = findTemplate(params.slug);
  if (!t) notFound();

  const Component = TEMPLATE_COMPONENTS[t.id] ?? NakuruTemplate;
  // Localised preview: the Swahili URL shows a Swahili CV, headings and all.
  const sample = getSampleCV(params.locale === "en" ? "en" : "sw");
  const related = TEMPLATES.filter((x) => x.id !== t.id && x.style === t.style).slice(0, 6);

  return (
    <div className="bg-sand min-h-screen">
      <MarketingNav />
      <div className="max-w-5xl mx-auto px-4 py-10 lg:py-16">
        <nav className="text-xs text-text-muted mb-6">
          <Link href="/templates" className="hover:text-ember">Templates</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text-body">{t.name}</span>
        </nav>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
          {/* Copy + CTA */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-ember-hover mb-3">CV Template</p>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-espresso mb-4">
              {t.name} CV Template
            </h1>
            <p className="text-text-body text-base leading-relaxed mb-6">
              {t.description}. A clean, recruiter-friendly, <strong>ATS-friendly</strong> design you can
              fill in online and download as a pixel-perfect PDF — free, in minutes. Built for job
              seekers everywhere, with an AI assistant to help you get hired.
            </p>

            <ul className="space-y-2 mb-8 text-sm text-text-body">
              <li>✓ ATS-optimized — passes automated recruiter screening</li>
              <li>✓ Free to build &amp; export as PDF</li>
              <li>✓ Writing help for your summary &amp; experience</li>
              <li>✓ Matching cover letter &amp; business card in the same style</li>
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/editor/cv/try?template=${t.id}`}
                className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-6 py-3 rounded-[10px] shadow-[0_3px_0_#A8330F] hover:bg-ember-hover active:translate-y-[2px] active:shadow-[0_1px_0_#A8330F] transition"
              >
                Use the {t.name} template →
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 border border-border-input text-espresso font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-cream transition"
              >
                Browse all templates
              </Link>
            </div>
          </div>

          {/* Live preview */}
          <div className="mx-auto" style={{ maxWidth: MAX_PREVIEW_W }}>
            <FitFrame
              sheetClassName="rounded-[3px] bg-white shadow-floating ring-1 ring-black/[0.05]"
            >
                <TemplateCanvas>
                  <Component
                    data={sample}
                    primaryColor={t.previewColor}
                    fontFamily={resolveFontStack("Inter")}
                    lang={params.locale === "en" ? "en" : "sw"}
                  />
                </TemplateCanvas>
            </FitFrame>
          </div>
        </div>

        {/* Related templates — internal links help crawl + ranking */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display font-bold text-lg text-espresso mb-4">More {t.style} templates</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/templates/${r.id}`}
                  className="inline-flex items-center gap-2 bg-card border border-border rounded-pill px-4 py-2 text-sm font-medium text-espresso hover:border-ember/40 transition"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.previewColor }} />
                  {r.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
