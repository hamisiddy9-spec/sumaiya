#!/usr/bin/env node
/**
 * Build the printable "Scan hapa kupata kazi" poster.
 *
 * Run:  node scripts/make-scan-poster.mjs
 * Out:  apps/web/public/qr/poster-scan-kazi.svg   (A4, print-ready)
 *
 * A printed poster is the one surface that has to work with no network, no
 * device detection and no copy to explain itself — a person glances at it from
 * two metres away in a shop or on a noticeboard. So: one promise, one action,
 * and a QR big enough to scan from arm's length. Everything else is noise.
 *
 * The QR is INLINED, not linked, so the downloaded file is self-contained —
 * a poster that breaks when the asset path moves is worse than no poster.
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

const qr = fs.readFileSync(QR, "utf8");
// Keep only the paths; the QR's own canvas is discarded so we can place it.
const inner = qr.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// A4 at 96dpi — matches what a Word/Canva user expects to print.
const W = 794;
const H = 1123;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>

  <!-- Top band: the product name, so the poster is identifiable from across a room -->
  <rect x="0" y="0" width="${W}" height="150" fill="${ESPRESSO}"/>
  <text x="${W / 2}" y="82" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="52" font-weight="700" fill="${CREAM}">Sumaiya</text>
  <text x="${W / 2}" y="120" text-anchor="middle" font-family="Georgia, serif"
        font-size="21" fill="${CREAM}" opacity="0.75">Msaidizi wako wa kazi</text>

  <!-- The one promise. Swahili first, and NO jargon: "ATS" means nothing to
       the person this poster is for. The pain is that applications vanish with
       no reply — say that, in the words they already use. -->
  <text x="${W / 2}" y="248" text-anchor="middle" font-family="Georgia, serif"
        font-size="46" font-weight="700" fill="${ESPRESSO}">Scan hapa kupata kazi</text>
  <text x="${W / 2}" y="292" text-anchor="middle" font-family="Georgia, serif"
        font-size="22" fill="${ESPRESSO}" opacity="0.72">CV yako haifiki kwa mwajiri</text>

  <!-- QR, framed so the quiet zone survives printing (a tight crop is the
       single most common reason a printed code will not scan). -->
  <rect x="${W / 2 - 231}" y="340" width="462" height="462" rx="18" fill="#FFFFFF"
        stroke="${ESPRESSO}" stroke-opacity="0.14" stroke-width="2"/>
  <g transform="translate(${W / 2 - 200}, 371) scale(0.625)">
    ${inner}
  </g>

  <text x="${W / 2}" y="852" text-anchor="middle" font-family="Georgia, serif"
        font-size="25" font-weight="700" fill="${EMBER}">Lenga kamera hapa</text>
  <text x="${W / 2}" y="886" text-anchor="middle" font-family="Georgia, serif"
        font-size="19" fill="${ESPRESSO}" opacity="0.7">Bure kabisa</text>

  <!-- Three concrete outcomes — what the person gets, not what the app does.
       "Inapita ATS" belonged here and was removed for exactly that reason. -->
  <g font-family="Georgia, serif" font-size="20" fill="${ESPRESSO}">
    <text x="${W / 2}" y="956" text-anchor="middle">Jua kwa nini hukuitwa kwenye usaili</text>
    <text x="${W / 2}" y="992" text-anchor="middle">Tengeneza CV inayovutia mwajiri</text>
    <text x="${W / 2}" y="1028" text-anchor="middle">Tuma maombi mengi kwa haraka</text>
  </g>

  <rect x="0" y="${H - 74}" width="${W}" height="74" fill="${ESPRESSO}"/>
  <text x="${W / 2}" y="${H - 30}" text-anchor="middle" font-family="Georgia, serif"
        font-size="19" fill="${CREAM}">sumaiya.app</text>
</svg>
`;

fs.writeFileSync(OUT, svg);
console.log("poster ->", path.relative(ROOT, OUT), `(${svg.length} bytes)`);
