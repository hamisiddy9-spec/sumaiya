// The progress rail's model on the web — §3.3 of the chatbox redesign spec.
//
// The mirror of `apps/native/src/components/chat/chat-progress.ts`, and for the
// same reason it exists: the three-dot bubble said nothing, so a user could not
// tell a healthy wait from a stalled one, and re-sending on a metered connection
// costs them money. The rail is a small, CLOSED set of real steps, each emitted
// when the work behind it happened.
//
// The rules the model enforces:
//   · every line is emitted by a real event (no timer anywhere in here);
//   · at most four lines;
//   · a step that has not run is never faked as done — it is NAMED pending;
//   · exactly one step is `current`, everything before it is `done`;
//   · a failed step ends the run rather than pretending to continue.

import type { TurnEnding } from "./deliverable";

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

export interface TurnProgress {
  received: boolean;
  /** A file handed to this turn: its real character count, or the real reason. */
  files?: { name: string; chars?: number; error?: string }[];
  awaiting: boolean;
  /** Optional so a caller that has not reached this stage can say only what it knows. */
  answering?: boolean;
  outcome?: "ok" | "stopped" | "failed";
  /**
   * How the reply READS — set by the caller from the reply text via
   * `classifyTurnEnding()`. Undefined means "not reported": the rail then makes
   * no claim about an answer (it says "Nimejibu").
   *
   * The rail used to print "Here's your answer" for every turn that returned a
   * reply — including a turn whose reply was a question (device defect, native
   * 1.6.25, 2026-09-21). The native twin carries the same field; keep them in step.
   */
  ending?: TurnEnding;
}

const LABELS: Record<ChatStepId, { en: string; sw: string }> = {
  received: { en: "I've got your message", sw: "Nimeipokea ombi lako" },
  read: { en: "I'm reading your file", sw: "Ninasoma faili yako" },
  think: { en: "I'm thinking about your request", sw: "Ninalifikiri ombi lako" },
  answer: { en: "I'll write your answer", sw: "Nitakuandikia jibu lako" },
};

/** What the rail says once the turn is over — one honest line per ending. */
const ENDED_LABELS: Record<TurnEnding, { en: string; sw: string }> = {
  answer: { en: "Here's your answer", sw: "Hii hapa jibu lako" },
  question: { en: "I've asked you something", sw: "Nimekuuliza kitu" },
  other: { en: "I've replied", sw: "Nimejibu" },
};

/** The file line's sub-text: the real outcome, never a placeholder. */
export function fileDetail(file: { chars?: number; error?: string }, charCount: (n: number) => string): string | undefined {
  if (file.error) return file.error;
  if (typeof file.chars === "number" && file.chars > 0) return charCount(file.chars);
  return undefined;
}

export function buildTurnSteps(p: TurnProgress, charCount: (n: number) => string): ChatStep[] {
  const files = p.files ?? [];
  const steps: ChatStep[] = [];
  const failedFile = files.find((f) => f.error);
  const readingFile = p.files !== undefined && !failedFile && files.some((f) => f.chars === undefined) && !p.awaiting && !p.answering;
  const done = p.outcome === "ok";
  const dead = p.outcome === "failed" || p.outcome === "stopped";

  steps.push({ id: "received", label: LABELS.received, state: p.received ? "done" : "current" });

  if (p.files !== undefined) {
    steps.push({
      id: "read",
      label: LABELS.read,
      detail: failedFile ? fileDetail(failedFile, charCount) : files.length === 1 ? fileDetail(files[0], charCount) : undefined,
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

  if (p.answering || done) {
    steps.push({
      id: "answer",
      label: done ? ENDED_LABELS[p.ending ?? "other"] : LABELS.answer,
      state: done ? "done" : p.awaiting ? "pending" : "current",
    });
  }

  return steps;
}

/** How many rows are done — the bar's numerator, never rounded up. */
export function finishedSteps(steps: ChatStep[]): number {
  return steps.filter((s) => s.state === "done").length;
}

/** The current row, or undefined when the run has ended. */
export function currentStep(steps: ChatStep[]): ChatStep | undefined {
  return steps.find((s) => s.state === "current");
}

/** T9's label: the number of steps that really ran. */
export function receiptLabel(steps: ChatStep[]): string {
  const n = steps.filter((s) => s.state === "done" || s.state === "failed").length;
  return `Nilifanya hivi: hatua ${n}`;
}
