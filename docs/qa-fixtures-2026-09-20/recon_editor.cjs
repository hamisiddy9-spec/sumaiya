const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: fs.existsSync(STATE) ? STATE : undefined, viewport: { width: 1500, height: 1200 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const url = process.argv[2] || "https://sumaiya.app/editor/cv/try?lang=en";
  const r = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  console.log("status", r.status(), "url", page.url());
  await page.waitForTimeout(9000);

  const info = await page.evaluate(() => {
    const btn = (e) => (e.innerText || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
    const buttons = [...document.querySelectorAll("button")].map(btn).filter(Boolean);
    const links = [...document.querySelectorAll("a")].map((a) => `${btn(a)} -> ${a.getAttribute("href")}`).slice(0, 40);
    const selects = [...document.querySelectorAll("select")].map((s) => ({ name: s.name || s.id, opts: [...s.options].map((o) => o.value).slice(0, 60) }));
    const inputs = [...document.querySelectorAll("input")].map((i) => ({ type: i.type, name: i.name, accept: i.accept, ph: i.placeholder })).slice(0, 40);
    // candidate preview elements
    const cands = [...document.querySelectorAll("[id], [class]")]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 500 && r.height > 600; })
      .map((e) => ({ tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 90), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) }))
      .slice(0, 15);
    return { buttons, links, selects, inputs, cands, bodyLen: document.body.innerText.length };
  });
  console.log("BUTTONS:", JSON.stringify(info.buttons, null, 0));
  console.log("LINKS:", JSON.stringify(info.links.slice(0, 25), null, 0));
  console.log("SELECTS:", JSON.stringify(info.selects, null, 0));
  console.log("\nBIG ELEMENTS:", JSON.stringify(info.cands, null, 1));
  const body = await page.innerText("body");
  console.log("\n--- BODY (first 2500) ---\n" + body.slice(0, 2500));
  await page.screenshot({ path: path.join(__dirname, "shot-editor-recon.png"), fullPage: false });
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
