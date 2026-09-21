// Decode the QR in a Sumaiya QR SVG without a browser: parse the module
// matrix straight out of the path data, rasterise it with pngjs, decode with
// jsQR. Independent of the generator that wrote the file.
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const REPO = "C:/Users/hamis/projects/sumaiya";
const req = createRequire("C:/Users/hamis/AppData/Local/Temp/qrdec/package.json");
const jsQRmod = req("jsqr");
const jsQR = jsQRmod.default ?? jsQRmod;
const { PNG } = req("pngjs");

const CELL = 12;

function modulesFromPath(d) {
  // qrcode emits: M<x> <y+0.5> h<n> m<dx> 0 h<n> ...
  // One horizontal stroked run per group of dark modules in a row.
  const tokens = d.match(/[Mmh][-\d.]+(?:[ ,][-\d.]+)*/g) || [];
  const cells = new Set();
  let x = 0;
  let y = 0;
  for (const t of tokens) {
    const cmd = t[0];
    const nums = t.slice(1).trim().split(/[ ,]+/).map(Number);
    if (cmd === "M") {
      x = nums[0];
      y = nums[1];
    } else if (cmd === "m") {
      x += nums[0];
      y += nums[1];
    } else if (cmd === "h") {
      const len = nums[0];
      const row = Math.floor(y);
      for (let i = 0; i < len; i++) cells.add(`${x + i},${row}`);
      x += len;
    }
  }
  return cells;
}

for (const rel of process.argv.slice(2)) {
  const file = path.isAbsolute(rel) ? rel : path.join(REPO, rel);
  const svg = fs.readFileSync(file, "utf8");
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const d = (svg.match(/<path stroke="#000000" d="([^"]+)"/) || [])[1];
  console.log(`FILE: ${path.relative(REPO, file)}`);
  console.log(`  viewBox: ${vb}`);
  if (!d) {
    console.log("  <no dark-module path — not a plain qrcode SVG>");
    console.log("---");
    continue;
  }
  const [, , w] = vb.split(/\s+/).map(Number);
  const size = Math.round(w);
  const cells = modulesFromPath(d);
  const png = new PNG({ width: size * CELL, height: size * CELL });
  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const mx = Math.floor(px / CELL);
      const my = Math.floor(py / CELL);
      const dark = cells.has(`${mx},${my}`);
      const i = (py * png.width + px) << 2;
      const v = dark ? 0 : 255;
      png.data[i] = v;
      png.data[i + 1] = v;
      png.data[i + 2] = v;
      png.data[i + 3] = 255;
    }
  }
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, {
    inversionAttempts: "dontInvert",
  });
  console.log(`  modules: ${size}x${size}, dark cells: ${cells.size}`);
  console.log(`  DECODED: ${decoded ? JSON.stringify(decoded.data) : "<NONE>"}`);
  console.log("---");
}
