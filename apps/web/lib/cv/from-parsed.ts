import { nanoid } from "nanoid";
import { createEmptyCVData, type CVData } from "@/types";

// The AI CV parser (/api/ai/parse-cv) returns a loose "wire" shape: entries
// without ids, skills as bare strings, and optional/absent arrays. The editor's
// CVData is stricter — every entry needs an id, skills are objects, and all
// section arrays must exist. `parseCVData()` (strict Zod) rejects the wire shape
// outright and falls back to an EMPTY CV, which is exactly how a filled-in
// assistant/import silently landed in a blank editor.
//
// This adapter is the single, forgiving bridge from parser output to CVData.
// Both the "import a CV" flow and the conversational CV Assistant use it so the
// two on-ramps behave identically.

export interface ParsedCv {
  personal?: { fullName?: string; jobTitle?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
  summary?: string;
  experience?: Array<{ company?: string; position?: string; location?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
  education?: Array<{ institution?: string; degree?: string; field?: string; startDate?: string; endDate?: string }>;
  skills?: string[];
  projects?: Array<{ name?: string; role?: string; date?: string; url?: string; description?: string }>;
  languages?: Array<{ name?: string; proficiency?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  hobbies?: string;
}

const PROFICIENCIES = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const;
type Proficiency = (typeof PROFICIENCIES)[number];

export function normalizeProficiency(raw: string | undefined): Proficiency {
  const hit = PROFICIENCIES.find((p) => p.toLowerCase() === (raw ?? "").trim().toLowerCase());
  return hit ?? "Fluent";
}

// A graduate / first-CV order: lead with education, projects and skills rather
// than an empty Work Experience section. Used only when there is no experience.
export const GRADUATE_SECTION_ORDER = [
  "summary", "education", "projects", "skills",
  "experience", "certifications", "languages", "referees", "hobbies",
];

export function toCvData(parsed: unknown): CVData {
  const p = (parsed ?? {}) as ParsedCv;
  // The AI parser is JSON-valid but shape-unreliable: a section can come back
  // as a string, null or a bare object. Never trust it — coerce every section
  // to an array (or a plain object for personal) before mapping, so a bad
  // model response can't crash the editor with a TypeError.
  const arr = (v: unknown): Array<Record<string, unknown>> =>
    Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
  const personal = p.personal && typeof p.personal === "object" && !Array.isArray(p.personal)
    ? (p.personal as Record<string, unknown>)
    : {};
  const empty = createEmptyCVData();
  const built: CVData = {
    ...empty,
    personal: {
      ...empty.personal,
      fullName: String(personal.fullName ?? ""),
      jobTitle: String(personal.jobTitle ?? ""),
      email: String(personal.email ?? ""),
      phone: String(personal.phone ?? ""),
      location: String(personal.location ?? ""),
      linkedin: String(personal.linkedin ?? ""),
      website: String(personal.website ?? ""),
    },
    summary: typeof p.summary === "string" ? p.summary : "",
    experience: arr(p.experience).slice(0, 12).map((e) => ({
      id: nanoid(),
      company: String(e.company ?? ""),
      position: String(e.position ?? ""),
      location: String(e.location ?? ""),
      startDate: String(e.startDate ?? ""),
      endDate: String(e.endDate ?? ""),
      current: !!e.current,
      description: String(e.description ?? ""),
    })),
    education: arr(p.education).slice(0, 8).map((e) => ({
      id: nanoid(),
      institution: String(e.institution ?? ""),
      degree: String(e.degree ?? ""),
      field: String(e.field ?? ""),
      startDate: String(e.startDate ?? ""),
      endDate: String(e.endDate ?? ""),
    })),
    skills: arr(p.skills)
      .map((s) => {
        const name = s && typeof s === "object"
          ? String((s as Record<string, unknown>).name ?? "")
          : String(s ?? "");
        return { id: nanoid(), name, level: 3 as const };
      })
      .filter((sk) => sk.name.trim().length > 0)
      .slice(0, 24),
    projects: arr(p.projects)
      .filter((pr) => String(pr?.name ?? "").trim() || String(pr?.description ?? "").trim())
      .slice(0, 12)
      .map((pr) => ({ id: nanoid(), name: String(pr.name ?? "").trim(), role: String(pr.role ?? "").trim(), date: String(pr.date ?? "").trim(), url: String(pr.url ?? "").trim(), description: String(pr.description ?? "").trim() })),
    languages: arr(p.languages)
      .filter((l) => String(l?.name ?? "").trim())
      .slice(0, 10)
      .map((l) => ({ id: nanoid(), name: String(l.name).trim(), proficiency: normalizeProficiency(String(l.proficiency ?? "")) })),
    certifications: arr(p.certifications)
      .filter((cert) => String(cert?.name ?? "").trim())
      .slice(0, 12)
      .map((cert) => ({ id: nanoid(), name: String(cert.name).trim(), issuer: String(cert.issuer ?? "").trim(), date: String(cert.date ?? "").trim() })),
    hobbies: typeof p.hobbies === "string" ? p.hobbies.trim() : "",
  };

  // Graduate / first-CV: if there's no work history but there is education,
  // projects or skills, lead with those so the CV doesn't open on an empty
  // Work Experience heading. Users can still reorder in the editor.
  if (built.experience.length === 0 && (built.education.length > 0 || built.projects.length > 0 || built.skills.length > 0)) {
    built.sectionOrder = [...GRADUATE_SECTION_ORDER];
  }

  return built;
}
