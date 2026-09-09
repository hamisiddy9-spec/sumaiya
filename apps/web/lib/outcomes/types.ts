// Outcome event types — the feedback flywheel's vocabulary (PR-1).
//
// DESIGN RULE: payloads carry NO raw PII by construction. Only numbers,
// counts, statuses, tool ids and category strings. The userId is never stored
// raw — only a SHA-256 hash (lib/outcomes/events.ts hashUserId). If a future
// event needs a field that could identify a person, it does NOT belong here:
// aggregate it away first.

/** Event type registry — every seam writes one of these. */
export type OutcomeEventType =
  | "tailor.lift" // ATS before vs after a cv.tailor apply — did it actually go up?
  | "match.scored" // A matched job's real score (targeted-cv / jobs.match)
  | "application.created" // An application row was created (carries matchScore)
  | "application.status" // Lifecycle transition (draft→applied→interviewing→offer…)
  | "signal.shown" // A nudge was sent to the user (type + trigger)
  | "tool.executed" // A resolving tool actually ran (the nudge's payoff)
  | "confirmation.resolved" // Trust loop: accept vs reject vs nothing
  // Snap-to-Apply funnel (D8): one event per step of the snap flow.
  | "snap.started" // /snap page mounted (client-reported)
  | "snap.ocr_used" // The photo/OCR path was used (client-reported)
  | "snap.jd_detected" // Pasted text passed the looksLikeJobDescription guard
  | "snap.tailored_ok" // Tailored results rendered (carries the honest ATS lift)
  | "snap.saved" // Tailored CV saved (authed write or guest stash)
  // WS-10: product-value events — recoverable versions + score generation.
  | "version.created" // A document version snapshot was created (AI auto-snapshot or manual)
  | "score.generated"; // A Sumaiya Score composite was computed (before/after on tailor)

/** Tailor lift — "did tailoring actually improve the CV?" (ATS is the honest
 *  lift metric; match coverage is recorded because a truthful rewrite can only
 *  hold or slightly raise it — never fabricate new terms). */
export interface TailorLiftPayload {
  beforeAts: number;
  afterAts: number;
  deltaAts: number;
  beforeMatch: number;
  afterMatch: number;
  lang?: string | null;
}

/** A job match the user actually saw, with its real engine score. */
export interface MatchScoredPayload {
  score: number;
  source: "targeted-cv" | "jobs.match" | "recommendations";
  jobId?: string;
}

export interface ApplicationCreatedPayload {
  applicationId: string;
  matchScore: number | null;
  status: string;
}

export interface ApplicationStatusPayload {
  applicationId: string;
  from: string;
  to: string;
  matchScore: number | null;
}

/** A nudge shown to the user. trigger is truncated + sanitized (no emails,
 *  no long free text) — it exists for dedup context, aggregation keys on
 *  signalType/tool only. */
export interface SignalShownPayload {
  signalType: string;
  trigger: string;
  tool: string;
  priority: number;
}

/** A tool that actually executed (from the client's lastExecuted report). */
export interface ToolExecutedPayload {
  tool: string;
  applicationId?: string;
}

/** Trust-loop resolution. kinds = coarse categories ("summary" | "experience"
 *  | "other") derived from fact keys — never the keys themselves. */
export interface ConfirmationResolvedPayload {
  decision: "accept" | "reject";
  count: number;
  kinds: string[];
}

// ─── Snap-to-Apply funnel (D8) ──────────────────────────────────────────────
// One event per step. Payloads carry only lang/category strings and numbers —
// no JD text, no CV content, no titles (all PII-stripped by the writer anyway).

/** /snap page mounted. lang lets the funnel split en vs sw. */
export interface SnapStartedPayload {
  lang: string | null;
}

/** The photo/OCR path was used (a valid image was picked for reading). */
export interface SnapOcrUsedPayload {
  lang: string | null;
}

/** Pasted text passed the looksLikeJobDescription guard (server-side). */
export interface SnapJdDetectedPayload {
  lang: string | null;
}

/** Tailored results rendered — carries the honest ATS lift (numbers only). */
export interface SnapTailoredOkPayload {
  beforeAts: number;
  afterAts: number;
  deltaAts: number;
  source: "profile" | "guest";
  lang: string | null;
}

/** The tailored CV was saved — authed write (profile) or guest stash (guest). */
export interface SnapSavedPayload {
  source: "profile" | "guest";
  lang: string | null;
}

export type OutcomePayload =
  | TailorLiftPayload
  | MatchScoredPayload
  | ApplicationCreatedPayload
  | ApplicationStatusPayload
  | SignalShownPayload
  | ToolExecutedPayload
  | ConfirmationResolvedPayload
  | SnapStartedPayload
  | SnapOcrUsedPayload
  | SnapJdDetectedPayload
  | SnapTailoredOkPayload
  | SnapSavedPayload
  // WS-10 — product-value events.
  | VersionCreatedPayload
  | ScoreGeneratedPayload;

/** WS-10 — a document version snapshot was created (AI auto-snapshot or manual). */
export interface VersionCreatedPayload {
  documentType: string;
  source: "ai" | "manual";
}

/** WS-10 — a Sumaiya Score composite was generated (before/after on tailor). */
export interface ScoreGeneratedPayload {
  beforeScore?: number | null;
  afterScore?: number | null;
  source: string;
}
