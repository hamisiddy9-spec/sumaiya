/**
 * CV template curation — the single source of truth for which templates are
 * premium (paid flagships), core (curated free), or legacy (the long tail of
 * recolor/rename variants that stay renderable but are not offered).
 *
 * This lives in the provider layer (lib/templates) so both the native provider
 * and the web UI derive their tier data from ONE list. The web types
 * (`@/types`) re-export these rather than keeping a parallel copy.
 */

import type { TemplateId } from "@/types";

/** Curated set of genuinely-distinct CV layouts, surfaced in the gallery and
 *  the editor picker. The full template registry stays intact so every
 *  existing document keeps rendering — this only controls what's *offered*. */
export const CURATED_CV_TEMPLATE_IDS: readonly TemplateId[] = [
  // Premium flagships
  "rift", "zahabu", "nuru", "pemba", "malachite", "coral", "kioo",
  // Contemporary / experimental
  "bento", "zege", "console", "riso", "vibe", "neon",
  // Timeless / professional
  "regent", "marlowe", "cavendish", "haven",
  // Sidebar
  "nakuru", "ubuntu", "mombasa", "aurora-edge", "metro", "meridian",
  // Header / two-column
  "serengeti", "nairobi", "atlas", "eclipse", "horizon", "nova",
  // Classic / serif
  "kilimanjaro", "victoria", "monarch", "oxford", "titan",
  // Creative / editorial
  "zanzibar", "canvas-magazine", "vertex", "muse", "narrative", "tokyo-grid",
  // Minimal / ATS
  "sahara", "nordic-minimal", "berlin", "grid", "stripe", "serif-cv", "mono-cv",
];

/** The 7 premium flagships (most visually distinctive layouts). Every premium
 *  id is also curated; everything else in the curated set, and the whole
 *  legacy tail, stays free. */
export const PREMIUM_TEMPLATE_IDS: ReadonlySet<TemplateId> = new Set([
  "rift", "zahabu", "nuru", "pemba", "malachite", "coral", "kioo",
]);
