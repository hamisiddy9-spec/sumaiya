/**
 * CV Builder × TemplateProvider Integration
 *
 * Bridges CV editor with TemplateProvider abstraction.
 * Allows CV editor to work with both local and remote templates.
 */

import { templateProvider, type TemplateMetadata, type TemplateFamily } from '@/lib/templates';
import type { TemplateId, CVData } from '@/types';

/**
 * Load templates for template picker
 */
export async function loadCVTemplates(options?: {
  family?: string;
  tier?: 'core' | 'premium';
}): Promise<TemplateMetadata[]> {
  try {
    const templates = await templateProvider.getTemplatesByCategory('cv', {
      family: options?.family,
      tier: options?.tier || 'core',
    });
    return templates;
  } catch (error) {
    console.error('Failed to load CV templates:', error);
    return [];
  }
}

/**
 * Load template families for family picker
 */
export async function loadTemplateFamilies(): Promise<TemplateFamily[]> {
  try {
    const families = await templateProvider.getFamiliesForProduct('sumaiya', {
      category: 'cv',
      tier: 'core',
    });
    return families;
  } catch (error) {
    console.error('Failed to load template families:', error);
    return [];
  }
}

/**
 * Get a single template metadata
 */
export async function getTemplateMetadata(templateId: string): Promise<TemplateMetadata | null> {
  try {
    return await templateProvider.getTemplate(templateId);
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
}

/**
 * Render CV preview using template
 */
export async function renderCVPreview(
  templateId: string,
  cvData: CVData,
  options?: { lang?: 'en' | 'sw' }
): Promise<string | null> {
  try {
    const rendered = await templateProvider.renderDocument(templateId, cvData as any, options);
    return rendered.content;
  } catch (error) {
    console.error(`Failed to render CV with template ${templateId}:`, error);
    return null;
  }
}

/**
 * Export CV to PDF
 */
export async function exportCVToPDF(
  templateId: string,
  cvData: CVData,
  options?: { lang?: 'en' | 'sw'; filename?: string }
): Promise<Blob | null> {
  try {
    const rendered = await templateProvider.renderDocument(templateId, cvData as any, options);
    const pdf = await templateProvider.exportPdf(rendered);
    return new Blob([new Uint8Array(pdf)], { type: 'application/pdf' });
  } catch (error) {
    console.error(`Failed to export CV as PDF:`, error);
    return null;
  }
}

/**
 * Get recommended template for user profile
 * (AI-powered recommendation logic goes here)
 */
export async function getRecommendedTemplate(cvData: CVData): Promise<TemplateMetadata | null> {
  try {
    // TODO: Implement AI recommendation logic
    // For now, return first core template
    const templates = await loadCVTemplates({ tier: 'core' });
    return templates[0] || null;
  } catch (error) {
    console.error('Failed to get recommended template:', error);
    return null;
  }
}

/**
 * Get matching cover letter template for a CV template
 */
export async function getMatchingCoverLetterTemplate(
  cvTemplateId: string
): Promise<TemplateMetadata | null> {
  try {
    // Get the CV template's family
    const cvTemplate = await getTemplateMetadata(cvTemplateId);
    if (!cvTemplate?.family) return null;

    // Find matching cover letter in same family
    const coverLetters = await templateProvider.getTemplatesByCategory('cover-letter', {
      family: cvTemplate.family,
    });

    return coverLetters[0] || null;
  } catch (error) {
    console.error('Failed to get matching cover letter:', error);
    return null;
  }
}

/**
 * Hook-compatible wrapper for React components
 */
export function useTemplateProvider() {
  return {
    loadCVTemplates,
    loadTemplateFamilies,
    getTemplateMetadata,
    renderCVPreview,
    exportCVToPDF,
    getRecommendedTemplate,
    getMatchingCoverLetterTemplate,
  };
}
