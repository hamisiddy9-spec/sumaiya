// TEMP read-only probe: campaign_event rows. Prints no secrets.
import fs from "fs";
import path from "path";
import pg from "pg";

const root = path.resolve(import.meta.dirname, "..");
// apps/web/.env.local points at a RETIRED Supabase tenant
// (postgres.ayczgaddnufdxnhizpcr) and fails with "tenant/user ... not found".
// The live project is duywnmibgiqulqzunsmh; its creds live in _hdd-data/env.
const env = fs.readFileSync(
  "C:/Users/hamis/projects/_hdd-data/env/supabase.env",
  "utf8",
);
const raw = (env.match(/^DATABASE_URL=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!raw) throw new Error("no DATABASE_URL");
// Strip libpq sslmode: pg's parser honours it over the ssl option below and
// 'require' still validates the chain, which fails on the pooler cert.
const url = raw.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
console.log("DATABASE_URL host:", new URL(url.replace(/^postgres(ql)?:/, "http:")).host);

const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
const cols = await c.query(
  "select column_name, data_type, is_nullable from information_schema.columns where table_name='campaign_event' order by ordinal_position",
);
console.log("COLUMNS:", JSON.stringify(cols.rows));
const cnt = await c.query("select count(*)::int as n from campaign_event");
console.log("TOTAL ROWS:", cnt.rows[0].n);
const bySrc = await c.query(
  "select src, name, count(*)::int as n, count(distinct visitor_id)::int as visitors, min(created_at) as first, max(created_at) as last from campaign_event group by src, name order by n desc limit 30",
);
console.log("BY SRC/NAME:", JSON.stringify(bySrc.rows, null, 1));
const recent = await c.query(
  "select id, src, name, visitor_id, props, created_at from campaign_event order by created_at desc limit 10",
);
console.log("RECENT:", JSON.stringify(recent.rows, null, 1));
await c.end();
