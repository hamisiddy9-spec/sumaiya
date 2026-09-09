import type { Metadata } from "next";
import { AiCopilotLanding } from "@/components/marketing/ai-copilot-landing";

// Preview of the "AI Career Copilot" landing redesign. Kept on its own route so
// it can be compared against the live homepage before being promoted to "/".
// Noindexed while it's a preview so it never competes with the real homepage.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: { canonical: "/preview" },
    title: sw ? "Msaidizi wa Kazi wa AI" : "AI Career Copilot",
    description: sw
      ? "Mwambie AI unachohitaji. Inaongoza kutoka hapo — CV, ulinganishaji wa kazi, alama ya ATS au mazoezi ya usaili."
      : "Tell the AI what you need. It leads from there — CV, job match, ATS score or interview practice.",
    robots: { index: false, follow: false },
  };
}

export default function PreviewLandingPage() {
  return <AiCopilotLanding />;
}
