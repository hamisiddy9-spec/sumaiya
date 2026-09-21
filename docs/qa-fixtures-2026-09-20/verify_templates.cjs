// Verify that the editor ACTUALLY applied each templateId: read back the
// template name the app itself displays in its toolbar, plus a DOM fingerprint
// of the rendered preview. Catches "the picker/API said X but the page rendered
// Y" — which a PDF byte-size comparison alone cannot distinguish.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));
const NAMES = require("./template-names.json");

const IDS = process.argv[2] ? process.argv[2].split(",")
  : ["rift", "zahabu", "nuru", "pemba", "malachite", "coral", "kioo", "bento", "nakuru", "oxford", "sahara", "berlin", "mono-cv", "serif-cv"];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 } });
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);

  const out = [];
  for (const id of IDS) {
    const name = (NAMES.curated.find((c) => c[0] === id) || NAMES.legacy.find((l) => l[0] === id) || [])[1] || "?";
    await page.evaluate(async ([cid, tid]) => {
      await fetch(`/api/cv/${cid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: tid }) });
    }, [CV.en.id, id]);
    await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
    let ready = false;
    for (let k = 0; k < 40; k++) {
      await page.waitForTimeout(300);
      ready = await page.evaluate(() => [...document.querySelectorAll("div")].some((e) => { const r = e.getBoundingClientRect(); return r.width > 700 && r.width < 900 && r.height > 900; }));
      if (ready) break;
    }
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      // the toolbar shows the current template NAME next to "Badilisha/Change"
      let toolbarName = null;
      for (const b of document.querySelectorAll("button")) {
        const t = (b.innerText || "").trim();
        if (/Badilisha|Change/.test(t)) { toolbarName = t.replace(/Badilisha|Change/g, "").trim(); break; }
      }
      const el = [...document.querySelectorAll("div")].find((e) => { const r = e.getBoundingClientRect(); return r.width > 700 && r.width < 900 && r.height > 900; });
      const html = el ? el.outerHTML : "";
      const text = el ? (el.innerText || "") : "";
      // cheap structural fingerprint
      const fp = {
        nodes: el ? el.querySelectorAll("*").length : 0,
        divs: el ? el.querySelectorAll("div").length : 0,
        svgs: el ? el.querySelectorAll("svg").length : 0,
        photos: el ? el.querySelectorAll("img").length : 0,
        bgColors: el ? [...new Set([...el.querySelectorAll("*")].map((n) => getComputedStyle(n).backgroundColor).filter((c) => c && c !== "rgba(0, 0, 0, 0)"))].slice(0, 6) : [],
        firstSectionText: (text.match(/[A-Z][^\n]{3,60}/g) || []).slice(0, 4),
        h: el ? Math.round(el.getBoundingClientRect().height) : 0,
      };
      return { toolbarName, fp, htmlLen: html.length, textLen: text.length };
    });
    out.push({ id, expectedName: name, ready, ...info });
    console.log(JSON.stringify({ id, name, toolbarName: info.toolbarName, nodes: info.fp.nodes, divs: info.fp.divs, svgs: info.fp.svgs, photos: info.fp.photos, h: info.fp.h, textLen: info.textLen }));
  }
  fs.writeFileSync(path.join(__dirname, "results-template-verify.json"), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
