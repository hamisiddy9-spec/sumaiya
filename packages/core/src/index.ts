// @sumaiya/core — shared domain primitives.
//
// The blueprint's reserved home for logic that both apps/web and apps/native
// depend on and that isn't UI, isn't a raw type, and isn't a network client.
// Keep it dependency-free and platform-agnostic (no `fetch`, no `window`, no
// node builtins) so both a React 18 Next server and a React 19 Hermes bundle
// can pull it verbatim.

/** The document kinds Sumaiya can produce. */
export const DOC_TYPES = ["cv", "cover-letter", "business-card", "letter"] as const;
export type DocType = (typeof DOC_TYPES)[number];

/** Career stage — drives template ranking, advice tone, gather scripts. */
export const CAREER_STAGES = [
  "student",
  "graduate",
  "early",
  "mid",
  "senior",
  "lead",
] as const;
export type CareerStage = (typeof CAREER_STAGES)[number];

/** The two UI languages. */
export const LANGS = ["en", "sw"] as const;
export type Lang = (typeof LANGS)[number];

export function isDocType(v: unknown): v is DocType {
  return typeof v === "string" && (DOC_TYPES as readonly string[]).includes(v);
}

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "sw";
}

/** A tiny explicit Result so callers can branch without try/catch plumbing. */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
