/**
 * Campaign funnel aggregation — what the printed posters actually produced.
 *
 * Pure functions over `campaign_event` rows. No DB, no clock, no AI: the admin
 * campaign page feeds these real rows and renders the result, and the tests
 * drive them directly.
 *
 * THE HONESTY CONTRACT (same one the outcome flywheel set)
 *   - Every figure is either measured or absent. A rate with no denominator
 *     (no landings for that campaign) is null and renders "—", never 0%, never
 *     NaN, never a number divided by an empty set.
 *   - Counts are DISTINCT VISITORS, not events. "12 scans" means 12 browsers —
 *     a page reload is not a new person, and a funnel measured in page loads
 *     would flatter every campaign. A visitor id is therefore normalized with
 *     the SAME rule the ingest enforces (case- and punctuation-insensitive),
 *     so one person can never be counted as two by a writer that skipped the
 *     ingest.
 *   - Nothing is extrapolated. If a step has no rows, it is zero and the
 *     drop-off says so.
 *   - A report says how complete it is (`coverage`). Zero landings from a FAILED
 *     read and zero landings from a campaign nobody scanned are the same numbers
 *     and completely different facts; the caller (the admin page) knows which
 *     happened and must pass it in, because this module only sees rows.
 *   - Rows are CLIENT-REPORTED. This module cannot verify them, and neither can
 *     the view, so the numbers carry that label where they are shown.
 *
 * WHAT IS DERIVED vs MEASURED (the view labels these too)
 *   measured — per-step distinct visitors, and the raw row counts behind them
 *   derived  — dropOffRate (arithmetic between two measured counts), and
 *              newAccounts (measured, but read out of the client's own isNew
 *              flag rather than an account record)
 */

import { sanitizeCampaignSource } from "@/lib/analytics/attribution";
import {
  CAMPAIGN_FUNNEL_STEPS,
  type CampaignFunnelStep,
} from "@/lib/analytics/events";

/** The shape this module needs from a `campaign_event` row. */
export interface CampaignEventRow {
  src: string;
  name: string;
  visitorId: string;
  props?: Record<string, unknown> | null;
  createdAt: Date | string;
}

export interface CampaignStepCount {
  step: CampaignFunnelStep;
  /** Distinct visitors who reached this step. */
  visitors: number;
  /**
   * The step this row's drop-off is measured against: the most recent EARLIER
   * step that had anybody. Usually the step directly above, but not when an
   * empty step sits in between — a poster with 20 landings, 0 ATS checks and 0
   * sign-ins has a sign-in drop-off of 100%, not "undefined". null only for the
   * first step, and for a step with nothing before it at all.
   */
  comparedTo: CampaignFunnelStep | null;
  /**
   * Share of `comparedTo`'s visitors who did NOT reach this one, as a
   * percentage. null when there is nobody to divide by — a drop-off from zero
   * is not 0%, it is undefined, and the view must render "—".
   */
  dropOffRate: number | null;
  /**
   * More visitors reached this step than the step it is compared against. Real
   * and worth seeing: it means the earlier step was under-reported for that
   * campaign (a returning visitor whose landing row was lost, storage blocked,
   * …), so the view must not present the funnel as a clean monotonic chain.
   */
  incomplete: boolean;
}

export interface CampaignSourceFunnel {
  src: string;
  /** The full funnel, in order — every declared step, present even at zero. */
  steps: CampaignStepCount[];
  /** Distinct visitors who landed (steps[0].visitors, named for the reader). */
  landings: number;
  /**
   * Distinct visitors who signed in AND whose sign_in_completed carried
   * isNew: true. Client-reported, which is the best available answer to "did
   * the poster produce a NEW user" — the account record itself carries no src.
   */
  newAccounts: number;
  /** Rows counted for this campaign — the denominator behind every number here. */
  events: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

export interface CampaignFunnelReport {
  /** How many days back the rows were read for. */
  windowDays: number;
  /** Window start (ISO). */
  since: string;
  /** When this report was computed (ISO). */
  generatedAt: string;
  /** The steps, in order — the same list the ingest route accepts. */
  steps: readonly CampaignFunnelStep[];
  sources: CampaignSourceFunnel[];
  /**
   * How much of the window the numbers below actually rest on.
   *
   * This exists because the two ways a campaign view lies are silent: a read
   * that THREW and a read that was CAPPED both look exactly like a campaign
   * nobody scanned. Every figure can be zero and correct, or zero and
   * meaningless, and no number in this report can tell them apart — only the
   * caller knows, so it says so here and the view prints it.
   */
  coverage: {
    /** The rows could not be read. These figures measure nothing. */
    readFailed: boolean;
    /** The row cap was reached. These figures are a floor, not a total. */
    truncated: boolean;
  };
  totals: {
    /** Campaigns with at least one usable row. */
    sources: number;
    landings: number;
    newAccounts: number;
    events: number;
    /** Rows whose name is not a declared funnel step — should always be 0. */
    unrecognizedEvents: number;
    /** Rows whose src did not survive sanitization — should always be 0. */
    unusableRows: number;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
  };
}

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function isoString(value: Date | string | undefined | null): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  const t = d.getTime();
  return Number.isFinite(t) ? d.toISOString() : null;
}

/**
 * Rows written before a `::jsonb` cast hold the payload as a JSON *string*
 * (double-encoded), so `props.isNew` reads undefined and the metric quietly
 * renders zero. Old rows are still real data — parse them instead of discarding
 * them. (Same defect the admin Insights page carries a fix for.)
 */
export function normalizeProps(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/**
 * Percentage of `prev` that did not continue to `cur`.
 * Returns null when there is no denominator — the case that must never become
 * 0%, NaN or Infinity in the UI.
 */
export function dropOffRate(prev: number, cur: number): number | null {
  if (!Number.isFinite(prev) || prev <= 0) return null;
  const from = n(prev);
  const to = n(cur);
  const rate = ((from - to) / from) * 100;
  if (!Number.isFinite(rate)) return null;
  // Clamped: a campaign cannot lose fewer than none of its visitors, and a
  // negative "drop-off" (more people at a later step) is reported separately as
  // `incomplete` rather than as a nonsense percentage.
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

/** Does this row's props carry isNew: true? (bool, or the string "true") */
function isNewAccount(props: Record<string, unknown>): boolean {
  const v = props.isNew;
  return v === true || v === "true";
}

/**
 * The identity rule for "distinct visitors".
 *
 * lib/campaign/ingest.ts normalizes a visitor id the same way on the way in the
 * door (lowercase, `[a-z0-9-]`, nothing else), so this is the SAME identity, not
 * a second opinion. It is repeated here for the same reason `src` is
 * re-sanitized above: the ingest is not the only thing that can write this
 * table (a backfill, a hand-written INSERT, a future route), and an id that
 * differs only by case or a stray character would otherwise count one person
 * twice — inflating the single number the whole view is built on.
 *
 * Deliberately NO length floor: the ingest refuses ids shorter than 6 chars, so
 * a short id in the table is a row somebody else accepted, and this module must
 * count it rather than quietly drop it as unusable.
 */
export function normalizeVisitorKey(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "");
}

export function aggregateCampaignFunnel(
  rows: CampaignEventRow[],
  opts: {
    windowDays: number;
    since: Date | string;
    generatedAt?: Date | string;
    /** See CampaignFunnelReport.coverage — the caller knows, this module cannot. */
    readFailed?: boolean;
    truncated?: boolean;
  } = {
    windowDays: 30,
    since: new Date(0),
  },
): CampaignFunnelReport {
  const declared = new Set<string>(CAMPAIGN_FUNNEL_STEPS);

  interface Bucket {
    /** step → set of visitor ids (a Set, so a reload is not a second person) */
    visitorsByStep: Map<CampaignFunnelStep, Set<string>>;
    newAccountVisitors: Set<string>;
    events: number;
    first: number | null;
    last: number | null;
  }
  const buckets = new Map<string, Bucket>();

  let unrecognizedEvents = 0;
  let unusableRows = 0;
  const seenTimes: number[] = [];

  for (const row of rows) {
    // Defence in depth: the ingest already slugged `src`, but this module must
    // survive any row — a hand-written INSERT, a future writer, a migration.
    const src = sanitizeCampaignSource(typeof row.src === "string" ? row.src : null);
    if (!src) {
      unusableRows += 1;
      continue;
    }
    const name = typeof row.name === "string" ? row.name : "";
    if (!declared.has(name)) {
      unrecognizedEvents += 1;
      continue;
    }
    const visitorId = normalizeVisitorKey(row.visitorId);
    // No visitor id → the row cannot be attributed to a person, so it cannot be
    // counted in any of the distinct-visitor figures. Counted as unusable
    // instead of being dropped silently.
    if (!visitorId) {
      unusableRows += 1;
      continue;
    }

    let bucket = buckets.get(src);
    if (!bucket) {
      bucket = {
        visitorsByStep: new Map(CAMPAIGN_FUNNEL_STEPS.map((s) => [s, new Set<string>()])),
        newAccountVisitors: new Set<string>(),
        events: 0,
        first: null,
        last: null,
      };
      buckets.set(src, bucket);
    }

    bucket.events += 1;
    const step = name as CampaignFunnelStep;
    bucket.visitorsByStep.get(step)?.add(visitorId);
    if (step === "sign_in_completed" && isNewAccount(normalizeProps(row.props))) {
      bucket.newAccountVisitors.add(visitorId);
    }

    const t = (row.createdAt instanceof Date
      ? row.createdAt
      : new Date(String(row.createdAt))
    ).getTime();
    if (Number.isFinite(t)) {
      seenTimes.push(t);
      bucket.first = bucket.first === null ? t : Math.min(bucket.first, t);
      bucket.last = bucket.last === null ? t : Math.max(bucket.last, t);
    }
  }

  const sources: CampaignSourceFunnel[] = [];
  for (const [src, bucket] of buckets) {
    // The baseline for each row's drop-off: the most recent earlier step that
    // had anyone. Carrying it forward (rather than using only the row above)
    // is what makes a landing-only campaign read "100% dropped at every later
    // step" instead of a column of dashes — an empty step in the middle must
    // not erase the campaign's one real number.
    let baseline: { step: CampaignFunnelStep; visitors: number } | null = null;
    const steps: CampaignStepCount[] = CAMPAIGN_FUNNEL_STEPS.map((step) => {
      const visitors = bucket.visitorsByStep.get(step)?.size ?? 0;
      const count: CampaignStepCount = {
        step,
        visitors,
        comparedTo: baseline?.step ?? null,
        dropOffRate: baseline === null ? null : dropOffRate(baseline.visitors, visitors),
        incomplete: baseline !== null && visitors > baseline.visitors,
      };
      if (visitors > 0) baseline = { step, visitors };
      return count;
    });
    sources.push({
      src,
      steps,
      landings: steps[0]?.visitors ?? 0,
      newAccounts: bucket.newAccountVisitors.size,
      events: bucket.events,
      firstSeenAt: bucket.first === null ? null : new Date(bucket.first).toISOString(),
      lastSeenAt: bucket.last === null ? null : new Date(bucket.last).toISOString(),
    });
  }

  // Most-scanned campaign first; ties broken by name so the order is stable
  // between renders (a view that reshuffles itself looks broken).
  sources.sort((a, b) => b.landings - a.landings || b.events - a.events || a.src.localeCompare(b.src));

  return {
    windowDays: opts.windowDays,
    since: isoString(opts.since) ?? "",
    generatedAt: isoString(opts.generatedAt ?? new Date()) ?? "",
    steps: CAMPAIGN_FUNNEL_STEPS,
    sources,
    coverage: {
      readFailed: opts.readFailed === true,
      truncated: opts.truncated === true,
    },
    totals: {
      sources: sources.length,
      landings: sources.reduce((sum, s) => sum + s.landings, 0),
      newAccounts: sources.reduce((sum, s) => sum + s.newAccounts, 0),
      events: sources.reduce((sum, s) => sum + s.events, 0),
      unrecognizedEvents,
      unusableRows,
      firstSeenAt: seenTimes.length ? new Date(Math.min(...seenTimes)).toISOString() : null,
      lastSeenAt: seenTimes.length ? new Date(Math.max(...seenTimes)).toISOString() : null,
    },
  };
}
