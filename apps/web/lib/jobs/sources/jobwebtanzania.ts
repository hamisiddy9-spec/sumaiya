/**
 * JobwebTanzania — a Tanzania-only job board, read through its RSS feed.
 * https://www.jobwebtanzania.com/feed/
 *
 * WHY THIS SOURCE EXISTS: every other adapter is global or foreign (Arbeitnow
 * is Germany, USAJobs is the US, Jobicy/Himalayas/Remotive are remote boards
 * dominated by US/EU employers). The measured result was a feed of 8,079 rows
 * in which a Tanzania search returned ZERO — the "Ajira" tab of a Tanzanian
 * job platform showed a Tanzanian job-seeker Berlin and London. A local source
 * is the only honest fix; an international filter alone would have left the
 * tab empty.
 *
 * RSS rather than a scrape: the site publishes this feed deliberately, so the
 * format is stable across theme changes. The listing page is a WordPress theme
 * whose markup we would be re-parsing on every one of their updates.
 *
 * ── PAGINATION (the bug this adapter used to have) ───────────────────────────
 * WordPress serves `posts_per_rss` items per feed page and this site uses the
 * default of 10. Reading only the first page therefore returned TEN listings
 * out of a catalogue its own sitemap measures at ~1,849 job_listing URLs
 * (job_listing-sitemap1.xml = 1,001 <loc>, job_listing-sitemap2.xml = 848).
 * Every `?paged=N` is a fresh window of 10 — the ten was not a catalogue size,
 * not a filter dropping results, and not a swallowed error: it is one page of
 * a paginated feed that the adapter never walked.
 *
 * The crawl is bounded twice, because importing the whole archive would
 * publish dead adverts as if they were live:
 *   - JOBWEBTANZANIA_MAX_AGE_DAYS (default 60) — stop once a page's postings
 *     all fall outside the window. Measured against the real feed: page 1 ≈
 *     today, page 10 ≈ 16 days, page 20 ≈ 33 days, page 40 ≈ 61 days, so the
 *     default window lands at roughly 400 fresh Tanzanian listings.
 *   - JOBWEBTANZANIA_MAX_PAGES (default 45) — a hard ceiling so a feed that
 *     stops advancing dates can never spin the cron.
 *
 * Nothing here is inferred. `externalId` comes from the post id in the item's
 * own <guid>, the URLs from the item's <link>, and location/employment type
 * from the advert's OWN labelled fields. The feed gives a title, not a company
 * field, so the company is only ever the text the source itself wrote after
 * " at " in that title.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { decodeEntities, fetchText, rssItems, rssValue } from "./shared";

/**
 * Trailing slash: the site 301-redirects `/feed` → `/feed/`, and the paged
 * form that the crawl needs is served at `/feed/?paged=N`.
 */
const FEED_URL = "https://www.jobwebtanzania.com/feed/";

const MAX_PAGES_ENV = "JOBWEBTANZANIA_MAX_PAGES";
const MAX_AGE_DAYS_ENV = "JOBWEBTANZANIA_MAX_AGE_DAYS";
const DEFAULT_MAX_PAGES = 45;
const DEFAULT_MAX_AGE_DAYS = 60;

/**
 * Pages fetched concurrently. Each page is one small XML document, so a batch
 * of 4 keeps the crawl (~12 batches for 45 pages) inside the cron budget
 * without hammering a single WordPress host with a burst.
 */
const PAGE_BATCH = 4;

const DAY_MS = 86_400_000;

/**
 * The advert's own field labels, in the order they appear in the markup. They
 * are read as label → value PAIRS, because the labels are not values: an
 * advert reading "Full Time / Part Time:  Full Time" is a full-time job whose
 * LABEL also contains the words "Part Time", and a naive /part.?time/ search
 * reports every Vodacom manager as part-time.
 */
const KNOWN_LABELS = [
  "Aggregate function",
  "Business Area",
  "Posting Country",
  "Full Time / Part Time",
  "Contract Type",
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Flatten the advert to text and read its labelled fields.
 *
 * Tag-stripping first is what makes this robust: afterwards the pairs are a
 * simple "Label:  value" scan with each value running to the next known label,
 * which does not depend on the theme's class names or span nesting.
 */
export function advertFields(body: string): Record<string, string> {
  const text = decodeEntities(body.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

  const re = new RegExp(`(${KNOWN_LABELS.map(escapeRe).join("|")})\\s*:\\s*`, "gi");
  const marks: { label: string; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) marks.push({ label: m[1].toLowerCase(), end: m.index + m[0].length });

  const out: Record<string, string> = {};
  marks.forEach((mark, i) => {
    if (mark.label in out) return; // first occurrence wins
    const stop = i + 1 < marks.length ? marks[i + 1].end - marks[i + 1].label.length - 2 : text.length;
    out[mark.label] = text.slice(mark.end, Math.max(mark.end, stop)).trim();
  });
  return out;
}

/** "M-Pesa IMT Manager at Vodacom" → company "Vodacom", title the rest. */
function splitTitle(rawTitle: string): { title: string; company: string } {
  const m = /^(.{3,140}?)\s+at\s+(.{2,80})$/.exec(rawTitle);
  if (!m) return { title: rawTitle, company: "" };
  return { title: m[1].trim(), company: m[2].trim() };
}

/**
 * Map the advert's own wording onto the canonical vocabulary. Returns "" for
 * anything unrecognised (including the label leaking through as a value), so
 * an unknown advert keeps the caller's default instead of being mislabelled.
 */
export function normalizeEmployment(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (!s) return "";
  // Both words means the label itself came through — not a claim we can read.
  if (/full[\s-]?time/.test(s) && /part[\s-]?time/.test(s)) return "";
  if (/full[\s-]?time/.test(s)) return "full-time";
  if (/part[\s-]?time/.test(s)) return "part-time";
  if (/intern/.test(s)) return "internship";
  if (/contract/.test(s)) return "contract";
  if (/temporar|casual|seasonal/.test(s)) return "temporary";
  if (/permanent/.test(s)) return "permanent";
  return "";
}

/**
 * Feed URL for a 1-based page number. Page 1 is the bare feed URL — WordPress
 * serves the same items for `?paged=1`, and the canonical form keeps the first
 * request independent of the query string.
 */
export function feedPageUrl(page: number): string {
  return page <= 1 ? FEED_URL : `${FEED_URL}?paged=${page}`;
}

/** How many feed pages one run may walk. Bounded so the crawl cannot spin. */
export function maxPages(): number {
  const raw = Number(process.env[MAX_PAGES_ENV]);
  if (Number.isFinite(raw) && raw > 0) return Math.min(Math.floor(raw), 200);
  return DEFAULT_MAX_PAGES;
}

/** How old a posting may be and still be imported. 0 = no age limit. */
export function maxAgeDays(): number {
  const raw = Number(process.env[MAX_AGE_DAYS_ENV]);
  if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return DEFAULT_MAX_AGE_DAYS;
}

/**
 * Map ONE <item> block onto a RawJob. Returns null for an item we cannot link
 * back to — an unpublishable listing is dropped, never guessed at.
 * Exported so the page/date logic can be tested against real feed shapes.
 */
export function mapFeedItem(block: string): RawJob | null {
  const link = rssValue(block, "link");
  if (!link) return null; // a listing we cannot link back to is not publishable

  const guid = rssValue(block, "guid");
  const postId = /[?&]p=(\d+)/.exec(guid)?.[1];
  const { title, company } = splitTitle(rssValue(block, "title"));

  // content:encoded carries the full advert; <description> is a teaser of
  // the same text. Prefer the fuller one, fall back so a feed missing the
  // extension still yields a usable description.
  const body = rssValue(block, "content:encoded") || rssValue(block, "description");
  const fields = advertFields(body);

  const pubDate = rssValue(block, "pubDate");
  const posted = pubDate ? new Date(pubDate) : null;
  const location = (fields["posting country"] || "").trim();

  return {
    title,
    company,
    // The board is Tanzania-only (its own feed is titled "Jobs in
    // Tanzania"), so an advert that does not state a country is still a
    // Tanzanian advert. Where the advert DOES state one, that wins.
    location: location || "Tanzania",
    category: "",
    employmentType:
      normalizeEmployment(fields["full time / part time"] || "") ||
      normalizeEmployment(fields["contract type"] || "") ||
      "full-time",
    description: body,
    applyUrl: link,
    sourceUrl: link,
    externalId: postId || link,
    remote: false,
    postedAt: posted && !Number.isNaN(posted.getTime()) ? posted : null,
  };
}

export const jobwebTanzaniaAdapter: JobSourceAdapter = {
  id: "jobwebtanzania",
  name: "JobwebTanzania",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const pages = maxPages();
    const days = maxAgeDays();
    const cutoff = days > 0 ? Date.now() - days * DAY_MS : null;

    const seen = new Set<string>();
    const out: RawJob[] = [];

    for (let start = 1; start <= pages; start += PAGE_BATCH) {
      const batch: number[] = [];
      for (let p = start; p < Math.min(start + PAGE_BATCH, pages + 1); p++) batch.push(p);

      const results = await Promise.all(
        batch.map((page) =>
          fetchText(feedPageUrl(page)).then(
            (xml) => ({ page, xml, error: null as unknown }),
            (error: unknown) => ({ page, xml: "", error }),
          ),
        ),
      );

      // Every page of the FIRST batch failing is a real outage: throw so the
      // registry reports this source as FAILED instead of reporting a silent,
      // successful zero.
      const allFailed = results.every((r) => r.error !== null);
      if (allFailed) {
        const detail = String((results[0].error as Error)?.message ?? results[0].error);
        if (start === 1) throw results[0].error;
        console.warn(
          `[jobs] source jobwebtanzania stopped paging at page ${start}: pages ${start}-${start + batch.length - 1} all failed — ${detail}`,
        );
        break;
      }
      // A page failing mid-crawl is logged, not swallowed: the rest of the
      // crawl continues and the loss is visible in the count.
      for (const r of results) {
        if (r.error) {
          console.warn(
            `[jobs] source jobwebtanzania page ${r.page} failed: ${String((r.error as Error)?.message ?? r.error)}`,
          );
        }
      }

      let fresh = 0;
      for (const r of results) {
        for (const block of rssItems(r.xml)) {
          const job = mapFeedItem(block);
          if (!job) continue;
          // Age window: an advert dated outside it is dead archive, not
          // supply. One with no usable date is kept — no basis to exclude it.
          const posted = job.postedAt?.getTime();
          if (cutoff !== null && posted !== undefined && posted < cutoff) continue;
          if (seen.has(job.externalId)) continue; // paging overlap guard
          seen.add(job.externalId);
          fresh += 1;
          out.push(job);
        }
      }

      // Pages run newest → oldest, so a page contributing nothing new means
      // every later page falls outside the window too.
      if (fresh === 0) break;
    }

    return out;
  },
};
