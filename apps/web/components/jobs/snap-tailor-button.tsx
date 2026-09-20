"use client";

// D2 — "Tailor my CV for this job": one tap from any job card → /snap with the
// REAL job description prefilled. The JD travels via sessionStorage (not the
// URL): no length limits, nothing sensitive in history/logs. Anti-fabrication
// at the source: the button only renders when the card actually has JD text,
// and saveJdPrefill/readJdPrefill refuse empty/stale/oversized payloads — a
// broken hand-off opens a clean /snap, never a fabricated one.

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Lang } from "@/lib/i18n/translations";
import { saveJdPrefill } from "@/lib/snap-prefill";

interface SnapTailorButtonProps {
  lang: Lang;
  /** The REAL job title (for the friendly prefill notice on /snap). */
  title: string;
  /** Company name, optional. */
  company?: string;
  /** The REAL job description text — prefilled verbatim, never invented. */
  description: string;
}

export function SnapTailorButton({ lang, title, company, description }: SnapTailorButtonProps) {
  const sw = lang === "sw";
  const router = useRouter();

  const tailor = useCallback(() => {
    // Save the real JD; if storage is unavailable the button still opens /snap
    // (an empty page beats a dead button).
    saveJdPrefill({ jd: description, title, company });
    router.push("/snap");
  }, [description, title, company, router]);

  // No real JD text on this card → no button. Never prefill nothing.
  if (!description?.trim()) return null;

  return (
    <Button variant="secondary" size="sm" onClick={tailor} className="shrink-0" title={sw ? "Fungua Snap-to-Apply na maelezo haya ya kazi" : "Open Snap-to-Apply with this job description"}>
      <Icon name="spark" size={14} className="text-ember" />
      {sw ? "Tengeneza CV yako kwa kazi hii" : "Tailor my CV for this job"}
    </Button>
  );
}
