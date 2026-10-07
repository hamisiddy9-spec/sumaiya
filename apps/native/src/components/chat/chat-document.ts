/**
 * T5 · The document card's *content*, as data (§3.2/§3.4).
 *
 * The card states **what she used and what she could not find**
 * (`Nilichotumia: jina, uzoefu wa mauzo, ujuzi 9, elimu. Nilichokosa: namba ya
 * simu.`) — that sentence is the whole reason the card exists: it is the
 * difference between a document you are handed and a document you can check.
 *
 * So it is computed from the CV's own fields, never written by hand and never
 * guessed. A field that is absent is named as missing; when nothing is missing it
 * says so instead of printing an empty list.
 */
import type { CVData } from "@sumaiya/types";

export interface DocProvenance {
  /** What the document was built from, in the order a person would say it. */
  used: string[];
  /** What she looked for and did not find. Empty is a real answer. */
  missing: string[];
}

const EN: Record<string, string> = {
  name: "name",
  summary: "summary",
  salesExperience: "sales experience",
  experience: "work experience",
  skills: "skills",
  education: "education",
  languages: "languages",
  certifications: "certificates",
  phone: "phone number",
  email: "email",
  location: "location",
  linkedin: "LinkedIn",
};

const SW: Record<string, string> = {
  name: "jina",
  summary: "muhtasari",
  salesExperience: "uzoefu wa mauzo",
  experience: "uzoefu wa kazi",
  skills: "ujuzi",
  education: "elimu",
  languages: "lugha",
  certifications: "vyeti",
  phone: "namba ya simu",
  email: "barua pepe",
  location: "mahali ulipo",
  linkedin: "LinkedIn",
};

const label = (key: string, lang: "en" | "sw") => (lang === "sw" ? SW[key] : EN[key]) ?? key;

/** Her line, in her voice, from the CV's real fields. */
export function cvProvenanceLines(cv: CVData | undefined, lang: "en" | "sw"): DocProvenance {
  const p = cv?.personalInfo;
  const experience = cv?.experience ?? [];
  const skills = cv?.skills ?? [];
  const education = cv?.education ?? [];
  const used: string[] = [];
  const missing: string[] = [];

  if (p?.fullName?.trim()) used.push(label("name", lang));
  else missing.push(label("name", lang));

  if (cv?.summary?.trim()) used.push(label("summary", lang));

  if (experience.length) {
    // "uzoefu wa mauzo" when the real titles say so — the honest special case
    // the mockup shows, derived from the data rather than assumed.
    const sales = experience.some((e) => /mauzo|sales|huduma kwa mteja|customer/i.test(`${e.title ?? ""} ${e.description ?? ""}`));
    used.push(label(sales ? "salesExperience" : "experience", lang));
  } else {
    missing.push(label("experience", lang));
  }

  if (skills.length) used.push(`${label("skills", lang)} ${skills.length}`);
  else missing.push(label("skills", lang));

  if (education.length) used.push(label("education", lang));

  const languages = cv?.languages ?? [];
  if (languages.length) used.push(label("languages", lang));
  const certs = cv?.certifications ?? [];
  if (certs.length) used.push(label("certifications", lang));

  if (!p?.phone?.trim()) missing.push(label("phone", lang));
  if (!p?.email?.trim()) missing.push(label("email", lang));
  if (!p?.location?.trim()) missing.push(label("location", lang));

  return { used, missing };
}

/** The one sentence the card renders, assembled here so both platforms match. */
export function provenanceSentence(cv: CVData | undefined, lang: "en" | "sw"): string {
  const { used, missing } = cvProvenanceLines(cv, lang);
  const usedPart =
    lang === "sw"
      ? `Nilichotumia: ${used.join(", ")}.`
      : `What I used: ${used.join(", ")}.`;
  const missingPart = missing.length
    ? lang === "sw"
      ? `Nilichokosa: ${missing.join(", ")}.`
      : `What I couldn't find: ${missing.join(", ")}.`
    : lang === "sw"
      ? "Sikukosa kitu muhimu."
      : "I didn't miss anything important.";
  return `${usedPart} ${missingPart}`;
}
