/**
 * Template Schema & Type Definitions
 *
 * This is the contract that all TemplateProviders must implement.
 * Both NativeTemplateProvider (local) and future TemplateHubProvider (remote)
 * expose the same interface.
 */

export type TemplateSource = 'native' | 'templatehub' | 'partner';
export type TemplateCategory = 'cv' | 'cover-letter' | 'reference-sheet' | 'other';
export type AccessLevel = 'sumaiya' | 'templatehub' | 'public' | 'premium';

/**
 * Metadata for a single template (CV, cover letter, etc.)
 */
export interface TemplateMetadata {
  // Identity
  id: string; // e.g., "apex-ats"
  name: string; // e.g., "Apex ATS"
  version: string; // e.g., "1.0.0"

  // Classification
  source: TemplateSource;
  category: TemplateCategory;
  family?: string; // e.g., "ats-optimized" — groups related templates

  // Presentation
  description?: string;
  preview?: string; // URL or base64 image

  // Structure
  editable_fields: EditableFieldSpec[];

  // Access & Monetization
  tier: 'core' | 'premium';
  accessibleTo: AccessLevel[];

  // Metadata
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * A field that users can edit in a template
 * Defines the structure of user-editable content
 */
export interface EditableFieldSpec {
  path: string; // e.g., "personalInfo.fullName" or "experience[].title"
  type: FieldType;
  label?: string; // User-facing label
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string; // regex
    minLength?: number;
    maxLength?: number;
  };
  // For array fields
  itemSchema?: Record<string, FieldType>;
}

export type FieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'multiline'
  | 'date'
  | 'number'
  | 'enum'
  | 'array'
  | 'boolean';

/**
 * A template family groups related templates
 * Example: Executive Collection = CV + Cover Letter + Reference Sheet
 */
export interface TemplateFamily {
  id: string; // e.g., "executive-professional"
  name: string; // e.g., "Executive Professional"
  description?: string;
  tier: 'core' | 'premium';

  // Which templates belong to this family
  templates: TemplateFamilyMember[];

  // Preview/banner image
  preview?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * A member of a template family
 */
export interface TemplateFamilyMember {
  templateId: string;
  category: TemplateCategory;
  role: 'primary' | 'matching' | 'supporting'; // primary=main, matching=paired, supporting=optional
  position?: number; // order in family
}

/**
 * User-provided document content (from profile, form entry, etc.)
 */
export interface DocumentContent {
  [key: string]: unknown;

  // Standard fields (for CV)
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
  };

  summary?: string;

  experience?: Array<{
    company?: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    keyAchievements?: string[];
  }>;

  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    graduationDate?: string;
  }>;

  skills?: Array<{
    name?: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;

  // Additional custom fields for other document types
  [customField: string]: unknown;
}

/**
 * A rendered document (HTML or ready for PDF)
 */
export interface RenderedDocument {
  templateId: string;
  templateVersion: string;
  content: string; // HTML/React render or pre-rendered content

  metadata: {
    createdAt: string;
    exportFormat: 'pdf' | 'docx' | 'html';
    documentType: TemplateCategory;
  };
}

/**
 * Main TemplateProvider interface
 * Implementations: NativeTemplateProvider, TemplateHubProvider, etc.
 */
export interface TemplateProvider {
  /**
   * Get a single template by ID
   */
  getTemplate(id: string): Promise<TemplateMetadata | null>;

  /**
   * Get templates by category with optional filtering
   */
  getTemplatesByCategory(
    category: TemplateCategory,
    options?: {
      family?: string;
      tier?: 'core' | 'premium';
      source?: TemplateSource;
      limit?: number;
    }
  ): Promise<TemplateMetadata[]>;

  /**
   * Get a complete template family (e.g., CV + cover letter + reference sheet)
   */
  getTemplateFamily(familyId: string): Promise<TemplateFamily | null>;

  /**
   * Get families available for a specific product (curated list)
   */
  getFamiliesForProduct(
    product: string, // e.g., 'sumaiya'
    options?: {
      category?: TemplateCategory;
      tier?: 'core' | 'premium';
    }
  ): Promise<TemplateFamily[]>;

  /**
   * Render a document from template + user data
   */
  renderDocument(
    templateId: string,
    userData: DocumentContent,
    options?: {
      lang?: 'en' | 'sw';
    }
  ): Promise<RenderedDocument>;

  /**
   * Export rendered document to PDF
   */
  exportPdf(renderedDocument: RenderedDocument): Promise<Buffer>;
}

/**
 * Document stored in Sumaiya database
 * Links user data to a specific template version
 */
export interface StoredDocument {
  id: string;
  userId: string;
  templateId: string;
  templateVersion: string;
  category: TemplateCategory;
  title?: string;
  contentData: DocumentContent; // Raw user data
  contentSnapshot?: string; // For backcompat if template changes
  createdAt: string;
  updatedAt: string;
  exportedAt?: string;
  exportedFormat?: 'pdf' | 'docx' | 'html';
}
