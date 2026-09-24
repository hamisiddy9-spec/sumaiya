import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { SumaiyaProLanding } from "@/components/marketing/sumaiya-pro-landing";
import { alternatesFor } from "@/lib/seo";

/**
 * Sumaiya Pro — the page sumaiya.app serves at its root.
 *
 * Kept as a server component so the page is a static prerender like every other
 * marketing route (see the CDN caching notes in middleware.ts): the copy, the
 * metadata and the crawlable HTML are all rendered ahead of time, and the
 * interactive parts — the design shelf, the "show more" fold — live inside the
 * client island.
 *
 * The root rewrite itself lives in vercel.json, scoped to the sumaiya.app
 * hosts, so the URL bar keeps showing the bare domain while this file renders.
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/pro", params.locale),
    title: sw
      ? "Sumaiya Pro — miundo ya CV ya kitaalamu"
      : "Sumaiya Pro — professional CV designs",
    description: sw
      ? "Chagua kutoka miundo ya CV ya kitaalamu, kisha Sumaiya anakusaidia kuandika kila sehemu na kukupatia PDF inayosomeka kwa mifumo ya kuajiri. Pakua bure kwa Android, kwa Kiswahili au Kiingereza."
      : "Pick from professionally designed CVs, then Sumaiya writes every section and hands you an ATS-ready PDF. Free on Android, in Swahili or English.",
    openGraph: {
      title: sw ? "Sumaiya Pro" : "Sumaiya Pro",
      description: sw
        ? "Chagua muundo, Sumaiya anakusaidia kuandika, nawe unapakua PDF yako."
        : "Professional CV designs. Pick a design, Sumaiya writes it, download the PDF.",
      type: "website",
    },
  };
}

export default function SumaiyaProPage() {
  return (
    <>
      <MarketingNav />
      <SumaiyaProLanding />
      <Footer />
    </>
  );
}
