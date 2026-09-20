/**
 * Template fit / centring measurement harness.
 *
 * Answers, for any surface that renders an A4 CV or a template thumbnail:
 * how wide is the container, what transform scale is applied, where does the
 * sheet actually sit, and is it centred inside its own box?
 *
 * Uses the repo's own Playwright + the installed Chrome. Run:
 *   node scripts/template-fit-measure.mjs web <url[,url2]> [viewportW] [viewportH]
 *   node scripts/template-fit-measure.mjs html <file.html> <frameW> [--mobile]
 * Add `--json <path>` to also dump the full report.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const MEASURE = `(() => {
  const all = [...document.querySelectorAll('*')];
  const out = {
    url: location.href,
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    docClientW: document.documentElement.clientWidth,
    docScrollW: document.documentElement.scrollWidth,
    visualScale: window.visualViewport ? window.visualViewport.scale : null,
    visualW: window.visualViewport ? Math.round(window.visualViewport.width) : null,
  };
  // A "sheet" carries a scale transform and is wide enough to be a page or a
  // page thumbnail (SVG icon internals are sub-60px noise).
  out.sheets = all.map(e => {
    const cs = getComputedStyle(e);
    if (!cs.transform || cs.transform === 'none' || cs.transform === '') return null;
    const m = cs.transform.match(/matrix\\(([^)]+)\\)/);
    if (!m) return null;
    const sx = parseFloat(m[1].split(',')[0]);
    if (Math.abs(sx - 1) < 0.005) return null;
    const r = e.getBoundingClientRect();
    const cssW = e.offsetWidth;
    if (r.width < 60 && cssW < 200) return null;
    const p = e.parentElement;
    const pr = p ? p.getBoundingClientRect() : null;
    return {
      tag: e.tagName,
      cls: String(e.className || '').slice(0, 44),
      scale: +sx.toFixed(4),
      origin: cs.transformOrigin,
      position: cs.position,
      cssWidth: cssW,
      box: { l: +r.left.toFixed(1), r: +r.right.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      parent: pr ? {
        cls: String(p.className || '').slice(0, 44),
        l: +pr.left.toFixed(1), r: +pr.right.toFixed(1), w: +pr.width.toFixed(1),
        centre: +((pr.left + pr.right) / 2).toFixed(1),
      } : null,
      sheetCentre: +((r.left + r.right) / 2).toFixed(1),
      centreDelta: pr ? +(((r.left + r.right) / 2) - ((pr.left + pr.right) / 2)).toFixed(1) : null,
      leftGap: pr ? +((r.left - pr.left)).toFixed(1) : null,
      rightGap: pr ? +((pr.right - r.right)).toFixed(1) : null,
    };
  }).filter(Boolean);

  // Language rows: exactly two children, the second being a proficiency LEVEL on
  // its own. Measured as absolute edges so "far left / far right" is arithmetic.
  const LEVEL = /^(Native|Fluent|Basic|Intermediate|Advanced|Elementary|Proficient|Conversational|Professional|C2|C1|B2|B1|A2|A1)$/i;
  out.langRows = [];
  for (const el of all) {
    const kids = [...el.children];
    if (kids.length !== 2) continue;
    const t0 = (kids[0].textContent || '').trim();
    const t1 = (kids[1].textContent || '').trim();
    if (!LEVEL.test(t1) || t0.length < 2 || t0.length > 24 || (t0.indexOf(String.fromCharCode(10)) !== -1 || t0.indexOf(String.fromCharCode(13)) !== -1)) continue;
    const cs = getComputedStyle(el);
    const er = el.getBoundingClientRect();
    if (er.width < 40) continue;
    const r0 = kids[0].getBoundingClientRect();
    const r1 = kids[1].getBoundingClientRect();
    const lcs = getComputedStyle(kids[0]);
    out.langRows.push({
      text: t0 + ' / ' + t1,
      rowW: +er.width.toFixed(1),
      justify: cs.justifyContent,
      labelLeft: +(r0.left - er.left).toFixed(1),
      levelRight: +(er.right - r1.right).toFixed(1),
      labelRight: +(r0.right - er.left).toFixed(1),
      levelLeft: +(r1.left - er.left).toFixed(1),
      pairGap: +(r1.left - r0.right).toFixed(1),
      gapSharePct: +(((r1.left - r0.right) / er.width) * 100).toFixed(1),
      labelHasLeader: lcs.borderBottomStyle === 'dotted' && lcs.borderBottomWidth !== '0px',
    });
    if (out.langRows.length >= 4) break;
  }
  return out;
})()`;

function report(label, r) {
  const L = [];
  L.push(`### ${label}`);
  L.push(`  viewport ${r.innerWidth}x${r.innerHeight} docClientW=${r.docClientW} scrollW=${r.docScrollW} visualScale=${r.visualScale} visualW=${r.visualW}`);
  if (!r.sheets.length) L.push("  (no scaled sheet elements found)");
  for (const s of r.sheets) {
    L.push(`  SHEET <${s.tag}> scale=${s.scale} origin="${s.origin}" pos=${s.position} cssWidth=${s.cssWidth}`);
    L.push(`        sheet: w=${s.box.w} l=${s.box.l} r=${s.box.r}  |  parent: w=${s.parent?.w} l=${s.parent?.l} r=${s.parent?.r} centre=${s.parent?.centre}`);
    L.push(`        sheetCentre=${s.sheetCentre} centreDelta=${s.centreDelta} leftGap=${s.leftGap} rightGap=${s.rightGap}`);
  }
  L.push(`  language rows: ${r.langRows.length}`);
  for (const l of r.langRows) {
    L.push(`    "${l.text}" justify=${l.justify} gap=${l.gap} rowW=${l.width} pairGap=${l.pairGap}`);
  }
  return L.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const jsonIdx = argv.indexOf("--json");
  const jsonPath = jsonIdx >= 0 ? argv[jsonIdx + 1] : null;
  if (jsonIdx >= 0) argv.splice(jsonIdx, 2);
  const shotIdx = argv.indexOf("--shot");
  const shotDir = shotIdx >= 0 ? argv[shotIdx + 1] : null;
  if (shotIdx >= 0) argv.splice(shotIdx, 2);
  const clickIdx = argv.indexOf("--click");
  const clickText = clickIdx >= 0 ? argv[clickIdx + 1] : null;
  if (clickIdx >= 0) argv.splice(clickIdx, 2);
  const mode = argv[0];

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const out = [];
  if (mode === "web") {
    const urls = argv[1].split(",");
    const w = Number(argv[2] ?? 412);
    const h = Number(argv[3] ?? 915);
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36",
    });
    for (const url of urls) {
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "load", timeout: 90000 });
      await page.waitForTimeout(2500);
      if (clickText) {
        // Open a hidden surface (e.g. the editor's mobile "Preview" tab) before
        // measuring — a display:none column has no measurable width.
        const target = page.locator(`text=${clickText}`).first();
        try {
          await target.click({ timeout: 8000 });
          await page.waitForTimeout(1800);
        } catch (e) {
          console.error(`CLICK FAILED for "${clickText}": ${e.message.split("\n")[0]}`);
        }
      }
      const r = await page.evaluate(MEASURE);
      if (shotDir) {
        const name = url.replace(/[^a-z0-9]+/gi, "_").slice(-60);
        await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: false });
      }
      await page.close();
      out.push({ label: url, ...r });
    }
  } else {
    const file = argv[1];
    const frameW = Number(argv[2]);
    const mobile = argv.includes("--mobile");
    const html = readFileSync(file, "utf8");
    const ctx = await browser.newContext({
      viewport: { width: frameW, height: Math.ceil(frameW * (1123 / 794)) },
      deviceScaleFactor: 2.625,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const r = await page.evaluate(MEASURE);
    r.frameW = frameW;
    r.isMobile = mobile;
    out.push({ label: `${file} @ ${frameW}px css frame isMobile=${mobile}`, ...r });
  }
  await browser.close();
  for (const r of out) console.log(report(r.label, r));
  if (jsonPath) writeFileSync(jsonPath, JSON.stringify(out, null, 1));
}

main().catch((e) => { console.error("MEASURE FAILED:", e.message); process.exit(1); });
