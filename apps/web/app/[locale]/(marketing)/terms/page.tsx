import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { COMPANY, entityLine } from "@/lib/legal";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw ? "Masharti ya Matumizi" : "Terms of Service",
    description: sw
      ? "Masharti yanayosimamia matumizi yako ya Sumaiya — matumizi yanayokubalika, haki zako, na wajibu wako."
      : "The terms that govern your use of Sumaiya — acceptable use, your rights, and your responsibilities.",
    alternates: alternatesFor("/terms", params.locale),
  };
}

const SECTIONS = [
  {
    title: "1. Who We Are",
    content: `${COMPANY.product} is operated by ${entityLine()}, a technology company based in ${COMPANY.country} ("${COMPANY.shortName}", "we", "us"). These Terms of Service govern your use of ${COMPANY.product}.`,
  },
  {
    title: "2. Acceptance of Terms",
    content: "By creating a Sumaiya account or using our services, you agree to these Terms. If you do not agree, please do not use Sumaiya.",
  },
  {
    title: "3. Eligibility",
    content: "You must be at least 18 years old and able to enter into a binding agreement to use Sumaiya. By using the service you confirm that you meet these requirements.",
  },
  {
    title: "4. Description of Service",
    content: "Sumaiya is an online builder for CVs, cover letters, business cards and formal letters, with AI-powered content suggestions, professional templates, PDF tools, and export and sharing features. Features may be added, changed or removed over time.",
  },
  {
    title: "5. AI-Generated Content",
    content: "Sumaiya offers AI features that generate or refine text. AI output is automated and may be inaccurate, incomplete or unsuitable. You are responsible for reviewing and editing all content before you use it, and for ensuring that everything in your documents — including qualifications, experience and other claims — is truthful and accurate. AI output is not professional, legal or career advice. You must not use Sumaiya to create false or misleading credentials.",
  },
  {
    title: "6. Your Content and Ownership",
    content: "You retain full ownership of the content you create or upload (CVs, cover letters, business cards, letters, photos). To provide the service, you grant Infoserve a limited licence to store, process and display your content — including sending the relevant parts to our AI providers to generate the outputs you request. We do not claim ownership of your documents.",
  },
  {
    title: "7. Accounts",
    content: "You must provide a valid email address to create an account, and you are responsible for keeping your account secure. Sumaiya uses magic-link (passwordless) sign-in — we will never ask for a password.",
  },
  {
    title: "8. Plans and Payments",
    content: "Sumaiya is currently offered free of charge — every feature is available at no cost and there is no payment processing on the service. We may introduce paid plans in future. If and when that happens, the pricing, trial, renewal and cancellation terms, and the payment provider used, will be shown clearly at the point of purchase before you are charged, and you will be able to cancel at any time from your account settings.",
  },
  {
    title: "9. Acceptable Use",
    content: "You agree not to use Sumaiya to create content that is unlawful, fraudulent, harmful or misleading; to impersonate another person or fabricate credentials; to attempt to reverse-engineer, scrape or copy our templates, software or AI systems; to disrupt or overload the service; or to share your account with others.",
  },
  {
    title: "10. Service Availability",
    content: "We aim for high availability but do not guarantee uninterrupted service. We may perform maintenance that temporarily affects access, and we are not liable for losses caused by service interruptions.",
  },
  {
    title: "11. Termination",
    content: "You may delete your account at any time from Settings. We may suspend or terminate accounts that violate these Terms. On termination, your associated data is deleted within 30 days, subject to any records we must retain by law.",
  },
  {
    title: "12. Disclaimers and Limitation of Liability",
    content: 'Sumaiya is provided "as is" and "as available". To the maximum extent permitted by law, Infoserve is not liable for indirect, incidental or consequential damages arising from your use of the service, including any outcome of a job application. Where liability cannot be excluded, our total liability is limited to the amount (if any) you paid us in the three months before the claim.',
  },
  {
    title: "13. Governing Law",
    content: `These Terms are governed by the laws of ${COMPANY.country}. Any disputes shall be resolved in ${COMPANY.jurisdictionCourts}.`,
  },
  {
    title: "14. Changes to These Terms",
    content: "We may update these Terms from time to time. We will post the updated Terms here and, for significant changes, notify you. Continued use after changes take effect constitutes acceptance.",
  },
  {
    title: "15. Contact",
    content: `Questions about these Terms? Contact ${COMPANY.legalName} at ${COMPANY.supportEmail}.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sand">
      <MarketingNav />
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-extrabold text-espresso mb-3">Terms of Service</h1>
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
