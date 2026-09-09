import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";

// D6 — public Snap-to-Apply SEO landing page (#259). Lives under
// (marketing)/ so the middleware rewrites the bare /snap-to-apply path to
// /[locale]/snap-to-apply and both locales are statically prerendered at build
// time (indexable, cacheable). The CTA routes to the guest-friendly tool at
// /snap (app/(app)/snap), which resolves its language from the x-lang header.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw
      ? "Lenga CV Yako kwa Kazi Yoyote kwa Sekunde 30 — Bure"
      : "Tailor Your CV to Any Job in 30 Seconds — Free",
    description: sw
      ? "Bandika maelezo ya kazi au piga picha ya tangazo la kazi. Pata alama ya ulinganifu wa ATS papo hapo, kisha CV na barua ya maombi zilizolengwa zinazopita programu — bure, hakuna usajili."
      : "Paste a job description or snap a photo of a job poster. Get an instant ATS match score, then a tailored CV and cover letter that pass the robots — free, no sign-up.",
    keywords: sw
      ? ["lenga CV kwa kazi", "CV kwa maombi ya kazi", "alama ya ATS", "CV inayolingana na kazi", "barua ya maombi", "piga picha ya tangazo la kazi", "CV kwa sekunde 30", "snap to apply"]
      : [
          "snap to apply", "tailored cv", "cv for job application", "ats match score",
          "tailor resume to job", "cover letter generator", "job application cv",
          "cv matching job description", "customize cv for job", "resume tailoring",
        ],
    alternates: { canonical: "/snap-to-apply" },
    openGraph: {
      title: sw ? "Lenga CV Yako kwa Sekunde 30 — Bure | Sumaiya" : "Tailor Your CV to Any Job in 30 Seconds — Free | Sumaiya",
      description: sw
        ? "Bure, hakuna usajili: bandika au pigia picha kazi yoyote na upate CV na barua za maombi zilizolingana na ATS kwa sekunde 30."
        : "Free, no sign-up: paste or photograph any job and get an ATS-matched CV and cover letter in 30 seconds.",
      url: "/snap-to-apply",
      // Page-level openGraph replaces the marketing layout's, so the og:image
      // MUST be declared here or this page ships without one (same pattern as
      // the ats-checker landing page).
      images: [`${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.pro"}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: sw ? "Lenga CV Yako kwa Sekunde 30 — Bure | Sumaiya" : "Tailor Your CV to Any Job in 30 Seconds — Free | Sumaiya",
      description: sw
        ? "Bandika au pigia picha kazi yoyote, upate alama ya ATS, kisha CV na barua zilizolengwa. Bure, hakuna usajili."
        : "Paste or photograph any job, get an ATS match score, then a tailored CV and cover letter. Free, no sign-up.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.pro"}/og-image.png`],
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Snap-to-Apply",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Paste a job description or photograph a job poster and get an instant ATS match score plus a tailored CV and cover letter in 30 seconds.",
  url: "https://sumaiya.pro/snap-to-apply",
};

const steps = (sw: boolean) => [
  {
    icon: "image" as const,
    step: "01",
    title: sw ? "Bandika au pigia picha kazi" : "Paste or photograph a job",
    body: sw
      ? "Nakili-bandika maelezo ya kazi, au piga picha ya tangazo la kazi kwa simu yako. Hakuna haja ya kuchapa kwa mikono."
      : "Copy-paste a job description, or snap a photo of a job poster with your phone. No typing it out by hand.",
  },
  {
    icon: "target" as const,
    step: "02",
    title: sw ? "Pata alama yako ya ATS" : "Get your ATS match score",
    body: sw
      ? "Ona papo hapo jinsi CV yako ya sasa inavyolingana na kile programu ya mwajiri inachotafuta — na kile kinachokosekana hasa."
      : "See instantly how your current CV lines up with what the recruiter's software is looking for — and exactly what's missing.",
  },
  {
    icon: "cv" as const,
    step: "03",
    title: sw ? "Tuma maombi kwa CV na barua zilizolengwa" : "Apply with a tailored CV + cover letter",
    body: sw
      ? "Pata CV na barua ya maombi zilizoandikwa upya kwa maneno muhimu ya kazi hiyo, ili binadamu aisome maombi yako."
      : "Get a rewritten CV and cover letter that hit the role's keywords, so a human actually reads your application.",
  },
];

export default async function SnapToApplyPage({ params }: { params: { locale: string } }) {
  const sw = (params.locale ?? "sw") === "sw";
  const STEPS = steps(sw);
  return (
    <div className="min-h-screen bg-sand text-espresso">
      <MarketingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-espresso relative overflow-hidden py-16 md:py-24 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #F2A93B 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-ember-tint/10 border border-ember/20 rounded-pill px-4 py-1.5 mb-5">
            <Icon name="bolt" size={14} className="text-gold" />
            <span className="text-xs font-semibold text-cream/70 tracking-wider uppercase">{sw ? "Bure · Hakuna usajili" : "Free · No sign-up"}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-cream mb-4 tracking-tight leading-tight">
            {sw ? "Lenga CV yako kwa kazi yoyote kwa sekunde 30 — bure" : "Tailor your CV to any job in 30 seconds — free"}
          </h1>
          <p className="text-base md:text-lg text-cream/60 max-w-xl mx-auto leading-relaxed mb-8">
            {sw
              ? "Bandika maelezo ya kazi au piga picha ya tangazo. Snap-to-Apply inaikadiria CV yako dhidi ya maneno muhimu ya ATS ya kazi hiyo, kisha inaiandika upya pamoja na barua ya maombi — kabla hujatuma maombi."
              : "Paste a job description or snap a photo of a poster. Snap-to-Apply scores your CV against the role's ATS keywords, then rewrites your CV and cover letter to match — before you apply."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/snap"
              className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-7 py-3.5 rounded-input-lg transition active:scale-[0.98] shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] w-full sm:w-auto justify-center"
            >
              {sw ? "Lenga CV yangu sasa — ni bure" : "Tailor my CV now — it's free"}
              <Icon name="chevron-right" size={18} />
            </Link>
            <Link
              href="/snap"
              className="inline-flex items-center gap-2 border border-cream/25 text-cream hover:bg-cream/10 font-semibold px-7 py-3.5 rounded-input-lg transition w-full sm:w-auto justify-center"
            >
              {sw ? "Jaribu bure →" : "Try it free →"}
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <main id="main" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <p className="font-mono text-[11px] text-ember-hover tracking-[0.2em] uppercase mb-3">{sw ? "Inavyofanya kazi" : "How it works"}</p>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-espresso mb-3 tracking-tight">
            {sw ? "Kutoka tangazo hadi maombi — kwa hatua tatu" : "From job posting to application — in three steps"}
          </h2>
          <p className="text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            {sw
              ? "Hakuna templeti tupu, hakuna kuandika upya kwa mikono. Snap-to-Apply inafanya kazi ya kulenga kwa ajili yako."
              : "No blank templates, no rewriting by hand. Snap-to-Apply does the tailoring for you."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-card border border-border rounded-card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-[14px] bg-ember-tint text-ember">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="font-mono text-xs font-semibold text-text-muted/70 tracking-widest">{s.step}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-espresso mb-2 leading-snug">{s.title}</h3>
              <p className="text-sm text-text-body leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-espresso rounded-card-lg py-12 px-6 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-cream mb-3">
            {sw ? "Maombi yako yajayo, sekunde 30 bora zaidi" : "Your next application, 30 seconds smarter"}
          </h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto text-sm">
            {sw
              ? "Bandika kazi unayotaka sasa hivi — bure, hakuna usajili, na inafanya kazi kwenye simu yako."
              : "Paste the job you want right now — free, no sign-up, and it works from your phone."}
          </p>
          <Link
            href="/snap"
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-8 py-3.5 rounded-input-lg transition active:scale-[0.98] shadow-ember-hard active:shadow-ember-active active:translate-y-[2px]"
          >
            {sw ? "Fungua Snap-to-Apply" : "Open Snap-to-Apply"}
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
