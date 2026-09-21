// Guest flow, end to end, in a real browser with NO account and NO storage.
// 1. /editor/cv/try  -> type a name
// 2. press the download control
// 3. assert a PDF actually downloaded (bytes, filename)
// 4. check whether a sign-up wall appeared before the download
import { createRequire } from "module";
import fs from "fs";
const require = createRequire("C:/Users/hamis/projects/sumaiya/package.json");
const { chromium } = require("playwright");

const OUT = "C:/Users/hamis/AppData/Local/Temp/sumaiya-guest";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text().slice(0, 200)); });

console.log("STEP 1: open guest editor");
const r = await page.goto("https://sumaiya.app/editor/cv/try", { waitUntil: "domcontentloaded", timeout: 60000 });
console.log("  HTTP", r.status(), "->", page.url());
await page.waitForTimeout(4000);

const inputs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("input,textarea")).slice(0, 12).map((el) => ({
    tag: el.tagName, name: el.getAttribute("name") || el.getAttribute("placeholder") || el.getAttribute("aria-label") || "",
    type: el.type,
  })),
);
console.log("STEP 2: inputs on screen:", JSON.stringify(inputs));

// Fill the first text input we can find (usually full name).
try {
  const first = page.locator("input[type=text], input:not([type])").first();
  await first.fill("Juma Mwangi", { timeout: 8000 });
  console.log("  typed name into first text input");
} catch (e) {
  console.log("  could not type:", String(e).slice(0, 120));
}
await page.waitForTimeout(1500);

console.log("STEP 3: buttons visible");
const btns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button,a")).map((b) => (b.textContent || "").trim()).filter(Boolean).slice(0, 40),
);
console.log("  ", JSON.stringify(btns));

console.log("STEP 4: attempt download");
let download = null;
page.on("download", (d) => { download = d; });
const dl = page.locator("button:has-text('Pakua'), button:has-text('Download')").first();
try {
  await dl.click({ timeout: 8000 });
  console.log("  clicked download control");
} catch (e) {
  console.log("  no download button found:", String(e).slice(0, 160));
}
await page.waitForTimeout(12000);

if (download) {
  const p = `${OUT}/guest-cv.pdf`;
  await download.saveAs(p);
  const st = fs.statSync(p);
  console.log("  DOWNLOADED:", download.suggestedFilename(), st.size, "bytes");
} else {
  console.log("  NO DOWNLOAD EVENT");
}

const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 1200);
console.log("STEP 5: page text after click (first 1200 chars):");
console.log(bodyText);
console.log("SIGN-UP WALL VISIBLE BEFORE DOWNLOAD?:", /Ingia|Jisajili|Sign in|Create account|akaunti/i.test(bodyText));
await page.screenshot({ path: `${OUT}/guest-editor.png`, fullPage: false });
console.log("ERRORS:", JSON.stringify(errors.slice(0, 8)));
await browser.close();
