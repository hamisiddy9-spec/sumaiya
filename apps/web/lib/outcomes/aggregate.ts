// Outcome aggregation — the feedback flywheel's honest metrics (PR-3).
//
// Pure functions over outcome_event rows: no DB, no AI, fully testable. The
// admin insights page feeds these with real rows and renders the results.
//
// HONESTY CONTRACT (from the mandate):
//   - Every number is real or ABSENT. When n === 0 the metric is null (the UI
//     renders "no data yet"), never a fabricated or projected stat.
//   - Small samples (n < SMALL_SAMPLE_N) are labeled — the UI shows a
//     "sample too small" note so a 2-tailor average is never read as truth.

export interface OutcomeEventRow {
  userHash: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date | string;
}

export const SMALL_SAMPLE_N = 10;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function at(row: OutcomeEventRow): number {
  const d = row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt));
  return d.getTime();
}
function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function pct(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : null; // one decimal
}

// ─── Tailor lift ─────────────────────────────────────────────────────────────

export interface TailorLiftAggregate {
  n: number;
  /** Mean ATS delta (after − before). null when n === 0. */
  avgDeltaAts: number | null;
  medianDeltaAts: number | null;
  /** Share of tailors whose REAL ATS score went UP. */
  liftRate: number | null;
  avgDeltaMatch: number | null;
  smallSample: boolean;
}

export function aggregateTailorLift(rows: OutcomeEventRow[]): TailorLiftAggregate {
  const lifts = rows
    .filter((r) => r.type === "tailor.lift")
    .map((r) => {
      const beforeAts = num(r.payload.beforeAts);
      const afterAts = num(r.payload.afterAts);
      if (beforeAts === null || afterAts === null) return null;
      const deltaAts = num(r.payload.deltaAts) ?? afterAts - beforeAts;
      const beforeMatch = num(r.payload.beforeMatch);
      const afterMatch = num(r.payload.afterMatch);
      return { deltaAts, deltaMatch: beforeMatch !== null && afterMatch !== null ? afterMatch - beforeMatch : null };
    })
    .filter((x): x is { deltaAts: number; deltaMatch: number | null } => x !== null);

  const deltas = lifts.map((x) => x.deltaAts);
  const matchDeltas = lifts.map((x) => x.deltaMatch).filter((x): x is number => x !== null);

  return {
    n: lifts.length,
    avgDeltaAts: mean(deltas),
    medianDeltaAts: median(deltas),
    liftRate: pct(deltas.filter((d) => d > 0).length, deltas.length),
    avgDeltaMatch: mean(matchDeltas),
    smallSample: lifts.length > 0 && lifts.length < SMALL_SAMPLE_N,
  };
}

// ─── Match → outcome funnel ──────────────────────────────────────────────────

export interface MatchOutcomeBucket {
  bucket: string;
  n: number;
  /** Distinct applications in this bucket that ever reached interviewing. */
  interviewing: number;
  offer: number;
  interviewRate: number | null;
  offerRate: number | null;
  smallSample: boolean;
}

export interface MatchOutcomeAggregate {
  buckets: MatchOutcomeBucket[];
}

const BUCKETS: Array<{ key: string; min: number; max: number }> = [
  { key: "<40", min: -Infinity, max: 39 },
  { key: "40–69", min: 40, max: 69 },
  { key: "≥70", min: 70, max: Infinity },
];

export function aggregateMatchOutcome(rows: OutcomeEventRow[]): MatchOutcomeAggregate {
  // application.created carries the application's matchScore; application.status
  // transitions extend it. Join by applicationId.
  const created = rows
    .filter((r) => r.type === "application.created")
    .map((r) => ({ applicationId: str(r.payload.applicationId), matchScore: num(r.payload.matchScore) }))
    .filter((x) => x.applicationId);
  const reached: Record<string, { interviewing: boolean; offer: boolean }> = {};
  for (const r of rows) {
    if (r.type !== "application.status") continue;
    const appId = str(r.payload.applicationId);
    if (!appId) continue;
    reached[appId] ??= { interviewing: false, offer: false };
    if (str(r.payload.to) === "interviewing") reached[appId].interviewing = true;
    if (str(r.payload.to) === "offer") reached[appId].offer = true;
  }

  const buckets = BUCKETS.map((b) => {
    const apps = created.filter((a) => a.matchScore !== null && a.matchScore >= b.min && a.matchScore <= b.max);
    const interviewing = apps.filter((a) => reached[a.applicationId]?.interviewing).length;
    const offer = apps.filter((a) => reached[a.applicationId]?.offer).length;
    return {
      bucket: b.key,
      n: apps.length,
      interviewing,
      offer,
      interviewRate: pct(interviewing, apps.length),
      offerRate: pct(offer, apps.length),
      smallSample: apps.length > 0 && apps.length < SMALL_SAMPLE_N,
    };
  });

  return { buckets };
}

// ─── Nudge efficacy ──────────────────────────────────────────────────────────

export interface NudgeAggregate {
  signalType: string;
  shown: number;
  /** Shown nudges whose resolving tool actually ran (same user, within 24h). */
  actedOn: number;
  actRate: number | null;
  smallSample: boolean;
}

const NUDGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function aggregateNudgeEfficacy(rows: OutcomeEventRow[]): NudgeAggregate[] {
  const shown = rows
    .filter((r) => r.type === "signal.shown")
    .map((r) => ({
      userHash: r.userHash,
      signalType: str(r.payload.signalType),
      tool: str(r.payload.tool),
      at: at(r),
    }))
    .filter((s) => s.signalType && s.tool);

  const executed = rows
    .filter((r) => r.type === "tool.executed")
    .map((r) => ({ userHash: r.userHash, tool: str(r.payload.tool), at: at(r) }))
    .filter((e) => e.tool);

  const byType = new Map<string, { shown: number; actedOn: number }>();
  for (const s of shown) {
    const entry = byType.get(s.signalType) ?? { shown: 0, actedOn: 0 };
    entry.shown += 1;
    const acted = executed.some(
      (e) => e.userHash === s.userHash && e.tool === s.tool && e.at >= s.at && e.at - s.at <= NUDGE_WINDOW_MS,
    );
    if (acted) entry.actedOn += 1;
    byType.set(s.signalType, entry);
  }

  return [...byType.entries()]
    .map(([signalType, { shown: n, actedOn }]) => ({
      signalType,
      shown: n,
      actedOn,
      actRate: pct(actedOn, n),
      smallSample: n > 0 && n < SMALL_SAMPLE_N,
    }))
    .sort((a, b) => b.shown - a.shown);
}

// ─── Confirmation trust loop ─────────────────────────────────────────────────

export interface ConfirmationAggregate {
  n: number;
  accept: number;
  reject: number;
  acceptRate: number | null;
  smallSample: boolean;
}

export function aggregateConfirmationRate(rows: OutcomeEventRow[]): ConfirmationAggregate {
  const resolutions = rows
    .filter((r) => r.type === "confirmation.resolved")
    .map((r) => str(r.payload.decision))
    .filter((d) => d === "accept" || d === "reject");
  const accept = resolutions.filter((d) => d === "accept").length;
  const reject = resolutions.filter((d) => d === "reject").length;
  return {
    n: resolutions.length,
    accept,
    reject,
    acceptRate: pct(accept, resolutions.length),
    smallSample: resolutions.length > 0 && resolutions.length < SMALL_SAMPLE_N,
  };
}

// ─── Overview (the dashboard's data model) ───────────────────────────────────

export interface InsightsOverview {
  totalEvents: number;
  sinceDays: number;
  tailorLift: TailorLiftAggregate;
  matchOutcome: MatchOutcomeAggregate;
  nudgeEfficacy: NudgeAggregate[];
  confirmations: ConfirmationAggregate;
  generatedAt: string;
}

export function insightsOverview(rows: OutcomeEventRow[], sinceDays = 90): InsightsOverview {
  return {
    totalEvents: rows.length,
    sinceDays,
    tailorLift: aggregateTailorLift(rows),
    matchOutcome: aggregateMatchOutcome(rows),
    nudgeEfficacy: aggregateNudgeEfficacy(rows),
    confirmations: aggregateConfirmationRate(rows),
    generatedAt: new Date().toISOString(),
  };
}
