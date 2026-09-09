/**
 * Verbatim-repeat guard for Sumaiya's replies (P1, issue #259).
 *
 * The model prompt already says "never repeat the exact same sentence", but
 * that is advisory — low temperatures and strong instructions still produce
 * near-identical replies across turns (same question → same phrasing).
 * This is a deterministic SERVER-SIDE backstop: before a reply is returned,
 * compare it (normalized) against the assistant's own recent replies in the
 * thread. If it's too similar, swap in a varied variant so the user never
 * sees the same sentence twice.
 */

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
 * already gave. These are SHORT, human, and move the conversation forward
 * (never a dead-end) — they acknowledge, vary, and re-offer next steps.
 */
export const REPEAT_VARIANTS: VariantSet = {
  sw: [
    "Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili — tuchukue hatua inayofuata: naweza kukagulia CV yako kwenye ATS, kuilinganisha na kazi unayoitaka, au kutengeneza hati mpya. Ni ipi?",
    "Sawa, nimesikia! Ili tusirudie — tuende mbele: chagua mojawapo — kagua ATS, linganisha na kazi, au tengeneza CV/barua mpya. Niko tayari kukusaidia.",
    "Umekwisha niambia hivyo, asante! Hebu tuende hatua inayofuata — gusa hapa chini: ATS check, linganisha kazi, au tengeneza hati. Tutafanya nini kwanza?",
  ],
  en: [
    "Got it 😊 We talked about something similar recently — let's move forward: I can run an ATS check on your CV, match it to a job, or build a new document. Which one?",
    "Okay, I hear you! To avoid going in circles — pick one: ATS check, job match, or build a new CV/letter. I'm ready when you are.",
    "You've told me that — thanks! Let's take the next step: tap below for an ATS check, job match, or new document. What should we do first?",
  ],
};

/** Pick a variant, rotating by an index so even the ack varies per turn. */
export function pickRepeatVariant(lang: "sw" | "en", rotation: number): string {
  const set = lang === "sw" ? REPEAT_VARIANTS.sw : REPEAT_VARIANTS.en;
  return set[rotation % set.length];
}

/**
 * Guard: given the fresh reply and the assistant's recent replies in the
 * thread, return the reply to actually send. If the fresh reply is a verbatim
 * repeat of an earlier one, replace it with a rotated variant (keeping the
 * conversation moving). Otherwise pass the fresh reply through.
 */
export function guardReplyAgainstRepeat(
  freshReply: string,
  priorAssistantReplies: ReadonlyArray<string>,
  lang: "sw" | "en",
  rotation: number,
): string {
  const norm = normalizeReply(freshReply);
  if (!norm) return freshReply;
  for (const prior of priorAssistantReplies) {
    if (!prior) continue;
    const sim = replySimilarity(freshReply, prior);
    if (sim >= REPEAT_SIMILARITY_THRESHOLD) {
      return pickRepeatVariant(lang, rotation);
    }
  }
  return freshReply;
}
