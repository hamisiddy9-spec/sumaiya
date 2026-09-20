import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { db, outcomeEvent } from "@/lib/db";
import { desc, gte } from "drizzle-orm";
import { insightsOverview, SMALL_SAMPLE_N, type OutcomeEventRow } from "@/lib/outcomes/aggregate";

export const metadata = { title: "Insights · Admin" };
export const dynamic = "force-dynamic";

const SINCE_DAYS = 90;

/**
 * Rows written before the `::jsonb` fix hold the payload as a JSON *string*
 * (double-encoded), so `payload.x` reads undefined and the whole dashboard
 * quietly renders "—". Old rows are still real data, so parse them instead of
 * discarding them.
 */
function normalizePayload(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (raw ?? {}) as Record<string, unknown>;
}

async function loadRows(): Promise<OutcomeEventRow[]> {
  try {
    const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(outcomeEvent)
      .where(gte(outcomeEvent.createdAt, since))
      .orderBy(desc(outcomeEvent.createdAt))
      .limit(5000);
    return rows.map((r) => ({
      userHash: r.userHash,
      type: r.type,
      payload: normalizePayload(r.payload),
      createdAt: r.createdAt,
    }));
  } catch {
    return []; // table may not exist until migration 0008 runs
  }
}

// ─── Rendering helpers (real-or-absent, small-sample labels) ─────────────────

function num(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 10) / 10}`;
}

function SampleNote({ n }: { n: number }) {
  if (n === 0) return <span className="text-xs text-text-muted">Hakuna data bado — inakusanywa kwa matumizi halisi.</span>;
  if (n < SMALL_SAMPLE_N) return <span className="text-xs text-amber-700">Sample ndogo ({n}) — takwimu zinaweza kubadilika.</span>;
  return <span className="text-xs text-text-muted">{n} tukio</span>;
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note: React.ReactNode }) {
  return (
    <div className="bg-card border border-border-input rounded-xl p-5">
      <h3 className="text-sm font-semibold text-espresso mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
      <div className="mt-3">{note}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-espresso">{value}</span>
    </div>
  );
}

export default async function AdminInsightsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return <p className="text-sm text-text-muted">Unahitaji ruhusa ya admin.</p>;
  }

  const rows = await loadRows();
  const o = insightsOverview(rows, SINCE_DAYS);
  const { tailorLift, matchOutcome, nudgeEfficacy, confirmations } = o;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-espresso">Insights — flywheel</h1>
        <p className="text-sm text-text-muted mt-1">
          Takwimu halisi kutoka kwenye matumizi (siku {SINCE_DAYS} zilizopita). Kila namba ni ya kweli au haipo —
          kamwe haijabuniwa. Hapa ndipo unapotengeneza prompts/thresholds/weights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tailor lift */}
        <Card title="Tailoring lift — ATS before vs after" note={<SampleNote n={tailorLift.n} />}>
          {tailorLift.n > 0 ? (
            <>
              <Row label="Wastani wa mabadiliko ya alama ya CV" value={num(tailorLift.avgDeltaAts)} />
              <Row label="Wastani wa kati (median)" value={num(tailorLift.medianDeltaAts)} />
              <Row label="Asilimia walioinuka (alama > 0)" value={tailorLift.liftRate === null ? "—" : `${tailorLift.liftRate}%`} />
              <Row label="Wastani wa mabadiliko ya match" value={num(tailorLift.avgDeltaMatch)} />
            </>
          ) : (
            <p className="text-sm text-text-muted">Hakuna tailor bado. Inakusanywa kila mtu anapotumia cv.tailor.</p>
          )}
        </Card>

        {/* Match → outcome funnel */}
        <Card title="Match → outcome (did the prediction hold?)" note={<span className="text-xs text-text-muted">Per match-score bucket</span>}>
          <div className="space-y-3">
            {matchOutcome.buckets.map((b) => (
              <div key={b.bucket}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-espresso">Match {b.bucket}</span>
                  <span className="text-text-muted">{b.n} applications</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted pl-2">
                  <span>Mahojiano: {b.interviewing} ({b.interviewRate === null ? "—" : `${b.interviewRate}%`})</span>
                  <span>Ofa: {b.offer} ({b.offerRate === null ? "—" : `${b.offerRate}%`})</span>
                </div>
                {b.n > 0 && b.n < SMALL_SAMPLE_N && (
                  <p className="text-[11px] text-amber-700 pl-2">Sample ndogo — takwimu zinaweza kubadilika.</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Nudge efficacy */}
        <Card title="Nudge efficacy — signal → resolving tool" note={<span className="text-xs text-text-muted">Within 24h, same user</span>}>
          {nudgeEfficacy.length > 0 ? (
            <div className="space-y-2">
              {nudgeEfficacy.map((n) => (
                <div key={n.signalType} className="flex items-center justify-between text-sm">
                  <span className="text-espresso">{n.signalType}</span>
                  <span className="text-text-muted">
                    {n.actedOn}/{n.shown} ({n.actRate === null ? "—" : `${n.actRate}%`})
                    {n.smallSample && <span className="text-amber-700 ml-1">*</span>}
                  </span>
                </div>
              ))}
              <p className="text-[11px] text-text-muted">* sample ndogo</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Hakuna signals bado.</p>
          )}
        </Card>

        {/* Confirmation trust loop */}
        <Card title="Confirmation trust loop" note={<SampleNote n={confirmations.n} />}>
          {confirmations.n > 0 ? (
            <>
              <Row label="Kukubali (accept)" value={String(confirmations.accept)} />
              <Row label="Kukataa (reject)" value={String(confirmations.reject)} />
              <Row label="Kiwango cha kukubali" value={confirmations.acceptRate === null ? "—" : `${confirmations.acceptRate}%`} />
            </>
          ) : (
            <p className="text-sm text-text-muted">Hakuna uthibitisho bado. Inakusanywa kila mtu anapothibitisha au kukataa.</p>
          )}
        </Card>
      </div>

      <p className="text-xs text-text-muted">
        Jumla ya matukio (siku {SINCE_DAYS}): {o.totalEvents} · Imetengenezwa {new Date(o.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
