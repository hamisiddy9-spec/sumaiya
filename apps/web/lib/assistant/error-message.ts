/**
 * Error coercion helpers for chat surfaces.
 *
 * The iron rule: NEVER pass a non-string into a message card / error state —
 * an Error object or a `{ error: {...} }` payload would render
 * "[object Object]" to the user. Every caught value and server `error` field
 * must flow through `errorMsg` (or `s` when only a string is acceptable).
 */

/** String-or-empty: objects, nulls and numbers become "". */
export const s = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Coerce a caught value / server error into a safe message string.
 * Priority: Error.message → raw string → object.message → object.error →
 * localized fallback. Always returns a non-empty displayable string.
 */
export const errorMsg = (e: unknown, sw: boolean, fallback: string): string => {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
    const err = (e as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  return fallback;
};
