/**
 * JobwebTanzania PAGING tests — the regression that cost this feed 1,839 of
 * its 1,849 listings.
 *
 * The measured bug: WordPress serves `posts_per_rss` items per feed page and
 * this site uses the default of 10, so the adapter's single request for
 * `/feed` returned exactly ten rows while the catalogue (measured from the
 * site's own sitemaps: 1,001 + 848 job_listing URLs) held ~1,849. Ten was one
 * page of a paginated feed, never a catalogue size or a swallowed error.
 *
 * These tests pin the three things that fix it:
 *   1. the crawl WALKS `?paged=N`;
 *   2. it STOPS on the age window / an empty page, so it never imports the
 *      whole archive or spins forever;
 *   3. a page-1 outage is a FAILED source, not a silent successful zero.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  feedPageUrl,
  jobwebTanzaniaAdapter,
  mapFeedItem,
  maxAgeDays,
  maxPages,
} from "./jobwebtanzania";

const DAY_MS = 86_400_000;

/** One real feed item. `current-date` keeps it inside any age window. */
const item = (opts: { postId: string; title: string; daysAgo?: number }) => {
  const when = new Date(Date.now() - (opts.daysAgo ?? 0) * DAY_MS).toUTCString();
  return `
    <item>
      <title>${opts.title}</title>
      <link>https://www.jobwebtanzania.com/jobs/some-slug/</link>
      <pubDate>${when}</pubDate>
      <guid isPermaLink="false">https://www.jobwebtanzania.com/?post_type=job_listing&#038;p=${opts.postId}</guid>
      <content:encoded><![CDATA[<div class="joblayouttoken"><span class="joblayouttoken-label">Posting Country:  </span><span class="v">Tanzania</span></div><div class="joblayouttoken"><span class="joblayouttoken-label">Full Time / Part Time:  </span><span class="v">Full Time</span></div>]]></content:encoded>
    </item>`;
};

const feed = (...items: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>JobwebTanzania</title>${items.join("")}</channel></rss>`;

/** Page number from a feed URL: bare URL = page 1, `?paged=N` = page N. */
const pageOf = (url: string): number => Number(/[?&]paged=(\d+)/.exec(url)?.[1] ?? 1);

afterEach(() => {
  delete process.env.JOBWEBTANZANIA_MAX_PAGES;
  delete process.env.JOBWEBTANZANIA_MAX_AGE_DAYS;
  vi.restoreAllMocks();
});

describe("feedPageUrl", () => {
  it("uses the canonical feed for page 1 and the paged form after that", () => {
    expect(feedPageUrl(1)).toBe("https://www.jobwebtanzania.com/feed/");
    expect(feedPageUrl(3)).toBe("https://www.jobwebtanzania.com/feed/?paged=3");
  });
});

describe("paging bounds", () => {
  it("defaults to a bounded number of pages and an age window", () => {
    delete process.env.JOBWEBTANZANIA_MAX_PAGES;
    delete process.env.JOBWEBTANZANIA_MAX_AGE_DAYS;
    expect(maxPages()).toBe(45);
    expect(maxAgeDays()).toBe(60);
  });

  it("honours env overrides, and clamps pages so the crawl can never run away", () => {
    process.env.JOBWEBTANZANIA_MAX_PAGES = "12";
    expect(maxPages()).toBe(12);
    process.env.JOBWEBTANZANIA_MAX_PAGES = "99999";
    expect(maxPages()).toBe(200); // hard ceiling
    process.env.JOBWEBTANZANIA_MAX_AGE_DAYS = "0";
    expect(maxAgeDays()).toBe(0); // 0 = no age limit
    process.env.JOBWEBTANZANIA_MAX_AGE_DAYS = "90";
    expect(maxAgeDays()).toBe(90);
  });
});

describe("adapter crawl", () => {
  it("WALKS every page instead of publishing only page 1's ten", async () => {
    // Pages 1-3 carry one listing each; everything after is empty.
    const byPage: Record<number, string> = {
      1: feed(item({ postId: "1", title: "Driver at TANROADS" })),
      2: feed(item({ postId: "2", title: "Engineer II at TANROADS" })),
      3: feed(item({ postId: "3", title: "Branch Officer at BRAC" })),
    };
    const seen: number[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const p = pageOf(String(input));
      seen.push(p);
      return new Response(byPage[p] ?? feed(), { status: 200 });
    }) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    expect(jobs.map((j) => j.externalId)).toEqual(["1", "2", "3"]);
    expect(seen).toContain(3); // page 3 was really requested
  });

  it("stops as soon as a batch contributes nothing new (no archive import)", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const p = pageOf(String(input));
      return new Response(p === 1 ? feed(item({ postId: "1", title: "Cashier at Vodacom" })) : feed(), {
        status: 200,
      });
    }) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    expect(jobs).toHaveLength(1);
  });

  it("refuses postings older than the age window", async () => {
    process.env.JOBWEBTANZANIA_MAX_AGE_DAYS = "30";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const p = pageOf(String(input));
      const body =
        p === 1
          ? feed(
              item({ postId: "9001", title: "Fresh role at Vodacom", daysAgo: 2 }),
              item({ postId: "9002", title: "Stale role at Vodacom", daysAgo: 400 }),
            )
          : feed(item({ postId: String(9100 + p), title: "Ancient role at Vodacom", daysAgo: 900 }));
      return new Response(body, { status: 200 });
    }) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    // "Fresh role at Vodacom" → title "Fresh role", company "Vodacom"
    // (the feed gives no company field, so it is read from the title).
    expect(jobs.map((j) => `${j.title} @ ${j.company}`)).toEqual(["Fresh role @ Vodacom"]);
  });

  it("keeps an advert with no usable date (there is no basis to drop it)", async () => {
    globalThis.fetch = (async () =>
      new Response(
        `<rss><channel><item><title>Driver at Kilimanjaro Coaches</title><link>https://www.jobwebtanzania.com/jobs/driver/</link><guid>https://x/?p=7</guid></item></channel></rss>`,
        { status: 200 },
      )) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    expect(jobs).toHaveLength(1);
  });

  it("collapses a listing repeated across pages", async () => {
    globalThis.fetch = (async () =>
      new Response(feed(item({ postId: "dup", title: "Sales Officer at FINCA" })), { status: 200 })) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    expect(jobs).toHaveLength(1);
  });

  it("is capped by JOBWEBTANZANIA_MAX_PAGES", async () => {
    process.env.JOBWEBTANZANIA_MAX_PAGES = "1";
    const seen: number[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      seen.push(pageOf(String(input)));
      return new Response(feed(item({ postId: String(pageOf(String(input))), title: "X at Y" })), {
        status: 200,
      });
    }) as typeof fetch;

    await jobwebTanzaniaAdapter.fetch();
    expect(Math.max(...seen)).toBe(1);
  });

  it("THROWS when the feed is unreachable — a silent zero is not success", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    await expect(jobwebTanzaniaAdapter.fetch()).rejects.toThrow("network down");
  });

  it("survives a mid-crawl outage, keeping what it already read", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const p = pageOf(String(input));
      if (p <= 4) return new Response(feed(item({ postId: "1", title: "Driver at BRAC" })), { status: 200 });
      throw new Error("feed went away");
    }) as typeof fetch;

    const jobs = await jobwebTanzaniaAdapter.fetch();
    expect(jobs).toHaveLength(1);
  });
});

describe("mapFeedItem", () => {
  it("takes the post id from the item's own guid", () => {
    const job = mapFeedItem(item({ postId: "69927", title: "M-Pesa IMT Manager at Vodacom" }));
    expect(job?.externalId).toBe("69927");
    expect(job?.company).toBe("Vodacom");
    expect(job?.location).toBe("Tanzania");
  });

  it("returns null for an item with no link", () => {
    expect(mapFeedItem("<item><title>No link</title></item>")).toBeNull();
  });
});
