"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CrossSellBannerProps {
  cvId: string;
  cvTitle: string;
  cvData: any;
  accessToken?: string;
  atsScore?: number;
  lang?: "en" | "sw";
}

export function CrossSellBanner({ cvId, cvTitle, cvData, accessToken, atsScore, lang = "en" }: CrossSellBannerProps) {
  const sw = lang === "sw";
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  // Only show when ATS score is good (>= 60) — user has a solid CV worth pairing
  if (atsScore !== undefined && atsScore < 60) return null;

  async function generateCoverLetter() {
    setCreating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      // Extract sender info from CV data
      const personal = cvData?.personal ?? {};
      const senderTitle = personal.jobTitle ?? "";
      const summary = cvData?.summary ?? "";

      // Create a cover letter pre-populated from CV. Body paragraphs ONLY — the
      // template renders its own salutation and the "Sincerely, <sender>"
      // signature (from the profile), so no greeting/sign-off/name here.
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: sw ? `Barua ya Maombi ya ${cvTitle}` : `Cover Letter for ${cvTitle}`,
          cvId,
          content: sw
            ? `Naandika kuonyesha nia yangu ya nafasi ya ${senderTitle}. ${summary ? summary + "\n\n" : ""}Nina hamu ya kujadili jinsi ujuzi na uzoefu wangu unavyolingana na mahitaji ya timu yenu.`
            : `I am writing to express my interest in the ${senderTitle} position. ${summary ? summary + "\n\n" : ""}I look forward to discussing how my skills and experience align with your team's needs.`,
          jobTitle: senderTitle,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        // Navigate to the new cover letter editor
        router.push(`/editor/cover-letter/${json.data.id}`);
      }
    } catch {
      // Silently fail
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-ember-tint to-gold-tint border border-ember/15 rounded-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-ember flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="mail" size={16} className="text-cream" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-espresso">
            {sw ? "Tengeneza Barua ya Maombi Inayolingana" : "Generate Matching Cover Letter"}
          </p>
          <p className="text-[10px] text-text-body mt-0.5 leading-snug">
            {sw
              ? "CV yako iko tayari. Iunganishe na barua ya maombi yenye jina, cheo na mtindo ule ule kwa seti kamili ya maombi."
              : "Your CV is ready. Pair it with a tailored cover letter using the same name, job title, and style for a complete application kit."}
          </p>
          <Button
            size="sm"
            onClick={generateCoverLetter}
            disabled={creating}
            className="mt-2.5"
          >
            {creating ? (
              <>{sw ? "Inatengeneza..." : "Creating..."}</>
            ) : (
              <><Icon name="spark" size={12} /> {sw ? "Tengeneza Barua ya Maombi" : "Create Cover Letter"}</>
            )}
          </Button>
        </div>
        <button
          onClick={() => router.push(`/dashboard?tab=cover-letter`)}
          className="text-[9px] text-ember-hover hover:underline flex-shrink-0 mt-1"
        >
          {sw ? "Angalia zilizopo" : "Browse existing"}
        </button>
      </div>
    </div>
  );
}
