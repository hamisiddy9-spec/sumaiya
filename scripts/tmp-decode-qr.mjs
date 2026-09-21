// Decode the QR inside a Sumaiya QR SVG, independently of the generator.
// Renders the SVG with the repo's own Playwright chromium, then decodes the
// pixels with jsQR. Prints the verbatim decoded string.
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const REPO = "C:/Users/hamis/projects/sumaiya";
const require = createRequire("C:/Users/hamis/projects/sumaiya/package.json");
const { chromium } = require("playwright");
const jsQR = require("C:/Users/hamis/AppData/Local/Temp/qrdec/node_modules/jsqr").default
  ?? require("C:/Users/hamis/AppData/Local/Temp/qrdec/node_modules/jsqr");
const { PNG } = require("C:/Users/hamis/AppData/Local/Temp/qrdec/node_modules/pngjs");

const targets = process.argv.slice(2);
if (!targets.length) throw new Error("pass svg paths");

const browser = await chromium.launch({ executablePath: chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });

for (const rel of targets) {
  const file = path.isAbsolute(rel) ? rel : path.join(REPO, rel);
  const svg = fs.readFileSync(file, "utf8");
  // Scale the QR up hard before decoding: a 45-unit viewBox at 640px gives
  // ~14px per module, which is plenty, but the poster variant embeds it small.
  const png = await page.evaluate(async (markup) => {
    const blob = new Blob([markup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const W = 1200;
    const H = Math.round((W * (img.naturalHeight || W)) / (img.naturalWidth || W));
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    return c.toDataURL("image/png");
  }, svg);

  const buf = Buffer.from(png.split(",")[1], "base64");
  const decoded = jsQR(new Uint8ClampedArray(PNG.sync.read(buf).data), PNG.sync.read(buf).width, PNG.sync.read(buf).height, {
    inversionAttempts: "attemptBoth",
  });
  console.log(`FILE: ${path.relative(REPO, file)}`);
  console.log(`DATA: ${decoded ? decoded.data : "<NO QR DECODED>"}`);
  console.log("---");
}

await browser.close();
