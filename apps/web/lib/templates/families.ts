/**
 * Template Families
 *
 * Groups related templates into coherent design systems.
 * Example: Executive Collection = CV + Cover Letter + Reference Sheet
 *
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
  // ===== SUMAIYA CORE FAMILIES (5 families) =====
  // Small, curated set for Sumaiya free experience

  {
    id: 'core-simple',
    name: 'Simple',
    description: 'Quick start. Clean, minimal CV for fast creation.',
    tier: 'core',
    templates: [
      { templateId: 'simple-cv', category: 'cv', role: 'primary', position: 1 },
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
      { templateId: 'professional-cv', category: 'cv', role: 'primary', position: 1 },
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
      { templateId: 'ats-cv', category: 'cv', role: 'primary', position: 1 },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'professional-minimal',
    name: 'Professional Minimal',
    description: 'Minimal, elegant. Let your experience speak for itself.',
    tier: 'core',
    templates: [
      { templateId: 'alpine', category: 'cv', role: 'primary', position: 1 },
      { templateId: 'aberdare', category: 'cv', role: 'primary', position: 2 },
      { templateId: 'athens', category: 'cv', role: 'primary', position: 3 },
      { templateId: 'atlanta', category: 'cv', role: 'primary', position: 4 },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'ats-optimized',
    name: 'ATS-Optimized Family',
    description: 'Variants of ATS-optimized design.',
    tier: 'core',
    templates: [
      { templateId: 'apex', category: 'cv', role: 'primary', position: 1 },
      { templateId: 'artemis', category: 'cv', role: 'primary', position: 2 },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ===== PREMIUM FAMILIES =====
  // Premium families: CV + matching cover letter + optionally reference sheet.
  // - Organized by: Executive, Modern, Creative, Industry-specific, etc.

  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Premium family for senior roles and experienced professionals. Includes CV + matching cover letter + reference sheet.',
    tier: 'premium',
    templates: [
      { templateId: 'altus', category: 'cv', role: 'primary', position: 1 },
      // TODO: Add matching cover letter (to be created)
      // TODO: Add reference sheet (to be created)
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'modern-specialist',
    name: 'Modern Specialist',
    description: 'Clean, modern presentation for technical and specialist roles.',
    tier: 'premium',
    templates: [
      { templateId: 'aurora', category: 'cv', role: 'primary', position: 1 },
      // TODO: Add matching cover letter
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  {
    id: 'creative-professional',
    name: 'Creative Professional',
    description: 'Distinctive design for creative roles (designer, writer, artist, etc.)',
    tier: 'premium',
    templates: [
      // TODO: Assign templates
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ===== PENDING FAMILIES =====
  // These will be organized during TEMPLATE_ASSET_MIGRATION_PLAN
  // Each will eventually become a premium family with:
  // - CV template
  // - Matching cover letter
  // - Optional: reference sheet, LinkedIn profile guide
];

/**
 * Helper: Get families suitable for a specific product
 */
export function getFamiliesForProduct(product: string): TemplateFamily[] {
  if (product === 'sumaiya') {
    // Sumaiya gets core families only (small, free experience)
    return TEMPLATE_FAMILIES.filter((f) => f.tier === 'core');
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
