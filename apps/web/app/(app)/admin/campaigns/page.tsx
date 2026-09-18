import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { db, campaignEvent } from "@/lib/db";
import { gte, desc } from "drizzle-orm";
import { aggregateCampaignFunnel, type CampaignEventRow } from "@/lib/campaign/aggregate";
import { CampaignFunnelView } from "@/components/admin/campaign-funnel-view";

export const metadata = { title: "Campaigns · Admin" };
export const dynamic = "force-dynamic";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
/** Newest-first cap. This runs on a shared Neon instance and the answer never
 *  needs every row to be useful — the campaign view is a rollup, not an archive. */
const MAX_ROWS = 20_000;

function clampDays(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.round(parsed));
}

interface LoadedRows {
  rows: CampaignEventRow[];
  /**
   * The read THREW. Not the same fact as "the table has no rows in this
   * window", and the view has to say which one happened: a failed read that
   * rendered as the empty state would tell the admin "the poster produced
   * nobody, and that is a real answer" while nothing had been read at all.
   */
  readFailed: boolean;
  /** The cap was reached, so the rollup is a floor rather than a total. */
  truncated: boolean;
}

/**
 * Rows for the window. A missing table (migration 0019 not applied in some
 * environment) must read as "no data yet", not as a 500 — the same posture the
 * Insights page takes for outcome_event. The failure is not silent, though: it
 * is reported to the view and logged, because this page's whole job is to be
 * the answer to a question about money spent on printing.
 */
async function loadRows(since: Date): Promise<LoadedRows> {
  try {
    const rows = await db
      .select({
        src: campaignEvent.src,
        name: campaignEvent.name,
        visitorId: campaignEvent.visitorId,
        props: campaignEvent.props,
        createdAt: campaignEvent.createdAt,
      })
      .from(campaignEvent)
      .where(gte(campaignEvent.createdAt, since))
      .orderBy(desc(campaignEvent.createdAt))
      .limit(MAX_ROWS);
    return {
      rows: rows.map((r) => ({
        src: r.src,
        name: r.name,
        visitorId: r.visitorId,
        props: r.props as Record<string, unknown> | null,
        createdAt: r.createdAt,
      })),
      readFailed: false,
      truncated: rows.length >= MAX_ROWS,
    };
  } catch (err) {
    console.error("[admin/campaigns] campaign_event read failed:", err);
    return { rows: [], readFailed: true, truncated: false };
  }
}

/**
 * Which printed surface brought anyone, and how far they got.
 *
 * The whole funnel is `campaign_event` — our own table — which is the point:
 * before lib/analytics/campaign.ts existed, the poster tag lived only in
 * PostHog, a dashboard this repo cannot query, so "did the poster produce a
 * single user?" had no answer here at all. Rendering lives in
 * components/admin/campaign-funnel-view.tsx.
 */
export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return <p className="text-sm text-text-muted">Unahitaji ruhusa ya admin.</p>;
  }

  const days = clampDays(searchParams?.days);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const { rows, readFailed, truncated } = await loadRows(since);
  // readFailed/truncated are told to the report rather than hidden: "0 landings"
  // from a failed read and "0 landings" from nobody scanning are the same digits
  // and opposite meanings.
  const report = aggregateCampaignFunnel(rows, { windowDays: days, since, readFailed, truncated });

  return <CampaignFunnelView report={report} />;
}
