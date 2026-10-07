// T8 · The honest `intelligence unavailable` state — §3.6 of the chatbox
// redesign spec, on the web.
//
// Tonight's QA caught the literal bubble **`AI is not configured.`** in an
// otherwise Swahili conversation: the raw English JSON body of the web's 503
// (`apps/web/lib/api/routes/ai.ts:546` and its siblings) rendered as if Sumaiya
// had said it. That is what this module makes impossible — `safeUnavailableText`
// is the last gate before anything reaches the screen.
//
// The copy here is the same copy as `apps/native/src/components/chat/chat-unavailable.ts`,
// because the two surfaces are one product; `chat-unavailable.test.ts` pins the
// classifier and the voice rules, not the wording for its own sake.
//
// The six rules it obeys (and they are the deliverable):
//   1. first person, about herself;
//   2. never beg, never blame — and rule the wrong cause OUT;
//   3. never dead-end — always a control that works right now;
//   4. never fake success — local work is labelled on the output;
//   5. the user's words are sacred — a retry resends the same turn;
//   6. the composer stays open.

export type UnavailableVariant = "known" | "mid-turn" | "partial";

export interface UnavailableCopy {
  title: { en: string; sw: string };
  why: { en: string; sw: string };
  missing: { en: string; sw: string };
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
    missing: { en: "What's missing: the real rewrite.", sw: "Kinachokosekana: uandishi wa kweli." },
    promise: {
      en: "I'll bring the real version when I'm back. It didn't spoil your text.",
      sw: "Nitaleta toleo la kweli nikirudi. Haijaharibu maandishi yako.",
    },
  },
};

/**
 * The three things that genuinely work with no model, and nothing else. ATS
 * scoring and the keyword diff are deterministic, PDF export is local, OCR runs
 * on tesseract and the job feed is a database read — offering anything that would
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

/** Words that only occur in Swahili copy written for this app. */
const SWAHILI_MARKERS = [
  "si ", "sina ", "sikuweza", "nime", "nina", "huwezi", "hauwezi", "kazi", "kwenye",
  "maandishi", "jaribu", "tena", "hakuna", "hii ", "hilo", "yako", "yangu", "kwa ",
  "na ", "bado", "tafadhali", "sasa", "huduma", "ombi", "jibu", "mtandao",
];

/**
 * True when a string must NOT be shown to a user as-is: a known English server
 * string, an HTTP status line, or an English-looking sentence with no Swahili in
 * it (the backstop for a server message nobody has written yet).
 */
export function isRawServerEnglish(text: unknown): boolean {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (!s) return false;
  const low = s.toLowerCase();

  if (KNOWN_ENGLISH.some((k) => low.includes(k))) return true;
  if (/^(http\s*)?\d{3}\b/.test(low)) return true;
  if (/\b(status|code)\s*\d{3}\b/.test(low)) return true;

  if (SWAHILI_MARKERS.some((m) => ` ${low} `.includes(m))) return false;
  return /^[a-z][a-z0-9 ,.'’!?:;()\-]*$/.test(low) && low.split(/\s+/).length >= 2;
}

/**
 * What to show instead. Never returns raw English — the caller gets Sumaiya's own
 * sentence in the user's language, and the raw text is only used to pick the
 * variant.
 */
export function safeUnavailableText(raw: unknown, sw: boolean, variant: UnavailableVariant = "mid-turn"): string {
  const copy = UNAVAILABLE_COPY[variant];
  if (!isRawServerEnglish(raw)) {
    // Her own (already localised) sentence, or a domain message a caller built.
    return typeof raw === "string" && raw.trim() ? raw.trim() : (sw ? copy.title.sw : copy.title.en);
  }
  return sw ? copy.title.sw : copy.title.en;
}

/**
 * True when a failure is the model being missing rather than the app being
 * broken: a provider switched off / key rotated (503), a quota (429), a gateway
 * that is down (502/504), or a request that never left the browser (0). All of
 * them land on the same card with the same first sentence — the user never sees a
 * status code and never has to know which it was.
 */
export function isModelUnavailableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504 || status === 0;
}
