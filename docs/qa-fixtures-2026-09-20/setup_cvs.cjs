// Create test CV documents through the LIVE API as the signed-in test user,
// then recon the real editor DOM (export controls, template/colour/font pickers).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STATE = path.join(__dirname, "testuser-state.json");
const OUTDIR = path.join(__dirname, "exports");
fs.mkdirSync(OUTDIR, { recursive: true });

const EN = {
  personal: {
    fullName: "Amina Joseph Mwakasege",
    jobTitle: "Software Engineer",
    email: "amina.mwakasege@example.co.tz",
    phone: "+255 712 345 678",
    location: "Dar es Salaam, Tanzania",
    linkedin: "linkedin.com/in/aminamwakasege",
    website: "",
  },
  summary:
    "Software engineer with 6 years building payment and logistics platforms across East Africa. " +
    "Led a team of four that cut settlement reconciliation time from 9 hours to 40 minutes.",
  experience: [
    { id: "e1", position: "Senior Software Engineer", company: "Nala Payments", location: "Dar es Salaam",
      startDate: "Mar 2022", endDate: "", current: true,
      description: "- Rebuilt the merchant settlement ledger, cutting reconciliation time from 9h to 40min.\n- Raised availability from 99.2% to 99.95% over 18 months." },
    { id: "e2", position: "Software Engineer", company: "Selcom", location: "Dar es Salaam",
      startDate: "Jul 2019", endDate: "Feb 2022", current: false,
      description: "- Shipped USSD and mobile-money integrations for 3 partner banks." },
  ],
  education: [{ id: "d1", degree: "BSc", field: "Computer Science", institution: "University of Dar es Salaam",
    startDate: "2014", endDate: "2018", grade: "Upper Second" }],
  skills: [{ id: "s1", name: "TypeScript" }, { id: "s2", name: "Node.js" }, { id: "s3", name: "PostgreSQL" },
    { id: "s4", name: "AWS" }, { id: "s5", name: "Docker" }, { id: "s6", name: "Kafka" }],
  projects: [{ id: "p1", name: "Boda Route Optimiser", role: "Lead Developer", date: "2021",
    description: "Open-source route planner for motorcycle couriers.", url: "" }],
  languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }, { id: "l2", name: "English", proficiency: "Fluent" }],
  certifications: [{ id: "c1", name: "AWS Solutions Architect Associate", issuer: "Amazon Web Services", date: "2023" }],
  referees: [{ id: "r1", name: "Dr. Neema Kimaro", title: "Head of Engineering", company: "Nala Payments",
    email: "neema.kimaro@example.co.tz", phone: "+255 754 111 222" }],
  hobbies: "Long-distance running, chess, and Swahili literature.",
};

const SW = {
  personal: {
    fullName: "Juma Hamisi Chang'ombe",
    jobTitle: "Mhandisi wa Programu",
    email: "juma.chang'ombe@example.co.tz",
    phone: "+255 715 998 877",
    location: "Ubungo, Dar es Salaam",
    linkedin: "", website: "",
  },
  summary: "Mhandisi wa programu mwenye uzoefu wa miaka saba katika kujenga mifumo ya malipo na usimamizi wa taarifa kwa taasisi za kifedha Tanzania.",
  experience: [
    { id: "e1", position: "Mhandisi Mkuu wa Programu", company: "Benki ya NMB", location: "Dar es Salaam",
      startDate: "Januari 2021", endDate: "", current: true,
      description: "- Nilitengeneza programu za simu za mkononi kwa ajili ya wakulima wa ng'ombe na mifugo.\n- Nilipunguza muda wa kuhakiki malipo kutoka saa nane hadi dakika arobaini." },
  ],
  education: [{ id: "d1", degree: "Shahada ya Kwanza", field: "Sayansi ya Kompyuta",
    institution: "Chuo Kikuu cha Dar es Salaam", startDate: "2012", endDate: "2016", grade: "Daraja la Pili" }],
  skills: [{ id: "s1", name: "Uhandisi wa Programu" }, { id: "s2", name: "Usimamizi wa Hifadhidata" },
    { id: "s3", name: "Uchanganuzi wa Taarifa" }],
  projects: [{ id: "p1", name: "Mfumo wa Ng'ombe", role: "Mtengenezaji", date: "2019",
    description: "Mfumo wa kufuatilia mifugo na mazao kwa wakulima wadogo.", url: "" }],
  languages: [{ id: "l1", name: "Kiswahili", proficiency: "Lugha ya Mama" }, { id: "l2", name: "Kiingereza", proficiency: "Vizuri" }],
  certifications: [{ id: "c1", name: "Uthibitisho wa Usalama wa Mtandao", issuer: "Taasisi ya Teknolojia", date: "2022" }],
  referees: [{ id: "r1", name: "Dkt. Mwajuma Salum", title: "Mkuu wa Idara", company: "NMB",
    email: "mwajuma.salum@example.co.tz", phone: "+255 713 555 666" }],
  hobbies: "Kuendesha baiskeli, kusoma vitabu vya Kiswahili na kufundisha vijana programu.",
};

function longCv() {
  const cv = JSON.parse(JSON.stringify(EN));
  cv.personal.fullName = "Amina Joseph Mwakasege (Long CV)";
  cv.experience = [];
  for (let i = 0; i < 9; i++) {
    cv.experience.push({
      id: `e${i}`, position: `Role ${i + 1} — Programme Delivery Lead`, company: `Employer ${i + 1} Ltd`,
      location: "Dar es Salaam", startDate: `Jan ${2010 + i}`, endDate: `Dec ${2011 + i}`, current: false,
      description: Array.from({ length: 5 }, (_, b) =>
        `- Delivered initiative ${i + 1}.${b + 1} which measurably improved settlement throughput and reduced manual reconciliation effort across the region.`).join("\n"),
    });
  }
  for (let i = 0; i < 12; i++) cv.skills.push({ id: `sx${i}`, name: `Skill Number ${i + 1}` });
  return cv;
}

async function createCv(page, body) {
  return page.evaluate(async (b) => {
    const r = await fetch("/api/cv", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
    });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, id: j?.data?.id ?? null, raw: JSON.stringify(j).slice(0, 300) };
  }, body);
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ storageState: STATE, viewport: { width: 1500, height: 1200 }, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto("https://sumaiya.app/dashboard?lang=en", { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(4000);

  const ids = {};
  ids.en = await createCv(page, { title: "QA English CV", templateId: "nakuru", data: EN });
  ids.sw = await createCv(page, { title: "QA Swahili CV", templateId: "nakuru", data: SW });
  ids.long = await createCv(page, { title: "QA Long CV", templateId: "nakuru", data: longCv() });
  console.log("CREATED:", JSON.stringify(ids));

  // recon the editor
  const cvId = ids.en.id;
  if (!cvId) { console.log("no id — aborting recon"); await browser.close(); return; }
  await page.goto(`https://sumaiya.app/editor/cv/${cvId}?lang=en`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(9000);
  console.log("editor url:", page.url());

  const dom = await page.evaluate(() => {
    const label = (e) => (e.innerText || e.getAttribute("aria-label") || e.title || e.getAttribute("data-testid") || "").trim().replace(/\s+/g, " ").slice(0, 60);
    return {
      buttons: [...document.querySelectorAll("button")].map((b) => label(b)).filter(Boolean),
      testids: [...document.querySelectorAll("[data-testid]")].map((e) => `${e.getAttribute("data-testid")} :: ${e.tagName}`),
      bigEls: [...document.querySelectorAll("div")]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 620 && r.width < 900 && r.height > 800; })
        .map((e) => ({ cls: String(e.className).slice(0, 120), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), hasImg: !!e.querySelector("img") }))
        .slice(0, 8),
    };
  });
  console.log("BUTTONS:", JSON.stringify(dom.buttons));
  console.log("TESTIDS:", JSON.stringify(dom.testids.slice(0, 40)));
  console.log("BIG:", JSON.stringify(dom.bigEls, null, 1));
  await page.screenshot({ path: path.join(OUTDIR, "editor-full.png"), fullPage: false });
  fs.writeFileSync(path.join(__dirname, "created-cvs.json"), JSON.stringify(ids, null, 1));
  await browser.close();
})().catch((e) => { console.error("FATAL", String(e).slice(0, 600)); process.exit(1); });
