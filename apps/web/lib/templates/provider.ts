/**
 * TemplateProvider — The Abstraction Layer
 *
 * The contract the template system is used through, so callers depend on the
 * shape of a provider rather than on the local implementation.
 *
 * Implemented by: NativeTemplateProvider (the templates shipped in the app).
 */

export type { TemplateProvider } from './schema';
export type {
  TemplateMetadata,
  TemplateFamily,
  TemplateFamilyMember,
  DocumentContent,
  RenderedDocument,
  StoredDocument,
  EditableFieldSpec,
} from './schema';

export {
  type TemplateSource,
  type TemplateCategory,
  type AccessLevel,
  type FieldType,
} from './schema';
