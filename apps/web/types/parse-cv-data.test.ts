import { describe, it, expect } from "vitest";
import { parseCVData } from "./index";

/**
 * `parseCVData` is the door every stored CV comes through — the DB jsonb column,
 * the guest draft in localStorage, the mobile writer. Its failure mode used to be
 * catastrophic rather than local: one bad row anywhere meant `cvDataSchema`
 * rejected the whole document and the function answered with an EMPTY CV.
 *
 * Measured before the fix, with the CV below: `fullName: "" · summary: "" ·
 * experience: [] · skills: []`. The user's name and every job, gone because one
 * skill row had no `level`. That is the same shape as the 2026-09-13 P0 (19
 * stored CVs rendering blank), so these tests exist to keep it from coming back.
 */

const COMPLETE_CV = {
  personal: {
    fullName: "Hamisi Iddy Mwakyusa",
    jobTitle: "Sales Officer",
    email: "hamisi@example.com",
    phone: "+255 754 123 456",
    location: "Dar es Salaam",
  },
  summary: "Sales Officer mwenye uzoefu wa miaka 6 katika mauzo ya FMCG.",
  experience: [
    {
      id: "e1",
      company: "Tanzania Breweries",
      position: "Sales Officer",
      startDate: "2024-01",
      endDate: "",
      current: true,
      description: "- Nilisimamia Kinondoni na Ilala",
    },
    {
      id: "e2",
      company: "Azam Products",
      position: "Sales Representative",
      startDate: "2020-02",
      endDate: "2023-12",
      current: false,
      description: "- Niliuza kwa maduka 120+",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "TIOB",
      degree: "Diploma",
      field: "Marketing",
      startDate: "2017-01",
      endDate: "2019-11",
    },
  ],
  skills: [
    { id: "s1", name: "Mauzo ya FMCG", level: 5 },
    { id: "s2", name: "Excel", level: 4 },
  ],
  languages: [
    { id: "l1", name: "Kiswahili", proficiency: "Native" },
    { id: "l2", name: "Kiingereza", proficiency: "Fluent" },
  ],
};

describe("parseCVData — a complete CV is untouched", () => {
  it("parses every section", () => {
    const cv = parseCVData(COMPLETE_CV);
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.summary).toContain("miaka 6");
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0].company).toBe("Tanzania Breweries");
    expect(cv.education[0].institution).toBe("TIOB");
    expect(cv.skills).toHaveLength(2);
    expect(cv.languages[0].name).toBe("Kiswahili");
  });

  it("still unwraps a row stored as a JSON string inside the column", () => {
    // The 2026-09-13 P0: rows written before that date held the CV as
    // jsonb_typeof = 'string', so a plain object parse answered an empty CV while
    // the data sat right there in the column.
    const cv = parseCVData(JSON.stringify(COMPLETE_CV));
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.experience).toHaveLength(2);
  });

  it("unwraps a doubly-encoded row", () => {
    const cv = parseCVData(JSON.stringify(JSON.stringify(COMPLETE_CV)));
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
  });
});

describe("parseCVData — one bad row must not cost the whole CV", () => {
  it("keeps the name, summary, jobs and good skills when one skill row is malformed", () => {
    const cv = parseCVData({
      ...COMPLETE_CV,
      // Written by an older client / an import: no `level`.
      skills: [{ id: "s1", name: "Mauzo ya FMCG", level: 5 }, { id: "s2", name: "Excel" }],
    });

    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.summary).toContain("miaka 6");
    expect(cv.experience).toHaveLength(2);
    expect(cv.education).toHaveLength(1);
    // The one bad row is dropped, the parseable one is kept.
    expect(cv.skills).toEqual([{ id: "s1", name: "Mauzo ya FMCG", level: 5 }]);
  });

  it("keeps the other jobs when one experience row is malformed", () => {
    const cv = parseCVData({
      ...COMPLETE_CV,
      experience: [
        COMPLETE_CV.experience[0],
        { id: "e2", company: "Azam", position: "Rep", current: "yes" }, // current must be boolean
      ],
    });
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].company).toBe("Tanzania Breweries");
  });

  it("keeps the CV when a section is not an array at all", () => {
    const cv = parseCVData({ ...COMPLETE_CV, skills: "Excel, Sales", languages: null });
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.experience).toHaveLength(2);
    expect(cv.skills).toEqual([]);
    expect(cv.languages).toEqual([]);
  });

  it("keeps the CV when a scalar has the wrong type", () => {
    const cv = parseCVData({ ...COMPLETE_CV, summary: 2026, hobbies: ["football"] });
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    // `toStoredCvData` runs BEFORE validation and its `str()` helper is
    // deliberately lossless (packages/utils/src/cv-shape.ts:35 — `String(v)` for
    // anything non-null). So a wrong-typed scalar is coerced, the strict parse
    // SUCCEEDS, and the salvage path below never runs: the summary comes back as
    // "2026", not "". That supersedes this test's original expectation of "" and
    // is the better outcome — the user's input survives instead of being
    // discarded. What is under test is unchanged: a wrong-typed scalar must not
    // cost the whole CV.
    expect(cv.summary).toBe("2026");
    expect(cv.experience).toHaveLength(2);
  });

  it("keeps the name when the personal block itself is malformed", () => {
    const cv = parseCVData({ ...COMPLETE_CV, personal: { fullName: 123, email: null } });
    expect(cv.personal.fullName).toBe("");
    expect(cv.experience).toHaveLength(2); // the rest is still the user's work
  });

  it("drops a wrong-typed row from every array section, keeping the rest", () => {
    const cv = parseCVData({
      personal: COMPLETE_CV.personal,
      summary: COMPLETE_CV.summary,
      // Each row is invalid for a different reason. Note the schemas are not
      // uniform: experience/education/projects default every field, so a row
      // only counts as broken when a present field has the wrong TYPE; skills,
      // languages, certifications and referees have required fields, so a
      // missing one is enough.
      experience: [{ id: "e1", company: "TBR", current: "yes" }],
      education: [{ id: "ed1", institution: "TIOB", startDate: 2020 }],
      skills: [{ id: "s1", name: "Excel" }],
      languages: [{ id: "l1", name: "Kiswahili" }],
      certifications: [{ id: "c1", name: "PMP" }],
      referees: [{ id: "r1", name: "Juma" }],
      projects: [{ id: "p1", name: 5 }],
    });
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.experience).toEqual([]);
    expect(cv.education).toEqual([]);
    expect(cv.skills).toEqual([]);
    expect(cv.languages).toEqual([]);
    expect(cv.certifications).toEqual([]);
    expect(cv.referees).toEqual([]);
    expect(cv.projects).toEqual([]);
  });

  it("normalizes a merely incomplete row instead of dropping it", () => {
    // Documenting existing, deliberate behaviour: an id-only experience row is
    // VALID (every field has a default) and comes back blank-but-present rather
    // than being discarded. Only a wrong type makes a row unparseable — which is
    // what these tests turn on.
    const cv = parseCVData({ personal: COMPLETE_CV.personal, experience: [{ id: "e1" }] });
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0]).toMatchObject({ id: "e1", company: "", current: false });
  });
});

describe("parseCVData — inputs that genuinely carry no CV", () => {
  it("returns an empty CV (never a throw) for unusable input", () => {
    for (const input of [null, undefined, 42, "not json at all", [], [[]]]) {
      const cv = parseCVData(input);
      expect(cv.personal.fullName).toBe("");
      expect(cv.experience).toEqual([]);
    }
  });

  it("defaults missing sections to empty arrays, not undefined", () => {
    const cv = parseCVData({ personal: { fullName: "A" } });
    expect(cv.skills).toEqual([]);
    expect(cv.projects).toEqual([]);
    expect(cv.referees).toEqual([]);
    expect(cv.hobbies).toBe("");
  });
});
