#!/usr/bin/env node
/**
 * Generate mobile template index from web templates.
 * Extracts template metadata and creates index for carousel rendering.
 *
 * Usage: node scripts/gen-mobile-templates.mjs > apps/native/src/data/templates.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Find all template files
const templatesDir = path.join(ROOT, 'apps/web/components/templates');
const files = fs
  .readdirSync(templatesDir)
  .filter(f => f.endsWith('.tsx') && f !== 'index.ts')
  .sort();

console.error(`[gen-mobile-templates] found ${files.length} template files`);

// Extract metadata from each template
const templates = files.map((file, idx) => {
  const name = file.replace('.tsx', '');
  const id = name.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');

  return {
    id,
    name,
    order: idx,
    // TODO: extract from template exports (category, career_stage, industry)
    category: 'general',
    career_stage: 'mid',
    industry: 'tech',
  };
});

console.error(
  `[gen-mobile-templates] generated ${templates.length} templates for mobile`
);

// Output JSON (stdout for piping)
console.log(JSON.stringify({ templates, count: templates.length }, null, 2));
