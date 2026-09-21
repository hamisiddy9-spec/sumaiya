const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");
const ERR = /(Imeshindwa|kubwa mno|Sikuweza|Hatukuweza|Haikuweza|Couldn't|too large|failed)/;
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1400, height: 1100 } });
  const calls = [];
  ctx.on("request", (r) => { if (r.url().includes("/api/tools/")) calls.push(r.url()); });
  await ctx.route("**/api/ai/**", async (r) => { await r.abort("failed"); });
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/assistant?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);
  const t0 = Date.now();
  await (await page.$("input[type=file]")).setInputFiles(path.join(__dirname, "cv-huge.pdf"));
  const events = [];
  let terminal = null;
  for (let i = 0; i < 175; i++) {
    await page.waitForTimeout(1000);
    const t = await page.evaluate(() => document.body.innerText);
    const m = t.match(ERR);
    const chip = /·\s*inasoma/.test(t);
    if (!events.length || events[events.length - 1].chip !== chip || (m && events[events.length - 1].err !== m[0])) {
      events.push({ at: Date.now() - t0, chip, err: m ? m[0] : null });
    }
    if (m) { terminal = { at: Date.now() - t0, match: m[0], line: (t.split("\n").map((s) => s.trim()).filter((s) => ERR.test(s))[0] || "").slice(0, 160) }; break; }
    if (!chip && i > 6) { terminal = { at: Date.now() - t0, match: null, line: "chip cleared, no error string" }; break; }
  }
  const rec = { file: "cv-huge.pdf", bytes: fs.statSync(path.join(__dirname, "cv-huge.pdf")).size, terminal, events, serverCalls: calls.slice(0, 6), ms: Date.now() - t0 };
  console.log(JSON.stringify(rec, null, 1));
  fs.writeFileSync(path.join(__dirname, "results-recheck-huge.json"), JSON.stringify(rec, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 300)); process.exit(1); });
