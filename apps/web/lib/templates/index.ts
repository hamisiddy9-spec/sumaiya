/**
 * Template System Exports
 *
 * This is the main entry point for the template system.
 * The UI should only depend on these exports, not on individual module implementations.
 */

// Schema & Types
export * from './schema';

// Provider Interface
export * from './provider';

// Native Implementation (currently used)
export { NativeTemplateProvider, nativeTemplateProvider } from './native-provider';

// Registry & Families (Phase 2)
export { TEMPLATE_REGISTRY } from './registry';
export { TEMPLATE_FAMILIES, getFamiliesForProduct, getFamiliesByCategory, getFamilyById } from './families';

// Schemas (Phase 3)
export { STANDARD_CV_SCHEMA, TEMPLATE_SCHEMAS, getTemplateSchema, SCHEMA_VERSION } from './schemas';

// TemplateHub Provider (Phase 5)
export { TemplateHubProvider, createTemplateHubProvider, type TemplateHubClient } from './templatehub-provider';

/**
 * SINGLETON INSTANCE
 *
 * Currently: NativeTemplateProvider
 * Future: Can be switched to TemplateHubProvider
 *
 * Usage:
 * import { templateProvider } from '@/lib/templates';
 *
 * const families = await templateProvider.getFamiliesForProduct('sumaiya');
 */

import { nativeTemplateProvider } from './native-provider';
import type { TemplateProvider } from './schema';

// Environment-based provider selection
// Currently hardcoded to native; can be switched via env var or config
export const templateProvider: TemplateProvider = (() => {
  const providerType = process.env.NEXT_PUBLIC_TEMPLATE_PROVIDER || 'native';

  if (providerType === 'native') {
    return nativeTemplateProvider;
  }

  // TODO: Add TemplateHubProvider when available
  // if (providerType === 'templatehub') {
  //   return templateHubProvider;
  // }

  // Fallback
  return nativeTemplateProvider;
})();
