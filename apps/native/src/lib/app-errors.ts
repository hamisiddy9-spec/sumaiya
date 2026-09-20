/**
 * One place that turns a transport failure into something a person can read, in
 * the language they are using.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Five screens were each doing their own version of this:
 *
 *     setError(e?.message || t("Couldn't tailor to this job. Try again.", …))
 *
 * `e.message` on a failed API call is NOT a user-facing sentence. Measured on
 * this codebase, it can be any of:
 *
 *   "Network error. Check your connection."      ← English, hard-coded in
 *                                                  @sumaiya/api-client, shown
 *                                                  verbatim on a Swahili screen
 *   "Request timed out. Check your connection."  ← same
 *   "500 Internal Server Error"                  ← the raw HTTP status line,
 *                                                  used as the message whenever
 *                                                  the server sends no `error`
 *                                                  field (api-client/index.ts)
 *   whatever string the route put in `error`
 *
 * So the same failure read as Swahili on one screen, English on the next, and
 * "500 Internal Server Error" on a third — and the English ones blamed the
 * user's connection for faults that were ours.
 *
 * The fix is to stop reading `message` at all. `status` and `kind` are the
 * fields the transport actually guarantees, and every branch below is written
 * from those.
 *
 * VOICE: the persona speaks in the first person (`Sikuweza…`, not
 * `Imeshindwa…`), matching auth-errors.ts. Copy rules: name the real condition,
 * never accuse the user of a fault that is ours, and do not offer an unqualified
 * "try again" for a failure a retry cannot fix.
 */
import type { Lang } from "./i18n";
import { SUPPORT_EMAIL } from "./app-hosts";

export interface LocalizedText {
  en: string;
  sw: string;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** The shape `@sumaiya/api-client`'s ApiError guarantees. */
export interface TransportError {
  status: number;
  kind?: "timeout" | "network";
}

/**
 * True when this looks like `@sumaiya/api-client`'s ApiError.
 *
 * Duck-typed rather than `instanceof`, deliberately: this module stays free of
 * runtime imports so it can be tested in the node environment, and an error
 * that crossed a package boundary (or was re-wrapped by a retry helper) still
 * has to be recognised.
 *
 * A type predicate, so the fields are narrowed for the caller below — an
 * earlier `): boolean` version type-checked here and then failed to narrow,
 * which is the sort of thing only the real `tsc` catches.
 */
export function isTransportError(err: unknown): err is TransportError {
  return isRecord(err) && typeof err.status === "number";
}

const GENERIC: LocalizedText = {
  en: "Something went wrong on my side. Try again — and if it keeps happening, tell me at " + SUPPORT_EMAIL + ".",
  sw: "Kuna hitilafu upande wangu. Jaribu tena — na kama likiendelea, niambie kwa " + SUPPORT_EMAIL + ".",
};

/**
 * @param err      Anything thrown by an API call.
 * @param lang     Which language to answer in.
 * @param fallback Used when `err` is NOT a transport error — e.g. a domain error
 *                 a caller constructed deliberately. Omit it and an
 *                 unrecognised throw gets the honest generic, never its own
 *                 `message`, because an unrecognised `message` is exactly the
 *                 raw string we are here to stop showing.
 */
export function friendlyApiError(
  err: unknown,
  lang: Lang,
  fallback?: LocalizedText,
): string {
  const sw = lang === "sw";
  const pick = (t: LocalizedText) => (sw ? t.sw : t.en);

  if (!isTransportError(err)) {
    return pick(fallback ?? GENERIC);
  }

  const { status, kind } = err;

  // ---- never left the device, or we stopped waiting ----------------------
  if (status === 0) {
    // `timeout` means WE aborted locally: the request went out and the reply
    // did not come back in time. Saying "check your connection" would be a
    // guess and often a lie, and it invites a retry that may duplicate work
    // the server is still doing.
    if (kind === "timeout") {
      return pick({
        en: "This is taking longer than usual. It may still be finishing — check again in a moment.",
        sw: "Hii inachukua muda mrefu kuliko kawaida. Huenda bado inaendelea — angalia tena baada ya muda mfupi.",
      });
    }
    return pick({
      en: "I couldn't reach Sumaiya. Check your internet connection, then try again.",
      sw: "Sikuweza kufikia Sumaiya. Angalia mtandao wako, kisha ujaribu tena.",
    });
  }

  if (status === 401) {
    return pick({
      en: "Your session has expired — sign in again.",
      sw: "Kipindi chako kimeisha — ingia tena.",
    });
  }

  if (status === 403) {
    return pick({
      en: "You don't have access to this.",
      sw: "Hauna ruhusa ya kitu hiki.",
    });
  }

  if (status === 404) {
    return pick({
      en: "That isn't here any more.",
      sw: "Kitu hicho hakipo tena.",
    });
  }

  if (status === 413) {
    return pick({
      en: "That file is too large. Try a smaller one.",
      sw: "Faili hilo ni kubwa mno. Jaribu dogo zaidi.",
    });
  }

  if (status === 429) {
    return pick({
      en: "You've done that a lot just now. Wait a minute, then try again.",
      sw: "Umefanya hivyo mara nyingi sasa hivi. Subiri dakika moja, kisha ujaribu tena.",
    });
  }

  // Transient server-side unavailability: a retry genuinely can work, so
  // offering one is honest here (unlike the 500 branch below).
  if (status === 502 || status === 503 || status === 504) {
    return pick({
      en: "I'm busy right now. Try again in a moment.",
      sw: "Nina shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.",
    });
  }

  // A 500 means a bug on our side, not a flake. "Try again" is still offered
  // because it sometimes is one, but it is paired with a way to tell us —
  // and there is no `message`, no status line, and no stack in what the user
  // reads.
  if (status >= 500) {
    return pick(GENERIC);
  }

  return pick(GENERIC);
}
