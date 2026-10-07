/**
 * Verbatim-repeat guard for Sumaiya's replies (P1, issue #259).
 *
 * The model prompt already says "never repeat the exact same sentence", but
 * that is advisory — low temperatures and strong instructions still produce
 * near-identical replies across turns (same question → same phrasing).
 * This is a deterministic SERVER-SIDE backstop: before a reply is returned,
 * compare it (normalized) against the assistant's own recent replies in the
 * thread. If it's too similar, swap in a varied variant so the user never
 * sees the same sentence twice — UNLESS the user asked for a concrete
 * deliverable or the reply already contains one (see guardReplyAgainstRepeat).
 */

import { replyCarriesDeliverable, requestedDeliverable } from "./deliverable";

/** Normalize a string for similarity comparison: lowercase, collapse junk. */
export function normalizeReply(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Word-level similarity in [0,1] — 1 = the same words, in any order.
 *
 * Two signals, combined by max:
 *  - bagCover: order-insensitive multiset containment — how much of the
 *    shorter reply's words (with multiplicity) appear in the longer one.
 *    This is the PRIMARY signal: a user who hears "Kwanza, niambie kazi
 *    gani unaitafuta…" then "Niambie kwanza kazi gani unayoitafuta…" has
 *    heard the same sentence twice, even though the word ORDER changed.
 *  - orderCover: DP longest-common-subsequence coverage — the order-sensitive
 *    check, for the case where the words differ but the sequence matches.
 *
 * Why not the old greedy subsequence: a single early word-order difference
 * ("kwanza niambie" vs "niambie kwanza") pushed the scan pointer to the end
 * of the longer reply and every later word failed — two replies sharing
 * 22/23 words scored 0.087 (live repro, R1 QA 2026-08). The DP LCS has no
 * such poisoning; the bag signal is order-insensitive by construction.
 */
export function replySimilarity(a: string, b: string): number {
  const na = normalizeReply(a).split(/\s+/).filter(Boolean);
  const nb = normalizeReply(b).split(/\s+/).filter(Boolean);
  if (!na.length || !nb.length) return 0;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;

  // Order-insensitive bag containment (counts multiplicity — "cv cv" needs
  // two occurrences in the other reply to count twice).
  const bag = new Map<string, number>();
  for (const w of longer) bag.set(w, (bag.get(w) ?? 0) + 1);
  let bagHit = 0;
  for (const w of shorter) {
    const c = bag.get(w) ?? 0;
    if (c > 0) {
      bagHit++;
      bag.set(w, c - 1);
    }
  }
  const bagCover = Math.max(bagHit / shorter.length, bagHit / longer.length);

  // Order-sensitive DP longest common subsequence (replies are short — O(n·m)
  // is cheap and cannot poison like the old single-pass scan).
  const lcsLen = lcsLength(na, nb);
  const orderCover = Math.max(lcsLen / na.length, lcsLen / nb.length);

  return Math.max(bagCover, orderCover);
}

/** Longest common subsequence length via DP (order-sensitive). */
function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/** Confidence threshold above which we treat two replies as the same message. */
export const REPEAT_SIMILARITY_THRESHOLD = 0.72;

export interface VariantSet {
  sw: string[];
  en: string[];
}

/**
 * The varied ack used when Sumaiya's fresh reply is too close to one she
 * already gave. These are SHORT and human, and each one moves the conversation
 * forward WITHOUT offering a menu of other actions.
 *
 * Two rules these lines must obey, both learned from the live defect of
 * 2026-09-21 (native 1.6.25):
 *
 *   1. NEVER a menu. The old set ('…gusa hapa chini: ukaguzi wa CV, linganisha
 *      kazi, au tengeneza hati. Tutafanya nini kwanza?') REPLACED the model's
 *      reply with a list of things the user had not asked for — so a request
 *      for a CV summary came back as a menu. `guardReplyAgainstRepeat` now
 *      refuses to swap at all when the user asked for a concrete deliverable,
 *      and these lines must not reintroduce the shape.
 *   2. NEVER claim the user repeated themselves. The guard only knows two
 *      of SUMAIYA'S replies were similar — the user may have said something
 *      new each time. "Umekwisha niambia hivyo" asserted a fact about the user
 *      that this module does not know, and it shipped.
 */
export const REPEAT_VARIANTS: VariantSet = {
  sw: [
    "Nimekusikia 😊 Tuendelee hapa — niambie kile kinachokufaa sasa.",
    "Sawa. Tuchukue hatua moja kwa wakati: nini kifuatacho kwako?",
    "Nimekupata. Hebu tusonge mbele — unataka tuanze wapi?",
  ],
  en: [
    "I hear you 😊 Let's keep going — tell me what you need now.",
    "Okay. One step at a time: what comes next for you?",
    "Got it. Let's move forward — where would you like to start?",
  ],
};

/** Pick a variant, rotating by an index so even the ack varies per turn. */
export function pickRepeatVariant(lang: "sw" | "en", rotation: number): string {
  const set = lang === "sw" ? REPEAT_VARIANTS.sw : REPEAT_VARIANTS.en;
  return set[rotation % set.length];
}

/**
 * What the caller knows about the turn beyond "these two replies look alike".
 * Both fields are optional so existing callers keep working; when either says a
 * concrete deliverable was asked for, the guard abstains (see below).
 */
export interface RepeatGuardContext {
  /** The user's latest message, verbatim. */
  latestUserMessage?: string;
  /** Explicit override when the caller already classified the request. */
  deliverableRequested?: boolean;
}

/**
 * Guard: given the fresh reply and the assistant's recent replies in the
 * thread, return the reply to actually send.
 *
 * It replaces a reply with a rotated variant ONLY when all of the following
 * hold — the abstain rules exist because the guard once threw away real work:
 *
 *   - the user did NOT ask for a concrete deliverable this turn. A menu of
 *     other actions is never an acceptable answer to "niandikie muhtasari wa
 *     CV yangu" — this is the live defect of 2026-09-21, where the model's
 *     fresh reply was swapped for '…gusa hapa chini: ukaguzi wa CV, linganisha
 *     kazi, au tengeneza hati' and the summary never appeared.
 *   - the fresh reply does NOT itself carry a written deliverable. Swapping a
 *     real summary for a variation line destroys the only thing the user
 *     asked for; a repeated (honest) answer beats a menu.
 *   - and the reply really is ≥ REPEAT_SIMILARITY_THRESHOLD like an earlier one.
 */
export function guardReplyAgainstRepeat(
  freshReply: string,
  priorAssistantReplies: ReadonlyArray<string>,
  lang: "sw" | "en",
  rotation: number,
  ctx?: RepeatGuardContext,
): string {
  const norm = normalizeReply(freshReply);
  if (!norm) return freshReply;

  // Rule 1: the user asked for a deliverable — never answer with a menu.
  const deliverableAsked =
    ctx?.deliverableRequested === true ||
    (!!ctx?.latestUserMessage && requestedDeliverable(ctx.latestUserMessage) !== null);
  if (deliverableAsked) return freshReply;

  // Rule 2: the reply already contains the work — never overwrite it. (For a
  // reply that asks a question and delivers nothing, the variant is an honest
  // improvement; for one that carries a summary, it would erase it.)
  if (replyCarriesDeliverable(freshReply)) return freshReply;

  for (const prior of priorAssistantReplies) {
    if (!prior) continue;
    const sim = replySimilarity(freshReply, prior);
    if (sim >= REPEAT_SIMILARITY_THRESHOLD) {
      return pickRepeatVariant(lang, rotation);
    }
  }
  return freshReply;
}
