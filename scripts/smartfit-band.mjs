/**
 * SmartFit magnification measurement — the scale the engine actually applies.
 *
 * Renders the REAL AutoFitPage (components/templates/engine/fit.tsx) around a
 * real template with three CV lengths, lets the measure-and-iterate loop settle,
 * and reads the transform off the element the engine scales. That number IS the
 * magnification: body text laid out at 10px renders at 10 x scale.
 *
 * Why a browser: the engine measures the laid-out DOM (the bottom edge of the
 * lowest text element) and iterates in requestAnimationFrame, so nothing but a
 * real layout can produce the number. This is the same loop the editor preview
 * and the PDF export both run, which is why the two must stay identical.
 *
 * Usage: node scripts/smartfit-band.mjs [--out file.json]
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

const FIX = path.join(REPO, "docs", "qa-fixtures-2026-09-20");
const JMED = JSON.parse(fs.readFileSync(path.join(FIX, "cv-en.json"), "utf8"));
const JLONG = JSON.parse(fs.readFileSync(path.join(FIX, "cv-long.json"), "utf8"));

// "short" is a two-role CV — the shape the design audit measured at 52-71% of
// A4. Built here rather than reused so the three lengths are one family.
const JSHORT = {
  personal: {
    fullName: "Amina Joseph Mwakasege", jobTitle: "Software Engineer",
    email: "amina.mwakasege@example.co.tz", phone: "+255 712 345 678",
    location: "Dar es Salaam, Tanzania", linkedin: "", website: "",
  },
  summary: "Software engineer with six years building payment platforms.",
  experience: [
    { id: "e1", position: "Senior Software Engineer", company: "Nala Payments", location: "Dar es Salaam",
      startDate: "2022-01", endDate: "", current: true,
      description: "Led a team of four that cut settlement reconciliation from 9 hours to 40 minutes." },
    { id: "e2", position: "Software Engineer", company: "Pamoja Distributors", location: "Dar es Salaam",
      startDate: "2019-03", endDate: "2021-12", current: false,
      description: "Built the shop-floor stock service used by twelve branches." },
  ],
  education: [{ id: "ed1", institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science",
    startDate: "2014-09", endDate: "2018-06", grade: "Upper Second" }],
  skills: [{ id: "s1", name: "TypeScript", level: 5 }, { id: "s2", name: "PostgreSQL", level: 4 }],
  projects: [], languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
  certifications: [], referees: [], hobbies: "",
};

const ENTRY = `
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { AutoFitPage } from "@/components/templates/engine/fit";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";

const host = document.createElement("div");
host.style.cssText = "position:fixed;left:0;top:0";
document.body.appendChild(host);

window.__fit = async (templateId, data) => {
  host.innerHTML = "";
  const mount = document.createElement("div");
  host.appendChild(mount);
  const Comp = TEMPLATE_COMPONENTS[templateId];
  const root = createRoot(mount);
  flushSync(() => {
    root.render(createElement(AutoFitPage, { fill: true },
      createElement(Comp, { data, primaryColor: "#DA4A1C", fontFamily: "'Inter', Arial, sans-serif", lang: "en" })));
  });
  const page = mount.firstElementChild;            // the A4 page box
  const inner = page && page.firstElementChild;    // the element the engine scales
  if (!inner) return { error: "engine did not mount" };
  // Let the loop run: it schedules on rAF, re-runs on ResizeObserver and again
  // once webfonts are ready.
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 2500));
  const t = getComputedStyle(inner).transform;
  const scale = t === "none" ? 1 : parseFloat(t.slice(t.indexOf("(") + 1));
  const textBottom = (() => {
    const pr = page.getBoundingClientRect();
    let bottom = 0;
    for (const el of page.querySelectorAll("*")) {
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || "").trim());
      if (!hasText) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0) bottom = Math.max(bottom, r.bottom - pr.top);
    }
    return bottom / pr.height;
  })();
  const warn = /CV too long/.test(page.textContent || "");
  root.unmount();
  return { scale: +scale.toFixed(4), fill: +textBottom.toFixed(4), warn };
};
`;

const entryFile = path.join(os.tmpdir(), `smartfit-entry-${Date.now()}.js`);
fs.writeFileSync(entryFile, ENTRY);
const built = await esbuild.build({
  entryPoints: [entryFile], bundle: true, write: false, format: "iife",
  platform: "browser", jsx: "automatic", logLevel: "error",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": WEB },
  nodePaths: [path.join(REPO, "node_modules"), path.join(WEB, "node_modules")],
  absWorkingDir: WEB,
  define: { "process.env.NODE_ENV": '"production"' },
});

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1300 } });
await page.setContent("<!doctype html><html><body style='margin:0'></body></html>");
await page.addScriptTag({ content: built.outputFiles[0].text });

const CVS = { short: JSHORT, medium: JMED, long: JLONG };
const TEMPLATES = ["nakuru", "rift", "sahara", "regent", "kioo", "nova", "oxford"];
const out = { scales: {}, fills: {}, warn: {} };
for (const [label, data] of Object.entries(CVS)) {
  for (const t of TEMPLATES) {
    const r = await page.evaluate(([i, d]) => window.__fit(i, d), [t, data]);
    out.scales[`${t}/${label}`] = r.scale;
    out.fills[`${t}/${label}`] = r.fill;
    out.warn[`${t}/${label}`] = r.warn;
    process.stdout.write(`${t}/${label}=${r.scale} `);
  }
  process.stdout.write("\n");
}
await browser.close();
fs.unlinkSync(entryFile);

for (const label of Object.keys(CVS)) {
  const vals = TEMPLATES.map((t) => out.scales[`${t}/${label}`]);
  const spread = Math.max(...vals) / Math.min(...vals);
  console.log(`${label}: min=${Math.min(...vals)} max=${Math.max(...vals)} mean=${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4)} spread=${spread.toFixed(3)}`);
}
const all = Object.values(out.scales);
console.log(`ALL: min=${Math.min(...all)} max=${Math.max(...all)} spread=${(Math.max(...all) / Math.min(...all)).toFixed(4)}`);
const oi = process.argv.indexOf("--out");
if (oi >= 0) { fs.writeFileSync(process.argv[oi + 1], JSON.stringify(out, null, 1)); console.log("wrote", process.argv[oi + 1]); }
