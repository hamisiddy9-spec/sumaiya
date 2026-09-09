// Snap-to-Apply (D2) — "Tailor my CV for this job" prefill hand-off.
//
// The jobs feed (public feed + dashboard recommended jobs) hands the /snap
// page a REAL job description through sessionStorage — NOT the URL. Reasons:
//   - Job descriptions are long (URLs cap out ~2–8KB and leak the JD into
//     history/server logs); sessionStorage stays on-device.
//   - Only REAL JD text is ever prefilled: the button saves exactly what the
//     feed already shows (job.description), and readJdPrefill refuses empty /
//     stale / oversized payloads — a broken or malicious hand-off degrades to
//     an empty textarea, never a fabricated job.
//
// Storage is injectable so the invariants are unit-testable in node (the app
// passes the real sessionStorage; tests pass a Map-backed fake).

export const SNAP_PREFILL_KEY = "sumaiya-snap-prefill";
/** A hand-off older than this is ignored (a user returning later sees a clean page). */
export const SNAP_PREFILL_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
/** Defensive caps — the feed never sends anything this big, but refuse anyway. */
export const SNAP_PREFILL_MAX_JD_CHARS = 40_000;
const MAX_META_CHARS = 200;

export interface JdPrefill {
  /** The real job description text (trimmed, non-empty). */
  jd: string;
  /** Job title, for a friendly "prefilled from …" notice. Optional. */
  title?: string;
  /** Company name, for the same notice. Optional. */
  company?: string;
  /** Epoch ms when the hand-off was saved. */
  at: number;
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null; // storage disabled (private mode) — hand-off degrades gracefully
  }
}

/**
 * Save a real JD for the next /snap visit. Returns false when there is no JD
 * text (callers should not navigate at all then) or storage is unavailable —
 * the button still navigates, it just opens an empty /snap.
 */
export function saveJdPrefill(
  input: { jd: string; title?: string; company?: string },
  storage: StorageLike | null = defaultStorage(),
  now: number = Date.now(),
): boolean {
  const jd = (input?.jd ?? "").trim();
  if (!jd) return false;
  if (!storage) return false;
  const payload: JdPrefill = {
    jd: jd.slice(0, SNAP_PREFILL_MAX_JD_CHARS),
    at: now,
  };
  const title = input?.title?.trim();
  const company = input?.company?.trim();
  if (title) payload.title = title.slice(0, MAX_META_CHARS);
  if (company) payload.company = company.slice(0, MAX_META_CHARS);
  try {
    storage.setItem(SNAP_PREFILL_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a pending hand-off. Returns null for anything that must not be
 * prefilled: no payload, corrupted JSON, empty/oversized JD, missing or
 * future timestamp, or a stale hand-off older than SNAP_PREFILL_MAX_AGE_MS.
 */
export function readJdPrefill(
  storage: StorageLike | null = defaultStorage(),
  now: number = Date.now(),
): JdPrefill | null {
  if (!storage) return null;
  let raw: string | null = null;
  try {
    raw = storage.getItem(SNAP_PREFILL_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  const jd = typeof p.jd === "string" ? p.jd.trim() : "";
  if (!jd) return null;
  if (jd.length > SNAP_PREFILL_MAX_JD_CHARS) return null;
  const at = typeof p.at === "number" && Number.isFinite(p.at) ? p.at : 0;
  if (!at || at > now || now - at > SNAP_PREFILL_MAX_AGE_MS) return null;
  const out: JdPrefill = { jd, at };
  if (typeof p.title === "string" && p.title.trim()) out.title = p.title.trim().slice(0, MAX_META_CHARS);
  if (typeof p.company === "string" && p.company.trim()) out.company = p.company.trim().slice(0, MAX_META_CHARS);
  return out;
}

/** Remove a pending hand-off (called once /snap has consumed it). */
export function clearJdPrefill(storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(SNAP_PREFILL_KEY);
  } catch {
    /* non-fatal */
  }
}
