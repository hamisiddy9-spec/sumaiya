/**
 * Error coercion helpers for chat surfaces.
 *
 * The iron rule: NEVER pass a non-string into a message card / error state —
 * an Error object or a `{ error: {...} }` payload would render
 * "[object Object]" to the user. Every caught value and server `error` field
 * must flow through `errorMsg` (or `s` when only a string is acceptable).
 */

/** String-or-empty: objects, nulls and numbers become "". */
export const s = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Known English server errors, in Swahili.
 *
 * WHY THIS TABLE EXISTS
 * `errorMsg` returns the server's own `error` string verbatim, which is right —
 * the server knows what went wrong. But the API's error strings are written in
 * English (lib/api/routes/ai.ts and friends), so a Swahili conversation rendered
 * a raw English sentence in the assistant's bubble: a real user reported
 * "AI is not configured." appearing mid-chat in an otherwise Swahili thread
 * (docs/QA-WEB-JOURNEYS-2026-09-20.md D3). The screen that says the same fact in
 * Swahili already existed on /snap ("Uandishi wa AI haupatikani kwa sasa…"), so
 * the strings were never missing — the chat surfaces simply never translated
 * what the API handed them.
 *
 * Keys are the EXACT server strings, lowercased and trimmed. An unknown string
 * is returned unchanged (never silently swallowed): a new server error shows up
 * untranslated, which is visible, instead of being replaced by a vague fallback
 * that hides what went wrong.
 */
export const SERVER_ERROR_SW: Record<string, string> = {
  // lib/api/routes/{ai,mobile,whatsapp}.ts — the provider is not configured.
  "ai is not configured.": "Uandishi wa AI haupatikani kwa sasa. Jaribu tena baada ya muda mfupi.",
  unauthorized: "Kikao chako kimeisha. Ingia tena ili kuendelea.",
  "you've reached the free limit. sign up free to keep going.":
    "Umefikia kikomo cha matumizi ya bure. Jisajili bure ili kuendelea.",
  "couldn't tailor the summary right now. please try again.":
    "Sikuweza kulenga muhtasari kwa sasa. Jaribu tena.",
  "couldn't tailor the cv right now. please try again.":
    "Sikuweza kulenga CV yako kwa sasa. Jaribu tena.",
  "couldn't generate the letter right now. please try again.":
    "Sikuweza kuandika barua kwa sasa. Jaribu tena.",
  "couldn't generate a summary right now. please try again.":
    "Sikuweza kuandika muhtasari kwa sasa. Jaribu tena.",
  "couldn't build the cv. please try again.": "Sikuweza kutengeneza CV yako. Jaribu tena.",
  "couldn't build the document. please try again.": "Sikuweza kutengeneza hati hii. Jaribu tena.",
  "i ran out of time. please try again.": "Muda uliisha kabla ya kumaliza. Jaribu tena.",
  "i ran out of time reading that cv. please try again.":
    "Muda uliisha kabla ya kumaliza kusoma CV hiyo. Jaribu tena.",
  "couldn't structure this cv — try a text-based (not scanned) pdf.":
    "Sikuweza kusoma CV hii — jaribu PDF yenye maandishi, si ya picha.",
  "couldn't reach the assistant. please try again.": "Sikuweza kupata jibu la Sumaiya. Jaribu tena.",
  "the assistant hiccuped. please try again.": "Sumaiya amepata hitilafu ndogo. Jaribu tena.",
  "couldn't reach the coach. please try again.": "Sikuweza kupata mwongozo. Jaribu tena.",
  "the coach hiccuped. please try again.": "Kuna hitilafu ndogo. Jaribu tena.",
  "couldn't read that link. try pasting the job text instead.":
    "Sikuweza kusoma kiungo hicho. Bandika maandishi ya kazi badala yake.",
  "that doesn't look like a valid link.": "Hicho hakionekani kama kiungo sahihi.",
  "only http/https links are supported.": "Viungo vya http/https pekee vinatumika.",
  "that link can't be read.": "Kiungo hicho hakiwezi kusomwa.",
  "no career profile yet. build one from your cv first.":
    "Bado huna wasifu wa kazi. Uunde kutoka kwenye CV yako kwanza.",
};

/** The Swahili twin of a known server error, or the string itself when unknown. */
export function translateServerError(raw: string): string {
  const key = raw.trim().toLowerCase();
  const hit = SERVER_ERROR_SW[key];
  if (hit) return hit;
  // A provider-off sentence always means the same thing, whatever punctuation
  // a route adds around it — match it by its stem.
  if (key.includes("ai is not configured")) return SERVER_ERROR_SW["ai is not configured."];
  return raw;
}

/**
 * Coerce a caught value / server error into a safe message string.
 * Priority: Error.message → raw string → object.message → object.error →
 * localized fallback. Always returns a non-empty displayable string.
 * When `sw` is true, a known English server error is returned in Swahili.
 */
export const errorMsg = (e: unknown, sw: boolean, fallback: string): string => {
  if (e instanceof Error && e.message) return sw ? translateServerError(e.message) : e.message;
  if (typeof e === "string" && e.trim()) return sw ? translateServerError(e) : e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return sw ? translateServerError(m) : m;
    const err = (e as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return sw ? translateServerError(err) : err;
  }
  return fallback;
};
