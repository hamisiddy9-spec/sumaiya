/**
 * The chat motion table's contract, asserted.
 *
 * Three properties, and they are the three the spec actually promises (§3.8
 * and its closing "banned" list):
 *   1. Every duration is an app token or the one sanctioned beat constant —
 *      there is no third ad-hoc duration in the chat.
 *   2. Every move has a Reduce-Motion form, and it is `dur.instant` (1 ms), not
 *      0 — so completion callbacks still fire and nothing is merely invisible.
 *   3. The stagger is capped at 3, and the move that used to be an unbounded
 *      `withRepeat(…, -1)` is now a bounded beat.
 */
import { MOTION, MAX_STAGGER_MS } from "../ui/motion-tokens";
import {
  CHAT_MOTION,
  CHAT_DURATIONS,
  CHAT_STAGGER_CAP,
  CHAT_STEP_BEAT_CYCLES,
  CHAT_STEP_BEAT_MS,
  chatEnterMs,
  chatExitMs,
  chatStaggerDelayMs,
  railBarProgress,
  railElapsedLabel,
} from "./chat-motion";

const TOKENS = new Set<number>([
  MOTION.dur.instant,
  MOTION.dur.micro,
  MOTION.dur.fast,
  MOTION.dur.base,
  MOTION.dur.slow,
  MOTION.dur.screen,
  MOTION.dur.field,
]);

describe("the chat motion table (§3.8)", () => {
  it("uses only real motion tokens — no invented duration", () => {
    for (const d of CHAT_DURATIONS) {
      expect(TOKENS.has(d)).toBe(true);
    }
  });

  it("keeps the two off-token values the audit found out of the chat", () => {
    // quick-actions-grid.tsx used 280/55, attachment-preview-sheet.tsx used 160.
    for (const banned of [280, 55, 160]) {
      expect(CHAT_DURATIONS).not.toContain(banned);
    }
  });

  it("caps the chat stagger at 3, inside the global maximum", () => {
    expect(CHAT_STAGGER_CAP).toBe(3);
    // 30 + 3*40 = 150 ms — the longest a chat item waits.
    expect(chatStaggerDelayMs(0)).toBe(30);
    expect(chatStaggerDelayMs(3)).toBe(150);
    expect(chatStaggerDelayMs(99)).toBe(150);
    expect(chatStaggerDelayMs(99)).toBeLessThanOrEqual(MAX_STAGGER_MS);
    expect(chatStaggerDelayMs(2, true)).toBe(0);
  });

  it("collapses every move to dur.instant under Reduce Motion", () => {
    expect(chatEnterMs(true)).toBe(MOTION.dur.instant);
    expect(chatExitMs(true)).toBe(MOTION.dur.instant);
    expect(chatEnterMs(true, CHAT_MOTION.documentCard.enter)).toBe(MOTION.dur.instant);
    expect(chatExitMs(true, CHAT_MOTION.rail.exit)).toBe(MOTION.dur.instant);
    // Never 0: a 0 duration breaks `withTiming` finished callbacks (WCAG/a11y
    // nets elsewhere in this repo use 0.01ms for the same reason).
    expect(chatEnterMs(true)).toBeGreaterThan(0);
    expect(chatExitMs(true)).toBeGreaterThan(0);
  });

  it("bounds the current-step beat instead of repeating forever", () => {
    expect(CHAT_MOTION.rail.beat).toBe(CHAT_STEP_BEAT_MS);
    expect(CHAT_STEP_BEAT_CYCLES).toBe(2);
    expect(CHAT_STEP_BEAT_CYCLES).toBeLessThan(5);
    // Total motion of the beat: 2.1 s, well inside the 5 s Level-A ceiling.
    expect(CHAT_STEP_BEAT_MS * CHAT_STEP_BEAT_CYCLES).toBeLessThan(5000);
  });

  it("gives the user's own turn no entrance at all", () => {
    expect(CHAT_MOTION.userBubble.enter).toBe(0);
  });

  it("reports the step-truthful bar as finished/total, never ahead of the work", () => {
    expect(railBarProgress(0, 4)).toBe(0);
    expect(railBarProgress(2, 4)).toBe(0.5);
    expect(railBarProgress(4, 4)).toBe(1);
    // Cannot run ahead: more finished than total still clamps to 1.
    expect(railBarProgress(9, 4)).toBe(1);
    // A run with no steps is not "complete".
    expect(railBarProgress(0, 0)).toBe(0);
    expect(railBarProgress(Number.NaN, 4)).toBe(0);
  });

  it("keeps elapsed time as plain text", () => {
    expect(railElapsedLabel(0)).toBe("inaendelea · 0s");
    expect(railElapsedLabel(6)).toBe("inaendelea · 6s");
    expect(railElapsedLabel(6.9)).toBe("inaendelea · 6s");
    expect(railElapsedLabel(-3)).toBe("inaendelea · 0s");
  });
});
