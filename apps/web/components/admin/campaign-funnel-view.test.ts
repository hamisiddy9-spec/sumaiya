/**
 * What the admin actually sees when the read fails.
 *
 * The fix this file protects is not a number, it is a sentence: "no poster
 * traffic recorded yet — this is a valid state, not an error" is a LIED answer
 * when the campaign_event query threw, because the same zeros mean the opposite
 * thing ("we could not look"). Both branches are rendered here and asserted on
 * the markup, because the defect was invisible to every unit test of the
 * aggregation: the numbers were right and the page still misinformed the reader.
 *
 * Rendered with react-dom/server rather than a DOM testing library — this
 * project's suite is node-only and the view is a pure function of the report.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampaignFunnelView } from "@/components/admin/campaign-funnel-view";
import { aggregateCampaignFunnel, type CampaignEventRow } from "@/lib/campaign/aggregate";

const SINCE = new Date("2026-08-18T09:00:00.000Z");
const AT = new Date("2026-09-17T09:00:00.000Z");

function html(rows: CampaignEventRow[], readFailed = false, truncated = false): string {
  const report = aggregateCampaignFunnel(rows, {
    windowDays: 30,
    since: SINCE,
    generatedAt: AT,
    readFailed,
    truncated,
  });
  return renderToStaticMarkup(createElement(CampaignFunnelView, { report }));
}

const row: CampaignEventRow = {
  src: "poster",
  name: "campaign_landing",
  visitorId: "visitor-1",
  props: {},
  createdAt: AT,
};

const NO_TRAFFIC = "Hakuna ushahidi wa bango bado";
const READ_FAILED = "Hatukuweza kusoma data";
const TRUNCATED = "kikomo cha ukurasa";

describe("campaign funnel view — a failed read is never rendered as an empty campaign", () => {
  it("says the data could not be read, and does NOT claim no poster traffic", () => {
    const out = html([], true);
    expect(out).toContain(READ_FAILED);
    expect(out).not.toContain(NO_TRAFFIC);
  });

  it("still renders the honest empty state when the read succeeded and there is nothing", () => {
    const out = html([]);
    expect(out).toContain(NO_TRAFFIC);
    expect(out).not.toContain(READ_FAILED);
  });

  it("renders the funnel when there is real data, and no warning at all", () => {
    const out = html([row]);
    expect(out).toContain('src=poster');
    expect(out).toContain("Walifika");
    expect(out).not.toContain(NO_TRAFFIC);
    expect(out).not.toContain(READ_FAILED);
    expect(out).not.toContain(TRUNCATED);
  });

  it("says a capped read is a floor rather than a total", () => {
    const out = html([row], false, true);
    expect(out).toContain(TRUNCATED);
    expect(out).not.toContain(READ_FAILED);
  });

  it("never renders NaN or Infinity, whatever the report says", () => {
    for (const out of [html([]), html([row]), html([], true, true), html([row], true, true)]) {
      expect(out).not.toMatch(/NaN|Infinity|undefined%/);
    }
  });
});
