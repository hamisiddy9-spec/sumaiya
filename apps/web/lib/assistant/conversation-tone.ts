/**
 * Conservative tone detection for the assistant — formal vs. casual, nothing
 * more. Sumaiya's default voice (lib/api/routes/ai.ts persona prompt) is
 * already warm and casual ("a friend who knows their stuff"); this module
 * only detects when a user is clearly writing FORMALLY, so the system prompt
 * can dial the register up to match them. It never tries to detect slang,
 * age, or any other register — that scope is deliberately deferred.
 *
 * Same shape as conversation-lang.ts: deterministic word-list heuristic, no
 * AI call, returns null on no clear signal so the default casual-warm voice
 * is untouched.
 */

const FORMAL_SW_MARKERS = [
  "shikamoo", "naomba", "tafadhali sana", "ninaomba", "kwa heshima",
  "ndugu yangu", "mheshimiwa", "bwana", "bibi", "mzee", "ninaamini",
  "kwa unyenyekevu", "nawasilisha", "napenda kuuliza", "kwa niaba",
];

const CASUAL_SW_MARKERS = [
  "mambo", "niaje", "vipi", "poa", "sawa kabisa", "eeh", "aisee", "bro",
  "kaka", "dada yangu", "sasa vipi", "za kwako", "mzenga", "fiti",
];

const FORMAL_EN_MARKERS = [
  "dear sir", "dear madam", "to whom it may concern", "i would like to",
  "kindly", "i am writing to", "yours sincerely", "yours faithfully",
  "i wish to", "please be advised", "i would appreciate", "respectfully",
  "on behalf of", "i am reaching out",
];

const CASUAL_EN_MARKERS = [
  "hey", "yo", "sup", "gonna", "wanna", "lol", "lemme", "kinda", "u",
  "ur", "pls", "thx", "gimme",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word/phrase matches only — "u" must not match inside "you". */
function countMarkers(text: string, markers: string[]): number {
  let n = 0;
  for (const m of markers) {
    const re = new RegExp(`\\b${escapeRegex(m)}\\b`);
    if (re.test(text)) n++;
  }
  return n;
}

/**
 * Detects register from a single message: "formal" | "casual" | null (no
 * clear signal). Conservative — a tie or no marker hit returns null, never
 * a guess.
 */
export function detectMessageTone(text: string): "formal" | "casual" | null {
  if (!text) return null;
  const t = ` ${text.toLowerCase()} `;
  const formal = countMarkers(t, FORMAL_SW_MARKERS) + countMarkers(t, FORMAL_EN_MARKERS);
  const casual = countMarkers(t, CASUAL_SW_MARKERS) + countMarkers(t, CASUAL_EN_MARKERS);
  if (formal === casual) return null;
  return formal > casual ? "formal" : "casual";
}

/**
 * Thread-level register: looks at the last few USER messages (most recent
 * weighted higher by simply being counted the same as the others but
 * scanned last-first) and returns the majority read, or null on no signal
 * or a tie. Only ever asked to distinguish formal vs. casual — nothing else.
 */
export function detectConversationTone(
  messages: ReadonlyArray<{ role: string; content: string; apiContent?: string }>,
  lookback = 6,
): "formal" | "casual" | null {
  const userMsgs = messages.filter((m) => m.role === "user").slice(-lookback);
  if (!userMsgs.length) return null;
  let formal = 0;
  let casual = 0;
  for (const m of userMsgs) {
    const tone = detectMessageTone(m.apiContent ?? m.content);
    if (tone === "formal") formal++;
    else if (tone === "casual") casual++;
  }
  if (formal === casual) return null;
  return formal > casual ? "formal" : "casual";
}
