// Where does the ~5.5 s per export actually go?
//
// The sweep's `ms` is wall-clock for the WHOLE job (navigate → ready → settle →
// export), so it is dominated by fixed harness cost and cannot tell you what the
// user feels. This measures the phases separately, and measures the EXPORT
// itself INSIDE the page with performance.now() around the real click, so the
// number is the render the user waits for and nothing else.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-en.json"), "utf8"));
const LONG = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-long.json"), "utf8"));
const PHOTO = fs.readFileSync(path.join(__dirname, "photo-small-dataurl.txt"), "utf8").trim();

const HOOK = `
window.__qa = { blobs: [], tClick: null, tBlob: null, tUrl: null };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) {
    try { if (!window.__qa.tBlob) { window.__qa.tBlob = performance.now(); window.__qa.tUrl = (b && b.size) || null; } window.__qa.blobs.push(b); } catch (e) {}
    return orig(b);
  };
  const c = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) return; return c.apply(this, arguments); };
}
`;

const CASES = [
  { key: "minimal (1 page, 54 KB)", data: { personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "", email: "", phone: "", location: "", linkedin: "", website: "" }, summary: "", experience: [], education: [], skills: [], projects: [], languages: [], certifications: [], referees: [], hobbies: "" } },
  { key: "photo-nakuru (1 page)", data: { ...EN, personal: { ...EN.personal, photo: PHOTO } } },
  { key: "typical full CV (nakuru)", data: EN },
  { key: "over-long CV (3+ pages)", data: LONG },
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);

  const out = [];
  for (const cs of CASES) {
    const rec = { case: cs.key };
    let t;
    t = Date.now();
    await page.evaluate(async ([cid, d]) => {
      await fetch(`/api/cv/${cid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: "nakuru", data: d }) });
    }, [CV.en.id, cs.data]);
    rec.patchMs = Date.now() - t;

    t = Date.now();
    await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
    rec.gotoDomContentLoadedMs = Date.now() - t;

    t = Date.now();
    let ready = false;
    for (let k = 0; k < 60; k++) {
      await page.waitForTimeout(200);
      ready = await page.evaluate(() => !!document.getElementById("cv-preview") && [...document.querySelectorAll("button")].some((x) => /Pakua PDF|Download PDF/.test(x.innerText || "")));
      if (ready) break;
    }
    rec.editorReadyMs = Date.now() - t;
    rec.ready = ready;

    // the settle sleep my sweep used — pure harness cost, reported separately
    t = Date.now();
    await page.waitForTimeout(1800);
    rec.harnessSettleMs = Date.now() - t;

    const fontsReady = await page.evaluate(async () => {
      const t0 = performance.now();
      try { await document.fonts.ready; } catch {}
      return { ms: Math.round(performance.now() - t0), status: document.fonts ? document.fonts.status : "n/a" };
    });
    rec.fontsReady = fontsReady;

    const pageH = await page.evaluate(() => {
      const el = document.getElementById("cv-preview");
      return { scrollH: el ? el.scrollHeight : 0, cssH: el ? Math.round(el.getBoundingClientRect().height) : 0 };
    });
    rec.preview = pageH;

    await page.evaluate(() => { window.__qa.blobs = []; window.__qa.tClick = performance.now(); window.__qa.tBlob = null; });
    t = Date.now();
    await page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first().click({ force: true });
    let ok = false;
    for (let k = 0; k < 90; k++) {
      await page.waitForTimeout(200);
      ok = await page.evaluate(() => !!window.__qa.tBlob);
      if (ok) break;
    }
    rec.harnessClickToDetectMs = Date.now() - t;   // includes my 200 ms polling granularity
    const inPage = await page.evaluate(() => ({
      exportMs: window.__qa.tBlob && window.__qa.tClick ? Math.round(window.__qa.tBlob - window.__qa.tClick) : null,
      blobBytes: window.__qa.tUrl,
      scale: navigator.deviceMemory || null,
    }));
    rec.exportInsidePageMs = inPage.exportMs;
    rec.blobBytes = inPage.blobBytes;
    out.push(rec);
    console.log(JSON.stringify(rec));
  }
  fs.writeFileSync(path.join(__dirname, "results-timing.json"), JSON.stringify(out, null, 1));

  console.log("\n=== BREAKDOWN (ms) ===");
  console.log(["case", "patch", "goto->dcl", "boot to ready", "harness settle", "font wait", "EXPORT (in-page)"].join("\t"));
  for (const r of out) {
    console.log([r.case, r.patchMs, r.gotoDomContentLoadedMs, r.editorReadyMs, r.harnessSettleMs, r.fontsReady.ms, r.exportInsidePageMs].join("\t"));
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
