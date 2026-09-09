/**
 * Conversation-language tracking for the assistant.
 *
 * The UI language (cookie) and the language the user actually TYPES can
 * differ — a Swahili speaker on an English UI. Every AI-facing request and
 * hardcoded assistant string must follow the CONVERSATION language, not the
 * cookie, so the experience is never half-English/half-Swahili.
 *
 * Detection is a lightweight deterministic word-list heuristic (no API
 * calls): count high-precision Swahili vs English function words in a user
 * message. Returns null on a tie / no signal so the caller keeps the current
 * conversation language instead of flipping on noise.
 */

const SW_WORDS = new Set([
  "na", "kwa", "ya", "za", "ni", "si", "hii", "hiyo", "hizo", "hivi", "ile", "zile",
  "nini", "kipi", "jinsi", "vipi", "sasa", "basi", "tafadhali", "je", "wapi", "nani",
  "lini", "kwanini", "kwa nini", "yako", "yangu", "zako", "zangu", "bado", "pia",
  "sana", "kidogo", "habari", "mzuri", "sawa", "hapa", "huko", "kama", "lakini",
  "tengeneza", "unda", "onyesha", "nione", "unaweza", "nataka", "nina", "tunaweza",
  "nifanyie", "nisaidie", "tafuta", "endelea", "andika", "pakua", "weka", "badilisha",
  "ongeza", "ondoa", "sema", "ndio", "hapana", "asante", "karibu", "tayari", "kazi",
  "maelezo", "tangazo", "mahitaji", "majukumu", "kampuni", "wasifu", "muhtasari",
  "uzoefu", "elimu", "stadi", "ujuzi", "lugha", "cheti", "barua", "kadi", "hati",
  "nili", "nilikuwa", "nime", "nimefanya", "nimejifunza", "ninasoma", "nilifanya",
]);

const EN_WORDS = new Set([
  "the", "is", "are", "was", "were", "to", "of", "for", "with", "please", "can",
  "could", "would", "should", "want", "need", "show", "make", "build", "create",
  "what", "how", "do", "does", "you", "your", "my", "me", "we", "they", "he",
  "she", "this", "that", "these", "those", "there", "here", "where", "when",
  "why", "who", "which", "and", "but", "not", "so", "tell", "help", "have",
  "has", "had", "about", "because", "just", "also", "from", "into", "work",
  "job", "experience", "education", "skills", "summary", "company", "letter",
  "resume", "cv", "check", "match", "improve", "write", "create", "make",
]);

/**
 * Detects whether a user message is Swahili or English.
 * @returns "sw" | "en" when there is a clear signal, null on a tie/no signal.
 */
export function detectMessageLang(text: string): "sw" | "en" | null {
  if (!text) return null;
  const words = text.toLowerCase().split(/[^a-z']+/).filter((w) => w.length >= 2);
  if (!words.length) return null;
  let sw = 0;
  let en = 0;
  for (const w of words) {
    if (SW_WORDS.has(w)) sw++;
    if (EN_WORDS.has(w)) en++;
  }
  if (sw === en) return null; // tie or no signal — keep the current language
  return sw > en ? "sw" : "en";
}

/** Normalizes a message for identical-repeat comparison. */
export function normalizeMessage(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * How many previous user messages are identical to `text` (excluding the
 * message being submitted). Used to catch a user hammering the exact same
 * sentence — a human doesn't say the same thing three times.
 */
export function countIdenticalUserMessages(
  messages: ReadonlyArray<{ role: string; content: string; apiContent?: string }>,
  text: string,
): number {
  const norm = normalizeMessage(text);
  if (!norm) return 0;
  let count = 0;
  for (const m of messages) {
    if (m.role !== "user") continue;
    if (normalizeMessage(m.apiContent ?? m.content) === norm) count++;
  }
  return count;
}
