#!/usr/bin/env node
/**
 * Build the campaign QR — the source of truth for apps/web/public/qr/scan-kazi.svg.
 *
 * Run:  node scripts/make-scan-qr.mjs
 * Out:  apps/web/public/qr/scan-kazi.svg
 *
 * WHY A GENERATOR AND NOT A HAND-EDITED SVG
 * This file was previously produced by a one-off tool run and committed. That
 * made the campaign tag dangerous to change: the only way to move the QR from
 * /ats-checker to /ats-checker?src=poster was to hand-edit encoded path data,
 * and a single wrong module silent-corrects into a code that no phone reads.
 * The QR is build output now. Change the URL here, re-run, re-verify.
 *
 * WHY ?src=poster IS THE WHOLE POINT
 * A poster scan used to land on exactly the same URL as organic traffic, so
 * "did the poster sell anything?" was unanswerable. The tag is what
 * lib/analytics/attribution.ts persists and attaches to every later event.
 *
 * THE MATRIX COMES FROM THE STANDARD LIBRARY, NEVER FROM US
 * The module matrix is rendered by `qrcode` (pinned below): error correction
 * level H, 4-module quiet zone, 640px canvas with modules in the viewBox — the
 * format apps/web/public/qr/scan-kazi-branded.svg and
 * scripts/make-scan-poster.mjs both depend on. If a local `qrcode` is
 * installed it is used directly; otherwise the pinned CLI is run via npx.
 *
 * ORDER MATTERS: this file, then make-branded-qr.mjs, then make-scan-poster.mjs
 * — each consumes the previous one's output.
 */
import { createRequire } from "module";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "apps/web/public/qr/scan-kazi.svg");

/**
 * The scanned URL. Every printed surface points here, so the tag is the only
 * thing that distinguishes a poster scan from a random visit — keep it.
 */
const URL = process.env.QR_URL || "https://sumaiya.app/ats-checker?src=poster";

// Level H: the branded variant punches a logo out of the middle (see
// make-branded-qr.mjs), and the poster survives being photocopied or rained on.
const ECC = "H";
// 640 = what the branded composer and the poster transform were tuned against.
const WIDTH = 640;
// 4 modules, the spec minimum — a tighter crop is the classic reason a printed
// code will not scan.
const QUIET_ZONE = 4;

const require = createRequire(import.meta.url);

function argsFor(cmd) {
  return [
    "-e",
    ECC,
    "-w",
    String(WIDTH),
    "-q",
    String(QUIET_ZONE),
    "-t",
    "svg",
    "-o",
    OUT,
    URL,
  ];
}

function run(cmd, args) {
  execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    // A .cmd shim (npx) cannot be spawned without a shell on Windows.
    shell: process.platform === "win32",
  });
}

let local = null;
try {
  local = require.resolve("qrcode/bin/qrcode");
} catch {
  local = null;
}

if (local) {
  console.log("qrcode: local install");
  run(process.execPath, [local, ...argsFor()]);
} else {
  console.log("qrcode: npx --yes qrcode@1.5.4 (pinned; needs network on first run)");
  run("npx", ["--yes", "qrcode@1.5.4", ...argsFor()]);
}

// Fail loudly rather than leaving an empty or unscannable file in public/.
const svg = fs.readFileSync(OUT, "utf8");
const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
if (!viewBox) throw new Error("no viewBox in generated " + OUT);
const [, , vbW] = viewBox.split(/\s+/).map(Number);
if (!vbW) throw new Error("unreadable viewBox in generated " + OUT);
if (!/<path stroke=/.test(svg)) {
  throw new Error("generated QR has no dark-module path — refusing to ship it");
}
if (!svg.includes("<path fill=")) {
  throw new Error("generated QR has no background plate — refusing to ship it");
}

const modules = vbW - QUIET_ZONE * 2;
console.log("scan QR ->", path.relative(ROOT, OUT));
console.log(`url: ${URL}`);
console.log(
  `ecc ${ECC} · ${modules} modules (v${(modules - 17) / 4}) · viewBox ${viewBox} · quiet zone ${QUIET_ZONE}`,
);
