/**
 * ReliefWeb — UN OCHA's humanitarian job board, read through its OFFICIAL,
 * DOCUMENTED public RSS feeds.
 *
 *   Feed index : https://reliefweb.int/rss      ("Jobs (or Customize)")
 *   Jobs feed  : https://reliefweb.int/jobs/rss.xml
 *   Per country: https://reliefweb.int/jobs/rss.xml?advanced-search=%28C244%29
 *
 * WHY THIS SOURCE EXISTS: above the artisan/trade level, a large share of
 * Tanzania's salaried vacancies are NGO, donor and international-organisation
 * roles — which none of the remote-tech boards carry and which a Tanzania-only
 * commercial board only partly covers. ReliefWeb is the canonical feed for
 * that market (UN agencies, INGOs, national NGOs), it is published by OCHA
 * specifically so third parties can subscribe, and it needs no key, no account
 * and no scraping.
 *
 * WHY RSS AND NOT THE API: `api.reliefweb.int/v2` returns
 *   403 {"type":"AccessDeniedHttpException","message":"You are not using an
 *   approved appname. Kindly request an appname from ReliefWeb here: ..."}
 * for an unregistered appname (verified against the live API on 20 Sep 2026).
 * `api.reliefweb.int/v1` is decommissioned and answers HTTP 410 "The API
 * version 'v1' has been decommissioned. Please use version 'v2' instead."
 * ReliefWeb's own documentation states that from 1 November 2025 API users
 * require a pre-approved appname, obtained by request. The API is therefore
 * NOT implemented here — inventing an approved appname is not an option, and
 * the RSS channel is the documented, permitted alternative. If an appname is
 * ever granted (RELIEFWEB_APPNAME), an API-backed adapter can replace this one
 * and would be the more robust path.
 *
 * RATE LIMITING AND BOT BLOCKING, measured (20 Sep 2026):
 *   - Bursting the feed answered `HTTP 429`, body "Access to RSS feeds is
 *     limited", and recovered to 200 once the burst stopped.
 *   - More seriously, the endpoint answers EVERY request made by Node's fetch
 *     client (undici — the client this project's adapters use) with
 *         HTTP 406 {"error":"Blocked due to bot activity.", "info": ...}
 *     regardless of User-Agent, `Accept` or `Accept-Language`: eight header
 *     permutations were tried and all eight were refused, while the identical
 *     request from curl returned HTTP 200 with 213 KB of real feed. The
 *     refusal is a client/transport fingerprint decision at ReliefWeb's edge,
 *     not a header this code can set.
 *
 * CONSEQUENCE — this adapter is DISABLED BY DEFAULT and is NOT relied upon.
 * ReliefWeb is rejected as a source on ACCESS grounds, not legality: the
 * documented API path needs a pre-approved appname this project does not have,
 * and the documented RSS path refuses this runtime. The adapter is kept, fully
 * tested against the real feed shape, so it activates the moment the access
 * problem is solved — set RELIEFWEB_ENABLE=1 and register it for real. Until
 * then it is SKIPPED, never silently failing.
 *
 * Country codes are ReliefWeb's own taxonomy ids, each VERIFIED by fetching the
 * feed and reading its <channel><title> (e.g. C244 → "ReliefWeb - United
 * Republic of Tanzania (Tanzania) Jobs"). The feed's `advanced-search` query
 * parameter is ReliefWeb's documented search syntax.
 */
import type { JobSourceAdapter, RawJob } from "./types";
import { fetchText, rssItems, rssValue } from "./shared";

const FEED_BASE = "https://reliefweb.int/jobs/rss.xml";
const COUNTRIES_ENV = "RELIEFWEB_COUNTRIES";

const DAY_MS = 86_400_000;

/**
 * Verified country code → display name. Every code here was confirmed by
 * fetching `?advanced-search=(Cn)` and reading the channel title back; the
 * Tanzania feed is the one that matters most, the rest are Tanzania's
 * neighbours and the wider region the product treats as "nearby".
 */
export const RELIEFWEB_COUNTRIES: Record<string, string> = {
  Tanzania: "C244",
  Kenya: "C131",
  Uganda: "C240",
  Rwanda: "C198",
  Somalia: "C216",
  Malawi: "C146",
  Mozambique: "C164",
  Zambia: "C256",
  Zimbabwe: "C257",
  Madagascar: "C144",
};

/** Default set: Tanzania first, then its immediate neighbours. */
export const RELIEFWEB_DEFAULT_COUNTRIES = ["Tanzania", "Kenya", "Uganda", "Rwanda", "Somalia"];

/** Countries this run will read (env override accepts names or raw C-codes). */
export function reliefWebCountries(): { code: string; name: string }[] {
  const raw = (process.env[COUNTRIES_ENV] || "").trim();
  const names = raw
    ? raw.split(",").map((c) => c.trim()).filter(Boolean)
    : RELIEFWEB_DEFAULT_COUNTRIES;

  const out: { code: string; name: string }[] = [];
  for (const n of names) {
    const byName = RELIEFWEB_COUNTRIES[n] || RELIEFWEB_COUNTRIES[
      Object.keys(RELIEFWEB_COUNTRIES).find((k) => k.toLowerCase() === n.toLowerCase()) || ""
    ];
    if (byName) {
      out.push({ code: byName, name: n });
      continue;
    }
    // A raw taxonomy id (C244) is honoured as-is — the source owner can add a
    // country without a code change.
    if (/^C\d+$/.test(n)) out.push({ code: n, name: n });
  }
  return out;
}

/** Tanzania job feed URL — also the shape every other country feed uses. */
export function countryFeedUrl(code: string): string {
  return `${FEED_BASE}?advanced-search=%28${encodeURIComponent(code)}%29`;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * "Closing date: 5 Oct 2026" → a UTC Date, or null when unreadable. Parsed
 * explicitly rather than via Date.parse so the result is deterministic across
 * runtimes (and in tests).
 */
export function parseClosingDate(raw: string): Date | null {
  const m = /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/.exec(raw || "");
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
  if (month < 0) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The `tag country` div ReliefWeb puts in every item: the real duty station. */
export function itemCountry(raw: string): string {
  return (/\bCountries?:\s*([^<\n]+)/i.exec(raw || "")?.[1] || "").trim().replace(/\s+$/, "");
}

/** The `tag source` div — the hiring organisation, not the publishing board. */
export function itemOrganization(raw: string): string {
  return (/\bOrganization:\s*([^<\n]+)/i.exec(raw || "")?.[1] || "").trim();
}

/** Closing date text, e.g. "5 Oct 2026". */
export function itemClosingDate(raw: string): string {
  return (/\bClosing date:\s*([^<\n]+)/i.exec(raw || "")?.[1] || "").trim();
}

/** ReliefWeb's numeric job id, from /job/4230470/some-slug. */
export function reliefWebJobId(url: string): string {
  return /\/job\/(\d+)\//.exec(url || "")?.[1] || "";
}

/**
 * Map ONE RSS <item> to a RawJob, dropping anything we cannot pin to a real
 * ReliefWeb posting. `countryName` is the feed's own country, used only as a
 * location fallback when the item names none.
 */
export function mapReliefWebItem(block: string, countryName: string): RawJob | null {
  const link = rssValue(block, "link") || rssValue(block, "guid");
  if (!link || !/^https?:\/\//i.test(link)) return null;

  const id = reliefWebJobId(link);
  if (!id) return null; // no stable source id → not deduplicable, don't publish

  const title = rssValue(block, "title");
  if (!title) return null;

  // <description> carries escaped HTML; rssValue has already decoded it.
  const body = rssValue(block, "description");
  const countries = itemCountry(body);
  const closing = itemClosingDate(body);

  const pubDate = rssValue(block, "pubDate");
  const posted = pubDate ? new Date(pubDate) : null;

  return {
    title,
    company: itemOrganization(body),
    location: countries || countryName,
    category: "Humanitarian / NGO",
    // ReliefWeb does not publish a structured employment type; the postings are
    // salaried staff or consultancy roles, so the canonical default stands
    // rather than a guess.
    employmentType: "full-time",
    description: body,
    applyUrl: link,
    sourceUrl: link,
    externalId: id,
    applicationDeadline: parseClosingDate(closing),
    postedAt: posted && !Number.isNaN(posted.getTime()) ? posted : null,
    remote: /\bremote|home[- ]based|telework/i.test(`${countries} ${title}`),
  };
}

export const reliefWebAdapter: JobSourceAdapter = {
  id: "reliefweb",
  name: "ReliefWeb (UN OCHA)",
  /**
   * DISABLED by default. ReliefWeb's edge blocks this runtime's fetch client
   * outright (HTTP 406 "Blocked due to bot activity") and its API needs a
   * pre-approved appname — see the header. enable() stays false until the
   * access problem is solved and RELIEFWEB_ENABLE=1 is set, so a run never
   * spends time on a source that cannot answer.
   */
  enabled: () => process.env.RELIEFWEB_ENABLE === "1" && reliefWebCountries().length > 0,
  async fetch(): Promise<RawJob[]> {
    const countries = reliefWebCountries();
    // A posting whose closing date has passed is archive, not supply.
    const staleBefore = Date.now() - DAY_MS;

    const seen = new Set<string>();
    const out: RawJob[] = [];

    // SEQUENTIAL on purpose. Firing every country feed at once (Promise.all)
    // is what a burst-throttled endpoint refuses; one request at a time is the
    // pattern that kept returning HTTP 200 during the audit. Five small XML
    // documents, a few seconds total, and nothing for a limiter to reject.
    const results: { code: string; name: string; xml: string; error: unknown }[] = [];
    for (const c of countries) {
      try {
        results.push({ ...c, xml: await fetchText(countryFeedUrl(c.code)), error: null });
      } catch (error) {
        results.push({ ...c, xml: "", error });
      }
    }

    // Every feed failing is a real outage — surface it as a failed source
    // rather than a silent zero.
    if (results.length && results.every((r) => r.error !== null)) {
      throw results[0].error;
    }
    for (const r of results) {
      if (r.error) {
        console.warn(
          `[jobs] source reliefweb country ${r.name} (${r.code}) failed: ${String((r.error as Error)?.message ?? r.error)}`,
        );
      }
    }

    for (const r of results) {
      for (const block of rssItems(r.xml)) {
        const job = mapReliefWebItem(block, r.name);
        if (!job) continue;
        const deadline = job.applicationDeadline?.getTime();
        if (deadline !== undefined && deadline < staleBefore) continue; // closed
        // A regional posting appears in every country feed it is tagged with —
        // ReliefWeb's job id collapses it to one listing.
        if (seen.has(job.externalId)) continue;
        seen.add(job.externalId);
        out.push(job);
      }
    }

    return out;
  },
};
