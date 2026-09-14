import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { headers } from "next/headers";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/about", params.locale),
    title: sw ? "Kuhusu Sisi" : "About",
    description: sw
      ? "Sumaiya huwasaidia watafuta-ajira kujenga CV za kitaalamu zinazopita ATS, barua za maombi, kadi za biashara na barua rasmi — kwa dakika, kwa msaidizi wa AI, kwa Kiingereza au Kiswahili."
      : "Sumaiya helps job seekers build professional, ATS-ready CVs, cover letters, business cards and formal letters — in minutes, with an AI assistant, in English or Kiswahili.",
  };
}

const values = (sw: boolean) => [
  {
    title: sw ? "Msaidizi wa AI upande wako" : "An AI assistant on your side",
    body: sw
      ? "Msaidizi anayekuandikia, kuboresha na kulinganisha CV yako na kazi unayotaka — kama mshauri wa kazi mfukoni mwako, bila malipo."
      : "An assistant that writes, refines and matches your CV to the job you want — like a career coach in your pocket, for free.",
  },
  {
    title: sw ? "Shinda roboti" : "Beat the robots",
    body: sw
      ? "Maombi mengi huchujwa kwanza na programu ya ATS. Kila template imetengenezwa na tabaka halisi la maandishi na vichwa safi ili mashine — na binadamu — waweze kuisoma."
      : "Most applications are screened by ATS software first. Every template is structured with a real text layer and clean headings so machines — and humans — can read it.",
  },
  {
    title: sw ? "Kiingereza na Kiswahili" : "English & Kiswahili",
    body: sw
      ? "Andika kwa lugha unayoifahamu vizuri, na tafsiri maudhui yako kwa mguso mmoja pale kazi inapohitaji lugha nyingine."
      : "Write in the language you're comfortable in, and translate your content with one tap when a role needs the other.",
  },
  {
    title: sw ? "Wasifu mmoja, kila hati" : "One profile, every document",
    body: sw
      ? "Jaza taarifa zako mara moja. CV yako, barua ya maombi, kadi ya biashara na barua zote hutumia taarifa zilezile."
      : "Enter your details once. Your CV, cover letter, business card and letters all draw from the same shared identity.",
  },
];

const stats = (sw: boolean) => [
  { value: "120+", label: sw ? "Miundo iliyochaguliwa" : "Curated looks" },
  { value: "4", label: sw ? "Aina za hati" : "Document types" },
  { value: "2", label: sw ? "Lugha" : "Languages" },
  { value: "PDF", label: sw ? "Uhamishaji salama kwa ATS" : "ATS-safe export" },
];

export default async function AboutPage({ params }: { params: { locale: string } }) {
  const lang = (params.locale ?? "sw") as "sw" | "en";
  const sw = lang === "sw";
  const VALUES = values(sw);
  const STATS = stats(sw);
  return (
    <div className="min-h-screen bg-cream">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-espresso">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <p className="font-mono text-[11px] text-ember-hover tracking-[0.2em] uppercase mb-4">{sw ? "Hadithi yetu" : "Our story"}</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-cream mb-5 tracking-tight">
            {sw ? "Hati za kitaalamu, pamoja na msaidizi wa AI" : "Professional documents, with an AI assistant"}
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
            {sw
              ? "Kutuma maombi ya nafasi hakupaswi kumaanisha kupambana na programu ya kuandika saa saba usiku. Sumaiya inaipamba CV yako kwa muundo unaoidhinishwa na waajiri, msaidizi wa kuandika wa AI na uhamishaji wa PDF kwa mguso mmoja — ili uonekane bora zaidi na kupita programu ya uchujaji inayosoma CV yako kwanza."
              : "Applying for a job shouldn’t mean fighting with a word processor at 1am. Sumaiya gives you recruiter-friendly templates, an AI writing assistant and one-tap PDF export — so you can look your best and get past the screening software that reads your CV first."}
          </p>
        </div>
      </section>

      <main id="main" tabIndex={-1} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-card p-5 text-center">
              <p className="font-display font-extrabold text-3xl text-ember tracking-tight">{s.value}</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wide font-mono">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-espresso mb-4">{sw ? "Kwa nini tulijenga hii" : "Why we built this"}</h2>
          <p className="text-text-body leading-relaxed">
            {sw
              ? "Watu wenye vipaji wanakosa fursa si kwa sababu hawana sifa, bali kwa sababu maombi yao yanachujwa kabla ya mtu kuyaona — picha iliyopigwa skana ya CV, muundo usiosomeka, au kutokuwa na barua ya maombi kabisa. Tuliamua kurekebisha hilo: kumpa kila mtu zana ambazo washauri wa kazi hutoza pesa, kwa njia ambayo ni ya haraka, nafuu na inayosaidiwa na AI."
              : "Talented people everywhere miss opportunities not because they aren’t qualified, but because their application gets filtered out before a person ever sees it — a scanned photo of a CV, an unreadable layout, or no cover letter at all. We set out to fix that: give everyone the tools that expensive career coaches charge for, in a form that’s fast, affordable and guided by AI."}
          </p>
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-card border border-border rounded-card p-6">
              <h3 className="font-display font-bold text-espresso mb-1.5">{v.title}</h3>
              <p className="text-sm text-text-body leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-espresso rounded-card-lg py-12 px-6 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-cream mb-3">{sw ? "Tayari kung’aa?" : "Ready to stand out?"}</h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto text-sm">{sw ? "Tengeneza hati yako ya kwanza bila malipo — hakuna kadi inayohitajika." : "Build your first document free — no card needed."}</p>
          <CreateEntryButton docType="cv" lang={lang as "en" | "sw"}
            className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold px-8 py-3.5 rounded-input-lg transition active:scale-[0.98] shadow-ember-hard active:shadow-ember-active active:translate-y-[2px]">
            {sw ? "Tengeneza CV yangu" : "Build my CV"} <ChevronRight className="w-5 h-5" />
          </CreateEntryButton>
        </div>
      </main>

      <Footer />
    </div>
  );
}
