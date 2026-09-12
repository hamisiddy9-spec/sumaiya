// Outcome event writer — the feedback flywheel's write path (PR-1).
//
// ONE rule: instrumentation must NEVER break the feature it observes. Every
// function here is best-effort — it catches everything, never throws, and a
// DB failure at write time is swallowed (the app flow continues untouched).
//
// Privacy:
//   - userId is stored ONLY as sha256(userId + OUTCOME_SALT) — deterministic
//     per user (so aggregation works) but not reversible without the salt.
//     When OUTCOME_SALT is not configured, the write path no-ops entirely.
//   - payloads are sanitized (PII keys dropped, long strings truncated).
//   - the user's analytics_opt_out flag is checked per event — opted-out users
//     generate nothing.

import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { DB } from "./db-type";
import { userProfile, outcomeEvent } from "@/lib/db";
import type {
  OutcomeEventType,
  OutcomePayload,
  TailorLiftPayload,
  MatchScoredPayload,
  ApplicationCreatedPayload,
  ApplicationStatusPayload,
  SignalShownPayload,
  ToolExecutedPayload,
  ConfirmationResolvedPayload,
  SnapStartedPayload,
  SnapOcrUsedPayload,
  SnapJdDetectedPayload,
  SnapTailoredOkPayload,
  SnapSavedPayload,
} from "./types";

/** Salt for the user-id hash. Prod sets OUTCOME_SALT; the fallback is a
 *  documented dev constant (still not reversible without knowing it). The
 *  WRITE path additionally refuses to run when OUTCOME_SALT is unset — a
 *  public fallback salt is not real anonymization, so no salt → no events. */
const SALT = process.env.OUTCOME_SALT || "sumaiya-outcome-dev-salt";

/** Deterministic, non-reversible per-user aggregation key. */
export function hashUserId(userId: string): string {
  return createHash("sha256").update(`${SALT}:${userId}`).digest("hex");
}

/** Fields that must never reach the events payload, even nested.
 *  Stored LOWERCASE — the key check lowercases both sides so camelCase field
 *  names (fullName, jobTitle) are caught the same as snake_case. */
const PII_KEYS = new Set([
  "email", "phone", "fullname", "firstname", "lastname", "name", "address",
  "linkedin", "website", "photo", "notes", "jobdescription", "companyname",
  "company", "jobtitle", "title", "summary", "referee", "referees",
  "description", "content", "reason",
]);

const MAX_STRING = 120;

/** Recursively strip PII keys and truncate long strings. Pure + testable. */
export function sanitizePayload(payload: unknown, depth = 0): Record<string, unknown> {
  if (depth > 4) return {};
  if (Array.isArray(payload)) {
    return payload.slice(0, 20).map((v) => sanitizePayload(v, depth + 1)) as unknown as Record<string, unknown>;
  }
  if (payload && typeof payload === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) continue;
      // Recurse into nested objects/arrays — a PII key inside `args` or any
      // other nested bag must be stripped too, not passed through untouched.
      // A bag that becomes EMPTY after stripping (it held only PII) is dropped
      // entirely — no empty shell left behind.
      const cleaned = v && typeof v === "object"
        ? sanitizePayload(v, depth + 1)
        : typeof v === "string" && v.length > MAX_STRING
          ? v.slice(0, MAX_STRING)
          : v;
      if (cleaned && typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) {
        continue;
      }
      out[k] = cleaned;
    }
    return out;
  }
  return payload as Record<string, unknown>;
}

/** Event write. Opt-out check is one light indexed query; failures are logged
 *  (console) and swallowed — instrumentation never throws into the caller.
 *  Privacy gate: when OUTCOME_SALT is not configured the write no-ops entirely
 *  (the dev fallback salt is public, so hashes would not be real anonymization)
 *  — prod sets OUTCOME_SALT; environments without it record nothing. */
export async function recordOutcomeEvent(
  db: DB,
  input: { userId: string; type: OutcomeEventType; payload: OutcomePayload },
): Promise<void> {
  if (!process.env.OUTCOME_SALT) return; // no salt → no events, ever
  try {
    const [row] = await db
      .select({ optOut: userProfile.analyticsOptOut })
      .from(userProfile)
      .where(eq(userProfile.id, input.userId))
      .limit(1);
    if (row?.optOut) return; // user opted out — no event
    await db.insert(outcomeEvent).values({
      id: nanoid(),
      userHash: hashUserId(input.userId),
      type: input.type,
      // The `::jsonb` cast is load-bearing, not decoration. Without it drizzle
      // hands postgres-js a plain object, which arrives double-encoded: the
      // column holds a JSON *string* and every `payload->>'key'` read returns
      // NULL. That silently blanked the admin Insights page for real users —
      // lib/outcomes/aggregate.ts reads `r.payload.beforeAts` as a property.
      payload: sql`${sanitizePayload(input.payload)}::jsonb` as unknown as Record<string, unknown>,
    });
  } catch (err) {
    // Instrumentation must never break the feature it observes.
    console.error("[outcomes] recordOutcomeEvent failed (swallowed):", err);
  }
}

// ─── Typed wrappers (one per seam) ───────────────────────────────────────────

export function recordTailorLift(db: DB, userId: string, payload: TailorLiftPayload) {
  return recordOutcomeEvent(db, { userId, type: "tailor.lift", payload });
}

export function recordMatchScored(db: DB, userId: string, payload: MatchScoredPayload) {
  return recordOutcomeEvent(db, { userId, type: "match.scored", payload });
}

export function recordApplicationCreated(db: DB, userId: string, payload: ApplicationCreatedPayload) {
  return recordOutcomeEvent(db, { userId, type: "application.created", payload });
}

export function recordApplicationStatus(db: DB, userId: string, payload: ApplicationStatusPayload) {
  return recordOutcomeEvent(db, { userId, type: "application.status", payload });
}

export function recordSignalShown(db: DB, userId: string, payload: SignalShownPayload) {
  return recordOutcomeEvent(db, { userId, type: "signal.shown", payload });
}

export function recordToolExecuted(db: DB, userId: string, payload: ToolExecutedPayload) {
  return recordOutcomeEvent(db, { userId, type: "tool.executed", payload });
}

export function recordConfirmationResolved(db: DB, userId: string, payload: ConfirmationResolvedPayload) {
  return recordOutcomeEvent(db, { userId, type: "confirmation.resolved", payload });
}

// ─── Snap-to-Apply funnel (D8) ──────────────────────────────────────────────

export function recordSnapStarted(db: DB, userId: string, payload: SnapStartedPayload) {
  return recordOutcomeEvent(db, { userId, type: "snap.started", payload });
}

export function recordSnapOcrUsed(db: DB, userId: string, payload: SnapOcrUsedPayload) {
  return recordOutcomeEvent(db, { userId, type: "snap.ocr_used", payload });
}

export function recordSnapJdDetected(db: DB, userId: string, payload: SnapJdDetectedPayload) {
  return recordOutcomeEvent(db, { userId, type: "snap.jd_detected", payload });
}

export function recordSnapTailoredOk(db: DB, userId: string, payload: SnapTailoredOkPayload) {
  return recordOutcomeEvent(db, { userId, type: "snap.tailored_ok", payload });
}

export function recordSnapSaved(db: DB, userId: string, payload: SnapSavedPayload) {
  return recordOutcomeEvent(db, { userId, type: "snap.saved", payload });
}

/** WS-10 — a recoverable version snapshot was created (AI auto-snapshot or manual). */
export function recordVersionCreated(db: DB, userId: string, payload: { documentType: string; source: "ai" | "manual" }) {
  return recordOutcomeEvent(db, { userId, type: "version.created", payload });
}

/** WS-10 — a Sumaiya Score composite was generated (before/after on tailor). */
export function recordScoreGenerated(db: DB, userId: string, payload: { beforeScore?: number | null; afterScore?: number | null; source: string }) {
  return recordOutcomeEvent(db, { userId, type: "score.generated", payload });
}
