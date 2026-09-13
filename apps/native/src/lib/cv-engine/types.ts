/**
 * Native CV template engine — shared types.
 *
 * Mirrors the web engine (apps/web/components/templates/engine) so a template's
 * personality reads identically on both platforms: same section styles, same
 * skill displays, same experience variants, same density modes.
 */

import type { CV, CVData } from "@sumaiya/types";

export type Lang = "en" | "sw";

/** How a section heading is drawn. Mirrors the web engine's SectionStyle. */
export type SectionStyle =
  | "underline"
  | "tag"
  | "box"
  | "line-accent"
  | "dots"
  | "none"
  | "pill"
  | "ruled"
  | "numbered";

/** How a skill is drawn. Mirrors the web engine's SkillDisplay. */
export type SkillDisplay = "bar" | "dot" | "chip" | "grid" | "tag-rated";

/** How an experience entry is drawn. Mirrors the web engine's ExperienceVariant. */
export type ExperienceVariant = "default" | "card" | "compact" | "timeline-v2" | "table";

export type HobbiesDisplay = "chips" | "text";

export interface SectionRendererOptions {
  sectionStyle: SectionStyle;
  skillDisplay?: SkillDisplay;
  hobbiesDisplay?: HobbiesDisplay;
  showTimeline?: boolean;
  experienceVariant?: ExperienceVariant;
  lang?: Lang;
}

export type { CV, CVData };
