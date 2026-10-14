/**
 * The progress rail's model — §3.3 of CHATBOX-REDESIGN-2026-09-20.md, with the
 * step vocabulary the design guide pins in **§9 THE PROCESSING SURFACE**.
 *
 * The rail exists because of a measured harm, on the device: a user who
 * received nothing re-sent `Hi` four times, and the three-dot bubble they were
 * looking at is identical whether the request is healthy or dead. Re-sending on
 * a metered connection costs them money, so the fix is not "a nicer spinner" —
 * it is a small, **closed set of real steps**, each emitted when the work behind
 * it actually happened.
 *
 * §9's content is the design's, verbatim, and it is what this file now builds:
 *
 *   ✓ Kuandika CV yako        herufi 2,340 zimekamilika   TAYARI
 *   △ Kuilinganisha na tangazo Inachanganua ujuzi wa…     INAKAGUA
 *   ○ Kuandaa barua ya maombi  Itaundwa kwa Kiswahili…    BAADAYE
 *
 * The honesty rules the model enforces, from the research quoted in §3.3:
 *   - every line is emitted by a real event (there is no timer here at all);
 *   - at most four lines;
 *   - a step that has not run is never faked as done — it is *named* pending,
 *     because a named future step is a plan, not a silence;
 *   - exactly one step is `current` at a time, everything before it is `done`;
 *   - a step that fails says so and stops the run (it does not pretend to
 *     continue to the next one);
 *   - **every number is a real one**: the design's own sub-line
 *     (`herufi 2,340 zimekamilika`) is only ever printed from a count the caller
 *     genuinely has. Absent, the sub-line is absent — never a placeholder.
 *
 * Pure: no React, no Reanimated, no i18n. `chat-progress.test.ts` asserts the
 * invariants, and the component that renders this is a renderer only.
 */

export type ChatStepId = "read" | "write" | "match" | "deliver";

export type ChatStepState = "done" | "current" | "pending" | "failed";

export interface ChatStep {
  id: ChatStepId;
  /** First person, about herself — the voice rule for anything spoken. */
  label: { en: string; sw: string };
  /** The real result of the step, once it has one (`herufi 2,340`). */
  detail?: string;
  state: ChatStepState;
}

/**
 * How a finished turn actually reads, derived from the reply itself.
 *
 * This exists because the rail used to print `✓ Hii hapa jibu lako` ("here is
 * your answer") for EVERY turn that returned a reply — including a turn whose
 * reply was a question. Measured on a real device (1.6.25, 2026-09-21): the user
 * asked for a CV summary, got "…ukaguzi wa CV, linganisha kazi, au tengeneza
 * hati. Tutafanya nini kwanza?", and the rail claimed an answer had arrived.
 * A claim the user can check must be true.
 */
export type TurnEnding = "answer" | "question" | "other";

/** What the rail says once the turn is over — one honest line per ending. */
const ENDED_LABELS: Record<TurnEnding, { en: string; sw: string }> = {
  answer: { en: "Here's your answer", sw: "Hii hapa jibu lako" },
  // She asked something and delivered nothing — say exactly that.
  question: { en: "I've asked you something", sw: "Nimekuuliza kitu" },
  // A plain acknowledgement: no answer, no question. Never dressed up as one.
  other: { en: "I've replied", sw: "Nimejibu" },
};

/**
 * §9's step vocabulary, in the design's order.
 *
 * `write` and `match` are the design's own words for the work (`Kuandika CV
 * yako`, `Kuilinganisha na tangazo`); `deliver` carries the design's named next
 * deliverable (`Kuandaa barua ya maombi`) **while it is still a plan**, and is
 * replaced by the honest ending line (`Hii hapa jibu lako` / `Nimekuuliza kitu`)
 * the moment the turn is over — so the row names the work without ever claiming
 * a letter that was not written.
 *
 * `read` is the app's own step and it is kept: the design has no row for the
 * file the user hands over, and it is the one row that carries a real count of
 * something that really happened (`herufi 1,204`).
 */
const PLAN_LABELS: Record<ChatStepId, { en: string; sw: string }> = {
  read: { en: "I'm reading your file", sw: "Ninasoma faili yako" },
  write: { en: "Writing your CV", sw: "Kuandika CV yako" },
  match: { en: "Matching it to the advert", sw: "Kuilinganisha na tangazo" },
  deliver: { en: "Preparing your cover letter", sw: "Kuandaa barua ya maombi" },
};

/**
 * §9's header sentence — the panel says *what is happening*, in words, from the
 * first second. Exported so the design's own string is testable without a device.
 */
export const RAIL_HEADER = { en: "Sumaiya is writing…", sw: "Sumaiya anaandika…" } as const;

/**
 * §8's tap floor, and the design's own size for the `Acha` control (§9 puts it
 * in the header, beside the elapsed time, from the first second).
 */
export const RAIL_STOP_MIN_DP = 44;

/**
 * §9's state chips — one word per real state, and the words are the design's.
 *
 * The design has no chip for a step that really failed; this one is not
 * softened into `BAADAYE` (that would be the lie the rail exists to prevent).
 */
const STATE_CHIPS: Record<ChatStepState, { en: string; sw: string }> = {
  done: { en: "READY", sw: "TAYARI" },
  current: { en: "CHECKING", sw: "INAKAGUA" },
  pending: { en: "LATER", sw: "BAADAYE" },
  failed: { en: "FAILED", sw: "IMESHINDIKANA" },
};

/** The chip for a row's real state. */
export function stepStateChip(state: ChatStepState): { en: string; sw: string } {
  return STATE_CHIPS[state] ?? STATE_CHIPS.pending;
}

/**
 * Which wash a row gets (§9 draws the done row darker than the card, the current
 * row in an ember tint, and leaves the pending row on the card itself). Returned
 * as a role rather than a colour so the palette stays in `ui/theme.ts` — and the
 * guide's own substitution applies: the design's `#ffffff` pending row becomes
 * the card, because §1 forbids white as a surface.
 */
export type StepRowTone = "well" | "tint" | "plain" | "error";

export function stepRowTone(state: ChatStepState): StepRowTone {
  switch (state) {
    case "done":
      return "well";
    case "current":
      return "tint";
    case "failed":
      return "error";
    default:
      return "plain";
  }
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
  /**
   * The real count of characters she has written for this turn, when the caller
   * has it. It powers §9's own sub-line (`herufi 2,340 zimekamilika`); left out,
   * the sub-line is simply absent — the rail never estimates it.
   */
  writtenChars?: number;
  /** The request is out, the reply has not come back. */
  awaiting: boolean;
  /** The reply is in hand and its bubbles are being staged. Optional so a caller
   *  that has not reached this stage says only what it knows. */
  answering?: boolean;
  /** How the turn ended, when it has. */
  outcome?: "ok" | "stopped" | "failed";
  /**
   * How the reply READS — set by the caller from the reply text via
   * `turnEndingOf()`. Undefined means "not reported": the rail then makes no
   * claim about an answer (it says `Nimejibu`).
   */
  ending?: TurnEnding;
}

/**
 * How does a reply READ — an answer, a question, or neither?
 *
 * Same shape as the web twin (apps/web/lib/assistant/deliverable.ts
 * `classifyTurnEnding`): a reply "answers" only when it carries a printed block
 * of work (a bullet list or a quoted/indented paragraph) or ≥ 20 words of prose
 * that are neither a question to the user nor an offer/acknowledgement. The
 * thresholds are deliberately conservative in the SAFE direction: a false
 * "question" costs a less flattering rail line, while a false "answer" is the
 * lie this function exists to stop.
 *
 * No lookbehind/lookahead assertions — Hermes' regex engine is not the browser's, so
 * fragments are split with an explicit scan.
 */
const OFFER_RE =
  /\b(naweza|unaweza|tunaweza|nitaweza|chagua|gusa|bofya|ni ipi|ipi|which one|what should we do|would you like|want me to|do you want me to|i can|shall i|options?|au (?:kutengeneza|kuandika|kukagua))\b/i;
const QUESTION_START_RE =
  /^(je|niambie|nipe|taja|ni ipi|ipi|unataka|unaweza|unahitaji|ungependa|what|which|how|when|where|who|why|do you|would you|can you|are you|could you|tell me|name|give me)\b/i;
const BLOCK_RE = /(^|\n)\s*(?:[-•*]|\d+\.)\s+\S|["“][^"”\n]{20,}["”]/m;

export function turnEndingOf(reply: string): TurnEnding {
  const text = (reply || "").trim();
  if (!text) return "other";
  if (BLOCK_RE.test(text)) return "answer";

  const parts = text
    .split("\n")
    .flatMap((line) => line.match(/[^.!?…;:]+[.!?…]*/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);

  let contentWords = 0;
  let asks = false;
  for (const part of parts) {
    if (/[?]$/.test(part) || QUESTION_START_RE.test(part) || OFFER_RE.test(part)) {
      asks = true;
      continue;
    }
    contentWords += part.split(/\s+/).filter(Boolean).length;
  }
  if (contentWords >= 20) return "answer";
  return asks ? "question" : "other";
}

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

/**
 * §9's row-1 sub-line, verbatim — `herufi 2,340 zimekamilika`. Built from the
 * count the caller really has; there is no path to this string without one.
 */
export function writtenCountLabel(chars: number): string {
  return `${charCountLabel(chars)} zimekamilika`;
}

/** The file line's sub-text: the real outcome, never a placeholder. */
export function fileDetail(file: { chars?: number; error?: string }): string | undefined {
  if (file.error) return file.error;
  if (typeof file.chars === "number" && file.chars > 0) return charCountLabel(file.chars);
  return undefined;
}

/**
 * Build the rail for one turn.
 *
 * The order is §9's: the file she was handed (only when one was handed over),
 * then `Kuandika CV yako` → `Kuilinganisha na tangazo` → `Kuandaa barua ya
 * maombi`, and the state of each row is derived from the events, so the bar
 * (`railBarProgress`) can never report more than has happened.
 *
 * The `received` row the rail used to open with is gone: the user's own bubble
 * (and its delivery word) already states that the words arrived, and a row for
 * it pushed the design's own third row out of the rail's four-row ceiling.
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
  // The writing really is finished the moment the reply is in hand: `outcome`
  // only lands after its bubbles have been staged.
  const written = done || p.answering === true;

  // 1 · The document the user handed over. Only present when one was, and the
  // only row that carries a count of something real.
  if (p.files !== undefined) {
    steps.push({
      id: "read",
      label: PLAN_LABELS.read,
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

  // 2 · §9 row 1 — `Kuandika CV yako`. Its sub-line is the real count of what
  // she wrote, and only when the caller has one.
  steps.push({
    id: "write",
    label: PLAN_LABELS.write,
    detail: p.writtenChars !== undefined ? writtenCountLabel(p.writtenChars) : undefined,
    state: written ? "done" : dead ? "failed" : p.awaiting ? "current" : "pending",
  });

  // 3 · §9 row 2 — `Kuilinganisha na tangazo`. Present only when there is an
  // advert (or a CV) to match against: a row that names an advert must have one.
  if (p.files !== undefined) {
    steps.push({
      id: "match",
      label: PLAN_LABELS.match,
      state: written ? "done" : "pending",
    });
  }

  // 4 · §9 row 3 — the next deliverable, named while it is a plan. Once the
  // turn is over the wording must match what came back: the rail claims an
  // answer only when the reply carries one (see turnEndingOf).
  steps.push({
    id: "deliver",
    label: done ? ENDED_LABELS[p.ending ?? "other"] : PLAN_LABELS.deliver,
    state: done ? "done" : p.answering ? "current" : "pending",
  });

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
