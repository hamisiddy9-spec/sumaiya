/**
 * End-to-end smoke test against the DEPLOYED app, driven by a real cloud
 * browser via Browserbase. Verifies the public / guest flows that a headless
 * sandbox can't render locally — most importantly, that the guest CV editor
 * actually renders the live A4 preview and that editing a field updates it.
 *
 * Run:
 *   BROWSERBASE_API_KEY=... BROWSERBASE_PROJECT_ID=... npm run test:e2e
 *   # optional: TARGET_URL=https://sumaiya.app (default)
 *
 * Exit code: 0 = all checks passed, 1 = a check failed, 2 = misconfigured.
 * On failure it saves a screenshot under scripts/e2e-artifacts/.
 */
import { mkdirSync, existsSync } from "node:fs";
import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright-core";

const API_KEY = process.env.BROWSERBASE_API_KEY;
const PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;
const BASE = (process.env.TARGET_URL || "https://sumaiya.app").replace(/\/$/, "");
const ART_DIR = "scripts/e2e-artifacts";

if (!API_KEY || !PROJECT_ID) {
  console.error("Missing BROWSERBASE_API_KEY and/or BROWSERBASE_PROJECT_ID.");
  console.error("Get them from app.browserbase.com, then:");
  console.error("  BROWSERBASE_API_KEY=... BROWSERBASE_PROJECT_ID=... npm run test:e2e");
  process.exit(2);
}

async function main() {
  if (!existsSync(ART_DIR)) mkdirSync(ART_DIR, { recursive: true });

  const bb = new Browserbase({ apiKey: API_KEY });
  const session = await bb.sessions.create({ projectId: PROJECT_ID });
  console.log(`Browserbase session ${session.id}`);
  console.log(`Target: ${BASE}\n`);

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const results = [];
  let page;

  const check = async (name, fn) => {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`  ✓ ${name}`);
    } catch (err) {
      const msg = err?.message ?? String(err);
      results.push({ name, ok: false, err: msg });
      console.log(`  ✗ ${name} — ${msg}`);
      if (page) {
        const file = `${ART_DIR}/fail-${name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.png`;
        await page.screenshot({ path: file, fullPage: true }).catch(() => {});
      }
    }
  };

  const okStatus = (res) => {
    if (!res) throw new Error("no response");
    if (res.status() >= 400) throw new Error(`HTTP ${res.status()}`);
  };

  try {
    const context = browser.contexts()[0] ?? (await browser.newContext());
    page = context.pages()[0] ?? (await context.newPage());
    page.setDefaultTimeout(30_000);

    await check("landing loads, shows brand + guest-try CTA", async () => {
      okStatus(await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" }));
      await page.waitForSelector("text=/Sumaiya/i", { timeout: 15_000 });
      if ((await page.locator('a[href="/editor/cv/try"]').count()) === 0) {
        throw new Error("no /editor/cv/try CTA on landing");
      }
    });

    await check("templates gallery renders cards", async () => {
      okStatus(await page.goto(`${BASE}/templates`, { waitUntil: "domcontentloaded" }));
      await page.waitForLoadState("networkidle").catch(() => {});
      if ((await page.locator('a[href^="/templates/"], [id$="-preview"]').count()) === 0) {
        throw new Error("no template cards found");
      }
    });

    await check("guest CV editor renders the live A4 preview (#cv-preview)", async () => {
      okStatus(await page.goto(`${BASE}/editor/cv/try`, { waitUntil: "domcontentloaded" }));
      await page.waitForSelector("#cv-preview", { state: "visible", timeout: 30_000 });
    });

    await check("editing a field updates the preview (live data binding)", async () => {
      const stamp = `ZZSMOKE${Date.now().toString().slice(-5)}`;
      const named = page.locator(
        'input[placeholder*="Kariuki" i], input[placeholder*="name" i], input[placeholder*="Jina" i]'
      ).first();
      const target = (await named.count()) ? named : page.locator('input[type="text"]').first();
      await target.fill(stamp, { timeout: 15_000 });
      await page.waitForFunction(
        (s) => document.querySelector("#cv-preview")?.textContent?.includes(s),
        stamp,
        { timeout: 15_000 }
      );
    });

    await check("tools page loads", async () => {
      okStatus(await page.goto(`${BASE}/tools`, { waitUntil: "domcontentloaded" }));
    });

    await check("pricing page loads", async () => {
      okStatus(await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" }));
    });
  } finally {
    await browser.close().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log(`Artifacts (screenshots) in ${ART_DIR}/`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Harness error:", err?.stack ?? err);
  process.exit(1);
});
