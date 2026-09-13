/**
 * JobwebTanzania — a Tanzania-only job board, read through its RSS feed.
 * https://www.jobwebtanzania.com/feed
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
 * Nothing here is inferred. `externalId` comes from the post id in the item's
 * own <guid>, the URLs from the item's <link>, and location/employment type
 * from the advert's OWN labelled fields. The feed gives a title, not a company
 * field, so the company is only ever the text the source itself wrote after
 * " at " in that title.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { decodeEntities, fetchText, rssItems, rssValue } from "./shared";

const FEED_URL = "https://www.jobwebtanzania.com/feed";

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

export const jobwebTanzaniaAdapter: JobSourceAdapter = {
  id: "jobwebtanzania",
  name: "JobwebTanzania",
  enabled: () => true, // keyless
  async fetch(): Promise<RawJob[]> {
    const xml = await fetchText(FEED_URL);
    const out: RawJob[] = [];

    for (const block of rssItems(xml)) {
      const link = rssValue(block, "link");
      if (!link) continue; // a listing we cannot link back to is not publishable

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

      out.push({
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
      });
    }

    return out;
  },
};
