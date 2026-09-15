/**
 * Template Schemas — Phase 3
 *
 * Structured definitions of editable fields for each template.
 * This allows AI to intelligently populate templates and ensures type safety.
 *
 * Each template has a schema that defines:
 * - What fields are editable
 * - What data type each field expects
 * - Validation rules
 * - Dependencies between fields
 */

import { EditableFieldSpec } from './schema';

/**
 * Standard CV schema - used by most templates
 * Can be extended or overridden per template if needed
 */
export const STANDARD_CV_SCHEMA: EditableFieldSpec[] = [
  {
    path: 'personalInfo.fullName',
    type: 'text',
    label: 'Full Name',
    required: true,
    validation: {
      minLength: 2,
      maxLength: 100,
    },
  },
  {
    path: 'personalInfo.email',
    type: 'email',
    label: 'Email',
    required: true,
  },
  {
    path: 'personalInfo.phone',
    type: 'phone',
    label: 'Phone Number',
    required: false,
  },
  {
    path: 'personalInfo.location',
    type: 'text',
    label: 'Location',
    required: false,
    placeholder: 'City, Country',
  },
  {
    path: 'personalInfo.headline',
    type: 'text',
    label: 'Professional Headline',
    required: false,
    placeholder: 'e.g., Senior Software Engineer | Cloud Architecture',
    validation: {
      maxLength: 120,
    },
  },
  {
    path: 'personalInfo.url',
    type: 'url',
    label: 'Portfolio / Website',
    required: false,
  },
  {
    path: 'summary',
    type: 'multiline',
    label: 'Professional Summary',
    required: false,
    placeholder: '2-3 sentences about your career goals and key strengths',
    validation: {
      maxLength: 500,
    },
  },
  {
    path: 'experience',
    type: 'array',
    label: 'Professional Experience',
    required: false,
    itemSchema: {
      company: 'text',
      title: 'text',
      startDate: 'date',
      endDate: 'date',
      isCurrent: 'boolean',
      description: 'multiline',
      keyAchievements: 'array',
    },
  },
  {
    path: 'education',
    type: 'array',
    label: 'Education',
    required: false,
    itemSchema: {
      institution: 'text',
      degree: 'text',
      field: 'text',
      graduationDate: 'date',
      gpa: 'text',
    },
  },
  {
    path: 'certifications',
    type: 'array',
    label: 'Certifications & Licenses',
    required: false,
    itemSchema: {
      name: 'text',
      issuer: 'text',
      issueDate: 'date',
      expiryDate: 'date',
      credentialUrl: 'url',
    },
  },
  {
    path: 'skills',
    type: 'array',
    label: 'Skills',
    required: false,
    itemSchema: {
      name: 'text',
      level: 'enum', // beginner|intermediate|advanced|expert
      endorsements: 'number',
    },
  },
  {
    path: 'languages',
    type: 'array',
    label: 'Languages',
    required: false,
    itemSchema: {
      language: 'text',
      proficiency: 'enum', // native|fluent|intermediate|basic
    },
  },
  {
    path: 'projects',
    type: 'array',
    label: 'Projects & Publications',
    required: false,
    itemSchema: {
      name: 'text',
      description: 'multiline',
      url: 'url',
      date: 'date',
    },
  },
  {
    path: 'volunteer',
    type: 'array',
    label: 'Volunteer Experience',
    required: false,
    itemSchema: {
      organization: 'text',
      role: 'text',
      description: 'multiline',
      startDate: 'date',
      endDate: 'date',
    },
  },
];

/**
 * Template-specific schema overrides
 * If a template needs different fields, define it here
 */

export const TEMPLATE_SCHEMAS: Record<string, EditableFieldSpec[]> = {
  // Core templates
  'simple-cv': STANDARD_CV_SCHEMA,
  'professional-cv': STANDARD_CV_SCHEMA,
  'ats-cv': STANDARD_CV_SCHEMA,

  // Professional minimal variants - all use standard schema
  alpine: STANDARD_CV_SCHEMA,
  aberdare: STANDARD_CV_SCHEMA,
  athens: STANDARD_CV_SCHEMA,
  atlanta: STANDARD_CV_SCHEMA,

  // ATS variants
  apex: STANDARD_CV_SCHEMA,
  artemis: STANDARD_CV_SCHEMA,

  // Other templates fallback to standard
  altus: STANDARD_CV_SCHEMA,
  aurora: STANDARD_CV_SCHEMA,

  // TODO: Add schema overrides for templates that have unique fields
  // Example:
  // 'executive-cv': [
  //   ...STANDARD_CV_SCHEMA,
  //   { path: 'boardMemberships', type: 'array', ... },
  //   { path: 'publications', type: 'array', ... },
  // ]
};

/**
 * Get schema for a template
 * Returns standard schema if template-specific one doesn't exist
 */
export function getTemplateSchema(templateId: string): EditableFieldSpec[] {
  return TEMPLATE_SCHEMAS[templateId] || STANDARD_CV_SCHEMA;
}

/**
 * Schema version
 * Increment when breaking changes to field structure
 */
export const SCHEMA_VERSION = '1.0.0';
