// CLEAN serial matrix: ONE browser, ONE writer, nothing running concurrently.
//
// For every curated template (47) and a legacy spread (12) it exports the CV
// TWICE — once with a photo, once without — and screenshots the live preview of
// the photo-on render. It self-verifies that the template actually applied by
// reading the toolbar's own template name; a mismatch is recorded as such
// instead of silently producing a wrong attribution.
//
// Then it runs the option variants: 10 colours, 12 fonts, 3 densities, 9 hidden
// sections, 6 Swahili templates, 3 over-long templates, 1 minimal CV.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUT = path.join(__dirname, "clean");
const RESULT = path.join(__dirname, "results-clean.json");
const NAMES = require("./template-names.json");
fs.mkdirSync(OUT, { recursive: true });

const EN = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-en.json"), "utf8"));
const SW = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-sw.json"), "utf8"));
const LONG = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-long.json"), "utf8"));
const PHOTO = fs.readFileSync(path.join(__dirname, "photo-small-dataurl.txt"), "utf8").trim();

const HOOK = `
window.__qa = { blobs: [], names: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) { try { window.__qa.blobs.push(b); } catch (e) {} return orig(b); };
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__qa.names.push(this.download); return; } return origClick.apply(this, arguments); };
}
`;

const COLORS = [["Ember", "#DA4A1C"], ["Pine", "#12433D"], ["Purple", "#7C3AED"], ["Forest", "#059669"], ["Coral", "#DC2626"],
                ["Sunset", "#D97706"], ["Ocean", "#0891B2"], ["Royal", "#2563EB"], ["Midnight", "#0F172A"], ["Slate", "#64748B"]];
const FONTS = ["Inter", "Hanken", "Helvetica", "Verdana", "Trebuchet", "Georgia", "Palatino", "Garamond", "Cambria", "Times", "JetBrains Mono", "Courier"];
const SECTIONS = ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "referees", "hobbies"];
const LEGACY = ["aberdare", "alpine", "austin", "bauhaus", "carbon", "cascade", "chicago", "cirrus", "cipher", "celeste", "boston", "baroque-cv"];

const withPhoto = (cv) => ({ ...cv, personal: { ...cv.personal, photo: PHOTO } });

function jobs() {
  const j = [];
  for (const [id, name] of [...NAMES.curated.map((c) => [c[0], c[1]]), ...LEGACY.map((l) => [l, (NAMES.legacy.find((x) => x[0] === l) || [])[1]])]) {
    j.push({ key: `photo-${id}`, group: "template-photo", templateId: id, expectName: name, dir: "photo", data: withPhoto(EN) });
    j.push({ key: `nophoto-${id}`, group: "template-nophoto", templateId: id, expectName: name, dir: "nophoto", data: EN });
  }
  for (const [n, hex] of COLORS) j.push({ key: `colour-${n}`, group: "colour", templateId: "nakuru", expectName: "Nakuru", dir: "options", data: EN, color: hex });
  for (const f of FONTS) j.push({ key: `font-${f.replace(/\s+/g, "")}`, group: "font", templateId: "nakuru", expectName: "Nakuru", dir: "options", data: EN, font: f });
  for (const d of ["compact", "normal", "airy"]) j.push({ key: `density-${d}`, group: "density", templateId: "nakuru", expectName: "Nakuru", dir: "options", data: { ...EN, density: d } });
  for (const s of SECTIONS) j.push({ key: `hide-${s}`, group: "section-hidden", templateId: "nakuru", expectName: "Nakuru", dir: "options", data: { ...EN, hiddenSections: [s] } });
  for (const id of ["rift", "zahabu", "nuru", "serengeti", "oxford", "sahara"]) j.push({ key: `swahili-${id}`, group: "swahili", templateId: id, expectName: (NAMES.curated.find((c) => c[0] === id) || [])[1], dir: "options", data: SW });
  for (const id of ["nakuru", "zahabu", "canvas-magazine"]) j.push({ key: `long-${id}`, group: "long-cv", templateId: id, expectName: (NAMES.curated.find((c) => c[0] === id) || [])[1], dir: "options", data: LONG });
  j.push({ key: "minimal-nameonly", group: "edge", templateId: "nakuru", expectName: "Nakuru", dir: "options",
    data: { personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "", email: "", phone: "", location: "", linkedin: "", website: "" },
      summary: "", experience: [], education: [], skills: [], projects: [], languages: [], certifications: [], referees: [], hobbies: "" } });
  return j;
}

async function captureBlob(page) {
  return page.evaluate(async () => {
    if (!window.__qa.blobs.length) return null;
    const b = window.__qa.blobs[window.__qa.blobs.length - 1];
    const buf = new Uint8Array(await b.arrayBuffer());
    let s = ""; for (let j = 0; j < buf.length; j++) s += String.fromCharCode(buf[j]);
    return { size: b.size, type: b.type, b64: btoa(s) };
  });
}

async function previewInfo(page) {
  return page.evaluate(async () => {
    const sheet = document.getElementById("cv-preview");
    if (!sheet) return { noSheet: true };
    let toolbarName = null;
    for (const b of document.querySelectorAll("button")) {
      const t = (b.innerText || "").trim();
      if (/Badilisha|^Change$/m.test(t)) { toolbarName = t.replace(/\s*(Badilisha|Change)\s*/i, "").trim(); break; }
    }
    const imgs = [...sheet.querySelectorAll("img")];
    const photo = imgs.map((im) => {
      const r = im.getBoundingClientRect();
      return { srcKind: im.src.slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), natural: [im.naturalWidth, im.naturalHeight] };
    });
    // pixel variance of the FIRST image element, drawn to a canvas
    let variance = null, distinct = null;
    if (imgs.length) {
      try {
        const im = imgs[0];
        const c = document.createElement("canvas");
        c.width = im.naturalWidth || 100; c.height = im.naturalHeight || 100;
        const cx = c.getContext("2d"); cx.drawImage(im, 0, 0, c.width, c.height);
        const d = cx.getImageData(0, 0, c.width, c.height).data;
        let sum = 0, sum2 = 0, n = 0; const set = new Set();
        for (let i = 0; i < d.length; i += 4) { const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; sum += l; sum2 += l * l; n++; if (set.size < 400) set.add((d[i] >> 3) + "," + (d[i + 1] >> 3) + "," + (d[i + 2] >> 3)); }
        const mean = sum / n; variance = Math.round((sum2 / n - mean * mean) * 10) / 10; distinct = set.size;
      } catch (e) { variance = "err:" + String(e).slice(0, 40); }
    }
    const text = sheet.innerText || "";
    return {
      toolbarName, photos: imgs.length, photo, photoVariance: variance, photoDistinctColors: distinct,
      nodes: sheet.querySelectorAll("*").length,
      sectionsPresent: ["MUHTASARI", "UZOEFU", "ELIMU", "VYETI", "WASHIRIKI", "MAPENDELEZO", "PROFESSIONAL", "EXPERIENCE", "EDUCATION", "SKILLS"].filter((s) => text.includes(s)),
      textLen: text.length,
      sheetH: Math.round(sheet.getBoundingClientRect().height),
      scrollH: sheet.scrollHeight,
    };
  });
}

(async () => {
  const cvId = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8")).en.id;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);

  const all = jobs();
  console.log(`JOBS: ${all.length}`);
  const results = [];
  let i = 0;
  for (const v of all) {
    i++;
    const t0 = Date.now();
    const rec = { key: v.key, group: v.group, templateId: v.templateId, expectName: v.expectName };
    try {
      const body = { templateId: v.templateId, data: v.data };
      if (v.color) body.primaryColor = v.color;
      if (v.font) body.fontFamily = v.font;
      const pr = await page.evaluate(async ([id, b]) => {
        const r = await fetch(`/api/cv/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
        return r.status;
      }, [cvId, body]);
      rec.patchStatus = pr;

      await page.goto(`https://sumaiya.app/editor/cv/${cvId}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
      let ready = false;
      for (let k = 0; k < 45; k++) {
        await page.waitForTimeout(300);
        ready = await page.evaluate(() => !!document.getElementById("cv-preview") && [...document.querySelectorAll("button")].some((x) => /Pakua PDF|Download PDF/.test(x.innerText || "")));
        if (ready) break;
      }
      rec.ready = ready;
      await page.waitForTimeout(1800);
      Object.assign(rec, await previewInfo(page));
      rec.templateApplied = (rec.toolbarName || "").toLowerCase() === (v.expectName || "").toLowerCase();

      if (v.dir === "photo" || v.dir === "template-photo") {
        const h = await page.evaluateHandle(() => document.getElementById("cv-preview"));
        await h.asElement().screenshot({ path: path.join(OUT, `preview-${v.key}.png`) }).catch(() => {});
      }

      await page.evaluate(() => { window.__qa.blobs = []; });
      await page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first().click({ force: true });
      let blob = null;
      for (let k = 0; k < 45; k++) { await page.waitForTimeout(700); blob = await captureBlob(page); if (blob) break; }
      if (blob) {
        const fp = path.join(OUT, `${v.key}.pdf`);
        fs.writeFileSync(fp, Buffer.from(blob.b64, "base64"));
        rec.bytes = blob.size; rec.mime = blob.type;
      } else {
        rec.error = await page.evaluate(() => [...document.querySelectorAll("[role=alert],[role=status]")].map((e) => (e.innerText || "").trim().slice(0, 120)).join(" | "));
      }
    } catch (e) { rec.harnessError = String(e).slice(0, 200); }
    rec.ms = Date.now() - t0;
    results.push(rec);
    console.log(`[${i}/${all.length}] ${v.key} applied=${rec.templateApplied} photos=${rec.photos ?? "-"} var=${rec.photoVariance ?? "-"} bytes=${rec.bytes ?? "-"} ms=${rec.ms}${rec.error ? " ERR=" + rec.error : ""}${rec.harnessError ? " H=" + rec.harnessError : ""}`);
    if (i % 5 === 0) fs.writeFileSync(RESULT, JSON.stringify(results, null, 1));
  }
  fs.writeFileSync(RESULT, JSON.stringify(results, null, 1));
  console.log("DONE " + RESULT);
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 800)); process.exit(1); });
