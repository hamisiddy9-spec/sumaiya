/**
 * On-demand job description enrichment.
 *
 * Some sources return THIN descriptions (title + a line). Matching and
 * tailoring against a thin JD produces weak results, so when a user
 * interacts with a thin job we fetch the FULL posting from its real
 * source page, clean it through the text.ts pipeline, and cache the
 * enriched description on the job row.
 *
 * Guardrails (non-negotiable):
 *   - ONLY the source's OWN canonical page is fetched (applyUrl / sourceUrl
 *     as the source reported them) — never a forbidden host (LinkedIn,
 *     Indeed, Glassdoor, ZipRecruiter, Monster, or any ToS-forbidden site).
 *   - The fetch reuses the SAME SSRF guard as /api/ai/read-url:
 *     isPrivateHost() on EVERY hop + redirect:"manual" + redirectTarget(),
 *     so a redirect to 169.254.169.254 or any private target is rejected
 *     BEFORE a single byte is requested.
 *   - Content-type guard (html/plain only) + hard byte cap (streamed).
 *   - If the page can't be read (blocked, non-HTML, empty, timeout), we
 *     fall back to the thin description — we NEVER fabricate a JD.
 *   - The enriched text is only accepted if it is substantially LONGER
 *     than the thin source text (a shorter/equal page is noise, not a JD).
 */
import { isPrivateHost, redirectTarget } from "../api/routes/ai-ssrf";
import { htmlToText } from "../api/page-text";
import { cleanHtml } from "./text";
import { db, job } from "../db";
import { eq } from "drizzle-orm";

/** Descriptions shorter than this are "thin" and candidates for enrichment. */
export const THIN_DESCRIPTION_CHARS = 300;
/** Minimum non-whitespace chars a fetched page must yield to be a JD. */
export const MIN_FETCHED_TEXT_CHARS = 200;
/** Fetched text must be this many times longer than the thin source to count. */
export const MIN_IMPROVEMENT_RATIO = 2;
/** Hard cap on the description stored (matches cleanHtml default). */
export const MAX_DESCRIPTION_CHARS = 4000;

export function isThinDescription(description: string): boolean {
  return (description || "").replace(/\s/g, "").length < THIN_DESCRIPTION_CHARS;
}

export interface FetchedPage {
  text: string;
}

/**
 * Fetch a page with the SAME per-hop SSRF guard as /api/ai/read-url.
 * Returns null when the page is unreachable, non-HTML, private, or yields
 * no readable text — callers fall back, never fabricate.
 */
export async function fetchPublicPage(url: string): Promise<FetchedPage | null> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  try {
    if (await isPrivateHost(u.hostname)) return null;
  } catch {
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const MAX_REDIRECTS = 5;
    let target = u;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      try {
        if (await isPrivateHost(target.hostname)) return null;
      } catch {
        /* unresolvable host → let fetch fail below */
      }
      res = await fetch(target.toString(), {
        redirect: "manual", // validate EVERY hop before requesting it
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SumaiyaBot/1.0; +https://sumaiya.pro)",
          Accept: "text/html,application/xhtml+xml,text/plain,*/*",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return null;
        const next = redirectTarget(target, loc);
        if (!next) return null;
        target = next;
        continue;
      }
      break;
    }
    clearTimeout(timer);
    if (!res || !res.ok) return null;
    const ctype = (res.headers.get("content-type") || "").toLowerCase();
    if (!/text\/html|text\/plain|xhtml/.test(ctype)) return null;

    // Stream with a hard byte cap (never buffer a whole page into memory).
    const MAX_BYTES = 1_500_000;
    let raw = "";
    if (res.body?.getReader) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      try {
        while (raw.length < MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
        }
        await reader.cancel().catch(() => {});
      } catch {
        await reader.cancel().catch(() => {});
        return null;
      }
    } else {
      raw = (await res.text()).slice(0, MAX_BYTES);
    }
    const text = htmlToText(raw.slice(0, MAX_BYTES));
    if (text.replace(/\s/g, "").length < MIN_FETCHED_TEXT_CHARS) return null;
    return { text: text.slice(0, 12_000) };
  } catch {
    return null;
  }
}

export interface EnrichmentResult {
  enriched: boolean;
  description: string;
  reason: "already-rich" | "enriched" | "no-usable-page" | "not-flagged-thin";
}

/**
 * Enrich a single job's description on demand and cache it on the row.
 * Returns the description to use (enriched or the thin fallback) plus why.
 */
export async function enrichJob(jobId: string): Promise<EnrichmentResult | null> {
  const [row] = await db
    .select({
      id: job.id,
      title: job.title,
      description: job.description,
      applyUrl: job.applyUrl,
      sourceUrl: job.sourceUrl,
      source: job.source,
    })
    .from(job)
    .where(eq(job.id, jobId))
    .limit(1);
  if (!row) return null;

  if (!isThinDescription(row.description)) {
    return { enriched: false, description: row.description, reason: "already-rich" };
  }

  // Only the source's OWN page — applyUrl first (the live listing), then the
  // canonical sourceUrl as fallback. Never a third-party/forbidden host.
  const candidates = [row.applyUrl, row.sourceUrl].filter(
    (u) => u && /^https?:\/\//i.test(u)
  );
  for (const url of [...new Set(candidates)]) {
    const page = await fetchPublicPage(url);
    if (!page) continue;
    // Content-window heuristic: job pages lead with nav/header noise before
    // the actual JD. Find the job's own title in the text and start the
    // window there (falling back to the page start when the title string
    // differs on the page). This keeps the JD and drops most nav junk.
    const window = extractContentWindow(page.text, row.title, MAX_DESCRIPTION_CHARS);
    const enriched = cleanHtml(window, MAX_DESCRIPTION_CHARS);
    const thinLen = (row.description || "").replace(/\s/g, "").length;
    const fetchedLen = (enriched || "").replace(/\s/g, "").length;
    // Accept only a substantially richer JD — never overwrite with noise.
    if (fetchedLen >= MIN_FETCHED_TEXT_CHARS && fetchedLen >= thinLen * MIN_IMPROVEMENT_RATIO) {
      await db
        .update(job)
        .set({ description: enriched, updatedAt: new Date() })
        .where(eq(job.id, jobId));
      return { enriched: true, description: enriched, reason: "enriched" };
    }
  }

  return { enriched: false, description: row.description, reason: "no-usable-page" };
}

/**
 * Take the portion of the fetched page text that likely holds the JD: from
 * the job title (case-insensitive, first occurrence AFTER the header/nav
 * block if it repeats) through a max-length window. Falls back to the page
 * start when the title isn't found verbatim.
 */
export function extractContentWindow(pageText: string, jobTitle: string, maxChars: number): string {
  const text = pageText || "";
  if (!jobTitle) return text.slice(0, maxChars);

  const title = jobTitle.trim();
  // Find the FIRST occurrence (usually the <title> tag content near the top)
  // and the LAST occurrence (the real job header in the body). The body
  // occurrence is the JD anchor.
  let idx = -1;
  let searchFrom = 0;
  for (;;) {
    const at = text.toLowerCase().indexOf(title.toLowerCase(), searchFrom);
    if (at === -1) break;
    idx = at;
    searchFrom = at + title.length;
  }
  if (idx === -1) return text.slice(0, maxChars);

  // Start a little before the anchor (catches the h1 line) and take the
  // window from there. This drops the header/nav boilerplate above the JD.
  const start = Math.max(0, idx - 40);
  return text.slice(start, start + maxChars);
}
