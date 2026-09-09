/**
 * Shared jobs constants — lives alone so ingest.ts and lifecycle.ts never form
 * an import cycle.
 */

export const VERIFY_GRACE_DAYS = 30; // unverified for this long → expired
export const EXPIRING_WINDOW_DAYS = 3; // deadline within this → expiring badge

export type JobStatus = "draft" | "published" | "expiring" | "expired" | "rejected";

export const LIVE_STATUSES: JobStatus[] = ["published", "expiring"];
