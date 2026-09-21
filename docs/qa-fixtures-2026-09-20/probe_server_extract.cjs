// PROBE A — the live server extractor: POST /api/tools/extract-text on sumaiya.app.
// This is the real deployed route (lib/api/routes/tools.ts), reached over the
// public internet with real multipart bodies. 10 req/min per IP -> paced.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const FIX = __dirname;
const PACE_MS = 7000;
const OUTJSON = path.join(FIX, "results-server-extract.json");

const CASES = [
  ["cv-text.pdf", "text-layer PDF (English)"],
  ["cv-sw.pdf", "text-layer PDF (Swahili)"],
  ["cv-mixed.pdf", "text-layer PDF (Swahili+English)"],
  ["cv-long.pdf", "7-page text PDF"],
  ["cv-scanned.pdf", "image-only / scanned PDF"],
  ["cv-blank.pdf", "blank PDF, no text on any page"],
  ["cv-huge.pdf", "27 MB PDF (over 4 MB route cap)"],
  ["cv-zero.pdf", "zero-byte file named .pdf"],
  ["cv-corrupt.pdf", "corrupt/garbage PDF"],
  ["cv-protected.pdf", "password-protected PDF"],
  ["cv-docx-content-mismatch.pdf", "real DOCX bytes named .pdf"],
  ["cv-png-content-mismatch.pdf", "real PNG bytes named .pdf"],
  ["cv-pdf-content-mismatch.docx", "real PDF bytes named .docx"],
  ["cv-noextension", "real DOCX bytes, no extension"],
  ["cv.docx", "genuine DOCX (English)"],
  ["cv-sw.docx", "genuine DOCX (Swahili)"],
  ["cv-mixed.docx", "genuine DOCX (mixed)"],
  ["cv-photo.docx", "genuine DOCX with an embedded image"],
  ["cv-long.docx", "genuine long DOCX"],
  ["cv.txt", "plain .txt CV"],
  ["cv-sw.txt", "plain .txt CV (Swahili)"],
  ["cv-photo.jpg", "JPEG photo of a CV"],
  ["cv-photo-sw.png", "PNG photo of a CV (Swahili)"],
  ["photo-tall-alpha.png", "PNG with alpha, tall (not a CV)"],
  ["photo.webp", "WebP image"],
  ["cv-zero.docx", "zero-byte file named .docx"],
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext();
  const api = ctx.request;
  const results = [];
  let first = true;

  for (const [file, label] of CASES) {
    const p = path.join(FIX, file);
    if (!fs.existsSync(p)) { results.push({ file, label, outcome: "FIXTURE_MISSING" }); continue; }
    const size = fs.statSync(p).size;
    if (!first) await new Promise((r) => setTimeout(r, PACE_MS));
    first = false;
    const t0 = Date.now();
    let rec = { file, label, bytes: size };
    try {
      const res = await api.post("https://sumaiya.app/api/tools/extract-text", {
        multipart: { file: { name: file, mimeType: "application/octet-stream", buffer: fs.readFileSync(p) } },
        timeout: 120000,
      });
      rec.status = res.status();
      const ct = res.headers()["content-type"] || "";
      rec.ct = ct;
      let body = await res.text();
      let json = null;
      try { json = JSON.parse(body); } catch { /* non-JSON */ }
      if (json) {
        rec.error = json.error ?? null;
        rec.pages = json.pages ?? null;
        rec.textLen = typeof json.text === "string" ? json.text.length : null;
        rec.textChars = typeof json.text === "string" ? json.text.replace(/\s/g, "").length : null;
        rec.textHead = typeof json.text === "string" ? json.text.slice(0, 220) : null;
        rec.textTail = typeof json.text === "string" ? json.text.slice(-120) : null;
      } else {
        rec.raw = body.slice(0, 300);
      }
    } catch (e) {
      rec.requestError = String(e).slice(0, 200);
    }
    rec.ms = Date.now() - t0;
    results.push(rec);
    console.log(JSON.stringify(rec));
  }

  fs.writeFileSync(OUTJSON, JSON.stringify(results, null, 1));
  console.log("\nWROTE " + OUTJSON + " (" + results.length + " cases)");
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
