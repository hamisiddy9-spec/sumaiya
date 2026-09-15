/**
 * Testing utilities for template system
 *
 * Provides helpers for testing TemplateProvider, rendering, and exports
 */

import type { CVData } from '@/types';
import { TemplateMetadata, TemplateFamily, DocumentContent } from './schema';

/**
 * Create minimal valid CV data for testing
 * (Use testDataFactory.createCVData() for custom test data)
 */
export const SAMPLE_CV_DATA = {
  personal: {
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
    email: 'john@example.com',
    phone: '+255712345678',
    location: 'Dar es Salaam',
  },
  summary: 'Experienced software engineer',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  referees: [],
  hobbies: [],
} as unknown as CVData;

/**
 * Mock TemplateProvider for testing
 */
export class MockTemplateProvider {
  async getTemplate(id: string): Promise<TemplateMetadata | null> {
    return {
      id,
      name: `Template ${id}`,
      version: '1.0.0',
      source: 'native',
      category: 'cv',
      family: 'core-simple',
      tier: 'core',
      editable_fields: [],
      accessibleTo: ['sumaiya'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getTemplatesByCategory(category: string, options?: any) {
    return [
      {
        id: 'template-1',
        name: 'Template 1',
        version: '1.0.0',
        source: 'native',
        category,
        family: 'core-simple',
        tier: 'core',
        editable_fields: [],
        accessibleTo: ['sumaiya'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async getTemplateFamily(familyId: string): Promise<TemplateFamily | null> {
    return {
      id: familyId,
      name: `Family ${familyId}`,
      tier: 'core',
      templates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getFamiliesForProduct(product: string, options?: any) {
    return [
      {
        id: 'core-simple',
        name: 'Core Simple',
        tier: 'core',
        templates: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  async renderDocument(templateId: string, userData: DocumentContent, options?: any) {
    return {
      templateId,
      templateVersion: '1.0.0',
      content: '<html><body>Test</body></html>',
      metadata: {
        createdAt: new Date().toISOString(),
        exportFormat: 'html' as const,
        documentType: 'cv' as const,
      },
    };
  }

  async exportPdf(renderedDocument: any) {
    return Buffer.from('PDF content');
  }
}

/**
 * Test data factory functions
 */
export const testDataFactory = {
  /**
   * Create test CV data with overrides
   */
  createCVData(overrides?: Partial<CVData>): CVData {
    return { ...SAMPLE_CV_DATA, ...overrides };
  },

  /**
   * Create test template metadata
   */
  createTemplateMetadata(overrides?: Partial<TemplateMetadata>): TemplateMetadata {
    return {
      id: 'test-template',
      name: 'Test Template',
      version: '1.0.0',
      source: 'native',
      category: 'cv',
      tier: 'core',
      editable_fields: [],
      accessibleTo: ['sumaiya'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  },

  /**
   * Create test template family
   */
  createTemplateFamily(overrides?: Partial<TemplateFamily>): TemplateFamily {
    return {
      id: 'test-family',
      name: 'Test Family',
      tier: 'core',
      templates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  },
};

/**
 * Assertion helpers for template testing
 */
export const templateAssertions = {
  /**
   * Assert that template metadata is valid
   */
  assertValidMetadata(template: TemplateMetadata): void {
    if (!template.id) throw new Error('Template must have an id');
    if (!template.name) throw new Error('Template must have a name');
    if (!template.version) throw new Error('Template must have a version');
    if (!['cv', 'cover-letter', 'reference-sheet', 'other'].includes(template.category)) {
      throw new Error(`Invalid category: ${template.category}`);
    }
    if (!['core', 'premium'].includes(template.tier)) {
      throw new Error(`Invalid tier: ${template.tier}`);
    }
  },

  /**
   * Assert that CV data has required fields
   */
  assertValidCVData(cvData: CVData): void {
    if (!cvData.personal) throw new Error('CV must have personal section');
    if (!cvData.personal.fullName) throw new Error('CV must have full name');
    if (!cvData.experience) throw new Error('CV must have experience array');
    if (!cvData.education) throw new Error('CV must have education array');
    if (!cvData.skills) throw new Error('CV must have skills array');
  },

  /**
   * Assert that HTML output is valid
   */
  assertValidHTML(html: string): void {
    if (!html.includes('<')) throw new Error('HTML must contain opening tags');
    if (!html.includes('>')) throw new Error('HTML must contain closing angles');
    if (!html.trim()) throw new Error('HTML cannot be empty');
  },
};

/**
 * Mock browser environment for testing
 */
export function setupMockBrowser() {
  if (typeof document === 'undefined') {
    (global as any).document = {
      createElement: (tag: string) => ({
        textContent: '',
        innerHTML: '',
      }),
    };
  }
}

/**
 * Cleanup mock browser
 */
export function cleanupMockBrowser() {
  if (typeof document !== 'undefined' && (document as any).__mock) {
    delete (global as any).document;
  }
}
