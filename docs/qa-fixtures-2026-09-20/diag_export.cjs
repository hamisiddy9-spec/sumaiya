const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));

const HOOK = `
window.__qa = { blobs: [], names: [], calls: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) { try { window.__qa.blobs.push(b); window.__qa.calls.push(b.type + ":" + b.size); } catch (e) {} return orig(b); };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__qa.names.push(this.download); return; } return origClick.apply(this, arguments); };
}
`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 300)));

  await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(9000);

  const pre = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((b) => /Pakua PDF/.test(b.innerText || ""));
    return btns.map((b) => ({ text: (b.innerText || "").trim().replace(/\s+/g, " "), disabled: b.disabled, visible: b.offsetParent !== null, rect: b.getBoundingClientRect().toJSON() }));
  });
  console.log("PDF BUTTONS:", JSON.stringify(pre, null, 1));

  const preview = await page.evaluate(() => {
    const el = [...document.querySelectorAll("div")].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 700 && r.width < 900 && r.height > 900 && !e.querySelector("button");
    });
    return el ? { cls: String(el.className).slice(0, 120), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
  });
  console.log("preview candidate:", JSON.stringify(preview));

  const btn = page.getByRole("button", { name: /Pakua PDF/i }).first();
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ force: true });
  console.log("clicked");
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(2500);
    const st = await page.evaluate(() => ({
      calls: window.__qa.calls, names: window.__qa.names,
      toast: [...document.querySelectorAll("[role=status],[role=alert],[class*=toast]")].map((e) => (e.innerText || "").trim().slice(0, 120)).filter(Boolean),
      btnText: [...document.querySelectorAll("button")].filter((b) => /Pakua|Download|Imeshindwa|Couldn/.test(b.innerText || "")).map((b) => (b.innerText || "").trim().replace(/\s+/g, " ").slice(0, 60)),
    }));
    console.log(`t=${(i + 1) * 2.5}s`, JSON.stringify(st));
    if (st.calls.length) break;
  }
  await page.screenshot({ path: path.join(__dirname, "exports", "after-pdf-click.png") });
  console.log("\nCONSOLE:", JSON.stringify(errs.slice(0, 25), null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
