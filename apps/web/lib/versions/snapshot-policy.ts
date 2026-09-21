/**
 * When an autosave should also record a RESTORABLE version.
 *
 * THE DEFECT THIS FILE EXISTS TO PREVENT
 * The editor implies version history: there is a "Historia ya matoleo" panel
 * with a Restore button on every row. But a version was only written when the
 * user pressed "Save current version", downloaded the CV, or restored one — so
 * an hour of ordinary editing (rename, sections, entries) left exactly ONE row
 * (the one written at creation, still carrying the pre-rename title). The panel
 * therefore promised a history that the product never recorded.
 *
 * The fix is to snapshot on a MEANINGFUL change: a save whose payload differs
 * from the payload the last snapshot was taken from, throttled so a burst of
 * typing cannot burn the 20-version-per-document budget
 * (MAX_VERSIONS_PER_DOC, lib/api/routes/versions.ts) in a minute.
 *
 * Deliberately pure: the editor passes what it observed, this decides, and the
 * decision is unit-tested (lib/versions/snapshot-policy.test.ts) instead of
 * being buried in a 3,000-line editor component.
 */

/** At most one automatic version per document per window. */
export const MIN_VERSION_INTERVAL_MS = 10 * 60_000;

export interface SnapshotDecisionInput {
  /** Signature of the document as it is NOW (after a successful save). */
  payloadSignature: string;
  /**
   * Signature of the document the last recorded version was taken from.
   * Empty string = nothing recorded in this session yet.
   */
  baselineSignature: string;
  /** Epoch ms of the last recorded version, or 0 when none was recorded yet. */
  lastRecordedAt: number;
  /** Epoch ms now (injected so the test is deterministic). */
  now: number;
  /** Override for tests / future callers. */
  intervalMs?: number;
}

export function shouldRecordVersion(input: SnapshotDecisionInput): boolean {
  const { payloadSignature, baselineSignature, lastRecordedAt, now } = input;
  const interval = input.intervalMs ?? MIN_VERSION_INTERVAL_MS;

  // No signature to compare (the document failed to serialise) — never guess.
  if (!payloadSignature) return false;

  // Nothing meaningful changed since the last version: a snapshot would be a
  // duplicate row, and duplicates are what make a history list useless.
  if (payloadSignature === baselineSignature) return false;

  // Throttle: one automatic version per window, at most.
  if (lastRecordedAt > 0 && now - lastRecordedAt < interval) return false;

  return true;
}
