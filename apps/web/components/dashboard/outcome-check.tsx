"use client";

// The get-hired feedback loop (system blueprint — Stage 5).
//
// A short, friendly, one-tap prompt on an application the user has been sitting
// on: "Any news from {company}?" Each tap runs the `outcome.record` capability
// through the guardrail pipeline — that's what feeds the aggregate
// did-Sumaiya-help-you-get-hired signal (separate from the manual stage
// pipeline, and the only path that can log the terminal "hired" outcome).

import { useCallback, useEffect, useState } from "react";
import { PartyPopper, CalendarClock, Handshake, X } from "lucide-react";

type Stage = "interview" | "offer" | "hired" | "no";

interface Props {
  applicationId: string;
  companyName: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  sw?: boolean;
  /** Optimistically move the visible stage when the outcome maps to one. */
  onStageChange?: (next: string) => void;
}

const STAGE_TO_STATUS: Partial<Record<Stage, string>> = {
  interview: "interviewing",
  offer: "offer",
  no: "rejected",
};

export function OutcomeCheck({
  applicationId,
  companyName,
  status,
  appliedAt,
  createdAt,
  sw = false,
  onStageChange,
}: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState<Stage | null>(null);
  const [done, setDone] = useState<Stage | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(`outcome-check-${applicationId}`) === "1");
    } catch {
      setDismissed(false);
    }
  }, [applicationId]);

  const since = appliedAt ?? createdAt;
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000);
  // Only ask once the wait is real, and only while the outcome is still open.
  const relevant = (status === "applied" || status === "interviewing") && days >= 4;

  const record = useCallback(
    async (stage: Stage) => {
      if (busy) return;
      setBusy(stage);
      try {
        const res = await fetch("/api/capabilities/outcome.record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caller: "ui", args: { applicationId, stage } }),
        });
        const json = await res.json().catch(() => null);
        const ok = json?.data?.status === "ok";
        if (ok) {
          setDone(stage);
          const mapped = STAGE_TO_STATUS[stage];
          if (mapped) onStageChange?.(mapped);
          try {
            localStorage.setItem(`outcome-check-${applicationId}`, "1");
          } catch {
            /* private mode */
          }
        }
      } finally {
        setBusy(null);
      }
    },
    [applicationId, busy, onStageChange],
  );

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`outcome-check-${applicationId}`, "1");
    } catch {
      /* private mode */
    }
  };

  if (dismissed || (!relevant && !done)) return null;

  if (done) {
    const msg: Record<Stage, { en: string; sw: string }> = {
      interview: { en: "Logged — good luck in the interview!", sw: "Imehifadhiwa — kila la heri kwenye mahojiano!" },
      offer: { en: "An offer — that's huge. Congratulations.", sw: "Ofa ya kazi — hongera sana." },
      hired: { en: "You got the job. This is what it's all for. 🎉", sw: "Umepata kazi. Hii ndiyo lengo letu lote. 🎉" },
      no: { en: "Logged. The next one is closer than it feels.", sw: "Imehifadhiwa. Nafasi ijayo iko karibu kuliko unavyofikiri." },
    };
    return (
      <div className="bg-pine-tint border border-pine/30 rounded-card-lg p-4 mb-4 flex items-start gap-3">
        <PartyPopper className="w-4.5 h-4.5 text-pine shrink-0 mt-0.5" />
        <p className="text-sm text-espresso">{sw ? msg[done].sw : msg[done].en}</p>
      </div>
    );
  }

  const company = companyName || (sw ? "kampuni hii" : "them");

  return (
    <div className="bg-gold-tint border border-gold/30 rounded-card-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
          <CalendarClock className="w-4 h-4 text-gold-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-espresso">
            {sw ? `Habari za ${company}?` : `Any news from ${company}?`}
          </p>
          <p className="text-xs text-text-body mt-0.5">
            {sw
              ? `Umesubiri siku ${days}. Nijulishe kilichotokea — inanisaidia kukusaidia vizuri zaidi.`
              : `You've been waiting ${days} days. Tell me what happened — it helps me help you better.`}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {([
              ["interview", CalendarClock, { en: "Got an interview", sw: "Nimeitwa mahojiano" }],
              ["offer", Handshake, { en: "Got an offer", sw: "Nimepata ofa" }],
              ["hired", PartyPopper, { en: "I got hired", sw: "Nimeajiriwa" }],
              ["no", X, { en: "Not this time", sw: "Si safari hii" }],
            ] as const).map(([stage, Icon, label]) => (
              <button
                key={stage}
                onClick={() => record(stage)}
                disabled={!!busy}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-pill border transition disabled:opacity-50 ${
                  stage === "no"
                    ? "border-border-input text-text-muted hover:text-espresso"
                    : "border-border-input text-text-body hover:border-ember hover:text-ember-hover"
                } ${busy === stage ? "opacity-60" : ""}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sw ? label.sw : label.en}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label={sw ? "Funga" : "Dismiss"}
          className="w-9 h-9 -m-2 flex items-center justify-center text-text-muted hover:text-espresso shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
