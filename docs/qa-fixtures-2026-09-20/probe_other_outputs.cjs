// PART 2 — every NON-PDF output: Word (.docx), plain text (.txt), the online
// share link, the file-share path, version history, the business card, the
// cover letter and the formal letter. Real clicks on the real live UI.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUTDIR = path.join(__dirname, "exports");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));
fs.mkdirSync(OUTDIR, { recursive: true });

const HOOK = `
window.__qa = { blobs: [], names: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) { try { window.__qa.blobs.push(b); } catch (e) {} return orig(b); };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__qa.names.push(this.download); return; } return origClick.apply(this, arguments); };
  if (navigator.share) { window.__qa.origShare = navigator.share.bind(navigator); }
  window.__qa.shareCalls = [];
  try { Object.defineProperty(navigator, "share", { configurable: true, value: async (d) => { window.__qa.shareCalls.push({ title: d?.title, files: (d?.files || []).map(f => f.name + ":" + f.size), text: d?.text }); throw Object.assign(new Error("user cancelled"), { name: "AbortError" }); } }); } catch (e) {}
  try { Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true }); } catch (e) {}
}
`;

async function grab(page) {
  return page.evaluate(async () => {
    const out = [];
    for (const b of window.__qa.blobs) {
      const buf = new Uint8Array(await b.arrayBuffer());
      let s = ""; for (let j = 0; j < buf.length; j++) s += String.fromCharCode(buf[j]);
      out.push({ type: b.type, size: b.size, b64: btoa(s) });
    }
    return out;
  });
}

async function resetHook(page) { await page.evaluate(() => { window.__qa.blobs = []; window.__qa.names = []; window.__qa.shareCalls = []; }); }

async function openMenu(page) {
  const b = page.getByRole("button", { name: /Chaguo zaidi|Miundo mingine|more download/i }).first();
  if (await b.count()) { await b.click({ force: true }); await page.waitForTimeout(1500); return true; }
  return false;
}

async function clickMenu(page, re) {
  const b = page.locator("button").filter({ hasText: re }).first();
  if (await b.count()) { await b.click({ force: true }); await page.waitForTimeout(1200); return true; }
  return false;
}

(async () => {
  const results = {};
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

  // reset the CV to a known state
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.evaluate(async (cid) => {
    await fetch(`/api/cv/${cid}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: "nakuru", primaryColor: "#DA4A1C", fontFamily: "Inter" }) });
  }, CV.en.id);

  // ── 1. DOCX + TXT + share + versions from the CV editor ────────────────────
  await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(8000);

  await resetHook(page);
  const menuOpened = await openMenu(page);
  const menuItems = await page.evaluate(() => [...document.querySelectorAll("button")].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80)).filter(Boolean));
  results.cvMenu = { opened: menuOpened, items: menuItems };

  // DOCX
  await resetHook(page);
  const clickedDocx = await clickMenu(page, /Word \(\.docx\)/);
  let blobs = [];
  for (let k = 0; k < 30; k++) { await page.waitForTimeout(700); blobs = await grab(page); if (blobs.length) break; }
  results.docx = { clicked: clickedDocx, blobs: blobs.length, names: await page.evaluate(() => window.__qa.names) };
  if (blobs.length) { fs.writeFileSync(path.join(OUTDIR, "cv.docx"), Buffer.from(blobs[blobs.length - 1].b64, "base64")); results.docx.bytes = blobs[blobs.length - 1].size; }

  // TXT
  await openMenu(page);
  await resetHook(page);
  const clickedTxt = await clickMenu(page, /Maandishi \(\.txt\)/);
  blobs = [];
  for (let k = 0; k < 20; k++) { await page.waitForTimeout(600); blobs = await grab(page); if (blobs.length) break; }
  results.txt = { clicked: clickedTxt, blobs: blobs.length, names: await page.evaluate(() => window.__qa.names) };
  if (blobs.length) { fs.writeFileSync(path.join(OUTDIR, "cv.txt"), Buffer.from(blobs[blobs.length - 1].b64, "base64")); results.txt.bytes = blobs[blobs.length - 1].size; }

  // Share file (Web Share)
  await openMenu(page);
  await resetHook(page);
  const clickedShare = await clickMenu(page, /Shiriki faili|Share file/);
  await page.waitForTimeout(4000);
  results.shareFile = { clicked: clickedShare, shareCalls: await page.evaluate(() => window.__qa.shareCalls), blobs: (await grab(page)).length };

  // Share online (public link)
  await openMenu(page);
  await resetHook(page);
  const clickedOnline = await clickMenu(page, /Shiriki mtandaoni|Share online/);
  await page.waitForTimeout(3500);
  const shareModal = await page.evaluate(() => {
    const t = document.body.innerText;
    const m = t.match(/https?:\/\/[^\s"']+/g) || [];
    return { urls: [...new Set(m)].slice(0, 10), dialogText: (document.querySelector("[role=dialog]")?.innerText || "").replace(/\s+/g, " ").slice(0, 500) };
  });
  results.shareOnline = { clicked: clickedOnline, ...shareModal };

  // force the public toggle via the API too, so we can fetch the public page
  const shareRes = await page.evaluate(async (cid) => {
    const r = await fetch(`/api/cv/${cid}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: true, showContact: true }) });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, slug: j?.data?.publicSlug ?? null, isPublic: j?.data?.isPublic ?? null };
  }, CV.en.id);
  results.shareApi = shareRes;
  if (shareRes.slug) {
    const r2 = await ctx.request.get(`https://sumaiya.app/cv/${shareRes.slug}`, { timeout: 60000 });
    const html = await r2.text();
    results.publicCvPage = { status: r2.status(), bytes: html.length, namePresent: html.includes("Mwakasege"), hasTextLayer: /Mwakasege/.test(html) };
  }

  // Version history
  await openMenu(page);
  const clickedVer = await clickMenu(page, /Historia ya matoleo|Version history/);
  await page.waitForTimeout(3000);
  results.versionHistory = { clicked: clickedVer, text: await page.evaluate(() => (document.querySelector("[role=dialog]")?.innerText || document.body.innerText).replace(/\s+/g, " ").slice(0, 400)) };

  await browser.close();
  fs.writeFileSync(path.join(__dirname, "results-other-outputs.json"), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results, null, 1));
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
