/**
 * Live-state probe — answers questions the repo cannot.
 *
 * Why this exists: several product claims ("the job feed is empty", "push works",
 * "RLS is on") are only decidable against the live database, and every time one
 * was asked it was answered by guessing. This script answers them with counts and
 * schema flags and PRINTS NO ROW CONTENTS AND NO SECRETS.
 *
 * Usage (from apps/web, so the `postgres` module resolves):
 *   node ../../scripts/live-state-probe.cjs
 *   DATABASE_URL=postgres://... node scripts/live-state-probe.cjs
 *
 * Default env source: the out-of-repo secrets file the deploys use. Override with
 * DATABASE_URL rather than editing this file.
 */
const fs = require("fs");
const path = require("path");

const DEFAULT_ENV = "C:/Users/hamis/projects/_hdd-data/env/supabase.env";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const text = fs.readFileSync(path.resolve(DEFAULT_ENV), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL=(.*)$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fall through to the explicit error below */
  }
  return null;
}

const url = loadDatabaseUrl();
if (!url) {
  console.error("No DATABASE_URL. Set it in the environment, or write it to " + DEFAULT_ENV);
  process.exit(1);
}
// Never print the password.
console.log("target:", url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:<redacted>@"));

const postgres = require("postgres");
const sql = postgres(url, { max: 1, idle_timeout: 8, connect_timeout: 15 });

const TABLES = [
  "job", "campaign_event", "app_event", "debug_event", "device_token",
  "web_push_subscription", "signal_notification", "profile", "user_profile",
  "cv", "application", "outcome_report", "download_log", "ai_usage",
  "ats_score_snapshot", "template_submission", "referral_code", "referral_claim",
  "saved_job", "job_match", "tool_invocation", "provenance", "payment",
];

(async () => {
  try {
    // The app connects as `postgres` (Drizzle over DATABASE_URL), the same role
    // this probe uses; that is why RLS being off is invisible to the product.
    console.log("");

    // --- 1. Row counts. The product's pulse, one line each. -------------------
    console.log("== row counts ==");
    for (const t of TABLES) {
      try {
        const r = await sql`select count(*)::int as n from ${sql(t)}`;
        console.log(String(t).padEnd(24), r[0].n);
      } catch (e) {
        console.log(String(t).padEnd(24), "ERR " + e.message.slice(0, 60));
      }
    }
    const users = await sql`select count(*)::int as n, max(created_at)::text as newest from auth.users`.catch(() => [{ n: "ERR" }]);
    console.log("auth.users".padEnd(24), users[0].n, users[0].newest || "");

    // --- 2. Freshness, because "empty" and "stale" are different bugs. --------
    console.log("== freshness ==");
    for (const [t, col] of [["job", "created_at"], ["campaign_event", "occurred_at"], ["app_event", "created_at"]]) {
      const r = await sql`select max(${sql(col)})::text as newest from ${sql(t)}`.catch(() => [{ newest: "ERR" }]);
      console.log(String(t).padEnd(24), r[0].newest);
    }

    // --- 3. RLS coverage. The single most important security fact. ------------
    // With no policies AND the anon role granted, the public Supabase key can read
    // and write every table over PostgREST.
    console.log("== row level security ==");
    const tables = await sql`
      select c.relname as name, c.relrowsecurity as rls,
             (select count(*) from pg_policy p where p.polrelid = c.oid)::int as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' order by c.relname`;
    const noRls = tables.filter((t) => !t.rls);
    console.log(`public tables ${tables.length} · RLS on ${tables.length - noRls.length} · RLS off ${noRls.length}`);
    if (noRls.length) console.log("RLS OFF:", noRls.map((t) => t.name).join(", "));

    const grants = await sql`
      select privilege_type, count(*)::int as tables
      from information_schema.role_table_grants
      where grantee = 'anon' and table_schema = 'public'
      group by privilege_type order by tables desc`;
    console.log("anon grants:", grants.map((g) => `${g.privilege_type}=${g.tables}`).join(" ") || "(none)");

    const acl = await sql`select defaclacl::text as a from pg_default_acl where defaclobjtype = 'r' limit 1`.catch(() => []);
    if (acl[0]) console.log("default ACL for new tables:", acl[0].a);
  } catch (e) {
    console.log("FATAL:", e.message);
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }
})();
