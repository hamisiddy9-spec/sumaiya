#!/usr/bin/env node
/**
 * Build the Sumaiya-branded QR (mark centred inside the code).
 *
 * Run:  node scripts/make-branded-qr.mjs
 * Out:  apps/web/public/qr/scan-kazi-branded.svg
 *
 * TWO THINGS THIS FILE EXISTS TO GET RIGHT — both learned the hard way:
 *
 * 1. COORDINATE SYSTEM. The generator's SVG is width=640 BUT viewBox="0 0 41 41"
 *    — its content is in MODULE units and the viewBox does the scaling. Re-hosting
 *    that content in a "0 0 640 640" canvas draws the code as a ~41px blob in the
 *    corner. So this reads the source viewBox and works in module units, never px.
 *
 * 2. THE LOGO MUST BE VERIFIED, NOT REASONED ABOUT. A mark dropped into a QR
 *    breaks it unless (a) the code carries level-H redundancy and (b) the plate is
 *    small enough. "22% of the width is only 5% of the area, well inside H's 30%"
 *    is sound arithmetic and still produced a code no decoder could read. The only
 *    trustworthy check is to rasterise it and decode it:
 *
 *        node scripts/make-branded-qr.mjs && node <scratch>/verify.js
 *
 *    Ship the branded file only when that prints the URL back.
 *
 * 3. WHAT THE CANVAS CONTAINS (the poster's sizing depends on this, so it is
 *    measured, not assumed). A version-5 symbol is 37x37 modules, and the
 *    generator's viewBox is 45x45 — i.e. the artwork carries a full 4-module
 *    QUIET ZONE on all four sides of the ink. Rasterising this file and taking
 *    the dark bounding box confirms it: ink at module 4.00..41.00, white margin
 *    of 4 modules left, top, right and bottom. Do not crop this file tight —
 *    scanners need those 4 modules, and it is the single most common reason a
 *    printed code refuses to read.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "apps/web/public/qr/scan-kazi.svg");
const OUT = path.join(ROOT, "apps/web/public/qr/scan-kazi-branded.svg");

const ESPRESSO = "#211A15";
const EMBER = "#DA4A1C";

// The Sumaiya mark, verbatim from components/ui/sumaiya-mark.tsx.
const BLADE =
  "M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z";

const raw = fs.readFileSync(SRC, "utf8");
const viewBox = (raw.match(/viewBox="([^"]+)"/) || [])[1];
if (!viewBox) throw new Error("no viewBox in " + SRC);
const [, , VB_W, VB_H] = viewBox.split(/\s+/).map(Number);
if (!VB_W || !VB_H) throw new Error("unreadable viewBox: " + viewBox);

// Work in the SAME units as the content.
const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const cx = VB_W / 2;
const cy = VB_H / 2;
// ~5 modules across the middle of a 41-unit canvas. Small on purpose: the
// centre carries alignment structure, so occlusion costs more than area maths
// suggests (see note 2 above).
const PLATE = 5.2;
const half = PLATE / 2;

// Guard rail: the mark's clean field must stay INSIDE the symbol. 4 modules of
// the canvas at each edge are the quiet zone (note 3) — a plate that reached
// into it would eat the white margin a scanner needs.
if (cx - half < 4 || cy - half < 4 || cx + half > VB_W - 4 || cy + half > VB_H - 4) {
  throw new Error(`mark plate ${PLATE} modules at ${cx},${cy} intrudes into the 4-module quiet zone`);
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="${viewBox}" shape-rendering="crispEdges">
  <!-- The code, unchanged and in its own module coordinates -->
  ${inner}

  <g shape-rendering="auto">
    <!-- Clean field: the mark must not sit on modules -->
    <rect x="${cx - half}" y="${cy - half}" width="${PLATE}" height="${PLATE}"
          rx="${(PLATE * 0.22).toFixed(2)}" fill="#FFFFFF"/>
    <!-- The mark, scaled from its own 24-unit box into the plate -->
    <g transform="translate(${(cx - PLATE * 0.35).toFixed(3)}, ${(cy - PLATE * 0.35).toFixed(3)}) scale(${((PLATE * 0.7) / 24).toFixed(4)})">
      <path d="${BLADE}" fill="${EMBER}" transform="rotate(0 12 12)"/>
      <path d="${BLADE}" fill="${EMBER}" transform="rotate(120 12 12)" opacity="0.9"/>
      <path d="${BLADE}" fill="${EMBER}" transform="rotate(240 12 12)" opacity="0.8"/>
      <circle cx="12" cy="12" r="2.1" fill="${ESPRESSO}"/>
    </g>
  </g>
</svg>
`;

fs.writeFileSync(OUT, svg);
console.log("branded QR ->", path.relative(ROOT, OUT));
console.log(`viewBox preserved: ${viewBox} · plate ${PLATE} modules (${Math.round((PLATE / VB_W) * 100)}% of the canvas)`);
console.log(
  `quiet zone: ${VB_W - 37} modules of white beyond the 37-module symbol (${(VB_W - 37) / 2} each side) — do not crop`,
);
