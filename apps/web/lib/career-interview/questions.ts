// AI Career Interview — structured profile-building question bank.
//
// Deterministic, no AI, no DB: a fixed set of questions that map one-to-one
// onto Career Profile fields. The interview UI (components/interview/
// career-interview-client.tsx) walks these one at a time; answers are applied
// with applyAnswer() which follows the same non-destructive philosophy as the
// rest of the career-profile machinery:
//   - scalars (name, title, location, summary) are set directly
//   - list sections (skills, languages, certifications, education) MERGE by
//     name — existing entries are preserved, duplicates are not added
//   - experience is built entry-by-entry (role → company → description)
//
// Facts typed by the user are user-authored → they are confirmed by
// definition; factMeta gets stamped { source: "interview", status: "confirmed" }.

import { nanoid } from "nanoid";
import type {
  CareerProfile,
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  SkillEntry,
} from "@/types";

export interface InterviewQuestion {
  id: string;
  /** CareerProfile field(s) this question writes to. */
  target: string;
  /** Input kind the UI should render. */
  input: "text" | "textarea" | "list";
  prompt: { en: string; sw: string };
  placeholder: { en: string; sw: string };
  /** Shown under the prompt as a hint. */
  hint?: { en: string; sw: string };
  /** Skippable by default; only identity fields are mandatory. */
  optional: boolean;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "fullName",
    target: "personal.fullName",
    input: "text",
    prompt: { en: "What's your full name?", sw: "Jina lako kamili ni nani?" },
    placeholder: { en: "e.g. Jane Mwangi", sw: "mf. Jane Mwangi" },
    optional: false,
  },
  {
    id: "jobTitle",
    target: "personal.jobTitle",
    input: "text",
    prompt: { en: "What role are you targeting?", sw: "Unafanya kazi gani unayolenga?" },
    placeholder: { en: "e.g. Software Engineer", sw: "mf. Software Engineer" },
    hint: { en: "The job title you want your CV to aim at.", sw: "Kazi unayotaka CV yako ilenge." },
    optional: false,
  },
  {
    id: "location",
    target: "personal.location",
    input: "text",
    prompt: { en: "Where are you based?", sw: "Unaishi wapi?" },
    placeholder: { en: "e.g. Dar es Salaam, Tanzania", sw: "mf. Dar es Salaam, Tanzania" },
    optional: true,
  },
  {
    id: "summary",
    target: "summary",
    input: "textarea",
    prompt: { en: "In 2–3 sentences, what's your professional story?", sw: "Kwa sentensi 2–3, hadithi yako ya kitaaluma ni ipi?" },
    placeholder: {
      en: "e.g. Software engineer with 5+ years building web platforms...",
      sw: "mf. Software engineer mwenye uzoefu wa miaka 5+ katika kujenga majukwaa ya wavuti...",
    },
    hint: { en: "Your skills, your strengths, what you've achieved.", sw: "Ujuzi wako, nguvu zako, na mafanikio yako." },
    optional: true,
  },
  {
    id: "skills",
    target: "skills",
    input: "list",
    prompt: { en: "List your top skills (comma-separated).", sw: "Orodhesha ujuzi wako mkuu (utenganishe kwa koma)." },
    placeholder: { en: "e.g. React, Node.js, PostgreSQL, Excel", sw: "mf. React, Node.js, PostgreSQL, Excel" },
    optional: true,
  },
  {
    id: "expRole",
    target: "experience[0].position",
    input: "text",
    prompt: { en: "What's your most recent job title?", sw: "Kazi yako ya hivi karibuni ni nini?" },
    placeholder: { en: "e.g. Frontend Developer", sw: "mf. Frontend Developer" },
    optional: true,
  },
  {
    id: "expCompany",
    target: "experience[0].company",
    input: "text",
    prompt: { en: "Which company was that at?", sw: "Ulikuwa kampuni gani?" },
    placeholder: { en: "e.g. TechCo Ltd", sw: "mf. TechCo Ltd" },
    optional: true,
  },
  {
    id: "expDescription",
    target: "experience[0].description",
    input: "textarea",
    prompt: { en: "What did you do there? (2–3 short bullets)", sw: "Ulikuwa unafanya nini? (maelezo mafupi 2–3)" },
    placeholder: { en: "e.g. Built React dashboards used by 2,000 customers; cut page load by 40%.", sw: "mf. Niliunda dashboards za React zinazotumiwa na wateja 2,000; nikapunguza mzigo wa ukurasa kwa 40%." },
    hint: { en: "Focus on what you achieved, with numbers where possible.", sw: "Angazia mafanikio yako, ukitumia namba inapowezekana." },
    optional: true,
  },
  {
    id: "education",
    target: "education",
    input: "text",
    prompt: { en: "Your highest education (degree, field, institution).", sw: "Elimu yako ya juu (shahada, fani, chuo)." },
    placeholder: { en: "e.g. BSc, Computer Science, University of Dar es Salaam", sw: "mf. BSc, Computer Science, Chuo Kikuu cha Dar es Salaam" },
    optional: true,
  },
  {
    id: "languages",
    target: "languages",
    input: "list",
    prompt: { en: "Languages you speak (comma-separated).", sw: "Lugha unazozungumza (utenganishe kwa koma)." },
    placeholder: { en: "e.g. Swahili, English, French", sw: "mf. Kiswahili, Kiingereza, Kifaransa" },
    optional: true,
  },
  {
    id: "certifications",
    target: "certifications",
    input: "list",
    prompt: { en: "Certifications (comma-separated, optional).", sw: "Vyeti vyako (utenganishe kwa koma, hiari)." },
    placeholder: { en: "e.g. AWS Certified Cloud Practitioner, Google Analytics", sw: "mf. AWS Certified Cloud Practitioner, Google Analytics" },
    optional: true,
  },
];

/** Is a question already answered in this profile? */
export function isQuestionAnswered(profile: CareerProfile, q: InterviewQuestion): boolean {
  switch (q.id) {
    case "fullName": return !!profile.personal.fullName.trim();
    case "jobTitle": return !!profile.personal.jobTitle.trim();
    case "location": return !!profile.personal.location.trim();
    case "summary": return !!profile.summary.trim();
    case "skills": return profile.skills.length > 0;
    case "expRole": return profile.experience[0]?.position.trim().length > 0;
    case "expCompany": return profile.experience[0]?.company.trim().length > 0;
    case "expDescription": return profile.experience[0]?.description.trim().length > 0;
    case "education": return profile.education.length > 0;
    case "languages": return profile.languages.length > 0;
    case "certifications": return profile.certifications.length > 0;
    default: return false;
  }
}

/** Current value of a question's target field(s), for pre-filling the input. */
export function readAnswer(profile: CareerProfile, q: InterviewQuestion): string {
  switch (q.id) {
    case "fullName": return profile.personal.fullName;
    case "jobTitle": return profile.personal.jobTitle;
    case "location": return profile.personal.location;
    case "summary": return profile.summary;
    case "skills": return profile.skills.map((s) => s.name).join(", ");
    case "expRole": return profile.experience[0]?.position ?? "";
    case "expCompany": return profile.experience[0]?.company ?? "";
    case "expDescription": return profile.experience[0]?.description ?? "";
    case "education": {
      const e = profile.education[0];
      if (!e) return "";
      return [e.degree, e.field, e.institution].filter(Boolean).join(", ");
    }
    case "languages": return profile.languages.map((l) => l.name).join(", ");
    case "certifications": return profile.certifications.map((c) => c.name).join(", ");
    default: return "";
  }
}

/** Interview progress: answered/total for a given profile. */
export function interviewProgress(profile: CareerProfile): { answered: number; total: number } {
  const answered = INTERVIEW_QUESTIONS.filter((q) => isQuestionAnswered(profile, q)).length;
  return { answered, total: INTERVIEW_QUESTIONS.length };
}

function freshId(): string {
  return nanoid();
}

/** Parse a comma-separated list into trimmed, de-duplicated names. */
export function parseList(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of value.split(",")) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      out.push(name);
    }
  }
  return out;
}

/** Parse "Degree, Field, Institution" → education entry (best-effort). */
export function parseEducation(value: string): Pick<EducationEntry, "degree" | "field" | "institution"> {
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    degree: parts[0] ?? "",
    field: parts[1] ?? "",
    institution: parts[2] ?? "",
  };
}

/** Ensure experience[0] exists (creates a blank current entry when needed). */
function ensureFirstExperience(profile: CareerProfile): ExperienceEntry {
  if (profile.experience.length === 0) {
    const entry: ExperienceEntry = {
      id: freshId(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: true,
      description: "",
    };
    profile.experience.push(entry);
  }
  return profile.experience[0];
}

function stamp(profile: CareerProfile, ids: string[]) {
  if (!profile.factMeta) profile.factMeta = {};
  const now = new Date().toISOString();
  for (const id of ids) {
    if (id) profile.factMeta[id] = { source: "interview", status: "confirmed", confidence: 1, updatedAt: now };
  }
}

/**
 * Apply an answer to a copy of the profile. Returns a NEW profile object
 * (the input is not mutated). List answers merge by name — never duplicate,
 * never delete what's already there.
 */
export function applyAnswer(profile: CareerProfile, qid: string, value: string): CareerProfile {
  const out: CareerProfile = {
    ...profile,
    personal: { ...profile.personal },
    experience: profile.experience.map((e) => ({ ...e })),
    education: profile.education.map((e) => ({ ...e })),
    skills: profile.skills.map((s) => ({ ...s })),
    languages: profile.languages.map((l) => ({ ...l })),
    certifications: profile.certifications.map((c) => ({ ...c })),
    factMeta: { ...(profile.factMeta ?? {}) },
  };
  const v = value.trim();

  switch (qid) {
    case "fullName": out.personal.fullName = v; stamp(out, []); break;
    case "jobTitle": out.personal.jobTitle = v; stamp(out, []); break;
    case "location": out.personal.location = v; stamp(out, []); break;
    case "summary": out.summary = v; stamp(out, []); break;

    case "skills": {
      const existing = new Set(out.skills.map((s) => s.name.toLowerCase()));
      const added: string[] = [];
      for (const name of parseList(v)) {
        if (!existing.has(name.toLowerCase())) {
          const entry: SkillEntry = { id: freshId(), name, level: 3 };
          out.skills.push(entry);
          added.push(entry.id);
        }
      }
      stamp(out, added);
      break;
    }

    case "expRole": {
      const e = ensureFirstExperience(out);
      e.position = v;
      stamp(out, [e.id]);
      break;
    }
    case "expCompany": {
      const e = ensureFirstExperience(out);
      e.company = v;
      stamp(out, [e.id]);
      break;
    }
    case "expDescription": {
      const e = ensureFirstExperience(out);
      e.description = v;
      stamp(out, [e.id]);
      break;
    }

    case "education": {
      const parsed = parseEducation(v);
      if (!parsed.degree && !parsed.institution) break;
      const exists = out.education.some(
        (e) =>
          e.degree.toLowerCase() === parsed.degree.toLowerCase() &&
          e.institution.toLowerCase() === parsed.institution.toLowerCase(),
      );
      if (!exists) {
        const entry: EducationEntry = {
          id: freshId(),
          institution: parsed.institution,
          degree: parsed.degree,
          field: parsed.field,
          startDate: "",
          endDate: "",
        };
        out.education.push(entry);
        stamp(out, [entry.id]);
      }
      break;
    }

    case "languages": {
      const existing = new Set(out.languages.map((l) => l.name.toLowerCase()));
      const added: string[] = [];
      for (const name of parseList(v)) {
        if (!existing.has(name.toLowerCase())) {
          const entry: LanguageEntry = { id: freshId(), name, proficiency: "Fluent" };
          out.languages.push(entry);
          added.push(entry.id);
        }
      }
      stamp(out, added);
      break;
    }

    case "certifications": {
      const existing = new Set(out.certifications.map((c) => c.name.toLowerCase()));
      const added: string[] = [];
      for (const name of parseList(v)) {
        if (!existing.has(name.toLowerCase())) {
          const entry: CertificationEntry = { id: freshId(), name, issuer: "", date: "" };
          out.certifications.push(entry);
          added.push(entry.id);
        }
      }
      stamp(out, added);
      break;
    }
  }

  return out;
}
