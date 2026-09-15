/**
 * What to tell someone when their CV list fails to load.
 *
 * The screen used to say "Your CVs are safe on your account — we just couldn't
 * reach the server" for EVERY failure, including a 401. That is a lie twice
 * over: the app HAD reached the server, and the session was refused. The lie
 * was expensive — the user pressed Try again against a request that could never
 * succeed, and the real problem (an expired session) stayed invisible.
 *
 * Classification is a pure function over the thrown value so it is testable
 * without mocking fetch, and so every surface that shows this failure can show
 * the same truth: Home, the CV list and the ATS checker.
 */

export type CvErrorKind = "unauthorized" | "server" | "timeout" | "offline" | "unknown";

/** The shape `ApiError` carries, read structurally so this file needs no imports. */
interface ErrorLike {
  status?: unknown;
  kind?: unknown;
}

export function classifyCvError(error: unknown): CvErrorKind {
  const { status, kind } = (error ?? {}) as ErrorLike;

  // Checked first: a 401 is the one case that must never be reported as a
  // connection problem, and `kind` (set by the api-client after a failed
  // refresh) is stronger evidence than a status.
  if (kind === "unauthorized" || status === 401 || status === 403) return "unauthorized";

  if (typeof status === "number" && status >= 500) return "server";
  if (kind === "timeout") return "timeout";
  if (kind === "network" || status === 0) return "offline";
  return "unknown";
}

export interface Bilingual {
  en: string;
  sw: string;
}

export interface CvErrorCopy {
  title: Bilingual;
  body: Bilingual;
  action: Bilingual;
  /** What the action must DO — not just what it says. */
  actionKind: "retry" | "signin";
}

const COPY: Record<CvErrorKind, CvErrorCopy> = {
  unauthorized: {
    title: { en: "Sign in again", sw: "Ingia tena" },
    body: {
      en: "Your session has expired, so Sumaiya couldn't open your CVs. Sign in again and they'll be here.",
      sw: "Kipindi chako kimeisha, hivyo Sumaiya haikuweza kufungua CV zako. Ingia tena na zitakuwa hapa.",
    },
    action: { en: "Sign in", sw: "Ingia" },
    actionKind: "signin",
  },
  server: {
    title: { en: "Sumaiya is having trouble", sw: "Sumaiya ina hitilafu" },
    body: {
      en: "This is on our side, not your account. Try again in a minute.",
      sw: "Tatizo liko upande wetu, si kwenye akaunti yako. Jaribu tena baada ya dakika moja.",
    },
    action: { en: "Try again", sw: "Jaribu tena" },
    actionKind: "retry",
  },
  timeout: {
    title: { en: "That took too long", sw: "Imechukua muda mrefu" },
    body: {
      en: "The server didn't answer in time. Check your connection and try again.",
      sw: "Server haikujibu kwa wakati. Angalia muunganisho wako na ujaribu tena.",
    },
    action: { en: "Try again", sw: "Jaribu tena" },
    actionKind: "retry",
  },
  offline: {
    title: { en: "Couldn't reach the server", sw: "Imeshindwa kufikia server" },
    body: {
      en: "Your CVs are safe on your account — we just couldn't reach the server.",
      sw: "CV zako ziko salama kwenye akaunti yako — tumeshindwa kufikia server.",
    },
    action: { en: "Try again", sw: "Jaribu tena" },
    actionKind: "retry",
  },
  unknown: {
    title: { en: "Couldn't load your CVs", sw: "Imeshindwa kupakia CV zako" },
    body: {
      en: "Something went wrong while loading them. Try again.",
      sw: "Kuna kitu kimeenda vibaya wakati wa kupakia. Jaribu tena.",
    },
    action: { en: "Try again", sw: "Jaribu tena" },
    actionKind: "retry",
  },
};

export function cvErrorCopy(kind: CvErrorKind): CvErrorCopy {
  return COPY[kind];
}
