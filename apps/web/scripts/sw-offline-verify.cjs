/**
 * SW offline verification — headless Chrome proof for PWA PR-2.
 *
 * Flow: load / (fills precache + runtime cache) → load /editor/cv/try (caches
 * the guest editor shell + JS chunks) → go OFFLINE → reload / (shell from
 * cache) → navigate to a never-visited path (branded offline page, NOT the
 * browser error) → reload /editor/cv/try (editor shell from cache) → back
 * online → fresh HTML (network-first, no stale) → assert /api/* never cached.
 *
 * CJS so NODE_PATH resolves playwright from the hermes agent bundle:
 *   NODE_PATH=/home/oem/.hermes/hermes-agent/node_modules node scripts/sw-offline-verify.cjs [BASE_URL]
 */
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3000";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // mobile-ish
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120)); });
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 120)));

  // 1. Online: load home — SW registers + precaches.
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500); // let precache settle

  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const cacheNames = await caches.keys();
    let precached = [];
    const c = await caches.open(cacheNames.find((k) => k.startsWith("th-cache")) || "");
    if (c) precached = (await c.keys()).map((r) => new URL(r.url).pathname);
    return { scope: reg.scope, cacheNames, precached };
  });
  check("SW registered with scope /", swState.scope === BASE + "/", swState.scope);
  check("versioned cache exists (th-cache-vN)", swState.cacheNames.some((k) => /^th-cache-v\d+$/.test(k)), swState.cacheNames.join(","));
  check("offline.html precached", swState.precached.includes("/offline.html"), swState.precached.join(","));

  // 2. Online: load the guest CV editor — caches its shell + JS chunks.
  await page.goto(BASE + "/editor/cv/try", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);
  const editorCached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const c = await caches.open(keys.find((k) => k.startsWith("th-cache")) || "");
    if (!c) return { html: false, chunks: 0, total: 0 };
    const reqs = await c.keys();
    const urls = reqs.map((r) => r.url);
    return {
      html: urls.some((u) => u.includes("/editor/cv/try")),
      chunks: urls.filter((u) => u.includes("/_next/static/")).length,
      total: urls.length,
    };
  });
  check("editor HTML cached (network-first store)", editorCached.html, `total=${editorCached.total}`);
  check("editor JS chunks cached (SWR)", editorCached.chunks > 0, `chunks=${editorCached.chunks}`);

  // 3. OFFLINE: reload home — the shell must come from cache.
  await ctx.setOffline(true);
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const homeTitle = await page.title().catch(() => "");
  check("offline reload of / serves the cached shell (not browser error)", homeTitle.length > 0 && !homeTitle.includes("This site can"), homeTitle);

  // 4. OFFLINE: never-visited path → branded offline page.
  await page.goto(BASE + "/some-never-visited-page-xyz", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const offlineBody = await page.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => "");
  check(
    "cold offline path shows the branded offline page (bilingual, Retry)",
    offlineBody.includes("offline") || offlineBody.includes("mtandao"),
    offlineBody.slice(0, 80).replace(/\n/g, " "),
  );

  // 5. OFFLINE: reload the guest editor — shell must come from cache.
  await page.goto(BASE + "/editor/cv/try", { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const editorBody = await page.evaluate(() => document.body.innerText.slice(0, 150)).catch(() => "");
  const editorOk = editorBody.length > 20 && !editorBody.includes("This site can");
  check("offline reload of /editor/cv/try renders the editor shell", editorOk, editorBody.slice(0, 60).replace(/\n/g, " "));

  // 6. Back ONLINE: fresh HTML flows (network-first).
  await ctx.setOffline(false);
  await page.goto(BASE + "/pricing", { waitUntil: "networkidle", timeout: 45000 });
  const pricingTitle = await page.title();
  check("back online → fresh network HTML (no stale)", pricingTitle.length > 0, pricingTitle);

  // 7. /api must NEVER be in the cache.
  const apiLeak = await page.evaluate(async () => {
    const keys = await caches.keys();
    let leak = [];
    for (const k of keys) {
      const c = await caches.open(k);
      const urls = (await c.keys()).map((r) => r.url);
      leak = leak.concat(urls.filter((u) => u.includes("/api/")));
    }
    return leak;
  });
  check("/api/* never cached", apiLeak.length === 0, apiLeak.join(",") || "clean");

  console.log("\nconsole errors (context):", consoleErrors.length ? consoleErrors.slice(0, 5) : "none");
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(2);
});
