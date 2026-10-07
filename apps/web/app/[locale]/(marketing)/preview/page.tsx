import type { Metadata } from "next";
import { AiCopilotLanding } from "@/components/marketing/ai-copilot-landing";
import { alternatesFor } from "@/lib/seo";

// Preview of the "AI Career Copilot" landing redesign. Kept on its own route so
// it can be compared against the live homepage before being promoted to "/".
// Noindexed while it's a preview so it never competes with the real homepage.
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const sw = params.locale !== "en";
  return {
    alternates: alternatesFor("/preview", params.locale),
    title: sw ? "Msaidizi wa Kazi" : "Career Copilot",
    description: sw
      ? "Niambie unachohitaji. Nitaongoza kutoka hapo — CV, ulinganishaji wa kazi, alama ya CV yako au mazoezi ya usaili."
      : "Tell me what you need. I'll lead from there — CV, job match, ATS score or interview practice.",
    robots: { index: false, follow: false },
  };
}

export default function PreviewLandingPage() {
  return <AiCopilotLanding />;
}
