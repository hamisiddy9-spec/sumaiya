import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { TemplateHubProLanding } from "@/components/marketing/templatehub-pro-landing";

/**
 * TemplateHub Pro — the page templatehub.pro serves at its root.
 *
 * Kept as a server component so the page is a static prerender like every other
 * marketing route (see the CDN caching notes in middleware.ts): the copy, the
 * metadata and the crawlable HTML are all rendered ahead of time, and the
 * interactive parts — the design shelf, the "show more" fold — live inside the
 * client island.
 *
 * The root rewrite itself lives in vercel.json, scoped to the templatehub.pro
 * hosts, so the URL bar keeps showing the bare domain while this file renders.
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: { canonical: "/pro" },
    title: sw
      ? "TemplateHub Pro — miundo ya CV iliyoundwa kwa zama za AI"
      : "TemplateHub Pro — CV designs built for the age of AI",
    description: sw
      ? "Chagua kutoka miundo 260+ ya CV, kisha Sumaiya — msaidizi wa AI — anaandika kila sehemu na kukupatia PDF inayopita ATS. Pakua bure kwa Android, kwa Kiswahili au Kiingereza."
      : "Choose from 260+ CV designs, then Sumaiya — your AI assistant — writes every section and hands you an ATS-ready PDF. Free on Android, in Swahili or English.",
    openGraph: {
      title: sw ? "TemplateHub Pro" : "TemplateHub Pro",
      description: sw
        ? "Miundo ya CV iliyoundwa kwa zama za AI. Chagua muundo, Sumaiya anaandika, pakua PDF."
        : "CV designs built for the age of AI. Pick a design, Sumaiya writes it, download the PDF.",
      type: "website",
    },
  };
}

export default function TemplateHubProPage() {
  return (
    <>
      <MarketingNav />
      <TemplateHubProLanding />
      <Footer />
    </>
  );
}
