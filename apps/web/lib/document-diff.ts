// Document diff — deterministic before/after comparison for AI-proposed edits.
//
// The trust mechanic (directive §10): the user must SEE exactly what changes
// before accepting. This module produces the section-level diff the chat card
// renders (Before / After / Accept / Reject / Edit). Pure, no AI, no DB.

import type { CVData } from "@/types";

export interface DiffSection {
  /** Stable id: "summary" | "experience" | "skills" | "education" | "personal". */
  sectionId: string;
  label: { en: string; sw: string };
  changed: boolean;
  /** Lines as they were. */
  before: string[];
  /** Lines as proposed. */
  after: string[];
}

const SECTION_LABELS: Record<DiffSection["sectionId"], { en: string; sw: string }> = {
  summary: { en: "Summary", sw: "Muhtasari" },
  experience: { en: "Experience", sw: "Uzoefu" },
  skills: { en: "Skills", sw: "Ujuzi" },
  education: { en: "Education", sw: "Elimu" },
  personal: { en: "Personal details", sw: "Taarifa binafsi" },
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** Render one experience entry as diff lines (position @ company + description bullets). */
function experienceLines(cv: CVData): string[] {
  return cv.experience.flatMap((e) => [
    `${e.position} @ ${e.company} (${e.startDate}${e.endDate ? ` — ${e.endDate}` : ""})`,
    ...e.description.split("\n").map((l) => l.trim()).filter(Boolean),
  ]);
}

function skillsLines(cv: CVData): string[] {
  return cv.skills.map((s) => (typeof s === "string" ? s : s.name));
}

function educationLines(cv: CVData): string[] {
  return cv.education.map((e) => `${e.degree} — ${e.field} @ ${e.institution}`.trim());
}

function personalLines(cv: CVData): string[] {
  const p = cv.personal;
  const out: string[] = [];
  if (p.fullName) out.push(`Name: ${p.fullName}`);
  if (p.jobTitle) out.push(`Title: ${p.jobTitle}`);
  if (p.email) out.push(`Email: ${p.email}`);
  if (p.phone) out.push(`Phone: ${p.phone}`);
  if (p.location) out.push(`Location: ${p.location}`);
  return out;
}

const COLLECTORS: Array<{ id: DiffSection["sectionId"]; get: (cv: CVData) => string[] }> = [
  { id: "summary", get: (cv) => (cv.summary ? [cv.summary] : []) },
  { id: "experience", get: experienceLines },
  { id: "skills", get: skillsLines },
  { id: "education", get: educationLines },
  { id: "personal", get: personalLines },
];

/**
 * Section-level diff between two CV states. `changed` is true when the
 * normalized line sets differ. Order of entries matters (a reorder is a
 * change — the user should see it).
 */
export function diffCv(before: CVData, after: CVData): DiffSection[] {
  return COLLECTORS.map(({ id, get }) => {
    const b = get(before).map(norm);
    const a = get(after).map(norm);
    const changed = b.length !== a.length || b.some((line, i) => line !== a[i]);
    return {
      sectionId: id,
      label: SECTION_LABELS[id],
      changed,
      before: get(before),
      after: get(after),
    };
  });
}

/** Count of changed sections — for the "3 sections will change" chip. */
export function changedSectionCount(diff: DiffSection[]): number {
  return diff.filter((d) => d.changed).length;
}

/** True when two CV states are byte-identical in every diffable section. */
export function cvUnchanged(diff: DiffSection[]): boolean {
  return diff.every((d) => !d.changed);
}
