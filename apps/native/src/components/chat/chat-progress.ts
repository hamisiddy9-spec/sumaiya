/**
 * The progress rail's model — §3.3 of CHATBOX-REDESIGN-2026-09-20.md.
 *
 * The rail exists because of a measured harm, on the device, tonight: a user who
 * received nothing re-sent `Hi` four times, and the three-dot bubble they were
 * looking at is identical whether the request is healthy or dead. Re-sending on
 * a metered connection costs them money, so the fix is not "a nicer spinner" —
 * it is a small, **closed set of real steps**, each emitted when the work behind
 * it actually happened.
 *
 * The honesty rules the model enforces, from the research quoted in §3.3:
 *   - every line is emitted by a real event (there is no timer here at all);
 *   - at most four lines;
 *   - a step that has not run is never faked as done — it is *named* pending,
 *     because a named future step is a plan, not a silence;
 *   - exactly one step is `current` at a time, everything before it is `done`;
 *   - a step that fails says so and stops the run (it does not pretend to
 *     continue to the next one).
 *
 * Pure: no React, no Reanimated, no i18n. `chat-progress.test.ts` asserts the
 * invariants, and the component that renders this is a renderer only.
 */

export type ChatStepId = "received" | "read" | "think" | "answer";

export type ChatStepState = "done" | "current" | "pending" | "failed";

export interface ChatStep {
  id: ChatStepId;
  /** First person, about herself — the voice rule for anything spoken. */
  label: { en: string; sw: string };
  /** The real result of the step, once it has one (`herufi 2,340`). */
  detail?: string;
  state: ChatStepState;
}

/** What the client actually knows, from real events. Nothing here is inferred. */
export interface TurnProgress {
  /** The user's turn is in the transcript. */
  received: boolean;
  /**
   * Files handed to this turn. A file is part of the rail only while it exists,
   * and its line reports the real character count or the real failure.
   */
  files?: { name: string; chars?: number; error?: string }[];
  /** The request is out, the reply has not come back. */
  awaiting: boolean;
  /** The reply is in hand and its bubbles are being staged. Optional so a caller
   *  that has not reached this stage says only what it knows. */
  answering?: boolean;
  /** How the turn ended, when it has. */
  outcome?: "ok" | "stopped" | "failed";
}

const LABELS: Record<ChatStepId, { en: string; sw: string }> = {
  received: { en: "I've got your message", sw: "Nimeipokea ombi lako" },
  read: { en: "I'm reading your file", sw: "Ninasoma faili yako" },
  think: { en: "I'm thinking about your request", sw: "Ninalifikiri ombi lako" },
  // Named while it is still pending — "a named future step is a plan, not a silence".
  answer: { en: "I'll write your answer", sw: "Nitakuandikia jibu lako" },
};

/**
 * `herufi 2,340` — grouped, because it is a real count the user can check.
 *
 * Grouped by hand rather than with `toLocaleString`: Hermes' Intl support is
 * partial and a count that renders as `2340` on some devices and `2,340` on
 * others is exactly the kind of "the number is different from the one you saw"
 * defect this rail is supposed to remove.
 */
export function charCountLabel(chars: number): string {
  if (!Number.isFinite(chars) || chars <= 0) return "herufi 0";
  return `herufi ${groupDigits(Math.floor(chars))}`;
}

/** 2340 → "2,340". */
export function groupDigits(n: number): string {
  const s = String(Math.trunc(Math.abs(n)));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const fromEnd = s.length - i;
    out += s[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ",";
  }
  return n < 0 ? `-${out}` : out;
}

/** The file line's sub-text: the real outcome, never a placeholder. */
export function fileDetail(file: { chars?: number; error?: string }): string | undefined {
  if (file.error) return file.error;
  if (typeof file.chars === "number" && file.chars > 0) return charCountLabel(file.chars);
  return undefined;
}

/**
 * Build the rail for one turn. The order is fixed — received → read (only when
 * there is a file) → think → answer — and the state of each row is derived from
 * the events, so the bar (`railBarProgress`) can never report more than has
 * happened.
 */
export function buildTurnSteps(p: TurnProgress): ChatStep[] {
  const files = p.files ?? [];
  const steps: ChatStep[] = [];

  // A failed file read is the end of the run: she cannot think about text she
  // could not read, and showing "thinking" after it would be the lie the whole
  // redesign is against. `received` is still true — the words arrived.
  const failedFile = files.find((f) => f.error);
  const readingFile = p.files !== undefined && !failedFile && files.some((f) => f.chars === undefined) && !p.awaiting && !p.answering;

  const done = p.outcome === "ok";
  const dead = p.outcome === "failed" || p.outcome === "stopped";

  steps.push({
    id: "received",
    label: LABELS.received,
    state: p.received ? "done" : "current",
  });

  if (p.files !== undefined) {
    steps.push({
      id: "read",
      label: LABELS.read,
      detail: failedFile ? fileDetail(failedFile) : files.length === 1 ? fileDetail(files[0]) : undefined,
      state: failedFile
        ? "failed"
        : files.length > 0 && files.every((f) => f.chars !== undefined)
          ? "done"
          : readingFile
            ? "current"
            : "pending",
    });
  }

  if (failedFile) return steps;

  steps.push({
    id: "think",
    label: LABELS.think,
    state: done ? "done" : dead ? "failed" : p.awaiting ? "current" : "pending",
  });

  // The last row is only worth naming once the model is answering, or when the
  // turn is over — naming it while she is still reading is a menu, not a plan.
  if (p.answering || done) {
    steps.push({
      id: "answer",
      label: done ? { en: "Here's your answer", sw: "Hii hapa jibu lako" } : LABELS.answer,
      state: done ? "done" : p.awaiting ? "pending" : "current",
    });
  }

  return steps;
}

/** How many rows are done — the bar's numerator, and it is never rounded up. */
export function finishedSteps(steps: ChatStep[]): number {
  return steps.filter((s) => s.state === "done").length;
}

/** The current row, or undefined when the run has ended. */
export function currentStep(steps: ChatStep[]): ChatStep | undefined {
  return steps.find((s) => s.state === "current");
}

/**
 * The receipt's label (§3.2 T9). After a multi-step turn the rail collapses to
 * one line; the count is the number of steps that really ran.
 */
export function receiptLabel(steps: ChatStep[]): string {
  const n = steps.filter((s) => s.state === "done" || s.state === "failed").length;
  return `Nilifanya hivi: hatua ${n}`;
}
