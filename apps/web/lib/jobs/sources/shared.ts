/**
 * Shared helpers for job source adapters — fetch with timeout, defensive
 * field coercion for the loosely-typed free APIs. No DB imports (adapters
 * run under tsx scripts too).
 */

export const FETCH_TIMEOUT_MS = 15_000;
export const JOBS_USER_AGENT =
  "Sumaiya-Jobs-Ingest/1.0 (+https://sumaiya.app)";

/**
 * Ceiling on how many postings ONE global remote board may contribute per run.
 *
 * Why this exists: the feed is source-counted, so raw volume wins. Measured on
 * 20 Sep 2026 the four global remote boards supplied 748 of the feed's 806
 * rows while the single Tanzania board supplied 10 — and adding African
 * sources alone does not fix that, because a 338-posting Western ATS feed
 * still outnumbers a 400-posting local board in the same proportion. Capping
 * each global board keeps its newest N and lets the Africa-facing sources hold
 * a real share of the feed.
 *
 * JOBS_GLOBAL_SOURCE_CAP overrides the default; 0 means unlimited.
 */
export const DEFAULT_GLOBAL_SOURCE_CAP = 80;

/** The per-global-source cap in force for this run. */
export function globalSourceCap(): number {
  const raw = process.env.JOBS_GLOBAL_SOURCE_CAP;
  if (raw !== undefined && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return DEFAULT_GLOBAL_SOURCE_CAP;
}

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

/* ── RSS/XML support ────────────────────────────────────────────────────────
 * Some regional boards publish a feed instead of an API (JobwebTanzania). RSS
 * is a documented, stable format the site maintains for exactly this purpose,
 * so parsing it is less brittle than re-parsing their WordPress theme on every
 * update. These helpers are dependency-free on purpose: the adapter layer has
 * no XML library and should not grow one for a ten-item feed.
 */

/** GET a text/XML endpoint with a hard timeout. Throws on non-2xx. */
export async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": JOBS_USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Decode the entities an RSS body carries. Numeric forms are decoded FIRST and
 * `&amp;` LAST, so a literal `&amp;lt;` ends up as the text `&lt;` rather than
 * being double-decoded into a real tag.
 */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => codePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => codePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function codePoint(n: number): string {
  try {
    return Number.isFinite(n) ? String.fromCodePoint(n) : "";
  } catch {
    return "";
  }
}

/** Split an RSS document into its `<item>` bodies. Tolerates attributes. */
export function rssItems(xml: string): string[] {
  const out: string[] = [];
  const re = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

/** Read one tag's text out of an item block, unwrapping CDATA. "" when absent. */
export function rssValue(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(block);
  if (!m) return "";
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim();
}
