// Engine preset configs — combine density + sectionOrder + display options
// into named modes that the editor can apply with a single click.

import type { DensityMode } from "./tokens";

export interface EnginePreset {
  label: string;
  description: string;
  density: DensityMode;
  sectionOrder: string[];
  icon: string;
}

export const ENGINE_PRESETS: Record<string, EnginePreset> = {
  ats: {
    label: "ATS Safe",
    description: "Compact, keyword-rich, machine-readable",
    density: "compact",
    sectionOrder: ["summary", "experience", "education", "skills", "certifications", "languages"],
    icon: "🤖",
  },
  executive: {
    label: "Executive",
    description: "Spacious, authoritative, prestigious order",
    density: "airy",
    sectionOrder: ["summary", "experience", "education", "certifications", "skills", "referees"],
    icon: "💼",
  },
  creative: {
    label: "Creative",
    description: "Skills-first, personality-forward layout",
    density: "normal",
    sectionOrder: ["summary", "skills", "experience", "education", "hobbies"],
    icon: "🎨",
  },
  student: {
    label: "Entry Level",
    description: "Education-first for early-career applicants",
    density: "normal",
    sectionOrder: ["summary", "education", "skills", "experience", "certifications"],
    icon: "🎓",
  },
};
