"use client";

// T4 · The progress rail (§3.2/§3.3) and T9 · its receipt — the web half.
//
// It replaces the bare three-dot bubble, and it replaces **two** stacked
// indicators for one state: the live client used to render an `analyzing` bubble
// AND a `sending` bubble, both keyed on the same flags (audit T4) — two answers
// to one question, stacked.
//
// The reason it exists is not aesthetic: three pulsing dots look identical
// whether the request is healthy or dead, so a user cannot tell a wait from a
// stall — and on metered data the only tool they have is to send it again.
//
// Everything visible here is emitted from a real event: `received` when the turn
// enters the transcript, `read` from the file's actual extraction result,
// `think` while the request is out, `answer` once the reply is in hand. There is
// no timer in this component except the elapsed-time text, which is plain text
// and deliberately not animated.
//
// Motion, all from the table (§3.8): enter 300 with a 12 px rise; the bar 220
// `ease.out` on `transform: scaleX`, never `width`; the current step's glyph a
// BOUNDED 1.05 s × 2 beat (never `animation: infinite` — an unpausable loop that
// runs beside content for over five seconds is a WCAG 2.2.2 Level-A failure);
// the collapse to the receipt at 220. The app-wide
// `prefers-reduced-motion` net in `app/globals.css` collapses all of it to
// 0.01ms, and every word stays legible as static text.

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { MOTION } from "@/lib/motion";
import { CHAT_MOTION, railBarProgress, railElapsedLabel } from "@/lib/assistant/chat-motion";
import { currentStep, finishedSteps, receiptLabel, type ChatStep } from "@/lib/assistant/chat-progress";

/** 2340 → "2,340" (the same grouping as the app, so the count matches). */
const SW = {
  continuing: (s: number) => railElapsedLabel(s),
  stop: "Acha",
  stopLine: "Unaweza kuacha kusubiri wakati wowote — maneno yako yanabaki.",
  slowLine: "Uko kwenye mtandao wa polepole. Nitatuma bila kupoteza ulichoniambia.",
  expand: "Fungua hatua",
};

function StepGlyph({ state, beat }: { state: ChatStep["state"]; beat: boolean }) {
  if (state === "done") {
    return (
      <span className="w-[18px] h-[18px] rounded-full bg-pine text-cream flex items-center justify-center shrink-0">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="w-[18px] h-[18px] rounded-full bg-ember-hover text-cream flex items-center justify-center shrink-0 text-[11px] font-black">
        ✕
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full bg-ember-shadow flex items-center justify-center shrink-0"
        // Bounded: two iterations of a 1.05 s beat, then it stops. Inline so it
        // cannot be confused with the app's infinite utility classes.
        style={beat ? { animation: `chatStepBeat ${CHAT_MOTION.rail.beat}ms ${MOTION.ease.inOut} ${CHAT_MOTION.rail.beatCycles}` } : undefined}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cream" />
      </span>
    );
  }
  return <span className="w-[18px] h-[18px] rounded-full border-2 border-border-input shrink-0" />;
}

export function ProgressRail({
  steps,
  startedAt,
  onStop,
  sw = true,
}: {
  steps: ChatStep[];
  startedAt: number;
  onStop?: () => void;
  sw?: boolean;
}) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.round((Date.now() - startedAt) / 1000)));

  useEffect(() => {
    setSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
    const id = setInterval(() => setSeconds(Math.max(0, Math.round((Date.now() - startedAt) / 1000))), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const finished = finishedSteps(steps);
  const progress = railBarProgress(finished, steps.length);
  const current = currentStep(steps);

  return (
    <div
      // Announced at step boundaries only — this component re-renders per step,
      // never per token (there are no tokens; nothing streams).
      role="status"
      aria-live="polite"
      aria-label={`${railElapsedLabel(seconds)}. ${steps.map((s) => (sw ? s.label.sw : s.label.en)).join(". ")}`}
      className="w-full bg-card border border-border rounded-[20px] p-3.5 mt-1.5"
      style={{ animation: `chatRise ${CHAT_MOTION.rail.enter}ms ${MOTION.ease.out}` }}
    >
      <style>{`
        @keyframes chatStepBeat { 0% { opacity: 1 } 50% { opacity: .55 } 100% { opacity: 1 } }
        @keyframes chatRise { from { opacity: 0; transform: translateY(${CHAT_MOTION.rail.distance}px) } to { opacity: 1; transform: none } }
      `}</style>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-text-muted">SUMAIYA</span>
        <span className="text-[11.5px] text-text-muted">{SW.continuing(seconds)}</span>
      </div>

      {/* Move 9 — the step-truthful bar. `transform` only, never `width`, and it
          cannot outrun the work: two of four done is exactly half. */}
      <div className="mt-2.5 h-1 rounded-full bg-border overflow-hidden">
        <div
          className={`h-1 rounded-full ${progress >= 1 ? "bg-pine" : "bg-ember-shadow"}`}
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: "left",
            transition: `transform ${CHAT_MOTION.rail.bar}ms ${MOTION.ease.out}`,
          }}
        />
      </div>

      <ul className="mt-3 space-y-2.5">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2.5">
            <StepGlyph state={s.state} beat={s.state === "current"} />
            <div className="min-w-0">
              <p
                className={
                  s.state === "current"
                    ? "text-[13.5px] font-bold text-ember-shadow"
                    : s.state === "failed"
                      ? "text-[13.5px] font-bold text-ember-hover"
                      : s.state === "pending"
                        ? "text-[13.5px] font-semibold text-text-muted/75"
                        : "text-[13.5px] font-semibold text-text-muted"
                }
              >
                {sw ? s.label.sw : s.label.en}
              </p>
              {s.detail ? (
                <p className={`text-[11.5px] mt-0.5 ${s.state === "pending" ? "text-text-muted/75" : "text-text-muted"}`}>{s.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        <p className="flex-1 text-[11.5px] leading-4 text-text-muted">{sw ? SW.stopLine : "You can stop waiting at any time — your words stay."}</p>
        {onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label={sw ? SW.stop : "Stop"}
            className="min-w-[72px] min-h-[40px] px-4 rounded-input bg-espresso text-cream text-[13.5px] font-bold hover:bg-black/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60"
          >
            {sw ? SW.stop : "Stop"}
          </button>
        ) : null}
      </div>

      {current ? <p className="mt-2.5 text-[11.5px] text-text-muted">{sw ? SW.slowLine : "On a slow connection I'll send it without losing what you told me."}</p> : null}
    </div>
  );
}

/**
 * T9 · The receipt. One collapsed line, tapping expands the finished steps
 * read-only; it never re-animates on scroll, and it is the reason the rail does
 * not vanish and take its evidence with it.
 */
export function ProgressReceipt({ steps, sw = true }: { steps: ChatStep[]; sw?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;
  const label = receiptLabel(steps);
  return (
    <div className="self-start bg-card border border-border rounded-[14px] px-3 py-2 mt-1.5" style={{ animation: `chatRise ${CHAT_MOTION.receipt.enter}ms ${MOTION.ease.out}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${label} — ${sw ? SW.expand : "show the steps"}`}
        className="flex items-center gap-2 min-h-[28px]"
      >
        <Check className="w-3.5 h-3.5 text-pine" strokeWidth={3} />
        <span className="text-[12.5px] font-semibold text-text-muted">{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>
      {open ? (
        <ul className="mt-2.5 space-y-2.5 opacity-90">
          {steps
            .filter((s) => s.state !== "current" && s.state !== "pending")
            .map((s) => (
              <li key={s.id} className="flex items-start gap-2.5">
                <StepGlyph state={s.state} beat={false} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-text-muted">{sw ? s.label.sw : s.label.en}</p>
                  {s.detail ? <p className="text-[11.5px] text-text-muted mt-0.5">{s.detail}</p> : null}
                </div>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
