// Measures the Kioo portrait in (a) the browser's own rendering and (b) the
// html2canvas 1.4.1 raster that lib/pdf.ts would put in the PDF.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const H2C = path.resolve("node_modules/html2canvas/dist/html2canvas.min.js");
const results = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const which of ["before", "after"]) {
  const markup = fs.readFileSync(`.qa-io/kioo-${which}.html`, "utf8");
  const page = await browser.newPage({ viewport: { width: 1000, height: 1300 } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
    <div id="sheet" style="width:794px">${markup}</div>
  </body></html>`);
  await page.addScriptTag({ path: H2C });
  await page.waitForTimeout(400);

  // the photo box: HEAD renders <img>, the working tree renders the CoverImg div
  const box = page.locator('#sheet img, #sheet [role="img"]').first();

  // (a) SCREEN — the browser's own compositor
  const shot = await box.screenshot();
  const screenUrl = "data:image/png;base64," + shot.toString("base64");

  const measure = async (url) => page.evaluate(async (u) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, c.width, c.height).data;
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, n = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] > 200) {
        n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (!n) return { px: 0, w: 0, h: 0, aspect: null };
    return { px: n, w: maxX - minX + 1, h: maxY - minY + 1, aspect: +(((maxX - minX + 1) / (maxY - minY + 1)).toFixed(3)) };
  }, url);

  const screen = await measure(screenUrl);

  // (b) RASTER — html2canvas with exactly the options lib/pdf.ts uses
  const rasterUrl = await page.evaluate(async () => {
    const box = document.querySelector('#sheet img') || document.querySelector('#sheet [role="img"]');
    const canvas = await window.html2canvas(box, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
    return canvas.toDataURL("image/png");
  });
  const raster = await measure(rasterUrl);

  const boxInfo = await box.evaluate((el) => ({
    tag: el.tagName,
    w: Math.round(el.getBoundingClientRect().width),
    h: Math.round(el.getBoundingClientRect().height),
    style: (el.getAttribute("style") || "").slice(0, 160),
    hasObjectFit: /object-fit/.test(el.getAttribute("style") || ""),
  }));
  const stretch = screen.aspect && raster.aspect ? +(((raster.aspect / screen.aspect) - 1) * 100).toFixed(1) : null;
  results.push({ version: which, box: boxInfo, screen, raster, rasterVsScreenPct: stretch, faithful: stretch !== null && Math.abs(stretch) < 2 });
  await page.close();
}

fs.writeFileSync(".qa-io/item4-kioo-template.json", JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
await browser.close();
