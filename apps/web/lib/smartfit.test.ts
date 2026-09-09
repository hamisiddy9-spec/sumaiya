import { describe, it, expect } from "vitest";
import { createEmptyCVData, type CVData } from "@/types";
import { analyzeFit, applyDirective, cvWordCount } from "@/lib/smartfit";

function cv(partial: Partial<CVData>): CVData {
  return { ...createEmptyCVData(), ...partial };
}

const richCv = cv({
  summary: "Software engineer with five years building web platforms for startups and enterprises using React, Node, TypeScript and PostgreSQL. Led small teams, shipped payments systems, and cut infrastructure costs.",
  experience: [
    { id: "e1", company: "TechCo", position: "Senior Engineer", startDate: "", endDate: "", current: true, description: "Built React dashboards used by 2000 customers. Cut page load time by 40 percent. Led the payments rewrite that reduced error rate from two percent to 0.3 percent. Mentored two junior developers and introduced code review standards across the team." },
    { id: "e2", company: "StartupX", position: "Fullstack Developer", startDate: "", endDate: "", current: false, description: "Shipped the mobile API used by the company's flagship app. Automated deployments with CI/CD pipelines. Trained new hires and documented the architecture. Worked closely with the design team to ship a redesigned onboarding flow." },
    { id: "e3", company: "Freelance", position: "Web Developer", startDate: "", endDate: "", current: false, description: "Delivered twelve client websites for local businesses. Built a booking system for a clinic that handles over one hundred appointments per week. Maintained client relationships and met every deadline for three years." },
    { id: "e4", company: "BankCo", position: "Systems Analyst", startDate: "", endDate: "", current: false, description: "Supported the core banking system serving forty branches. Wrote SQL reports used by management monthly. Automated the daily backup process saving two hours of manual work every night." },
    { id: "e5", company: "NGO", position: "IT Volunteer", startDate: "", endDate: "", current: false, description: "Set up the office network and trained twenty staff members on digital tools. Built a simple donor database in Excel that tracked contributions across five regions." },
  ],
  education: [{ id: "ed1", institution: "University of Dar es Salaam", degree: "BSc", field: "Computer Science", startDate: "", endDate: "" }],
  projects: [
    { id: "p1", name: "Pharmacy stock system", description: "Built a stock tracking app for a local pharmacy chain; cut stock-outs by thirty percent." },
    { id: "p2", name: "School fees tracker", description: "A simple web app that helps a school track fee payments and send reminders to parents." },
  ],
  certifications: [
    { id: "c1", name: "AWS Cloud Practitioner", issuer: "Amazon", date: "" },
    { id: "c2", name: "Scrum Master", issuer: "Scrum Alliance", date: "" },
  ],
  languages: [{ id: "l1", name: "Swahili", proficiency: "Native" }, { id: "l2", name: "English", proficiency: "Fluent" }],
  skills: [{ id: "s1", name: "React", level: 4 }, { id: "s2", name: "TypeScript", level: 3 }, { id: "s3", name: "Node.js", level: 4 }, { id: "s4", name: "PostgreSQL", level: 3 }, { id: "s5", name: "Docker", level: 3 }, { id: "s6", name: "AWS", level: 2 }, { id: "s7", name: "Excel", level: 4 }],
});

describe("SmartFit — content analysis", () => {
  it("counts words across sections", () => {
    expect(cvWordCount(richCv)).toBeGreaterThan(30);
    expect(cvWordCount(createEmptyCVData())).toBe(0);
  });

  it("suggests compact density for long content and airy for short", () => {
    const long = analyzeFit(richCv);
    expect(long.length).toBe("long");
    expect(long.suggestedDensity).toBe("compact");
    const short = analyzeFit(cv({ summary: "Hi" }));
    expect(short.length).toBe("short");
    expect(short.suggestedDensity).toBe("airy");
    expect(short.reason.en.length).toBeGreaterThan(10);
    expect(short.reason.sw.length).toBeGreaterThan(10);
  });
});

describe("SmartFit — directive mapping", () => {
  it("maps executive style to the executive template", () => {
    const c = applyDirective("Make it executive", { data: richCv });
    expect(c?.templateId).toBe("executive-one");
    expect(c?.density).toBe("compact");
  });

  it("maps fit complaints to density + core sections", () => {
    const c = applyDirective("It doesn't fit on one page", { data: richCv });
    expect(c?.density).toBe("compact");
    expect(c?.sectionOrder).toContain("summary");
    expect(c?.sectionOrder).not.toContain("hobbies");
    expect(c?.sectionOrder).not.toContain("references");
  });

  it("maps modern/creative/minimal/classic to template families", () => {
    expect(applyDirective("Make it modern", { data: richCv })?.templateId).toBe("silicon-pro");
    expect(applyDirective("More creative", { data: richCv })?.templateId).toBe("aurora-edge");
    expect(applyDirective("Keep it minimal", { data: richCv })?.templateId).toBe("nordic-minimal");
    expect(applyDirective("Classic look", { data: richCv })?.templateId).toBe("victoria");
  });

  it("returns null when the directive is a style it cannot reason about", () => {
    expect(applyDirective("Add more color to my life", { data: richCv })).toBeNull();
  });

  it("always gives a bilingual rationale", () => {
    for (const d of ["Make it executive", "It doesn't fit", "Too empty"]) {
      const c = applyDirective(d, { data: richCv });
      if (c) {
        expect(c.rationale.en.length).toBeGreaterThan(10);
        expect(c.rationale.sw.length).toBeGreaterThan(10);
      }
    }
  });
});
