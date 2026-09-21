// Read-only DB probe + the cleanup/verification tool.
// The service_role key and DATABASE_URL are read from disk at runtime and NEVER
// printed. sslmode is stripped and TLS verification relaxed (Supabase pooler).
const fs = require("fs");
const { Client } = require("pg");

const ENVF = "C:/Users/hamis/projects/_hdd-data/env/supabase.env";

function env() {
  const out = {};
  for (const line of fs.readFileSync(ENVF, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

async function connect() {
  const e = env();
  const url = e.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  return c;
}

module.exports = { connect, env };

if (require.main === module) {
  (async () => {
    const c = await connect();
    const q = process.argv[2] || "select 1 as ok";
    try {
      const r = await c.query(q);
      console.log(JSON.stringify(r.rows, null, 1));
    } finally { await c.end(); }
  })().catch((e) => { console.error("DBFATAL", String(e).slice(0, 300)); process.exit(1); });
}
