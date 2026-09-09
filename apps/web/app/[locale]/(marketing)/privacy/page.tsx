import type { Metadata } from "next";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { COMPANY, entityLine } from "@/lib/legal";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    title: sw ? "Sera ya Faragha" : "Privacy Policy",
    description: sw
      ? "Jinsi Sumaiya inavyokusanya, kutumia na kulinda data yako — taarifa zako za kibinafsi, hati zako na usalama wa akaunti."
      : "How Sumaiya collects, uses and protects your data — your personal information, your documents, and account security.",
    alternates: { canonical: "/privacy" },
  };
}

const SECTIONS = [
  {
    title: "1. Who We Are",
    content: `${COMPANY.product} is operated by ${entityLine()}, a technology company based in ${COMPANY.country} ("${COMPANY.shortName}", "we", "us"). Infoserve is the data controller responsible for the personal data described in this policy. For any privacy question, contact us at ${COMPANY.supportEmail}.`,
  },
  {
    title: "2. Information We Collect",
    content: "Account information you provide when registering (email address, and name where given). Document content you create or upload — your CV, cover letters, business cards and formal letters, which may include your name, contact details, work history, education, skills, photos and any other information you choose to add. Files you upload (for example a CV you import, or a profile photo). Usage data such as pages visited, features used, and device/browser information. Conversation and interaction data when you use AI features (see Section 5 on Conversation Logging below).",
  },
  {
    title: "3. How We Use Your Information",
    content: "To provide and operate Sumaiya and generate your documents; to power AI features you choose to use; to authenticate your account and protect it against unauthorised access; to send service-related emails (sign-in links, receipts, follow-up reminders you have enabled); to understand and improve the product through analytics; to respond to support requests; to improve our AI systems and train future models (see Section 5 on Conversation Logging); and to comply with legal obligations.",
  },
  {
    title: "4. AI Processing",
    content: "When you use an AI feature (for example generating or refining a summary, cover letter, or job match), the relevant content you submit is sent to a third-party AI provider — which may include DeepSeek, Anthropic (Claude), or OpenAI, depending on availability — solely to generate the output you requested. This may involve transferring that content to servers outside Tanzania. We only send what is needed to produce the result. AI-generated suggestions are automated and may be inaccurate or incomplete — please review them before use. If you prefer, you can simply not use the AI features.",
  },
  {
    title: "5. Conversation Logging for AI Improvement",
    content: "To improve Sumaiya's AI features and build better models for future versions, we collect and retain anonymised conversation data, interaction logs, and AI-generated suggestions. This data is used to: identify opportunities to enhance AI accuracy and relevance; train and fine-tune future AI models; detect and fix errors or edge cases; and measure AI feature quality. This data is processed separately from your account information and is anonymised or pseudonymised to remove direct personal identifiers. You can opt out of conversation logging at any time from your account settings — this will disable data collection for future interactions, though previously logged data remains in our improvement pipeline. Conversation logs are retained for up to 12 months for model training purposes, after which they are deleted.",
  },
  {
    title: "6. Service Providers We Share Data With",
    content: "We do not sell your personal data. We share it only with the providers needed to run Sumaiya: Supabase (database, authentication and file storage), Vercel (application hosting and cookieless web analytics), Resend (transactional email), and the AI providers named above. Anonymised conversation data may also be shared with AI providers for model improvement and research purposes. Each processes data on our behalf to deliver their part of the service. We may also disclose information where required by law.",
  },
  {
    title: "7. International Transfers",
    content: "Some of our providers (including hosting, database and AI providers) operate outside Tanzania, including in the United States. Where your data is transferred internationally, we rely on the providers' contractual and technical safeguards. By using Sumaiya you understand that your data may be processed in these locations.",
  },
  {
    title: "8. Cookies",
    content: "We use essential cookies for signing in, and privacy-friendly product analytics. We do not use advertising cookies. See our Cookie Policy at /cookies for details and how to manage them.",
  },
  {
    title: "9. Data Retention",
    content: "We keep your data while your account is active. You can delete your account and its associated documents at any time from Settings; we delete the associated personal data within 30 days, except where we must retain limited records to meet legal or accounting obligations. Conversation logs are retained separately for up to 12 months for AI improvement purposes (see Section 5).",
  },
  {
    title: "10. Your Rights",
    content: `You may access the personal data we hold about you, correct inaccurate data, delete your account and its data, export your documents (for example as PDF), opt out of conversation logging for AI improvement, and object to certain processing. To exercise these rights, use the Settings page or contact us at ${COMPANY.supportEmail}.`,
  },
  {
    title: "11. Security",
    content: "We use encrypted data transmission (HTTPS), secure token-based authentication, and application-layer access controls that scope every document to the account that owns it. No method of transmission or storage is completely secure, so while we work hard to protect your data we cannot guarantee absolute security.",
  },
  {
    title: "12. Children",
    content: "Sumaiya is intended for users aged 18 and over. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us and we will delete it.",
  },
  {
    title: "13. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on the platform. Continued use of Sumaiya after changes take effect constitutes acceptance of the updated policy.",
  },
  {
    title: "14. Contact",
    content: `For privacy-related questions or to exercise your rights, contact ${COMPANY.legalName} at ${COMPANY.supportEmail}.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sand">
      <MarketingNav />
      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-display font-extrabold text-espresso mb-3">Privacy Policy</h1>
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
