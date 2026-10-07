"use client";

// T8 · The intelligence-unavailable card, T7 · the error attached to a turn, and
// the gold band that labels local work — §3.2/§3.6 of the chatbox redesign spec.
//
// Tonight's QA caught the literal bubble **`AI is not configured.`** in an
// otherwise Swahili conversation on the web: the raw English JSON body of a 503
// (`apps/web/lib/api/routes/ai.ts:546`, one of 17 identical sites) rendered as if
// Sumaiya had said it. The client must never do that again, whatever the server
// sends — so the copy below is hers, in the user's language, and the classifier in
// `lib/assistant/chat-unavailable.ts` is the gate.
//
// What the card never does: beg, blame, lie, dead-end or show a word of raw
// English. What it always does: name the real condition, rule the wrong cause out
// explicitly (`Si mtandao wako, na si maandishi yako`), and offer at least one
// control that works **right now** — the three model-free ones, or a retry that
// resends the same turn.
//
// Motion: 300 rise in, 140 `ease.in` out when it retires itself; instant under the
// app-wide reduced-motion net. No pulse, no bounce, nothing that demands
// attention — every word is legible as static text.

import { AlertTriangle, X, ChevronRight } from "lucide-react";
import { MOTION } from "@/lib/motion";
import { CHAT_MOTION } from "@/lib/assistant/chat-motion";
import { UNAVAILABLE_COPY, WORKS_WITHOUT_A_MODEL, type UnavailableVariant } from "@/lib/assistant/chat-unavailable";

export function UnavailableCard({
  variant,
  sw = true,
  onOpenAts,
  onOpenEditor,
  onReadPhoto,
  onRetry,
  onWriteYourself,
  retryBusy = false,
}: {
  variant: UnavailableVariant;
  sw?: boolean;
  onOpenAts?: () => void;
  onOpenEditor?: () => void;
  onReadPhoto?: () => void;
  onRetry?: () => void;
  onWriteYourself?: () => void;
  retryBusy?: boolean;
}) {
  const copy = UNAVAILABLE_COPY[variant];
  const pick = (v: { en: string; sw: string }) => (sw ? v.sw : v.en);
  const actions = [
    { id: "ats" as const, onPress: onOpenAts },
    { id: "editor" as const, onPress: onOpenEditor },
    { id: "ocr" as const, onPress: onReadPhoto },
  ].filter((a) => a.onPress);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-card border border-gold rounded-[18px] p-3.5 mt-2"
      style={{ animation: `chatUnavailableIn ${CHAT_MOTION.unavailable.enter}ms ${MOTION.ease.out}` }}
    >
      <style>{`@keyframes chatUnavailableIn { from { opacity: 0; transform: translateY(${CHAT_MOTION.unavailable.distance}px) } to { opacity: 1; transform: none } }`}</style>

      <div className="flex items-center justify-between mb-2">
        {/* Gold is the palette's "degraded, not broken" colour: the error red
            stays reserved for a real fault, so the two never mean the same
            thing on screen. */}
        <span className="text-[10.5px] font-extrabold tracking-[0.08em] text-gold-text">{sw ? "KWA SEHEMU" : "PARTIAL"}</span>
        <AlertTriangle className="w-4 h-4 text-gold-text" />
      </div>

      <h4 className="text-[15px] font-extrabold text-espresso leading-5">{pick(copy.title)}</h4>
      <p className="text-[13px] leading-relaxed text-text-body mt-1.5">{pick(copy.why)}</p>
      {variant === "known" ? <p className="text-[13px] leading-relaxed text-text-body font-semibold mt-1.5">{pick(copy.promise)}</p> : null}

      {actions.length ? (
        <div className="mt-3">
          <p className="text-[11px] font-extrabold tracking-[0.06em] text-text-muted mb-1">
            {sw ? "NINACHOWEZA KUFANYA SASA HIVI" : "WHAT I CAN DO RIGHT NOW"}
          </p>
          {actions.map((a) => {
            const item = WORKS_WITHOUT_A_MODEL.find((w) => w.id === a.id)!;
            return (
              <button
                key={a.id}
                type="button"
                onClick={a.onPress}
                aria-label={`${pick(item.label)}. ${pick(item.hint)}`}
                className="w-full flex items-center gap-2.5 min-h-[48px] px-2.5 rounded-input hover:bg-sand-2 transition text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold text-espresso">{pick(item.label)}</span>
                  <span className="block text-[11.5px] text-text-muted mt-0.5">{pick(item.hint)}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-ember-shadow shrink-0" />
              </button>
            );
          })}
        </div>
      ) : null}

      {variant === "mid-turn" ? (
        <div className="flex flex-wrap gap-2 mt-3">
          {onRetry ? (
            <button
              type="button"
              onClick={retryBusy ? undefined : onRetry}
              disabled={retryBusy}
              className="min-h-[40px] px-4 rounded-input bg-ember-shadow text-cream text-[13.5px] font-bold hover:bg-ember-hover transition disabled:opacity-70"
              style={{ transitionDuration: `${CHAT_MOTION.retry.swap}ms` }}
            >
              {sw ? "Jaribu ombi hili tena" : "Try this request again"}
            </button>
          ) : null}
          {onWriteYourself ? (
            <button
              type="button"
              onClick={onWriteYourself}
              className="min-h-[40px] px-4 rounded-input border border-border-input text-espresso text-[13.5px] font-semibold hover:bg-sand-2 transition"
            >
              {sw ? "Andika mwenyewe" : "Write it myself"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2 mt-3">
        <X className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[11.5px] leading-4 text-text-muted">
          {pick(copy.missing)}{" "}
          {variant === "known"
            ? sw
              ? "Kadi hii inajibadilisha yenyewe nikirudi — huna haja ya kuuliza tena."
              : "This card changes by itself when I'm back — you don't have to ask again."
            : pick(copy.promise)}
        </p>
      </div>
    </div>
  );
}

/**
 * T7 · The error attached to the turn it belongs to.
 *
 * Three parts, always, in this order: what happened, why (with the non-cause
 * ruled out), what to do. Never a status code, never full-width, and the retry is
 * `Jaribu ombi hili tena` — the same turn, so retrying never costs a retype.
 */
export function TurnErrorCard({
  title,
  why,
  ruledOut,
  retryLabel,
  onRetry,
  busy = false,
  secondaryLabel,
  onSecondary,
  footer,
}: {
  title: string;
  why: string;
  ruledOut?: string;
  retryLabel?: string;
  onRetry?: () => void;
  busy?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footer?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="self-end max-w-[92%] bg-card border border-ember/35 border-l-[3px] border-l-ember-hover rounded-[16px] p-3.5 mt-2"
      style={{ animation: `chatErrorIn ${CHAT_MOTION.turnError.enter}ms ${MOTION.ease.out}` }}
    >
      <style>{`@keyframes chatErrorIn { from { opacity: 0; transform: translateY(${CHAT_MOTION.turnError.distance}px) } to { opacity: 1; transform: none } }`}</style>
      <h4 className="text-[14px] font-extrabold text-espresso leading-[19px]">{title}</h4>
      <p className="text-[13px] leading-[19.5px] text-text-body mt-1.5">{why}</p>
      {ruledOut ? <p className="text-[13px] leading-[19.5px] text-text-body mt-1.5 font-semibold">{ruledOut}</p> : null}
      <div className="flex flex-wrap gap-2 mt-3">
        {onRetry ? (
          <button
            type="button"
            onClick={busy ? undefined : onRetry}
            disabled={busy}
            className="min-h-[40px] px-4 rounded-input bg-ember-shadow text-cream text-[13.5px] font-bold hover:bg-ember-hover transition disabled:opacity-70"
          >
            {retryLabel ?? "Jaribu ombi hili tena"}
          </button>
        ) : null}
        {onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            className="min-h-[40px] px-4 rounded-input border border-border-input text-espresso text-[13.5px] font-semibold hover:bg-sand-2 transition"
          >
            {secondaryLabel ?? "Andika mwenyewe"}
          </button>
        ) : null}
      </div>
      {footer ? <p className="text-[11.5px] leading-4 text-text-muted mt-2.5">{footer}</p> : null}
    </div>
  );
}

/**
 * The gold band for work produced **without** a model (§3.6 variant C, rule 4:
 * "label the output, not the app"). It goes on the artifact, and only when the
 * output is degraded — nothing is labelled on the good path, because labelling
 * everything trains people to ignore the label.
 */
export function LocalOnlyBand({ sw = true }: { sw?: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-gold-tint border-b border-gold px-3 py-1.5" role="note">
      <span className="text-[10.5px] font-extrabold tracking-[0.06em] text-gold-text">
        ◎ {sw ? "HUU NI USAFI MDOGO WA MAANDISHI — SI AI" : "THIS IS A LIGHT TEXT TIDY-UP — NOT AI"}
      </span>
    </div>
  );
}
