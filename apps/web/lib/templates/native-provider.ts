/**
 * NativeTemplateProvider — Local Template Implementation
 *
 * Serves the templates that ship with the app (267 template files, 266 registry
 * entries), read from the local registry. This is the only implementation: an
 * offline-first product cannot fetch templates over HTTP (docs/DECISIONS.md D1).
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
import { getCvTemplateTier } from './tiers';
import { isImageDataUrl } from '@/lib/photo-upload';

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

    // Filter by tier if specified. CV templates resolve their tier from the
    // live curation (premium / core / legacy) instead of the generated
    // registry's uniform "core" stamp; other categories use their own field.
    if (options?.tier) {
      results = results.filter((t) => {
        const tier = t.category === 'cv' ? getCvTemplateTier(t.id) : t.tier;
        return tier === options.tier;
      });
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

    // For other products, return all families (for now, no access control)
    return TEMPLATE_FAMILIES;
  }

  /**
   * Render a document from template + user data
   *
   * Loads the template component dynamically and renders with user data.
   * Currently returns HTML string; can be extended for React rendering.
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

    try {
      // Dynamically load template component from components/templates
      // For now, return a structured HTML that can be rendered
      const html = this.buildTemplateHtml(templateId, userData, template);

      return {
        templateId,
        templateVersion: template.version,
        content: html,
        metadata: {
          createdAt: new Date().toISOString(),
          exportFormat: 'html',
          documentType: template.category,
        },
      };
    } catch (error) {
      throw new Error(`Failed to render template ${templateId}: ${error}`);
    }
  }

  /**
   * Build HTML from template + user data
   * This is a bridge for client-side rendering.
   * Real implementation may use React.renderToString() or puppeteer.
   */
  private buildTemplateHtml(
    templateId: string,
    userData: DocumentContent,
    template: TemplateMetadata
  ): string {
    // Extract personal info
    const personalInfo = userData.personalInfo as Record<string, any> || {};
    const fullName = personalInfo.fullName || 'Your Name';
    const email = personalInfo.email || '';
    const phone = personalInfo.phone || '';
    const location = personalInfo.location || '';
    const headline = personalInfo.headline || '';
    // The profile photo. Only a strict image data URL is ever emitted into an
    // attribute — see isImageDataUrl for why a prefix match is not enough here.
    // Anything else is dropped, so a hostile value in the document can never
    // reach the markup. Absent => the header renders exactly as it did before
    // (no empty frame, no reserved gap).
    const photo = isImageDataUrl(personalInfo.photo) ? personalInfo.photo : '';

    // Extract experience
    const experience = Array.isArray(userData.experience)
      ? userData.experience
      : [];

    // Extract education
    const education = Array.isArray(userData.education)
      ? userData.education
      : [];

    // Extract skills
    const skills = Array.isArray(userData.skills)
      ? userData.skills
      : [];

    // Build minimal HTML structure (will be replaced with actual template rendering)
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(fullName)} - CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 8.5in; height: 11in; margin: 0 auto; padding: 0.5in; background: white; }
    .header { border-bottom: 2px solid #333; padding-bottom: 1rem; margin-bottom: 1rem; }
    .header-row { display: flex; align-items: center; gap: 16px; }
    .photo { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; flex-shrink: 0; display: block; }
    .identity { flex: 1 1 auto; min-width: 0; }
    .name { font-size: 24px; font-weight: bold; margin-bottom: 0.25rem; }
    .contact { font-size: 12px; color: #666; }
    .section { margin-bottom: 1.5rem; }
    .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 0.25rem; margin-bottom: 0.5rem; }
    .entry { margin-bottom: 0.75rem; }
    .entry-title { font-weight: bold; }
    .entry-subtitle { font-size: 12px; color: #666; font-style: italic; }
    .entry-description { font-size: 12px; margin-top: 0.25rem; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 0.5rem; font-size: 12px; }
    .skill-tag { background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-row">
        ${photo ? `<img class="photo" src="${photo}" alt="${this.escapeHtml(fullName)}" />` : ''}
        <div class="identity">
          <div class="name">${this.escapeHtml(fullName)}</div>
          ${headline ? `<div class="contact">${this.escapeHtml(headline)}</div>` : ''}
          <div class="contact">
            ${email ? `${this.escapeHtml(email)}` : ''}
            ${email && phone ? ' • ' : ''}
            ${phone ? `${this.escapeHtml(phone)}` : ''}
            ${(email || phone) && location ? ' • ' : ''}
            ${location ? `${this.escapeHtml(location)}` : ''}
          </div>
        </div>
      </div>
    </div>

    ${experience.length > 0 ? `
    <div class="section">
      <div class="section-title">Experience</div>
      ${experience.map((exp: any) => `
        <div class="entry">
          <div class="entry-title">${this.escapeHtml(exp.title || '')}</div>
          <div class="entry-subtitle">${this.escapeHtml(exp.company || '')}</div>
          ${exp.description ? `<div class="entry-description">${this.escapeHtml(exp.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${education.length > 0 ? `
    <div class="section">
      <div class="section-title">Education</div>
      ${education.map((edu: any) => `
        <div class="entry">
          <div class="entry-title">${this.escapeHtml(edu.degree || '')}</div>
          <div class="entry-subtitle">${this.escapeHtml(edu.institution || '')}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${skills.length > 0 ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-list">
        ${skills.map((skill: any) => `
          <div class="skill-tag">${this.escapeHtml(skill.name || '')}</div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.textContent = text;
      return div.innerHTML;
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Export rendered document to PDF
   *
   * In browser: uses renderElementToPdfBlob from lib/pdf.ts
   * On server: would use puppeteer or wkhtmltopdf
   *
   * For now, returns a Buffer with instructions on client-side rendering.
   * Real implementation should handle this via API endpoint.
   */
  async exportPdf(renderedDocument: RenderedDocument): Promise<Buffer> {
    // The actual PDF generation should happen client-side or via an API endpoint
    // This is a placeholder that indicates client-side handling

    const result = {
      templateId: renderedDocument.templateId,
      html: renderedDocument.content,
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.75in',
        bottom: '0.5in',
        left: '0.75in',
      },
    };

    // Return JSON metadata that can be picked up by client-side PDF handler
    return Buffer.from(JSON.stringify(result));
  }
}

/**
 * Singleton instance
 */
export const nativeTemplateProvider = new NativeTemplateProvider();
