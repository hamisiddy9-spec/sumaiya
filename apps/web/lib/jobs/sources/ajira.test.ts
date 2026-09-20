/**
 * Ajira Portal adapter tests.
 *
 * The fixtures below are TRANSCRIBED from the live listing page
 * (https://www.ajira.go.tz/recruitment_management, captured 20 Sep 2026):
 * advert anchors carry the theme's `adv_color` class, href to a PDF under
 * /baseattachments/advertisementattachments/, and wrap an <img> badge before
 * the announcement text.
 *
 * The two contract facts these tests pin down:
 *   1. Only NAFASI (position) announcements are vacancies. The page's other
 *      rows — KUITWA KWENYE USAILI (invitation to interview) and KUITWA KAZINI
 *      (deployment notice) — are real content but NOT jobs, and must never be
 *      published as openings.
 *   2. The employer is read out of the source's own title, never invented.
 */
import { describe, expect, it } from "vitest";
import { advertUrl, ajiraAdapter, parseAjiraListing } from "./ajira";

/** One real advert anchor, byte-for-byte the shape the portal serves. */
const advert = (file: string, text: string) => `
  <div class="col-sm-12 col-12 nopaddiv" style="padding-left:2px;">
    <div class="media advert_news_med_body advert_media">
      <div class="media-body media-padding10 advert_news_med_body" style="margin-left:0px;">
        <h3 class="title-medium-dark mb-none advert_news_title">
          <a href="/baseattachments/advertisementattachments/${file}" class="adv_color" target="_blank">
            <img src="/includes/img/new.gif" alt="news" class="img-fluid" style="width:30px;"> ${text}
          </a>
        </h3>
      </div>
    </div>
  </div>`;

const LISTING = `<html><body>
  <div class="topic-box-lg color-cod-gray">Advertisement</div>
  ${advert(
    "20260809102353TANGAZO WANGING'OMBE- 2026.pdf",
    "TANGAZO LA NAFASI ZA KAZI HALMASHAURI YA WILAYA YA WANGING’OMBE 08-09-2026",
  )}
  ${advert(
    "20261609221031VACANCIES ANNOUNCEMENT AT THE UNIVERSITY OF DODOMA.pdf",
    "TANGAZO LA NAFASI ZA KAZI CHUO KIKUU CHA DODOMA 16-09-2026",
  )}
  ${advert(
    "20261909421858TANGAZO LA KAZI -MTENDAJI MKUU BARAZA LA UWEZESHAJI.pdf",
    "TANGAZO LA NAFASI YA KAZI BARAZA LA TAIFA LA UWEZESHAJI WANANCHI KIUCHUMI (NEEC) 19-09-2026",
  )}
  ${advert(
    "20261809360706TANGAZO LA KAZI ZA KUJITOLEA WMA.pdf",
    "TANGAZO LA NAFASI ZA KUJITOLEA WAKALA WA VIPIMO 18-09-2026",
  )}
  ${advert(
    "20260708342103TANGAZO LA KUITWA KWENYE USAILI TAREHE 07 AGOSTI, 2026.pdf",
    "TANGAZO LA KUITWA KWENYE USAILI TAASISI MBALIMBALI ZA UMMA 07-08-2026",
  )}
  ${advert(
    "20260209511618TANGAZO LA KUITWA KAZINI 53.pdf",
    "TANGAZO LA KUITWA KAZINI TAASISI MBALIMBALI ZA UMMA 09-09-2026",
  )}
  <nav><a href="/whoarewe" class="nav">Who are we?</a></nav>
</body></html>`;

describe("advertUrl", () => {
  it("absolutises a portal-relative advert path", () => {
    expect(advertUrl("/baseattachments/advertisementattachments/x.pdf")).toBe(
      "https://www.ajira.go.tz/baseattachments/advertisementattachments/x.pdf",
    );
  });

  it("escapes the spaces the portal really has in its filenames", () => {
    expect(advertUrl("/baseattachments/advertisementattachments/A B.pdf")).toBe(
      "https://www.ajira.go.tz/baseattachments/advertisementattachments/A%20B.pdf",
    );
  });

  it("leaves an absolute URL alone", () => {
    const abs = "https://www.ajira.go.tz/baseattachments/advertisementattachments/x.pdf";
    expect(advertUrl(abs)).toBe(abs);
  });
});

describe("parseAjiraListing", () => {
  const { adverts, skipped } = parseAjiraListing(LISTING);

  it("reads only the vacancy announcements", () => {
    expect(adverts).toHaveLength(4);
  });

  it("counts the interview and deployment notices it refused to publish as jobs", () => {
    // KUITWA KWENYE USAILI + KUITWA KAZINI — real rows, not vacancies.
    expect(skipped).toBe(2);
  });

  it("keeps the source's own wording as the title and moves the date out of it", () => {
    const dodoma = adverts.find((a) => a.employer.includes("DODOMA"))!;
    expect(dodoma.title).toBe("TANGAZO LA NAFASI ZA KAZI CHUO KIKUU CHA DODOMA");
    expect(dodoma.postedAt?.toISOString()).toBe("2026-09-16T00:00:00.000Z");
  });

  it("reads the employer out of the announcement's own prefix+date", () => {
    expect(adverts.map((a) => a.employer)).toEqual([
      "HALMASHAURI YA WILAYA YA WANGING’OMBE",
      "CHUO KIKUU CHA DODOMA",
      "BARAZA LA TAIFA LA UWEZESHAJI WANANCHI KIUCHUMI (NEEC)",
      "WAKALA WA VIPIMO",
    ]);
  });

  it("points each advert at its own PDF on the portal", () => {
    expect(adverts[1].applyUrl).toBe(
      "https://www.ajira.go.tz/baseattachments/advertisementattachments/20261609221031VACANCIES%20ANNOUNCEMENT%20AT%20THE%20UNIVERSITY%20OF%20DODOMA.pdf",
    );
  });

  it("ignores the page's ordinary navigation links", () => {
    expect(adverts.some((a) => a.applyUrl.includes("whoarewe"))).toBe(false);
  });

  it("returns nothing (rather than guessing) when the advert block is absent", () => {
    expect(parseAjiraListing("<html><body><p>redesigned page</p></body></html>")).toEqual({
      adverts: [],
      skipped: 0,
    });
  });

  it("does not publish the same advert twice", () => {
    const { adverts: once } = parseAjiraListing(LISTING + LISTING);
    expect(once).toHaveLength(4);
  });
});

describe("ajira adapter", () => {
  it("is keyless, named for the government portal, and Tanzania-only", () => {
    expect(ajiraAdapter.enabled()).toBe(true);
    expect(ajiraAdapter.name).toContain("Ajira");
    expect(ajiraAdapter.id).toBe("ajira");
  });

  it("maps the real listing page onto raw jobs based in Tanzania", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(LISTING, { status: 200, headers: { "content-type": "text/html" } })) as typeof fetch;
    try {
      const jobs = await ajiraAdapter.fetch();
      expect(jobs).toHaveLength(4);

      const first = jobs[0];
      expect(first.location).toBe("Tanzania");
      expect(first.category).toBe("Government");
      expect(first.company).toBe("HALMASHAURI YA WILAYA YA WANGING’OMBE");
      // Title and employer are never the same string (no echo-as-company).
      expect(first.company).not.toBe(first.title);
      expect(first.applyUrl).toMatch(/^https:\/\/www\.ajira\.go\.tz\//);
      expect(first.remote).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("marks the source's own volunteer wording as a volunteer engagement", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response(LISTING, { status: 200 })) as typeof fetch;
    try {
      const jobs = await ajiraAdapter.fetch();
      const volunteer = jobs.find((j) => j.title.includes("KUJITOLEA"))!;
      expect(volunteer.employmentType).toBe("volunteer");
      const paid = jobs.find((j) => j.title.includes("DODOMA"))!;
      expect(paid.employmentType).toBe("full-time");
    } finally {
      globalThis.fetch = original;
    }
  });
});
