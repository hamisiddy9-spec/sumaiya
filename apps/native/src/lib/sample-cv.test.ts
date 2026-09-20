import { sampleCv } from "./sample-cv";
import { cvToHtml } from "./cv-html";

describe("sampleCv — one sample, two languages", () => {
  it("keeps structure identical across languages (ids, counts, dates, levels)", () => {
    const en = sampleCv("en");
    const sw = sampleCv("sw");

    expect(sw.data.experience.map((e) => e.id)).toEqual(en.data.experience.map((e) => e.id));
    expect(sw.data.education.map((e) => e.id)).toEqual(en.data.education.map((e) => e.id));
    expect(sw.data.skills.map((s) => s.id)).toEqual(en.data.skills.map((s) => s.id));
    expect(sw.data.languages.map((l) => l.id)).toEqual(en.data.languages.map((l) => l.id));

    expect(sw.data.experience.length).toBe(en.data.experience.length);
    expect(sw.data.education.length).toBe(en.data.education.length);
    expect(sw.data.skills.length).toBe(en.data.skills.length);
    expect(sw.data.languages.length).toBe(en.data.languages.length);

    expect(sw.data.experience.map((e) => e.startDate)).toEqual(en.data.experience.map((e) => e.startDate));
    expect(sw.data.education.map((e) => e.graduationDate)).toEqual(en.data.education.map((e) => e.graduationDate));
    expect(sw.data.skills.map((s) => s.level)).toEqual(en.data.skills.map((s) => s.level));
  });

  it("is really Swahili in the Swahili sample", () => {
    const sw = sampleCv("sw");
    expect(sw.data.personalInfo.headline).toContain("Mfanyakazi wa Ghala");
    expect(sw.data.summary).toMatch(/Nilisimamia|kusimamia/);
  });

  it("never renders the same words in both languages (excluding shared identity fields)", () => {
    const en = sampleCv("en");
    const sw = sampleCv("sw");

    expect(sw.data.personalInfo.headline).not.toBe(en.data.personalInfo.headline);
    expect(sw.data.summary).not.toBe(en.data.summary);
    sw.data.experience.forEach((e, i) => {
      expect(e.title).not.toBe(en.data.experience[i].title);
      expect(e.description).not.toBe(en.data.experience[i].description);
    });
    // Per-item, not per-array: "Excel" is a product name and is deliberately
    // identical in both languages, but the skills list as a whole must differ.
    expect(sw.data.skills.map((s) => s.name)).not.toEqual(en.data.skills.map((s) => s.name));
    expect(sw.data.education[0].degree).not.toBe(en.data.education[0].degree);
    expect(sw.data.education[0].field).not.toBe(en.data.education[0].field);

    // Identity fields are shared on purpose.
    expect(sw.data.personalInfo.fullName).toBe(en.data.personalInfo.fullName);
    expect(sw.data.personalInfo.email).toBe(en.data.personalInfo.email);
    expect(sw.data.personalInfo.phone).toBe(en.data.personalInfo.phone);
    expect(sw.data.personalInfo.location).toBe(en.data.personalInfo.location);
    expect(sw.data.experience[0].company).toBe(en.data.experience[0].company);
    expect(sw.data.education[0].institution).toBe(en.data.education[0].institution);
  });

  it("keeps proficiency values as an untranslated enum", () => {
    expect(sampleCv("sw").data.languages[0].proficiency).toBe("native");
  });

  it("renders Swahili section headings through the actual HTML path", () => {
    const sw = cvToHtml(sampleCv("sw"), { template: "classic", lang: "sw", fitWidth: 138 });
    expect(sw).toContain("Uzoefu");
    expect(sw).toContain("Muhtasari");
    expect(sw).not.toContain(">Experience<");

    const en = cvToHtml(sampleCv("en"), { template: "classic", lang: "en", fitWidth: 138 });
    expect(en).toContain("Experience");
    expect(en).not.toContain("Uzoefu");
  });
});
