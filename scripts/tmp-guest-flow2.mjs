// Guest flow, take 2 — fill the REAL name field (not the document title) and
// check what the exported PDF actually contains.
import { createRequire } from "module";
import fs from "fs";
const require = createRequire("C:/Users/hamis/projects/sumaiya/package.json");
const { chromium } = require("playwright");

const OUT = "C:/Users/hamis/AppData/Local/Temp/sumaiya-guest2";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1500, height: 1100 } });
const page = await ctx.newPage();

const r = await page.goto("https://sumaiya.app/editor/cv/try", { waitUntil: "domcontentloaded", timeout: 60000 });
console.log("HTTP", r.status(), page.url());
await page.waitForTimeout(5000);

// Fill by PLACEHOLDER, the labels the UI actually shows.
const fields = [
  ["mf. Alex Johnson", "Juma Mwangi"],
  ["mf. Mbunifu Bidhaa wa Ngazi ya Juu", "Mhifadhi wa Ghala"],
  ["Barua pepe", "juma.mwangi@example.co.tz"],
  ["Simu", "+255 712 345 678"],
  ["Mahali", "Dar es Salaam"],
];
for (const [ph, val] of fields) {
  try {
    await page.getByPlaceholder(ph, { exact: false }).first().fill(val, { timeout: 6000 });
    console.log("  filled", JSON.stringify(ph), "=", JSON.stringify(val));
  } catch (e) {
    console.log("  MISS", JSON.stringify(ph), String(e).slice(0, 90));
  }
}
// A summary so the body is not empty.
try {
  await page.locator("textarea").first().fill("Mhifadhi mwenye uzoefu wa miaka mitano katika ghala za Dar es Salaam.", { timeout: 6000 });
  console.log("  filled summary textarea");
} catch (e) { console.log("  summary miss"); }

await page.waitForTimeout(3000);
const previewText = await page.evaluate(() => {
  const el = document.querySelector("[data-preview], .cv-preview, #cv-preview") || document.body;
  return el.innerText.slice(0, 600);
});
console.log("PREVIEW TEXT (first 600):", JSON.stringify(previewText));

let download = null;
page.on("download", (d) => { download = d; });
await page.locator("button:has-text('Pakua PDF')").first().click({ timeout: 10000 });
console.log("clicked Pakua PDF");
await page.waitForTimeout(15000);
if (download) {
  const p = `${OUT}/guest-cv2.pdf`;
  await download.saveAs(p);
  console.log("DOWNLOADED", download.suggestedFilename(), fs.statSync(p).size, "bytes ->", p);
} else {
  console.log("NO DOWNLOAD EVENT");
}
console.log("PAGE TEXT AFTER (first 400):", JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 400)));
await page.screenshot({ path: `${OUT}/after.png` });
await browser.close();
