// PART 3 — the photo pipeline limits, measured end-to-end through the REAL
// editor upload control (which calls lib/photo-upload.ts downscalePhotoFile),
// against the documented claims: 12 MB source cap, 600px square, JPEG q0.82,
// 400 KB stored ceiling, JPG/PNG/WebP only.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));

const CASES = [
  ["photo-oversize.jpg", "14.3 MB JPEG — OVER the 12 MB source cap"],
  ["photo-noisy.jpg", "7.9 MB high-noise JPEG — just under the cap, forces the 400 KB step-down"],
  ["cv-photo.jpg", "378 KB JPEG photo of a CV (1600px)"],
  ["cv-photo-sw.png", "222 KB PNG photo of a CV (1400px)"],
  ["photo-tall-alpha.png", "7.6 KB tall PNG with alpha (700x1000)"],
  ["photo.webp", "290 KB WebP"],
  ["photo.svg", "99 B SVG — deliberately excluded type"],
  ["cv.docx", "DOCX picked into the photo input — wrong type"],
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 } });
  const page = await ctx.newPage();
  const out = [];

  async function openEditor() {
    await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(8000);
    // make sure no stored photo interferes
    const tab = page.getByRole("button", { name: /Kuhusu|About/i }).first();
    if (await tab.count()) { await tab.click({ force: true }).catch(() => {}); await page.waitForTimeout(2500); }
  }

  for (const [file, label] of CASES) {
    const fp = path.join(__dirname, file);
    const rec = { file, label, bytes: fs.existsSync(fp) ? fs.statSync(fp).size : null };
    try {
      await openEditor();
      const inp = page.locator('input[type=file][accept*="image/jpeg"]').first();
      rec.inputFound = (await inp.count()) > 0;
      if (!rec.inputFound) { out.push(rec); console.log(JSON.stringify(rec)); continue; }

      // read state BEFORE
      const before = await page.evaluate(() => {
        const im = document.querySelector('img[src^="data:image"]');
        return { hasPhoto: !!im, len: im ? im.src.length : 0 };
      });
      rec.photoBefore = before.hasPhoto;

      await inp.setInputFiles(fp);
      await page.waitForTimeout(9000);

      const after = await page.evaluate(async () => {
        const toastEls = [...document.querySelectorAll("[role=status],[role=alert],[class*=toast],li[data-sonner-toast]")]
          .map((e) => (e.innerText || "").trim().replace(/\s+/g, " ")).filter(Boolean);
        const im = document.querySelector('img[src^="data:image"]');
        let dims = null, payload = 0;
        if (im && im.src.startsWith("data:image")) {
          const comma = im.src.indexOf(",");
          const b64 = im.src.slice(comma + 1);
          payload = Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);
          try {
            const bmp = await createImageBitmap(await (await fetch(im.src)).blob());
            dims = [bmp.width, bmp.height];
          } catch (e) { dims = "decode-failed"; }
        }
        return { toasts: [...new Set(toastEls)].slice(0, 6), hasPhoto: !!im, dataUrlLen: im ? im.src.length : 0, payloadBytes: payload, dims, mime: im ? im.src.slice(5, im.src.indexOf(";")) : null };
      });
      rec.after = after;
    } catch (e) {
      rec.harnessError = String(e).slice(0, 200);
    }
    out.push(rec);
    console.log(JSON.stringify(rec));
  }
  fs.writeFileSync(path.join(__dirname, "results-photo-limits.json"), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
