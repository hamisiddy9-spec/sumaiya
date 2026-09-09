/**
 * Shared helpers for job source adapters — fetch with timeout, defensive
 * field coercion for the loosely-typed free APIs. No DB imports (adapters
 * run under tsx scripts too).
 */

export const FETCH_TIMEOUT_MS = 15_000;
export const JOBS_USER_AGENT =
  "Sumaiya-Jobs-Ingest/1.0 (+https://sumaiya.pro)";

/** GET a JSON endpoint with a hard timeout. Throws on non-2xx. */
export async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": JOBS_USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** String coercion with a fallback — free APIs return null/objects/arrays. */
export function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v).trim();
}

/** First tag of a tags array (or the string itself). */
export function firstTag(tags: unknown): string {
  return Array.isArray(tags) && tags.length ? str(tags[0]) : "";
}

/** Company field: string OR object ({ name }) — handle both. */
export function companyName(company: unknown): string {
  if (company == null) return "";
  if (typeof company === "object") {
    const c = company as Record<string, unknown>;
    return str(c.name);
  }
  return str(company);
}

/** Location field: string, object ({city,country}) or string array. */
export function locationName(location: unknown): string {
  if (location == null) return "";
  if (typeof location === "object") {
    if (Array.isArray(location)) return location.map(String).join(", ").trim();
    const l = location as Record<string, unknown>;
    const city = str(l.city);
    const country = str(l.country);
    return [city, country].filter(Boolean).join(", ");
  }
  return str(location);
}

/** Employment type: array → joined list, else string; default full-time. */
export function employmentType(raw: unknown): string {
  if (Array.isArray(raw)) return raw.map(String).join(", ").toLowerCase();
  const s = String(raw ?? "").toLowerCase();
  return s || "full-time";
}
