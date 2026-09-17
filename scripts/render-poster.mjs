#!/usr/bin/env node
/**
 * Rasterise the poster SVG into the files people actually print and share.
 *
 * Run:  node scripts/render-poster.mjs
 * In:   apps/web/public/qr/poster-scan-kazi.svg   (A4 trim + 3 mm bleed)
 * Out:  apps/web/public/qr/print/
 *         poster-scan-kazi-A4-300dpi.png   2551 x 3579  (216 x 303 mm incl. bleed)
 *         poster-scan-kazi-A3-300dpi.png   3579 x 5031  (303 x 426 mm incl. bleed)
 *         poster-scan-kazi-share-1080.png  1080 x 1528  (trim only — social)
 *
 * WHY THESE THREE:
 *  - A4/300dpi is the office-printer / handout size, bleed included so the
 *    print shop can trim to 210x297 mm.
 *  - A3/300dpi is the one that matters on a wall or a kiosk: same artwork, same
 *    aspect ratio, 41% larger, which pushes the QR symbol from 11.7 cm to
 *    16.6 cm — a code you can hit from over a metre and a half.
 *  - 1080 px wide is WhatsApp/Facebook: social crops to the trim box, because
 *    bleed is a printing concept and would just add a 3 mm dark border.
 *
 * THE SVG IS IN MILLIMETRES, SHARP IS NOT. sharp/librsvg mishandle an SVG whose
 * root is sized in mm when you also pass `density` (the result scales with
 * density SQUARED — 216 mm at density 300 comes out 10630 px, 4x too wide).
 * So the root width/height are rewritten to plain pixel units of the design
 * canvas before rasterising, which makes the render exactly
 * `units x density / 72` px, and the output is then resized to the precise
 * print pixel count. Rendering above target and downsampling also gives the
 * glyph edges a clean antialias pass.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "apps/web/public/qr/poster-scan-kazi.svg");
const OUTDIR = path.join(ROOT, "apps/web/public/qr/print");

// ---------------------------------------------------------------- sharp
// This repo does not carry sharp; it is installed in the scratch toolchain used
// for the QR verification pass. Resolve it from there rather than adding a
// dependency to the monorepo just for a one-off render.
async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {}
  const candidates = [
    process.env.SHARP_RESOLVE_DIR,
    path.join(os.tmpdir(), "qrverify"),
    "C:/Users/hamis/AppData/Local/Temp/qrverify",
  ].filter(Boolean);
  for (const dir of candidates) {
    try {
      return createRequire(path.join(dir, "package.json"))("sharp");
    } catch {}
  }
  throw new Error(
    "sharp not found. Install it (npm i sharp) or point SHARP_RESOLVE_DIR at a node_modules that has it.",
  );
}
const sharp = await loadSharp();

// ---------------------------------------------------------------- geometry
// Keep in step with make-scan-poster.mjs: 1 design unit = 210mm/794.
const BLEED_MM = 3;
const A4 = { w: 210 + BLEED_MM * 2, h: 297 + BLEED_MM * 2 }; // 216 x 303 mm
const A3 = { w: 297 + BLEED_MM * 2, h: 420 + BLEED_MM * 2 }; // 303 x 426 mm
const TRIM = { w: 210, h: 297 }; // social: no bleed
const DPI = 300;

const px = (mm) => Math.round((mm / 25.4) * DPI);

const svgText = fs.readFileSync(SRC, "utf8");
const rootViewBox = (svgText.match(/viewBox="([^"]+)"/) || [])[1];
if (!rootViewBox) throw new Error("no viewBox in " + SRC);
const [VB_X, VB_Y, CANVAS_UW, CANVAS_UH] = rootViewBox.split(/\s+/).map(Number);
// The trim box inside the bleed canvas: the viewBox starts at the bleed line,
// so the trim is everything minus one bleed width on each side. Deriving it
// beats hardcoding 794x1123 and drifting out of step with the poster script.
const TRIM_UW = CANVAS_UW - 2 * Math.abs(VB_X);
const TRIM_UH = CANVAS_UH - 2 * Math.abs(VB_Y);

// QR geometry, read back off the poster SVG rather than duplicated: the group
// that carries the code is the only integer scale() in the file (the brand mark
// inside the code uses a fractional one).
const QR_MODULES = Number(
  (fs.readFileSync(path.join(ROOT, "apps/web/public/qr/scan-kazi-branded.svg"), "utf8").match(
    /viewBox="0 0 (\d+(?:\.\d+)?)/,
  ) || [])[1],
);
const CODE_MODULES = 37; // version-5 symbol, measured by rasterising
const modulePx = Number((svgText.match(/translate\([-\d.]+, [-\d.]+\) scale\((\d+)\)/) || [])[1]);
if (!modulePx || !QR_MODULES) throw new Error("could not read the QR sizing out of the poster SVG");
const QR_CANVAS_UNITS = QR_MODULES * modulePx;
const CODE_UNITS = CODE_MODULES * modulePx;

// Sizes the root so sharp gets plain pixel units (see the header note).
function withRoot(tag, { viewBox, w, h }) {
  let out = tag;
  if (viewBox) out = out.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
  return out.replace(/width="[^"]*"/, `width="${w}"`).replace(/height="[^"]*"/, `height="${h}"`);
}
const rootOf = (svg) => svg.match(/<svg\b[^>]*>/)[0];
const replaceRoot = (svg, opts) => svg.replace(/<svg\b[^>]*>/, withRoot(rootOf(svg), opts));

// One supersampled master of the bleed canvas, then downscale per target.
const MASTER_DENSITY = 420;
const master = await sharp(
  Buffer.from(replaceRoot(svgText, { w: CANVAS_UW, h: CANVAS_UH })),
  { density: MASTER_DENSITY },
)
  .flatten({ background: "#FAF5EE" })
  .png()
  .toBuffer();
const masterMeta = await sharp(master).metadata();
console.log(`master raster: ${masterMeta.width}x${masterMeta.height} px (density ${MASTER_DENSITY})`);

// Social/trim master, cropped by viewBox instead of by pixels so the trim line
// is exactly where the artwork says it is.
const trimMaster = await sharp(
  Buffer.from(replaceRoot(svgText, { viewBox: `0 0 ${TRIM_UW} ${TRIM_UH}`, w: TRIM_UW, h: TRIM_UH })),
  { density: 200 },
)
  .flatten({ background: "#FAF5EE" })
  .png()
  .toBuffer();

fs.mkdirSync(OUTDIR, { recursive: true });

const RESULTS = [];
async function render(name, build, target, dpiTag) {
  const file = path.join(OUTDIR, name);
  const info = await build().toFile(file);
  const kb = fs.statSync(file).size / 1024;
  const row = { name, w: info.width, h: info.height, kb, dpiTag };
  RESULTS.push(row);
  console.log(
    `${name.padEnd(36)} ${String(info.width).padStart(5)}x${String(info.height).padStart(5)} px  ` +
      `${kb.toFixed(0).padStart(6)} KB  ${dpiTag}  (target ${target.w}x${target.h})`,
  );
  return row;
}

// A4 and A3 print files share the bleed canvas master.
await render(
  "poster-scan-kazi-A4-300dpi.png",
  () =>
    sharp(master)
      .resize(px(A4.w), px(A4.h), { fit: "fill" })
      .withMetadata({ density: DPI })
      .png({ compressionLevel: 9 }),
  { w: px(A4.w), h: px(A4.h) },
  `A4 + ${BLEED_MM}mm bleed @ ${DPI}dpi`,
);

await render(
  "poster-scan-kazi-A3-300dpi.png",
  () =>
    sharp(master)
      .resize(px(A3.w), px(A3.h), { fit: "fill" })
      .withMetadata({ density: DPI })
      .png({ compressionLevel: 9 }),
  { w: px(A3.w), h: px(A3.h) },
  `A3 + ${BLEED_MM}mm bleed @ ${DPI}dpi`,
);

await render(
  "poster-scan-kazi-share-1080.png",
  () => sharp(trimMaster).resize(1080).png({ compressionLevel: 9 }),
  { w: 1080, h: Math.round((1080 * TRIM.h) / TRIM.w) },
  "social, trim box only",
);

// ---------------------------------------------------------------- report
const mmOf = (p, dpi) => ((p / dpi) * 25.4).toFixed(1);
const cmOf = (p, dpi) => (((p / dpi) * 25.4) / 10).toFixed(2);
// The code sits inside the bleed canvas, so convert design units -> file pixels
// before reporting: ink = the 37-module symbol, canvas = the 45-module box that
// carries the 4-module quiet zone.
const scaleOf = (row) => row.w / CANVAS_UW;
const a4 = RESULTS[0];
const a3 = RESULTS[1];
const ink = (row) =>
  `QR ${cmOf(CODE_UNITS * scaleOf(row), DPI)} cm symbol, ` +
  `${cmOf(QR_CANVAS_UNITS * scaleOf(row), DPI)} cm incl. quiet zone`;
console.log(`A4 file: ${mmOf(a4.w, DPI)} x ${mmOf(a4.h, DPI)} mm -> ${ink(a4)}`);
console.log(`A3 file: ${mmOf(a3.w, DPI)} x ${mmOf(a3.h, DPI)} mm -> ${ink(a3)}`);
console.log(
  `qr canvas: ${QR_MODULES} modules @ ${modulePx} units = ${QR_CANVAS_UNITS} units, ink ${CODE_MODULES} modules = ${CODE_UNITS} units`,
);
console.log(`total: ${RESULTS.reduce((s, r) => s + r.kb, 0).toFixed(0)} KB in ${path.relative(ROOT, OUTDIR)}`);
