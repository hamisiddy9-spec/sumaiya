import type { Lang } from "@/lib/i18n/translations";

/**
 * Localized CV section headings for the document templates.
 *
 * Templates hardcode English section labels ("Work Experience", "Education", …).
 * This maps each heading *concept* to en/sw so a template rendered with lang="sw"
 * shows Swahili headings. Keys are intentionally broad — several English variants
 * ("Work Experience" / "Experience" / "Employment") collapse to one concept.
 *
 * `lang` defaults to "en" everywhere it's used, so existing render sites that
 * don't pass a language keep their English headings unchanged.
 */
const HEADINGS: Record<string, { en: string; sw: string }> = {
  summary:        { en: "Professional Summary", sw: "Muhtasari" },
  profile:        { en: "Profile",              sw: "Wasifu" },
  about:          { en: "About",                sw: "Kuhusu" },
  experience:     { en: "Work Experience",      sw: "Uzoefu wa Kazi" },
  employment:     { en: "Employment",           sw: "Ajira" },
  education:      { en: "Education",             sw: "Elimu" },
  skills:         { en: "Skills",               sw: "Ujuzi" },
  expertise:      { en: "Expertise",            sw: "Ujuzi" },
  languages:      { en: "Languages",            sw: "Lugha" },
  certifications: { en: "Certifications",       sw: "Vyeti" },
  courses:        { en: "Courses",              sw: "Kozi" },
  projects:       { en: "Projects",             sw: "Miradi" },
  interests:      { en: "Interests",            sw: "Shughuli za Ziada" },
  hobbies:        { en: "Hobbies",              sw: "Shughuli za Ziada" },
  references:     { en: "References",           sw: "Wadhamini" },
  awards:         { en: "Awards",               sw: "Tuzo" },
  achievements:   { en: "Achievements",         sw: "Mafanikio" },
  volunteering:   { en: "Volunteering",         sw: "Kujitolea" },
  publications:   { en: "Publications",         sw: "Machapisho" },
  contact:        { en: "Contact",              sw: "Mawasiliano" },
  details:        { en: "Details",              sw: "Maelezo" },
};

export type CvHeadingKey = keyof typeof HEADINGS;

/** Returns a `{ key: "Localized Heading" }` lookup for the given language. */
export function cvHeadings(lang: Lang = "en"): Record<CvHeadingKey, string> {
  const out = {} as Record<CvHeadingKey, string>;
  for (const key in HEADINGS) {
    out[key as CvHeadingKey] = HEADINGS[key][lang === "sw" ? "sw" : "en"];
  }
  return out;
}
