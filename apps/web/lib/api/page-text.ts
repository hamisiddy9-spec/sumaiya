/**
 * Shared page-text extraction — strips a fetched HTML page down to plain
 * text. Used by BOTH the /ai/read-url route and the jobs on-demand
 * enrichment (lib/jobs/enrich.ts), so the two never drift.
 *
 * Entities decode FIRST (via the shared decoder), then tags are stripped —
 * the same order as the jobs ingest cleanHtml, so encoded tags
 * (&lt;div&gt;) can never materialize as literal markup in the text a
 * model (or a user) reads back from a fetched page.
 */
import { decodeEntities } from "../jobs/text";

/** Strip an HTML page down to readable plain text (no parser dependency).
 *  Good enough for a job posting — drops scripts/styles/tags and decodes the
 *  common entities. */
export function htmlToText(html: string): string {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Letter-gated: a real tag starts with a letter, "/" or "!" — comparison
    // operators ("Salary < 100k > average") are not tags and must survive.
    .replace(/<[/!a-zA-Z][^>]*>/g, " ")
    // Unterminated tag-like text at end of string (truncated pages).
    .replace(/<[a-z][^>]*$/gi, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function pageTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 200) : "";
}
