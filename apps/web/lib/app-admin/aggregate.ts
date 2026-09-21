// Pure aggregation for /admin/app — no DB, no network, unit-testable in
// isolation (same shape as lib/outcomes/aggregate.ts). The page component
// only fetches rows and calls these; every number here is real-or-absent,
// never fabricated to fill a chart.

export const FUNNEL_STAGES = [
  "signed_up",
  "onboarded",
  "profile_completed",
  "cv_created",
  "cv_exported",
  "application_created",
  "template_selected",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export interface AppEventRow {
  installId: string;
  name: string;
  props: unknown;
  appVersion: string | null;
  createdAt: Date;
}

export interface AppReportRow {
  id: string;
  kind: string;
  note: string | null;
  screenshot: string | null;
  logs: unknown;
  appVersion: string | null;
  platform: string | null;
  device: string | null;
  createdAt: Date;
}

/** Rows written before a jsonb-cast fix can hold props as a JSON *string*
 *  rather than an object (see app-telemetry.ts / outcomes/events.ts's
 *  identical comment on the bug this guards against). Parse defensively. */
function normalizeProps(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (raw ?? {}) as Record<string, unknown>;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export interface VersionCount {
  version: string;
  count: number;
}

/** One row per install: its MOST RECENT event's app_version — so an install
 *  that upgraded mid-window is counted once, under the build it's actually
 *  running now, not once per version it ever reported. */
export function phonesByVersion(rows: AppEventRow[]): VersionCount[] {
  const latestByInstall = new Map<string, AppEventRow>();
  for (const r of rows) {
    const prev = latestByInstall.get(r.installId);
    if (!prev || r.createdAt > prev.createdAt) latestByInstall.set(r.installId, r);
  }
  const counts = new Map<string, number>();
  for (const r of latestByInstall.values()) {
    const v = r.appVersion || "unknown";
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ActiveInstalls {
  d7: number;
  d30: number;
}

export function activeInstalls(rows: AppEventRow[]): ActiveInstalls {
  const since7 = daysAgo(7);
  const since30 = daysAgo(30);
  const d7 = new Set<string>();
  const d30 = new Set<string>();
  for (const r of rows) {
    if (r.createdAt >= since30) d30.add(r.installId);
    if (r.createdAt >= since7) d7.add(r.installId);
  }
  return { d7: d7.size, d30: d30.size };
}

export interface TopEvent {
  name: string;
  count: number;
  phones: number;
}

/** Top event names in the last 7 days, with how many distinct phones fired
 *  each one — a count alone can't tell "1 phone spamming" from "8 phones". */
export function topEvents(rows: AppEventRow[], sinceDays = 7, limit = 10): TopEvent[] {
  const since = daysAgo(sinceDays);
  const byName = new Map<string, { count: number; phones: Set<string> }>();
  for (const r of rows) {
    if (r.createdAt < since) continue;
    const entry = byName.get(r.name) ?? { count: 0, phones: new Set<string>() };
    entry.count += 1;
    entry.phones.add(r.installId);
    byName.set(r.name, entry);
  }
  return [...byName.entries()]
    .map(([name, v]) => ({ name, count: v.count, phones: v.phones.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface ErrorSummary {
  count: number;
  phones: number;
  topMessages: { message: string; count: number }[];
}

/** app.error rows in the window, and the most common MESSAGE (not stack —
 *  telemetry only ever carries the short message, see telemetry.ts's own
 *  shortMessage()). */
export function errorSummary(rows: AppEventRow[], sinceDays = 7, limit = 5): ErrorSummary {
  const since = daysAgo(sinceDays);
  const phones = new Set<string>();
  const byMessage = new Map<string, number>();
  let count = 0;
  for (const r of rows) {
    if (r.name !== "app.error" || r.createdAt < since) continue;
    count += 1;
    phones.add(r.installId);
    const props = normalizeProps(r.props);
    const message = typeof props.message === "string" && props.message ? props.message : "(no message)";
    byMessage.set(message, (byMessage.get(message) ?? 0) + 1);
  }
  const topMessages = [...byMessage.entries()]
    .map(([message, c]) => ({ message, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { count, phones: phones.size, topMessages };
}

export interface FunnelPoint {
  stage: FunnelStage;
  installs: number;
  dropFromPrevious: number | null;
}

/** How many DISTINCT installs ever reached each stage, in the declared order,
 *  and the drop from the stage before it. Not a strict ordered-sequence
 *  funnel (an install can fire template_selected before cv_created) — it's
 *  "how many installs reached this stage at all", which is what "where does
 *  the sharing plan's number actually come from" needs. */
export function activationFunnel(rows: AppEventRow[]): FunnelPoint[] {
  const installsByStage = new Map<FunnelStage, Set<string>>();
  for (const stage of FUNNEL_STAGES) installsByStage.set(stage, new Set());
  for (const r of rows) {
    if ((FUNNEL_STAGES as readonly string[]).includes(r.name)) {
      installsByStage.get(r.name as FunnelStage)!.add(r.installId);
    }
  }
  let previous: number | null = null;
  return FUNNEL_STAGES.map((stage) => {
    const installs = installsByStage.get(stage)!.size;
    const dropFromPrevious = previous === null ? null : previous - installs;
    previous = installs;
    return { stage, installs, dropFromPrevious };
  });
}

export interface AppAdminOverview {
  totalEvents: number;
  phonesByVersion: VersionCount[];
  active: ActiveInstalls;
  topEvents: TopEvent[];
  errors: ErrorSummary;
  funnel: FunnelPoint[];
  generatedAt: string;
}

export function appAdminOverview(rows: AppEventRow[]): AppAdminOverview {
  return {
    totalEvents: rows.length,
    phonesByVersion: phonesByVersion(rows),
    active: activeInstalls(rows),
    topEvents: topEvents(rows),
    errors: errorSummary(rows),
    funnel: activationFunnel(rows),
    generatedAt: new Date().toISOString(),
  };
}
