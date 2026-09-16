/**
 * TemplateProvider — The Abstraction Layer
 *
 * This interface allows Sumaiya to work with different template backends
 * without depending on their implementation.
 *
 * Currently implemented by: NativeTemplateProvider (local 273 templates)
 * Future implementations: TemplateHubProvider (remote API), etc.
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
