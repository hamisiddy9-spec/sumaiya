// PART 3 — the AI rate limit, measured against the live API with ZERO model
// spend: the test user's durable daily counter is pre-loaded to the documented
// cap, so every request is rejected by the quota check BEFORE the provider is
// called. That isolates the limiter from the model.
//
//  lib/api/ai-limit.ts: PER_MINUTE = AI_PER_MINUTE ?? 10, PER_DAY = AI_PER_DAY ?? 60
//  burst checked first (so a burst never eats daily allowance), then the daily
//  counter is incremented.
const fs = require("fs");
const path = require("path");
const { connect } = require("./db.cjs");

const EMAIL = process.argv[2] || "qa-io-matrix-1@sumaiya-seam.invalid";

(async () => {
  const c = await connect();
  const { rows } = await c.query("select id from auth.users where email = $1", [EMAIL]);
  if (!rows.length) throw new Error("test user not found");
  const uid = rows[0].id;
  const day = new Date().toISOString().slice(0, 10);

  // pre-load the daily counter to the documented cap (60)
  await c.query(
    `insert into ai_usage (user_id, day, count, updated_at) values ($1,$2,$3,now())
     on conflict (user_id, day) do update set count = $3, updated_at = now()`,
    [uid, day, 60]
  );
  const before = (await c.query("select count from ai_usage where user_id=$1 and day=$2", [uid, day])).rows[0].count;
  console.log(`ai_usage seeded: day=${day} count=${before} (documented PER_DAY=60)`);

  const { chromium } = require("playwright");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: path.join(__dirname, "testuser-state.json") });
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);

  const out = [];
  for (let i = 1; i <= 12; i++) {
    const r = await page.evaluate(async () => {
      const res = await fetch("/api/ai/assistant-turn", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }], lang: "en" }),
      });
      const t = await res.text();
      let j = null; try { j = JSON.parse(t); } catch { /* non-json */ }
      return { status: res.status, error: j?.error ?? null, retryAfter: j?.retryAfter ?? null, msg: j?.message ?? null, raw: j ? null : t.slice(0, 160) };
    });
    out.push({ n: i, ...r });
    console.log(`req ${String(i).padStart(2)}: status=${r.status} error=${JSON.stringify(r.error)} retryAfter=${r.retryAfter}`);
  }

  const after = (await c.query("select count from ai_usage where user_id=$1 and day=$2", [uid, day])).rows[0].count;
  console.log(`\nai_usage after 12 rejected requests: ${after} (was ${before}) — unchanged means no spend was charged`);
  const distinct = [...new Set(out.map((o) => o.error).filter(Boolean))];
  console.log("distinct rejection messages:", JSON.stringify(distinct, null, 1));
  fs.writeFileSync(path.join(__dirname, "results-ai-limit.json"), JSON.stringify({ day, seeded: before, after, requests: out, distinct }, null, 1));

  // tidy: put the counter back to 0 so the account is left clean
  await c.query("update ai_usage set count = 0 where user_id=$1 and day=$2", [uid, day]);
  await c.end();
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
