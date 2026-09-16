/**
 * TemplateHub Provider — Phase 5
 *
 * When TemplateHub API becomes available, this provider will:
 * - Call TemplateHub API instead of using local templates
 * - Handle authentication, caching, fallback
 * - Render documents via TemplateHub rendering service
 *
 * No changes to UI needed. Just swap providers:
 *   const provider = new TemplateHubProvider(apiClient);
 *
 * Currently: STUB only. Not yet integrated.
 */

import {
  TemplateProvider,
  TemplateMetadata,
  TemplateFamily,
  DocumentContent,
  RenderedDocument,
  TemplateCategory,
} from './schema';

/**
 * HTTP client for TemplateHub API
 * Will be provided when TemplateHub repo is created
 */
export interface TemplateHubClient {
  get<T>(path: string, options?: { headers?: Record<string, string> }): Promise<T>;
  post<T>(path: string, data: unknown, options?: { headers?: Record<string, string> }): Promise<T>;
}

/**
 * TemplateHub API Response Types
 */
interface TemplateHubTemplate extends TemplateMetadata {
  htmlPreview?: string;
  renderingEngine?: 'react' | 'html' | 'pdf';
}

interface TemplateHubRenderResponse {
  documentId: string;
  content: string;
  format: 'html' | 'pdf' | 'docx';
  previewUrl?: string;
}

interface TemplateHubExportResponse {
  buffer: Buffer;
  contentType: string;
}

/**
 * TemplateHubProvider
 *
 * Connects Sumaiya to TemplateHub API for:
 * - Template discovery
 * - Template rendering
 * - PDF/export generation
 */
export class TemplateHubProvider implements TemplateProvider {
  constructor(
    private apiClient: TemplateHubClient,
    private productId: string = 'sumaiya',
    private cacheEnabled: boolean = true
  ) {}

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<TemplateMetadata | null> {
    try {
      const template = await this.apiClient.get<TemplateHubTemplate>(
        `/templates/${id}?product=${this.productId}`
      );
      return template;
    } catch (error) {
      console.error(`Failed to load template ${id}:`, error);
      return null;
    }
  }

  /**
   * Get templates by category
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
    try {
      const params = new URLSearchParams({
        product: this.productId,
        category,
        limit: String(options?.limit || 100),
      });

      if (options?.family) params.append('family', options.family);
      if (options?.tier) params.append('tier', options.tier);
      if (options?.source) params.append('source', options.source);

      const templates = await this.apiClient.get<TemplateMetadata[]>(
        `/templates?${params.toString()}`
      );

      return templates;
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  }

  /**
   * Get a template family (CV + cover letter + reference sheet)
   */
  async getTemplateFamily(familyId: string): Promise<TemplateFamily | null> {
    try {
      const family = await this.apiClient.get<TemplateFamily>(
        `/families/${familyId}?product=${this.productId}`
      );
      return family;
    } catch (error) {
      console.error(`Failed to load family ${familyId}:`, error);
      return null;
    }
  }

  /**
   * Get families for Sumaiya (curated list)
   */
  async getFamiliesForProduct(
    product: string,
    options?: {
      category?: TemplateCategory;
      tier?: 'core' | 'premium';
    }
  ): Promise<TemplateFamily[]> {
    try {
      const params = new URLSearchParams({
        product,
      });

      if (options?.category) params.append('category', options.category);
      if (options?.tier) params.append('tier', options.tier);

      const families = await this.apiClient.get<TemplateFamily[]>(
        `/families?${params.toString()}`
      );

      return families;
    } catch (error) {
      console.error('Failed to load families:', error);
      return [];
    }
  }

  /**
   * Render a document via TemplateHub
   *
   * Sends template + user data to TemplateHub rendering service
   * Gets back HTML ready for PDF export
   */
  async renderDocument(
    templateId: string,
    userData: DocumentContent,
    options?: { lang?: 'en' | 'sw' }
  ): Promise<RenderedDocument> {
    try {
      const response = await this.apiClient.post<TemplateHubRenderResponse>(
        '/documents/render',
        {
          templateId,
          userData,
          language: options?.lang || 'en',
          product: this.productId,
        }
      );

      return {
        templateId,
        templateVersion: '1.0.0', // TODO: Get from response
        content: response.content,
        metadata: {
          createdAt: new Date().toISOString(),
          exportFormat: response.format as 'pdf' | 'html' | 'docx',
          documentType: 'cv', // TODO: Get from template
        },
      };
    } catch (error) {
      console.error('Failed to render document:', error);
      throw new Error(`Document rendering failed: ${error}`);
    }
  }

  /**
   * Export to PDF via TemplateHub
   *
   * TemplateHub handles:
   * - HTML → PDF conversion
   * - Font embedding
   * - Color space handling
   * - Accessibility (if supported)
   */
  async exportPdf(renderedDocument: RenderedDocument): Promise<Buffer> {
    try {
      const response = await this.apiClient.post<TemplateHubExportResponse>(
        '/exports/pdf',
        {
          templateId: renderedDocument.templateId,
          html: renderedDocument.content,
          options: {
            format: 'A4',
            margin: {
              top: '20mm',
              right: '15mm',
              bottom: '20mm',
              left: '15mm',
            },
          },
        }
      );

      return response.buffer;
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw new Error(`PDF export failed: ${error}`);
    }
  }

  /**
   * Get template metrics/analytics
   * Useful for recommendations
   */
  async getTemplateMetrics(templateId: string): Promise<unknown> {
    try {
      return await this.apiClient.get(`/templates/${templateId}/metrics`);
    } catch (error) {
      console.warn('Failed to load template metrics:', error);
      return null;
    }
  }
}

/**
 * Factory function to create a TemplateHubProvider
 * Handles API client initialization
 */
export async function createTemplateHubProvider(
  baseUrl: string,
  apiKey: string,
  productId: string = 'sumaiya'
): Promise<TemplateHubProvider> {
  // TODO: Implement HTTP client
  // For now, this is just a stub showing the API contract

  const apiClient: TemplateHubClient = {
    async get<T>(path: string): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`TemplateHub API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    },

    async post<T>(path: string, data: unknown): Promise<T> {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`TemplateHub API error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    },
  };

  return new TemplateHubProvider(apiClient, productId);
}
