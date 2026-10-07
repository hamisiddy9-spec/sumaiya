// Build GENUINE .docx fixtures with the same `docx` npm package the app uses to
// produce its own Word export. Run with NODE_PATH pointing at the monorepo root
// node_modules so `require("docx")` resolves the app's own dependency.
const fs = require("fs");
const path = require("path");
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } = require("docx");

const OUT = __dirname;

const EN = {
  name: "Amina Joseph Mwakasege",
  title: "Software Engineer",
  contact: "amina.mwakasege@example.co.tz | +255 712 345 678 | Dar es Salaam, Tanzania",
  summary:
    "Software engineer with 6 years building payment and logistics platforms across East Africa. " +
    "Led a team of four that cut settlement reconciliation time from 9 hours to 40 minutes.",
  exp: [
    ["Senior Software Engineer", "Nala Payments", "Dar es Salaam, Tanzania", "Mar 2022 - Present",
      ["Rebuilt the merchant settlement ledger, cutting reconciliation time from 9h to 40min.",
       "Raised availability from 99.2% to 99.95% over 18 months."]],
    ["Software Engineer", "Selcom", "Dar es Salaam, Tanzania", "Jul 2019 - Feb 2022",
      ["Shipped USSD and mobile-money integrations for 3 partner banks.",
       "Reduced bill-payment API p95 from 2.4s to 380ms."]],
  ],
  edu: [["BSc", "Computer Science", "University of Dar es Salaam", "2014 - 2018", "Upper Second"]],
  skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "Terraform", "Kafka"],
  langs: [["Swahili", "Native"], ["English", "Fluent"]],
  certs: [["AWS Solutions Architect Associate", "Amazon Web Services", "2023"]],
  hobbies: "Long-distance running, chess, and Swahili literature.",
};

// Swahili: ng' apostrophes + long agglutinated words, deliberately included.
const SW = {
  name: "Juma Hamisi Chang'ombe",
  title: "Mhandisi wa Programu",
  contact: "juma.chang'ombe@example.co.tz | +255 715 998 877 | Ubungo, Dar es Salaam",
  summary:
    "Mhandisi wa programu mwenye uzoefu wa miaka saba katika kujenga mifumo ya malipo na usimamizi " +
    "wa taarifa kwa taasisi za kifedha Tanzania.",
  exp: [
    ["Mhandisi Mkuu wa Programu", "Benki ya NMB", "Dar es Salaam", "Januari 2021 - Hadi sasa",
      ["Nilitengeneza programu za simu za mkononi kwa ajili ya wakulima wa ng'ombe na mifugo.",
       "Nilipunguza muda wa kuhakiki malipo kutoka saa nane hadi dakika arobaini."]],
    ["Mhandisi wa Programu", "Vodacom Tanzania", "Dar es Salaam", "Machi 2018 - Desemba 2020",
      ["Niliboresha kasi ya mfumo kutoka sekunde mbili hadi milisekunde mia tatu."]],
  ],
  edu: [["Shahada ya Kwanza", "Sayansi ya Kompyuta", "Chuo Kikuu cha Dar es Salaam", "2012 - 2016", "Daraja la Pili"]],
  skills: ["Uhandisi wa Programu", "Usimamizi wa Hifadhidata", "Uchanganuzi wa Taarifa"],
  langs: [["Kiswahili", "Lugha ya Mama"], ["Kiingereza", "Vizuri"]],
  certs: [["Uthibitisho wa Usalama wa Mtandao", "Taasisi ya Teknolojia", "2022"]],
  hobbies: "Kuendesha baiskeli, kusoma vitabu vya Kiswahili na kufundisha vijana programu.",
};

const MIXED = Object.assign({}, SW, {
  name: "Grace Nyambura Mugo",
  title: "Data Analyst / Mchanganuzi wa Taarifa",
  summary:
    "Data analyst with 5 years in fintech. Ninajua Python, SQL na Power BI vizuri. " +
    "Nilijenga dashibodi zinazotumiwa na timu ya mauzo kila siku.",
  exp: [
    ["Data Analyst", "CRDB Bank", "Dar es Salaam", "2020 - Present",
      ["Built the executive dashboard used daily by the sales team.",
       "Nilipunguza muda wa kuripoti kutoka siku tatu hadi saa moja."]],
  ],
  hobbies: "Blogging about data careers, na kupanda milima.",
});

function build(cv, opts = {}) {
  const children = [];
  children.push(new Paragraph({ alignment: "center", children: [new TextRun({ text: cv.name, bold: true, size: 44 })] }));
  children.push(new Paragraph({ alignment: "center", children: [new TextRun({ text: cv.title, size: 24, color: "555555" })] }));
  children.push(new Paragraph({ alignment: "center", children: [new TextRun({ text: cv.contact, size: 20 })] }));
  if (opts.imagePath) {
    children.push(new Paragraph({
      alignment: "center",
      children: [new ImageRun({ data: fs.readFileSync(opts.imagePath), transformation: { width: 120, height: 120 } })],
    }));
  }
  const H = (t) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    border: { bottom: { color: "1F3A34", size: 6, style: "single", space: 2 } },
    children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 24, color: "1F3A34" })],
  });

  children.push(H("Professional Summary"));
  children.push(new Paragraph({ children: [new TextRun({ text: cv.summary, size: 21 })] }));

  children.push(H("Experience"));
  for (const [pos, org, loc, period, bullets] of cv.exp) {
    children.push(new Paragraph({ children: [new TextRun({ text: `${pos} — ${org}`, bold: true, size: 22 })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${loc}  •  ${period}`, italics: true, size: 19, color: "666666" })] }));
    for (const b of bullets) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: 21 })] }));
  }

  children.push(H("Education"));
  for (const [deg, fld, inst, period, grade] of cv.edu) {
    children.push(new Paragraph({ children: [new TextRun({ text: `${deg}, ${fld}`, bold: true, size: 21 })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: `${inst}  •  ${period}  •  ${grade}`, size: 19, color: "666666" })] }));
  }

  children.push(H("Skills"));
  children.push(new Paragraph({ children: [new TextRun({ text: cv.skills.join("  •  "), size: 21 })] }));

  children.push(H("Languages"));
  children.push(new Paragraph({ children: [new TextRun({ text: cv.langs.map(([n, p]) => `${n} (${p})`).join("  •  "), size: 21 })] }));

  children.push(H("Certifications"));
  for (const c of cv.certs) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: c.join("  •  "), size: 21 })] }));

  children.push(H("Interests"));
  children.push(new Paragraph({ children: [new TextRun({ text: cv.hobbies, size: 21 })] }));

  // A real .docx core: real OOXML sections, real numbering, real image part.
  return new Document({
    creator: "QA fixture builder",
    title: cv.name,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
  });
}

function buildLong(cv, repeats) {
  const children = [];
  children.push(new Paragraph({ children: [new TextRun({ text: cv.name, bold: true, size: 44 })] }));
  for (let r = 0; r < repeats; r++) {
    children.push(new Paragraph({ children: [new TextRun({ text: "EXPERIENCE ".repeat(20) + ` (block ${r + 1})`, bold: true, size: 24 })] }));
    for (let i = 0; i < 18; i++) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: `Delivered initiative ${r + 1}.${i + 1} with measurable impact on settlement throughput.`, size: 21 })] }));
    }
  }
  return new Document({
    creator: "QA fixture builder",
    title: `${cv.name} (long)`,
    sections: [{ children }],
  });
}

(async () => {
  const jobs = [
    ["cv.docx", build(EN)],
    ["cv-sw.docx", build(SW)],
    ["cv-mixed.docx", build(MIXED)],
    ["cv-long.docx", buildLong(EN, 12)],
    ["cv-photo.docx", build(EN, { imagePath: path.join(OUT, "cv-photo.jpg") })],
  ];
  for (const [name, doc] of jobs) {
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(`${name.padEnd(20)} ${buf.length.toLocaleString()} bytes`);
  }

  // MIME-lie fixtures: a real .docx (PK zip) with a .pdf name, and a real PDF
  // with a .docx name. Valid extension, wrong content type.
  fs.writeFileSync(path.join(OUT, "cv-docx-content-mismatch.pdf"), fs.readFileSync(path.join(OUT, "cv.docx")));
  fs.writeFileSync(path.join(OUT, "cv-pdf-content-mismatch.docx"), fs.readFileSync(path.join(OUT, "cv-text.pdf")));
  // Real PNG bytes named .pdf
  fs.writeFileSync(path.join(OUT, "cv-png-content-mismatch.pdf"), fs.readFileSync(path.join(OUT, "cv-photo-sw.png")));
  // Real docx bytes with NO extension
  fs.writeFileSync(path.join(OUT, "cv-noextension"), fs.readFileSync(path.join(OUT, "cv.docx")));
  console.log("mismatch fixtures written");
})().catch((e) => { console.error(e); process.exit(1); });
