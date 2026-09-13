import { describe, it, expect } from "vitest";
import { parseCareerProfile, parseCVData } from "./index";
import { parseCvLoose } from "@/lib/career-profile/mapper";

// ─── The JSON-string defect, across every reader ────────────────────────────
//
// Measured on production 2026-09-13 across all 26 jsonb columns: 11 of them
// hold a JSON *string* in at least one row. `cv.data` is 19/19 and
// `user_profile.career_profile` is 12/14, and each reader called
// `safeParse(data)` / checked `typeof data !== "object"` WITHOUT unwrapping
// first — so it silently returned an empty document and every caller believed
// the user had filled nothing in.
//
// There are TWO CV readers. `parseCVData` was fixed first; `parseCvLoose` was
// still broken, and it is the one that seeds the career profile, snap-to-apply
// and the assistant's grounding. A one-column bug survives in half a codebase
// unless the fix is shared — which is why the unwrap now lives in
// `unwrapStoredJson` and every reader goes through it.

/** How a stored row actually arrives: a JSON string inside jsonb. */
const asString = (o: unknown) => JSON.stringify(o);

/** Verbatim shape from a production row (contacts blanked). An earlier version
 *  of this file invented its own profile and BOTH profile tests failed — the
 *  real shape carries `achievements`, `volunteer`, `references`, `preferences`
 *  and `factMeta`, and the schema is strict about it. Inventing a fixture is
 *  how a real bug gets reported as a passing test. */
const PROFILE = {
  personal: { fullName: "Paul Philip", jobTitle: "ICT Officer", email: "", phone: "", location: "Morogoro" },
  summary: "Mtaalamu wa ICT aliye na uzoefu wa miaka miwili katika shirika la TANESCO.",
  experience: [
    { id: "A-eYkndAk3aebKor0CTHF", company: "TANESCO", position: "ICT Officer", location: "", startDate: "", endDate: "", current: false, description: "- Kurekebisha kompyuta." },
  ],
  education: [
    { id: "QShYv5r_g3jUboSwvl0x6", institution: "Chuo cha NIT", degree: "Diploma", field: "ICT", startDate: "2014", endDate: "2017", description: "Diploma in ICT" },
  ],
  skills: [{ id: "iPxwEQRtS-2AJRAyE5Qsg", name: "Ukarabati wa Kompyuta", level: 3 }],
  certifications: [],
  languages: [{ id: "N4eND1UFVIxNZbf5Fz9OS", name: "Swahili", proficiency: "Native" }],
  projects: [],
  achievements: [],
  volunteer: [],
  references: [],
  preferences: { targetRoles: [], preferredLocations: [], remotePreference: "" },
  factMeta: {},
};

const CV = {
  personal: { fullName: "Paul Philip", jobTitle: "ICT Officer", email: "", phone: "", location: "Morogoro" },
  summary: "Mtaalamu wa ICT.",
  experience: [{ id: "x", company: "TANESCO", position: "ICT Officer", startDate: "", endDate: "", description: "" }],
  education: [],
  skills: [{ id: "s", name: "EFD", level: 3 }],
  languages: [],
};

describe("parseCareerProfile — must unwrap a string-encoded row", () => {
  it("loads a profile stored as a JSON string", () => {
    // 12 of 14 production rows are stored this way. Before the unwrap this
    // returned an empty profile, and routes/jobs.ts scored job matches from it.
    const p = parseCareerProfile(asString(PROFILE));
    expect(p.summary).toContain("TANESCO");
    expect(p.personal.fullName).toBe("Paul Philip");
    expect(p.skills).toHaveLength(1);
  });

  it("still loads a healthy object row (no regression)", () => {
    expect(parseCareerProfile(PROFILE).personal.fullName).toBe("Paul Philip");
  });

  it("returns an empty profile rather than throwing on junk", () => {
    for (const bad of [null, undefined, "", "not json", 42, "[]"]) {
      expect(() => parseCareerProfile(bad)).not.toThrow();
    }
    expect(parseCareerProfile(null).summary ?? "").toBe("");
  });
});

describe("parseCvLoose — the second CV reader", () => {
  it("reads a string-encoded CV instead of returning an empty one", () => {
    const cv = parseCvLoose(asString(CV));
    expect(cv.personal.fullName).toBe("Paul Philip");
    expect(cv.experience[0].company).toBe("TANESCO");
    expect(cv.skills.map((s) => s.name)).toContain("EFD");
  });

  it("normalises the app's own key names too", () => {
    // The phone writes `personalInfo`/`headline`; this reader was a looser,
    // differently-wrong cousin of parseCVData.
    const appRow = asString({
      personalInfo: { fullName: "Hamisi Iddy Shabani", email: "", phone: "", location: "", headline: "ICT Officer" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      languages: [],
    });
    const cv = parseCvLoose(appRow);
    expect(cv.personal.fullName).toBe("Hamisi Iddy Shabani");
    expect(cv.personal.jobTitle).toBe("ICT Officer");
  });

  it("reads a plain object row (no regression)", () => {
    expect(parseCvLoose(CV).personal.fullName).toBe("Paul Philip");
  });

  it("never throws and never invents content", () => {
    for (const bad of [null, undefined, "", "not json", "{}", "[]", 42, true]) {
      const cv = parseCvLoose(bad);
      expect(cv.personal.fullName).toBe("");
      expect(cv.experience).toEqual([]);
    }
  });
});

describe("the two CV readers now agree", () => {
  it("produce the same name for the same stored row", () => {
    // They disagreed before: parseCVData unwrapped (after its fix),
    // parseCvLoose did not. Any row read differently by two readers is a bug
    // waiting to be reported as "the CV shows your name here but not there".
    for (const row of [asString(CV), CV, asString({
      personalInfo: { fullName: "Asha M.", email: "", phone: "", location: "" },
      summary: "", experience: [], education: [], skills: [], languages: [],
    })]) {
      expect(parseCVData(row).personal.fullName).toBe(parseCvLoose(row).personal.fullName);
    }
  });
});
