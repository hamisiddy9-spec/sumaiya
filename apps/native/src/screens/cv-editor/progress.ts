import type { CVData } from "@sumaiya/types";

/**
 * How complete each section of the CV editor is.
 *
 * The design puts a chip on every section header (`4/4 Kamili`) and the number
 * has to be a fact about the CV, not a vibe. So each section declares what it is
 * measured against, and this file is the only place those lists live:
 *
 *   personal    5 fields — the ones the section actually renders
 *   summary     1 field  — the summary text
 *   experience  one per ROLE, complete when the four core fields are filled
 *   education   one per SCHOOL, complete when institution + degree + graduation
 *
 * A LIST SECTION IS MEASURED AGAINST ITSELF: "2/3 Kamili" means two of the three
 * roles the user has entered are complete, NOT two of some target number of
 * roles the app decided they should have. There is no "you should have 3 jobs"
 * in this product, and inventing one would turn a completeness count into an
 * instruction.
 *
 * Empty list = 0/0, which callers do NOT render: a section with nothing in it is
 * not "0% complete", it is empty, and the section header already says so.
 */
export interface SectionProgress {
  filled: number;
  total: number;
}

export interface CvProgress {
  personal: SectionProgress;
  summary: SectionProgress;
  experience: SectionProgress;
  education: SectionProgress;
  /** Skills have no fixed set to complete — this is a count, not a ratio. */
  skillCount: number;
}

const filledRatio = (values: unknown[]): SectionProgress => {
  const filled = values.filter((v) => typeof v === "string" && v.trim().length > 0).length;
  return { filled, total: values.length };
};

/** The five fields the personal section renders, in the order it renders them. */
function personalFields(data: Partial<CVData> | null | undefined): string[] {
  const p = data?.personalInfo;
  return [p?.fullName, p?.headline, p?.email, p?.phone, p?.location].map((v) => v ?? "");
}

export function cvProgress(data: Partial<CVData> | null | undefined): CvProgress {
  const exp = data?.experience ?? [];
  const edu = data?.education ?? [];
  const skills = data?.skills ?? [];

  return {
    personal: filledRatio(personalFields(data)),
    summary: filledRatio([data?.summary ?? ""]),
    experience: {
      filled: exp.filter((e) => [e.title, e.company, e.startDate, e.description].every(hasText)).length,
      total: exp.length,
    },
    education: {
      filled: edu.filter((e) => [e.institution, e.degree, e.graduationDate].every(hasText)).length,
      total: edu.length,
    },
    skillCount: skills.length,
  };
}

function hasText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}
