// Fresh-context re-check of the two cases the sweep could not resolve, because
// the assistant PERSISTS its thread: once an earlier case printed the same
// wording, a later identical message was no longer a "new line" to the diff.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");
const CASES = [["cv-huge.pdf", 27 * 1024 * 1024], ["cv-noextension", 0]];
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const out = [];
  for (const [file, _] of CASES) {
    const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1400, height: 1100 } });
    const captured = [];
    await ctx.route("**/api/ai/**", async (r) => { captured.push(r.request().url()); await r.abort("failed"); });
    const page = await ctx.newPage();
    await page.goto("https://sumaiya.app/assistant?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4000);
    const before = await page.evaluate(() => document.body.innerText);
    const t0 = Date.now();
    let after = before, kind = "TIMEOUT";
    try {
      await (await page.$("input[type=file]")).setInputFiles(path.join(__dirname, file));
      for (let i = 0; i < 90; i++) {
        await page.waitForTimeout(1000);
        after = await page.evaluate(() => document.body.innerText);
        if (after !== before) { kind = "CHANGED"; break; }
      }
    } catch (e) { kind = "HARNESS_ERR:" + String(e).slice(0, 80); }
    const beforeLines = new Set(before.split("\n").map((s) => s.trim()));
    const added = after.split("\n").map((s) => s.trim()).filter((s) => s && !beforeLines.has(s));
    out.push({ file, kind, ms: Date.now() - t0, addedLines: added.slice(0, 6), aiCalls: captured.length, tail: after.slice(-260).replace(/\s+/g, " ") });
    console.log(JSON.stringify(out[out.length - 1]));
    await ctx.close();
  }
  fs.writeFileSync(path.join(__dirname, "results-recheck.json"), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 300)); process.exit(1); });
