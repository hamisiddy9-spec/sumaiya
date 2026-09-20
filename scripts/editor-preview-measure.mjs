/**
 * Focused measurement of the CV editor's preview geometry (call site:
 * apps/web/components/editor/cv-editor-client.tsx — the `#cv-preview` sheet).
 *
 * Prints, for one viewport: the preview column's content width, the wrapper
 * box the editor sized by hand, the sheet's own scaled box, and the resulting
 * left/right gaps. Run:  node scripts/editor-preview-measure.mjs <width> [clickText]
 */
import { chromium } from "playwright";

const URL = process.env.EDITOR_URL || "https://sumaiya.app/editor/cv/try?template=apex";

const PROBE = `(() => {
  const out = { url: location.href, vw: innerWidth };
  // every element that looks like a scaled A4 sheet or its wrapper
  const sheet = document.getElementById('cv-preview');
  out.hasPreview = !!sheet;
  const rows = [];
  const consider = (el, name) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    rows.push({
      name,
      tag: el.tagName,
      cls: String(el.className || '').slice(0, 46),
      layoutW: el.offsetWidth,
      cssW: cs.width,
      transform: cs.transform,
      origin: cs.transformOrigin,
      rect: { l: +r.left.toFixed(1), r: +r.right.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
    });
  };
  if (sheet) {
    consider(sheet, 'sheet #cv-preview');
    consider(sheet.parentElement, 'wrapper (sheet parent)');
    // the scroll/preview column = the nearest ancestor with overflow auto/scroll, or 3 up
    let col = sheet.parentElement?.parentElement ?? null;
    consider(col, 'preview column');
    consider(col?.parentElement, 'column parent');
  }
  out.rows = rows;
  // all scaled (non-1) elements wider than 40px → who else scales sheets here
  out.scaled = [...document.querySelectorAll('div')].map(e => {
    const cs = getComputedStyle(e);
    const m = cs.transform.match(/matrix\\(([^)]+)\\)/);
    if (!m) return null;
    const sx = parseFloat(m[1].split(',')[0]);
    if (Math.abs(sx - 1) < 0.005) return null;
    const r = e.getBoundingClientRect();
    if (r.width < 40) return null;
    return { cls: String(e.className || '').slice(0, 40), scale: +sx.toFixed(4), w: +r.width.toFixed(1), l: +r.left.toFixed(1) };
  }).filter(Boolean);
  return out;
})()`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const w = Number(process.argv[2] ?? 1440);
const h = Number(process.argv[3] ?? 900);
const clickText = process.argv[4] ?? null;
const ctx = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: 2,
  isMobile: w < 700,
  hasTouch: w < 700,
  userAgent: w < 700
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36"
    : undefined,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(3000);

// What mobile tabs exist (the preview column is display:none until "Preview").
const buttons = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim()).filter(Boolean).slice(0, 24));
console.log("buttons:", JSON.stringify(buttons));

if (clickText) {
  try {
    await page.locator(`text=${clickText}`).first().click({ timeout: 8000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error("click failed:", e.message.split("\n")[0]);
  }
}
const r = await page.evaluate(PROBE);
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: `${process.env.LOCALAPPDATA}/Temp/fit-shots/editor-${w}.png` });
await browser.close();
