"use client";

/**
 * SignalsCard — Phase 2 (C) proactive nudges inside the assistant.
 * Deterministic, grounded signals (deadline approaching, stale application,
 * ATS below threshold, unconfirmed facts…) rendered as chips; tapping one
 * runs the tool that resolves it (or links to the destination). Every chip
 * cites its real trigger — no fabricated urgency.
 */
import { Sparkles, ArrowRight } from "lucide-react";
import type { Signal } from "@/lib/assistant/signals";

export function SignalsCard({
  signals,
  sw,
  onRun,
}: {
  signals: Signal[];
  sw: boolean;
  onRun: (signal: Signal) => void;
}) {
  return (
    <div className="rounded-2xl border border-ember/20 bg-ember-tint/30 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-ember" />
        <p className="text-xs font-bold text-espresso uppercase tracking-wide">
          {sw ? "Ninavyoweza kukusaidia sasa" : "Ways I can help right now"}
        </p>
      </div>
      <div className="space-y-2">
        {signals.map((s) => (
          <button
            key={s.type + (s.jobId ?? s.applicationId ?? "")}
            onClick={() => onRun(s)}
            className="w-full text-left rounded-xl bg-white border border-border hover:border-ember/40 transition p-3 group"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-espresso">{sw ? s.title.sw : s.title.en}</p>
              <ArrowRight className="w-3.5 h-3.5 text-ember shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[12px] text-text-body leading-relaxed mt-0.5">{sw ? s.detail.sw : s.detail.en}</p>
            <p className="text-[10px] text-text-muted mt-1 font-mono truncate">{s.trigger}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
