import { describe, it, expect } from 'vitest';

import { getCvTemplateTier, isPremiumCvTemplate, getCuratedCvTemplateIds } from './tiers';

describe('CV template tiers', () => {
  it('classifies the 7 premium flagships as premium', () => {
    for (const id of ['rift', 'zahabu', 'nuru', 'pemba', 'malachite', 'coral', 'kioo']) {
      expect(getCvTemplateTier(id)).toBe('premium');
      expect(isPremiumCvTemplate(id)).toBe(true);
    }
  });

  it('classifies curated-but-free templates as core', () => {
    expect(getCvTemplateTier('nakuru')).toBe('core');
    expect(isPremiumCvTemplate('nakuru')).toBe(false);
  });

  it('classifies anything outside premium + curated as legacy', () => {
    expect(getCvTemplateTier('aberdare')).toBe('legacy');
    expect(isPremiumCvTemplate('aberdare')).toBe(false);
  });

  it('returns a non-empty curated list that includes a known core template', () => {
    const ids = getCuratedCvTemplateIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain('nakuru');
  });
});
