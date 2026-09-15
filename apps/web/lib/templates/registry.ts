/**
 * Template Registry
 *
 * Metadata for all 273 templates currently in Sumaiya.
 * This will eventually be migrated to TemplateHub and loaded via API.
 *
 * Currently: statically defined
 * Future: `const TEMPLATE_REGISTRY = await templateProvider.list()`
 */

import { TemplateMetadata } from './schema';

/**
 * IMPORTANT: This is a STUB showing the pattern.
 *
 * The full registry will be generated from:
 * - Extracting metadata from 273 .tsx template files
 * - Or loaded from TemplateHub database when available
 *
 * For now, we show a few examples to demonstrate the structure.
 */

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  // ===== CORE TEMPLATES (Sumaiya included) =====

  'simple-cv': {
    id: 'simple-cv',
    name: 'Simple',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'core',
    description: 'A clean, minimal CV template. Perfect for quick creation.',
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [
      { path: 'personalInfo.fullName', type: 'text', required: true, label: 'Full Name' },
      { path: 'personalInfo.email', type: 'email', required: true, label: 'Email' },
      { path: 'personalInfo.phone', type: 'phone', required: false, label: 'Phone' },
      { path: 'personalInfo.headline', type: 'text', required: false, label: 'Professional Headline' },
      { path: 'summary', type: 'multiline', required: false, label: 'Summary' },
      { path: 'experience', type: 'array', required: false, label: 'Experience',
        itemSchema: {
          company: 'text',
          title: 'text',
          startDate: 'date',
          endDate: 'date',
          description: 'multiline',
        }
      },
      { path: 'education', type: 'array', required: false, label: 'Education',
        itemSchema: {
          institution: 'text',
          degree: 'text',
          field: 'text',
          graduationDate: 'date',
        }
      },
      { path: 'skills', type: 'array', required: false, label: 'Skills',
        itemSchema: {
          name: 'text',
          level: 'enum',
        }
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  'professional-cv': {
    id: 'professional-cv',
    name: 'Professional',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'core',
    description: 'A polished, professional CV template for most roles.',
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [
      { path: 'personalInfo.fullName', type: 'text', required: true, label: 'Full Name' },
      { path: 'personalInfo.email', type: 'email', required: true, label: 'Email' },
      { path: 'personalInfo.phone', type: 'phone', required: false, label: 'Phone' },
      { path: 'personalInfo.location', type: 'text', required: false, label: 'Location' },
      { path: 'personalInfo.headline', type: 'text', required: false, label: 'Professional Headline' },
      { path: 'summary', type: 'multiline', required: false, label: 'Summary' },
      { path: 'experience', type: 'array', required: false, label: 'Experience',
        itemSchema: {
          company: 'text',
          title: 'text',
          startDate: 'date',
          endDate: 'date',
          description: 'multiline',
          keyAchievements: 'array',
        }
      },
      { path: 'education', type: 'array', required: false, label: 'Education',
        itemSchema: {
          institution: 'text',
          degree: 'text',
          field: 'text',
          graduationDate: 'date',
        }
      },
      { path: 'skills', type: 'array', required: false, label: 'Skills',
        itemSchema: {
          name: 'text',
          level: 'enum',
        }
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  'ats-cv': {
    id: 'ats-cv',
    name: 'ATS-Optimized',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'core',
    description: 'Optimized for ATS (Applicant Tracking Systems). Clean formatting for maximum scannability.',
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [
      { path: 'personalInfo.fullName', type: 'text', required: true, label: 'Full Name' },
      { path: 'personalInfo.email', type: 'email', required: true, label: 'Email' },
      { path: 'personalInfo.phone', type: 'phone', required: false, label: 'Phone' },
      { path: 'personalInfo.location', type: 'text', required: false, label: 'Location' },
      { path: 'summary', type: 'multiline', required: false, label: 'Summary' },
      { path: 'experience', type: 'array', required: false, label: 'Experience',
        itemSchema: {
          company: 'text',
          title: 'text',
          startDate: 'date',
          endDate: 'date',
          description: 'multiline',
        }
      },
      { path: 'education', type: 'array', required: false, label: 'Education',
        itemSchema: {
          institution: 'text',
          degree: 'text',
          field: 'text',
          graduationDate: 'date',
        }
      },
      { path: 'skills', type: 'array', required: false, label: 'Skills',
        itemSchema: {
          name: 'text',
          level: 'enum',
        }
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ===== LEGACY TEMPLATES (from existing 273) =====
  // These are placeholders. Full registry will be generated.
  // Pattern: id, name, family, tier, source

  'aberdare': {
    id: 'aberdare',
    name: 'Aberdare',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'professional-minimal', // to be determined during migration
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [], // TODO: extract from component
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  'alpine': {
    id: 'alpine',
    name: 'Alpine',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'professional-minimal', // variant of aberdare
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [], // TODO: extract from component
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  'apex': {
    id: 'apex',
    name: 'Apex',
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'ats-optimized',
    tier: 'core',
    accessibleTo: ['sumaiya'],
    editable_fields: [], // TODO: extract from component
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  // ... 270 more templates (to be filled in)
  // Each one will have:
  // - id (from filename)
  // - name (human readable)
  // - family (determined during TEMPLATE_ASSET_MIGRATION_PLAN audit)
  // - tier ('core' or 'premium' based on quality)
  // - editable_fields (extracted from component during schema extraction phase)
};

/**
 * TODO: Generate this registry automatically
 *
 * Script to extract metadata:
 * 1. Read all .tsx files from apps/web/components/templates/
 * 2. Parse component name and metadata
 * 3. Generate this file
 * 4. Manual review to classify families + tiers
 *
 * Script: apps/web/scripts/generate-template-registry.mjs
 */
