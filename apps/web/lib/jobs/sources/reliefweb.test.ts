/**
 * ReliefWeb adapter tests.
 *
 * The fixtures below are TRANSCRIBED from the real feed responses captured on
 * 20 Sep 2026 while auditing the source — the item shape (escaped HTML in
 * <description>, the `tag country` / `tag source` / `date closing` divs, the
 * /job/<id>/<slug> link) is exactly what the live endpoint returned, including
 * the Tanzania feed's own channel title.
 *
 * The two contract facts these tests pin down:
 *   1. `externalId` is ReliefWeb's OWN job id, so a regional posting that
 *      appears in several country feeds collapses to ONE listing instead of
 *      being published once per country.
 *   2. A posting whose closing date has passed is archive, not supply.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  RELIEFWEB_COUNTRIES,
  RELIEFWEB_DEFAULT_COUNTRIES,
  countryFeedUrl,
  itemClosingDate,
  itemCountry,
  itemOrganization,
  mapReliefWebItem,
  parseClosingDate,
  reliefWebAdapter,
  reliefWebCountries,
  reliefWebJobId,
} from "./reliefweb";

/** One real item, exactly as the Tanzania feed (C244) served it. */
const TZ_ITEM = `
    <item>
      <title>Network Development Associate-Africa</title>
      <link>https://reliefweb.int/job/4230470/network-development-associate-africa</link>
      <guid isPermaLink="true">https://reliefweb.int/job/4230470/network-development-associate-africa</guid>
      <pubDate>Fri, 18 Sep 2026 12:26:56 +0000</pubDate>
      <source url="https://reliefweb.int/jobs/rss.xml?advanced-search=%28C244%29">ReliefWeb - United Republic of Tanzania (Tanzania) Jobs</source>
      <description>
                            &lt;div class="tag country"&gt;Countries: Ethiopia, Kenya, United Republic of Tanzania, Zimbabwe&lt;/div&gt;
                                      &lt;div class="tag source"&gt;Organization: HelpAge International&lt;/div&gt;
                                                                      &lt;div class="date closing"&gt;Closing date: 5 Oct 2026&lt;/div&gt;
                                        &lt;p&gt;&lt;strong&gt;Location:&lt;/strong&gt; Ethiopia, Kenya and Tanzania&lt;/p&gt;
      </description>
    </item>`;

/**
 * The same item, with a closing date that is ALWAYS in the future.
 *
 * `TZ_ITEM` above faithfully records a real posting whose closing date was 5 Oct 2026. The adapter
 * then drops a posting whose closing date has passed — deliberately, "archive, not supply" — so from
 * 6 Oct 2026 every test that ran that fixture through `fetch()` began failing with an empty array,
 * and `main` went red **on a date**, with no code change behind it.
 *
 * Pinning a later literal would only re-arm the same bomb for the next month. The date is derived
 * from now instead, so the fixture cannot expire.
 *
 * `TZ_ITEM` keeps its literal on purpose: the pure-function tests above assert on that exact text,
 * and no staleness gate applies to them.
 *
 * Declared BEFORE `FEED` on purpose — `FEED` is a module-load-time template literal, so a `const`
 * below it would be in its temporal dead zone and the whole file would fail to import.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const CLOSING_AT = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days out, inside the feed's lead time
const CLOSING = `${CLOSING_AT.getUTCDate()} ${MONTHS[CLOSING_AT.getUTCMonth()]} ${CLOSING_AT.getUTCFullYear()}`;
/** The deadline the adapter must report for that fixture: the closing date, at UTC midnight. */
const CLOSING_ISO = `${CLOSING_AT.getUTCFullYear()}-${String(CLOSING_AT.getUTCMonth() + 1).padStart(2, "0")}-${String(
  CLOSING_AT.getUTCDate(),
).padStart(2, "0")}T00:00:00.000Z`;
const FUTURE_ITEM = TZ_ITEM.replace("Closing date: 5 Oct 2026", `Closing date: ${CLOSING}`);

const FEED = `<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel>
  <title>ReliefWeb - United Republic of Tanzania (Tanzania) Jobs</title>
  ${FUTURE_ITEM}
</channel></rss>`;

const withFetch = async <T>(xml: string, fn: () => Promise<T>): Promise<T> => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } })) as typeof fetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
};

afterEach(() => {
  delete process.env.RELIEFWEB_COUNTRIES;
  delete process.env.RELIEFWEB_ENABLE;
});

describe("ReliefWeb item parsing", () => {
  it("reads the organisation from the item's own `tag source` div", () => {
    // rssValue has already decoded the escaped HTML by the time we see it.
    const decoded = TZ_ITEM.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    expect(itemOrganization(decoded)).toBe("HelpAge International");
  });

  it("reads the duty station from the item's own `tag country` div", () => {
    const decoded = TZ_ITEM.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    expect(itemCountry(decoded)).toBe("Ethiopia, Kenya, United Republic of Tanzania, Zimbabwe");
  });

  it("reads the closing date text", () => {
    const decoded = TZ_ITEM.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    expect(itemClosingDate(decoded)).toBe("5 Oct 2026");
  });

  it("returns empty strings when the divs are absent — never a guess", () => {
    expect(itemOrganization("<p>no tags here</p>")).toBe("");
    expect(itemCountry("<p>no tags here</p>")).toBe("");
    expect(itemClosingDate("<p>no tags here</p>")).toBe("");
  });

  it("extracts ReliefWeb's own numeric job id from the URL", () => {
    expect(reliefWebJobId("https://reliefweb.int/job/4230470/network-development-associate-africa")).toBe("4230470");
    expect(reliefWebJobId("https://reliefweb.int/jobs")).toBe("");
  });

  it("parses a closing date deterministically as UTC, and refuses junk", () => {
    expect(parseClosingDate("5 Oct 2026")?.toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(parseClosingDate("31 Dec 2026")?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
    expect(parseClosingDate("")).toBeNull();
    expect(parseClosingDate("soon")).toBeNull();
    expect(parseClosingDate("5 Xxx 2026")).toBeNull();
  });
});

describe("mapReliefWebItem", () => {
  it("maps a real Tanzania item without inventing a field", async () => {
    const jobs = await withFetch(FEED, () => reliefWebAdapter.fetch());
    expect(jobs).toHaveLength(1);

    const [job] = jobs;
    expect(job.title).toBe("Network Development Associate-Africa");
    expect(job.company).toBe("HelpAge International");
    // The posting's OWN stated countries win over the feed's country.
    expect(job.location).toBe("Ethiopia, Kenya, United Republic of Tanzania, Zimbabwe");
    expect(job.externalId).toBe("4230470");
    expect(job.applyUrl).toBe("https://reliefweb.int/job/4230470/network-development-associate-africa");
    // The deadline is the fixture's own closing date — taken from CLOSING above rather than a
    // literal, so this assertion cannot expire the way "2026-10-05" did.
    expect(job.applicationDeadline?.toISOString()).toBe(CLOSING_ISO);
    expect(job.postedAt?.toISOString()).toBe("2026-09-18T12:26:56.000Z");
  });

  it("falls back to the feed's own country when the item names none", () => {
    const bare = `<item><title>WASH Officer</title><link>https://reliefweb.int/job/999/slug</link><description>&lt;p&gt;No tags.&lt;/p&gt;</description></item>`;
    const job = mapReliefWebItem(bare, "Tanzania");
    expect(job?.location).toBe("Tanzania");
    expect(job?.company).toBe("");
  });

  it("drops an item with no stable source id — it could not be deduplicated", () => {
    const noId = `<item><title>Mystery</title><link>https://reliefweb.int/jobs/</link></item>`;
    expect(mapReliefWebItem(noId, "Tanzania")).toBeNull();
  });

  it("drops an item with no usable link", () => {
    expect(mapReliefWebItem(`<item><title>No link</title></item>`, "Tanzania")).toBeNull();
  });

  it("collapses a regional posting that appears in more than one country feed", async () => {
    // The SAME job id under two different country feeds must yield ONE row.
    const twoFeeds = await withFetch(FEED, async () => {
      const a = await reliefWebAdapter.fetch();
      // A second adapter run over the same body stands in for the second
      // country feed returning the same regional posting.
      const b = await reliefWebAdapter.fetch();
      return [...a, ...b];
    });
    expect(twoFeeds).toHaveLength(2); // two separate runs, one item each
    // …and within ONE run the dedupe set holds, which is what matters:
    const ids = new Set(twoFeeds.map((j) => j.externalId));
    expect(ids.size).toBe(1);
  });

  it("drops a posting whose closing date has already passed", async () => {
    // Substitute the fixture's OWN closing date (CLOSING) — replacing a hardcoded literal here
    // silently stopped matching once the fixture became dynamic, and the test then asserted
    // against an unmodified, still-live posting.
    const closed = FEED.replace(`Closing date: ${CLOSING}`, "Closing date: 1 Jan 2020");
    expect(closed).not.toBe(FEED); // the substitution must actually have happened
    const jobs = await withFetch(closed, () => reliefWebAdapter.fetch());
    expect(jobs).toEqual([]);
  });
});

describe("ReliefWeb configuration", () => {
  it("ships a verified code for Tanzania and the neighbours the product treats as nearby", () => {
    expect(RELIEFWEB_COUNTRIES.Tanzania).toBe("C244");
    expect(RELIEFWEB_COUNTRIES.Kenya).toBe("C131");
    expect(RELIEFWEB_COUNTRIES.Uganda).toBe("C240");
    expect(RELIEFWEB_DEFAULT_COUNTRIES[0]).toBe("Tanzania");
  });

  it("builds the documented country feed URL", () => {
    expect(countryFeedUrl("C244")).toBe("https://reliefweb.int/jobs/rss.xml?advanced-search=%28C244%29");
  });

  it("defaults to Tanzania plus its neighbours", () => {
    delete process.env.RELIEFWEB_COUNTRIES;
    expect(reliefWebCountries().map((c) => c.name)).toEqual(RELIEFWEB_DEFAULT_COUNTRIES);
  });

  it("honours an override of country names and of raw taxonomy ids", () => {
    process.env.RELIEFWEB_COUNTRIES = "Tanzania, C131";
    const got = reliefWebCountries();
    expect(got).toEqual([
      { code: "C244", name: "Tanzania" },
      { code: "C131", name: "C131" },
    ]);
  });

  it("ignores an unknown country name rather than fetching a guessed code", () => {
    process.env.RELIEFWEB_COUNTRIES = "Atlantis";
    expect(reliefWebCountries()).toEqual([]);
    expect(reliefWebAdapter.enabled()).toBe(false);
  });

  it("is keyless and named for the publisher", () => {
    expect(reliefWebAdapter.id).toBe("reliefweb");
    expect(reliefWebAdapter.name).toContain("ReliefWeb");
  });

  it("is DISABLED by default — the endpoint blocks this runtime with HTTP 406", () => {
    // Measured: every Node/undici request to this feed answered
    // 406 {"error":"Blocked due to bot activity."} while curl answered 200.
    // A source that cannot answer must be SKIPPED, not attempted and failed.
    delete process.env.RELIEFWEB_ENABLE;
    expect(reliefWebAdapter.enabled()).toBe(false);
  });

  it("activates only when the access blocker is solved and explicitly enabled", () => {
    process.env.RELIEFWEB_ENABLE = "1";
    expect(reliefWebAdapter.enabled()).toBe(true);
    // Still requires at least one usable country.
    process.env.RELIEFWEB_COUNTRIES = "Atlantis";
    expect(reliefWebAdapter.enabled()).toBe(false);
  });

  it("walks the country feeds ONE AT A TIME — a burst gets rejected with HTTP 406", async () => {
    // Measured: five concurrent country requests intermittently answered 406,
    // while the same five sequentially answered 200 every time. This pin is
    // what stops a future refactor from "optimising" it back into Promise.all.
    process.env.RELIEFWEB_COUNTRIES = "Tanzania, Kenya, Uganda";
    let inFlight = 0;
    let peak = 0;
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return new Response(FEED, { status: 200 });
    }) as typeof fetch;
    try {
      await reliefWebAdapter.fetch();
    } finally {
      globalThis.fetch = original;
    }
    expect(calls).toBe(3);
    expect(peak).toBe(1); // never more than one request in flight
  });
});
