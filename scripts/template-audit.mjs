/**
 * Whole-set template audit.
 *
 * The /templates gallery renders EVERY CV template as a real A4 sheet at once
 * (12 per page, no SmartFit, so what is measured is the template's own layout),
 * which makes it the cheapest honest way to check the whole set rather than the
 * one design a user happened to open. For each card it measures:
 *
 *   fill        rendered sheet width ÷ the card's content width (1.0 = fills it)
 *   centred     sheet centre vs card centre (0 = centred)
 *   clipped     px of the sheet that sit outside the card's content box
 *   legibility  the smallest text size in the sheet AS RENDERED (fontSize × scale)
 *   overflow    elements inside the sheet whose box runs past the sheet's width
 *   langRow     a languages label/level row: gap between the two halves and its
 *               share of the row (the `space-between` idiom this audit is for)
 *
 * Usage: node scripts/template-audit.mjs [outfile.jsonl] [baseUrl] [viewportW]
 */
import { chromium } from "playwright";
import { appendFileSync, writeFileSync } from "node:fs";

const outFile = process.argv[2] ?? "template-audit.jsonl";
const base = process.argv[3] ?? "https://sumaiya.app";
const vw = Number(process.argv[4] ?? 412);

const PROBE = `(() => {
  const cards = [...document.querySelectorAll('div.group')];
  return cards.map(card => {
    // the scaled A4 sheet: an element with a scale transform and a 794px layout width
    const sheet = [...card.querySelectorAll('*')].find(e => {
      const t = getComputedStyle(e).transform;
      return t && t !== 'none' && e.offsetWidth === 794;
    });
    if (!sheet) return null;
    const nameEl = card.querySelector('p.font-display') || card.querySelector('p');
    const name = (nameEl || {}).textContent || '';
    const sr = sheet.getBoundingClientRect();
    const scale = sr.width / 794;
    const box = sheet.parentElement;
    const br = box.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const contentL = cardRect.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth || 0);
    const contentR = cardRect.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth || 0);

    // smallest rendered text inside the sheet
    let minText = Infinity, offender = '';
    let overflow = 0, overflowSample = '';
    for (const el of sheet.querySelectorAll('*')) {
      const own = [...el.childNodes].some(n => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
      if (own) {
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (fs > 0 && fs * scale < minText) { minText = fs * scale; offender = (el.textContent || '').trim().slice(0, 24); }
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > sr.right + 0.5) {
        overflow++;
        if (!overflowSample) overflowSample = el.tagName + '.' + String(el.className || '').slice(0, 20);
      }
    }

    // languages row: a small container holding a proficiency word
    const PROF = /^(Native|Fluent|Basic|Intermediate|Advanced|Elementary|Proficient|C2|C1|B2|B1|A2|A1)$/i;
    let lang = null;
    for (const el of sheet.querySelectorAll('div,span,li')) {
      const kids = [...el.children];
      if (kids.length < 2 || kids.length > 3) continue;
      const texts = kids.map(k => (k.textContent || '').trim());
      const lvl = texts.findIndex(t => PROF.test(t) || /^(Native|Fluent|Basic|Intermediate)|(Native|Fluent|Basic|Intermediate)$/.test(t));
      if (lvl < 0) continue;
      const label = kids.find((k, i) => i !== lvl && (k.textContent || '').trim().length > 1);
      if (!label) continue;
      const lr = label.getBoundingClientRect();
      const vr = kids[lvl].getBoundingClientRect();
      const er = el.getBoundingClientRect();
      if (er.width < 40) continue;
      lang = {
        rowW: +er.width.toFixed(1),
        gap: +(vr.left - lr.right).toFixed(1),
        gapShare: +(((vr.left - lr.right) / er.width) * 100).toFixed(1),
        justify: getComputedStyle(el).justifyContent,
        label: (label.textContent || '').trim().slice(0, 18),
        level: texts[lvl].slice(0, 18),
        // absolute edges inside the row, so "far left / far right" is arithmetic:
        labelLeft: +(lr.left - er.left).toFixed(1),
        levelRight: +(er.right - vr.right).toFixed(1),
        labelHasLeader: getComputedStyle(label).borderBottomWidth !== "0px" &&
                        getComputedStyle(label).borderBottomStyle === "dotted",
      };
      break;
    }

    return {
      template: name.trim(),
      scale: +scale.toFixed(4),
      cardContentW: +(contentR - contentL).toFixed(1),
      sheetW: +sr.width.toFixed(1),
      fillRatio: +((sr.width / (contentR - contentL))).toFixed(3),
      boxW: +br.width.toFixed(1),
      boxL: +br.left.toFixed(1),
      boxR: +br.right.toFixed(1),
      centreDelta: +(((br.left + br.right) / 2) - ((contentL + contentR) / 2)).toFixed(1),
      clipLeft: +(contentL - br.left).toFixed(1),
      clipRight: +(br.right - contentR).toFixed(1),
      leftSlack: +(br.left - contentL).toFixed(1),
      rightSlack: +(contentR - br.right).toFixed(1),
      splitEven: Math.abs((br.left - contentL) - (contentR - br.right)) <= 1,
      sheetLeftInContent: +(br.left - contentL).toFixed(1),
      minTextPx: Number.isFinite(minText) ? +minText.toFixed(2) : null,
      minTextSample: offender,
      overflowCount: overflow,
      overflowSample,
      langRow: lang,
    };
  }).filter(Boolean);
})()`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: vw, height: 900 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36",
});
const page = await ctx.newPage();
await page.goto(`${base}/en/templates`, { waitUntil: "load", timeout: 120000 });
// A dev server hydrates late (2310 modules); wait for the grid to actually mount.
await page.waitForSelector("div.group", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(Number(process.env.AUDIT_WAIT ?? 2500));

writeFileSync(outFile, "");
let total = 0;
for (let p = 1; p <= 40; p++) {
  await page.waitForTimeout(1200);
  const rows = await page.evaluate(PROBE);
  for (const r of rows) appendFileSync(outFile, JSON.stringify(r) + "\n");
  total += rows.length;
  const next = page.locator('nav[aria-label="Pagination"] button', { hasText: "Next" }).first();
  const disabled = await next.isDisabled().catch(() => true);
  console.log(`page ${p}: ${rows.length} templates (running total ${total})${disabled ? " — last page" : ""}`);
  if (disabled) break;
  await next.click({ timeout: 15000 }).catch((e) => console.log("  next failed:", e.message.split("\n")[0]));
  await page.waitForTimeout(700);
}
console.log(`audited ${total} template cards -> ${outFile}`);
await browser.close();
