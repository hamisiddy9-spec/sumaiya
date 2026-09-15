/**
 * Template Families
 *
 * Groups related templates into coherent design systems.
 * Example: Executive Collection = CV + Cover Letter + Reference Sheet
 *
 * This is the structure that makes TemplateHub valuable.
 * Not just individual templates, but complete document systems.
 */

import { TemplateFamily } from './schema';

/**
 * IMPORTANT: This is a STUB showing the pattern.
 *
 * The full families list will be populated during TEMPLATE_ASSET_MIGRATION_PLAN:
 * - Audit 273 templates (Week 1-3)
 * - Classify: migrate/rebuild/combine/deprecate
 * - Group into 30-50 families
 * - Define matching cover letters for each family
 */

export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  // ===== SUMAIYA CORE FAMILIES =====
  // Small, curated set for new users

  {
    id: 'core-simple',
    name: 'Simple',
    description: 'Quick start. Clean, minimal CV for fast creation.',
    tier: 'core',
    templates: [
      { templateId: 'simple-cv', category: 'cv', role: 'primary' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'core-professional',
    name: 'Professional',
    description: 'Professional CV for most roles. Polished, trustworthy.',
    tier: 'core',
    templates: [
      { templateId: 'professional-cv', category: 'cv', role: 'primary' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'core-ats',
    name: 'ATS-Optimized',
    description: 'Designed to pass automated resume scanners. Clean, scannable.',
    tier: 'core',
    templates: [
      { templateId: 'ats-cv', category: 'cv', role: 'primary' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ===== TEMPLATEHUB PREMIUM FAMILIES (Planned) =====
  // These will be populated after template migration audit

  // Placeholder for Executive Collection
  // (Will include 2-3 migrated CV templates + matching cover letter)
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Premium family for senior roles and experienced professionals.',
    tier: 'premium',
    templates: [
      // TODO: Add CV templates from apex, etc.
      // TODO: Add matching cover letter
      // TODO: Add reference sheet
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Placeholder for Modern Specialist
  {
    id: 'modern-specialist',
    name: 'Modern Specialist',
    description: 'Clean, modern presentation for technical roles.',
    tier: 'premium',
    templates: [
      // TODO: Add CV template (from altus, etc.)
      // TODO: Add matching cover letter
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Placeholder for Creative Professional
  {
    id: 'creative-professional',
    name: 'Creative Professional',
    description: 'Distinctive design for creative roles (designer, writer, etc.)',
    tier: 'premium',
    templates: [
      // TODO: Add CV template
      // TODO: Add matching cover letter
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // Placeholder for Professional Minimal
  {
    id: 'professional-minimal',
    name: 'Professional Minimal',
    description: 'Minimal, elegant. Let your experience speak for itself.',
    tier: 'core',
    templates: [
      // TODO: Merged from alpine, athens, atlanta (combined)
      // - templateId: alpine (cool variant)
      // - templateId: athens (warm variant)
      // - templateId: atlanta (neutral variant)
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ===== MORE FAMILIES TO COME =====
  // This list will grow to 30-50 families during the migration process
];

/**
 * Helper: Get families suitable for a specific product
 */
export function getFamiliesForProduct(product: string): TemplateFamily[] {
  if (product === 'sumaiya') {
    // Sumaiya gets core families only (small, free experience)
    return TEMPLATE_FAMILIES.filter((f) => f.tier === 'core');
  }

  if (product === 'templatehub') {
    // TemplateHub gets all families (including premium)
    return TEMPLATE_FAMILIES;
  }

  // Other products: filtered by their specific needs
  return [];
}

/**
 * Helper: Get families in a specific category
 */
export function getFamiliesByCategory(
  category: string,
  product?: string
): TemplateFamily[] {
  let families = TEMPLATE_FAMILIES;

  if (product) {
    families = getFamiliesForProduct(product);
  }

  return families.filter((f) =>
    f.templates.some((t) => t.category === category)
  );
}

/**
 * Helper: Get a single family by ID
 */
export function getFamilyById(id: string): TemplateFamily | undefined {
  return TEMPLATE_FAMILIES.find((f) => f.id === id);
}
