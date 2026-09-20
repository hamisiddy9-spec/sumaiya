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
    // BOTH skills survive. A missing `level` used to drop the row, and a section
    // whose rows all lacked one rendered as no section at all — from the page
    // and from the PDF's ATS text layer (docs/QA-IO-MATRIX-2026-09-20.md D8).
    // The name is the candidate's data, so the row is kept and the level
    // defaults to 3 (the value the QA proof measured: 9 skills in, 9 out with
    // level 3 — docs/qa-fixtures-2026-09-20/parsecvdata-proof.txt).
    expect(cv.skills).toEqual([
      { id: "s1", name: "Mauzo ya FMCG", level: 5 },
      { id: "s2", name: "Excel", level: 3 },
    ]);
  });

  it("keeps the job whose `current` flag arrived as a string", () => {
    const cv = parseCVData({
      ...COMPLETE_CV,
      experience: [
        COMPLETE_CV.experience[0],
        { id: "e2", company: "Azam", position: "Rep", current: "yes" }, // current must be boolean
      ],
    });
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    // Still two jobs: the employer and the role are the candidate's, so a
    // wrong-typed FLAG is repaired ("yes" is what a human means by yes) rather
    // than costing them a job on their CV.
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience[0].company).toBe("Tanzania Breweries");
    expect(cv.experience[1]).toMatchObject({ company: "Azam", position: "Rep", current: true });
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

  // ─── The fixture table ─────────────────────────────────────────────────────
  //
  // ONE rule per row, identical in every array section (types/index.ts, "THE
  // ROW RULE"):
  //
  //   • the row is not a plain object                -> DROPPED
  //   • its identity fields hold no readable text    -> DROPPED
  //     (name / company+position / institution+degree: an empty row is
  //      corruption, and kept it renders as a blank bullet in the CV)
  //   • readable content + a missing or malformed
  //     scalar                                       -> KEPT, scalar repaired
  //
  // `kept` is the count that survives; `expect` is what the surviving row holds.
  // These are the D8 rows verbatim: the QA fixture that measured 9 skills in →
  // 0 out (docs/qa-fixtures-2026-09-20/parsecvdata-proof.txt).
  const SKILL_LADDER: Array<{ label: string; row: unknown; kept: 0 | 1; expect?: Record<string, unknown> }> = [
    {
      label: "a fully valid skill comes back untouched",
      row: { id: "s1", name: "Excel", level: 4 },
      kept: 1,
      expect: { id: "s1", name: "Excel", level: 4 },
    },
    {
      label: "a MISSING level is defaulted to 3, the skill is kept",
      row: { id: "s2", name: "Hesabu" },
      kept: 1,
      expect: { id: "s2", name: "Hesabu", level: 3 },
    },
    {
      label: 'a level as the STRING "3" is repaired to the number 3',
      row: { id: "s3", name: "Mauzo", level: "3" },
      kept: 1,
      expect: { id: "s3", name: "Mauzo", level: 3 },
    },
    {
      label: "a level of 0 is clamped up to 1 (not dropped, not kept as 0)",
      row: { id: "s4", name: "CRM", level: 0 },
      kept: 1,
      expect: { id: "s4", name: "CRM", level: 1 },
    },
    {
      label: "a level of 7 is clamped down to 5",
      row: { id: "s5", name: "Uongozi", level: 7 },
      kept: 1,
      expect: { id: "s5", name: "Uongozi", level: 5 },
    },
    {
      label: 'a level of "expert" (not a number at all) falls back to 3',
      row: { id: "s6", name: "Kompyuta", level: "expert" },
      kept: 1,
      expect: { id: "s6", name: "Kompyuta", level: 3 },
    },
    {
      label: "a MISSING name is dropped — an empty bullet is not data",
      row: { id: "s7", level: 4 },
      kept: 0,
    },
    {
      label: "an EMPTY name (whitespace) is dropped too",
      row: { id: "s8", name: "   ", level: 4 },
      kept: 0,
    },
    {
      label: "a row that is not an object at all is dropped",
      row: "Excel",
      kept: 0,
    },
    {
      label: "a junk row with no readable field is dropped",
      row: { nonsense: true },
      kept: 0,
    },
  ];

  it("applies the row rule to the skill ladder: names kept, corruption dropped", () => {
    for (const { label, row, kept, expect: expected } of SKILL_LADDER) {
      const cv = parseCVData({ personal: COMPLETE_CV.personal, skills: [row] });
      expect(cv.skills, label).toHaveLength(kept);
      if (expected) expect(cv.skills[0], label).toMatchObject(expected);
    }
  });

  it("keeps the whole 9-skill section when NO skill carries a level", () => {
    // The D8 shape exactly: every skill written without `level` (the mobile
    // writer, an import). Before the fix this parsed to `skills: []` — no
    // section on the page and no SKILLS line in the PDF's text layer.
    const nine = ["TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "Terraform", "Kafka", "React", "Go"];
    const cv = parseCVData({
      personal: COMPLETE_CV.personal,
      summary: COMPLETE_CV.summary,
      skills: nine.map((name, i) => ({ id: `s${i + 1}`, name })),
    });
    expect(cv.skills.map((s) => s.name)).toEqual(nine);
    expect(cv.skills.every((s) => s.level === 3)).toBe(true);
    expect(cv.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(cv.summary).toContain("miaka 6");
  });

  it("applies the same rule to every other array section", () => {
    const CASES: Array<{
      section: "experience" | "education" | "projects" | "languages" | "certifications" | "referees";
      label: string;
      row: unknown;
      kept: 0 | 1;
      expect?: Record<string, unknown>;
    }> = [
      {
        section: "experience",
        label: "a job with a readable employer survives a wrong-typed `current`",
        row: { id: "e1", company: "TBR", current: "yes" },
        kept: 1,
        expect: { id: "e1", company: "TBR", current: true },
      },
      {
        section: "experience",
        label: "an id-only job has nothing readable and is dropped",
        row: { id: "e9" },
        kept: 0,
      },
      {
        section: "education",
        label: "a degree with a numeric startDate keeps the date as text",
        row: { id: "ed1", institution: "TIOB", startDate: 2020 },
        kept: 1,
        expect: { id: "ed1", institution: "TIOB", startDate: "2020" },
      },
      {
        section: "education",
        label: "an id-only education row is dropped",
        row: { id: "ed9" },
        kept: 0,
      },
      {
        section: "projects",
        label: "a project whose name is a NUMBER has no readable name and is dropped",
        row: { id: "p1", name: 5 },
        kept: 0,
      },
      {
        section: "projects",
        label: "a project with a readable name is kept",
        row: { id: "p2", name: "Mfumo wa Malipo" },
        kept: 1,
        expect: { id: "p2", name: "Mfumo wa Malipo" },
      },
      {
        section: "languages",
        label: "a language with no proficiency is kept with a blank one (no invented level)",
        row: { id: "l1", name: "Kiswahili" },
        kept: 1,
        expect: { id: "l1", name: "Kiswahili", proficiency: "" },
      },
      {
        section: "languages",
        label: "a lowercase proficiency is normalised to the editor's spelling",
        row: { id: "l2", name: "Kiingereza", proficiency: "fluent" },
        kept: 1,
        expect: { id: "l2", name: "Kiingereza", proficiency: "Fluent" },
      },
      {
        section: "certifications",
        label: "a certification with only a name is kept, its blanks filled",
        row: { id: "c1", name: "PMP" },
        kept: 1,
        expect: { id: "c1", name: "PMP", issuer: "", date: "" },
      },
      {
        section: "referees",
        label: "a referee with only a name is kept, their blanks filled",
        row: { id: "r1", name: "Juma" },
        kept: 1,
        expect: { id: "r1", name: "Juma", title: "", company: "", email: "", phone: "" },
      },
      {
        section: "referees",
        label: "a referee with no readable field is dropped",
        row: { id: "r9", title: "Manager" },
        kept: 0,
      },
    ];

    for (const { section, label, row, kept, expect: expected } of CASES) {
      const cv = parseCVData({ personal: COMPLETE_CV.personal, [section]: [row] });
      expect(cv[section], `${section}: ${label}`).toHaveLength(kept);
      if (expected) expect(cv[section][0], `${section}: ${label}`).toMatchObject(expected);
    }
    // …and the document around them is never disturbed by any of it.
    const all = parseCVData({
      personal: COMPLETE_CV.personal,
      summary: COMPLETE_CV.summary,
      experience: [{ id: "e1", company: "TBR", current: "yes" }, { id: "e9" }, "not a row"],
      education: [{ id: "ed1", institution: "TIOB", startDate: 2020 }],
      skills: [{ id: "s1", name: "Excel" }, { nonsense: true }],
      languages: [{ id: "l1", name: "Kiswahili" }],
      certifications: [{ id: "c1", name: "PMP" }],
      referees: [{ id: "r1", name: "Juma" }],
      projects: [{ id: "p1", name: 5 }, { id: "p2", name: "Mfumo" }],
    });
    expect(all.personal.fullName).toBe("Hamisi Iddy Mwakyusa");
    expect(all.summary).toContain("miaka 6");
    expect(all.experience).toHaveLength(1);
    expect(all.education).toHaveLength(1);
    expect(all.skills).toHaveLength(1);
    expect(all.languages).toHaveLength(1);
    expect(all.certifications).toHaveLength(1);
    expect(all.referees).toHaveLength(1);
    expect(all.projects).toHaveLength(1);
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
