#!/usr/bin/env node
/**
 * Build the printable Sumaiya poster (A4 trim, 3 mm bleed, print-ready).
 *
 * Run:  node scripts/make-scan-poster.mjs
 * Out:  apps/web/public/qr/poster-scan-kazi.svg
 *
 * A printed poster has one job: get a job-seeker standing in front of a wall or
 * a shop door in Dar to scan a code. Everything below is decided by that, and
 * the decisions were checked against the print/QR research rather than taste:
 *
 *  1. BENEFIT-LED HEADLINE. Headlines that lead with the payoff out-pull
 *     headlines that narrate the mechanism ("Scan this QR code"). The headline
 *     is therefore "Kazi inakusubiri" (the benefit); the scan instruction is
 *     demoted to the line beside the code itself — "Scan hapa", the owner's own
 *     wording, kept verbatim.
 *  2. SANS-SERIF FOR FUNCTIONAL TEXT. Serif display type is a brand asset, but
 *     for body/functional copy sans-serif reads better at distance and for
 *     lower-literacy readers — exactly this audience. So Georgia is kept for
 *     the "Sumaiya" wordmark ONLY and everything else is a system sans stack.
 *     Two typefaces total, no webfont download (a poster must render on a phone
 *     with no network too).
 *  3. BIGGER QR. A larger code costs nothing but space and buys scanning
 *     distance: the rule of thumb is 1 m of scan distance per 10 cm of code, so
 *     a ~12 cm symbol works from ~1.2 m. Module size is an INTEGER so every
 *     module lands on whole print pixels (blurry modules are the other classic
 *     way to ship a poster nobody can scan).
 *  4. PLAIN-TEXT URL UNDER THE CODE. Not everyone will scan — some can't, some
 *     won't. The address is printed so it can be typed, and it is deliberately
 *     bigger than the footer, which is now only the brand line.
 *  5. TYPE HIERARCHY. Three sizes only, each at least 1.5x the next (asserted
 *     at build time below), emphasis by weight and colour — never ALL CAPS,
 *     never italics, both of which hurt low-literacy readers.
 *  6. 3 MM BLEED. The espresso bands and the cream field run to the edge, so the
 *     printer needs ink beyond the trim or a 1 mm drift leaves a white sliver.
 *     Coordinates inside the trim are unchanged: all layout constants below are
 *     still in A4-at-96dpi units (0..794 x 0..1123), and only the background /
 *     band rects are extended out to the bleed line. The SVG's width/height are
 *     given in real millimetres (216 x 306 mm = A4 + 3 mm all round) so a print
 *     shop opening the file gets the physical size right.
 *
 * The QR is INLINED, not linked, so the file is self-contained — a poster that
 * breaks when the asset path moves is worse than no poster. Its 45-module
 * canvas already carries the full 4-module quiet zone on all four sides
 * (37-module code + 4 modules of white), which is checked below and must stay
 * intact: a tight crop is the single most common reason a printed code fails.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const QR = path.join(ROOT, "apps/web/public/qr/scan-kazi-branded.svg");
const OUT = path.join(ROOT, "apps/web/public/qr/poster-scan-kazi.svg");

// Brand tokens, mirrored from the app so the poster and the product agree.
const ESPRESSO = "#211A15";
const CREAM = "#FAF5EE";
const EMBER = "#DA4A1C";

// Two typefaces, system stacks only. Serif = brand wordmark. Sans = everything
// a person has to READ (see note 2).
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ---------------------------------------------------------------- print sheet
// Design units are A4 at 96 dpi, so the trim box is 794 x 1123 and every
// coordinate below reads the same as it did before the bleed was added.
const TRIM_W = 794;
const TRIM_H = 1123;
const MM_PER_UNIT = 210 / TRIM_W; // 0.2645 mm per unit — the whole sheet scales off this
const UNITS_PER_MM = 1 / MM_PER_UNIT;
const BLEED_MM = 3; // <- the bleed
const BLEED = BLEED_MM * UNITS_PER_MM; // 11.34 units
const CANVAS_W = TRIM_W + BLEED * 2;
const CANVAS_H = TRIM_H + BLEED * 2;
const CANVAS_MM_W = 210 + BLEED_MM * 2; // 216 mm
const CANVAS_MM_H = 297 + BLEED_MM * 2; // 306 mm
const n = (v) => Number(v.toFixed(4));

// ---------------------------------------------------------------- type scale
// Three tiers, and nothing else. Ratios are asserted below.
const T1 = 52; // headline
const T2 = 32; // supporting line: subhead, QR label, plain-text URL
const T3 = 20; // details: bullets, "Bure kabisa", footer

// ---------------------------------------------------------------- copy
// Swahili strings. The owner is a native speaker and these were corrected by an
// audit — do NOT paraphrase them. Only the headline changed in this revision
// (mechanism -> benefit); every other string is byte-identical to the previous
// poster.
const HEADLINE = "Scan hapa kupata kazi"; // HIS words. Research says lead with the benefit, but this line carries both the action AND the payoff ("kupata kazi" = get a job) and he wants the clickbait.
const SUBHEAD = "CV yako haifiki kwa mwajiri";
const QR_LABEL = ""; // suppressed: the headline now says "Scan hapa", so repeating it under the code is sloppy
const PLAIN_URL = "sumaiya.app/ats-checker"; // typeable by people who won't scan
const FREE = "Bure kabisa";
const BULLETS = [
  "Jua kwa nini hukuitwa kwenye usaili",
  "Tengeneza CV inayovutia mwajiri",
  "Tuma maombi mengi kwa haraka",
];
const FOOTER = "sumaiya.app";
const TAGLINE = "Msaidizi wako wa kazi"; // in the brand band, unchanged

// ---------------------------------------------------------------- layout
const BAND_H = 104; // espresso brand band (runs into the bleed at the top)
const Y_WORDMARK = 64;
const Y_TAGLINE = 92;
const Y_HEADLINE = 172;
const Y_SUBHEAD = 218;
const Y_BULLET_1 = 266;
const BULLET_PITCH = 28;
const PLATE_TOP = 348; // white plate holding the code
const PLATE_PAD = 14; // cosmetic padding on top of the code's own quiet zone
const Y_LABEL = 956;
const Y_URL = 996;
const Y_FREE = 1026;
const FOOTER_H = 71; // espresso footer band (runs into the bleed at the bottom)
const Y_FOOTER = 1094;

// ---------------------------------------------------------------- QR sizing
const qr = fs.readFileSync(QR, "utf8");
// Keep only the paths; the QR's own canvas is discarded so we can place it.
const inner = qr.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// UNITS: the QR's content is in MODULE coordinates and its viewBox does the
// scaling (see make-branded-qr.mjs note 1). Sizing it with a bare scale() —
// e.g. scale(0.625) because "the source is 640px wide" — draws a ~28px blob
// inside the plate: a poster with a decorative smudge where the code should be,
// which is how this shipped once. So derive the scale from the viewBox:
// modules × an INTEGER module size, so every module lands on whole pixels.
const viewBox = (qr.match(/viewBox="([^"]+)"/) || [])[1];
if (!viewBox) throw new Error("no viewBox in " + QR);
const [, , VB_W, VB_H] = viewBox.split(/\s+/).map(Number);
if (!VB_W || !VB_H || VB_W !== VB_H) throw new Error("unexpected viewBox: " + viewBox);

const CODE_MODULES = 37; // version-5 symbol; measured by rasterising, not guessed
const QUIET_MODULES = (VB_W - CODE_MODULES) / 2;
const MODULE_PX = 12; // printed module size (was 9 in the 10.7cm revision)
const QR_PX = VB_W * MODULE_PX; // full canvas incl. quiet zone
const CODE_PX = CODE_MODULES * MODULE_PX; // ink, i.e. the symbol itself
const PLATE = QR_PX + PLATE_PAD * 2;
const QR_X = (TRIM_W - QR_PX) / 2;
const QR_Y = PLATE_TOP + PLATE_PAD;

// ---------------------------------------------------------------- guard rails
// A build that violates the research should fail loudly instead of shipping.
const t1t2 = T1 / T2;
const t2t3 = T2 / T3;
if (t1t2 < 1.5 || t2t3 < 1.5) {
  throw new Error(`type tiers too close: ${T1}/${T2} = ${t1t2.toFixed(3)}, ${T2}/${T3} = ${t2t3.toFixed(3)}`);
}
if (QUIET_MODULES < 4) {
  throw new Error(`quiet zone is ${QUIET_MODULES} modules, need >= 4`);
}
if (PLATE_TOP + PLATE > TRIM_H - FOOTER_H) {
  throw new Error("the code plate collides with the footer band");
}
const allCopy = [HEADLINE, SUBHEAD, QR_LABEL, PLAIN_URL, FREE, ...BULLETS, FOOTER, TAGLINE];
const shouty = allCopy.flatMap((s) => s.match(/\p{Lu}{4,}/gu) || []);
if (shouty.length) throw new Error("all-caps text is harder for low-literacy readers: " + shouty.join(", "));
if (MODULE_PX <= 9) throw new Error("module size must grow past the previous 9 (10.7cm canvas / 8.8cm symbol)");

const label = (y, text, { size = T3, weight = 400, fill = ESPRESSO, opacity = 1, family = SANS } = {}) =>
  `<text x="${n(TRIM_W / 2)}" y="${y}" text-anchor="middle" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}"${opacity !== 1 ? ` opacity="${opacity}"` : ""}>${text}</text>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Sumaiya poster — "Scan hapa kupata kazi" ("scan here to get a job").
  Trim: A4 portrait, ${TRIM_W}x${TRIM_H} design units = 210x297 mm.
  BLEED: ${BLEED_MM} mm on EVERY side (canvas ${CANVAS_MM_W}x${CANVAS_MM_H} mm). The espresso top
  band, the espresso footer band and the cream field are all drawn out past
  the trim line (to -${n(BLEED)} / +${n(BLEED)} units) so a millimetre of drift on the
  guillotine cannot leave a white sliver at the page edge. Nothing inside the
  trim moved: every layout constant is still in A4-at-96dpi units.
  At 300 dpi this rasterises to ${Math.round((CANVAS_MM_W / 25.4) * 300)}x${Math.round((CANVAS_MM_H / 25.4) * 300)} px —
  see scripts/render-poster.mjs.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_MM_W}mm" height="${CANVAS_MM_H}mm" viewBox="${n(-BLEED)} ${n(-BLEED)} ${n(CANVAS_W)} ${n(CANVAS_H)}">

  <!-- Cream field — bleeds on all four sides -->
  <rect x="${n(-BLEED)}" y="${n(-BLEED)}" width="${n(CANVAS_W)}" height="${n(CANVAS_H)}" fill="${CREAM}"/>

  <!-- Top band: the product name, so the poster is identifiable across a room.
       Serif here and ONLY here — the wordmark is the brand asset. -->
  <rect x="${n(-BLEED)}" y="${n(-BLEED)}" width="${n(CANVAS_W)}" height="${n(BLEED + BAND_H)}" fill="${ESPRESSO}"/>
  <text x="${n(TRIM_W / 2)}" y="${Y_WORDMARK}" text-anchor="middle" font-family="${SERIF}"
        font-size="44" font-weight="700" fill="${CREAM}">Sumaiya</text>
  <text x="${n(TRIM_W / 2)}" y="${Y_TAGLINE}" text-anchor="middle" font-family="${SANS}"
        font-size="18" fill="${CREAM}" opacity="0.75">${TAGLINE}</text>

  <!-- Tier 1 — the BENEFIT, not the mechanism. Someone reading only this line
       should still understand what they get. Bold, sentence case, no caps. -->
  ${label(Y_HEADLINE, HEADLINE, { size: T1, weight: 700 })}
  <!-- Tier 2 — the pain it answers, in the words people already use. "ATS" is
       jargon and belongs nowhere near this poster. -->
  ${label(Y_SUBHEAD, SUBHEAD, { size: T2, opacity: 0.72 })}

  <!-- Tier 3 — three concrete outcomes: what the person gets, not what the app
       does. "Inapita ATS" belonged here and was removed for exactly that reason. -->
  <g fill="${ESPRESSO}">
${BULLETS.map((b, i) => `    <text x="${n(TRIM_W / 2)}" y="${Y_BULLET_1 + i * BULLET_PITCH}" text-anchor="middle" font-family="${SANS}" font-size="${T3}">${b}</text>`).join("\n")}
  </g>

  <!-- The code. Plate is ${PLATE} units (${(PLATE * MM_PER_UNIT / 10).toFixed(2)} cm) around a ${QR_PX}-unit
       canvas (${(QR_PX * MM_PER_UNIT / 10).toFixed(2)} cm) whose ${QUIET_MODULES}-module quiet zone is part of the
       artwork — ${PLATE_PAD} units of plate padding sit OUTSIDE that, so the white
       margin around the ink is ${QUIET_MODULES} modules plus padding on every side. The ink is
       ${CODE_MODULES} modules x ${MODULE_PX} = ${CODE_PX} units = ${(CODE_PX * MM_PER_UNIT / 10).toFixed(2)} cm across: see note 3. -->
  <rect x="${n(TRIM_W / 2 - PLATE / 2)}" y="${PLATE_TOP}" width="${PLATE}" height="${PLATE}" rx="20" fill="#FFFFFF"
        stroke="${ESPRESSO}" stroke-opacity="0.14" stroke-width="2"/>
  <g transform="translate(${n(QR_X)}, ${n(QR_Y)}) scale(${MODULE_PX})" shape-rendering="crispEdges">
    ${inner}
  </g>

  <!-- The scan instruction, demoted to the code it belongs to — it describes the
       action, so it lives with the action (note 1). -->
  ${label(Y_LABEL, QR_LABEL, { size: T2, weight: 700, fill: EMBER })}
  <!-- Plain-text address for people who cannot or will not scan: bigger and more
       prominent than the footer, which is now just the brand line. -->
  ${label(Y_URL, PLAIN_URL, { size: T2, weight: 700 })}
  <!-- Risk reversal at the point of action. Bold, not italic, not caps. -->
  ${label(Y_FREE, FREE, { size: T3, weight: 700, fill: EMBER })}

  <!-- Footer band — bleeds off the bottom and both sides -->
  <rect x="${n(-BLEED)}" y="${TRIM_H - FOOTER_H}" width="${n(CANVAS_W)}" height="${FOOTER_H + BLEED}" fill="${ESPRESSO}"/>
  ${label(Y_FOOTER, FOOTER, { size: T3, fill: CREAM })}
</svg>
`;

fs.writeFileSync(OUT, svg);

// ------------------------------------------------------------------- report
const cm = (u) => (u * MM_PER_UNIT / 10).toFixed(2);
const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
console.log("poster ->", path.relative(ROOT, OUT), `(${Buffer.byteLength(svg)} bytes / ${kb} KB)`);
console.log(`trim      : ${TRIM_W}x${TRIM_H} units = 210x297 mm (A4) + ${BLEED_MM} mm bleed = ${CANVAS_MM_W}x${CANVAS_MM_H} mm`);
console.log(`type      : ${T1} / ${T2} / ${T3} (jumps ${t1t2.toFixed(2)}x and ${t2t3.toFixed(2)}x, both >= 1.5x)`);
console.log(`qr symbol : ${CODE_MODULES} modules @ ${MODULE_PX} units = ${CODE_PX} units = ${cm(CODE_PX)} cm across (was 8.81 cm)`);
console.log(`qr canvas : ${VB_W} modules incl. ${QUIET_MODULES}-module quiet zone = ${QR_PX} units = ${cm(QR_PX)} cm (was 10.71 cm)`);
console.log(`qr plate  : ${PLATE} units = ${cm(PLATE)} cm, top ${PLATE_TOP}, ${PLATE_PAD} units padding outside the quiet zone`);
console.log(`qr at 300dpi: ${Math.round(CODE_PX * MM_PER_UNIT / 25.4 * 300)} px across the ink, ${(MODULE_PX * MM_PER_UNIT / 25.4 * 300).toFixed(1)} px per module`);
