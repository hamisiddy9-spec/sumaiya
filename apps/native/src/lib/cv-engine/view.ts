/**
 * The data seam of the native engine.
 *
 * The web engine consumes the web's `CVData` shape (`personal`/`position`/
 * `jobTitle`/numeric skill levels/projects/referees/hobbies). The native app's
 * shared `CVData` uses `personalInfo`/`title`/`headline`/word skill levels and
 * has no `projects`/`referees`/`hobbies` fields at all.
 *
 * Rather than fork every section renderer, the engine normalises once, here,
 * into the shape the web renderers already speak. Everything downstream
 * (sections.ts, layouts.ts) is then a mechanical mirror of the web and reads
 * identically on both platforms.
 *
 * Two rules this file exists to enforce:
 *   1. Never invent data. A missing field renders as nothing, never as a
 *      placeholder or a flattering default.
 *   2. Skills are a 1–5 number everywhere downstream. The word form
 *      ("beginner"/"expert") and the numeric form (1–5, what the web editor
 *      writes) both land on the same scale, so a skill bar can never draw a
 *      wrong width just because the CV was authored on the other platform.
 */

import type { CVData } from "@sumaiya/types";

export interface VPersonal {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  photo: string;
}

export interface VExperience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface VEducation {
  id: string;
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface VSkill {
  id: string;
  name: string;
  /** Always 1–5. */
  level: number;
}

export interface VLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface VCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface VProject {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
}

export interface VReferee {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

/** Everything the section renderers need, in web shape. */
export interface EngineView {
  personal: VPersonal;
  summary: string;
  experience: VExperience[];
  education: VEducation[];
  skills: VSkill[];
  languages: VLanguage[];
  certifications: VCertification[];
  projects: VProject[];
  referees: VReferee[];
  hobbies: string;
  hiddenSections: string[];
  sectionOrder: string[];
}

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.map(obj) : []);

/** First non-empty of the given keys — the native/web alias pairs. */
function str(a: Obj, ...keys: string[]): string {
  for (const k of keys) {
    const v = a[k];
    if (typeof v === "string" && v.trim() !== "") return v;
    if (typeof v === "number") return String(v);
  }
  return "";
}

const SKILL_WORDS: Record<string, number> = {
  // native + shared vocabulary
  beginner: 2,
  intermediate: 3,
  advanced: 4,
  expert: 5,
  // web / CEFR vocabulary that also reaches us
  basic: 2,
  elementary: 2,
  limited: 2,
  novice: 1,
  junior: 2,
  professional: 4,
  skilled: 4,
  fluent: 4,
  master: 5,
  native: 5,
};

/**
 * Any skill-level encoding → 1–5.
 * Unknown input returns 3 (mid), never 5: an unreadable level must not draw a
 * full bar and imply expert.
 */
export function skillLevel(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(1, Math.min(5, Math.round(raw)));
  }
  if (typeof raw === "string") {
    const t = raw.trim().toLowerCase();
    if (/^[1-5]$/.test(t)) return Number(t);
    const word = SKILL_WORDS[t];
    if (word) return word;
  }
  return 3;
}

/** "native" → "Native", "professional" → "Professional". Display parity with web. */
function titleCase(v: string): string {
  if (!v) return "";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** "Present", "Sasa", "Current", or a truthy flag → true. */
function isCurrent(raw: unknown, endDate: string): boolean {
  if (raw === true) return true;
  if (raw === false) return false;
  const t = (endDate ?? "").trim().toLowerCase();
  return t === "present" || t === "sasa" || t === "current" || t === "now";
}

export function toEngineView(data: CVData | undefined | null): EngineView {
  const d = obj(data);
  const p = obj((d as Obj).personalInfo ?? (d as Obj).personal);

  const personal: VPersonal = {
    fullName: str(p, "fullName", "name"),
    // headline ⇄ jobTitle: cv-shape keeps both sides in sync at the boundary.
    jobTitle: str(p, "jobTitle", "headline"),
    email: str(p, "email"),
    phone: str(p, "phone"),
    location: str(p, "location", "address", "city"),
    linkedin: str(p, "linkedin", "linkedIn"),
    website: str(p, "website", "portfolio", "url"),
    photo: str(p, "profilePhoto", "photo"),
  };

  const experience: VExperience[] = list((d as Obj).experience).map((e, i) => {
    const endDate = str(e, "endDate");
    return {
      id: str(e, "id") || `exp-${i}`,
      position: str(e, "title", "position", "role"),
      company: str(e, "company", "employer"),
      location: str(e, "location", "place"),
      startDate: str(e, "startDate"),
      endDate,
      current: isCurrent(e.current, endDate),
      description: str(e, "description", "summary"),
    };
  });

  const education: VEducation[] = list((d as Obj).education).map((e, i) => ({
    id: str(e, "id") || `edu-${i}`,
    degree: str(e, "degree", "qualification"),
    field: str(e, "field", "fieldOfStudy", "major"),
    institution: str(e, "institution", "school", "university"),
    startDate: str(e, "startDate"),
    endDate: str(e, "graduationDate", "endDate"),
    grade: str(e, "grade", "gpa", "result"),
  }));

  const skills: VSkill[] = list((d as Obj).skills)
    .map((s, i) => ({
      id: str(s, "id") || `skill-${i}`,
      name: str(s, "name", "skill"),
      level: skillLevel(s.level),
    }))
    .filter((s) => s.name.trim().length > 0);

  const languages: VLanguage[] = list((d as Obj).languages)
    .map((l, i) => ({
      id: str(l, "id") || `lang-${i}`,
      name: str(l, "name", "language"),
      proficiency: titleCase(str(l, "proficiency", "level")),
    }))
    .filter((l) => l.name.trim().length > 0);

  const certifications: VCertification[] = list((d as Obj).certifications)
    .map((c, i) => ({
      id: str(c, "id") || `cert-${i}`,
      name: str(c, "name", "title"),
      issuer: str(c, "issuer", "authority", "organization"),
      date: str(c, "date", "issueDate"),
    }))
    .filter((c) => c.name.trim().length > 0);

  const projects: VProject[] = list((d as Obj).projects)
    .map((p2, i) => ({
      id: str(p2, "id") || `proj-${i}`,
      name: str(p2, "name", "title"),
      role: str(p2, "role"),
      date: str(p2, "date"),
      description: str(p2, "description"),
    }))
    .filter((p2) => p2.name.trim().length > 0);

  const referees: VReferee[] = list((d as Obj).referees)
    .map((r, i) => ({
      id: str(r, "id") || `ref-${i}`,
      name: str(r, "name"),
      title: str(r, "title", "position"),
      company: str(r, "company", "organization"),
      email: str(r, "email"),
      phone: str(r, "phone"),
    }))
    .filter((r) => r.name.trim().length > 0);

  const rawHobbies = (d as Obj).hobbies;

  return {
    personal,
    summary: str(d, "summary", "professionalSummary"),
    experience,
    education,
    skills,
    languages,
    certifications,
    projects,
    referees,
    // hobbies arrives as a comma/newline string on the web; tolerate an array too.
    hobbies: Array.isArray(rawHobbies)
      ? rawHobbies.filter((h) => typeof h === "string").join(", ")
      : str(d, "hobbies", "interests"),
    hiddenSections: Array.isArray((d as Obj).hiddenSections)
      ? ((d as Obj).hiddenSections as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
    sectionOrder: Array.isArray((d as Obj).sectionOrder)
      ? ((d as Obj).sectionOrder as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
  };
}
