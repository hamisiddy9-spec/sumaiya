// Create/clean a throwaway test user + capture a REAL signed-in session.
// Addresses use @sumaiya-seam.invalid (MX goes nowhere, so no mail can arrive).
// The service_role key is read from disk at runtime and NEVER printed.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ENVF = "C:/Users/hamis/projects/_hdd-data/env/supabase.env";
const STATE = path.join(__dirname, "testuser.json");

function readEnv() {
  const raw = fs.readFileSync(ENVF, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function ensureUser(tag) {
  const env = readEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const srk = env.SUPABASE_SERVICE_ROLE_KEY;
  const email = `${tag}@sumaiya-seam.invalid`;
  const h = { apikey: srk, Authorization: `Bearer ${srk}`, "Content-Type": "application/json" };

  const list = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: h });
  const lj = await list.json();
  const users = lj.users || lj;
  let user = (users || []).find((u) => u.email === email);
  if (!user) {
    const r = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST", headers: h,
      body: JSON.stringify({ email, email_confirm: true, user_metadata: { qa: "io-matrix" } }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error("create failed: " + JSON.stringify(j).slice(0, 300));
    user = j.user || j;
  }
  // magic link the app's own callback will exchange for cookies
  const gl = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST", headers: h,
    body: JSON.stringify({ type: "magiclink", email, redirect_to: "https://sumaiya.app/auth/callback" }),
  });
  const gj = await gl.json();
  return { email, userId: user.id, actionLink: gj.action_link, projectUrl: url, created: !users?.find?.((u) => u.email === email) };
}

async function signIn(actionLink, outState) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(actionLink, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(6000);
  const urlNow = page.url();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  const finalUrl = page.url();
  const body = (await page.innerText("body")).slice(0, 300);
  const cookies = (await ctx.cookies()).map((c) => c.name);
  const signedIn = /\/dashboard/.test(finalUrl) && !/sign-in/.test(finalUrl);
  if (signedIn) await ctx.storageState({ path: outState });
  await browser.close();
  return { actionUrl: urlNow, finalUrl, signedIn, cookieNames: cookies, bodyHead: body };
}

(async () => {
  const tag = process.argv[2] || `qa-io-${Date.now()}`;
  const u = await ensureUser(tag);
  console.log(JSON.stringify({ email: u.email, userId: u.userId, gotLink: !!u.actionLink, linkHost: u.actionLink ? new URL(u.actionLink).host : null }));
  const s = await signIn(u.actionLink, STATE);
  console.log(JSON.stringify(s));
  fs.writeFileSync(STATE.replace(".json", ".meta.json"), JSON.stringify({ ...u, actionLink: undefined, ...s }, null, 1));
})().catch((e) => { console.error("FATAL", String(e).slice(0, 400)); process.exit(1); });
