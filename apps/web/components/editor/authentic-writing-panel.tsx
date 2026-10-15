"use client";

// Authentic-writing quality panel — clichés, buzzwords and keyword-stuffing
// flagged with concrete fixes. Pure client-side (lib/authentic-writing.ts),
// suggestion-only: nothing is auto-edited. Mounted beside the ATS explainer
// so the user sees both "how to score higher" and "how to sound human".

import { useMemo, useState } from "react";
import type { CVData } from "@/types";
import { checkAuthenticWriting, type WritingFinding } from "@/lib/authentic-writing";

interface AuthenticWritingPanelProps {
  data: CVData;
  sw?: boolean;
}

const TYPE_LABEL: Record<WritingFinding["type"], { en: string; sw: string }> = {
  cliche: { en: "CLICHÉ", sw: "MSEMO" },
  buzzword: { en: "BUZZWORD", sw: "MANENO YA KUPENDEZA" },
  stuffing: { en: "STUFFING", sw: "KURUDIARUDIA" },
};

export function AuthenticWritingPanel({ data, sw = false }: AuthenticWritingPanelProps) {
  const L = (en: string, s: string) => (sw ? s : en);
  const [open, setOpen] = useState(true);

  const report = useMemo(() => checkAuthenticWriting(data), [data]);

  if (!report.hasIssues) {
    return (
      <div className="mt-3 border-t border-cream/10 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-pine-light/80">
          {L("Authentic writing", "Uandishi halisi")}
          <span className="ml-2 text-success/40">✓ {L("clean", "safi")}</span>
        </p>
      </div>
    );
  }

  const tone = report.score >= 80 ? "text-success/40" : report.score >= 60 ? "text-gold" : "text-red-300";

  return (
    <div className="mt-3 border-t border-cream/10 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-pine-light/80">
          {L("Authentic writing", "Uandishi halisi")}
          <span className={`ml-2 font-display text-[13px] font-extrabold ${tone}`}>{report.score}</span>
        </p>
        <span className="text-cream/50 text-[11px]">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {report.findings.slice(0, 10).map((f) => (
            <div key={f.id} className="bg-cream/8 border border-cream/10 rounded-input px-2.5 py-2 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold-tint text-gold-text">
                  {TYPE_LABEL[f.type][sw ? "sw" : "en"]}
                </span>
                <p className="text-[11px] font-semibold text-cream">
                  “{f.term}” × {f.count}
                </p>
                <span className="text-[9px] text-cream/40">{f.section}</span>
              </div>
              <p className="text-[9.5px] text-gold leading-tight">
                {L("Fix", "Suluhisho")}: {f.suggestion}
              </p>
            </div>
          ))}
          {report.findings.length > 10 && (
            <p className="text-[9.5px] text-cream/40">
              {L(`+${report.findings.length - 10} more`, `+${report.findings.length - 10} zaidi`)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
