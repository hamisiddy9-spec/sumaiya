import { cvProgress } from "./progress";

/**
 * What the section chips may say.
 *
 * The one thing these tests exist to prevent: a completeness number that is not
 * a fact about the CV. Every count below is derived from the fields the editor
 * renders, so `4/4 Kamili` can only appear when four real fields carry text.
 */
const base = {
  personalInfo: { fullName: "", headline: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
} as never;

describe("cvProgress — section completeness is measured, never assumed", () => {
  it("counts the five fields the personal section renders", () => {
    const p = cvProgress({
      ...base,
      personalInfo: {
        fullName: "Asha Mwinyi",
        headline: "Afisa Mauzo",
        email: "asha@example.com",
        phone: "",
        location: "Dar es Salaam",
      },
    } as never);
    expect(p.personal).toEqual({ filled: 4, total: 5 });
  });

  it("treats whitespace as empty", () => {
    const p = cvProgress({
      ...base,
      personalInfo: { fullName: "   ", headline: "\t", email: "", phone: "", location: "  " },
    } as never);
    expect(p.personal).toEqual({ filled: 0, total: 5 });
  });

  it("measures the summary as one field", () => {
    expect(cvProgress({ ...base, summary: "Mhandisi wa programu." } as never).summary).toEqual({
      filled: 1,
      total: 1,
    });
    expect(cvProgress(base).summary).toEqual({ filled: 0, total: 1 });
  });

  it("measures experience against the roles the user has entered", () => {
    const p = cvProgress({
      ...base,
      experience: [
        { id: "1", title: "Afisa Mauzo", company: "Vodacom", startDate: "2022-01", description: "Mauzo." },
        { id: "2", title: "Mhandisi", company: "NMB", startDate: "2020-01", description: "" },
        { id: "3", title: "", company: "", startDate: "", description: "" },
      ],
    } as never);
    // One of the three roles the user entered is complete. The total is what
    // THEY entered, never a number of roles the app thinks they should have:
    // "1/3" here is a fact about their CV, not advice to add more.
    expect(p.experience).toEqual({ filled: 1, total: 3 });
  });

  it("measures education against institution, degree and graduation", () => {
    const p = cvProgress({
      ...base,
      education: [
        { id: "1", institution: "UDSM", degree: "BSc", field: "CS", graduationDate: "2021-06" },
        { id: "2", institution: "VETA", degree: "", field: "", graduationDate: "" },
      ],
    } as never);
    expect(p.education).toEqual({ filled: 1, total: 2 });
  });

  it("reports an empty CV as nothing to measure, not as 0 percent", () => {
    const p = cvProgress(base);
    // `total: 0` is what tells a caller to render no chip at all: a section with
    // no roles in it is empty, and "0/0 Kamili" is not a thing to show a person.
    expect(p.experience).toEqual({ filled: 0, total: 0 });
    expect(p.education).toEqual({ filled: 0, total: 0 });
    expect(p.skillCount).toBe(0);
  });

  it("survives a null or partial record", () => {
    expect(() => cvProgress(null)).not.toThrow();
    expect(cvProgress(null).personal).toEqual({ filled: 0, total: 5 });
    expect(cvProgress({ personalInfo: { fullName: "Ali" } } as never).personal.filled).toBe(1);
  });

  it("counts skills without inventing a target", () => {
    const p = cvProgress({
      ...base,
      skills: [{ id: "1", name: "Excel" }, { id: "2", name: "Mauzo" }],
    } as never);
    expect(p.skillCount).toBe(2);
  });
});
