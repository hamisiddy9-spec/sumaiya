/**
 * Deliverable detection — "did the user ask for a concrete thing to be WRITTEN,
 * and does the reply actually contain it?"
 *
 * Why this exists (measured on a real device, 2026-09-21, native 1.6.25):
 *
 *   user : "Nisaidie kuandika muhtasari mfupi wa CV ya huduma kwa mteja."
 *   reply: "Nimekuelewa 😊 Hivi karibuni tumezungumza jambo kama hili —
 *           tuchukue hatua inayofuata: naweza kukagua CV yako, kuilinganisha
 *           na kazi unayoitaka, au kutengeneza hati mpya. Ni ipi?"
 *
 * The request was acknowledged and then answered with a MENU of other actions.
 * The CV summary — the one concrete deliverable asked for — never appeared.
 *
 * Two separate mechanisms can produce that shape, and both are fixed against
 * THIS module rather than against the one string that was caught:
 *
 *   1. the deterministic router (intent.ts) treats any CV/job mention as
 *      doc-intake and tells the model to GATHER details first, so the reply for
 *      a "write me X" request becomes a question; and
 *   2. the verbatim-repeat guard (repeat-guard.ts) swaps a repeated reply for a
 *      canned line whose whole content is a menu — which destroys a real
 *      deliverable that the model had already written.
 *
 * So the rules here are deliberately generic over deliverable types (summary,
 * cover letter, letter, message, about-me, experience bullets, skills list) and
 * are used to answer exactly two questions:
 *
 *   requestedDeliverable(text)      → did the user ask for one of them?
 *   replyCarriesDeliverable(reply)  → is one actually written in this reply?
 *
 * Both are pure and unit-testable; nothing here calls a model.
 *
 * Design note on the thresholds: `replyCarriesDeliverable` is used as a guard
 * against DESTRUCTION (never overwrite a reply that carries real work), so a
 * false NEGATIVE is safe — the caller still refuses to swap when the user asked
 * for a deliverable. A false POSITIVE only means a repeated reply is left as it
 * is, which is also fine: an honest repeated answer beats a menu.
 */

export type DeliverableKind =
  | "summary"
  | "cover-letter"
  | "letter"
  | "message"
  | "about-me"
  | "experience"
  | "skills";

/** Lowercase + collapse whitespace, keeping punctuation we test for. */
function norm(s: string): string {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * "Write this for me" intent. Swahili verb roots are matched with a wildcard
 * prefix/suffix so every inflection counts (andika / kuandika / niandikie /
 * anaandika). `nisaidie` / `saidia` count on their own: in this market
 * "nisaidie kuandika X" is THE way a user asks for a written thing.
 */
const WRITE_INTENT_RE =
  /\b(\w*andik\w*|\w*tengene\w*|\w*jeng\w*|\w*tung\w*|\w*ongez\w*|\w*boresh\w*|\w*badilish\w*|\w*nyoosh\w*|nisaidie|msaidie|saidia|kuandaa|draft|write|rewrite|compose|put together|prepare|help me)\b/i;

interface DeliverableRule {
  kind: DeliverableKind;
  re: RegExp;
  /**
   * True when the noun is common enough that a passing mention must not count —
   * "barua" alone can be a letter someone received; "message" alone can be a
   * message they got. Those need a write verb in the same message. A CV
   * `muhtasari` or a `cover letter`, by contrast, is never mentioned by
   * accident in this product.
   */
  needsVerb?: boolean;
}

const RULES: DeliverableRule[] = [
  {
    kind: "summary",
    re: /\b(muhtasari|summar(?:y|ies)|professional summary|cv summary|profile summary)\b/i,
  },
  {
    kind: "cover-letter",
    re: /\b(barua\s+ya\s+maombi|cover\s*letter|barua\s+ya\s+kazi)\b/i,
  },
  { kind: "letter", re: /\b(barua|letter)\b/i, needsVerb: true },
  {
    kind: "message",
    re: /\b(ujumbe|message|sms|whatsapp)\b/i,
    needsVerb: true,
  },
  {
    kind: "about-me",
    re: /\b(kujitambulisha|kujieleza|kuhusu mimi|about me|about myself|kuhusu mimi mwenyewe)\b/i,
    needsVerb: true,
  },
  {
    kind: "experience",
    re: /\b(uzoefu|experience|work history|kazi (?:nilizofanya|zangu))\b/i,
    needsVerb: true,
  },
  { kind: "skills", re: /\b(ujuzi|skills?)\b/i, needsVerb: true },
];

/**
 * The concrete deliverable the message asks for, or null when it asks for none.
 * Returns the FIRST match in RULES order (summary before letter, etc.), which is
 * the same precedence the router uses for doc kinds.
 */
export function requestedDeliverable(text: string): DeliverableKind | null {
  const t = norm(text);
  if (!t) return null;
  const writeIntent = WRITE_INTENT_RE.test(t);
  for (const rule of RULES) {
    if (rule.re.test(t) && (!rule.needsVerb || writeIntent)) return rule.kind;
  }
  return null;
}

// ── Does the reply actually contain an answer? ────────────────────────────────

/**
 * A MENU / offer of things she could do — never itself a deliverable.
 * Covers the measured offenders: "gusa hapa chini: ukaguzi wa CV, linganisha
 * kazi, au tengeneza hati" and "naweza kukagua CV yako, kuilinganisha na kazi
 * unayoitaka, au kutengeneza hati mpya."
 */
const OFFER_RE =
  /\b(naweza|unaweza|tunaweza|nitaweza|chagua|gusa|bofya|ni ipi|ipi\b|which one|what should we do|would you like|want me to|do you want me to|i can|shall i|options?|au (?:kutengeneza|kuandika|kukagua))\b/i;

/** A question aimed at the user (so the turn ends in a question, not an answer). */
const QUESTION_START_RE =
  /^(je|niambie|nipe|taja|ni ipi|ipi|unataka|unaweza|unahitaji|ungependa|what|which|how|when|where|who|why|do you|would you|can you|are you|could you|tell me|name|give me)\b/i;

/** A printed block of work: quoted text, a bullet, or a labelled section. */
const BLOCK_RE = /(^|\n)\s*(?:[-•*]|\d+\.)\s+\S|["“][^"”\n]{20,}["”]/m;

/** Word count of a fragment. */
function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * Split a reply into sentence-ish fragments. Punctuation AND dashes/newlines
 * split, because the menu shape packs several offers behind one em dash.
 */
function fragments(reply: string): string[] {
  return (reply || "")
    .split(/(?<=[.!?…])\s+|\n+|\s+[—–-]\s+|[;:]\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * True when the reply's only content is questions/offers — i.e. she did not
 * deliver anything this turn, she asked or offered. This is the shape that must
 * NEVER be reported as "here's your answer".
 */
export function replyIsQuestionOrOfferOnly(reply: string): boolean {
  const parts = fragments(reply);
  if (!parts.length) return false;
  let contentWords = 0;
  for (const part of parts) {
    if (/[?]$/.test(part) || QUESTION_START_RE.test(part)) continue;
    if (OFFER_RE.test(part)) continue;
    contentWords += words(part);
  }
  return contentWords < 20;
}

/**
 * True when the reply demonstrably contains a written deliverable: a printed
 * block (quote/bullet) or at least 20 words of prose that is neither a question
 * to the user nor an offer of what she could do.
 */
export function replyCarriesDeliverable(reply: string): boolean {
  if (BLOCK_RE.test(reply || "")) return true;
  return !replyIsQuestionOrOfferOnly(reply);
}

/** How a finished turn actually ended — what the progress rail may claim. */
export type TurnEnding = "answer" | "question" | "other";

/**
 * Classify a completed turn's reply for the UI:
 *   answer   — a deliverable/answer is IN the reply ("here is your answer" is true)
 *   question — the reply asks the user something and delivers nothing
 *   other    — a plain acknowledgement: neither an answer nor a question
 */
export function classifyTurnEnding(reply: string): TurnEnding {
  const text = (reply || "").trim();
  if (!text) return "other";
  if (replyCarriesDeliverable(text)) return "answer";
  const asks = fragments(text).some(
    (f) => /[?]$/.test(f) || QUESTION_START_RE.test(f) || OFFER_RE.test(f),
  );
  return asks ? "question" : "other";
}
