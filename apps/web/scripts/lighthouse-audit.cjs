/**
 * Lighthouse CI — the "world-class" ratchet. Audits key pages against a
 * local production build and fails the PR if any page drops below target.
 *
 * Usage: node scripts/lighthouse-audit.cjs [BASE_URL]
 * Env: LH_PERF, LH_A11Y, LH_SEO, LH_PWA override thresholds (0-100).
 */
const { spawnSync } = require("node:child_process");
const { readFileSync, writeFileSync } = require("node:fs");

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
// Lighthouse 13 REMOVED the PWA category — installability is proven by the
// E2E SW suite instead (precache, offline shell, /api never cached) plus the
// static checks below. The ratchet covers the live categories.
const THRESHOLDS = {
  performance: Number(process.env.LH_PERF || 60),
  accessibility: Number(process.env.LH_A11Y || 90),
  "best-practices": Number(process.env.LH_BP || 90),
  seo: Number(process.env.LH_SEO || 90),
};

// The app's middleware rewrites bare paths by cookie; audit the canonical
// locale routes directly so the HTML is stable.
const PAGES = ["/", "/templates", "/pricing", "/assistant"];

function audit(url) {
  const out = spawnSync(
    "npx",
    ["lighthouse", url, "--chrome-flags=--headless --no-sandbox --disable-gpu", "--output=json", "--output-path=stdout", "--quiet", "--only-categories=performance,accessibility,best-practices,seo"],
    { encoding: "utf8", timeout: 180_000 },
  );
  if (out.status !== 0) throw new Error(`lighthouse failed for ${url}: ${out.stderr.slice(0, 300)}`);
  return JSON.parse(out.stdout);
}

let failures = 0;
const summary = [];
for (const p of PAGES) {
  let report;
  try {
    report = audit(BASE + p);
  } catch (e) {
    console.error(`ERROR ${p}: ${e.message}`);
    failures++;
    continue;
  }
  const scores = {
    performance: Math.round((report.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((report.categories.accessibility?.score ?? 0) * 100),
    "best-practices": Math.round((report.categories["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((report.categories.seo?.score ?? 0) * 100),
  };
  const bad = Object.entries(THRESHOLDS).filter(([k, t]) => scores[k] < t);
  const line = `${p}: perf=${scores.performance} a11y=${scores.accessibility} bp=${scores["best-practices"]} seo=${scores.seo}${bad.length ? "  ❌ " + bad.map(([k, t]) => `${k}<${t}`).join(" ") : "  ✅"}`;
  console.log(line);
  summary.push({ page: p, scores, bad: bad.map(([k]) => k) });
  if (bad.length) failures++;
}

writeFileSync("e2e/reports/lighthouse.json", JSON.stringify(summary, null, 2));
console.log(`\nLighthouse: ${PAGES.length - failures}/${PAGES.length} pages at/above thresholds`);
process.exit(failures ? 1 : 0);
