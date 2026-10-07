// Item 3 after-probe — attach the 27 MB PDF on the live /assistant and record
// what the user ends up seeing, and how long it takes.
//   before: chip stuck on "· inasoma…" / "· reading…" for 177 s, terminal null
//   after : a visible, specific message, fast, and NO request that cannot settle
import fs from "node:fs";
import path from "node:path";
import { launch } from "../docs/qa-fixtures-2026-09-20/harness.cjs";

const FILE = process.argv[2] || "docs/qa-fixtures-2026-09-20/cv-huge.pdf";
const BUDGET_MS = Number(process.argv[3] || 60_000);
const LANG = process.argv[4] || "sw";
const outFile = `.qa-io/results-huge-after-${LANG}.json`;

const rec = { file: FILE, bytes: fs.statSync(FILE).size, lang: LANG };
const { browser, ctx, logs } = await launch();
const serverCalls = [];
await ctx.route("**/api/tools/**", async (route) => {
  serverCalls.push({ url: route.request().url(), method: route.request().method() });
  await route.continue();
});
const aiCalls = [];
await ctx.route("**/api/ai/**", async (route) => {
  aiCalls.push({ url: route.request().url() });
  await route.abort("failed");
});

const page = await ctx.newPage();
await page.goto(`https://sumaiya.app/assistant?lang=${LANG}`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(4000);

const baseText = await page.evaluate(() => document.body.innerText);
const baseLines = new Set(baseText.split("\n").map((s) => s.trim()).filter(Boolean));

const t0 = Date.now();
try {
  const input = await page.$("input[type=file]");
  if (!input) throw new Error("no file input on /assistant");
  await input.setInputFiles(path.resolve(FILE));
  const seen = [];
  let outcome = null;
  while (Date.now() - t0 < BUDGET_MS) {
    const state = await page.evaluate(() => {
      const t = document.body.innerText;
      const chips = [...document.querySelectorAll("body *")].filter((e) => e.children.length === 0 && /📎/.test(e.textContent || "")).length;
      return { t, chips };
    });
    const prog = (state.t.match(/(Reading your file…|Reading image…?[^\n]*|Inasoma[^\n]*|inasoma[^\n]*)/g) || []).join(" | ");
    if (prog) seen.push({ at: Date.now() - t0, text: prog.slice(0, 120) });
    if (state.chips > 0) { outcome = { kind: "chip", at: Date.now() - t0 }; break; }
    const fresh = state.t.split("\n").map((s) => s.trim()).filter((s) => s && !baseLines.has(s) && !/^(Inasoma|Reading)/.test(s));
    if (fresh.length) { outcome = { kind: "message", at: Date.now() - t0, message: fresh.slice(-2).join(" / ").slice(0, 300) }; break; }
    await page.waitForTimeout(300);
  }
  rec.outcome = outcome || { kind: "TIMEOUT_NO_TERMINAL_STATE", at: Date.now() - t0 };
  rec.progressSeen = seen.slice(-4);
  rec.wallMs = Date.now() - t0;
  rec.serverCalls = serverCalls;
  rec.aiCalls = aiCalls.length;
  rec.finalTextTail = (await page.evaluate(() => document.body.innerText)).slice(-400).replace(/\s+/g, " ");
} catch (e) {
  rec.harnessError = String(e).slice(0, 300);
  rec.wallMs = Date.now() - t0;
}
rec.requestFailedLogs = logs.filter((l) => l.type === "requestfailed").slice(0, 6);
fs.writeFileSync(outFile, JSON.stringify(rec, null, 1));
console.log(JSON.stringify(rec, null, 1));
await browser.close();
