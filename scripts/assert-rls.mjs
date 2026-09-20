#!/usr/bin/env node
/**
 * assert-rls — fail the build if the public schema is reachable with the anon key.
 *
 * WHY THIS EXISTS: the anon key ships in the browser bundle by design, so any
 * table that is both granted to `anon` and has RLS off is readable (and usually
 * writable) by anyone who opens devtools. That was true of all 33 public tables
 * until 0020_row_level_security.sql. Nothing in the product would notice a
 * regression — every app read/write goes through Drizzle as `postgres`, which
 * bypasses RLS — so this assertion is the only thing that can catch it.
 *
 *   node scripts/assert-rls.mjs           # needs DATABASE_URL in the env
 *
 * Exits 1 with a list of offenders. Exits 2 if DATABASE_URL is not set, so a CI
 * run cannot silently skip the check.
 *
 * Rules, in order of what actually protects a row:
 *   1. Every table in `public` must have relrowsecurity = true, OR grant `anon`
 *      nothing at all (a privilege-less table is unreachable regardless).
 *   2. `anon` must hold no INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on
 *      ANY public table — the product has no anonymous write path.
 *   3. `anon` may hold SELECT only on tables covered by a deliberate public-read
 *      policy (the job feed). This list is the allowlist; adding a table to it is a
 *      product decision, not a drive-by grant.
 *   3b. `cv` was REMOVED from that allowlist on 2026-09-20, and must stay out. A
 *      policy restricting anon to published rows does NOT make those rows unlisted:
 *      PostgREST filters are client-supplied, so any holder of the anon key - which
 *      ships in the web bundle and the APK - could request `is_public=eq.true` and
 *      list every published CV in full, photo included, without a slug. The public
 *      share page reads server-side as `postgres`, so anon needs no grant at all.
 *      See apps/web/drizzle/migrations/0021_lock_down_cv_enumeration.sql.
 *   4. No deny-by-default telemetry table may grow a policy.
 *
 * `service_role` and `postgres` are intentionally NOT checked: both hold
 * rolbypassrls and are the server's own identities.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
let Client;
for (const candidate of ['pg', path.join(here, '..', 'node_modules', 'pg'), path.join(here, '..', 'apps', 'web', 'node_modules', 'pg')]) {
  try { ({ Client } = req(candidate)); break; } catch { /* try the next one */ }
}
if (!Client) {
  console.error('assert-rls: the `pg` module is not installed — run `pnpm install` (or `npm i -g pg`) first.');
  process.exit(2);
}

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error('assert-rls: DATABASE_URL is not set — refusing to pass silently.');
  process.exit(2);
}

/** Tables the product deliberately exposes for public read, with the reason. */
const PUBLIC_READ_ALLOWLIST = {
  job: 'job_public_feed_select — the job feed; public listings, no personal data',
};
/** Tables that must NEVER be anon-readable, and why. Guards a hole that was closed. */
const NEVER_ANON_READABLE = {
  cv: 'an anon SELECT on cv exposes every published CV and its photo, because the client chooses the filter — see 0021_lock_down_cv_enumeration.sql',
};
/** Server-side telemetry: RLS on, deliberately zero policies. */
const DENY_BY_DEFAULT = ['app_event', 'app_release', 'campaign_event', 'eval_sample', 'outcome_event'];

const c = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async (sql, p) => (await c.query(sql, p)).rows;

const failures = [];

const tables = await q(`
  select c.relname as table_name, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' order by 1`);

const anonPriv = {};
for (const r of await q(`
  select table_name, privilege_type
  from information_schema.role_table_grants
  where grantee = 'anon' and table_schema = 'public' order by 1,2`)) {
  (anonPriv[r.table_name] ??= []).push(r.privilege_type);
}

const policyCount = Object.fromEntries(
  (await q(`select tablename, count(*)::int n from pg_policies where schemaname='public' group by 1`))
    .map(r => [r.tablename, r.n]));

// Rule 1 — RLS on, or anon holds nothing
for (const t of tables) {
  if (!t.relrowsecurity && (anonPriv[t.table_name]?.length ?? 0) > 0) {
    failures.push(`RLS OFF + anon holds ${anonPriv[t.table_name].join('/')}: public.${t.table_name}`);
  }
}

// Rule 2 — no anonymous write, anywhere
const WRITE = new Set(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']);
for (const [t, privs] of Object.entries(anonPriv)) {
  const bad = privs.filter(p => WRITE.has(p));
  if (bad.length) failures.push(`anon holds write privilege ${bad.join('/')} on public.${t}`);
}

// Rule 3 — anon SELECT only where the product says so
for (const [t, privs] of Object.entries(anonPriv)) {
  if (privs.includes('SELECT') && !(t in PUBLIC_READ_ALLOWLIST)) {
    failures.push(`anon holds SELECT on public.${t}, which has no declared public-read policy`);
  }
}
// ...and the allowlisted tables must still be reachable and still have their policy
for (const t of Object.keys(PUBLIC_READ_ALLOWLIST)) {
  if (!(anonPriv[t] ?? []).includes('SELECT')) failures.push(`public.${t} lost anon SELECT — the public surface is broken`);
  if (!policyCount[t]) failures.push(`public.${t} has no policy at all — the public-read surface would return nothing`);
}
// ...and a table that was deliberately closed to anon must stay closed
for (const [t, why] of Object.entries(NEVER_ANON_READABLE)) {
  if ((anonPriv[t] ?? []).includes('SELECT')) failures.push(`public.${t} is anon-readable again — ${why}`);
}
// ...and nothing else may hold a policy that mentions anon or public
for (const r of await q(`select tablename, policyname from pg_policies
    where schemaname='public' and (roles::text like '%anon%' or roles::text like '%{public}%') order by 1,2`)) {
  if (!(r.tablename in PUBLIC_READ_ALLOWLIST)) {
    failures.push(`policy ${r.policyname} on public.${r.tablename} is reachable by anon but that table is not declared public`);
  }
}

// Rule 4 — deny-by-default stays deny-by-default
for (const t of DENY_BY_DEFAULT) {
  if (policyCount[t]) failures.push(`public.${t} is declared deny-by-default but now has ${policyCount[t]} policy(ies)`);
}

// Insurance: every text primary key should be able to make its own id
const noDefault = await q(`
  select table_name from information_schema.columns
  where table_schema='public' and column_name='id' and column_default is null order by 1`);
for (const r of noDefault) failures.push(`public.${r.table_name}.id has no DEFAULT (an id-less insert fails with 23502)`);

console.log(`assert-rls: ${tables.length} public tables, ${tables.filter(t => t.relrowsecurity).length} with RLS on, ` +
  `${Object.keys(anonPriv).length} reachable by anon`);

if (failures.length) {
  console.error('\nFAIL — the public schema is reachable with the public anon key:');
  for (const f of failures) console.error('  • ' + f);
  await c.end();
  process.exit(1);
}
console.log(`OK — no public table is exposed to anon beyond ${Object.keys(PUBLIC_READ_ALLOWLIST).join(' + ')}`);
await c.end();
