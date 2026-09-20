/**
 * Face-aspect (photo distortion) measurement THROUGH the real export path.
 *
 * Renders the app's OWN template components with the app's OWN rasterizer
 * (html2canvas 1.4.1) + jsPDF, exactly the way lib/pdf.ts does, and writes one
 * PDF per template per photo fixture. scripts/photo-face-aspect.py then measures
 * the beige face disc inside those PDFs with the same code it uses on the
 * the fixtures captured from the live app — so "before" (the clean capture dir)
 * and "after" numbers are produced by ONE metric.
 *
 * Two fixtures, because they expose two different halves of the same defect:
 *   square   600x600  — every frame that is also square looks fine; only kioo
 *                       (a 272x300 frame) can show it.
 *   portrait 600x900  — a passport photo is 35x45mm, i.e. NOT square, so this
 *                       is the real-world case. Any square frame stretches it.
 *
 * Usage:
 *   node scripts/photo-aspect-dom.mjs --out <dir> --ids <file|auto> [--fixture square|portrait]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const WEB = path.join(REPO, "apps", "web");
const req = createRequire(path.join(REPO, "package.json"));
const esbuild = req("esbuild");
const { chromium } = req("playwright");

const args = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};

const FIXTURES = {
  square: "docs/photo-face/photo-square-fixture.jpg",
  portrait: "docs/photo-face/photo-portrait-fixture.jpg",
};
const fixtureKey = arg("fixture", "square");
const fixturePath = FIXTURES[fixtureKey];
const OUT = path.resolve(arg("out", path.join(REPO, ".tmp-face", fixtureKey)));
fs.mkdirSync(OUT, { recursive: true });

// The template set is taken from the LIVE-APP captures, so both runs cover the
// same templates and the comparison is like for like.
const CLEAN = path.join(REPO, "docs", "qa-fixtures-2026-09-20", "clean");
const ids = fs.readdirSync(CLEAN)
  .filter((f) => f.startsWith("photo-") && f.endsWith(".pdf"))
  .map((f) => f.slice("photo-".length, -4))
  .filter((id) => fs.existsSync(path.join(CLEAN, `nophoto-${id}.pdf`)));

const cv = JSON.parse(fs.readFileSync(path.join(REPO, "docs", "qa-fixtures-2026-09-20", "cv-en.json"), "utf8"));
const dataUrl = "data:image/jpeg;base64," + fs.readFileSync(path.join(REPO, fixturePath)).toString("base64");

const ENTRY = `
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const host = document.createElement("div");
host.style.position = "fixed";
host.style.left = "-10000px";
host.style.top = "0";
document.body.appendChild(host);

window.__shoot = async (id, data) => {
  const Comp = TEMPLATE_COMPONENTS[id];
  if (!Comp) return { error: "no component for " + id };
  host.innerHTML = "";
  const mount = document.createElement("div");
  host.appendChild(mount);
  const root = createRoot(mount);
  flushSync(() => {
    root.render(createElement(Comp, { data, primaryColor: "#DA4A1C", fontFamily: "'Inter', Arial, sans-serif", lang: "en" }));
  });
  await new Promise((r) => setTimeout(r, 60));
  const sheet = mount.firstElementChild;
  if (!sheet) { root.unmount(); return { error: "template rendered nothing" }; }
  await Promise.all(Array.from(sheet.querySelectorAll("img")).map((i) => i.decode().catch(() => {})));
  const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const drawH = (canvas.height * pageW) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, drawH);
  const out = pdf.output("datauristring").split(",")[1];
  root.unmount();
  return { b64: out, size: out.length };
};
`;

const entryFile = path.join(os.tmpdir(), `face-aspect-entry-${Date.now()}.js`);
fs.writeFileSync(entryFile, ENTRY);
const bundle = await esbuild.build({
  entryPoints: [entryFile],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  logLevel: "error",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": WEB },
  nodePaths: [path.join(REPO, "node_modules"), path.join(WEB, "node_modules")],
  absWorkingDir: WEB,
  define: { "process.env.NODE_ENV": '"production"' },
});
const bundleSrc = bundle.outputFiles[0].text;
console.log(`bundle ${(bundleSrc.length / 1024).toFixed(0)} KB, ${ids.length} templates, fixture=${fixtureKey}`);

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
await page.setContent("<!doctype html><html><body></body></html>");
await page.addScriptTag({ content: bundleSrc });
await page.addStyleTag({ content: `@font-face{}` });

const results = [];
for (const id of ids) {
  const photoOn = { ...cv, personal: { ...cv.personal, photo: dataUrl } };
  const on = await page.evaluate(([i, d]) => window.__shoot(i, d), [id, photoOn]);
  const off = await page.evaluate(([i, d]) => window.__shoot(i, d), [id, cv]);
  for (const [tag, r] of [["photo", on], ["nophoto", off]]) {
    if (r && r.b64) fs.writeFileSync(path.join(OUT, `${tag}-${id}.pdf`), Buffer.from(r.b64, "base64"));
    else results.push({ template: id, tag, error: r?.error ?? "no output" });
  }
  process.stdout.write(".");
}
process.stdout.write("\n");
await browser.close();
fs.unlinkSync(entryFile);
const written = fs.readdirSync(OUT).filter((f) => f.endsWith(".pdf")).length;
console.log(`wrote ${written} PDFs to ${OUT}`);
if (pageErrors.length) console.log("page errors:", pageErrors.slice(0, 3));
if (results.length) console.log("failures:", JSON.stringify(results.slice(0, 10)));
