/**
 * DOES A CV WRITTEN THROUGH THE API LAND IN THE DATABASE AS A REAL jsonb OBJECT?
 *
 * The unit test beside the route (`lib/api/routes/cv-jsonb-write.test.ts`) pins
 * what the write path hands the column. Only a real row can prove what the
 * column HOLDS — and "what the column holds" is the defect: a JSON *string*
 * inside jsonb reads back fine through the app's JS reader (which parses it),
 * so every screen looks right while `data->'personal'->>'fullName'` is NULL for
 * every SQL statement that is not the app.
 *
 * So this asks POSTGRES, after driving the product's own API:
 *   - jsonb_typeof(data) = 'object'          (a string is the bug)
 *   - data->'personal'->>'fullName' = <the name typed into the request>
 *   - jsonb_typeof(template_history) = 'array'
 *   - and the same for a PATCH (the editor's save path)
 *
 *   node --env-file=C:/Users/hamis/projects/_hdd-data/env/supabase.env \
 *     apps/web/scripts/verify-cv-write-shape.mjs [--url=https://sumaiya.app]
 *
 * Exit code 0 = every assertion held. Anything else prints the raw row.
 * It creates ONE throwaway account (@sumaiya-seam.invalid — no mail can be
 * delivered) and deletes it and its rows afterwards.
 */
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const APP = (arg("url", process.env.SEAM_APP_URL || "http://localhost:3010")).replace(/\/$/, "");
const DB_URL = (process.env.DATABASE_URL ?? "").replace(/\?&?sslmode=[^&]*/g, "");
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

for (const [k, v] of Object.entries({ DATABASE_URL: DB_URL, NEXT_PUBLIC_SUPABASE_URL: SUPA, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SERVICE })) {
  if (!v) {
    console.error(`MISSING ${k} — pass the secrets file with --env-file=…`);
    process.exit(1);
  }
}

const sql = postgres(DB_URL, { max: 1, prepare: false, ssl: { rejectUnauthorized: false } });
const failures = [];
const check = (ok, label, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
  if (!ok) failures.push(label);
};

const email = `seam-wshape-${randomUUID().slice(0, 8)}@sumaiya-seam.invalid`;
const password = `Seam!${randomUUID()}`;
const name = `WriteShape ${randomUUID().slice(0, 6)}`;

async function admin(path, init = {}) {
  const res = await fetch(`${SUPA}${path}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

let userId = null;
try {
  const created = await admin("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  userId = created.body?.id ?? null;
  if (!userId) throw new Error(`could not create a test user: ${created.status} ${JSON.stringify(created.body).slice(0, 160)}`);

  const grant = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await grant.json();
  if (!session?.access_token) throw new Error(`no session: ${grant.status} ${JSON.stringify(session).slice(0, 160)}`);
  const auth = { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" };

  // ── POST — the create path the guest-migration page uses ──────────────────
  const post = await fetch(`${APP}/api/cv`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ title: "Write shape", data: { personal: { fullName: name, jobTitle: "Storekeeper" }, summary: "probe" } }),
  });
  const createdBody = await post.json().catch(() => null);
  const id = createdBody?.data?.id;
  check(post.status === 201 && !!id, `POST ${APP}/api/cv → 201 with an id`, `got ${post.status} ${JSON.stringify(createdBody).slice(0, 160)}`);

  const afterPost = id
    ? (await sql`select jsonb_typeof(data)::text as data_type, jsonb_typeof(template_history)::text as history_type,
        data->'personal'->>'fullName' as sql_name from cv where id = ${id}`)[0]
    : null;
  if (id) {
    check(afterPost.data_type === "object", "POST: jsonb_typeof(data) = 'object' (not 'string')", `row ${id} holds jsonb_typeof=${afterPost.data_type}`);
    check(afterPost.history_type === "array", "POST: jsonb_typeof(template_history) = 'array'", `row ${id} holds jsonb_typeof=${afterPost.history_type}`);
    check(afterPost.sql_name === name, "POST: plain SQL jsonb path `data->'personal'->>'fullName'` returns the real name", `got ${JSON.stringify(afterPost.sql_name)} for ${JSON.stringify(name)}`);
  }

  // ── PATCH — the editor's save path ────────────────────────────────────────
  const patchName = `${name} (edited)`;
  const patch = id
    ? await fetch(`${APP}/api/cv/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ title: "Write shape", templateId: "nakuru", data: { personal: { fullName: patchName }, summary: "patched" } }) })
    : null;
  check(patch?.status === 200, `PATCH ${APP}/api/cv/:id → 200`, `got ${patch?.status}`);

  const afterPatch = id
    ? (await sql`select jsonb_typeof(data)::text as data_type, data->'personal'->>'fullName' as sql_name,
        data->>'summary' as sql_summary from cv where id = ${id}`)[0]
    : null;
  if (id) {
    check(afterPatch.data_type === "object", "PATCH: jsonb_typeof(data) = 'object'", `row ${id} holds jsonb_typeof=${afterPatch.data_type}`);
    check(afterPatch.sql_name === patchName, "PATCH: SQL jsonb path returns the edited name", `got ${JSON.stringify(afterPatch.sql_name)}`);
    check(afterPatch.sql_summary === "patched", "PATCH: a second jsonb path key is queryable too", `got ${JSON.stringify(afterPatch.sql_summary)}`);
  }

  // ── The app's own reader must still work on the repaired shape ────────────
  const list = await fetch(`${APP}/api/cv`, { headers: auth });
  const listBody = await list.json().catch(() => null);
  const row = (listBody?.data ?? []).find((r) => r.id === id);
  check(!!row && typeof row.data === "object" && row.data?.personal?.fullName === patchName,
    "GET /api/cv still reads the CV back (the JS reader keeps working)", `got ${JSON.stringify(row?.data?.personal?.fullName)}`);

  // ── Any row still stored as a string is a row the database cannot query ────
  const legacy = await sql`select count(*)::int as n from cv where jsonb_typeof(data) = 'string'`;
  check(legacy[0].n === 0, "no cv row anywhere is still stored as a jsonb string", `${legacy[0].n} row(s) still string-encoded (run scripts/repair-jsonb-strings.mjs --apply)`);
} catch (err) {
  check(false, "verifier crashed", err.message);
} finally {
  if (userId) {
    await sql`delete from cv where user_id = ${userId}`;
    await admin(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
  }
  await sql.end({ timeout: 5 });
}

console.log("");
if (failures.length) {
  console.log(`WRITE-SHAPE VERIFY FAILED — ${failures.length} assertion(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`WRITE-SHAPE VERIFY OK — every CV written through ${APP} landed as a real jsonb object.`);
