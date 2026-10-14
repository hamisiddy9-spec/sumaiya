import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { db, appEvent, appReport } from "@/lib/db";
import { desc, gte } from "drizzle-orm";
import {
  appAdminOverview,
  type AppEventRow,
  type AppReportRow,
} from "@/lib/app-admin/aggregate";

export const metadata = { title: "App · Admin" };
export const dynamic = "force-dynamic";

const SINCE_DAYS = 30;
const MAX_EVENT_ROWS = 20_000; // measured volume today: 77 total — this is headroom, not a real cap
const MAX_REPORTS = 30;

async function loadEventRows(): Promise<AppEventRow[]> {
  try {
    const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        installId: appEvent.installId,
        name: appEvent.name,
        props: appEvent.props,
        appVersion: appEvent.appVersion,
        createdAt: appEvent.createdAt,
      })
      .from(appEvent)
      .where(gte(appEvent.createdAt, since))
      .orderBy(desc(appEvent.createdAt))
      .limit(MAX_EVENT_ROWS);
    return rows;
  } catch {
    return []; // table may not exist until the migration runs
  }
}

async function loadReports(): Promise<AppReportRow[]> {
  try {
    const rows = await db
      .select({
        id: appReport.id,
        kind: appReport.kind,
        note: appReport.note,
        screenshot: appReport.screenshot,
        logs: appReport.logs,
        appVersion: appReport.appVersion,
        platform: appReport.platform,
        device: appReport.device,
        createdAt: appReport.createdAt,
      })
      .from(appReport)
      .orderBy(desc(appReport.createdAt))
      .limit(MAX_REPORTS);
    return rows;
  } catch {
    return []; // table may not exist until the migration runs
  }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border-input rounded-xl p-5">
      <h3 className="text-sm font-semibold text-espresso mb-3">{title}</h3>
      {children}
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

const FUNNEL_LABELS: Record<string, string> = {
  signed_up: "Signed up",
  onboarded: "Onboarded",
  profile_completed: "Profile completed",
  cv_created: "CV created",
  cv_exported: "CV exported",
  application_created: "Application created",
  template_selected: "Template selected",
};

function LogLines({ logs }: { logs: unknown }) {
  const entries = Array.isArray(logs) ? (logs as { at?: number; kind?: string; name?: string; detail?: string }[]) : [];
  if (entries.length === 0) return <p className="text-xs text-text-muted">No log lines were attached.</p>;
  return (
    <details className="mt-2">
      <summary className="text-xs text-ember-hover cursor-pointer select-none">
        {entries.length} log line{entries.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
        {entries.map((e, i) => (
          <div key={i} className="text-[11px] font-mono text-text-muted border-b border-border last:border-0 pb-1">
            <span className="text-espresso">[{e.kind ?? "?"}]</span> {e.name ?? "?"}
            {e.detail ? ` — ${e.detail}` : ""}
          </div>
        ))}
      </div>
    </details>
  );
}

export default async function AdminAppPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) {
    return <p className="text-sm text-text-muted">Unahitaji ruhusa ya admin.</p>;
  }

  const [rows, reports] = await Promise.all([loadEventRows(), loadReports()]);
  const o = appAdminOverview(rows);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-espresso">Mobile — phones, funnel, problem reports</h1>
        <p className="text-sm text-text-muted mt-1">
          Real telemetry from real phones (last {SINCE_DAYS} days). Every number below is real or
          absent — never a placeholder standing in for data that hasn&apos;t arrived yet.
        </p>
      </div>

      {o.totalEvents === 0 ? (
        <Card title="No data yet">
          <p className="text-sm text-text-muted">
            No phone has reported any activity yet. This page fills in as installs use the app —
            there is nothing to fabricate in the meantime.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Phones by app version">
            {o.phonesByVersion.length === 0 ? (
              <p className="text-sm text-text-muted">No version reported yet.</p>
            ) : (
              <div className="space-y-2">
                {o.phonesByVersion.map((v) => (
                  <Row key={v.version} label={v.version} value={String(v.count)} />
                ))}
              </div>
            )}
          </Card>

          <Card title="Active installs">
            <Row label="Last 7 days" value={String(o.active.d7)} />
            <Row label="Last 30 days" value={String(o.active.d30)} />
          </Card>

          <Card title="Top events (last 7 days)">
            {o.topEvents.length === 0 ? (
              <p className="text-sm text-text-muted">No events in the last 7 days.</p>
            ) : (
              <div className="space-y-2">
                {o.topEvents.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-sm">
                    <span className="text-espresso">{e.name}</span>
                    <span className="text-text-muted">{e.count} · {e.phones} phone{e.phones === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Errors (last 7 days)">
            {o.errors.count === 0 ? (
              <p className="text-sm text-text-muted">No app.error events in the last 7 days.</p>
            ) : (
              <>
                <Row label="Total errors" value={String(o.errors.count)} />
                <Row label="Phones affected" value={String(o.errors.phones)} />
                <div className="mt-3 space-y-1">
                  {o.errors.topMessages.map((m) => (
                    <div key={m.message} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted truncate pr-2">{m.message}</span>
                      <span className="text-espresso font-semibold shrink-0">{m.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      <Card title="Activation funnel — installs reached, and the drop between stages">
        {o.funnel.every((p) => p.installs === 0) ? (
          <p className="text-sm text-text-muted">
            No install has reached any funnel stage yet — signed_up, onboarded, profile_completed,
            cv_created, cv_exported, application_created, template_selected are all waiting on real data.
          </p>
        ) : (
          <div className="space-y-2">
            {o.funnel.map((p) => (
              <div key={p.stage} className="flex items-center justify-between text-sm">
                <span className="text-espresso">{FUNNEL_LABELS[p.stage] ?? p.stage}</span>
                <span className="text-text-muted">
                  {p.installs} install{p.installs === 1 ? "" : "s"}
                  {p.dropFromPrevious !== null && p.dropFromPrevious > 0 ? (
                    <span className="text-warning ml-2">−{p.dropFromPrevious}</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Recent problem reports">
        {reports.length === 0 ? (
          <p className="text-sm text-text-muted">No one has sent a problem report yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-semibold text-espresso uppercase tracking-wide">{r.kind}</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {r.appVersion ?? "—"} · {r.platform ?? "—"} · {r.device ?? "—"}
                </div>
                {r.note ? <p className="text-sm text-espresso mt-2">{r.note}</p> : (
                  <p className="text-sm text-text-muted mt-2 italic">No note was written.</p>
                )}
                {r.screenshot ? (
                  // eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not a static asset
                  <img
                    src={`data:image/jpeg;base64,${r.screenshot}`}
                    alt="Screenshot attached to the report"
                    className="mt-2 max-w-xs rounded-md border border-border"
                  />
                ) : null}
                <LogLines logs={r.logs} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-text-muted">
        Jumla ya matukio (siku {SINCE_DAYS}): {o.totalEvents} · Imetengenezwa {new Date(o.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
