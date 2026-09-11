/**
 * One CV, two shapes.
 *
 * The web app is the system of record. It stores contacts under `personal`
 * (with `jobTitle`) and experience under `position`. The native app — and the
 * shared `CVData` type — uses `personalInfo` (with `headline`) and `title`.
 *
 * Both write through the same `/api/cv` endpoint, and the payload was passed
 * through verbatim. So a CV created on the web arrived in the app with no
 * `personalInfo`: the name, email, phone, location and headline all rendered
 * blank, and every job was invisible (the app reads `title`, the row had
 * `position`). ATS then scored a full CV as empty. The same happened in
 * reverse for a CV created in the app.
 *
 * These two functions are the boundary. They are deliberately lossless: they
 * spread the source object and ADD the aliases the other side needs, so
 * unknown fields (photo, grade, hobbies, projects, referees…) survive a round
 * trip and calling them twice changes nothing.
 */

import type {
  Certification,
  CVData,
  Education,
  Experience,
  LanguageProf,
  PersonalInfo,
  Skill,
} from "@sumaiya/types";

type Obj = Record<string, unknown>;

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? v.map(obj) : []);
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const pick = (a: Obj, ...keys: string[]): unknown => {
  for (const k of keys) {
    const v = a[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

/** Copy `from` keys onto `target` only where the target has nothing yet. */
function fill(target: Obj, from: Obj, map: Record<string, string>) {
  for (const [dest, src] of Object.entries(map)) {
    if (target[dest] === undefined || target[dest] === "" || target[dest] === null) {
      const v = pick(from, src);
      if (v !== undefined) target[dest] = v;
    }
  }
  return target;
}

function personalBlock(raw: Obj): Obj {
  return obj(pick(raw, "personalInfo", "personal", "personalDetails"));
}

function mapPersonal(raw: Obj, to: "native" | "stored"): Obj {
  const src = personalBlock(raw);
  const out: Obj = { ...src };
  if (to === "native") {
    // headline <- jobTitle; profilePhoto <- photo
    fill(out, src, { headline: "jobTitle", profilePhoto: "photo" });
    if (out.jobTitle === undefined) out.jobTitle = pick(src, "headline") ?? "";
  } else {
    fill(out, src, { jobTitle: "headline", photo: "profilePhoto" });
    if (out.headline === undefined) out.headline = pick(src, "jobTitle") ?? "";
  }
  if (out.fullName === undefined) out.fullName = "";
  if (out.email === undefined) out.email = "";
  return out;
}

function mapExperience(items: Obj[], to: "native" | "stored"): Obj[] {
  return items.map((e) => {
    const out: Obj = { ...e };
    if (to === "native") {
      fill(out, e, { title: "position", company: "employer" });
      if (out.position === undefined) out.position = pick(e, "title") ?? "";
    } else {
      fill(out, e, { position: "title", employer: "company" });
      if (out.title === undefined) out.title = pick(e, "position") ?? "";
    }
    if (out.keyAchievements === undefined) out.keyAchievements = [];
    return out;
  });
}

function mapEducation(items: Obj[], to: "native" | "stored"): Obj[] {
  return items.map((e) => {
    const out: Obj = { ...e };
    if (to === "native") fill(out, e, { graduationDate: "endDate" });
    else fill(out, e, { endDate: "graduationDate" });
    return out;
  });
}

function mapLanguages(items: Obj[], to: "native" | "stored"): Obj[] {
  return items.map((l) => {
    const out: Obj = { ...l };
    if (to === "native") fill(out, l, { language: "name" });
    else fill(out, l, { name: "language" });
    return out;
  });
}

function mapCertifications(items: Obj[], to: "native" | "stored"): Obj[] {
  return items.map((c) => {
    const out: Obj = { ...c };
    if (to === "native") fill(out, c, { issueDate: "date", credentialUrl: "url" });
    else fill(out, c, { date: "issueDate", url: "credentialUrl" });
    return out;
  });
}

function convert(raw: unknown, to: "native" | "stored"): Obj {
  const src = obj(raw);
  return {
    ...src,
    [to === "native" ? "personalInfo" : "personal"]: mapPersonal(src, to),
    summary: str(pick(src, "summary", "professionalSummary") ?? ""),
    experience: mapExperience(arr(src.experience), to),
    education: mapEducation(arr(src.education), to),
    skills: arr(src.skills).map((s) => ({ ...s, name: str(pick(s, "name", "skill") ?? "") })),
    certifications: mapCertifications(arr(src.certifications), to),
    languages: mapLanguages(arr(src.languages), to),
  };
}

/** Any stored/legacy shape -> the `CVData` the app and shared type expect. */
export function toNativeCvData<T = CVData>(raw: unknown): T {
  return convert(raw, "native") as T;
}

/** App shape (or anything else) -> the shape the web app reads and writes. */
export function toStoredCvData<T = Record<string, unknown>>(raw: unknown): T {
  return convert(raw, "stored") as T;
}

/** One CV shape -> the other, whichever direction is needed. */
export function convertCvData(raw: unknown, to: "native" | "stored") {
  return convert(raw, to);
}

const filled = (v: unknown) => str(v).trim().length > 0;
const hasContentItem = (items: Obj[], keys: string[]) =>
  items.some((i) => keys.some((k) => filled(i[k])));

export interface CvSections {
  contacts: boolean;
  summary: boolean;
  experience: boolean;
  education: boolean;
  skills: boolean;
}

/** Which core sections actually carry content (works on either shape). */
export function cvSections(raw: unknown): CvSections {
  const d = obj(raw);
  const p = personalBlock(d);
  return {
    contacts: filled(p.fullName) && (filled(p.email) || filled(p.phone)),
    summary: filled(d.summary),
    experience: hasContentItem(arr(d.experience), ["title", "position", "company"]),
    education: hasContentItem(arr(d.education), ["institution", "degree"]),
    skills: arr(d.skills).some((s) => filled(s.name)),
  };
}

/**
 * A CV with nothing to score but a name. ATS is honest but useless here — the
 * honest answer is "this CV is empty", not "22/100, high risk".
 */
export function isEmptyCv(raw: unknown): boolean {
  const s = cvSections(raw);
  const d = obj(raw);
  return (
    !s.contacts &&
    !s.summary &&
    !s.experience &&
    !s.education &&
    !s.skills &&
    !filled(personalBlock(d).headline)
  );
}

export type { Certification, CVData, Education, Experience, LanguageProf, PersonalInfo, Skill };
