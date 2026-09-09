import { describe, it, expect } from "vitest";
import { toCvData } from "@/lib/cv/from-parsed";

describe("toCvData — defensive adapter for unreliable AI parser output", () => {
  it("maps a normal wire shape to full CVData", () => {
    const cv = toCvData({
      personal: { fullName: "Juma", jobTitle: "Dev", email: "j@x.com" },
      summary: "Engineer",
      experience: [{ company: "A", position: "Dev", description: "Built things" }],
      education: [{ institution: "UDSM", degree: "BSc", field: "CS" }],
      skills: ["React", "PostgreSQL"],
      projects: [{ name: "Shop", description: "Built a shop" }],
      languages: [{ name: "Swahili", proficiency: "Native" }],
      certifications: [{ name: "AWS" }],
      hobbies: "football",
    });
    expect(cv.personal.fullName).toBe("Juma");
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].company).toBe("A");
    expect(cv.skills.map((s) => s.name)).toEqual(["React", "PostgreSQL"]);
    expect(cv.languages[0].proficiency).toBe("Native");
    expect(cv.hobbies).toBe("football");
  });

  it("does NOT crash when a section comes back as a string", () => {
    const cv = toCvData({ experience: "5 years at X", summary: 42 });
    expect(cv.experience).toEqual([]);
    expect(cv.summary).toBe("");
  });

  it("does NOT crash when personal is a string or array", () => {
    expect(toCvData({ personal: "Juma" }).personal.fullName).toBe("");
    expect(toCvData({ personal: ["Juma"] }).personal.fullName).toBe("");
  });

  it("does NOT crash on null / non-object input", () => {
    expect(toCvData(null).summary).toBe("");
    expect(toCvData("garbage").summary).toBe("");
    expect(toCvData(123).summary).toBe("");
    expect(toCvData(undefined).summary).toBe("");
  });

  it("does NOT crash when section entries are not objects", () => {
    const cv = toCvData({ skills: ["React", 7, null], projects: "nope", certifications: [123] });
    expect(cv.skills.map((s) => s.name)).toEqual(["React", "7"]);
    expect(cv.projects).toEqual([]);
    expect(cv.certifications).toEqual([]);
  });
});
