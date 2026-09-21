import { describe, expect, it } from "vitest";

import { MOTION } from "@/lib/motion";
import {
  CHAT_DURATIONS,
  CHAT_MOTION,
  CHAT_STAGGER_CAP,
  CHAT_STEP_BEAT_CYCLES,
  CHAT_STEP_BEAT_MS,
  charCountLabel,
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

describe("the web chat motion table (§3.8)", () => {
  it("uses only real motion tokens — no invented duration", () => {
    for (const d of CHAT_DURATIONS) expect(TOKENS.has(d)).toBe(true);
  });

  it("keeps the two off-token values the audit found out of the chat", () => {
    for (const banned of [280, 55, 160]) expect(CHAT_DURATIONS).not.toContain(banned);
  });

  it("caps the chat stagger at 3", () => {
    expect(CHAT_STAGGER_CAP).toBe(3);
    expect(chatStaggerDelayMs(0)).toBe(30);
    expect(chatStaggerDelayMs(3)).toBe(150);
    expect(chatStaggerDelayMs(99)).toBe(150);
    expect(chatStaggerDelayMs(-2)).toBe(30);
  });

  it("bounds the current-step beat rather than repeating forever", () => {
    expect(CHAT_MOTION.rail.beat).toBe(CHAT_STEP_BEAT_MS);
    expect(CHAT_STEP_BEAT_CYCLES).toBe(2);
    expect(CHAT_STEP_BEAT_MS * CHAT_STEP_BEAT_CYCLES).toBeLessThan(5000);
  });

  it("gives the user's own turn no entrance at all", () => {
    expect(CHAT_MOTION.userBubble.enter).toBe(0);
  });

  it("reports the step-truthful bar as finished/total, never ahead of the work", () => {
    expect(railBarProgress(0, 4)).toBe(0);
    expect(railBarProgress(2, 4)).toBe(0.5);
    expect(railBarProgress(4, 4)).toBe(1);
    expect(railBarProgress(9, 4)).toBe(1);
    expect(railBarProgress(0, 0)).toBe(0);
    expect(railBarProgress(Number.NaN, 4)).toBe(0);
  });

  it("keeps elapsed time and character counts as plain text", () => {
    expect(railElapsedLabel(6)).toBe("inaendelea · 6s");
    expect(railElapsedLabel(6.9)).toBe("inaendelea · 6s");
    expect(railElapsedLabel(-1)).toBe("inaendelea · 0s");
    expect(charCountLabel(2340)).toBe("herufi 2,340");
    expect(charCountLabel(1204)).toBe("herufi 1,204");
    expect(charCountLabel(0)).toBe("herufi 0");
  });
});
