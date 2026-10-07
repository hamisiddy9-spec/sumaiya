// CONTROLLED A/B for the two findings that need a clean baseline:
//   1. section hiding — same template, SAME colour and font, only hiddenSections differs
//   2. the skills `level` bug — same CV, with and without `level` on each skill
// Plus a positive control: with `level` present, the Skills section must appear in
// both the rendered page and the PDF text layer.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUT = path.join(__dirname, "controlled");
const CV = JSON.parse(fs.readFileSync(path.join(__dirname, "created-cvs.json"), "utf8"));
const EN = JSON.parse(fs.readFileSync(path.join(__dirname, "cv-en.json"), "utf8"));
fs.mkdirSync(OUT, { recursive: true });

const WITH_LEVEL = { ...EN, skills: EN.skills.map((s) => ({ ...s, level: 3 })) };
const SECTIONS = ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "referees", "hobbies"];

const HOOK = `
window.__qa = { blobs: [], names: [] };
if (!window.__qaHooked) {
  window.__qaHooked = true;
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (b) { try { window.__qa.blobs.push(b); } catch (e) {} return orig(b); };
  const c = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__qa.names.push(this.download); return; } return c.apply(this, arguments); };
}
`;

const JOBS = [
  { key: "base-with-level", data: WITH_LEVEL, why: "baseline: skills carry level:3" },
  { key: "base-no-level", data: EN, why: "the failing shape: skills have no level" },
  ...SECTIONS.map((s) => ({ key: `hide-${s}`, data: { ...WITH_LEVEL, hiddenSections: [s] }, why: `hiddenSections=["${s}"]` })),
];

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1300 }, acceptDownloads: true });
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);

  const out = [];
  for (const j of JOBS) {
    const rec = { key: j.key, why: j.why };
    try {
      // SAME template, SAME colour, SAME font for every job — only `data` differs.
      await page.evaluate(async ([cid, d]) => {
        await fetch(`/api/cv/${cid}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: "nakuru", primaryColor: "#DA4A1C", fontFamily: "Inter", data: d }),
        });
      }, [CV.en.id, j.data]);
      await page.goto(`https://sumaiya.app/editor/cv/${CV.en.id}?lang=en`, { waitUntil: "domcontentloaded", timeout: 60000 });
      for (let k = 0; k < 50; k++) {
        await page.waitForTimeout(250);
        if (await page.evaluate(() => !!document.getElementById("cv-preview"))) break;
      }
      await page.waitForTimeout(1800);
      const onScreen = await page.evaluate(() => {
        const t = document.getElementById("cv-preview").innerText;
        return {
          hasSkillsHeading: /UJUZI|SKILLS/.test(t),
          skillNames: ["TypeScript", "Node.js", "PostgreSQL", "Terraform", "Kafka", "React", "Go"].filter((s) => t.includes(s)),
          textLen: t.length,
        };
      });
      rec.onScreen = onScreen;
      await page.evaluate(() => { window.__qa.blobs = []; });
      await page.getByRole("button", { name: /Pakua PDF|Download PDF/i }).first().click({ force: true });
      let blob = null;
      for (let k = 0; k < 45; k++) {
        await page.waitForTimeout(600);
        blob = await page.evaluate(async () => {
          if (!window.__qa.blobs.length) return null;
          const b = window.__qa.blobs[window.__qa.blobs.length - 1];
          const buf = new Uint8Array(await b.arrayBuffer());
          let s = ""; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
          return { size: b.size, b64: btoa(s) };
        });
        if (blob) break;
      }
      if (blob) {
        fs.writeFileSync(path.join(OUT, `${j.key}.pdf`), Buffer.from(blob.b64, "base64"));
        rec.bytes = blob.size;
      }
    } catch (e) { rec.harnessError = String(e).slice(0, 200); }
    out.push(rec);
    console.log(JSON.stringify(rec));
  }
  fs.writeFileSync(path.join(__dirname, "results-controlled.json"), JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 500)); process.exit(1); });
