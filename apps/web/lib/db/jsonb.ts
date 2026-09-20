/**
 * ── Writing jsonb: JSON TEXT + an explicit cast, never a bare object ─────────
 *
 * Handing drizzle a plain object/array for a jsonb column DOUBLE-ENCODES it on
 * this stack (drizzle + postgres-js): drizzle's jsonb mapper `JSON.stringify`s
 * the value, then postgres-js serialises that *string* again — its jsonb
 * serialiser is `JSON.stringify` — so the column ends up holding a JSON
 * **string** (`jsonb_typeof(data) = 'string'`). Every SQL jsonb operator then
 * returns NULL (or throws) on a row that really holds the data:
 *
 *   select data->'personal'->>'fullName' from cv …          -- NULL
 *   select jsonb_array_length(corroborated_sources) …       -- ERROR: cannot
 *                                                             get array length
 *                                                             of a scalar
 *
 * Nothing looks wrong on screen, because drizzle's own reader
 * (`PgJsonb.mapFromDriverValue` → `JSON.parse` when the driver hands back a
 * string) parses the string back into an object. That is the trap: the app
 * looks right while the database cannot query its own content — no
 * server-side report, migration, admin view, index or RLS policy over the
 * column can ever see it.
 *
 * Probed against the live database (all four confirmed, 2026-09-20):
 *   bare object                       → jsonb_typeof = 'string'   ✗
 *   sql`${obj}::jsonb`                → 'object'                  ✓ (objects only)
 *   sql`${JSON.stringify(obj)}::jsonb`→ 'string'                  ✗
 *   sql`${JSON.stringify(obj)}::text::jsonb` → 'object'           ✓ objects, arrays,
 *                                                  and DB-read values alike
 * The `::text` in the middle matters: it pins the parameter to text so the
 * driver sends the JSON verbatim, and Postgres does the one real parse.
 *
 * This lives in its own module because the defect was never about ONE column:
 * `cv.data`, `cv.template_history`, `job.corroborated_sources`,
 * `document_version.snapshot`, `user_profile.career_profile` and
 * `debug_event.detail` were all written through the same mapper and all held a
 * JSON string. One helper, imported by every writer, is what stops the next
 * column from being written broken while this one is fixed.
 */
import { sql } from "drizzle-orm";

/**
 * The JSON text to hand a jsonb column.
 *
 * Also unwraps a value that arrives as a JSON *string* — every row written
 * before this fix is one — so copying a legacy row (duplicate, re-save, a read
 * of an old value re-written) repairs the copy instead of carrying the broken
 * shape forward. Unwrapping is idempotent.
 */
export function jsonbText(value: unknown): string {
  let v: unknown = value;
  for (let i = 0; i < 2 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      break;
    }
  }
  return JSON.stringify(v ?? {});
}

/** The value to hand a jsonb column. See `jsonbText` for why this exists. */
export function jsonbParam(value: unknown) {
  return sql`${jsonbText(value)}::text::jsonb`;
}
