/**
 * Template type definitions
 * Mirrors lib/templates/schema.ts from Sumaiya
 */

export interface TemplateMetadata {
  id: string;
  name: string;
  version: string;
  source: 'native' | 'templatehub' | 'partner';
  category: 'cv' | 'cover-letter' | 'reference-sheet' | 'other';
  family?: string;
  description?: string;
  preview?: string;
  tier: 'core' | 'premium';
  editable_fields: EditableFieldSpec[];
  accessibleTo: AccessLevel[];
  createdAt: string;
  updatedAt: string;
}

export interface EditableFieldSpec {
  path: string;
  type: FieldType;
  label?: string;
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
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

export type AccessLevel = 'sumaiya' | 'templatehub' | 'public' | 'premium';

export interface TemplateFamily {
  id: string;
  name: string;
  description?: string;
  tier: 'core' | 'premium';
  templates: TemplateFamilyMember[];
  preview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFamilyMember {
  templateId: string;
  category: 'cv' | 'cover-letter' | 'reference-sheet' | 'other';
  role: 'primary' | 'matching' | 'supporting';
  position?: number;
  accessibleTo?: AccessLevel[];
}
