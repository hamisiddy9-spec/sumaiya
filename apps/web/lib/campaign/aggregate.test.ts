/**
 * The campaign funnel rollup is the answer to "did the poster produce anyone?".
 * These tests pin the three ways a rollup view lies:
 *
 *   1. it invents a denominator — a percentage over nobody (NaN / Infinity / 0%)
 *   2. it counts events instead of people (one refresh looks like two scans)
 *   3. it falls over on a value it did not expect (a junk src, an unknown step,
 *      a double-encoded jsonb payload)
 *
 * Each test below fails if the corresponding behaviour is removed, which is the
 * only reason it is here.
 */
import { describe, expect, it } from "vitest";
import {
  aggregateCampaignFunnel,
  dropOffRate,
  normalizeProps,
  type CampaignEventRow,
} from "@/lib/campaign/aggregate";
import { CAMPAIGN_FUNNEL_STEPS } from "@/lib/analytics/events";

const AT = new Date("2026-09-17T09:00:00.000Z");
const SINCE = new Date("2026-08-18T09:00:00.000Z");

function row(
  src: string,
  name: string,
  visitorId: string,
  extra: Partial<CampaignEventRow> = {},
): CampaignEventRow {
  return { src, name, visitorId, props: {}, createdAt: AT, ...extra };
}

function report(rows: CampaignEventRow[]) {
  return aggregateCampaignFunnel(rows, {
    windowDays: 30,
    since: SINCE,
    generatedAt: AT,
  });
}

describe("aggregateCampaignFunnel — a campaign that reached a landing and nothing else", () => {
  // The exact shape of the live poster campaign today: scans record, nobody has
  // signed up yet. The view must show that honestly — 100% dropped, not a blank.
  const r = report([row("poster", "campaign_landing", "visitor-1")]);

  it("counts the landing", () => {
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].src).toBe("poster");
    expect(r.sources[0].landings).toBe(1);
    expect(r.totals.landings).toBe(1);
  });

  it("shows every later step at zero with a 100% drop-off", () => {
    const byStep = Object.fromEntries(r.sources[0].steps.map((s) => [s.step, s]));
    expect(byStep.campaign_landing.visitors).toBe(1);
    expect(byStep.campaign_landing.dropOffRate).toBeNull(); // the first step has no predecessor
    expect(byStep.campaign_landing.comparedTo).toBeNull();
    for (const step of ["ats_checked", "sign_in_completed", "document_created"] as const) {
      expect(byStep[step].visitors).toBe(0);
      // Measured against the landing, not against the empty step above it: an
      // empty step in the middle must not erase the campaign's one real number.
      expect(byStep[step].dropOffRate).toBe(100);
      expect(byStep[step].comparedTo).toBe("campaign_landing");
      expect(byStep[step].incomplete).toBe(false);
    }
  });

  it("reports no new accounts rather than omitting the figure", () => {
    expect(r.sources[0].newAccounts).toBe(0);
    expect(r.totals.newAccounts).toBe(0);
  });

  it("states the window and the date range it covers", () => {
    expect(r.windowDays).toBe(30);
    expect(r.since).toBe(SINCE.toISOString());
    expect(r.sources[0].firstSeenAt).toBe(AT.toISOString());
    expect(r.sources[0].lastSeenAt).toBe(AT.toISOString());
  });

  it("renders every declared step, in catalog order, even at zero", () => {
    expect(r.sources[0].steps.map((s) => s.step)).toEqual([...CAMPAIGN_FUNNEL_STEPS]);
  });
});

describe("aggregateCampaignFunnel — no data at all", () => {
  const r = report([]);

  it("is an empty rollup, not a crash", () => {
    expect(r.sources).toEqual([]);
    expect(r.totals.events).toBe(0);
    expect(r.totals.landings).toBe(0);
    expect(r.totals.sources).toBe(0);
  });

  it("reports an unknown date range as null rather than a fake date", () => {
    expect(r.totals.firstSeenAt).toBeNull();
    expect(r.totals.lastSeenAt).toBeNull();
  });

  it("never produces NaN or Infinity anywhere in the report", () => {
    // JSON round-trip is the honest check: NaN/Infinity do not survive it, and
    // a view would be handed those values if this ever regressed.
    const serialized = JSON.stringify(r);
    expect(serialized).not.toMatch(/NaN|null%|Infinity/);
    expect(JSON.parse(serialized)).toEqual(r);
  });
});

describe("dropOffRate — the divide-by-zero guard", () => {
  it("is null (absent) when there is no denominator", () => {
    expect(dropOffRate(0, 0)).toBeNull();
    expect(dropOffRate(0, 5)).toBeNull();
    expect(dropOffRate(-3, 5)).toBeNull();
    expect(dropOffRate(Number.NaN, 3)).toBeNull();
  });

  it("is the share that did not continue", () => {
    expect(dropOffRate(10, 4)).toBe(60);
    expect(dropOffRate(3, 0)).toBe(100);
    expect(dropOffRate(12, 8)).toBe(33.3);
    expect(dropOffRate(9, 9)).toBe(0);
  });

  it("clamps to 0 when a later step over-counts, and never goes negative", () => {
    expect(dropOffRate(2, 5)).toBe(0);
  });
});

describe("aggregateCampaignFunnel — people, not page loads", () => {
  it("counts a visitor who reloads the landing page once", () => {
    const r = report([
      row("poster", "campaign_landing", "visitor-1"),
      row("poster", "campaign_landing", "visitor-1"),
      row("poster", "campaign_landing", "visitor-1"),
    ]);
    expect(r.sources[0].landings).toBe(1);
    expect(r.sources[0].events).toBe(3); // the raw rows are still reported
  });

  it("keeps the funnel per campaign, not per visitor across campaigns", () => {
    const r = report([
      row("poster", "campaign_landing", "visitor-1"),
      row("flyer-boda", "campaign_landing", "visitor-1"),
      row("flyer-boda", "sign_in_completed", "visitor-1", {
        props: { method: "magic_link", isNew: true },
      }),
    ]);
    const poster = r.sources.find((s) => s.src === "poster")!;
    const flyer = r.sources.find((s) => s.src === "flyer-boda")!;
    expect(poster.landings).toBe(1);
    expect(poster.newAccounts).toBe(0);
    expect(flyer.landings).toBe(1);
    expect(flyer.newAccounts).toBe(1);
    expect(flyer.steps.find((s) => s.step === "sign_in_completed")!.visitors).toBe(1);
    // Compared against the flyer's landing (1), not the empty ATS step.
    expect(flyer.steps.find((s) => s.step === "sign_in_completed")!.dropOffRate).toBe(0);
    expect(flyer.steps.find((s) => s.step === "sign_in_completed")!.comparedTo).toBe("campaign_landing");
  });

  it("orders campaigns by landings, then stably by name", () => {
    const r = report([
      row("aaa", "campaign_landing", "v-a"),
      row("bbb", "campaign_landing", "v-b1"),
      row("bbb", "campaign_landing", "v-b2"),
      row("ccc", "campaign_landing", "v-c"),
    ]);
    expect(r.sources.map((s) => s.src)).toEqual(["bbb", "aaa", "ccc"]);
  });
});

describe("aggregateCampaignFunnel — a junk or unknown src must not break the rollup", () => {
  it("sanitizes what it can and buckets it as a clean campaign", () => {
    const r = report([row("Poster A!", "campaign_landing", "visitor-1")]);
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].src).toBe("poster-a");
    expect(r.totals.unusableRows).toBe(0);
  });

  it("counts a src that sanitizes to nothing as unusable instead of inventing a campaign", () => {
    const r = report([
      row("%%%", "campaign_landing", "visitor-x"),
      row("", "campaign_landing", "visitor-y"),
      row("!!", "campaign_landing", "visitor-z"),
    ]);
    expect(r.sources).toEqual([]);
    expect(r.totals.unusableRows).toBe(3);
    expect(r.totals.landings).toBe(0);
  });

  it("keeps going when one row is junk and the rest are real", () => {
    const r = report([
      row("poster", "campaign_landing", "visitor-1"),
      row("###", "campaign_landing", "visitor-junk"),
      row("poster", "totally_made_up_step", "visitor-1"),
      row("poster", "campaign_landing", "   "),
    ]);
    expect(r.sources.map((s) => s.src)).toEqual(["poster"]);
    expect(r.sources[0].landings).toBe(1);
    expect(r.totals.unusableRows).toBe(2);
    expect(r.totals.unrecognizedEvents).toBe(1);
    expect(JSON.stringify(r)).not.toMatch(/NaN/);
  });

  it("survives a src that is not a string at all", () => {
    const r = report([
      { src: 42 as unknown as string, name: "campaign_landing", visitorId: "v", createdAt: AT },
      { src: null as unknown as string, name: "campaign_landing", visitorId: "v", createdAt: AT },
    ]);
    expect(r.sources).toEqual([]);
    expect(r.totals.unusableRows).toBe(2);
  });
});

describe("aggregateCampaignFunnel — derived figures are flagged, not hidden", () => {
  it("flags a step that over-counts its baseline instead of showing a negative drop-off", () => {
    const r = report([
      row("poster", "campaign_landing", "visitor-1"),
      row("poster", "sign_in_completed", "visitor-1", { props: { isNew: true } }),
      row("poster", "sign_in_completed", "visitor-2", { props: { isNew: true } }),
    ]);
    const signIn = r.sources[0].steps.find((s) => s.step === "sign_in_completed")!;
    expect(signIn.visitors).toBe(2);
    expect(signIn.dropOffRate).toBe(0); // clamped, never negative
    expect(signIn.comparedTo).toBe("campaign_landing");
    expect(signIn.incomplete).toBe(true);
  });

  it("moves the baseline to the latest step that had anybody", () => {
    const r = report([
      row("poster", "campaign_landing", "v-1"),
      row("poster", "campaign_landing", "v-2"),
      row("poster", "sign_in_completed", "v-1", { props: { isNew: true } }),
      row("poster", "document_created", "v-1"),
    ]);
    const byStep = Object.fromEntries(r.sources[0].steps.map((s) => [s.step, s]));
    expect(byStep.sign_in_completed.comparedTo).toBe("campaign_landing");
    expect(byStep.sign_in_completed.dropOffRate).toBe(50);
    // The empty ATS step is skipped; sign-in is now the baseline.
    expect(byStep.document_created.comparedTo).toBe("sign_in_completed");
    expect(byStep.document_created.dropOffRate).toBe(0);
  });

  it("counts new accounts from the client's own isNew flag only", () => {
    const r = report([
      row("poster", "sign_in_completed", "v-new", { props: { isNew: true } }),
      row("poster", "sign_in_completed", "v-old", { props: { isNew: false } }),
      row("poster", "sign_in_completed", "v-missing", { props: {} }),
    ]);
    expect(r.sources[0].newAccounts).toBe(1);
    expect(r.sources[0].steps.find((s) => s.step === "sign_in_completed")!.visitors).toBe(3);
  });

  it("reads a double-encoded jsonb payload instead of silently reading zero", () => {
    // Rows written before the `::jsonb` cast hold the payload as a JSON string —
    // the defect that blanked the admin Insights page.
    const r = report([
      row("poster", "sign_in_completed", "v-1", { props: '{"method":"otp","isNew":true}' as never }),
    ]);
    expect(r.sources[0].newAccounts).toBe(1);
  });
});

describe("normalizeProps", () => {
  it("parses the string form, passes objects through, and never throws", () => {
    expect(normalizeProps('{"isNew":true}')).toEqual({ isNew: true });
    expect(normalizeProps({ isNew: true })).toEqual({ isNew: true });
    expect(normalizeProps("{not json")).toEqual({});
    expect(normalizeProps(null)).toEqual({});
    expect(normalizeProps([1, 2, 3])).toEqual({});
  });
});

/**
 * The identity the word "visitors" is counted in.
 *
 * The ingest lowercases and narrows a visitor id before it writes (see
 * lib/campaign/ingest.ts), so an id that reaches this module differently can
 * only come from a writer that skipped the ingest — a backfill, a hand-written
 * INSERT, a future route. Counting those as extra people would inflate the one
 * number every figure below it is a fraction of, and nothing in the view could
 * tell. These fail if `normalizeVisitorKey` stops being applied to a row.
 */
describe("distinct visitors are counted with the ingest's identity rule", () => {
  it("does not let case or stray punctuation split one person into two", () => {
    const r = report([
      row("poster", "campaign_landing", "VISITOR-1"),
      row("poster", "campaign_landing", "visitor-1"),
      row("poster", "campaign_landing", " visitor-1 "),
      row("poster", "sign_in_completed", "Visitor!1", { props: { isNew: true } }),
    ]);
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].landings).toBe(1);
    expect(r.sources[0].newAccounts).toBe(1);
    expect(r.sources[0].steps.find((s) => s.step === "sign_in_completed")!.visitors).toBe(1);
    // The raw rows are still all there — normalized, not discarded.
    expect(r.sources[0].events).toBe(4);
    expect(r.totals.unusableRows).toBe(0);
  });

  it("keeps two genuinely different visitors apart", () => {
    const r = report([
      row("poster", "campaign_landing", "visitor-1"),
      row("poster", "campaign_landing", "visitor-2"),
    ]);
    expect(r.sources[0].landings).toBe(2);
  });

  it("still refuses a row with no visitor at all", () => {
    const r = report([
      row("poster", "campaign_landing", "   "),
      row("poster", "campaign_landing", "!!!"),
    ]);
    expect(r.sources).toEqual([]);
    expect(r.totals.unusableRows).toBe(2);
  });

  it("keeps a short visitor id — the length floor belongs to the ingest", () => {
    // A row already in the table was accepted by somebody; dropping it here
    // would silently delete a real person from the funnel.
    const r = report([row("poster", "campaign_landing", "v")]);
    expect(r.sources[0].landings).toBe(1);
    expect(r.totals.unusableRows).toBe(0);
  });
});

/**
 * How complete the report is.
 *
 * "0 landings because the poster produced nobody" and "0 landings because the
 * read threw" are the same digits and opposite facts. The numbers cannot carry
 * that difference, so the report does — and the view prints it (see
 * components/admin/campaign-funnel-view.test.ts).
 */
describe("coverage — a report says whether it is a measurement at all", () => {
  it("reports a complete read by default", () => {
    expect(report([]).coverage).toEqual({ readFailed: false, truncated: false });
    expect(report([row("poster", "campaign_landing", "visitor-1")]).coverage.truncated).toBe(false);
  });

  it("carries a failed read through as a flag, without inventing data", () => {
    const r = aggregateCampaignFunnel([], {
      windowDays: 30,
      since: SINCE,
      generatedAt: AT,
      readFailed: true,
    });
    expect(r.coverage.readFailed).toBe(true);
    expect(r.coverage.truncated).toBe(false);
    // The figures stay zero — a failed read must not fabricate a campaign — the
    // flag is what stops that zero from being read as an answer.
    expect(r.sources).toEqual([]);
    expect(r.totals.landings).toBe(0);
    expect(r.totals.events).toBe(0);
    expect(r.totals.firstSeenAt).toBeNull();
  });

  it("flags a capped read as a floor, not a total", () => {
    const r = aggregateCampaignFunnel([row("poster", "campaign_landing", "visitor-1")], {
      windowDays: 30,
      since: SINCE,
      generatedAt: AT,
      truncated: true,
    });
    expect(r.coverage).toEqual({ readFailed: false, truncated: true });
    expect(r.sources[0].landings).toBe(1);
  });

  it("can report both at once without either one hiding the other", () => {
    const r = aggregateCampaignFunnel([], {
      windowDays: 30,
      since: SINCE,
      generatedAt: AT,
      readFailed: true,
      truncated: true,
    });
    expect(r.coverage).toEqual({ readFailed: true, truncated: true });
  });
});
