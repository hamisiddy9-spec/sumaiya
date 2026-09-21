// Capture REAL export blobs from the live editor by hooking URL.createObjectURL
// (the exact call lib/pdf.ts triggerBlobDownload / exportElementToPdf make).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUTDIR = path.join(__dirname, "exports");
fs.mkdirSync(OUTDIR, { recursive: true });
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));

const HOOK = `
window.__qa = { blobs: [], downloadNames: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) {
    try { if (b instanceof Blob) window.__qa.blobs.push(b); } catch (e) {}
    return orig(b);
  };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) { window.__qa.downloadNames.push(this.download); return; }
    return origClick.apply(this, arguments);
  };
}
`;

async function grabBlobs(page) {
  return page.evaluate(async () => {
    const out = [];
    for (const b of window.__qa.blobs) {
      const buf = new Uint8Array(await b.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
      out.push({ type: b.type, size: b.size, b64: btoa(s) });
    }
    return out;
  });
}

const label = (e) => (e.innerText || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 60);

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(9000);
  await page.addScriptTag({ content: HOOK });

  // 1) enumerate the "more downloads" menu
  const more = page.getByRole("button", { name: /Chaguo zaidi|Miundo mingine|more download/i }).first();
  if (await more.count()) {
    await more.click({ force: true });
    await page.waitForTimeout(1500);
    const menu = await page.evaluate(() => {
      const vis = [...document.querySelectorAll("[role=menu], [role=menuitem], a[download], button")]
        .filter((e) => e.offsetParent !== null)
        .map((e) => `${e.tagName}:${(e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 60)}${e.getAttribute("download") ? " [download=" + e.getAttribute("download") + "]" : ""}${e.getAttribute("href") ? " [href=" + e.getAttribute("href").slice(0, 40) + "]" : ""}`);
      return vis;
    });
    console.log("DOWNLOAD MENU:", JSON.stringify(menu, null, 0));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);
  } else {
    console.log("no 'more downloads' button found");
  }

  // 2) PDF export
  await page.evaluate(() => { window.__qa = { blobs: [], downloadNames: [] }; });
  const pdfBtn = page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first();
  console.log("pdf button count:", await pdfBtn.count());
  const t0 = Date.now();
  await pdfBtn.click({ force: true });
  // poll until a blob lands
  let blobs = [];
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    blobs = await grabBlobs(page);
    if (blobs.length) break;
  }
  console.log(`PDF export ms=${Date.now() - t0} blobs=${blobs.length}`);
  for (const [i, b] of blobs.entries()) {
    const ext = b.type.includes("pdf") ? "pdf" : b.type.includes("word") ? "docx" : b.type.includes("text") ? "txt" : "bin";
    const fp = path.join(OUTDIR, `export-${i}.${ext}`);
    fs.writeFileSync(fp, Buffer.from(b.b64, "base64"));
    console.log(`  saved ${fp} type=${b.type} size=${b.size}`);
  }
  const names = await page.evaluate(() => window.__qa.downloadNames);
  console.log("download filenames seen:", JSON.stringify(names));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
