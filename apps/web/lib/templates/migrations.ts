/**
 * Database migrations for template system
 *
 * Defines migration steps for the new documents table and related tables.
 * Run these migrations when deploying the new template system.
 *
 * Migrations follow the pattern:
 * Phase 1: Add new tables (coexist with old)
 * Phase 2: New writes go to new table
 * Phase 3: Backfill old data
 * Phase 4: Deprecate old tables
 * Phase 5: Delete old tables (after safeguard period)
 */

export const MIGRATIONS = {
  /**
   * Phase 1: Create documents table (primary table for all document types)
   * Supports CV, cover letter, reference sheet
   */
  createDocumentsTable: `
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document identity
  template_id text NOT NULL,
  template_version text NOT NULL,
  category text NOT NULL CHECK (category IN ('cv', 'cover-letter', 'reference-sheet', 'other')),

  -- Document metadata
  title text,
  description text,

  -- Content storage
  content_data jsonb NOT NULL DEFAULT '{}',
  content_snapshot text,  -- Preserved if template changes

  -- Versioning & tracking
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_exported_at timestamp with time zone,
  last_export_format text,

  -- State management
  is_deleted boolean DEFAULT false NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,

  -- Conflict resolution
  version bigint DEFAULT 1 NOT NULL,

  CONSTRAINT valid_content CHECK (jsonb_typeof(content_data) = 'object')
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX IF NOT EXISTS idx_documents_user_category ON documents(user_id, category);
  `,

  /**
   * Phase 1: Create document_exports table
   * Tracks all exports for analytics and version preservation
   */
  createDocumentExportsTable: `
CREATE TABLE IF NOT EXISTS document_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Export details
  export_format text NOT NULL CHECK (export_format IN ('pdf', 'docx', 'html', 'json')),
  file_size bigint,
  file_path text,

  -- Metadata
  export_reason text,  -- 'manual_download', 'auto_backup', 'share', etc.
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_exports_document_id ON document_exports(document_id);
CREATE INDEX IF NOT EXISTS idx_document_exports_user_id ON document_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_document_exports_created_at ON document_exports(created_at);
  `,

  /**
   * Phase 1: Create template_metadata_cache table
   * Local cache of template metadata (optional, for offline support)
   */
  createTemplateMetadataCacheTable: `
CREATE TABLE IF NOT EXISTS template_metadata_cache (
  id text PRIMARY KEY,
  name text NOT NULL,
  version text NOT NULL,
  source text NOT NULL,  -- 'native', 'partner'
  category text NOT NULL,  -- 'cv', 'cover-letter', 'reference-sheet'
  family text,
  description text,
  tier text DEFAULT 'core',
  preview_url text,

  -- Store schema as JSON
  editable_fields jsonb,
  accessible_to jsonb,  -- JSON array of access levels

  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  synced_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_template_metadata_category ON template_metadata_cache(category);
CREATE INDEX IF NOT EXISTS idx_template_metadata_family ON template_metadata_cache(family);
  `,

  /**
   * Phase 1: Create template_families table
   * Reference data for template families (groupings like "Executive Professional")
   */
  createTemplateFamiliesTable: `
CREATE TABLE IF NOT EXISTS template_families (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  tier text DEFAULT 'core',

  -- Templates in this family (stored as JSON array of template IDs)
  templates jsonb DEFAULT '[]'::jsonb,

  preview_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
  `,

  /**
   * Rollback: Drop all new tables (use with caution!)
   */
  rollback: `
DROP TABLE IF EXISTS document_exports CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS template_metadata_cache CASCADE;
DROP TABLE IF EXISTS template_families CASCADE;
  `,
};

/**
 * Migration status tracker
 */
export interface MigrationStatus {
  phase: 1 | 2 | 3 | 4 | 5;
  completedAt: string;
  description: string;
}

/**
 * Get migration SQL for a specific phase
 */
export function getMigrationSQL(phase: 1 | 2 | 3 | 4 | 5): string {
  switch (phase) {
    case 1:
      // Phase 1: Create all new tables
      return [
        MIGRATIONS.createDocumentsTable,
        MIGRATIONS.createDocumentExportsTable,
        MIGRATIONS.createTemplateMetadataCacheTable,
        MIGRATIONS.createTemplateFamiliesTable,
      ].join(';\n');

    case 2:
      // Phase 2: Update application code to write to new tables
      return '-- Phase 2: Update application code to use new documents table';

    case 3:
      // Phase 3: Backfill old data
      return `
-- Phase 3: Backfill existing CVs into documents table
-- Example (adjust table names based on your schema):
-- INSERT INTO documents (user_id, template_id, template_version, category, content_data, created_at, updated_at)
-- SELECT user_id, template_id, '1.0.0', 'cv', content::jsonb, created_at, updated_at
-- FROM old_cvs_table
-- WHERE NOT EXISTS (SELECT 1 FROM documents WHERE documents.user_id = old_cvs_table.user_id);
      `;

    case 4:
      // Phase 4: Deprecate old tables
      return '-- Phase 4: Mark old tables as deprecated (comments, warnings)';

    case 5:
      // Phase 5: Delete old tables
      return `
-- Phase 5: DANGER - Delete old tables (run ONLY after Phase 4 safeguard period)
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_old_template_id;
-- DROP TABLE IF EXISTS old_cvs_table CASCADE;
-- DROP TABLE IF EXISTS old_cover_letters_table CASCADE;
      `;

    default:
      return '-- Unknown phase';
  }
}

/**
 * Helper to check migration status
 */
export async function checkMigrationStatus(
  supabaseClient: any
): Promise<MigrationStatus | null> {
  try {
    // Try to query the documents table
    const { data, error } = await supabaseClient
      .from('documents')
      .select('id')
      .limit(1);

    if (error) {
      return null; // Table doesn't exist yet
    }

    return {
      phase: 1,
      completedAt: new Date().toISOString(),
      description: 'documents table exists',
    };
  } catch {
    return null;
  }
}

/**
 * Backfill helper: Convert old CV data format to new documents format
 */
export function convertCVToDocument(
  oldCV: Record<string, any>,
  userId: string
): Record<string, any> {
  return {
    user_id: userId,
    template_id: oldCV.template_id || 'nakuru',
    template_version: '1.0.0',
    category: 'cv',
    title: oldCV.title || 'CV',
    content_data: {
      personalInfo: oldCV.personal || {},
      summary: oldCV.summary || '',
      experience: oldCV.experience || [],
      education: oldCV.education || [],
      skills: oldCV.skills || [],
      certifications: oldCV.certifications || [],
      languages: oldCV.languages || [],
      volunteer: oldCV.volunteer || [],
      projects: oldCV.projects || [],
    },
    created_at: oldCV.created_at || new Date().toISOString(),
    updated_at: oldCV.updated_at || new Date().toISOString(),
  };
}
