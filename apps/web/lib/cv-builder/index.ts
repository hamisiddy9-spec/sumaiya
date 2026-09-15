/**
 * CV Builder Integration
 *
 * Bridges CV editor with TemplateProvider abstraction.
 * Provides utilities and hooks for:
 * - Loading templates
 * - Rendering CVs
 * - Exporting to PDF/HTML/JSON
 * - Template recommendations
 */

export {
  loadCVTemplates,
  loadTemplateFamilies,
  getTemplateMetadata,
  renderCVPreview,
  exportCVToPDF,
  getRecommendedTemplate,
  getMatchingCoverLetterTemplate,
  useTemplateProvider,
} from './template-integration';

export { useTemplateProviderHook } from './use-template-provider';
export { useCVExport } from './use-cv-export';
export {
  getTemplateComponent,
  hasTemplateComponent,
  getAvailableTemplateIds,
  renderTemplateComponent,
} from './template-adapter';
