import { describe, it, expect } from "vitest";
import { diffCv, changedSectionCount, cvUnchanged } from "@/lib/document-diff";
import type { CVData } from "@/types";

const base: CVData = {
  personal: { fullName: "Juma Mwinyi", jobTitle: "Marketing Manager", email: "j@x.com", phone: "+2557", location: "Dar" },
  summary: "Marketing manager with 8 years of experience.",
  experience: [
    {
      id: "e1", company: "Tigo", position: "Marketing Manager", startDate: "2020", endDate: "",
      current: true, description: "Led a team of 6 marketers.",
    },
  ],
  education: [{ id: "edu1", institution: "UDSM", degree: "Bachelor", field: "Marketing", startDate: "2012", endDate: "2016" }],
  skills: [
    { id: "s1", name: "Marketing", level: 5 },
    { id: "s2", name: "SEO", level: 4 },
  ],
  projects: [], languages: [], certifications: [], referees: [], hobbies: "",
};

describe("diffCv", () => {
  it("identical CVs produce no changed sections", () => {
    const diff = diffCv(base, { ...base });
    expect(changedSectionCount(diff)).toBe(0);
    expect(cvUnchanged(diff)).toBe(true);
  });

  it("summary edit marks only the summary section changed", () => {
    const after: CVData = { ...base, summary: "Marketing manager with 10 years of experience." };
    const diff = diffCv(base, after);
    expect(diff.find((d) => d.sectionId === "summary")?.changed).toBe(true);
    expect(changedSectionCount(diff)).toBe(1);
  });

  it("experience description edit marks experience changed with before/after lines", () => {
    const after: CVData = {
      ...base,
      experience: [
        {
          ...base.experience[0],
          description: "Led a team of 6 marketers and increased engagement by 25%.",
        },
      ],
    };
    const diff = diffCv(base, after);
    const exp = diff.find((d) => d.sectionId === "experience")!;
    expect(exp.changed).toBe(true);
    expect(exp.before.join(" ")).toContain("Led a team of 6 marketers");
    expect(exp.after.join(" ")).toContain("increased engagement by 25%");
  });

  it("skill addition marks skills changed", () => {
    const after: CVData = { ...base, skills: [...base.skills, { id: "s3", name: "Python", level: 3 }] };
    const diff = diffCv(base, after);
    expect(diff.find((d) => d.sectionId === "skills")?.changed).toBe(true);
  });

  it("whitespace-only changes are not real changes", () => {
    const after: CVData = { ...base, summary: "  Marketing manager with 8 years of experience.  " };
    const diff = diffCv(base, after);
    expect(diff.find((d) => d.sectionId === "summary")?.changed).toBe(false);
  });

  it("reordering experience counts as a change (user should see it)", () => {
    const after: CVData = {
      ...base,
      experience: [
        {
          id: "e2", company: "Vodacom", position: "Brand Officer", startDate: "2016", endDate: "2019",
          current: false, description: "Coordinated brand activations.",
        },
        ...base.experience,
      ],
    };
    const diff = diffCv(base, after);
    expect(diff.find((d) => d.sectionId === "experience")?.changed).toBe(true);
  });
});
