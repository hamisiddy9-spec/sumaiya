// PROBE B — the live CLIENT import path on /assistant.
// Uploads each fixture through the page's real hidden <input type=file> (the
// same handler a user's file picker triggers), then records:
//   - the progress text the user sees while it works (spinner label / % OCR)
//   - the terminal state: a readable error string, or an attachment chip
//   - the exact text the app extracted, captured from the outgoing AI request
// The AI request is ABORTED so no model spend happens; the intercepted body is
// the ground truth for "did it extract the right fields".
const { launch } = require("./harness.cjs");
const fs = require("fs");
const path = require("path");

const FIX = __dirname;
const OUTJSON = path.join(FIX, "results-assistant-uploads.json");

const CASES = [
  ["cv-text.pdf", "text-layer PDF (English)"],
  ["cv-sw.pdf", "text-layer PDF (Swahili)"],
  ["cv-long.pdf", "7-page text PDF"],
  ["cv-scanned.pdf", "scanned / image-only PDF"],
  ["cv-blank.pdf", "blank PDF (no text at all)"],
  ["cv-huge.pdf", "27 MB PDF (over the 25 MB cap)"],
  ["cv-zero.pdf", "zero-byte .pdf"],
  ["cv-corrupt.pdf", "corrupt PDF"],
  ["cv-protected.pdf", "password-protected PDF"],
  ["cv-docx-content-mismatch.pdf", "DOCX bytes named .pdf"],
  ["cv-png-content-mismatch.pdf", "PNG bytes named .pdf"],
  ["cv-pdf-content-mismatch.docx", "PDF bytes named .docx"],
  ["cv-noextension", "DOCX bytes, no extension"],
  ["cv.docx", "genuine DOCX (English)"],
  ["cv-sw.docx", "genuine DOCX (Swahili)"],
  ["cv-long.docx", "long genuine DOCX"],
  ["cv.txt", "plain .txt CV"],
  ["cv-sw.txt", "plain .txt CV (Swahili)"],
  ["cv-photo.jpg", "JPEG photo of a CV"],
  ["cv-photo-sw.png", "PNG photo of a CV (Swahili)"],
];

const PROGRESS_SEL = "text=Reading your file…";

async function waitForOutcome(page, prevChips, budgetMs) {
  // LANGUAGE-AGNOSTIC: snapshot the page text BEFORE, then treat ANY new line of
  // visible text as the app's terminal message. An earlier version matched only
  // English error strings and therefore reported Swahili-language errors as
  // "no terminal state" — a false silent failure.
  const baseline = await page.evaluate(() => document.body.innerText);
  const baseLines = new Set(baseline.split("\n").map((s) => s.trim()).filter(Boolean));
  const t0 = Date.now();
  const seen = [];
  let last = "";
  while (Date.now() - t0 < budgetMs) {
    const state = await page.evaluate(() => {
      const t = document.body.innerText;
      const chips = [...document.querySelectorAll("body *")].filter(
        (e) => e.children.length === 0 && /📎/.test(e.textContent || "")
      ).length;
      return { t, chips };
    });
    const prog = (state.t.match(/(Reading your file…|Reading image…?[^\n]*|Inasoma[^\n]*)/g) || []).join(" | ");
    if (prog && prog !== last) { seen.push({ at: Date.now() - t0, text: prog.slice(0, 160) }); last = prog; }
    if (state.chips > prevChips) return { kind: "chip", seen, at: Date.now() - t0, chips: state.chips };
    // any new visible line that is not the progress label
    const fresh = state.t.split("\n").map((s) => s.trim()).filter((s) => s && !baseLines.has(s) && !/^(Inasoma|Reading)/.test(s));
    if (fresh.length) {
      return { kind: "message", message: fresh.slice(-3).join(" / ").slice(0, 220), seen, at: Date.now() - t0 };
    }
    await page.waitForTimeout(400);
  }
  return { kind: "TIMEOUT_NO_TERMINAL_STATE", seen, at: budgetMs, finalTextTail: (await page.evaluate(() => document.body.innerText)).slice(-300).replace(/\s+/g, " ") };
}

(async () => {
  const { browser, ctx, logs } = await launch();
  const captured = [];
  await ctx.route("**/api/ai/**", async (route) => {
    captured.push({ url: route.request().url(), body: (route.request().postData() || "").slice(0, 60000) });
    await route.abort("failed");
  });
  const serverCalls = [];
  await ctx.route("**/api/tools/**", async (route) => {
    serverCalls.push({ url: route.request().url() });
    await route.continue();
  });

  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/assistant?lang=en", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);

  const results = [];
  for (const [file, label] of CASES) {
    const p = path.join(FIX, file);
    if (!fs.existsSync(p)) { results.push({ file, label, outcome: "FIXTURE_MISSING" }); continue; }
    captured.length = 0;
    const before = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => e.children.length === 0 && /📎/.test(e.textContent || "")).length);
    const t0 = Date.now();
    let rec = { file, label, bytes: fs.statSync(p).size };
    try {
      const input = await page.$("input[type=file]");
      await input.setInputFiles(p);
      const budget = file === "cv-blank.pdf" ? 120000 : 60000;
      const outcome = await waitForOutcome(page, before, budget);
      rec = { ...rec, ...outcome, wallMs: Date.now() - t0 };
      const aiReq = captured.find((c) => /assistant-turn|build-|parse-cv/.test(c.url));
      if (captured.length) {
        let payload = null;
        try { payload = JSON.parse(captured[0].body); } catch { payload = { raw: captured[0].body.slice(0, 400) }; }
        const flat = JSON.stringify(payload);
        rec.aiEndpoint = captured[0].url;
        rec.aiPayloadBytes = flat.length;
        // The attachment text is the block between the FIRST pair of triple
        // quotes in the message that names THIS file — not simply the longest
        // string, which drifts into earlier turns of the persisted thread.
        const msgs = Array.isArray(payload?.messages) ? payload.messages : [];
        const mine = msgs.filter((m) => typeof m.content === "string" && m.content.includes(file));
        const src = (mine.length ? mine : msgs).map((m) => m.content).filter((c) => typeof c === "string").join("\n");
        const q = src.match(/"""([\s\S]*?)"""/);
        const attach = (q ? q[1] : src).trim();
        rec.extractedChars = attach.replace(/\s/g, "").length;
        rec.extractedHead = attach.slice(0, 220);
        rec.extractedTail = attach.slice(-140);
        rec.attachmentLocated = !!q && mine.length > 0;
      }
      rec.serverCalls = serverCalls.length;
    } catch (e) {
      rec.harnessError = String(e).slice(0, 300);
    }
    results.push(rec);
    console.log(JSON.stringify(rec));
    // reset the chat so the next case starts clean
    await page.goto("https://sumaiya.app/assistant?lang=en", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2500);
  }

  fs.writeFileSync(OUTJSON, JSON.stringify(results, null, 1));
  fs.writeFileSync(path.join(FIX, "results-assistant-console.json"), JSON.stringify(logs.slice(0, 200), null, 1));
  console.log("\nWROTE " + OUTJSON + " (" + results.length + " cases)");
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
