// Template Family Pairings — CV ↔ Cover Letter ↔ Business Card
// Templates in the same family share visual DNA (color schemes, typography, layout philosophy)
// This lets users build a cohesive "application kit" with one aesthetic
import { TEMPLATES } from "@/types";

export interface TemplateFamily {
  id: string;
  name: string;
  cvTemplates: string[];
  coverLetterTemplates: string[];
  businessCardTemplates: string[];
}

export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  {
    id: "nakuru",
    name: "Nakuru",
    cvTemplates: ["nakuru"],
    coverLetterTemplates: ["modern"],
    businessCardTemplates: ["classic"],
  },
  {
    id: "executive",
    name: "Executive",
    cvTemplates: ["executive-one", "oxford", "imperial", "titan", "monarch"],
    coverLetterTemplates: ["executive-cl", "classic"],
    businessCardTemplates: ["classic", "minimal"],
  },
  {
    id: "creative",
    name: "Creative",
    cvTemplates: ["zanzibar", "canvas-magazine", "narrative", "studio", "tokyo-grid", "muse", "nova", "horizon"],
    coverLetterTemplates: ["creative-cl", "bold-cl", "startup-cl"],
    businessCardTemplates: ["modern", "minimal"],
  },
  {
    id: "modern",
    name: "Modern",
    cvTemplates: ["meridian", "apex", "vertex", "aurora-edge", "silicon-pro", "nordic-minimal", "metro"],
    coverLetterTemplates: ["modern", "tech-cl", "clean-cl"],
    businessCardTemplates: ["modern", "minimal"],
  },
  {
    id: "classic",
    name: "Classic",
    cvTemplates: ["nile", "victoria", "kilimanjaro", "serengeti", "athens", "geneva"],
    coverLetterTemplates: ["classic", "academic-cl"],
    businessCardTemplates: ["classic", "minimal"],
  },
  {
    id: "sidebar",
    name: "Sidebar",
    cvTemplates: ["ubuntu", "mombasa", "kibo", "lodge", "brisk", "chrome", "metro", "aurora-edge"],
    coverLetterTemplates: ["sidebar-cl", "modern"],
    businessCardTemplates: ["modern"],
  },
  {
    id: "minimal",
    name: "Minimal",
    cvTemplates: ["sahara", "berlin", "alpine", "stripe", "rail", "inset", "ribbon", "edge", "axis", "ledger", "mono-cv", "clean-cv"],
    coverLetterTemplates: ["minimal-cl", "clean-cl"],
    businessCardTemplates: ["minimal", "classic"],
  },
  {
    id: "african",
    name: "African Heritage",
    cvTemplates: ["nairobi", "savanna", "ubuntu", "serengeti", "zanzibar", "sahara",
      "ruwenzori", "turkana", "aberdare", "samburu", "laikipia", "marsabit",
      "malindi", "watamu", "diani", "lamu", "mombasa", "kilimanjaro", "kibo",
      "nakuru", "busia", "homabay", "migori", "kisii", "kericho", "kitale",
      "machakos", "kajiado", "narok", "voi", "wajir", "garissa", "moyale",
      "tanganyika", "bangweulu", "okavango", "kariba", "rufiji", "ruvuma",
      "kagera", "lukuga", "tana", "ewaso", "galana", "sabaki", "athi",
      "awash", "baro", "tekeze", "mareb", "gash"],
    coverLetterTemplates: ["classic", "modern"],
    businessCardTemplates: ["classic", "modern"],
  },
];

export function getFamilyForCv(cvTemplateId: string): TemplateFamily | null {
  return TEMPLATE_FAMILIES.find(f => f.cvTemplates.includes(cvTemplateId)) ?? null;
}

/**
 * Direct kit pairings for the premium/contemporary flagship CV templates —
 * each maps to the matching cover letter and business card so "build the kit"
 * carries the look across all three documents.
 */
export const FLAGSHIP_KIT: Record<string, { cl: string; bc: string }> = {
  rift:      { cl: "rift-cl",   bc: "bento-card" },
  zahabu:    { cl: "zahabu-cl", bc: "neon-card" },
  nuru:      { cl: "zahabu-cl", bc: "neon-card" },
  pemba:     { cl: "classic",   bc: "bento-card" },
  malachite: { cl: "rift-cl",   bc: "bento-card" },
  coral:     { cl: "vibe-cl",   bc: "bento-card" },
  kioo:      { cl: "zahabu-cl", bc: "neon-card" },
  bento:     { cl: "vibe-cl",   bc: "bento-card" },
  zege:      { cl: "zege-cl",   bc: "zege-card" },
  console:   { cl: "riso-cl",   bc: "zege-card" },
  riso:      { cl: "riso-cl",   bc: "riso-card" },
  vibe:      { cl: "vibe-cl",   bc: "bento-card" },
  neon:      { cl: "zahabu-cl", bc: "neon-card" },
};

/**
 * Fallback kit by the CV template's visual `style`, so ALL ~250 CVs get a
 * thematically-matched cover letter + business card (not a generic default)
 * even when they aren't one of the named flagships.
 */
const STYLE_KIT: Record<string, { cl: string; bc: string }> = {
  sidebar:  { cl: "sidebar-cl",  bc: "modern" },
  header:   { cl: "modern",      bc: "corporate" },
  minimal:  { cl: "minimal-cl",  bc: "minimal" },
  creative: { cl: "creative-cl", bc: "creative-bc" },
  classic:  { cl: "classic",     bc: "classic" },
};

function cvStyle(cvTemplateId: string): string | undefined {
  return TEMPLATES.find((t) => t.id === cvTemplateId)?.style;
}

/** The cover-letter template that matches a given CV template (kit pairing). */
export function getCoverLetterForCv(cvTemplateId: string): string {
  if (FLAGSHIP_KIT[cvTemplateId]) return FLAGSHIP_KIT[cvTemplateId].cl;
  const style = cvStyle(cvTemplateId);
  if (style && STYLE_KIT[style]) return STYLE_KIT[style].cl;
  const fam = getFamilyForCv(cvTemplateId);
  return fam?.coverLetterTemplates[0] ?? "classic";
}

/** The business-card template that matches a given CV template (kit pairing). */
export function getBusinessCardForCv(cvTemplateId: string): string {
  if (FLAGSHIP_KIT[cvTemplateId]) return FLAGSHIP_KIT[cvTemplateId].bc;
  const style = cvStyle(cvTemplateId);
  if (style && STYLE_KIT[style]) return STYLE_KIT[style].bc;
  const fam = getFamilyForCv(cvTemplateId);
  return fam?.businessCardTemplates[0] ?? "classic";
}

export function getFamilyForCoverLetter(clTemplateId: string): TemplateFamily | null {
  return TEMPLATE_FAMILIES.find(f => f.coverLetterTemplates.includes(clTemplateId)) ?? null;
}

export function getSuggestedFamilyForCv(cvTemplateId: string): TemplateFamily | null {
  // If the CV template belongs to a family, suggest that family's cover letter
  return getFamilyForCv(cvTemplateId);
}

export function getPairingTip(cvTemplateId: string, cvTemplateName: string): string | null {
  const family = getFamilyForCv(cvTemplateId);
  if (!family) return null;
  const clNames = family.coverLetterTemplates.map(id => {
    const nameMap: Record<string, string> = {
      "classic": "Classic", "modern": "Modern", "executive-cl": "Executive",
      "minimal-cl": "Minimal", "bold-cl": "Bold", "creative-cl": "Creative",
      "startup-cl": "Startup", "academic-cl": "Academic", "tech-cl": "Tech",
      "clean-cl": "Clean", "sidebar-cl": "Sidebar",
    };
    return nameMap[id] ?? id;
  });
  if (clNames.length === 0) return null;
  return `${cvTemplateName} pairs well with ${clNames[0]} cover letter${clNames.length > 1 ? `, ${clNames[1]}` : ""}`;
}
