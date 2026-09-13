import { describe, it, expect } from "vitest";
import { cvDataSchema, parseCVData } from "./index";

// ─── parseCVData: the single reader behind the CV list, the editor, ATS, job
// matching and every PDF export ─────────────────────────────────────────────
//
// Two silent-empty bugs have lived in this function, and both had the same
// shape: the row was intact and the reader threw it away.
//
//   1. the column held a JSON *string* (jsonb_typeof = 'string')
//   2. the object used the APP's key names (`personalInfo` / `headline`), not
//      the stored ones (`personal` / `jobTitle`)
//
// Each rendered a blank CV to a user who had filled one in, so each gets a
// regression test written against the payload the database actually holds.
//
// ⚠️ Both fixtures below are copied VERBATIM from production rows (contact
// strings blanked). An earlier version of this file invented its own experience
// and skill objects and every assertion failed — the real shape uses
// `position` (not `title`) on experience entries and a NUMERIC `level` on
// skills. A made-up fixture would have "proved" a fix that did not work and
// hidden this whole class of failure.

/** Verbatim from row m_cPBqc2IgNxWxOcPc3afV — app-written, and the row that
 *  rendered with a BLANK header before this fix. */
const APP_ROW = JSON.stringify({
  personalInfo: { fullName: "Hamisi Iddy Shabani", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
});

/** Verbatim shape from row m_gtgMbbWCo0EZ34fJ1aq3 — web-written, with content. */
const WEB_ROW = JSON.stringify({
  personal: {
    fullName: "Paul Philip",
    jobTitle: "ICT Officer",
    email: "",
    phone: "",
    location: "Morogoro",
    linkedin: "",
    website: "",
  },
  summary: "Mtaalamu wa ICT aliye na uzoefu wa miaka miwili katika shirika la TANESCO.",
  experience: [
    {
      id: "A-eYkndAk3aebKor0CTHF",
      company: "TANESCO",
      position: "ICT Officer",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "- Kurekebisha na kudumisha kompyuta za shirika.",
    },
  ],
  education: [
    {
      id: "QShYv5r_g3jUboSwvl0x6",
      institution: "Chuo cha NIT",
      degree: "Diploma",
      field: "ICT",
      startDate: "2014",
      endDate: "2017",
      description: "Diploma in information and communication technology",
      grade: "Upper second class",
    },
  ],
  skills: [
    { id: "iPxwEQRtS-2AJRAyE5Qsg", name: "Ukarabati wa Kompyuta", level: 3 },
    { id: "g5_Q9YvJIORgVX-3sgYke", name: "Mashine za EFD", level: 3 },
  ],
  projects: [],
  languages: [],
});

describe("parseCVData — an app-written row must not lose its header", () => {
  it("renders the name out of the app's `personalInfo` shape", () => {
    // The regression: `cvDataSchema` knows only `personal`, so this parsed to
    // `personal.fullName === ""` and the user's own name vanished from the CV,
    // the ATS score, job matching and every PDF.
    expect(parseCVData(APP_ROW).personal.fullName).toBe("Hamisi Iddy Shabani");
  });

  it("renders the name whether the row arrives as a string or an object", () => {
    expect(parseCVData(JSON.parse(APP_ROW)).personal.fullName).toBe("Hamisi Iddy Shabani");
    // doubly-encoded — the first bug, still guarded
    expect(parseCVData(JSON.stringify(APP_ROW)).personal.fullName).toBe("Hamisi Iddy Shabani");
  });

  it("maps the app's `headline` onto the stored `jobTitle`", () => {
    const appWithHeadline = JSON.stringify({
      personalInfo: { fullName: "Asha M.", email: "", phone: "", location: "", headline: "Storekeeper" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      languages: [],
    });
    expect(parseCVData(appWithHeadline).personal.jobTitle).toBe("Storekeeper");
  });
});

describe("parseCVData — the stored shape keeps working (no regression)", () => {
  it("reads every section of a web-written row", () => {
    const cv = parseCVData(WEB_ROW);
    expect(cv.personal.fullName).toBe("Paul Philip");
    expect(cv.personal.jobTitle).toBe("ICT Officer");
    expect(cv.personal.location).toBe("Morogoro");
    expect(cv.summary).toContain("TANESCO");
    expect(cv.experience).toHaveLength(1);
    expect(cv.experience[0].company).toBe("TANESCO");
    expect(cv.education[0].institution).toBe("Chuo cha NIT");
    expect(cv.skills.map((s) => s.name)).toContain("Ukarabati wa Kompyuta");
  });

  it("keeps the scalar sections the converter does not itself emit", () => {
    // `toStoredCvData` spreads `...src` before mapping the keys it knows, so
    // everything the app writes beyond its list survives the conversion.
    const withExtras = JSON.stringify({
      personalInfo: { fullName: "Asha M.", email: "", phone: "", location: "" },
      hobbies: "Football",
      hiddenSections: ["referees"],
    });
    const cv = parseCVData(withExtras);
    expect(cv.personal.fullName).toBe("Asha M.");
    expect(cv.hobbies).toBe("Football");
    expect(cv.hiddenSections).toEqual(["referees"]);
  });

  // ⚠️ KNOWN SHARP EDGE — not fixed here, recorded so it is not rediscovered.
  // The arrays (`experience`, `projects`, `referees`, …) carry `.default([])`
  // for a MISSING key but no `.catch` on their ITEMS. One malformed item —
  // an invented project object missing a required field, say — fails the item,
  // which fails the array, which fails the whole object, which blanks the
  // entire CV. That is the same "one bad field costs the whole document"
  // failure this file exists to pin, one level deeper. A per-item `.catch`
  // (drop the bad entry, keep the rest) is the fix; it is a deliberate
  // follow-up, not a silent omission.
  it("documents that a malformed array item blanks the whole CV", () => {
    const oneBadProject = JSON.stringify({
      personalInfo: { fullName: "Asha M.", email: "", phone: "", location: "" },
      projects: [{ nonsense: true }],
    });
    // Today's behaviour, asserted so a future fix has to change THIS line.
    expect(parseCVData(oneBadProject).personal.fullName).toBe("");
  });
});

describe("parseCVData — hostile input", () => {
  it("never throws and never invents content", () => {
    for (const bad of [null, undefined, "", "not json", "{}", "[]", 42, true, "null", { personal: null }]) {
      const cv = parseCVData(bad);
      expect(cv.personal.fullName).toBe("");
      expect(cv.experience).toEqual([]);
      expect(cv.skills).toEqual([]);
    }
  });
});

describe("cvDataSchema — the safety net underneath", () => {
  it("does not reject a document for one missing collection", () => {
    // The failure that cost users their whole CV: zod rejects the WHOLE object
    // when a single key is absent. The `.default([])` calls must hold.
    const r = cvDataSchema.safeParse({ personal: { fullName: "A", jobTitle: "", email: "", phone: "", location: "" }, summary: "s" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.referees).toEqual([]);
      expect(r.data.experience).toEqual([]);
      expect(r.data.hobbies).toBe("");
    }
  });

  it("survives a malformed personal block rather than blanking the document", () => {
    const r = cvDataSchema.safeParse({ personal: "not an object", summary: "kept" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.personal.fullName).toBe("");
      expect(r.data.summary).toBe("kept");
    }
  });
});
