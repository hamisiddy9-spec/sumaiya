/**
 * Template System Exports
 *
 * This is the main entry point for the template system.
 * The UI should only depend on these exports, not on individual module implementations.
 *
 * There is exactly one provider implementation: the local NativeTemplateProvider.
 * Sumaiya ships its 267 template files and 266 registry entries inside the app
 * because the APK must work with no network (docs/DECISIONS.md D1) — an
 * offline-first product cannot fetch its templates over HTTP, so there is no
 * remote provider and no env-var driven selection.
 */

// Schema & Types
export * from './schema';

// Provider Interface (exported separately for clarity)
export type { TemplateProvider, TemplateMetadata, TemplateFamily, DocumentContent, RenderedDocument } from './schema';

// Native Implementation (the only implementation)
export { NativeTemplateProvider, nativeTemplateProvider } from './native-provider';

// Registry & Families (Phase 2)
export { TEMPLATE_REGISTRY } from './registry';
export { TEMPLATE_FAMILIES, getFamiliesForProduct, getFamiliesByCategory, getFamilyById } from './families';

// Schemas (Phase 3)
export { STANDARD_CV_SCHEMA, TEMPLATE_SCHEMAS, getTemplateSchema, SCHEMA_VERSION } from './schemas';

// CV template tiers (premium / core / legacy) — single source of truth
export { getCvTemplateTier, isPremiumCvTemplate, getCuratedCvTemplateIds, type CvTemplateTier } from './tiers';

// Curated / premium template id lists (single source of truth for tiers)
export { CURATED_CV_TEMPLATE_IDS, PREMIUM_TEMPLATE_IDS } from './curation';

// Database Migrations
export { MIGRATIONS, getMigrationSQL, checkMigrationStatus, convertCVToDocument, type MigrationStatus } from './migrations';

import { nativeTemplateProvider } from './native-provider';
import type { TemplateProvider } from './schema';

/**
 * Resolve the template provider.
 *
 * The native provider is the only implementation, so selection is
 * unconditional: no configuration, no env var, no fallback branch — there is
 * nothing to fall back from. Kept as a named function because the UI treats
 * provider resolution as a (single) step.
 */
export function selectProvider(): TemplateProvider {
  return nativeTemplateProvider;
}

/**
 * SINGLETON INSTANCE
 *
 * Usage:
 * import { templateProvider } from '@/lib/templates';
 *
 * const families = await templateProvider.getFamiliesForProduct('sumaiya');
 */
export const templateProvider: TemplateProvider = selectProvider();
