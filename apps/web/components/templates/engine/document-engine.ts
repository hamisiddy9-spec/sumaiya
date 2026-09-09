// Document Orchestration Engine — the single controller that resolves
// ALL rendering decisions for engine-backed templates.
//
// Priority chain (lowest → highest):
//   Global defaults → Template personality → Mode preset → Explicit user data
//
// Every engine template calls resolveDocument() instead of reading
// data.density / data.sectionOrder / etc. directly. This ensures:
//   • One decision point (no scattered ?? "normal" across templates)
//   • Deterministic output for the same data + template + mode
//   • Clear separation: template says WHAT it prefers, engine says WHAT wins

import type { CVData } from "@/types";
import { DEFAULT_SECTION_ORDER } from "@/types";
import type { DensityMode } from "./tokens";
import type { ExperienceVariant, SkillDisplay } from "./sections";
import { ENGINE_PRESETS } from "./presets";

export interface DocumentConfig {
  density: DensityMode;
  sectionOrder: string[];
  experienceVariant: ExperienceVariant;
  skillDisplay: SkillDisplay;
  showTimeline: boolean;
  hobbiesDisplay: "chips" | "text";
}

// Per-template personality defaults — what makes each template feel like itself.
// These are overridden by mode presets and explicit user choices.
export interface TemplatePersonality {
  density?: DensityMode;
  experienceVariant?: ExperienceVariant;
  skillDisplay?: SkillDisplay;
  showTimeline?: boolean;
  hobbiesDisplay?: "chips" | "text";
}

const GLOBAL_DEFAULTS: DocumentConfig = {
  density: "normal",
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  experienceVariant: "default",
  skillDisplay: "bar",
  showTimeline: false,
  hobbiesDisplay: "chips",
};

// Valid values for runtime validation (keeps TypeScript happy when values come from data)
export const VALID_EXPERIENCE_VARIANTS: ExperienceVariant[] = ["default", "card", "compact", "timeline-v2", "table"];
export const VALID_SKILL_DISPLAYS: SkillDisplay[] = ["bar", "dot", "chip", "grid", "tag-rated"];

export function resolveDocument(
  data: CVData,
  personality: TemplatePersonality = {}
): DocumentConfig {
  // Layer 1: global defaults
  const resolved = { ...GLOBAL_DEFAULTS };

  // Layer 2: template personality (what makes THIS template unique)
  if (personality.density)           resolved.density           = personality.density;
  if (personality.experienceVariant) resolved.experienceVariant = personality.experienceVariant;
  if (personality.skillDisplay)      resolved.skillDisplay      = personality.skillDisplay;
  if (personality.showTimeline != null) resolved.showTimeline   = personality.showTimeline;
  if (personality.hobbiesDisplay)    resolved.hobbiesDisplay    = personality.hobbiesDisplay;

  // Layer 3: mode preset — fills gaps but does NOT override personality
  // (ATS mode won't force all templates to "chip" if the template uses "dot")
  const mode = data.mode;
  if (mode && ENGINE_PRESETS[mode]) {
    const preset = ENGINE_PRESETS[mode];
    // Mode can override density (it's a fundamental rendering change)
    if (!personality.density) resolved.density = preset.density;
    // Mode sets default sectionOrder but only if user hasn't customized it
    if (!data.sectionOrder?.length) resolved.sectionOrder = preset.sectionOrder;
  }

  // Layer 4: explicit user overrides stored in CVData (highest priority)
  if (data.density) resolved.density = data.density;
  if (data.sectionOrder?.length) resolved.sectionOrder = [...data.sectionOrder];

  return resolved;
}
