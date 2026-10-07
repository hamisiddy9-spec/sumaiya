// Item 1 harness — runs the app's OWN lib/pdf.ts (bundled) against a DOM that
// mirrors the editor's capture target: a FitFrame sheet (794x1123) wrapping the
// AutoFitPage page box (794x1123, overflow:hidden) that holds an over-long CV,
// with the editor's "CV too long" warning pill rendered inside the page box.
//
// Reports: PDF page count, whether the ATS text layer claims content the raster
// does not show, whether the warning pill was rasterised into the page image,
// and the last role that is actually visible before the page box clips.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const bundle = process.argv[2];
const label = process.argv[3] || path.basename(bundle);
const out = path.join(".qa-io", `item1-${label}.json`);

const ROLES = 9;
const BULLETS = 6;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #eee; }
  #sheet { width: 794px; min-height: 1123px; background: #fff; position: relative; font-family: Arial, sans-serif; }
  #page { width: 794px; height: 1123px; overflow: hidden; position: relative; }
  .head { padding: 28px 34px 12px; }
  .role { padding: 0 34px 14px; }
  .line { font-size: 10.5px; line-height: 1.55; color: #444; }
</style></head><body>
<div id="host"><div id="sheet"><div id="page"></div></div></div>
<script src="BUNDLE_SRC"></script>
</body></html>`;


const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 300)));
await page.setContent(html.replace("BUNDLE_SRC", "file:///" + path.resolve(bundle).replace(/\\/g, "/")));
await page.addScriptTag({ path: path.resolve(bundle) });
await page.waitForTimeout(500);


const result = await page.evaluate(async ({ roles, bullets }) => {
  // build the DOM inside this evaluate so the geometry is measured here
  const pageEl = document.getElementById("page");
  pageEl.innerHTML = "";
  const head = document.createElement("div");
  head.className = "head";
  head.innerHTML = '<div style="font-size:30px;font-weight:800">Amina Joseph Mwakasege</div>' +
    '<div style="font-size:12px;color:#2563EB;margin-bottom:14px">Software Engineer</div>' +
    '<div style="font-size:11px;color:#555;margin-bottom:16px">amina.mwakasege@example.co.tz | +255 712 345 678 | Dar es Salaam, Tanzania</div>' +
    '<div style="font-size:13px;font-weight:800;margin-bottom:10px">PROFESSIONAL SUMMARY</div>' +
    '<div class="line">Software engineer with six years building payment and logistics platforms across East Africa, ' +
    'leading settlement workstreams, cutting reconciliation time and mentoring four engineers.</div>';
  pageEl.appendChild(head);
  const boxes = [];
  for (let i = 1; i <= roles; i++) {
    const d = document.createElement("div");
    d.className = "role"; d.setAttribute("data-role", String(i));
    let inner = '<div style="display:flex;justify-content:space-between"><span style="font-size:12.5px;font-weight:700">Role ' + i + '</span>' +
      '<span style="font-size:9.5px;color:#999">201' + (i % 10) + ' – 201' + (i % 10) + '</span></div>' +
      '<div style="font-size:11px;color:#2563EB;font-weight:600;margin:1px 0 5px">Employer ' + i + ' · Nairobi, Kenya</div>';
    for (let b = 1; b <= bullets; b++) {
      inner += '<div class="line" style="display:flex;gap:7px"><span style="color:#2563EB">▪</span>' +
        '<span>Delivered initiative ' + i + '.' + b + ' with measurable impact on settlement throughput, cutting manual ' +
        'reconciliation by ' + (10 + b) + ' percent across ' + (2 + i) + ' markets and clearing exception queues for the operations team.</span></div>';
    }
    d.innerHTML = inner;
    pageEl.appendChild(d);
  }
  const rest = document.createElement("div");
  rest.className = "role"; rest.setAttribute("data-role", "education");
  rest.innerHTML = '<div style="font-size:13px;font-weight:800;margin:10px 0 8px">EDUCATION</div>' +
    '<div style="font-size:11px">University of Dar es Salaam — BSc Computer Science · 2014 – 2018</div>' +
    '<div style="font-size:13px;font-weight:800;margin:12px 0 8px">CERTIFICATIONS</div>' +
    '<div style="font-size:11px">AWS Solutions Architect Associate · Amazon Web Services · 2023</div>' +
    '<div style="font-size:13px;font-weight:800;margin:12px 0 8px">REFEREES</div>' +
    '<div style="font-size:11px">Baraka Mushi · CTO, PayCo · baraka.mushi@example.co.tz | +255 786 333 444</div>';
  pageEl.appendChild(rest);
  const pill = document.createElement("div");
  pill.setAttribute("data-role", "pill");
  pill.setAttribute("data-pdf-exclude", "");
  pill.style.cssText = "position:absolute;bottom:10px;right:10px;background-color:#FEF2F2;border:1px solid #FCA5A5;" +
    "border-radius:6px;padding:3px 8px;font-size:8.5px;color:#DC2626;font-family:system-ui,sans-serif;pointer-events:none";
  pill.textContent = "⚠ CV too long — remove some content";
  pageEl.appendChild(pill);

  const pageRect = pageEl.getBoundingClientRect();
  for (const el of Array.from(pageEl.children)) {
    const r = el.getBoundingClientRect();
    boxes.push({ role: el.getAttribute("data-role") || "?", top: Math.round(r.top - pageRect.top), bottom: Math.round(r.bottom - pageRect.top) });
  }
  const fully = boxes.filter((b) => b.bottom <= 1123.5 && b.role !== "pill");
  const visible = boxes.filter((b) => b.top < 1123.5 && b.role !== "pill");
  const geometry = {
    pageBoxHeight: Math.round(pageRect.height),
    contentHeight: Math.round(pageEl.scrollHeight),
    lastFullyVisible: fully.length ? fully[fully.length - 1].role : null,
    lastPartlyVisible: visible.length ? visible[visible.length - 1].role : null,
    rolesClipped: boxes.filter((b) => b.role !== "pill" && b.top >= 1123.5).map((b) => b.role),
    clippedPxOfLastFullyVisible: fully.length ? Math.max(0, 1123 - fully[fully.length - 1].bottom) : null,
  };

  // ── the export, through the app's own code ────────────────────────────────
  const rolesData = [];
  for (let i = 1; i <= roles; i++) {
    rolesData.push({ id: `e${i}`, company: `Employer ${i}`, position: `Role ${i}`, location: "Nairobi, Kenya",
      startDate: `201${i % 10}`, endDate: `201${(i + 1) % 10}`, current: false,
      description: `Delivered initiative ${i}.1 with measurable impact on settlement throughput.` });
  }
  const cv = {
    personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "Software Engineer", email: "amina.mwakasege@example.co.tz", phone: "+255 712 345 678", location: "Dar es Salaam, Tanzania" },
    summary: "Software engineer with six years building payment and logistics platforms across East Africa.",
    experience: rolesData,
    education: [{ institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science", startDate: "2014", endDate: "2018" }],
    skills: Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, name: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS", "GraphQL", "Kubernetes", "Terraform"][i], level: 3 })),
    languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }],
    certifications: [{ id: "c1", name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", date: "2023" }],
    referees: [{ id: "r1", name: "Baraka Mushi", title: "CTO", company: "PayCo", email: "baraka.mushi@example.co.tz", phone: "+255 786 333 444" }],
    hobbies: "Long-distance running, chess, and Swahili literature.",
  };
  const textLayer = (window).QAPdf.buildCvText(cv, "en");
  const sheet = document.getElementById("sheet");
  let pdfBytes = [];
  let pageCount = 0;
  let textHasRole9 = false;
  let textHasTypeScript = false;
  let errorName = null;
  let errorMessage = null;
  try {
    const blob = await (window).QAPdf.renderElementToPdfBlob(sheet, { filename: "QA.pdf", textLayer });
    const buf = new Uint8Array(await blob.arrayBuffer());
    pdfBytes = Array.from(buf);
    let latin = "";
    for (let i = 0; i < buf.length; i += 8192) latin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 8192)));
    pageCount = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;
    textHasRole9 = latin.indexOf("Role 9") >= 0;
    textHasTypeScript = latin.indexOf("TypeScript") >= 0;
  } catch (e) {
    errorName = e?.name || e?.constructor?.name || "Error";
    errorMessage = String(e?.message || e).slice(0, 300);
    pdfBytes = [];
  }

  // ── is the warning pill rasterised into the delivered page image? ────────
  let pillPixels = 0;
  let pageImages = 0;
  let imageDims = [];
  if (pdfBytes.length) {
    const bytes = new Uint8Array(pdfBytes);
    // every /DCTDecode stream is one page's raster (lib/pdf.ts encodes each page as JPEG)
    const latinBytes = new TextDecoder("latin1").decode(bytes);
    let idx = 0;
    while (true) {
      const dct = latinBytes.indexOf("/DCTDecode", idx);
      if (dct < 0) break;
      const streamStart = latinBytes.indexOf("stream", dct);
      let dataStart = streamStart + "stream".length;
      while (latinBytes[dataStart] === "\r" || latinBytes[dataStart] === "\n") dataStart++;
      const end = latinBytes.indexOf("endstream", dataStart);
      if (end < 0) break;
      const jpeg = bytes.subarray(dataStart, end);
      let bin = "";
      for (let i = 0; i < jpeg.length; i += 8192) bin += String.fromCharCode.apply(null, Array.from(jpeg.subarray(i, i + 8192)));
      const url = "data:image/jpeg;base64," + btoa(bin);
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.onerror = res; img.src = url; });
      if (img.naturalWidth) {
        pageImages++;
        imageDims.push([img.naturalWidth, img.naturalHeight]);
        const c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cx = c.getContext("2d");
        cx.drawImage(img, 0, 0);
        const region = cx.getImageData(Math.floor(c.width * 0.45), Math.floor(c.height * 0.85), Math.ceil(c.width * 0.55), Math.ceil(c.height * 0.15));
        const d = region.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (r > 150 && r - g > 40 && r - b > 40) pillPixels++;
        }
      }
      idx = end;
    }
  }

  return { geometry, pdfBytes: pdfBytes.length, pageCount, textHasRole9, textHasTypeScript, pillPixels, pageImages, imageDims, errorName, errorMessage, textLayerChars: textLayer.length, textLayerHasRole9: textLayer.indexOf("Role 9") >= 0 };
}, { roles: ROLES, bullets: BULLETS });

const record = { label, bundle, ...result, consoleErrors };
fs.writeFileSync(out, JSON.stringify(record, null, 1));
console.log(JSON.stringify(record, null, 1));
await browser.close();
