/**
 * Document orchestration for the native engine.
 *
 * Faithful in spirit to the web's engine/document-engine.ts, with one honest
 * difference: the native app's CVData has no `mode` / `density` / `sectionOrder`
 * fields yet (those are web editor features), so the resolution chain here is
 *   global defaults  →  template personality
 * The moment the native app ships per-CV density or a mode preset, they layer in
 * exactly where the web does — highest priority — via resolveDocument's second
 * argument, and every template picks the change up for free.
 */

import type { DensityMode } from "./tokens";
import type { ExperienceVariant, HobbiesDisplay, SkillDisplay } from "./types";

export interface DocumentConfig {
  density: DensityMode;
  experienceVariant: ExperienceVariant;
  skillDisplay: SkillDisplay;
  showTimeline: boolean;
  hobbiesDisplay: HobbiesDisplay;
}

/** What makes each template feel like itself. */
export interface TemplatePersonality {
  density?: DensityMode;
  experienceVariant?: ExperienceVariant;
  skillDisplay?: SkillDisplay;
  showTimeline?: boolean;
  hobbiesDisplay?: HobbiesDisplay;
}

/** Explicit user choices that outrank the template's personality. */
export type DocumentOverrides = Omit<TemplatePersonality, "hobbiesDisplay"> & {
  hobbiesDisplay?: HobbiesDisplay;
};

export const GLOBAL_DEFAULTS: DocumentConfig = {
  density: "normal",
  experienceVariant: "default",
  skillDisplay: "bar",
  showTimeline: false,
  hobbiesDisplay: "chips",
};

export const VALID_EXPERIENCE_VARIANTS: ExperienceVariant[] = [
  "default",
  "card",
  "compact",
  "timeline-v2",
  "table",
];
export const VALID_SKILL_DISPLAYS: SkillDisplay[] = ["bar", "dot", "chip", "grid", "tag-rated"];

export function resolveDocument(
  personality: TemplatePersonality = {},
  overrides: DocumentOverrides = {},
): DocumentConfig {
  const resolved: DocumentConfig = { ...GLOBAL_DEFAULTS };

  if (personality.density) resolved.density = personality.density;
  if (personality.experienceVariant) resolved.experienceVariant = personality.experienceVariant;
  if (personality.skillDisplay) resolved.skillDisplay = personality.skillDisplay;
  if (personality.showTimeline != null) resolved.showTimeline = personality.showTimeline;
  if (personality.hobbiesDisplay) resolved.hobbiesDisplay = personality.hobbiesDisplay;

  if (overrides.density) resolved.density = overrides.density;
  if (overrides.experienceVariant) resolved.experienceVariant = overrides.experienceVariant;
  if (overrides.skillDisplay) resolved.skillDisplay = overrides.skillDisplay;
  if (overrides.showTimeline != null) resolved.showTimeline = overrides.showTimeline;
  if (overrides.hobbiesDisplay) resolved.hobbiesDisplay = overrides.hobbiesDisplay;

  return resolved;
}

/** Editor one-click modes, mirrored from the web's engine/presets.ts. */
export interface EnginePreset {
  label: { en: string; sw: string };
  description: { en: string; sw: string };
  density: DensityMode;
  icon: string;
}

export const ENGINE_PRESETS: Record<string, EnginePreset> = {
  ats: {
    label: { en: "ATS Safe", sw: "Salama kwa ATS" },
    description: { en: "Compact, keyword-rich, machine-readable", sw: "Fupi, maneno muhimu, inasomwa na mashine" },
    density: "compact",
    icon: "🤖",
  },
  executive: {
    label: { en: "Executive", sw: "Kiongozi" },
    description: { en: "Spacious, authoritative, prestigious order", sw: "Nafasi kubwa, yenye mamlaka" },
    density: "airy",
    icon: "💼",
  },
  creative: {
    label: { en: "Creative", sw: "Ubunifu" },
    description: { en: "Skills-first, personality-forward layout", sw: "Ujuzi kwanza, muonekano wa kibinafsi" },
    density: "normal",
    icon: "🎨",
  },
  student: {
    label: { en: "Entry Level", sw: "Ngazi ya Kuanza" },
    description: { en: "Education-first for early-career applicants", sw: "Elimu kwanza kwa wanaoanza" },
    density: "normal",
    icon: "🎓",
  },
};
