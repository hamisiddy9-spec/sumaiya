// Live campaign attribution probe: real Chrome, real network.
// 1. visit https://sumaiya.app/ats-checker?src=probe-live
// 2. record every request to /api/campaign/event (method, body, status)
// 3. print localStorage attribution keys
// Usage: node scripts/tmp-live-campaign.mjs <src>
import { createRequire } from "module";
const require = createRequire("C:/Users/hamis/projects/sumaiya/package.json");
const { chromium } = require("playwright");

const src = process.argv[2] || "probe-live";
const url = `https://sumaiya.app/ats-checker?src=${src}`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const seen = [];
page.on("request", (r) => {
  if (r.url().includes("/api/campaign/event")) {
    seen.push({ kind: "request", method: r.method(), body: r.postData() });
  }
});
page.on("response", async (r) => {
  if (r.url().includes("/api/campaign/event")) {
    seen.push({ kind: "response", status: r.status(), body: await r.text().catch(() => "") });
  }
});
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + String(e).slice(0, 300)));

console.log("REQ URL:", url);
const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
console.log("FINAL URL:", page.url());
console.log("HTTP:", resp && resp.status());
console.log("TITLE:", await page.title());
await page.waitForTimeout(5000);

const storage = await page.evaluate(() => {
  const o = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    o[k] = localStorage.getItem(k);
  }
  return o;
});
console.log("LOCALSTORAGE:", JSON.stringify(storage));

const h1 = await page.evaluate(() =>
  Array.from(document.querySelectorAll("h1,h2")).slice(0, 8).map((e) => e.textContent.trim()),
);
console.log("HEADINGS:", JSON.stringify(h1));

console.log("CAMPAIGN REQUESTS:", JSON.stringify(seen, null, 1));
console.log("CONSOLE ERRORS:", JSON.stringify(consoleErrors.slice(0, 10), null, 1));

await page.screenshot({ path: "C:/Users/hamis/AppData/Local/Temp/live-ats.png", fullPage: false });
await browser.close();
