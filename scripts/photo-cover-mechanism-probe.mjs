/**
 * Which CSS mechanism can a non-square photo frame use to CROP rather than
 * STRETCH, and survive html2canvas 1.4.1 (the app's PDF rasterizer)?
 *
 * html2canvas@1.4.1's dist contains no `object-fit` handling at all (verified
 * by reading node_modules/html2canvas/dist/html2canvas.js), so an <img> is drawn
 * into its element box. Three candidate renderings of a 600x900 passport-style
 * headshot inside a 200x200 frame:
 *
 *   A  <img style="width:100%;height:100%;object-fit:cover">   (what ships today)
 *   B  <div style="background-image:url(...);background-size:cover">
 *   C  <img> pre-sized to the cover-fit geometry, parent crops (overflow:hidden)
 *
 * The fixture's face is an exact circle, so a correct render measures ~1.000 and
 * a stretched one measures the source aspect ratio (900/600 = 1.5).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const req = createRequire(path.join(REPO, "package.json"));
const { chromium } = req("playwright");
const h2cSrc = fs.readFileSync(req.resolve("html2canvas/dist/html2canvas.min.js"), "utf8");
const photo = "data:image/jpeg;base64," +
  fs.readFileSync(path.join(REPO, "docs", "photo-face", "photo-portrait-fixture.jpg")).toString("base64");

const CASES = {
  A_img_objectfit_cover: `<div class="frame"><img src="${photo}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`,
  B_background_cover: `<div class="frame" style="background-image:url(${photo});background-size:cover;background-position:center;background-repeat:no-repeat"></div>`,
  C_presized_img: `<div class="frame"><img src="${photo}" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:300px;height:450px;display:block"></div>`,
};

const html = `<!doctype html><html><head><style>
  body{margin:0;background:#fff}
  .frame{width:200px;height:200px;overflow:hidden;position:relative}
</style></head><body>
${Object.entries(CASES).map(([k, v]) => `<div id="${k}">${v}</div>`).join("\n")}
</body></html>`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
await page.setContent(html);
await page.addScriptTag({ content: h2cSrc });
const out = await page.evaluate(async (keys) => {
  const res = {};
  for (const k of keys) {
    const el = document.getElementById(k);
    const c = await window.html2canvas(el, { scale: 1, backgroundColor: "#ffffff", logging: false });
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (Math.abs(d[i] - 205) < 40 && Math.abs(d[i + 1] - 160) < 40 && Math.abs(d[i + 2] - 125) < 40) {
        n++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    res[k] = { discBox: [w, h], discAspect: +(w / h).toFixed(3), discPx: n, canvas: [c.width, c.height] };
  }
  return res;
}, Object.keys(CASES));
await browser.close();
console.log(JSON.stringify(out, null, 1));
console.log("\nsource 600x900 (aspect 1.500 for the disc if stretched); correct render = 1.000");
