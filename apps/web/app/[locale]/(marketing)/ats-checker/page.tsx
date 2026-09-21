import type { Metadata } from "next";
import { headers } from "next/headers";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";
import { AtsCheckerClient } from "./ats-checker-client";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw
      ? "Angalia Alama ya CV Yako Bila Malipo"
      : "Free ATS Resume Checker — Score Your CV Instantly",
    description: sw
      ? "Angalia alama ya CV yako bila malipo. Pakia CV yako kama PDF na upate alama ya papo hapo pamoja na marekebisho maalum ya kupita vigezo vya waajiri — imeundwa kwa watafuta-ajira kila mahali."
      : "Check your CV's ATS score free. Upload your resume as a PDF and get an instant score plus specific fixes to pass Applicant Tracking Systems — built for job seekers everywhere.",
    keywords: sw
      ? ["kuangalia CV ATS", "alama ya ATS", "CV inayopita ATS", "kagua CV", "ATS checker", "cv checker tanzania", "cv checker kenya", "resume checker free"]
      : [
          "ats checker", "ats resume checker", "cv score", "ats score checker",
          "check cv ats", "resume checker free", "ats friendly cv", "cv checker kenya",
          "cv checker tanzania", "applicant tracking system checker",
        ],
    alternates: alternatesFor("/ats-checker", params.locale),
    openGraph: {
      title: sw ? "Angalia Alama ya CV Yako | Sumaiya" : "Free ATS Resume Checker | Sumaiya",
      description: sw
        ? "Pakua CV yako na upate alama papo hapo pamoja na marekebisho maalum. Bure, hakuna usajili."
        : "Upload your CV and get an instant ATS score with specific fixes. Free, no sign-up.",
      url: "/ats-checker",
      images: ["/og-image.png"],
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ATS Resume Checker",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free tool that scores a CV/resume for Applicant Tracking System compatibility and lists specific fixes.",
  url: "https://sumaiya.app/ats-checker",
};

export default async function AtsCheckerPage({ params }: { params: { locale: string } }) {
  const sw = (params.locale ?? "sw") === "sw";
  return (
    <div className="min-h-screen bg-sand text-espresso">
      <MarketingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-espresso relative overflow-hidden py-16 md:py-20 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #F2A93B 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-ember-tint/10 border border-ember/20 rounded-pill px-4 py-1.5 mb-5">
            <Icon name="bolt" size={14} className="text-gold" />
            <span className="text-xs font-semibold text-cream/70 tracking-wider uppercase">{sw ? "Bure · Hakuna usajili" : "Free · No sign-up"}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-cream mb-4 tracking-tight leading-tight">
            {sw ? "CV yako iko tayari kwa waajiri?" : "Is your CV ATS-ready?"}
          </h1>
          <p className="text-base md:text-lg text-cream/60 max-w-xl mx-auto leading-relaxed">
            {sw
              ? "Maombi mengi huchujwa na programu kabla ya mtu kuyaona. Pakia CV yako upate alama papo hapo pamoja na marekebisho kamili ya kufaulu — kwa sekunde chache."
              : "Most applications are filtered by software before a human sees them. Upload your CV and get an instant ATS score with the exact fixes to pass — in seconds."}
          </p>
        </div>
      </section>

      <div className="-mt-8 relative z-10">
        <AtsCheckerClient />
      </div>

      <Footer />
    </div>
  );
}
