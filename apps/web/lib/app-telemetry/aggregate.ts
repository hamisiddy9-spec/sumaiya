/**
 * Turning raw app_event rows into the handful of numbers worth reading.
 *
 * The point of gathering telemetry is not to have data — it's to answer, every
 * morning and without anyone opening a dashboard: is anyone using this, on which
 * build, did the updater work, and what broke. So this module produces exactly
 * that, plus a plain-language rendering (SW + EN) that can be pasted into a chat.
 *
 * Every query is bounded to a window and capped: this runs on a cron against a
 * shared Neon instance, and the answer never needs to be complete to be useful.
 */

import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";

export interface TelemetryDigest {
  windowHours: number;
  since: string;
  installs: {
    /** Distinct install ids we have ever seen. */
    total: number;
    /** Install ids whose FIRST event ever landed inside the window. */
    newInWindow: number;
    /** Install ids that sent anything inside the window. */
    activeInWindow: number;
  };
  versions: { version: string; installs: number; events: number }[];
  updates: {
    available: number;
    started: number;
    downloaded: number;
    installed: number;
    failed: number;
    /** installed / started, as a percentage. null when nothing started. */
    completionRate: number | null;
    failureReasons: { reason: string; count: number }[];
  };
  errors: {
    total: number;
    byScope: { scope: string; count: number }[];
    samples: { scope: string; message: string; count: number }[];
  };
  topEvents: { name: string; count: number }[];
  daily: { day: string; installs: number; events: number }[];
  devices: { device: string; installs: number }[];
  /**
   * The first-run funnel — the walk from "installed" to "using it".
   *
   * Added because the only honest answer to "where do new users give up?" used
   * to be "nobody knows": not one event was recorded between install and
   * sign-in. `stuck` is the key number — for every install that reached the
   * wizard but never finished it, the last step they saw.
   */
  funnel: {
    onboardingStarted: number;
    onboardingFinished: number;
    signInGoogle: number;
    signInEmail: number;
    wizardStarted: number;
    wizardFinished: number;
    steps: { step: string; installs: number; avgSeconds: number | null }[];
    stuck: { step: string; installs: number }[];
  };
}

/** postgres-js hands back array-likes; counts arrive as strings. Keep both sane. */
async function rows<T>(query: SQL): Promise<T[]> {
  const res = (await db.execute(query)) as unknown as T[] | null;
  if (!res) return [];
  return Array.isArray(res) ? res : Array.from(res);
}

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const s = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

export async function buildTelemetryDigest({ hours = 24 }: { hours?: number } = {}): Promise<TelemetryDigest> {
  // Immutable time boundaries: "install" counts must not drift between queries.
  const [bounds] = await rows<{ since: string; since30: string }>(sql`
    select
      (now() - (${hours}::int * interval '1 hour'))::text as since,
      (now() - interval '30 days')::text as since30
  `);
  const since = sql`(now() - (${hours}::int * interval '1 hour'))`;
  const since30 = sql`(now() - interval '30 days')`;

  const [totals] = await rows<{ total: string; active: string; fresh: string }>(sql`
    select
      (select count(distinct install_id) from app_event) as total,
      (select count(distinct install_id) from app_event where created_at >= ${since}) as active,
      (
        select count(*) from (
          select install_id, min(created_at) as first_seen
          from app_event group by install_id
        ) t where t.first_seen >= ${since}
      ) as fresh
  `);

  const versions = await rows<{ version: string | null; installs: string; events: string }>(sql`
    select app_version as version,
           count(distinct install_id) as installs,
           count(*) as events
    from app_event
    where created_at >= ${since30}
    group by app_version
    order by installs desc
    limit 10
  `);

  const funnel = await rows<{ name: string; count: string }>(sql`
    select name, count(*) as count
    from app_event
    where created_at >= ${since} and name like 'update.%'
    group by name
  `);

  // `why`, not `reason`: "reason" sits on the shared PII strip list, so a prop
  // by that name never survives ingest. Verified against real rows — the first
  // version of this event arrived with the reason already stripped.
  const failureReasons = await rows<{ reason: string | null; count: string }>(sql`
    select (props #>> '{}')::jsonb->>'why' as reason, count(*) as count
    from app_event
    where created_at >= ${since} and name = 'update.fail'
    group by 1
    order by count desc
    limit 5
  `);

  const errorScopes = await rows<{ scope: string | null; count: string }>(sql`
    select (props #>> '{}')::jsonb->>'scope' as scope, count(*) as count
    from app_event
    where created_at >= ${since} and name = 'app.error'
    group by 1
    order by count desc
    limit 10
  `);

  const errorSamples = await rows<{ scope: string | null; message: string | null; count: string }>(sql`
    select (props #>> '{}')::jsonb->>'scope' as scope, (props #>> '{}')::jsonb->>'message' as message, count(*) as count
    from app_event
    where created_at >= ${since} and name = 'app.error'
    group by 1, 2
    order by count desc
    limit 8
  `);

  const topEvents = await rows<{ name: string; count: string }>(sql`
    select name, count(*) as count
    from app_event
    where created_at >= ${since}
    group by name
    order by count desc
    limit 15
  `);

  const daily = await rows<{ day: string; installs: string; events: string }>(sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
           count(distinct install_id) as installs,
           count(*) as events
    from app_event
    where created_at >= now() - interval '7 days'
    group by 1
    order by 1
  `);

  const devices = await rows<{ device: string | null; installs: string }>(sql`
    select device, count(distinct install_id) as installs
    from app_event
    where created_at >= ${since30}
    group by device
    order by installs desc
    limit 10
  `);

  // ── First run ─────────────────────────────────────────────────────────────
  // The walk from "installed" to "using it". Every claim about first-run
  // drop-off was a guess before these events existed.
  const funnelCounts = await rows<{ name: string; installs: string }>(sql`
    select name, count(distinct install_id) as installs
    from app_event
    where created_at >= ${since}
      and name in ('onboarding.start', 'onboarding.done', 'auth.signin', 'firstrun.start', 'firstrun.finish')
    group by name
  `);
  const signInMethods = await rows<{ method: string | null; installs: string }>(sql`
    select (props #>> '{}')::jsonb->>'method' as method, count(distinct install_id) as installs
    from app_event
    where created_at >= ${since} and name = 'auth.signin'
    group by 1
  `);
  const wizardSteps = await rows<{ step: string | null; installs: string; avg_seconds: string | null }>(sql`
    select (props #>> '{}')::jsonb->>'step' as step,
           count(distinct install_id) as installs,
           round(avg(nullif((props #>> '{}')::jsonb->>'prev_seconds', '')::numeric)) as avg_seconds
    from app_event
    where created_at >= ${since} and name = 'firstrun.step'
    group by 1
    order by min(nullif((props #>> '{}')::jsonb->>'i', '')::int) nulls last
  `);
  // Where the people who never finished were last seen. This is the number the
  // wizard's design hinges on, so it is computed rather than eyeballed.
  const stuck = await rows<{ step: string | null; installs: string }>(sql`
    with seen as (
      select install_id, (props #>> '{}')::jsonb->>'step' as step, nullif((props #>> '{}')::jsonb->>'i', '')::int as i, created_at
      from app_event
      where name = 'firstrun.step' and created_at >= ${since}
    ), last as (
      select distinct on (install_id) install_id, step, i
      from seen
      order by install_id, created_at desc
    ), finished as (
      select distinct install_id from app_event
      where name = 'firstrun.finish' and created_at >= ${since}
    )
    select last.step, count(*) as installs
    from last
    left join finished on finished.install_id = last.install_id
    where finished.install_id is null
    group by 1
    order by min(last.i) nulls last
  `);

  const funnelCount = (name: string): number => n(funnelCounts.find((f) => f.name === name)?.installs ?? 0);
  const methodCount = (method: string): number => n(signInMethods.find((m) => m.method === method)?.installs ?? 0);

  const count = (name: string): number => n(funnel.find((f) => f.name === name)?.count ?? 0);
  const started = count("update.start");
  const installed = count("update.install");

  return {
    windowHours: hours,
    since: s(bounds?.since),
    installs: {
      total: n(totals?.total),
      newInWindow: n(totals?.fresh),
      activeInWindow: n(totals?.active),
    },
    versions: versions.map((v) => ({ version: s(v.version) || "(unknown)", installs: n(v.installs), events: n(v.events) })),
    updates: {
      available: count("update.available"),
      started,
      downloaded: count("update.downloaded"),
      installed,
      failed: count("update.fail"),
      completionRate: started > 0 ? Math.round((installed / started) * 100) : null,
      failureReasons: failureReasons.map((r) => ({ reason: s(r.reason) || "(no reason given)", count: n(r.count) })),
    },
    errors: {
      total: errorScopes.reduce((sum, r) => sum + n(r.count), 0),
      byScope: errorScopes.map((r) => ({ scope: s(r.scope) || "(none)", count: n(r.count) })),
      samples: errorSamples.map((r) => ({ scope: s(r.scope) || "(none)", message: s(r.message), count: n(r.count) })),
    },
    topEvents: topEvents.map((r) => ({ name: s(r.name), count: n(r.count) })),
    daily: daily.map((r) => ({ day: s(r.day), installs: n(r.installs), events: n(r.events) })),
    devices: devices.map((r) => ({ device: s(r.device) || "(unknown)", installs: n(r.installs) })),
    funnel: {
      onboardingStarted: funnelCount("onboarding.start"),
      onboardingFinished: funnelCount("onboarding.done"),
      signInGoogle: methodCount("google"),
      signInEmail: methodCount("email"),
      wizardStarted: funnelCount("firstrun.start"),
      wizardFinished: funnelCount("firstrun.finish"),
      steps: wizardSteps.map((r) => ({
        step: s(r.step) || "(unknown)",
        installs: n(r.installs),
        avgSeconds: r.avg_seconds === null || r.avg_seconds === undefined ? null : n(r.avg_seconds),
      })),
      stuck: stuck.map((r) => ({ step: s(r.step) || "(unknown)", installs: n(r.installs) })),
    },
  };
}

/**
 * The digest as something a human reads in 20 seconds — no JSON, no jargon.
 * Swahili by default: that's the language the app, the testers and the owner
 * actually use.
 */
export function renderDigest(d: TelemetryDigest, lang: "sw" | "en" = "sw"): string {
  const sw = lang === "sw";
  const L: string[] = [];

  L.push(sw ? `📱 Sumaiya — muhtasari wa saa ${d.windowHours} zilizopita` : `📱 Sumaiya — last ${d.windowHours}h`);

  if (d.installs.total === 0) {
    L.push("");
    L.push(sw ? "Bado hakuna data yoyote kutoka kwa simu." : "No data from any phone yet.");
    return L.join("\n");
  }

  L.push("");
  L.push(
    sw
      ? `• Watumiaji walio hai: ${d.installs.activeInWindow}`
      : `• Active installs: ${d.installs.activeInWindow}`,
  );
  L.push(sw ? `• Wapya leo: ${d.installs.newInWindow}` : `• New installs: ${d.installs.newInWindow}`);
  L.push(sw ? `• Jumla ya kifaa: ${d.installs.total}` : `• Total devices: ${d.installs.total}`);

  if (d.versions.length) {
    L.push("");
    L.push(sw ? "Toleo linalotumika:" : "Versions in use:");
    for (const v of d.versions.slice(0, 5)) {
      L.push(`• v${v.version} — ${v.installs} ${sw ? "kifaa" : "devices"}`);
    }
  }

  const u = d.updates;
  if (u.available || u.started) {
    L.push("");
    L.push(sw ? "Usasishaji:" : "Updater:");
    L.push(
      sw
        ? `• Waliona: ${u.available} · Walianza: ${u.started} · Walimaliza: ${u.installed}`
        : `• Offered: ${u.available} · Started: ${u.started} · Finished: ${u.installed}`,
    );
    if (u.failed) {
      L.push(sw ? `• Zilishindwa: ${u.failed}` : `• Failed: ${u.failed}`);
      for (const r of u.failureReasons.slice(0, 3)) {
        L.push(`   – ${r.count}× ${r.reason}`);
      }
    }
    if (u.completionRate !== null) {
      L.push(sw ? `• Ufanisi: ${u.completionRate}%` : `• Completion: ${u.completionRate}%`);
    }
  }

  if (d.errors.total) {
    L.push("");
    L.push(sw ? `Makosa: ${d.errors.total}` : `Errors: ${d.errors.total}`);
    for (const e of d.errors.byScope.slice(0, 5)) {
      L.push(`• ${e.scope} — ${e.count}`);
    }
    const worst = d.errors.samples[0];
    if (worst?.message) {
      L.push(sw ? `• Mara nyingi: ${worst.scope} — ${worst.message}` : `• Most common: ${worst.scope} — ${worst.message}`);
    }
  } else {
    L.push("");
    L.push(sw ? "✅ Hakuna kosa lililoripotiwa." : "✅ No errors reported.");
  }

  // ── First run ────────────────────────────────────────────────────────────
  // The walk from "installed" to "using it". Reported before the error section
  // would be wrong — this is where the product is actually won or lost.
  const f = d.funnel;
  if (f.onboardingStarted || f.wizardStarted) {
    L.push("");
    L.push(sw ? "Hatua za mwanzo:" : "First run:");
    L.push(sw ? `• Walianza kufungua app: ${f.onboardingStarted}` : `• Opened the app: ${f.onboardingStarted}`);
    L.push(sw ? `• Walifika mwisho wa slides: ${f.onboardingFinished}` : `• Reached the end of the slides: ${f.onboardingFinished}`);
    L.push(
      sw
        ? `• Walijiunga: Google ${f.signInGoogle} · Email ${f.signInEmail}`
        : `• Signed in: Google ${f.signInGoogle} · Email ${f.signInEmail}`,
    );
    if (f.wizardStarted) {
      const donePct = Math.round((f.wizardFinished / f.wizardStarted) * 100);
      L.push(
        sw
          ? `• Wizard: walianza ${f.wizardStarted} · walimaliza ${f.wizardFinished} (${donePct}%)`
          : `• Wizard: started ${f.wizardStarted} · finished ${f.wizardFinished} (${donePct}%)`,
      );
    }
    if (f.steps.length) {
      L.push(sw ? "  Hatua walizofikia (muda wa wastani):" : "  Steps reached (avg time):");
      for (const st of f.steps) {
        L.push(`  – ${st.step}: ${st.installs}${st.avgSeconds !== null ? ` · ${st.avgSeconds}s` : ""}`);
      }
    }
    if (f.stuck.length) {
      L.push(sw ? "  Waliacha kwenye:" : "  Stopped at:");
      for (const st of f.stuck) L.push(`  – ${st.step}: ${st.installs}`);
    }
  }

  return L.join("\n");
}
