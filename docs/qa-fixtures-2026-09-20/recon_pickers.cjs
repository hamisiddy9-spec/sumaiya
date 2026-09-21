const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));

const dumpVisible = `(() => {
  const l = (e) => (e.innerText || e.getAttribute("aria-label") || e.title || "").trim().replace(/\\s+/g," ").slice(0,50);
  return {
    buttons: [...document.querySelectorAll("button")].filter(e => e.offsetParent !== null).map(l).filter(Boolean),
    imgs: [...document.querySelectorAll("img")].filter(e => e.offsetParent !== null).map(e => ({ alt: e.alt, src: (e.src||"").slice(0,60), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })).slice(0,60),
    dialog: !!document.querySelector("[role=dialog]"),
    dialogText: (document.querySelector("[role=dialog]")?.innerText || "").replace(/\\s+/g," ").slice(0, 900),
  };
})()`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(9000);

  // open the template picker: click the "Miundo" tab then "Nakuru Badilisha"
  const tab = page.getByRole("button", { name: /^Muundo$/i }).first();
  if (await tab.count()) { await tab.click({ force: true }); await page.waitForTimeout(1200); console.log("clicked Muundo tab"); }
  const change = page.getByRole("button", { name: /Badilisha/i }).first();
  if (await change.count()) { await change.click({ force: true }); await page.waitForTimeout(2500); console.log("clicked Badilisha"); }
  let d = await page.evaluate(dumpVisible);
  console.log("AFTER TEMPLATE PICKER OPEN:");
  console.log(" dialog:", d.dialog, "| dialogText:", JSON.stringify(d.dialogText.slice(0, 600)));
  console.log(" buttons:", JSON.stringify(d.buttons.slice(0, 80)));
  await page.screenshot({ path: path.join(__dirname, "exports", "picker-templates.png") });

  // count template tiles
  const tiles = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((e) => e.offsetParent !== null);
    return btns.map((e) => (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40)).filter(Boolean);
  });
  console.log("visible buttons while picker open:", tiles.length);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);

  // section toggles: open tab "Kuhusu" / "Kazi" etc? check for visibility toggles
  const sec = await page.evaluate(() => {
    const l = (e) => (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const sw = [...document.querySelectorAll("button[role=switch], input[type=checkbox], [aria-pressed]")]
      .filter((e) => e.offsetParent !== null)
      .map((e) => `${e.tagName}[role=${e.getAttribute("role") || ""}][aria-pressed=${e.getAttribute("aria-pressed")}] ${l(e)}`);
    return sw.slice(0, 40);
  });
  console.log("TOGGLES:", JSON.stringify(sec));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
