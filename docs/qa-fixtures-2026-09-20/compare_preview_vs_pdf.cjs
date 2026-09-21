// DECISIVE: for templates whose exported PDF rasters were byte-identical,
// screenshot the LIVE preview element (794x1123) and compare hashes.
//   screenshots DIFFER + PDF rasters IDENTICAL  -> the export path is broken
//   screenshots IDENTICAL                       -> the app renders them identically
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));
const OUT = path.join(__dirname, "screens");
fs.mkdirSync(OUT, { recursive: true });

const GROUPS = [
  ["coral", "zahabu", "vibe", "mono-cv"],
  ["cavendish", "oxford"],
  ["malachite", "serif-cv"],
  ["meridian", "nakuru"],
  ["neon", "regent"],
  ["serengeti", "austin"],
  ["aberdare", "alpine"],
  ["bauhaus", "carbon"],
];
const all = [...new Set(GROUPS.flat())];

const HOOK = `
window.__qa = { blobs: [], names: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) { try { window.__qa.blobs.push(b); } catch (e) {} return orig(b); };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__qa.names.push(this.download); return; } return origClick.apply(this, arguments); };
}
`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);

  const out = [];
  for (const id of all) {
    await page.evaluate(async ([cid, tid]) => {
      await fetch(`/api/cv/${cid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: tid }) });
    }, [CV.en.id, id]);
    await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
    for (let k = 0; k < 40; k++) { await page.waitForTimeout(300); if (await page.evaluate(() => [...document.querySelectorAll("div")].some((e) => { const r = e.getBoundingClientRect(); return r.width > 700 && r.width < 900 && r.height > 900; }))) break; }
    await page.waitForTimeout(1800);

    const h = await page.evaluateHandle(() => [...document.querySelectorAll("div")].find((e) => { const r = e.getBoundingClientRect(); return r.width > 700 && r.width < 900 && r.height > 900; }));
    const shotPath = path.join(OUT, `preview-${id}.png`);
    await h.asElement().screenshot({ path: shotPath });
    const sha = crypto.createHash("sha1").update(fs.readFileSync(shotPath)).digest("hex").slice(0, 16);

    // also export the PDF in the same session, same variant
    await page.evaluate(() => { window.__qa.blobs = []; });
    await page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first().click({ force: true });
    let pdfSha = null, pdfBytes = null;
    for (let k = 0; k < 40; k++) {
      await page.waitForTimeout(700);
      const b = await page.evaluate(async () => {
        if (!window.__qa.blobs.length) return null;
        const bl = window.__qa.blobs[window.__qa.blobs.length - 1];
        const buf = new Uint8Array(await bl.arrayBuffer());
        let s = ""; for (let j = 0; j < buf.length; j++) s += String.fromCharCode(buf[j]);
        return { size: bl.size, b64: btoa(s) };
      });
      if (b) {
        const fp = path.join(OUT, `pdf-${id}.pdf`);
        fs.writeFileSync(fp, Buffer.from(b.b64, "base64"));
        pdfBytes = b.size;
        pdfSha = crypto.createHash("sha1").update(fs.readFileSync(fp)).digest("hex").slice(0, 16);
        break;
      }
    }
    const rec = { id, screenshotSha: sha, screenshotBytes: fs.statSync(shotPath).size, pdfBytes, pdfSha };
    out.push(rec);
    console.log(JSON.stringify(rec));
  }

  fs.writeFileSync(path.join(__dirname, "results-preview-vs-pdf.json"), JSON.stringify({ groups: GROUPS, rows: out }, null, 1));
  console.log("\n=== GROUP COMPARISON ===");
  for (const g of GROUPS) {
    const shots = g.map((id) => out.find((r) => r.id === id)?.screenshotSha);
    const pdfs = g.map((id) => out.find((r) => r.id === id)?.pdfSha);
    console.log(`${g.join(" / ")}  screenshots:${new Set(shots).size} distinct | pdfs:${new Set(pdfs).size} distinct`);
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
