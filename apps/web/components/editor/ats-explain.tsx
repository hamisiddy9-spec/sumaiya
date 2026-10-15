"use client";

// Explainable ATS — the "why" behind the score. Renders the four-pillar
// breakdown (Parsing / Job Relevance / Impact / Content), line-level findings
// (Resume Worded-style: what's wrong, why it matters, where it occurs, the
// fix), and evidence-backed AutoFixes that apply ONLY after the user clicks.
// Pure client-side — no AI calls; everything comes from lib/ats-score.ts.

import { useState } from "react";
import type { CVData } from "@/types";
import {
  analyzeCv, atsBreakdown, lineFindings, applicableAutoFixes, AUTO_FIXES,
  type AutoFixId,
} from "@/lib/ats-score";

interface AtsExplainProps {
  data: CVData;
  sw?: boolean;
  onApplyFix?: (next: CVData) => void;
}

export function AtsExplain({ data, sw = false, onApplyFix }: AtsExplainProps) {
  const L = (en: string, s: string) => (sw ? s : en);
  const [applied, setApplied] = useState<Record<string, boolean>>({});

  const checks = analyzeCv(data, sw);
  const pillars = atsBreakdown(checks, sw);
  const findings = lineFindings(data, sw);
  const fixes = applicableAutoFixes(data);

  const handleAutoFix = (id: AutoFixId) => {
    const result = AUTO_FIXES[id](data);
    if (result.applied && onApplyFix) {
      onApplyFix(result.data);
      setApplied((p) => ({ ...p, [id]: true }));
    }
  };

  return (
    <div className="space-y-3">
      {/* Pillar breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {pillars.map((p) => (
          <div key={p.key} className="bg-cream/8 border border-cream/10 rounded-input px-2.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-cream/70">
                {sw ? p.swLabel : p.label}
              </span>
              <span className="text-[13px] font-display font-extrabold text-cream">{p.score}</span>
            </div>
            <div className="w-full h-1 bg-cream/15 rounded-full mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-gold" style={{ width: `${p.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Line-level findings */}
      {findings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
            {L("Line-level fixes", "Marekebisho ya mistari")}
          </p>
          {findings.slice(0, 8).map((f, i) => (
            <div key={`${f.id}-${i}`} className="bg-cream/8 border border-cream/10 rounded-input px-2.5 py-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.severity === "fail" ? "bg-red-500/20 text-red-300" : "bg-gold-tint text-gold-text"}`}>
                  {f.severity === "fail" ? "FAIL" : "WARN"}
                </span>
                <p className="text-[11px] font-semibold text-cream">{f.issue}</p>
              </div>
              <p className="text-[11px] text-cream/50 italic line-clamp-1">{f.line}</p>
              <p className="text-[9.5px] text-cream/60 leading-tight">{f.why}</p>
              <p className="text-[9.5px] text-gold leading-tight">
                {L("Fix", "Suluhisho")}: {f.fix}
                {!f.evidenceBacked && (
                  <span className="text-cream/40"> {L("(add a true fact)", "(ongeza ukweli)")}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* AutoFix — user-approved, evidence-backed only */}
      {fixes.length > 0 && onApplyFix && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
            {L("One-tap fixes (safe)", "Marekebisho ya haraka (salama)")}
          </p>
          {fixes.map((id) => {
            const done = applied[id];
            return (
              <button
                key={id}
                onClick={() => handleAutoFix(id)}
                disabled={done}
                className={`w-full flex items-center justify-between gap-2 rounded-input px-3 py-2 text-[11px] font-semibold transition ${
                  done
                    ? "bg-pine/20 text-pine cursor-default"
                    : "bg-pine/90 hover:bg-pine text-cream"
                }`}
              >
                <span>{AUTO_FIX_LABEL(id, sw)}</span>
                <span>{done ? "✓" : L("Apply", "Weka")}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AUTO_FIX_LABEL(id: AutoFixId, sw: boolean): string {
  const map: Record<AutoFixId, [string, string]> = {
    "remove-photo": ["Remove profile photo", "Ondoa picha ya wasifu"],
    "normalize-dates": ["Normalize dates to YYYY-MM", "Sawazisha tarehe kuwa YYYY-MM"],
    "remove-empty-bullets": ["Remove empty bullets", "Ondoa vipengele tupu"],
    "dedupe-skills": ["Merge duplicate skills", "Unganisha ujuzi unaorudiwa"],
  };
  const [en, s] = map[id];
  return sw ? s : en;
}
