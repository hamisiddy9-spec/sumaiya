import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { COMPANY, entityLine } from "@/lib/legal";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw ? "Sera ya Vidakuzi" : "Cookie Policy",
    description: sw
      ? "Vidakuzi gani Sumaiya hutumia (na ambavyo hatutumii) — vidakuzi muhimu vya kuingia na uchanganuzi usio na vidakuzi."
      : "What cookies Sumaiya uses (and doesn't) — essential sign-in cookies and cookieless analytics.",
    alternates: alternatesFor("/cookies", params.locale),
  };
}

const SECTIONS = [
  {
    title: "1. What Cookies Are",
    content: "Cookies are small text files stored on your device by your browser. We use them to keep you signed in and to understand how the product is used so we can improve it.",
  },
  {
    title: "2. Essential Cookies",
    content: "These are required for Sumaiya to work. We use authentication (session) cookies, provided through Supabase, to keep you signed in securely. Without them you cannot log in or use your account. They are not used for advertising.",
  },
  {
    title: "3. Analytics",
    content: "We use Vercel Web Analytics, a privacy-friendly, cookieless analytics service provided by our hosting provider, to understand which features are used and where people get stuck, so we can improve Sumaiya. It does not set cookies and does not track you across other websites. This helps us build a better product; it is not used to advertise to you.",
  },
  {
    title: "4. No Advertising Cookies",
    content: "We do not use advertising or third-party marketing cookies, and we do not sell your data to advertisers.",
  },
  {
    title: "5. Managing Cookies",
    content: "You can control or delete cookies through your browser settings. Note that blocking essential (authentication) cookies will prevent you from signing in and using your account.",
  },
  {
    title: "6. Changes and Contact",
    content: `We may update this Cookie Policy from time to time. For questions, contact ${COMPANY.legalName} at ${COMPANY.supportEmail}. See also our Privacy Policy at /privacy.`,
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-sand">
      <MarketingNav />
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-extrabold text-espresso mb-3">Cookie Policy</h1>
        <p className="text-text-muted mb-2">Last updated: {COMPANY.effectiveDate}</p>
        <p className="text-text-muted mb-12 text-sm">{COMPANY.product} is operated by {entityLine()}.</p>
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-espresso mb-3">{s.title}</h2>
              <p className="text-text-body leading-relaxed">{s.content}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
