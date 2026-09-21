/**
 * The chat's motion table — §3.8 of CHATBOX-REDESIGN-2026-09-20.md, as data.
 *
 * Twenty-two moves, every duration and easing drawn from the app's existing
 * tokens (`./motion-tokens` — which is the same vocabulary as
 * `apps/web/lib/motion.ts`). Nothing here invents a number: the two off-token
 * values the audit found in the chat (280/55 in `quick-actions-grid.tsx`, 160 in
 * `attachment-preview-sheet.tsx`) are replaced by entries in this table.
 *
 * Why a table and not just inline numbers in each component: the spec's
 * contract is that these values are *the same* on both platforms, that none of
 * them is off-token, and that every one of them collapses under Reduce Motion.
 * Those are three properties a plain unit test can prove, and
 * `chat-motion.test.ts` proves them — so "we implemented the animation table"
 * is a claim with evidence rather than a reading of the diff.
 *
 * The web twin is `apps/web/lib/assistant/chat-motion.ts`; if a number moves it
 * moves in both, and in the spec table, together.
 */
import { MOTION, enterDurationMs, exitDurationMs, staggerDelayMs } from "../ui/motion-tokens";

/**
 * The stagger cap for the chat is **3**, not the global 6 (spec §3.8 move 2).
 * A chat bubble is not a grid cell: three bubbles is one reply, and waiting
 * 270 ms for the fourth thing to settle in a conversation is latency, not
 * choreography. 30 + 3×40 = 150 ms is the longest a chat item waits.
 */
export const CHAT_STAGGER_CAP = 3;

/**
 * Move 10 — the current step's beat.
 *
 * `1.05 s`, **two cycles**, then it stops. This deliberately replaces
 * `withRepeat(…, -1)`: an unbounded loop that runs beside other content for
 * more than five seconds is a WCAG 2.2.2 (Level A) failure, not a taste
 * question, and it was costing a per-frame callback on a low-end GPU. Bounded
 * at two cycles the whole beat is 2.1 s of motion, attached only to the one
 * 8 px node that is actually moving.
 */
export const CHAT_STEP_BEAT_MS = 1050;
export const CHAT_STEP_BEAT_CYCLES = 2;

export const CHAT_MOTION = {
  /** 1 · Sumaiya's bubble arrives — 300, ease.out, rise 12. */
  bubble: { enter: MOTION.dur.slow, distance: MOTION.rise },
  /** 2 · Bubble-run stagger — 30 + min(i, 3)×40. */
  bubbleStagger: { base: MOTION.stagger.base, step: MOTION.stagger.step, cap: CHAT_STAGGER_CAP },
  /** 3 · The user's own bubble — no entrance. Their finger produced it. */
  userBubble: { enter: 0 },
  /** 4 · Document card placed — 220, scale .985→1, rise 6, out 140 ease.in. */
  documentCard: { enter: MOTION.dur.base, exit: MOTION.dur.fast, scaleFrom: 0.985, distance: 6 },
  /** 5 · Suggestion chips dock in — 300, stagger 30, cap 3, out 140 ease.in. */
  chips: { enter: MOTION.dur.slow, exit: MOTION.dur.fast, base: MOTION.stagger.base, cap: CHAT_STAGGER_CAP },
  /** 6–9 · The progress rail: enter 300 rise 12, exit 140, step swap 140/220, bar 220. */
  rail: {
    enter: MOTION.dur.slow,
    exit: MOTION.dur.fast,
    distance: MOTION.rise,
    stepOut: MOTION.dur.fast,
    stepIn: MOTION.dur.base,
    bar: MOTION.dur.base,
    beat: CHAT_STEP_BEAT_MS,
    beatCycles: CHAT_STEP_BEAT_CYCLES,
  },
  /** 8 · Rail collapses to the receipt — 220, sanctioned layout reflow on spring.snappy. */
  receipt: { collapse: MOTION.dur.base, spring: MOTION.spring.snappy, enter: MOTION.dur.base },
  /** 11 · Send ⇄ stop morph in one slot — 220 glyph cross-fade, 90 fill. */
  sendSlot: { glyph: MOTION.dur.base, fill: MOTION.dur.micro },
  /** 12 · Attachment chip — 300 in, stagger 40, 140 ease.in out. */
  attachmentChip: { enter: MOTION.dur.slow, exit: MOTION.dur.fast, stagger: MOTION.stagger.step },
  /** 13 · Upload progress — 90 ms steps on scaleX, never finer than 5%. */
  uploadProgress: { step: MOTION.dur.micro, minStepPct: 5 },
  /** 14 · Sheet present/dismiss (attach, job choice, preview) — 220 / 140. */
  sheet: { backdrop: MOTION.dur.base, panel: MOTION.dur.base, exit: MOTION.dur.fast },
  /** 15 · Chosen path expands — 220 content, 140 collapse. */
  pathExpand: { open: MOTION.dur.base, close: MOTION.dur.fast },
  /** 16 · An error card arrives on its own turn — 300 rise, 140 out. */
  turnError: { enter: MOTION.dur.slow, exit: MOTION.dur.fast, distance: MOTION.rise },
  /** 17 · Retry: label ⇄ spinner in place — 220. */
  retry: { swap: MOTION.dur.base },
  /** 18 · Rail → receipt → answer hand-off — placeholder out 140 while content enters 300. */
  handoff: { placeholderOut: MOTION.dur.fast, contentIn: MOTION.dur.slow },
  /** 19 · Unavailable card — 300 rise in, 140 ease.in self-retiring. */
  unavailable: { enter: MOTION.dur.slow, exit: MOTION.dur.fast, distance: MOTION.rise },
  /** 20 · Card → editor handoff — a 260 FLIP; a cross-fade under Reduce Motion. */
  handoffToEditor: { flip: MOTION.dur.screen, reducedMotion: "cross-fade" as const },
  /** 21 · Scroll-to-bottom pill — 300 rise 12 in, 140 out. */
  scrollPill: { enter: MOTION.dur.slow, exit: MOTION.dur.fast, distance: MOTION.rise },
  /** 22 · Destructive confirm (clear conversation) — spring.gentle, backdrop 220, out 140. */
  confirmDialog: { spring: MOTION.spring.gentle, backdrop: MOTION.dur.base, exit: MOTION.dur.fast },
} as const;

/**
 * Every duration in the table, flat — the token-provenance test walks this and
 * asserts each one is a real token (`dur.micro|fast|base|slow|screen|field`) or
 * the single sanctioned beat constant. A new inline `220`-alike sneaks past a
 * code review; it cannot sneak past this list.
 */
export const CHAT_DURATIONS = [
  CHAT_MOTION.bubble.enter,
  CHAT_MOTION.documentCard.enter,
  CHAT_MOTION.documentCard.exit,
  CHAT_MOTION.chips.enter,
  CHAT_MOTION.chips.exit,
  CHAT_MOTION.rail.enter,
  CHAT_MOTION.rail.exit,
  CHAT_MOTION.rail.stepOut,
  CHAT_MOTION.rail.stepIn,
  CHAT_MOTION.rail.bar,
  CHAT_MOTION.receipt.collapse,
  CHAT_MOTION.sendSlot.glyph,
  CHAT_MOTION.sendSlot.fill,
  CHAT_MOTION.attachmentChip.enter,
  CHAT_MOTION.attachmentChip.exit,
  CHAT_MOTION.uploadProgress.step,
  CHAT_MOTION.sheet.backdrop,
  CHAT_MOTION.sheet.panel,
  CHAT_MOTION.sheet.exit,
  CHAT_MOTION.pathExpand.open,
  CHAT_MOTION.pathExpand.close,
  CHAT_MOTION.turnError.enter,
  CHAT_MOTION.turnError.exit,
  CHAT_MOTION.retry.swap,
  CHAT_MOTION.handoff.placeholderOut,
  CHAT_MOTION.handoff.contentIn,
  CHAT_MOTION.unavailable.enter,
  CHAT_MOTION.unavailable.exit,
  CHAT_MOTION.handoffToEditor.flip,
  CHAT_MOTION.scrollPill.enter,
  CHAT_MOTION.scrollPill.exit,
  CHAT_MOTION.confirmDialog.backdrop,
  CHAT_MOTION.confirmDialog.exit,
] as const;

/** Delay before the nth chat item moves — 30 + min(i, 3)×40, and 0 reduced. */
export function chatStaggerDelayMs(index: number, reduceMotion = false): number {
  return staggerDelayMs(index, {
    reduceMotion,
    base: CHAT_MOTION.bubbleStagger.base,
    step: CHAT_MOTION.bubbleStagger.step,
    cap: CHAT_MOTION.bubbleStagger.cap,
  });
}

/** Entering duration for a chat element — `dur.instant` under Reduce Motion. */
export function chatEnterMs(reduceMotion: boolean, duration: number = MOTION.dur.slow): number {
  return enterDurationMs(reduceMotion, duration);
}

/** Leaving duration for a chat element — always shorter, near-instant reduced. */
export function chatExitMs(reduceMotion: boolean, duration: number = MOTION.dur.fast): number {
  return exitDurationMs(reduceMotion, duration);
}

/**
 * §3.3 — the step-truthful bar. `finished / total`, clamped, and **never**
 * rounded up: two of four done is `0.5`. Returns 0 for a run with no steps so a
 * rail that has not started cannot render as complete.
 */
export function railBarProgress(finished: number, total: number): number {
  if (!Number.isFinite(finished) || !Number.isFinite(total) || total <= 0) return 0;
  const done = Math.max(0, Math.min(finished, total));
  return done / total;
}

/**
 * The elapsed-time label, as plain text (`inaendelea · 6s`). It is deliberately
 * NOT animated — it is the one number that makes a wait feel bounded, and the
 * motion standard bans animating a number the user is comparing.
 */
export function railElapsedLabel(seconds: number): string {
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `inaendelea · ${s}s`;
}
