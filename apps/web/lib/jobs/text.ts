/**
 * Pure text-cleaning helpers for job listings (and anything else fed from
 * loosely-trusted sources). No DB imports — safe to import from client
 * components, server routes and tsx scripts alike.
 *
 * The #1 historical bug this module exists to prevent: decoding HTML entities
 * AFTER stripping tags. Sources like Arbeitnow / RemoteOK / Himalayas serve
 * descriptions with REAL tags (`<div class="…">`) or ENCODED tags
 * (`&lt;div&gt;`). Stripping tags first leaves encoded tags intact; decoding
 * them afterwards materializes raw `<div>` text into the feed. Correct order:
 *
 *   decode entities → strip tags → collapse whitespace
 */

/** Decode the HTML entity set job sources actually emit. */
export function decodeEntities(s: string): string {
  if (!s) return s;
  return (
    s
      // `&amp;` FIRST so double-encoded `&amp;lt;` → `&lt;` → `<` in one pass.
      .replace(/&amp;?/gi, "&")
      // Numeric decimal + hex (with or without trailing `;`).
      .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => {
        try {
          return String.fromCodePoint(parseInt(h, 16));
        } catch {
          return "";
        }
      })
      .replace(/&#(\d+);?/g, (_, d: string) => {
        try {
          return String.fromCodePoint(parseInt(d, 10));
        } catch {
          return "";
        }
      })
      // Named entities — punctuation and common symbols first (they survive
      // as visible characters), then whitespace-ish ones last.
      .replace(/&nbsp;?/gi, " ")
      .replace(/&lt;?/gi, "<")
      .replace(/&gt;?/gi, ">")
      .replace(/&quot;?/gi, '"')
      .replace(/&apos;?|&#39;?/gi, "'")
      .replace(/&rsquo;?/gi, "\u2019")
      .replace(/&lsquo;?/gi, "\u2018")
      .replace(/&rdquo;?/gi, "\u201D")
      .replace(/&ldquo;?/gi, "\u201C")
      .replace(/&ndash;?/gi, "\u2013")
      .replace(/&mdash;?/gi, "\u2014")
      .replace(/&hellip;?/gi, "\u2026")
      .replace(/&bull;?/gi, "\u2022")
      .replace(/&middot;?/gi, "\u00B7")
      .replace(/&copy;?/gi, "\u00A9")
      .replace(/&reg;?/gi, "\u00AE")
      .replace(/&trade;?/gi, "\u2122")
      .replace(/&euro;?/gi, "\u20AC")
      .replace(/&pound;?/gi, "\u00A3")
      .replace(/&yen;?/gi, "\u00A5")
      .replace(/&sect;?/gi, "\u00A7")
      .replace(/&para;?/gi, "\u00B6")
  );
}

/**
 * Normalize a raw HTML/entity-laden string into plain display text.
 * Order matters: entities decode FIRST, tags are stripped AFTER, so encoded
 * tags (`&lt;div&gt;`) can never survive as literal markup. Whitespace is
 * collapsed (block tags become single spaces, not glued words).
 */
export function cleanHtml(s: string, max = 4000): string {
  return decodeEntities(s || "")
    // Complete tags, then unterminated tag-like text at end-of-string
    // (sources sometimes truncate mid-tag: "<span style=\"fo" — no ">" ever
    // comes, so <[^>]*> can never match it). The tag regex is letter-gated so
    // comparison operators ("5 < 10 > 2") survive: a real tag starts with a
    // letter, "/" (closing) or "!" (doctype/comment), never a space or digit.
    .replace(/<[/!a-zA-Z][^>]*>/g, " ")
    .replace(/<[a-z][^>]*$/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Light normalization for short fields (title/company/location). */
export function clean(s: string, max = 200): string {
  return decodeEntities(s || "").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Clean untrusted text before it reaches an AI prompt. Non-destructive:
 * all-markup input falls back to the original rather than collapsing to an
 * empty prompt section. The cap mirrors the caller's Zod max so cleaning
 * never silently widens what the model is allowed to see.
 */
export function sanitizePromptText(s: string, max = 20000): string {
  const cleaned = cleanHtml(s, max);
  return cleaned || s;
}
