/**
 * Full-size template render probe.
 *
 * The gallery audit measures 412px thumbnails, where every template is scaled to
 * ~0.48 and the smallest text renders at 3.6-4.8px — a number that says more about
 * thumbnails than about the templates. This probe loads the per-template page at a
 * DESKTOP viewport, finds the real 794px A4 sheet, and measures it AT FULL SIZE so
 * the smallest text, the overflow and the whitespace are the template's own
 * properties rather than an artifact of the card.
 *
 * Usage: node scripts/template-render-probe.mjs <outdir> [baseUrl] [idsCsv|ALL]
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const outDir = process.argv[2] ?? "docs/template-renders";
const base = process.argv[3] ?? "https://sumaiya.app";
const idsArg = process.argv[4] ?? "ALL";
mkdirSync(outDir, { recursive: true });

// The offered set, read from the source of truth rather than retyped.
function curated() {
  const src = readFileSync("apps/web/lib/templates/curation.ts", "utf8");
  const m = src.match(/CURATED_CV_TEMPLATE_IDS[^=]*=\s*\[(.*?)\]/s);
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
}
const ids = idsArg === "ALL" ? curated() : idsArg.split(",");
console.log(`probing ${ids.length} template(s) at full size against ${base}`);

const PROBE = `(() => {
  const sheet = [...document.querySelectorAll('*')].find(e => {
    const t = getComputedStyle(e).transform;
    return (t === 'none' || !t) && Math.round(e.offsetWidth) === 794 && e.offsetHeight > 800;
  }) || [...document.querySelectorAll('*')].find(e => Math.round(e.offsetWidth) === 794);
  if (!sheet) return null;
  const sr = sheet.getBoundingClientRect();
  const scale = sr.width / 794;
  let minText = 1e9, offender = '', overflow = 0, overflowSample = '';
  for (const el of sheet.querySelectorAll('*')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
    if (fs > 0 && fs < minText) { minText = fs; offender = (el.textContent || '').trim().slice(0, 30); }
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > sr.right + 0.5) { overflow++; if (!overflowSample) overflowSample = el.tagName + '.' + String(el.className||'').slice(0,24); }
  }
  // how much of the page's height is actually used
  let maxBottom = sr.top;
  const below = [];
  for (const el of sheet.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.bottom > maxBottom) maxBottom = r.bottom;
    // elements whose box runs past the page bottom — decoration or LOST CONTENT?
    if (r.height > 0 && r.bottom > sr.bottom + 1) {
      const txt = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
      const own = [...el.children].length === 0;
      if (own && (txt || r.height > 4)) below.push({ t: el.tagName, px: Math.round(r.bottom - sr.bottom), txt });
    }
  }
  below.sort((a, b) => b.px - a.px);
  return {
    sheetW: Math.round(sr.width), sheetH: Math.round(sr.height), scale: +scale.toFixed(4),
    minTextPx: +minText.toFixed(2), minTextSample: offender,
    overflowCount: overflow, overflowSample,
    textLen: (sheet.innerText || '').replace(/\\s+/g,' ').trim().length,
    usedFraction: +(((maxBottom - sr.top) / sr.height)).toFixed(3),
    belowCount: below.length,
    belowSample: below.slice(0, 4),
    pageBg: getComputedStyle(sheet).backgroundColor,
    sheetOverflow: getComputedStyle(sheet).overflow,
  };
})()`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const rows = [];
for (const id of ids) {
  const url = `${base}/en/templates/${id}`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(2200);
    const m = await page.evaluate(PROBE);
    // screenshot the sheet itself, at 2x, so a human/vision pass sees the real thing
    const el = await page.$("div[style*='794'], div[style*='width: 794px']");
    try {
      if (el) await el.screenshot({ path: `${outDir}/${id}.png` });
      else await page.screenshot({ path: `${outDir}/${id}.png`, fullPage: false });
    } catch { /* screenshot is best effort */ }
    rows.push({ id, ok: !!m, ...(m || {}) });
    console.log(`  ${id.padEnd(18)} ${m ? `minText=${m.minTextPx}px overflow=${m.overflowCount} used=${m.usedFraction}` : "NO SHEET FOUND"}`);
  } catch (e) {
    rows.push({ id, ok: false, error: String(e).slice(0, 120) });
    console.log(`  ${id.padEnd(18)} ERROR ${String(e).slice(0, 70)}`);
  }
}
await browser.close();
writeFileSync(`${outDir}/probe.json`, JSON.stringify(rows, null, 1));
console.log(`\nwrote ${outDir}/probe.json and ${ids.length} screenshot(s)`);
