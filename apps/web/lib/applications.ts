/**
 * Follow-up logic for the job-application tracker — derived entirely from
 * existing fields (status + when it was sent), so it needs no reminder column
 * and is always current. This is the foundation the tracker's "chase your
 * applications" nudges build on; explicit follow-up dates can layer on later
 * behind a schema migration.
 */

export const FOLLOW_UP_DAYS = 7;

// Accepts Date (server) or string (client, after JSON) for the timestamps.
type FollowUpInput = {
  status: string;
  appliedAt: Date | string | null;
  createdAt: Date | string;
};

/** Whole days a still-open application has waited since it was sent. */
export function daysWaiting(app: FollowUpInput): number {
  const ref = app.appliedAt ?? app.createdAt;
  const ms = Date.now() - new Date(ref).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * True when an application has sat in "applied" with no response for a week —
 * the point where a polite follow-up to the employer actually helps.
 */
export function needsFollowUp(app: FollowUpInput): boolean {
  return app.status === "applied" && daysWaiting(app) >= FOLLOW_UP_DAYS;
}

// ── Application lifecycle state machine ────────────────────────────────────
// The canonical order a job moves through, plus two terminal outcomes. The
// dashboard's "Utafutaji wako wa kazi" counts (Zimetumwa / Mahojiano / Ofa)
// derive from these statuses, so transitions are validated server-side: a
// resolved (terminal) application can never be revived into the pipeline.

export const APPLICATION_PIPELINE = ["draft", "applied", "interviewing", "offer"] as const;
export const APPLICATION_TERMINAL = ["rejected", "archived"] as const;
export const APPLICATION_STATUSES = [...APPLICATION_PIPELINE, ...APPLICATION_TERMINAL] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Whether a status change is legal. Terminal states (rejected/archived) are
 *  TERMINAL — once an application is resolved it stays resolved (reviving it
 *  would let a client fake the pipeline counts). Among active pipeline states
 *  any move is allowed: forward, skipping stages, or a one-step-back
 *  correction (users misclick; it's their data). */
export function canTransitionStatus(from: string, to: string): boolean {
  if (!(APPLICATION_STATUSES as readonly string[]).includes(from)) return false;
  if (!(APPLICATION_STATUSES as readonly string[]).includes(to)) return false;
  if (from === to) return true;
  if ((APPLICATION_TERMINAL as readonly string[]).includes(from)) return false;
  return true;
}

/** Legal target statuses for a dropdown given the current one (current included). */
export function legalStatusTargets(from: string): string[] {
  return APPLICATION_STATUSES.filter((s) => canTransitionStatus(from, s));
}
