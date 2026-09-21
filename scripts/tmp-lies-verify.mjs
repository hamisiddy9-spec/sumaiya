#!/usr/bin/env node
/**
 * TMP — evidence driver for the "lies and dead controls" pass (NOT a committed
 * test). Boots the app from a private runtime copy (its own .next, so another
 * agent's build cannot corrupt it), signs a REAL free test user in with minted
 * SSR cookies, and observes:
 *   - what /api/entitlements says next to what the dashboard banner says
 *   - the letter-tab header button ("Barua Rasmi Mpya"): does a click open the
 *     creation sheet, the type dropdown, or nothing at all
 *   - the guest journey into /voice, /assistant, /snap, /templates, /editor/cv/try
 *
 * Usage: node scripts/tmp-lies-verify.mjs <label> [--keep]
 * Writes .tmp-lies/<label>/evidence.json. Always deletes its test user.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { loadSecrets, resolve } from "./seam/lib/env.mjs";
import { prepareRuntimeCopy, ensureAppServer, appEnv, askOsForFreePort, killServerTree } from "./seam/lib/app-server.mjs";
import { createTestUser, deleteTestUser, passwordGrant, mintSsrCookies } from "./seam/lib/auth.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const req = createRequire(path.join(REPO, "package.json"));
const LABEL = process.argv[2] || "run";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outDir = path.join(REPO, ".tmp-lies", LABEL);
const EVIDENCE = {};
const say = (k, v) => { EVIDENCE[k] = v; console.error(`[obs] ${k}`); };

const secrets = loadSecrets();
const supabaseUrl = resolve("NEXT_PUBLIC_SUPABASE_URL", secrets);
const anonKey = resolve("NEXT_PUBLIC_SUPABASE_ANON_KEY", secrets);
const serviceRoleKey = resolve("SUPABASE_SERVICE_ROLE_KEY", secrets);
if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.log(JSON.stringify({ fatal: "missing supabase secrets in the env dir" }));
  process.exit(1);
}

let server = null, browser = null, testUserId = null;
try {
  const copy = prepareRuntimeCopy({ outDir });
  say("runtimeCopy", { files: copy.files });
  const port = await askOsForFreePort();
  server = await ensureAppServer({
    port,
    env: appEnv({ secrets, appUrl: `http://localhost:${port}`, resolveEnv: resolve }),
    outDir,
    webDir: copy.webDir,
    waitMs: 240_000,
  });
  if (!server.ok) { console.log(JSON.stringify({ fatal: "app server", server }, null, 1)); process.exit(1); }
  const appUrl = `http://localhost:${server.port || port}`;
  say("appUrl", { port: server.port || port, started: server.started, reused: !!server.reused });

  const { chromium } = req("playwright-core");
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const nav = { waitUntil: "domcontentloaded", timeout: 180_000 };

  // ── GUEST (no cookies) ────────────────────────────────────────────────────
  const guestCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const gp = await guestCtx.newPage();
  const guestRoutes = {};
  for (const p of ["/assistant", "/snap", "/templates", "/editor/cv/try", "/voice"]) {
    try {
      const resp = await gp.goto(appUrl + p, nav);
      await gp.waitForTimeout(1500);
      const body = (await gp.locator("body").innerText().catch(() => "")).slice(0, 600);
      guestRoutes[p] = {
        status: resp ? resp.status() : null,
        finalUrl: gp.url().replace(appUrl, ""),
        bouncedToSignIn: /sign-in/.test(gp.url()),
        text: body.replace(/\s+/g, " ").trim().slice(0, 400),
      };
    } catch (e) {
      guestRoutes[p] = { error: String(e).slice(0, 200) };
    }
  }
  say("guestRoutes", guestRoutes);
  await guestCtx.close();

  // ── SIGNED IN (real free account, minted SSR cookies) ─────────────────────
  const email = `qa-lies-${Date.now()}@sumaiya-seam.invalid`;
  const password = "Seam!Passw0rd123";
  const created = await createTestUser({ supabaseUrl, serviceRoleKey, email, password });
  if (!created.ok) { console.log(JSON.stringify({ fatal: "createTestUser", created }, null, 1)); process.exit(1); }
  testUserId = created.id;
  const grant = await passwordGrant({ supabaseUrl, anonKey, email, password });
  if (!grant.ok) { console.log(JSON.stringify({ fatal: "passwordGrant", grant }, null, 1)); process.exit(1); }
  const minted = await mintSsrCookies({ supabaseUrl, anonKey, accessToken: grant.accessToken, refreshToken: grant.refreshToken });
  say("session", { ok: minted.ok, cookies: minted.cookies.length, userId: minted.userId });

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies(minted.cookies.map((c) => ({ name: c.name, value: c.value, url: appUrl })));
  const page = await ctx.newPage();

  // /dashboard — the banner vs the API
  await page.goto(`${appUrl}/dashboard`, nav);
  await page.waitForTimeout(4000);
  const entitlements = await page.evaluate(async () => {
    const r = await fetch("/api/entitlements", { credentials: "same-origin" });
    return r.json();
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  const dashText = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  const bannerSnippets = {};
  for (const s of [
    "Umefunguliwa Kila Kitu", "Kila kitu kipo tayari kutumika",
    "Huduma zote zimefunguliwa", "Everything free & unlocked",
    "Full access", "All features unlocked",
  ]) bannerSnippets[s] = dashText.includes(s);
  say("dashboard", {
    entitlements,
    bannerSnippets,
    bannerContext: (dashText.match(/.{0,60}(Umefunguliwa Kila Kitu|Huduma zote zimefunguliwa|Kila kitu kipo tayari kutumika).{0,140}/g) || []).slice(0, 4),
  });

  // /dashboard?tab=letter — the header button
  await page.goto(`${appUrl}/dashboard?tab=letter`, nav);
  await page.waitForTimeout(4000);
  const letterButtons = await page.evaluate(() =>
    [...document.querySelectorAll("button, a, [role=button]")]
      .map((el, i) => ({
        i,
        tag: el.tagName,
        role: el.getAttribute("role"),
        text: (el.textContent || "").trim().slice(0, 60),
        box: (() => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
      }))
      .filter((b) => /Barua Rasmi/.test(b.text)),
  );
  say("letterTabControls", letterButtons);

  const target = page.getByRole("button", { name: /Barua Rasmi Mpya/ }).first();
  const beforeUrl = page.url();
  let clickOutcome = { clicked: false };
  try {
    await target.scrollIntoViewIfNeeded();
    await target.click({ timeout: 20_000 });
    clickOutcome.clicked = true;
  } catch (e) {
    clickOutcome.clickError = String(e).slice(0, 300);
  }
  if (clickOutcome.clicked) {
    await page.waitForTimeout(2500);
    clickOutcome.dialogCount = await page.locator('[role=dialog]').count();
    clickOutcome.dialogTitle = await page.locator('[role=dialog]').first().innerText().catch(() => "");
    clickOutcome.urlChanged = page.url() !== beforeUrl;
    clickOutcome.url = page.url().replace(appUrl, "");
    // Any newly visible listbox/menu items (the letter-type dropdown)?
    clickOutcome.visibleMenuItems = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll(".absolute[class*=z-50], [role=menu], [role=listbox]")) {
        const t = (el.textContent || "").trim();
        if (t) out.push(t.slice(0, 200));
      }
      return out.slice(0, 3);
    });
    // If a dropdown opened, click its first entry and see whether the sheet comes.
    if (clickOutcome.dialogCount === 0 && clickOutcome.visibleMenuItems.length) {
      const firstItem = page.locator(".absolute[class*=z-50] button").first();
      try {
        await firstItem.click({ timeout: 15_000 });
        await page.waitForTimeout(3000);
        clickOutcome.afterTypeClick = {
          dialogCount: await page.locator('[role=dialog]').count(),
          dialogTitle: await page.locator('[role=dialog]').first().innerText().catch(() => ""),
          url: page.url().replace(appUrl, ""),
        };
      } catch (e) {
        clickOutcome.afterTypeClick = { error: String(e).slice(0, 200) };
      }
    }
    await page.screenshot({ path: path.join(outDir, "letter-click.png"), fullPage: false }).catch(() => {});
  }
  say("letterButtonClick", clickOutcome);

  await ctx.close();
} catch (err) {
  say("error", String(err).slice(0, 500));
} finally {
  try { if (browser) await browser.close(); } catch {}
  try { if (server && server.child) killServerTree(server.child); } catch {}
  if (testUserId) {
    try {
      const r = await deleteTestUser({ supabaseUrl, serviceRoleKey, id: testUserId });
      say("cleanup", { deleted: r.ok, status: r.status });
    } catch (e) { say("cleanup", { error: String(e).slice(0, 200) }); }
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify(EVIDENCE, null, 2));
console.log(JSON.stringify(EVIDENCE, null, 2));
