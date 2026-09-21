// PART 2 core — render and CAPTURE real PDF exports from the live CV editor
// across every output option: 47 curated templates, a legacy spread, all 10
// colours, all 12 fonts, all 3 densities, Swahili, each section hidden,
// multi-page/over-long CVs, and photo on/off.
//
// Each variant is applied through the app's own PATCH /api/cv/:id (exactly what
// the editor's autosave writes), the editor is reloaded, and the PDF download
// button is clicked. The blob jsPDF hands to triggerBlobDownload is captured by
// hooking URL.createObjectURL, so these are the REAL bytes the user downloads.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUTDIR = path.join(__dirname, "exports");
const RESULT = path.join(__dirname, "results-matrix.json");
const NAMEHOST = require("./template-names.json");
fs.mkdirSync(OUTDIR, { recursive: true });

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

const SECTIONS = ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "referees", "hobbies"];
const COLORS = [["Ember", "#DA4A1C"], ["Pine", "#12433D"], ["Purple", "#7C3AED"], ["Forest", "#059669"], ["Coral", "#DC2626"],
                ["Sunset", "#D97706"], ["Ocean", "#0891B2"], ["Royal", "#2563EB"], ["Midnight", "#0F172A"], ["Slate", "#64748B"]];
const FONTS = ["Inter", "Hanken", "Helvetica", "Verdana", "Trebuchet", "Georgia", "Palatino", "Garamond", "Cambria", "Times", "JetBrains Mono", "Courier"];

function variants() {
  const v = [];
  for (const [id, name, tier] of NAMEHOST.curated) v.push({ key: `curated-${id}`, group: "curated-template", templateId: id, name, patch: {} });
  const legacyPick = ["aberdare","alpine","austin","bauhaus","carbon","cascade","chicago","cirrus","cipher","celeste","boston","baroque-cv"];
  for (const id of legacyPick) {
    const e = NAMEHOST.legacy.find((l) => l[0] === id);
    if (e) v.push({ key: `legacy-${id}`, group: "legacy-template", templateId: id, name: e[1], patch: {} });
  }
  for (const [name, hex] of COLORS) v.push({ key: `colour-${name}`, group: "colour", templateId: "nakuru", patch: { primaryColor: hex } });
  for (const f of FONTS) v.push({ key: `font-${f.replace(/\s+/g, "")}`, group: "font", templateId: "nakuru", patch: { fontFamily: f } });
  for (const d of ["compact", "normal", "airy"]) v.push({ key: `density-${d}`, group: "density", templateId: "nakuru", patch: { data: { ...EN, density: d } } });
  for (const id of ["rift", "zahabu", "nuru", "serengeti", "oxford", "sahara"]) v.push({ key: `swahili-${id}`, group: "swahili", templateId: id, data: SW, patch: { data: SW } });
  for (const s of SECTIONS) v.push({ key: `hide-${s}`, group: "section-hidden", templateId: "nakuru", patch: { data: { ...EN, hiddenSections: [s] } } });
  for (const id of ["nakuru", "zahabu", "canvas-magazine"]) v.push({ key: `long-${id}`, group: "long-cv", templateId: id, data: LONG, patch: { data: LONG } });
  v.push({ key: "minimal-nameonly", group: "edge", templateId: "nakuru",
           patch: { data: { personal: { fullName: "Amina Joseph Mwakasege", jobTitle: "", email: "", phone: "", location: "", linkedin: "", website: "" },
             summary: "", experience: [], education: [], skills: [], projects: [], languages: [], certifications: [], referees: [], hobbies: "" } } });
  v.push({ key: "photo-on", group: "photo", templateId: "nakuru", patch: { data: { ...EN, personal: { ...EN.personal, photo: PHOTO } } } });
  v.push({ key: "photo-off", group: "photo", templateId: "nakuru", patch: { data: { ...EN, personal: { ...EN.personal, photo: "" } } } });
  return v;
}

(async () => {
  const cvId = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8")).en.id;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));

  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);

  const results = [];
  const all = variants();
  console.log(`VARIANTS: ${all.length}`);
  let i = 0;
  for (const v of all) {
    i++;
    const t0 = Date.now();
    const rec = { key: v.key, group: v.group, templateId: v.templateId, name: v.name ?? null, patch: Object.keys(v.patch) };
    try {
      const pr = await page.evaluate(async ([id, body]) => {
        const r = await fetch(`/api/cv/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        return { status: r.status, text: (await r.text()).slice(0, 160) };
      }, [cvId, v.patch]);
      rec.patchStatus = pr.status;
      if (pr.status !== 200) rec.patchError = pr.text;

      await page.goto(`https://sumaiya.app/editor/cv/${cvId}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
      // wait until the export button AND the A4 preview are both present
      let ready = false;
      for (let k = 0; k < 40; k++) {
        await page.waitForTimeout(300);
        ready = await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].some((x) => /Pakua PDF|Download PDF/.test(x.innerText || ""));
          const p = [...document.querySelectorAll("div")].some((e) => { const r = e.getBoundingClientRect(); return r.width > 700 && r.width < 900 && r.height > 900; });
          return b && p;
        });
        if (ready) break;
      }
      rec.editorReady = ready;
      await page.waitForTimeout(1200);
      await page.evaluate(() => { window.__qa = { blobs: [], names: [] }; });
      const btn = page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first();
      await btn.click({ force: true });
      let blobs = [];
      for (let k = 0; k < 40; k++) {
        await page.waitForTimeout(700);
        blobs = await page.evaluate(async () => {
          const out = [];
          for (const b of window.__qa.blobs) {
            const buf = new Uint8Array(await b.arrayBuffer());
            let s = ""; for (let j = 0; j < buf.length; j++) s += String.fromCharCode(buf[j]);
            out.push({ type: b.type, size: b.size, b64: btoa(s) });
          }
          return out;
        });
        if (blobs.length) break;
      }
      rec.blobCount = blobs.length;
      rec.names = await page.evaluate(() => window.__qa.names);
      if (blobs.length) {
        const b = blobs[blobs.length - 1];
        const fp = path.join(OUTDIR, `${v.key}.pdf`);
        fs.writeFileSync(fp, Buffer.from(b.b64, "base64"));
        rec.file = path.basename(fp);
        rec.bytes = b.size;
        rec.mime = b.type;
      } else {
        rec.error = await page.evaluate(() => {
          const t = [...document.querySelectorAll("[role=alert],[role=status],[class*=toast]")].map((e) => (e.innerText || "").trim().slice(0, 150)).filter(Boolean);
          return t.join(" | ");
        });
      }
    } catch (e) {
      rec.harnessError = String(e).slice(0, 200);
    }
    rec.ms = Date.now() - t0;
    results.push(rec);
    console.log(`[${i}/${all.length}] ${v.key} bytes=${rec.bytes ?? "-"} ready=${rec.editorReady} ms=${rec.ms}${rec.error ? " ERR=" + rec.error : ""}${rec.harnessError ? " HARNESS=" + rec.harnessError : ""}`);
    if (i % 10 === 0) fs.writeFileSync(RESULT, JSON.stringify(results, null, 1));
  }
  fs.writeFileSync(RESULT, JSON.stringify(results, null, 1));
  fs.writeFileSync(path.join(__dirname, "results-matrix-console.json"), JSON.stringify(errs.slice(0, 100), null, 1));
  console.log("\nDONE. wrote " + RESULT);
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 800)); process.exit(1); });
