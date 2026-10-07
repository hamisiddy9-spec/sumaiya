// Item 4 harness — does the exported raster match the screen for the Kioo photo?
// Uses the app's OWN html2canvas build (1.4.1) exactly as lib/pdf.ts calls it.
//
// Variants:
//   img-cover      — what Kioo ships today: <img width:100% height:100% object-fit:cover> in a 272x300 frame
//   bg-cover       — <div background-image + background-size:cover + background-position:center> in the same frame
//   cvphoto-square — the shared CvPhoto structure (96x96 frame) with a SQUARE source photo
//   cvphoto-wide   — the shared CvPhoto structure (96x96 frame) with a 3:1 LANDSCAPE source photo
//
// For each variant it measures the drawn disc's bounding box in (a) the browser's
// own rendering (screen) and (b) the html2canvas raster, then reports the aspect
// ratio of both. A faithful export has raster aspect == screen aspect.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const H2C = path.resolve("node_modules/html2canvas/dist/html2canvas.min.js");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #fff; }
  .wrap { position: relative; margin: 20px; display: inline-block; }
</style></head><body>
<div id="stage"></div>
<script src="file:///${H2C.replace(/\\/g, "/")}"></script>
</body></html>`;

const script = `(async () => {
  const src = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.fillStyle = "#2b6cb0"; x.fillRect(0, 0, w, h);
    // a DISC of a unique colour, centred, radius 0.25 * min(w,h) * 2 = half the short side
    const r = Math.min(w, h) * 0.33;
    x.fillStyle = "#ff00ff";
    x.beginPath(); x.arc(w / 2, h / 2, r, 0, Math.PI * 2); x.fill();
    return c.toDataURL("image/png");
  };
  const SQUARE = src(600, 600);
  const WIDE = src(900, 300);

  const measure = (canvas) => {
    const cx = canvas.getContext("2d");
    const { width, height } = canvas;
    const d = cx.getImageData(0, 0, width, height).data;
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, n = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (d[i] > 200 && d[i + 1] < 80 && d[i + 2] > 200) { // #ff00ff
          n++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (n === 0) return { px: 0, w: 0, h: 0, aspect: null };
    return { px: n, w: maxX - minX + 1, h: maxY - minY + 1, aspect: +(((maxX - minX + 1) / (maxY - minY + 1)).toFixed(3)) };
  };

  const build = (kind, frameW, frameH, photo) => {
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    wrap.id = kind;
    if (kind === "img-cover") {
      const frame = document.createElement("div");
      frame.style.cssText = "width:" + frameW + "px;height:" + frameH + "px;overflow:hidden;background:#000";
      const img = document.createElement("img");
      img.src = photo;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
      frame.appendChild(img);
      wrap.appendChild(frame);
    } else if (kind === "bg-cover") {
      const frame = document.createElement("div");
      frame.style.cssText = "width:" + frameW + "px;height:" + frameH + "px;overflow:hidden;background:#000;" +
        "background-image:url(" + photo + ");background-size:cover;background-position:center;background-repeat:no-repeat";
      wrap.appendChild(frame);
    } else if (kind === "cvphoto-square" || kind === "cvphoto-wide") {
      const frame = document.createElement("div");
      frame.style.cssText = "width:" + frameW + "px;height:" + frameH + "px;overflow:hidden;border-radius:50%;background:#000";
      const img = document.createElement("img");
      img.src = photo;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block";
      frame.appendChild(img);
      wrap.appendChild(frame);
    }
    document.getElementById("stage").appendChild(wrap);
    return wrap;
  };

  const rows = [];
  const cases = [
    ["img-cover", 272, 300, SQUARE],
    ["bg-cover", 272, 300, SQUARE],
    ["cvphoto-square", 96, 96, SQUARE],
    ["cvphoto-wide", 96, 96, WIDE],
  ];
  for (const [kind, w, h, photo] of cases) {
    const wrap = build(kind, w, h, photo);
    await new Promise((r) => setTimeout(r, 120));
    const raster = await html2canvas(wrap.firstElementChild, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    rows.push({ kind, frameW: w, frameH: h, raster: measure(raster) });
  }
  window.__cases = rows;
  return rows;
})()`;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.setContent(html);
await page.addScriptTag({ path: H2C });
await page.waitForTimeout(300);
const rasterRows = await page.evaluate(script);

// The SCREEN measurement: screenshot each frame with the browser's own renderer
// and measure the same disc on that bitmap.
const screenRows = [];
for (const [kind] of rasterRows.map((r) => [r.kind])) {
  const buf = await page.locator("#" + kind + " > *").screenshot();
  const dataUrl = "data:image/png;base64," + buf.toString("base64");
  const m = await page.evaluate(async (url) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, n = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (d[i] > 200 && d[i + 1] < 80 && d[i + 2] > 200) {
          n++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (!n) return { px: 0, w: 0, h: 0, aspect: null };
    return { px: n, w: maxX - minX + 1, h: maxY - minY + 1, aspect: +(((maxX - minX + 1) / (maxY - minY + 1)).toFixed(3)) };
  }, dataUrl);
  screenRows.push({ kind, screen: m });
}

const merged = rasterRows.map((r) => {
  const s = screenRows.find((x) => x.kind === r.kind);
  const screenAspect = s ? s.screen.aspect : null;
  const round = (a) => (a === null ? null : Math.round(a * 1000) / 1000);
  return {
    kind: r.kind,
    frame: [r.frameW, r.frameH],
    frameAspect: +(r.frameW / r.frameH).toFixed(3),
    screen: r.kind ? { ...s.screen, aspect: round(s.screen.aspect) } : null,
    raster: r.raster,
    rasterVsScreenPct: screenAspect && r.raster.aspect ? +(((r.raster.aspect / screenAspect) - 1) * 100).toFixed(1) : null,
    faithful: screenAspect && r.raster.aspect ? Math.abs(r.raster.aspect / screenAspect - 1) < 0.02 : null,
  };
});
fs.writeFileSync(".qa-io/item4-photo.json", JSON.stringify(merged, null, 1));
console.log(JSON.stringify(merged, null, 1));
await browser.close();
