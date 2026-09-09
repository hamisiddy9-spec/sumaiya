"use client";

// Shared, non-destructive AI review modal. Any editor stages an AI result here
// (Current vs Suggested) so the user approves before it replaces their text —
// never a silent overwrite. Used by the cover-letter and letter editors; the CV
// editor has its own inline version.

import { useRef } from "react";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { label } from "@/lib/i18n/labels";
import { useModalDialog } from "@/components/ui/use-modal-dialog";

export type RefineDirective = "shorter" | "ats" | "measurable" | "leadership" | "sw" | "en";
const REFINE_OPTIONS: { id: Exclude<RefineDirective, "sw" | "en">; en: string; sw: string }[] = [
  { id: "shorter", en: "Shorter", sw: "Fupisha" },
  { id: "ats", en: "More ATS", sw: "Zaidi ya ATS" },
  { id: "measurable", en: "More measurable", sw: "Ongeza vipimo" },
  { id: "leadership", en: "More leadership", sw: "Uongozi zaidi" },
];

interface Props {
  open: boolean;
  /** What the AI did, shown as a subtitle so the action is never mysterious. */
  subtitle: string;
  original: string;
  suggested: string;
  busy?: boolean;
  lang?: "en" | "sw";
  onApply: () => void;
  onRegenerate?: () => void;
  /** One-tap refine — re-run the AI on the current suggestion with an adjustment. */
  onRefine?: (directive: RefineDirective) => void;
  onClose: () => void;
}

export function AiSuggestionModal({ open, subtitle, original, suggested, busy, lang = "en", onApply, onRegenerate, onRefine, onClose }: Props) {
  const sw = lang === "sw";
  const panelRef = useRef<HTMLDivElement>(null);
  // Escape + focus trap + focus management (registered before the early
  // return so hook order stays stable; it no-ops while closed).
  useModalDialog(open, onClose, panelRef);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-suggestion-title"
        tabIndex={-1}
        className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-glow" />
            <span id="ai-suggestion-title" className="text-sm font-bold text-espresso">{sw ? "Pendekezo la AI" : "AI suggestion"}</span>
            <button onClick={onClose} aria-label={label(sw, "close")} className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-espresso hover:bg-sand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-[11px] text-text-muted mt-1">{subtitle}</p>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {original.trim() && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{sw ? "Ya sasa" : "Current"}</p>
              <div className="text-xs leading-relaxed text-text-body bg-sand-2 border border-border rounded-input px-3 py-2 whitespace-pre-wrap">{original}</div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-glow mb-1">{sw ? "Pendekezo" : "Suggested"}</p>
            <div className="text-xs leading-relaxed text-espresso bg-ember-tint/30 border border-ember/20 rounded-input px-3 py-2 whitespace-pre-wrap">{suggested}</div>
          </div>
          {onRefine && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">{sw ? "Rekebisha kwa mguso mmoja" : "Adjust with one tap"}</p>
              <div className="flex flex-wrap gap-1.5">
                {REFINE_OPTIONS.map((opt) => (
                  <button key={opt.id} onClick={() => onRefine(opt.id)} disabled={busy}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-pill border border-border-input text-text-body hover:border-ember hover:text-ember hover:bg-ember-tint/20 transition disabled:opacity-50">
                    {sw ? opt.sw : opt.en}
                  </button>
                ))}
                <button onClick={() => onRefine(sw ? "en" : "sw")} disabled={busy}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-pill border border-border-input text-text-body hover:border-ember hover:text-ember hover:bg-ember-tint/20 transition disabled:opacity-50">
                  {sw ? "Kwa Kiingereza" : "Kwa Kiswahili"}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-border">
          <button
            onClick={onApply}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2.5 rounded-input-lg transition active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> {sw ? "Tumia" : "Apply"}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={busy}
              className="inline-flex items-center gap-2 border border-border-input text-espresso hover:bg-sand-2 text-sm font-semibold px-4 py-2.5 rounded-input-lg transition disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {sw ? "Tengeneza tena" : "Regenerate"}
            </button>
          )}
          <button onClick={onClose} className="text-sm font-medium text-text-muted hover:text-espresso px-3 py-2.5 transition">
            {sw ? "Acha" : "Discard"}
          </button>
        </div>
      </div>
    </div>
  );
}
