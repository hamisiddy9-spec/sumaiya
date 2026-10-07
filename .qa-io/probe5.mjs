// Item 5 after-probe — the live extractor matrix. POSTs each fixture to a base
// URL and records status + content-type + the message the user would read.
// Usage: node .qa-io/probe5.mjs <baseUrl> <outFile>
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] || "https://sumaiya.app";
const outFile = process.argv[3] || ".qa-io/results-server-extract-after.json";
const DIR = "docs/qa-fixtures-2026-09-20";

const CASES = [
  ["cv-photo.jpg", "JPEG photo of a CV (378 773 B)"],
  ["cv-photo-sw.png", "PNG photo of a CV (222 099 B)"],
  ["photo.webp", "WebP image (289 812 B)"],
  ["cv-corrupt.pdf", "corrupt/garbage PDF (11 515 B)"],
  ["cv-protected.pdf", "password-protected PDF (3 418 B)"],
  ["cv-blank.pdf", "blank PDF (2 empty pages, 1 708 B)"],
  ["cv-scanned.pdf", "image-only / scanned PDF (242 440 B)"],
  ["cv-zero.pdf", "zero-byte file named .pdf"],
  ["cv-zero.docx", "zero-byte file named .docx"],
  ["cv-text.pdf", "text-layer PDF (happy path)"],
  ["cv.docx", "genuine DOCX (happy path)"],
  ["cv-over4mb.pdf", "4.49 MB PDF — between the 4 MB cap and Vercel's ~4.5 MB edge limit"],
];

const rows = [];
for (const [file, label] of CASES) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) { rows.push({ file, label, MISSING: true }); continue; }
  const buf = fs.readFileSync(p);
  const fd = new FormData();
  fd.append("file", new Blob([buf]), file);
  const t0 = Date.now();
  const rec = { file, label, bytes: buf.length };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    const res = await fetch(`${base}/api/tools/extract-text`, { method: "POST", body: fd, signal: controller.signal });
    clearTimeout(timer);
    rec.status = res.status;
    rec.ct = res.headers.get("content-type");
    const text = await res.text();
    rec.ms = Date.now() - t0;
    try {
      const j = JSON.parse(text);
      rec.error = j.error ?? null;
      rec.success = j.success ?? null;
      rec.textChars = typeof j.text === "string" ? j.text.trim().length : null;
      rec.pages = j.pages ?? null;
    } catch {
      rec.raw = text.slice(0, 200);
    }
  } catch (e) {
    rec.ms = Date.now() - t0;
    rec.harnessError = String(e).slice(0, 200);
  }
  rows.push(rec);
  console.log(JSON.stringify(rec));
}
fs.writeFileSync(outFile, JSON.stringify(rows, null, 1));
console.log("WROTE " + outFile);
