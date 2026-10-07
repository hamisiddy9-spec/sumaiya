/**
 * In-memory ring buffer of the last 40 diagnostic entries.
 *
 * Fed from the same two seams `_layout.tsx` already wires at startup:
 * `setReporter`'s caught errors and the telemetry sink behind
 * `analytics.track()`. It exists so a user-initiated problem report
 * (`report-sheet.tsx`) can carry real context — what actually happened right
 * before the tap — instead of a screenshot alone.
 *
 * Same rules as `reporting.ts` and `telemetry.ts`: never throws, no storage,
 * capped hard so it cannot grow into a memory leak.
 */

export type LogEntryKind = "event" | "error";

export interface LogEntry {
  at: number;
  kind: LogEntryKind;
  name: string;
  detail?: string;
}

const MAX_ENTRIES = 40;

let entries: LogEntry[] = [];

/** Record one entry, oldest dropped past MAX_ENTRIES. Never throws. */
export function pushLogEntry(kind: LogEntryKind, name: string, detail?: string): void {
  try {
    entries.push({ at: Date.now(), kind, name, detail });
    if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  } catch {
    /* a broken buffer must not break the caller */
  }
}

/** A snapshot for a problem report, oldest first. Never throws. */
export function getLogEntries(): LogEntry[] {
  try {
    return entries.slice();
  } catch {
    return [];
  }
}

/** Tests only. */
export function _clearLogEntries(): void {
  entries = [];
}
