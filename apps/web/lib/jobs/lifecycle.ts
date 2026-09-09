/**
 * Jobs lifecycle management.
 *
 * Status transitions:
 *   published ──deadline within EXPIRING_WINDOW──▶ expiring
 *   published/expiring ──deadline passed──▶ expired
 *   published/expiring ──unverified for VERIFY_GRACE_DAYS──▶ expired
 *   expired ──source lists it again──▶ published (in ingest.ts upsert)
 *
 * Runs from the daily cron (app/api/cron/jobs) and after every ingest.
 */
import { db, job } from "../db";
import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { EXPIRING_WINDOW_DAYS, VERIFY_GRACE_DAYS, LIVE_STATUSES } from "./constants";

const DAY_MS = 86_400_000;

/** Deadline passed → expired (the source said applications close then). */
export async function expireByDeadline(): Promise<number> {
  const now = new Date();
  const res = await db
    .update(job)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(
        inArray(job.status, LIVE_STATUSES),
        or(
          and(isNotNull(job.applicationDeadline), lt(job.applicationDeadline, now)),
          // No deadline AND never verified by the pipeline → stale after grace.
          and(
            isNull(job.applicationDeadline),
            or(
              isNull(job.lastVerifiedAt),
              lt(job.lastVerifiedAt, new Date(Date.now() - VERIFY_GRACE_DAYS * DAY_MS)),
            ),
          ),
        ),
      ),
    )
    .returning({ id: job.id });
  return res.length;
}

/** Published jobs whose deadline is within EXPIRING_WINDOW_DAYS → expiring. */
export async function markExpiringJobs(): Promise<number> {
  const now = new Date();
  const horizon = new Date(Date.now() + EXPIRING_WINDOW_DAYS * DAY_MS);
  const res = await db
    .update(job)
    .set({ status: "expiring", updatedAt: now })
    .where(
      and(
        eq(job.status, "published"),
        isNotNull(job.applicationDeadline),
        lt(job.applicationDeadline, horizon),
      ),
    )
    .returning({ id: job.id });
  return res.length;
}

/**
 * Backward-compat wrapper for legacy callers: expiry based on deadline +
 * verification policy (age-based expiry is superseded by last_verified_at).
 */
export async function expireJobs(_maxAgeDays = VERIFY_GRACE_DAYS): Promise<number> {
  return expireByDeadline();
}

/** Full lifecycle pass: expire stale → mark closing-soon. */
export async function runLifecycle(): Promise<{ expired: number; expiring: number }> {
  const expired = await expireByDeadline();
  const expiring = await markExpiringJobs();
  return { expired, expiring };
}

/** Jobs currently visible in the feed (published + expiring). */
export function liveStatusFilter() {
  return inArray(job.status, LIVE_STATUSES);
}
