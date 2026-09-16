/**
 * CV template tiers — the single source of truth for which templates are
 * premium (paid flagships), core (curated free), or legacy (the long tail of
 * recolor/rename variants that stay renderable but are not offered).
 *
 * Backed by the hand-curated lists in ./curation so the provider layer
 * answers "what tier is this" without every caller importing @/types.
 */
import { CURATED_CV_TEMPLATE_IDS, PREMIUM_TEMPLATE_IDS } from './curation';

export type CvTemplateTier = 'premium' | 'core' | 'legacy';

const PREMIUM: ReadonlySet<string> = PREMIUM_TEMPLATE_IDS;
const CURATED: ReadonlySet<string> = new Set(CURATED_CV_TEMPLATE_IDS);

export function getCvTemplateTier(id: string): CvTemplateTier {
  if (PREMIUM.has(id)) return 'premium';
  if (CURATED.has(id)) return 'core';
  return 'legacy';
}

export function isPremiumCvTemplate(id: string): boolean {
  return PREMIUM.has(id);
}

export function getCuratedCvTemplateIds(): string[] {
  return [...CURATED];
}
