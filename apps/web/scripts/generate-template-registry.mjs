#!/usr/bin/env node

/**
 * Generate Template Registry from 273 .tsx files
 * Extracts metadata and creates apps/web/lib/templates/registry.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../components/templates');

console.log('📖 Scanning template files...');

const files = fs
  .readdirSync(TEMPLATES_DIR)
  .filter(f => f.endsWith('.tsx') && f !== 'index.ts')
  .sort();

console.log(`✅ Found ${files.length} templates`);

// Classify templates into families and tiers
// Based on naming patterns and quality assessment
const familyMap = {
  // Professional/Minimal
  aberdare: { family: 'professional-minimal', tier: 'core' },
  alpine: { family: 'professional-minimal', tier: 'core' },
  athens: { family: 'professional-minimal', tier: 'core' },
  atlanta: { family: 'professional-minimal', tier: 'core' },

  // ATS-Optimized
  apex: { family: 'ats-optimized', tier: 'core' },
  artemis: { family: 'ats-optimized', tier: 'core' },

  // Modern
  altus: { family: 'modern-specialist', tier: 'core' },
  aurora: { family: 'creative-professional', tier: 'core' },

  // Default: core tier, pending family
  __default: { family: 'pending', tier: 'core' },
};

const registry = {};

files.forEach((file, idx) => {
  const templateId = file.replace('.tsx', '');
  const classification = familyMap[templateId] || familyMap.__default;

  const templateName = templateId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  registry[templateId] = {
    id: templateId,
    name: templateName,
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: classification.family,
    tier: classification.tier,
    accessibleTo: ['sumaiya'],
    editable_fields: [
      { path: 'personalInfo.fullName', type: 'text', required: true, label: 'Full Name' },
      { path: 'personalInfo.email', type: 'email', required: true, label: 'Email' },
      { path: 'personalInfo.phone', type: 'phone', required: false, label: 'Phone' },
      { path: 'personalInfo.location', type: 'text', required: false, label: 'Location' },
      { path: 'personalInfo.headline', type: 'text', required: false, label: 'Professional Headline' },
      { path: 'summary', type: 'multiline', required: false, label: 'Professional Summary' },
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
  };
});

// Generate TypeScript file
const content = `/**
 * GENERATED: apps/web/scripts/generate-template-registry.mjs
 *
 * Template metadata for all ${files.length} CV templates in Sumaiya.
 *
 * Do NOT edit manually. Run:
 *   cd apps/web
 *   node scripts/generate-template-registry.mjs
 *
 * This registry will eventually be replaced by TemplateHub API when available.
 */

import { TemplateMetadata } from './schema';

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = ${JSON.stringify(registry, null, 2)};
`;

const outputPath = path.join(__dirname, '../lib/templates/registry.ts');
fs.writeFileSync(outputPath, content);

console.log(`✅ Generated registry with ${files.length} templates`);
console.log(`📝 Output: ${outputPath}`);

// Summary
const families = new Map();
const tiers = new Map();
Object.values(registry).forEach(t => {
  const fam = t.family || 'unknown';
  families.set(fam, (families.get(fam) || 0) + 1);
  tiers.set(t.tier, (tiers.get(t.tier) || 0) + 1);
});

console.log('\n📊 Summary:');
console.log(`  Families: ${Array.from(families.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
console.log(`  Tiers: ${Array.from(tiers.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);
