import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { PDF_TOOLS, getPdfTool } from "@/lib/pdf-tools";
import type { Lang } from "@/lib/i18n/translations";
import { alternatesFor } from "@/lib/seo";

// One indexable, rankable landing page per PDF tool — the interactive tools
// themselves live on the client `/tools` page (no server metadata), so these
// pages capture high-intent search traffic ("merge PDF", "image to PDF free")
// and hand the visitor straight into the working tool via a deep link.
//
// Sumaiya is Swahili-first (default lang "sw"). The language comes from the
// URL `[locale]` segment (middleware rewrites /tools/x → /[locale]/tools/x), so
// this page is statically prerendered in both languages.
export function generateStaticParams() {
  return PDF_TOOLS.flatMap((t) => [
    { slug: t.slug, locale: "sw" },
    { slug: t.slug, locale: "en" },
  ]);
}

async function resolveLang(params: { locale: string }): Promise<Lang> {
  return (params.locale ?? "sw") as Lang;
}

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const t = getPdfTool(params.slug);
  if (!t) return {};
  const lang = await resolveLang(params);
  const name = t.name[lang];
  const description = t.description[lang];
  const title = lang === "sw" ? `${name} — Mtandaoni Bila Malipo, Bila Usajili` : `${name} — Free Online, No Sign-Up`;
  return {
    title,
    description,
    keywords: t.keywords,
    alternates: alternatesFor(`/tools/${t.slug}`, params.locale),
    openGraph: {
      title: `${name} | Sumaiya`,
      description,
      url: `/tools/${t.slug}`,
      // og:image is supplied by the sibling opengraph-image.tsx.
    },
  };
}

export default async function ToolDetailPage({ params }: { params: { slug: string; locale: string } }) {
  const t = getPdfTool(params.slug);
  if (!t) notFound();

  const lang = await resolveLang(params);
  const sw = lang === "sw";

  const name = t.name[lang];
  const tagline = t.tagline[lang];
  const description = t.description[lang];
  const steps = t.steps[lang];

  const related = PDF_TOOLS.filter((x) => x.slug !== t.slug).slice(0, 6);
  const tryHref = `/tools#tool-${t.slug}`;

  // "How to X" heading + HowTo schema name, phrased naturally per language.
  const howToTitle = sw ? `Jinsi ya kutumia ${name}` : `How to ${t.name.en.toLowerCase()}`;

  // HowTo + FAQ structured data — helps these pages earn rich results. Emitted in
  // the active language so the schema matches the visible copy.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: howToTitle,
        description,
        step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
      },
      {
        "@type": "FAQPage",
        mainEntity: t.faqs.map((f) => ({
          "@type": "Question",
          name: f.q[lang],
          acceptedAnswer: { "@type": "Answer", text: f.a[lang] },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-sand text-espresso">
      <MarketingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-4xl mx-auto px-4 py-10 lg:py-14">
        <nav className="text-xs text-text-muted mb-6">
          <Link href="/tools" className="hover:text-ember">{sw ? "Zana za PDF" : "PDF Tools"}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text-body">{name}</span>
        </nav>

        {/* Hero */}
        <p className="text-[11px] font-mono uppercase tracking-widest text-ember-hover mb-3">{sw ? "Zana ya PDF Bila Malipo" : "Free PDF Tool"}</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-espresso mb-4">
          {name}
        </h1>
        <p className="text-text-body text-base md:text-lg leading-relaxed mb-2 max-w-2xl">{tagline}.</p>
        <p className="text-text-body text-base leading-relaxed mb-7 max-w-2xl">{description}</p>

        <div className="flex flex-wrap gap-3 mb-4">
          <Link
            href={tryHref}
            className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-6 py-3 rounded-[10px] shadow-[0_3px_0_#A8330F] hover:bg-ember-hover active:translate-y-[2px] active:shadow-[0_1px_0_#A8330F] transition"
          >
            {sw ? `Tumia ${name}` : `Use ${name}`} →
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 border border-border-input text-espresso font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-cream transition"
          >
            {sw ? "Zana zote za PDF" : "All PDF tools"}
          </Link>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-text-body mb-12">
          <li>✓ {sw ? "Bila malipo kabisa" : "100% free"}</li>
          <li>✓ {sw ? "Bila usajili" : "No sign-up"}</li>
          <li>✓ {sw ? "Bila alama ya maji" : "No watermark"}</li>
          <li>✓ {sw ? "Faili hazihifadhiwi kamwe" : "Files never stored"}</li>
        </ul>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-xl text-espresso mb-5">{howToTitle}</h2>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-ember text-cream font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-text-body text-base leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-xl text-espresso mb-5">{sw ? "Maswali yanayoulizwa mara kwa mara" : "Frequently asked questions"}</h2>
          <div className="space-y-5">
            {t.faqs.map((f, i) => (
              <div key={i}>
                <h3 className="font-semibold text-espresso mb-1.5">{f.q[lang]}</h3>
                <p className="text-text-body text-sm leading-relaxed">{f.a[lang]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-sell — a large share of PDF-tool traffic is job seekers
            assembling an application. Point them at the core product. */}
        <section className="mb-12 rounded-2xl bg-espresso text-cream p-6 md:p-8">
          <p className="text-[11px] font-mono uppercase tracking-widest text-gold/80 mb-2">
            {sw ? "Unatuma maombi ya kazi?" : "Applying for a job?"}
          </p>
          <h2 className="font-display font-extrabold text-xl md:text-2xl mb-2">
            {sw ? "Tengeneza CV inayosomwa na waajiri — bila malipo" : "Build a CV that actually gets read — free"}
          </h2>
          <p className="text-cream/75 text-sm md:text-base leading-relaxed mb-5 max-w-xl">
            {sw
              ? "Template 260+ zinazopita vichujio vya waajiri, kikagua alama papo hapo, na msaidizi anayekuandikia. Pakua PDF au Word."
              : "260+ ATS-ready templates, an instant score checker, and an AI assistant that writes it with you. Download as PDF or Word."}
          </p>
          <Link
            href="/editor/cv/try"
            className="inline-flex items-center gap-2 bg-ember text-cream font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-ember-hover transition"
          >
            {sw ? "Tengeneza CV yako" : "Build my CV"} →
          </Link>
        </section>

        {/* Related tools — internal links help crawl + ranking */}
        {related.length > 0 && (
          <section className="border-t border-border pt-10">
            <h2 className="font-display font-bold text-lg text-espresso mb-4">{sw ? "Zana zaidi za PDF bila malipo" : "More free PDF tools"}</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/tools/${r.slug}`}
                  className="inline-flex items-center gap-2 bg-card border border-border rounded-pill px-4 py-2 text-sm font-medium text-espresso hover:border-ember/40 transition"
                >
                  {r.name[lang]}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CV cross-sell — same intent audience */}
        <section className="mt-12 rounded-card-lg bg-espresso px-6 py-8 md:px-10 md:py-9 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <h2 className="font-display font-extrabold text-xl md:text-2xl text-cream tracking-tight mb-1.5">
              {sw ? "Unahitaji CV pia?" : "Need a CV too?"}
            </h2>
            <p className="text-cream/60 text-sm leading-relaxed max-w-lg">
              {sw
                ? "Tengeneza CV ya kitaalamu inayopita vichujio vya waajiri bila malipo ukitumia muundo rafiki kwa waajiri na msaidizi wa kazi."
                : "Build a professional, ATS-friendly CV free with recruiter-friendly templates and an AI assistant."}
            </p>
          </div>
          <Link
            href="/templates"
            className="shrink-0 inline-flex items-center gap-2 bg-ember text-cream font-semibold rounded-[10px] px-7 py-3.5 text-sm shadow-ember-hard hover:scale-[1.02] active:scale-[0.97] transition"
          >
            {sw ? "Ona miundo ya CV" : "See CV looks"} →
          </Link>
        </section>
      </div>

      <Footer />
    </div>
  );
}
