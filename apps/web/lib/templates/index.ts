/**
 * Template System Exports
 *
 * This is the main entry point for the template system.
 * The UI should only depend on these exports, not on individual module implementations.
 */

// Schema & Types
export * from './schema';

// Provider Interface (exported separately for clarity)
export type { TemplateProvider, TemplateMetadata, TemplateFamily, DocumentContent, RenderedDocument } from './schema';

// Native Implementation (currently used)
export { NativeTemplateProvider, nativeTemplateProvider } from './native-provider';

// Registry & Families (Phase 2)
export { TEMPLATE_REGISTRY } from './registry';
export { TEMPLATE_FAMILIES, getFamiliesForProduct, getFamiliesByCategory, getFamilyById } from './families';

// Schemas (Phase 3)
export { STANDARD_CV_SCHEMA, TEMPLATE_SCHEMAS, getTemplateSchema, SCHEMA_VERSION } from './schemas';

// TemplateHub Provider (Phase 5)
export { TemplateHubProvider, createTemplateHubProvider, type TemplateHubClient } from './templatehub-provider';

// CV template tiers (premium / core / legacy) — single source of truth
export { getCvTemplateTier, isPremiumCvTemplate, getCuratedCvTemplateIds, type CvTemplateTier } from './tiers';

// Database Migrations
export { MIGRATIONS, getMigrationSQL, checkMigrationStatus, convertCVToDocument, type MigrationStatus } from './migrations';

import { nativeTemplateProvider } from './native-provider';
import { TemplateHubProvider, type TemplateHubClient } from './templatehub-provider';
import type { TemplateProvider } from './schema';

/**
 * Build the HTTP client the TemplateHubProvider talks to.
 * Synchronous so the singleton can be selected with no async init step.
 */
function buildTemplateHubClient(baseUrl: string, apiKey: string): TemplateHubClient {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  return {
    async get<T>(path: string): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, { headers });
      if (!res.ok) throw new Error(`TemplateHub API error: ${res.status} ${res.statusText}`);
      return res.json() as Promise<T>;
    },
    async post<T>(path: string, data: unknown): Promise<T> {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`TemplateHub API error: ${res.status} ${res.statusText}`);
      return res.json() as Promise<T>;
    },
  };
}

/**
 * Resolve which template provider to serve.
 *
 * Pure + exported so the selection rule is unit-testable:
 * - 'native' (or unset / unknown) → local NativeTemplateProvider
 * - 'templatehub' | 'remote' + URL + key → TemplateHubProvider
 * - 'templatehub' | 'remote' without creds → graceful fallback to native (never a dead provider)
 */
export function selectProvider(
  providerType: string | undefined,
  env: { templateHubUrl?: string; templateHubApiKey?: string } = {}
): TemplateProvider {
  const type = (providerType || 'native').trim().toLowerCase();
  if (type === 'templatehub' || type === 'remote') {
    const url = env.templateHubUrl?.trim();
    const key = env.templateHubApiKey?.trim();
    if (url && key) {
      return new TemplateHubProvider(buildTemplateHubClient(url, key), 'sumaiya');
    }
  }
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
export const templateProvider: TemplateProvider = selectProvider(
  process.env.NEXT_PUBLIC_TEMPLATE_PROVIDER,
  {
    templateHubUrl: process.env.TEMPLATE_HUB_API_URL,
    templateHubApiKey: process.env.TEMPLATE_HUB_API_KEY,
  }
);
