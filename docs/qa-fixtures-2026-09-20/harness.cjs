// Shared Playwright bootstrap for the Sumaiya IO-matrix QA.
// Drives the LIVE site (https://sumaiya.app) with the machine's real Chrome.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "docs", "qa-fixtures-2026-09-20");
const SCRATCH = path.join(process.env.LOCALAPPDATA || "/tmp", "Temp", "sumaiya-qa");
fs.mkdirSync(SCRATCH, { recursive: true });

async function launch(opts = {}) {
  const browser = await chromium.launch({
    channel: opts.channel || "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    acceptDownloads: true,
    locale: "en-US",
  });
  const logs = [];
  const requests = [];
  const responses = [];
  ctx.on("console", (m) => logs.push({ type: m.type(), text: m.text().slice(0, 500) }));
  ctx.on("requestfailed", (r) => {
    logs.push({ type: "requestfailed", text: `${r.method()} ${r.url().slice(0, 160)} :: ${r.failure()?.errorText}` });
  });
  return { browser, ctx, logs, requests, responses };
}

/** Capture (and optionally abort) a set of API routes so no real AI spend happens. */
async function intercept(ctx, patterns, { mode = "abort", bodies = null } = {}) {
  const captured = [];
  for (const p of patterns) {
    await ctx.route(p, async (route) => {
      const req = route.request();
      let body = null;
      try { body = req.postData(); } catch { /* ignore */ }
      captured.push({ url: req.url(), method: req.method(), body });
      if (mode === "abort") return route.abort("failed");
      if (bodies && bodies[req.url()]) return route.fulfill({ status: 200, contentType: "application/json", body: bodies[req.url()] });
      return route.continue();
    });
  }
  return captured;
}

module.exports = { launch, intercept, OUT, SCRATCH, fs, path };
