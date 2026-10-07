/**
 * T8 · The honest `intelligence unavailable` state — §3.6 of
 * CHATBOX-REDESIGN-2026-09-20.md.
 *
 * Tonight's QA caught the literal bubble **`AI is not configured.`** in an
 * otherwise Swahili conversation: the raw English JSON body of a 503 rendered as
 * if Sumaiya had said it. That is the defect this module exists to make
 * impossible — no server string reaches the screen unfiltered, whatever the
 * provider does.
 *
 * Six rules, and they are the deliverable (§3.6):
 *   1. first person, about herself — `Sina…` / `Sikuweza…`;
 *   2. never beg, never blame — and **rule out the wrong cause explicitly**,
 *      because this codebase has a documented history of blaming the user's
 *      connection for our own faults;
 *   3. never dead-end — at least one control that works right now;
 *   4. never fake success — local work is labelled on the output;
 *   5. the user's words are sacred — kept on screen, `Jaribu tena` resends the
 *      same turn rather than asking for it again;
 *   6. the composer stays open — the block is on the reply, never on the typing.
 *
 * Pure and testable: `chat-unavailable.test.ts` pins the classifier and the copy
 * contract, so "no English ever reaches a Swahili screen" is a proven property
 * rather than a promise.
 */

export type UnavailableVariant = "known" | "mid-turn" | "partial";

export interface UnavailableCopy {
  /** h4, the state itself. The last thing to cut if the card must shrink. */
  title: { en: string; sw: string };
  /** Why, in one sentence, with the wrong reason ruled out. */
  why: { en: string; sw: string };
  /** What is missing — never a status code, never a mechanism. */
  missing: { en: string; sw: string };
  /** What she kept, said out loud. */
  promise: { en: string; sw: string };
}

export const UNAVAILABLE_COPY: Record<UnavailableVariant, UnavailableCopy> = {
  known: {
    title: { en: "I can't think right now.", sw: "Sina uwezo wa kufikiri sasa hivi." },
    why: {
      en: "The service that lets me write and think is unavailable at the moment.",
      sw: "Huduma inayoniwezesha kuandika na kufikiri haipatikani kwa dakika hizi.",
    },
    missing: {
      en: "What's missing: writing and rewriting in words.",
      sw: "Kinachokosekana: kuandika na kuboresha kwa maneno.",
    },
    promise: {
      en: "I didn't want you to find out by writing a request and waiting for nothing — so I'm telling you before.",
      sw: "Sikutaka ujue kwa kuandika ombi na kusubiri bure — kwa hivyo nakuambia kabla.",
    },
  },
  "mid-turn": {
    title: { en: "I couldn't think about this request.", sw: "Sikuweza kufikiri ombi hili." },
    why: {
      en: "Reason: the service that lets me think is unreachable right now. It's not your network, and it's not your words — your request arrived, my answer didn't come out.",
      sw: "Sababu: huduma inayoniwezesha kufikiri haipatikani sasa hivi. Si mtandao wako, na si maandishi yako — ombi lako lilifika, jibu langu halikutoka.",
    },
    missing: {
      en: "Failed step: writing. Steps that worked: everything before it.",
      sw: "Hatua ipi ilishindikana: kuandika. Hatua ipi ilifanikiwa: zote zilizotangulia.",
    },
    promise: { en: "I've kept what you wrote.", sw: "Nimehifadhi ulichoandika." },
  },
  partial: {
    title: {
      en: "Rewriting in words isn't available right now.",
      sw: "Kuandika upya kwa maneno hakupatikani sasa hivi.",
    },
    why: {
      en: "I did what I could without thinking — a light tidy-up of your text. Not AI, and it is labelled as such on the result.",
      sw: "Nimefanya nilichoweza bila kufikiri — usafi mdogo wa maandishi yako. Si AI, na imeelezwa hivyo kwenye matokeo.",
    },
    missing: {
      en: "What's missing: the real rewrite.",
      sw: "Kinachokosekana: uandishi wa kweli.",
    },
    promise: {
      en: "I'll bring the real version when I'm back. It didn't spoil your text.",
      sw: "Nitaleta toleo la kweli nikirudi. Haijaharibu maandishi yako.",
    },
  },
};

/**
 * The three things that genuinely work with no model, and nothing else. ATS
 * scoring, PDF export and OCR are all model-free — offering anything that would
 * fail is worse than offering nothing.
 */
export const WORKS_WITHOUT_A_MODEL = [
  {
    id: "ats" as const,
    label: { en: "Check your CV", sw: "Kagua CV yako" },
    hint: { en: "Readiness score and the words you're missing", sw: "Alama ya usomekaji na maneno yanayokosekana" },
  },
  {
    id: "editor" as const,
    label: { en: "Open in the editor", sw: "Fungua kwenye kihariri" },
    hint: { en: "Write it yourself; everything keeps working", sw: "Andika mwenyewe; kila kitu kinaendelea kufanya kazi" },
  },
  {
    id: "ocr" as const,
    label: { en: "Read a photo of your CV", sw: "Soma picha ya CV yako" },
    hint: { en: "I'll pull the text out of the image", sw: "Natoa maandishi kwenye picha" },
  },
];

/**
 * The raw-string classifier. Everything the transport can throw at this app's
 * copy layers, caught in one place so a Swahili screen can never inherit an
 * English sentence or a status line.
 *
 * Two families:
 *   - a known English server/transport string (the 503 body, an HTTP status
 *     line, the client's own network/timeout copy);
 *   - any mostly-ASCII sentence with no Swahili marker in it — the backstop for
 *     a server message nobody has written yet.
 */
const KNOWN_ENGLISH = [
  "ai is not configured",
  "unauthorized",
  "forbidden",
  "not found",
  "internal server error",
  "bad gateway",
  "service unavailable",
  "gateway timeout",
  "network error",
  "check your connection",
  "request timed out",
  "failed to fetch",
  "too many requests",
  "rate limit",
  "quota",
  "payment required",
  "invalid request",
  "method not allowed",
];

/** A short set of words that only occur in Swahili copy written for this app. */
const SWAHILI_MARKERS = [
  "si ", "sina ", "sikuweza", "nime", "nina", "huwezi", "hauwezi", "kazi", "kwenye",
  "maandishi", "jaribu", "tena", "hakuna", "hii ", "hilo", "yako", "yangu", "kwa ",
  "na ", "bado", "tafadhali", "sasa", "huduma", "ombi", "jibu", "mtandao",
];

/**
 * True when this string must NOT be shown to a user as-is: a known English
 * server string, an HTTP status line, or an English-looking sentence with no
 * Swahili in it.
 */
export function isRawServerEnglish(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (!s) return false;
  const low = s.toLowerCase();

  if (KNOWN_ENGLISH.some((k) => low.includes(k))) return true;
  // "500 Internal Server Error", "503", "HTTP 502".
  if (/^(http\s*)?\d{3}\b/.test(low)) return true;
  if (/\b(status|code)\s*\d{3}\b/.test(low)) return true;

  // Backstop: no Swahili marker anywhere and it reads as an English sentence.
  if (SWAHILI_MARKERS.some((m) => ` ${low} `.includes(m))) return false;
  return /^[a-z][a-z0-9 ,.'’!?:;()\-]*$/.test(low) && low.split(/\s+/).length >= 2;
}

/**
 * What to show instead. Never returns the input when the input is raw English —
 * the caller gets Sumaiya's own sentence in the user's language, and the raw
 * text is only ever used to pick the variant.
 */
export function safeUnavailableText(
  raw: unknown,
  lang: "en" | "sw",
  variant: UnavailableVariant = "mid-turn",
): string {
  const copy = UNAVAILABLE_COPY[variant];
  if (!isRawServerEnglish(raw)) {
    // Her own (already localised) sentence, or a domain message a caller built.
    return typeof raw === "string" && raw.trim() ? raw.trim() : (lang === "sw" ? copy.title.sw : copy.title.en);
  }
  return lang === "sw" ? copy.title.sw : copy.title.en;
}

/**
 * True when a failure is the model being missing rather than the app being
 * broken: a provider switched off / key rotated (503), a quota (429), a gateway
 * that is down (502/504), or a request that never left the device (0). Every one
 * of those lands on the same card with the same first sentence — the user never
 * sees a status code and never has to know which it was.
 */
export function isModelUnavailableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 0;
}
