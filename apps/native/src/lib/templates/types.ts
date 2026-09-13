/**
 * A native CV template = metadata + which engine layout draws it + that
 * layout's config. One module per template, generated from the web registry by
 * scripts/gen-native-templates.mjs, so the two platforms cannot drift.
 */

import type { TemplatePersonality } from "../cv-engine/document";

export interface NativeTemplate {
  /** Registry id, identical to the web TEMPLATES id. */
  id: string;
  /** Picker label. Template names are brand words, so en === sw. */
  name: { en: string; sw: string };
  /** One-line picker description. Mirrors the web `description`. */
  blurb: { en: string; sw: string };
  tier: "free" | "premium";
  /** The web registry's preview swatch — also the template's default accent. */
  previewColor: string;
  /** Web style family: sidebar | header | minimal | creative | classic. */
  style: string;
  /** Engine layout that draws this template, or "bespoke" for a hand-written one. */
  layout: string;
  personality: TemplatePersonality;
  /**
   * The template's own design-token overrides (makeTokens' third argument on
   * the web). May contain the "@accent" sentinel.
   */
  tokenOverrides: {
    font?: Partial<Record<string, number>>;
    space?: Partial<Record<string, number>>;
    color?: Partial<Record<string, string>>;
  };
  config: Record<string, unknown>;
  /** True when this template has no generated config yet and needs a hand port. */
  bespoke?: true;
}
