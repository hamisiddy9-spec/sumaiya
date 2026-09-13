/**
 * Renders the engine's five layout families with SYNTHETIC data, so the design
 * can be reviewed without attaching a real customer's CV (photo, phone, email)
 * to a chat. Temporary tooling — delete when done.
 *
 *   cd /home/oem/sumaiya && npx tsx scripts/render-samples.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { cvToHtml } from "../apps/native/src/lib/cv-html";
import { TEMPLATE_REGISTRY } from "../apps/native/src/lib/templates/registry";
import type { CV } from "@sumaiya/types";

const OUT = "/tmp/tplsamples";
mkdirSync(OUT, { recursive: true });

const sample = (templateId: string): CV =>
  ({
    id: "sample",
    userId: "sample",
    templateId,
    title: "Sample",
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      personalInfo: {
        fullName: "Neema Joseph Mwakyusa",
        email: "neema.mwakyusa@example.co.tz",
        phone: "+255 712 000 111",
        location: "Mikocheni, Dar es Salaam",
        headline: "Operations Manager",
      },
      summary:
        "Operations manager with nine years in logistics across East Africa. I cut dispatch time by a third at a 40-person depot and now run three of them.",
      experience: [
        {
          id: "e1",
          company: "Pwani Logistics",
          title: "Operations Manager",
          startDate: "2019-03",
          endDate: "Present",
          description:
            "Ran a 40-person warehouse team.\nRebuilt the dispatch rota, cutting turnaround from 9h to 6h.\nIntroduced weekly stock counts.",
          keyAchievements: [],
          location: "Dar es Salaam",
        },
        {
          id: "e2",
          company: "Mwanza Freight",
          title: "Depot Supervisor",
          startDate: "2015-06",
          endDate: "2019-02",
          description: "Covered three depots and a fleet of 22 trucks.",
          keyAchievements: [],
          location: "Mwanza",
        },
      ],
      education: [
        {
          id: "d1",
          institution: "University of Dar es Salaam",
          degree: "BCom",
          field: "Logistics & Transport",
          graduationDate: "2015-11",
          gpa: 3.7,
        },
      ],
      skills: [
        { id: "s1", name: "Fleet planning", level: "expert" },
        { id: "s2", name: "Inventory control", level: "advanced" },
        { id: "s3", name: "Excel & Power BI", level: 4 },
        { id: "s4", name: "Team leadership", level: 5 },
        { id: "s5", name: "Customs clearance", level: 3 },
      ],
      certifications: [
        { id: "c1", name: "CIPS Level 4", issuer: "CIPS", issueDate: "2021-06" },
        { id: "c2", name: "First Aid at Work", issuer: "Red Cross Tanzania", issueDate: "2023-01" },
      ],
      languages: [
        { id: "l1", language: "Swahili", proficiency: "native" },
        { id: "l2", language: "English", proficiency: "fluent" },
        { id: "l3", language: "French", proficiency: "basic" },
      ],
      projects: [
        {
          id: "p1",
          name: "Depot merger",
          role: "Project lead",
          date: "2022-04",
          description:
            "Merged two Dar depots into one.\nKept 100% of staff through the move.\nSaved TZS 40m a year.",
        },
      ],
      referees: [
        {
          id: "r1",
          name: "Joseph Mkapa",
          title: "Regional Director",
          company: "Pwani Logistics",
          email: "j.mkapa@example.co.tz",
          phone: "+255 754 000 222",
        },
      ],
      hobbies: "Long-distance running, chess, film photography",
    },
  }) as unknown as CV;

async function main() {
  const want = ["SidebarLayout", "HeaderLayout", "MinimalLayout", "TwoColumnLayout", "AccentBandLayout"];
  const picks = want
    .map((layout) => Object.values(TEMPLATE_REGISTRY).find((tpl) => tpl.layout === layout))
    .filter(Boolean);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });

  for (const tpl of picks) {
    const html = cvToHtml(sample(tpl.id), { template: tpl.id, accent: "#DA4A1C" });
    writeFileSync(`${OUT}/${tpl.id}.html`, html);
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: `${OUT}/${tpl.id}.png`, fullPage: true });
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
    console.log(
      `${tpl.id.padEnd(12)} ${tpl.layout.padEnd(16)} html=${String(html.length).padStart(7)}B  hasProjects=${text.includes("Depot merger")}  hasReferees=${text.includes("Joseph Mkapa")}  hasHobbies=${text.includes("chess")}`,
    );
  }

  await browser.close();
  console.log(`\nWrote ${picks.length} screenshots to ${OUT}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
