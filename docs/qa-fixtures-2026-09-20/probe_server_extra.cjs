// Extra server-extract probes: the documented 4 MB route cap boundary and a
// couple of awkward inputs added after the first pass.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FIX = __dirname;
const CASES = [
  ["cv-over4mb.pdf", "4.28 MB PDF — just over the documented 4 MB route cap, under Vercel's ~4.5 MB edge limit"],
  ["cv-whitespace.txt", "text file that is only whitespace"],
  ["cv-prompt-injection.pdf", "PDF whose text tries to instruct the model"],
  ["cv-huge-paste.txt", "127 KB plain text (over the route's 60 000-char text slice)"],
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext();
  const api = ctx.request;
  const out = [];
  for (const [file, label] of CASES) {
    const p = path.join(FIX, file);
    if (!fs.existsSync(p)) { out.push({ file, label, outcome: "MISSING" }); console.log(file, "MISSING"); continue; }
    const rec = { file, label, bytes: fs.statSync(p).size };
    const t0 = Date.now();
    try {
      const res = await api.post("https://sumaiya.app/api/tools/extract-text", {
        multipart: { file: { name: file, mimeType: "application/octet-stream", buffer: fs.readFileSync(p) } },
        timeout: 180000,
      });
      rec.status = res.status();
      const txt = await res.text();
      let j = null; try { j = JSON.parse(txt); } catch { /* */ }
      if (j) {
        rec.error = j.error ?? null;
        rec.pages = j.pages ?? null;
        rec.textLen = typeof j.text === "string" ? j.text.length : null;
        rec.textHead = typeof j.text === "string" ? j.text.slice(0, 200) : null;
        rec.textTail = typeof j.text === "string" ? j.text.slice(-160) : null;
      } else {
        rec.rawBody = txt.slice(0, 240);
      }
    } catch (e) { rec.requestError = String(e).slice(0, 200); }
    rec.ms = Date.now() - t0;
    out.push(rec);
    console.log(JSON.stringify(rec));
    await new Promise((r) => setTimeout(r, 7000));
  }
  fs.writeFileSync(path.join(FIX, "results-server-extra.json"), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 400)); process.exit(1); });
