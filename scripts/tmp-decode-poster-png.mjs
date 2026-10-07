// Decode the QR from the PRINTED poster PNG (the artifact a human prints),
// not just the SVG it was generated from. Downscales with sharp-free logic by
// stepping pixels, then jsQR.
import fs from "fs";
import { createRequire } from "module";
const req = createRequire("C:/Users/hamis/AppData/Local/Temp/qrdec/package.json");
const jsQRmod = req("jsqr");
const jsQR = jsQRmod.default ?? jsQRmod;
const { PNG } = req("pngjs");

const file = process.argv[2];
const png = PNG.sync.read(fs.readFileSync(file));
console.log("PNG:", png.width + "x" + png.height);

const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, {
  inversionAttempts: "dontInvert",
});
console.log("DECODED:", res ? JSON.stringify(res.data) : "<NONE>");
