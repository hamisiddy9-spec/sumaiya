// Templates + SmartFit intelligence — reason about a CV's content density and
// drive the REAL design engine (density + sectionOrder + template style), not
// blind regeneration.
//
// Deterministic and pure:
//   - analyzeFit(data)      — estimate content length from the actual CV and
//     suggest the density that makes it fit well (compact/airy/normal).
//   - applyDirective(text)  — map a user's style request ("make it executive",
//     "it doesn't fit", "too cramped") onto concrete engine settings.
//
// The UI previews the proposed changes and applies them ONLY on confirm —
// the same engine the editor's presets use (components/templates/engine).

import type { CVData } from "@/types";

export type DensityMode = "compact" | "normal" | "airy";

export interface FitAnalysis {
  wordCount: number;
  sectionCount: number;
  length: "short" | "medium" | "long";
  suggestedDensity: DensityMode;
  reason: { en: string; sw: string };
}

export interface SmartFitChange {
  templateId?: string;
  density?: DensityMode;
  sectionOrder?: string[];
  rationale: { en: string; sw: string };
}

/** Count meaningful words in the CV (summary + experience + skills). */
export function cvWordCount(data: CVData): number {
  const texts = [
    data.summary ?? "",
    ...(data.experience ?? []).map((e) => `${e.position} ${e.company} ${e.description}`),
    ...(data.skills ?? []).map((s) => s.name),
    ...(data.education ?? []).map((e) => `${e.degree} ${e.field} ${e.institution}`),
  ];
  return texts.join(" ").split(/\s+/).filter((w) => w.length > 1).length;
}

/** Estimate content length and the density that makes it fit. */
export function analyzeFit(data: CVData): FitAnalysis {
  const wordCount = cvWordCount(data);
  const sectionCount =
    (data.summary?.trim() ? 1 : 0) +
    (data.experience?.length ? 1 : 0) +
    (data.education?.length ? 1 : 0) +
    (data.skills?.length ? 1 : 0) +
    ((data.projects ?? []).length ? 1 : 0) +
    ((data.certifications ?? []).length ? 1 : 0) +
    ((data.languages ?? []).length ? 1 : 0);
  const length = wordCount < 120 ? "short" : wordCount > 200 ? "long" : "medium";
  const suggestedDensity: DensityMode = length === "long" ? "compact" : length === "short" ? "airy" : "normal";
  const reason =
    length === "long"
      ? { en: `Your CV is content-heavy (~${wordCount} words). Compact density keeps it professional and closer to one page.`, sw: `CV yako ina maudhui mengi (~${wordCount} maneno). Msongamano wa compact unaiweka kitaalamu na karibu na ukurasa mmoja.` }
      : length === "short"
        ? { en: `Your CV is light (~${wordCount} words). Airy density makes it look intentional rather than empty.`, sw: `CV yako ni nyepesi (~${wordCount} maneno). Msongamano wa airy unafanya ionekane ya makusudi badala ya tupu.` }
        : { en: `Your CV is balanced (~${wordCount} words). Normal density fits well.`, sw: `CV yako ni sawia (~${wordCount} maneno). Msongamano wa normal unafaa.` };
  return { wordCount, sectionCount, length, suggestedDensity, reason };
}

// Sections to drop when the user says the CV doesn't fit — the low-priority
// extras that rarely hurt to remove from the main flow.
const TRIM_ORDER = ["summary", "experience", "education", "skills", "certifications", "languages", "projects", "achievements", "volunteer", "references", "hobbies"];

/** Map a style directive onto concrete engine settings. */
export function applyDirective(directive: string, current: { templateId?: string; density?: DensityMode; data: CVData }): SmartFitChange | null {
  const d = directive.toLowerCase();
  const fit = analyzeFit(current.data);

  if (/\b(executive|leadership|senior|powerful|board|professional)\b/.test(d)) {
    const templateId = "executive-one";
    return {
      templateId,
      density: fit.length === "long" ? "compact" : "normal",
      rationale: {
        en: "Executive style: centered serif template, tightened to read as senior leadership.",
        sw: "Mtindo wa uongozi: templeti ya serif iliyo katikati, iliyobana ili isomeke kama uongozi wa juu.",
      },
    };
  }
  if (/\b(modern|tech|developer|engineer|digital)\b/.test(d)) {
    return {
      templateId: "silicon-pro",
      density: fit.length === "long" ? "compact" : fit.length === "short" ? "normal" : "normal",
      rationale: {
        en: "Modern tech look: clean lines, strong structure, skill-forward layout.",
        sw: "Mtindo wa kisasa wa teknolojia: mistari safi, muundo imara, ujuzi mbele.",
      },
    };
  }
  if (/\b(creative|design|colorful|bold|unique)\b/.test(d)) {
    return {
      templateId: "aurora-edge",
      density: "airy",
      rationale: {
        en: "Creative direction: bolder visual identity with room to breathe.",
        sw: "Mwelekeo wa ubunifu: utambulisho wenye rangi na nafasi ya kupumua.",
      },
    };
  }
  if (/\b(minimal|simple|clean|plain)\b/.test(d)) {
    return {
      templateId: "nordic-minimal",
      density: "airy",
      rationale: {
        en: "Minimal direction: a calm, uncluttered layout that lets facts speak.",
        sw: "Mwelekeo wa minimal: mpangilio tulivu usiojaa unaoacha ukweli uzungumze.",
      },
    };
  }
  if (/\b(classic|traditional|formal|conservative)\b/.test(d)) {
    return {
      templateId: "victoria",
      density: "normal",
      rationale: {
        en: "Classic direction: elegant serif, familiar and respected by recruiters.",
        sw: "Mwelekeo wa kitamaduni: serif ya kifahari, inayojulikana na kuheshimiwa na waajiri.",
      },
    };
  }
  // Fit complaints → reason about density, not style.
  if (/\b(doesn'?t fit|does not fit|cramped|too long|too much|one page|two pages|overflow|tight)\b/.test(d)) {
    return {
      density: fit.length === "short" ? "normal" : "compact",
      sectionOrder: TRIM_ORDER.filter((s) => s === "summary" || s === "experience" || s === "education" || s === "skills" || s === "certifications" || s === "languages" || s === "projects"),
      rationale: {
        en: "Fitting it in: compact density plus keeping only the core sections (summary, experience, education, skills, certifications, languages, projects).",
        sw: "Kulinganisha ukubwa: msongamano wa compact pamoja na sehemu za msingi pekee (summary, experience, education, skills, certifications, languages, projects).",
      },
    };
  }
  if (/\b(too empty|sparse|too little|barely|lots of space|short page)\b/.test(d)) {
    return {
      density: "airy",
      rationale: {
        en: "Balancing the page: airy spacing fills the page gracefully.",
        sw: "Kusawazisha ukurasa: nafasi za airy zinajaza ukurasa kwa uzuri.",
      },
    };
  }
  return null;
}
