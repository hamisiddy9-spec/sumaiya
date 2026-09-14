/**
 * JobwebTanzania adapter tests.
 *
 * The advert markup below mirrors the REAL feed's structure (11 Sep 2026):
 * label→value pairs, e.g. the label "Full Time / Part Time:" followed by the
 * value "Full Time". That shape is the whole reason this file exists — the
 * first version of the adapter searched the description for /part.?time/ and
 * reported every Vodacom manager as part-time, because it matched the LABEL.
 */
import { describe, expect, it } from "vitest";
import { decodeEntities, rssItems, rssValue } from "./shared";
import { advertFields, jobwebTanzaniaAdapter, normalizeEmployment } from "./jobwebtanzania";

const item = (opts: {
  title: string;
  slug: string;
  postId: string;
  pubDate: string;
  country: string;
  timeType: string;
  contractType?: string;
}) => `
		<title>${opts.title}</title>
		<link>https://www.jobwebtanzania.com/jobs/${opts.slug}/</link>
		<pubDate>${opts.pubDate}</pubDate>
		<dc:creator><![CDATA[jobwebtanzania2]]></dc:creator>
		<guid isPermaLink="false">https://www.jobwebtanzania.com/?post_type=job_listing&#038;p=${opts.postId}</guid>
		<content:encoded><![CDATA[<div class="joblayouttoken"><span class="joblayouttoken-label">Posting Country:  </span><span class="v">${opts.country}</span></div><div class="joblayouttoken"><span class="joblayouttoken-label">Full Time / Part Time:  </span><span class="v">${opts.timeType}</span></div><div class="joblayouttoken"><span class="joblayouttoken-label">Contract Type:  </span><span class="v">${opts.contractType ?? "Permanent"}</span></div>]]></content:encoded>
`;

const FEED = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>
	<title>JobwebTanzania</title>
	<link>https://www.jobwebtanzania.com</link>
	<item>${item({ title: "M-Pesa IMT Manager at Vodacom", slug: "m-pesa-imt-manager-at-vodacom", postId: "69927", pubDate: "Fri, 11 Sep 2026 13:10:26 +0000", country: "Tanzania, United Republic of", timeType: "Full Time" })}</item>
	<item>${item({ title: "Warehouse Supervisor at SBC Tanzania", slug: "warehouse-supervisor-at-sbc-tanzania", postId: "69901", pubDate: "Wed, 09 Sep 2026 08:00:00 +0000", country: "Kenya", timeType: "Part Time" })}</item>
</channel></rss>`;

describe("rss helpers", () => {
  it("splits items and ignores the channel head", () => {
    expect(rssItems(FEED)).toHaveLength(2);
  });

  it("unwraps CDATA and decodes the entities WordPress emits", () => {
    const block = rssItems(FEED)[0];
    expect(rssValue(block, "guid")).toBe(
      "https://www.jobwebtanzania.com/?post_type=job_listing&p=69927",
    );
    expect(rssValue(block, "dc:creator")).toBe("jobwebtanzania2");
  });

  it("decodes &amp; last so &amp;lt; does not become a tag", () => {
    expect(decodeEntities("&amp;lt;b&amp;gt;")).toBe("&lt;b&gt;");
    expect(decodeEntities("Tom &amp; Jerry")).toBe("Tom & Jerry");
  });
});

describe("advertFields", () => {
  it("reads label→value pairs, not labels", () => {
    const f = advertFields(
      `<span class="joblayouttoken-label">Posting Country:  </span><span>Tanzania, United Republic of</span>` +
        `<span class="joblayouttoken-label">Full Time / Part Time:  </span><span>Full Time</span>`,
    );
    expect(f["posting country"]).toBe("Tanzania, United Republic of");
    expect(f["full time / part time"]).toBe("Full Time");
  });

  it("returns nothing for an advert with no labels", () => {
    expect(advertFields("<p>Just a paragraph.</p>")).toEqual({});
  });
});

describe("normalizeEmployment", () => {
  it("maps the advert's own wording", () => {
    expect(normalizeEmployment("Full Time")).toBe("full-time");
    expect(normalizeEmployment("Part Time")).toBe("part-time");
    expect(normalizeEmployment("Contract")).toBe("contract");
    expect(normalizeEmployment("Internship")).toBe("internship");
    expect(normalizeEmployment("")).toBe("");
  });

  it("refuses a value that is really the label leaking through", () => {
    // "Full Time / Part Time" as a VALUE is ambiguous — never guess from it.
    expect(normalizeEmployment("Full Time / Part Time")).toBe("");
  });
});

describe("jobwebtanzania adapter", () => {
  it("is keyless and named for the feed", () => {
    expect(jobwebTanzaniaAdapter.enabled()).toBe(true);
    expect(jobwebTanzaniaAdapter.name).toBe("JobwebTanzania");
  });

  it("maps a real feed item without inventing a field", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(FEED, { status: 200, headers: { "content-type": "application/rss+xml" } })) as typeof fetch;
    try {
      const jobs = await jobwebTanzaniaAdapter.fetch();
      expect(jobs).toHaveLength(2);

      const [first, second] = jobs;
      expect(first.title).toBe("M-Pesa IMT Manager");
      expect(first.company).toBe("Vodacom");
      expect(first.location).toBe("Tanzania, United Republic of");
      expect(first.externalId).toBe("69927");
      expect(first.applyUrl).toBe(
        "https://www.jobwebtanzania.com/jobs/m-pesa-imt-manager-at-vodacom/",
      );
      expect(first.postedAt?.toISOString()).toBe("2026-09-11T13:10:26.000Z");
      expect(first.remote).toBe(false);

      // A stated country beats the board's default; part-time is honoured.
      expect(second.location).toBe("Kenya");
      expect(second.employmentType).toBe("part-time");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("does NOT report a full-time manager as part-time (the label trap)", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(FEED, { status: 200 })) as typeof fetch;
    try {
      const jobs = await jobwebTanzaniaAdapter.fetch();
      const manager = jobs.find((j) => j.title.includes("M-Pesa IMT Manager"))!;
      expect(manager.employmentType).toBe("full-time");
      expect(manager.employmentType).not.toBe("part-time");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("falls back to the board's own country when the advert states none", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        `<rss><channel><item><title>Driver at Kilimanjaro Coaches</title><link>https://www.jobwebtanzania.com/jobs/driver/</link><guid>https://x/?p=5</guid><content:encoded><![CDATA[<p>No labelled fields here.</p>]]></content:encoded></item></channel></rss>`,
        { status: 200 },
      )) as typeof fetch;
    try {
      const [job] = await jobwebTanzaniaAdapter.fetch();
      expect(job.location).toBe("Tanzania");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("drops an item it cannot link back to", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("<rss><channel><item><title>No link</title></item></channel></rss>", {
        status: 200,
      })) as typeof fetch;
    try {
      expect(await jobwebTanzaniaAdapter.fetch()).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
