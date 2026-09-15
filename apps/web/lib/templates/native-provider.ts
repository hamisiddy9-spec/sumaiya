/**
 * NativeTemplateProvider — Local Template Implementation
 *
 * Serves templates from the local Sumaiya database (currently 273 CV templates).
 * This is the current/fallback implementation.
 *
 * When TemplateHub is ready, we'll add TemplateHubProvider.
 * The switch will be a single line; no UI changes needed.
 */

import {
  TemplateProvider,
  TemplateMetadata,
  TemplateFamily,
  DocumentContent,
  RenderedDocument,
  TemplateCategory,
} from './schema';
import { TEMPLATE_REGISTRY } from './registry';
import { TEMPLATE_FAMILIES } from './families';

export class NativeTemplateProvider implements TemplateProvider {
  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<TemplateMetadata | null> {
    const template = TEMPLATE_REGISTRY[id];
    if (!template) return null;
    return template;
  }

  /**
   * Get templates by category with optional filtering
   */
  async getTemplatesByCategory(
    category: TemplateCategory,
    options?: {
      family?: string;
      tier?: 'core' | 'premium';
      source?: string;
      limit?: number;
    }
  ): Promise<TemplateMetadata[]> {
    let results = Object.values(TEMPLATE_REGISTRY).filter(
      (t) => t.category === category
    );

    // Filter by family if specified
    if (options?.family) {
      results = results.filter((t) => t.family === options.family);
    }

    // Filter by tier if specified
    if (options?.tier) {
      results = results.filter((t) => t.tier === options.tier);
    }

    // Filter by source if specified
    if (options?.source) {
      results = results.filter((t) => t.source === options.source);
    }

    // Apply limit
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get a complete template family (CV + cover letter + etc)
   */
  async getTemplateFamily(familyId: string): Promise<TemplateFamily | null> {
    const family = TEMPLATE_FAMILIES.find((f) => f.id === familyId);
    if (!family) return null;
    return family;
  }

  /**
   * Get families available for a specific product (curated list)
   */
  async getFamiliesForProduct(
    product: string,
    options?: {
      category?: TemplateCategory;
      tier?: 'core' | 'premium';
    }
  ): Promise<TemplateFamily[]> {
    // For Sumaiya, return only families marked as accessible to Sumaiya
    if (product === 'sumaiya') {
      let results = TEMPLATE_FAMILIES.filter(
        (f) => f.tier === 'core' // only core families for Sumaiya free experience
      );

      if (options?.category) {
        results = results.filter((f) =>
          f.templates.some((t) => t.category === options.category)
        );
      }

      if (options?.tier) {
        results = results.filter((f) => f.tier === options.tier);
      }

      return results;
    }

    // For other products, return all public families
    return TEMPLATE_FAMILIES.filter((f) =>
      f.templates.every((t) => t.accessibleTo?.includes(product))
    );
  }

  /**
   * Render a document from template + user data
   *
   * STUB: Returns placeholder. Real implementation will:
   * - Load the template component
   * - Populate it with user data
   * - Render to HTML
   */
  async renderDocument(
    templateId: string,
    userData: DocumentContent,
    options?: { lang?: 'en' | 'sw' }
  ): Promise<RenderedDocument> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // TODO: Load template component from apps/web/components/templates/
    // TODO: Render with React/SSR
    // TODO: Return HTML string

    return {
      templateId,
      templateVersion: template.version,
      content: '<div>TODO: Render template</div>', // placeholder
      metadata: {
        createdAt: new Date().toISOString(),
        exportFormat: 'html',
        documentType: template.category,
      },
    };
  }

  /**
   * Export rendered document to PDF
   *
   * STUB: Returns empty buffer. Real implementation will:
   * - Use puppeteer/wkhtmltopdf to convert HTML → PDF
   * - Return Buffer
   */
  async exportPdf(renderedDocument: RenderedDocument): Promise<Buffer> {
    // TODO: Convert HTML to PDF
    // TODO: Return Buffer

    return Buffer.from('TODO: Export to PDF');
  }
}

/**
 * Singleton instance
 */
export const nativeTemplateProvider = new NativeTemplateProvider();
