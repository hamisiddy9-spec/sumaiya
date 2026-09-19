/**
 * Phase 4: Database Schema for Template System
 *
 * This schema separates template infrastructure from Sumaiya logic.
 *
 * For now: Add to Sumaiya database
 */

-- ============================================================================
-- DOCUMENTS TABLE
-- Unified storage for all document types (CV, cover letter, reference sheet)
-- Replaces scattered cvs, cover_letters, etc. tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,

  -- Template reference
  template_id VARCHAR(255) NOT NULL,
  template_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',

  -- Document type
  category VARCHAR(50) NOT NULL, -- 'cv', 'cover-letter', 'reference-sheet', etc.

  -- Metadata
  title VARCHAR(255),
  description TEXT,

  -- Content
  content_data JSON NOT NULL, -- Full user data (name, email, experience, etc.)
  content_snapshot TEXT, -- Preserved HTML snapshot of rendered document

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Export tracking
  last_exported_at TIMESTAMP NULL,
  last_export_format VARCHAR(20), -- 'pdf', 'docx', 'html'

  -- Search/visibility
  is_deleted BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Versioning for conflict resolution
  version BIGINT DEFAULT 1,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Indexes
  KEY idx_user_id (user_id),
  KEY idx_category (category),
  KEY idx_template_id (template_id),
  KEY idx_created_at (created_at),
  KEY idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DOCUMENT_EXPORTS TABLE
-- Track exports for analytics and versioning
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_exports (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,

  -- Export details
  export_format VARCHAR(20) NOT NULL, -- 'pdf', 'docx', 'html'
  file_size INT, -- bytes
  file_path VARCHAR(512), -- S3 path or local path

  -- Metadata
  export_reason VARCHAR(100), -- 'download', 'share', 'preview', etc.

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Cleanup
  expires_at TIMESTAMP NULL, -- For temporary shares (90 days default)

  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  KEY idx_document_id (document_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TEMPLATE_METADATA TABLE (future)
-- Keep this schema for reference and local caching.
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_metadata_cache (
  id VARCHAR(255) PRIMARY KEY,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  version VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'native', 'partner'
  category VARCHAR(50) NOT NULL, -- 'cv', 'cover-letter', etc.
  family VARCHAR(100),

  -- Metadata
  description TEXT,
  tier VARCHAR(20) NOT NULL, -- 'core', 'premium'
  preview_url VARCHAR(512),

  -- Schema
  editable_fields JSON, -- Array of field definitions

  -- Access control
  accessible_to JSON, -- Array of product IDs

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  synced_at TIMESTAMP NULL, -- Last refresh of the cached metadata

  KEY idx_source (source),
  KEY idx_category (category),
  KEY idx_family (family),
  KEY idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TEMPLATE_FAMILIES TABLE (future)
-- Defines groups of related templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_families (
  id VARCHAR(100) PRIMARY KEY,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tier VARCHAR(20) NOT NULL, -- 'core', 'premium'

  -- Members (stored as JSON for simplicity, could be separate table)
  templates JSON NOT NULL, -- Array of {templateId, category, role, position}

  -- Metadata
  preview_url VARCHAR(512),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
--
-- These tables are designed to:
-- 1. Unify document storage (cv, cover_letter, reference_sheet → documents)
-- 2. Support template versioning (documents know which template_version was used)
-- 3. Preserve snapshots (content_snapshot prevents changes to old template breaks)
-- 4. Enable analytics (document_exports tracks what users do)
--
-- Migration path:
-- Phase 1 (now): Add these tables, keep old tables
-- Phase 2 (week 3): Update CV builder to use documents table
-- Phase 3 (week 5): Backfill documents from old tables
-- Phase 4 (week 6): Deprecate old cv/cover_letter tables
-- Phase 5 (week 12): Delete old tables
--
-- During Phase 1-2: Both systems coexist. Reads can use either.
--                   Writes go to new documents table.
-- ============================================================================
