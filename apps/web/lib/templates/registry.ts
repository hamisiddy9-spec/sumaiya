/**
 * GENERATED: apps/web/scripts/generate-template-registry.mjs
 *
 * Template metadata for all 267 CV templates in Sumaiya.
 *
 * Do NOT edit manually. Run:
 *   cd apps/web
 *   node scripts/generate-template-registry.mjs
 *
 * This registry will eventually be replaced by TemplateHub API when available.
 */

import { TemplateMetadata } from './schema';

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  "aberdare": {
    "id": "aberdare",
    "name": "Aberdare",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "alpine": {
    "id": "alpine",
    "name": "Alpine",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "altus": {
    "id": "altus",
    "name": "Altus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "modern-specialist",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "apex": {
    "id": "apex",
    "name": "Apex",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "ats-optimized",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ascent": {
    "id": "ascent",
    "name": "Ascent",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "athens": {
    "id": "athens",
    "name": "Athens",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "athi": {
    "id": "athi",
    "name": "Athi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlanta": {
    "id": "atlanta",
    "name": "Atlanta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "professional-minimal",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlas-v2": {
    "id": "atlas-v2",
    "name": "Atlas V2",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "atlas": {
    "id": "atlas",
    "name": "Atlas",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "aurora-edge": {
    "id": "aurora-edge",
    "name": "Aurora Edge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "aurora-two": {
    "id": "aurora-two",
    "name": "Aurora Two",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "austin": {
    "id": "austin",
    "name": "Austin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "avant-garde-cv": {
    "id": "avant-garde-cv",
    "name": "Avant Garde Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "awash": {
    "id": "awash",
    "name": "Awash",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "axis": {
    "id": "axis",
    "name": "Axis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baltimore": {
    "id": "baltimore",
    "name": "Baltimore",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bangweulu": {
    "id": "bangweulu",
    "name": "Bangweulu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baro": {
    "id": "baro",
    "name": "Baro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baroque-cv": {
    "id": "baroque-cv",
    "name": "Baroque Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "baskerville-cv": {
    "id": "baskerville-cv",
    "name": "Baskerville Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bauhaus": {
    "id": "bauhaus",
    "name": "Bauhaus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bento": {
    "id": "bento",
    "name": "Bento",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "berlin": {
    "id": "berlin",
    "name": "Berlin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bloom": {
    "id": "bloom",
    "name": "Bloom",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "bodoni-cv": {
    "id": "bodoni-cv",
    "name": "Bodoni Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "boston": {
    "id": "boston",
    "name": "Boston",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "brisk": {
    "id": "brisk",
    "name": "Brisk",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "brutalist-cv": {
    "id": "brutalist-cv",
    "name": "Brutalist Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "budapest": {
    "id": "budapest",
    "name": "Budapest",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "busia": {
    "id": "busia",
    "name": "Busia",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cameo": {
    "id": "cameo",
    "name": "Cameo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "canvas-magazine": {
    "id": "canvas-magazine",
    "name": "Canvas Magazine",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "canyon": {
    "id": "canyon",
    "name": "Canyon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "capsule": {
    "id": "capsule",
    "name": "Capsule",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "carbon": {
    "id": "carbon",
    "name": "Carbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cascade": {
    "id": "cascade",
    "name": "Cascade",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "caslon": {
    "id": "caslon",
    "name": "Caslon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cavendish": {
    "id": "cavendish",
    "name": "Cavendish",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "celeste": {
    "id": "celeste",
    "name": "Celeste",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "charlotte": {
    "id": "charlotte",
    "name": "Charlotte",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "chicago": {
    "id": "chicago",
    "name": "Chicago",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "chrome": {
    "id": "chrome",
    "name": "Chrome",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cincinnati": {
    "id": "cincinnati",
    "name": "Cincinnati",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cipher": {
    "id": "cipher",
    "name": "Cipher",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cirrus": {
    "id": "cirrus",
    "name": "Cirrus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "clarendon-cv": {
    "id": "clarendon-cv",
    "name": "Clarendon Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "classical-cv": {
    "id": "classical-cv",
    "name": "Classical Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "clean-cv": {
    "id": "clean-cv",
    "name": "Clean Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cobalt": {
    "id": "cobalt",
    "name": "Cobalt",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cobblestone": {
    "id": "cobblestone",
    "name": "Cobblestone",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cocoa": {
    "id": "cocoa",
    "name": "Cocoa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "collage": {
    "id": "collage",
    "name": "Collage",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "console": {
    "id": "console",
    "name": "Console",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "constructivist": {
    "id": "constructivist",
    "name": "Constructivist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "contour": {
    "id": "contour",
    "name": "Contour",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "copenhagen": {
    "id": "copenhagen",
    "name": "Copenhagen",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "coral": {
    "id": "coral",
    "name": "Coral",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cosmos": {
    "id": "cosmos",
    "name": "Cosmos",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "crimson": {
    "id": "crimson",
    "name": "Crimson",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cumulus": {
    "id": "cumulus",
    "name": "Cumulus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "cunene": {
    "id": "cunene",
    "name": "Cunene",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dadaist": {
    "id": "dadaist",
    "name": "Dadaist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dallas": {
    "id": "dallas",
    "name": "Dallas",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "de-stijl": {
    "id": "de-stijl",
    "name": "De Stijl",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "deco-cv": {
    "id": "deco-cv",
    "name": "Deco Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "delta": {
    "id": "delta",
    "name": "Delta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "denim": {
    "id": "denim",
    "name": "Denim",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "denver": {
    "id": "denver",
    "name": "Denver",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "detroit": {
    "id": "detroit",
    "name": "Detroit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "diani": {
    "id": "diani",
    "name": "Diani",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "didot-cv": {
    "id": "didot-cv",
    "name": "Didot Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dubai": {
    "id": "dubai",
    "name": "Dubai",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dublin": {
    "id": "dublin",
    "name": "Dublin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "dusk": {
    "id": "dusk",
    "name": "Dusk",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "eclipse": {
    "id": "eclipse",
    "name": "Eclipse",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "edge": {
    "id": "edge",
    "name": "Edge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ember": {
    "id": "ember",
    "name": "Ember",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "equinox": {
    "id": "equinox",
    "name": "Equinox",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "estuary": {
    "id": "estuary",
    "name": "Estuary",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ewaso": {
    "id": "ewaso",
    "name": "Ewaso",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "executive-one": {
    "id": "executive-one",
    "name": "Executive One",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "fjord": {
    "id": "fjord",
    "name": "Fjord",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "flux": {
    "id": "flux",
    "name": "Flux",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "folio": {
    "id": "folio",
    "name": "Folio",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "fractal": {
    "id": "fractal",
    "name": "Fractal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "futura-cv": {
    "id": "futura-cv",
    "name": "Futura Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "futurism-cv": {
    "id": "futurism-cv",
    "name": "Futurism Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "galana": {
    "id": "galana",
    "name": "Galana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gambia-cv": {
    "id": "gambia-cv",
    "name": "Gambia Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "garamond-cv": {
    "id": "garamond-cv",
    "name": "Garamond Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "garissa": {
    "id": "garissa",
    "name": "Garissa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gash": {
    "id": "gash",
    "name": "Gash",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "geneva": {
    "id": "geneva",
    "name": "Geneva",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "graphite": {
    "id": "graphite",
    "name": "Graphite",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "gravity": {
    "id": "gravity",
    "name": "Gravity",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "grid": {
    "id": "grid",
    "name": "Grid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "haven": {
    "id": "haven",
    "name": "Haven",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "helsinki": {
    "id": "helsinki",
    "name": "Helsinki",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "herald-cv": {
    "id": "herald-cv",
    "name": "Herald Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "herald": {
    "id": "herald",
    "name": "Herald",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "highland": {
    "id": "highland",
    "name": "Highland",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "homabay": {
    "id": "homabay",
    "name": "Homabay",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "horizon": {
    "id": "horizon",
    "name": "Horizon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "houston": {
    "id": "houston",
    "name": "Houston",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "imperial": {
    "id": "imperial",
    "name": "Imperial",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "impressionist-cv": {
    "id": "impressionist-cv",
    "name": "Impressionist Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "indianapolis": {
    "id": "indianapolis",
    "name": "Indianapolis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "inset": {
    "id": "inset",
    "name": "Inset",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "istanbul": {
    "id": "istanbul",
    "name": "Istanbul",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "jade": {
    "id": "jade",
    "name": "Jade",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kagera": {
    "id": "kagera",
    "name": "Kagera",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kajiado": {
    "id": "kajiado",
    "name": "Kajiado",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kariba": {
    "id": "kariba",
    "name": "Kariba",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kavango": {
    "id": "kavango",
    "name": "Kavango",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kericho": {
    "id": "kericho",
    "name": "Kericho",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kibo": {
    "id": "kibo",
    "name": "Kibo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kilimanjaro": {
    "id": "kilimanjaro",
    "name": "Kilimanjaro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kioo": {
    "id": "kioo",
    "name": "Kioo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kisii": {
    "id": "kisii",
    "name": "Kisii",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "kitale": {
    "id": "kitale",
    "name": "Kitale",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lagoon": {
    "id": "lagoon",
    "name": "Lagoon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "laikipia": {
    "id": "laikipia",
    "name": "Laikipia",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lamu": {
    "id": "lamu",
    "name": "Lamu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ledge": {
    "id": "ledge",
    "name": "Ledge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ledger": {
    "id": "ledger",
    "name": "Ledger",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "limpopo-cv": {
    "id": "limpopo-cv",
    "name": "Limpopo Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "linen": {
    "id": "linen",
    "name": "Linen",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lisbon": {
    "id": "lisbon",
    "name": "Lisbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lodge": {
    "id": "lodge",
    "name": "Lodge",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "louisville": {
    "id": "louisville",
    "name": "Louisville",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lukuga": {
    "id": "lukuga",
    "name": "Lukuga",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "lunar": {
    "id": "lunar",
    "name": "Lunar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "machakos": {
    "id": "machakos",
    "name": "Machakos",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "madrid": {
    "id": "madrid",
    "name": "Madrid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "malachite": {
    "id": "malachite",
    "name": "Malachite",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "malindi": {
    "id": "malindi",
    "name": "Malindi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mareb": {
    "id": "mareb",
    "name": "Mareb",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "margin": {
    "id": "margin",
    "name": "Margin",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "marlowe": {
    "id": "marlowe",
    "name": "Marlowe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "marsabit": {
    "id": "marsabit",
    "name": "Marsabit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "melbourne": {
    "id": "melbourne",
    "name": "Melbourne",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "memphis": {
    "id": "memphis",
    "name": "Memphis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meridian": {
    "id": "meridian",
    "name": "Meridian",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mesa": {
    "id": "mesa",
    "name": "Mesa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "metro": {
    "id": "metro",
    "name": "Metro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "miami-cv": {
    "id": "miami-cv",
    "name": "Miami Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "migori": {
    "id": "migori",
    "name": "Migori",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "minneapolis": {
    "id": "minneapolis",
    "name": "Minneapolis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "modernist-cv": {
    "id": "modernist-cv",
    "name": "Modernist Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mombasa": {
    "id": "mombasa",
    "name": "Mombasa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "monarch": {
    "id": "monarch",
    "name": "Monarch",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mono-cv": {
    "id": "mono-cv",
    "name": "Mono Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "montage": {
    "id": "montage",
    "name": "Montage",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "montreal": {
    "id": "montreal",
    "name": "Montreal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "mosaic": {
    "id": "mosaic",
    "name": "Mosaic",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "moyale": {
    "id": "moyale",
    "name": "Moyale",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "muse": {
    "id": "muse",
    "name": "Muse",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nairobi": {
    "id": "nairobi",
    "name": "Nairobi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nakuru": {
    "id": "nakuru",
    "name": "Nakuru",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "narok": {
    "id": "narok",
    "name": "Narok",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "narrative": {
    "id": "narrative",
    "name": "Narrative",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nashville": {
    "id": "nashville",
    "name": "Nashville",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nebula": {
    "id": "nebula",
    "name": "Nebula",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neoclassical-cv": {
    "id": "neoclassical-cv",
    "name": "Neoclassical Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neon": {
    "id": "neon",
    "name": "Neon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "neural": {
    "id": "neural",
    "name": "Neural",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nile": {
    "id": "nile",
    "name": "Nile",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nimbus": {
    "id": "nimbus",
    "name": "Nimbus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nordic-minimal": {
    "id": "nordic-minimal",
    "name": "Nordic Minimal",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nova": {
    "id": "nova",
    "name": "Nova",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "nuru": {
    "id": "nuru",
    "name": "Nuru",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ocean": {
    "id": "ocean",
    "name": "Ocean",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "okavango": {
    "id": "okavango",
    "name": "Okavango",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "onyx": {
    "id": "onyx",
    "name": "Onyx",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "orbit": {
    "id": "orbit",
    "name": "Orbit",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "oslo": {
    "id": "oslo",
    "name": "Oslo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "oxford": {
    "id": "oxford",
    "name": "Oxford",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "palatino-cv": {
    "id": "palatino-cv",
    "name": "Palatino Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "panorama": {
    "id": "panorama",
    "name": "Panorama",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "parallax": {
    "id": "parallax",
    "name": "Parallax",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "peel": {
    "id": "peel",
    "name": "Peel",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pemba": {
    "id": "pemba",
    "name": "Pemba",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "phoenix": {
    "id": "phoenix",
    "name": "Phoenix",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "photon": {
    "id": "photon",
    "name": "Photon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pier": {
    "id": "pier",
    "name": "Pier",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pittsburgh": {
    "id": "pittsburgh",
    "name": "Pittsburgh",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "plateau": {
    "id": "plateau",
    "name": "Plateau",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "portland": {
    "id": "portland",
    "name": "Portland",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "prague": {
    "id": "prague",
    "name": "Prague",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "prism": {
    "id": "prism",
    "name": "Prism",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "pulsar": {
    "id": "pulsar",
    "name": "Pulsar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "quantum": {
    "id": "quantum",
    "name": "Quantum",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "quasar": {
    "id": "quasar",
    "name": "Quasar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rail": {
    "id": "rail",
    "name": "Rail",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "raleigh": {
    "id": "raleigh",
    "name": "Raleigh",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "regent": {
    "id": "regent",
    "name": "Regent",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "relief": {
    "id": "relief",
    "name": "Relief",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ribbon": {
    "id": "ribbon",
    "name": "Ribbon",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "richmond": {
    "id": "richmond",
    "name": "Richmond",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rift": {
    "id": "rift",
    "name": "Rift",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "riso": {
    "id": "riso",
    "name": "Riso",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rockwell-cv": {
    "id": "rockwell-cv",
    "name": "Rockwell Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rufiji": {
    "id": "rufiji",
    "name": "Rufiji",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ruvuma": {
    "id": "ruvuma",
    "name": "Ruvuma",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ruwenzori": {
    "id": "ruwenzori",
    "name": "Ruwenzori",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sabaki": {
    "id": "sabaki",
    "name": "Sabaki",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sacramento": {
    "id": "sacramento",
    "name": "Sacramento",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sahara": {
    "id": "sahara",
    "name": "Sahara",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "samburu": {
    "id": "samburu",
    "name": "Samburu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "savanna": {
    "id": "savanna",
    "name": "Savanna",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "script-cv": {
    "id": "script-cv",
    "name": "Script Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "seattle": {
    "id": "seattle",
    "name": "Seattle",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "serengeti": {
    "id": "serengeti",
    "name": "Serengeti",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "serif-cv": {
    "id": "serif-cv",
    "name": "Serif Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "silhouette": {
    "id": "silhouette",
    "name": "Silhouette",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "silicon-pro": {
    "id": "silicon-pro",
    "name": "Silicon Pro",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "singapore-cv": {
    "id": "singapore-cv",
    "name": "Singapore Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slab": {
    "id": "slab",
    "name": "Slab",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slate-two": {
    "id": "slate-two",
    "name": "Slate Two",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "slate-v2": {
    "id": "slate-v2",
    "name": "Slate V2",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "solaris": {
    "id": "solaris",
    "name": "Solaris",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "solstice": {
    "id": "solstice",
    "name": "Solstice",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "st-louis": {
    "id": "st-louis",
    "name": "St Louis",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stellar": {
    "id": "stellar",
    "name": "Stellar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stockholm": {
    "id": "stockholm",
    "name": "Stockholm",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "storm": {
    "id": "storm",
    "name": "Storm",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stratus": {
    "id": "stratus",
    "name": "Stratus",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "stripe": {
    "id": "stripe",
    "name": "Stripe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "structuralist": {
    "id": "structuralist",
    "name": "Structuralist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "studio": {
    "id": "studio",
    "name": "Studio",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "suprematist": {
    "id": "suprematist",
    "name": "Suprematist",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "sydney-cv": {
    "id": "sydney-cv",
    "name": "Sydney Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tableau": {
    "id": "tableau",
    "name": "Tableau",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tampa": {
    "id": "tampa",
    "name": "Tampa",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tana": {
    "id": "tana",
    "name": "Tana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tanganyika": {
    "id": "tanganyika",
    "name": "Tanganyika",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tekeze": {
    "id": "tekeze",
    "name": "Tekeze",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "template-utils": {
    "id": "template-utils",
    "name": "Template Utils",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tempo": {
    "id": "tempo",
    "name": "Tempo",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "terracotta": {
    "id": "terracotta",
    "name": "Terracotta",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ticker": {
    "id": "ticker",
    "name": "Ticker",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "titan": {
    "id": "titan",
    "name": "Titan",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "tokyo-grid": {
    "id": "tokyo-grid",
    "name": "Tokyo Grid",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "toronto": {
    "id": "toronto",
    "name": "Toronto",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "trace": {
    "id": "trace",
    "name": "Trace",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "turkana": {
    "id": "turkana",
    "name": "Turkana",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "ubuntu": {
    "id": "ubuntu",
    "name": "Ubuntu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vancouver": {
    "id": "vancouver",
    "name": "Vancouver",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vector": {
    "id": "vector",
    "name": "Vector",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "veldt": {
    "id": "veldt",
    "name": "Veldt",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "verdant": {
    "id": "verdant",
    "name": "Verdant",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vertex": {
    "id": "vertex",
    "name": "Vertex",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vibe": {
    "id": "vibe",
    "name": "Vibe",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "victoria": {
    "id": "victoria",
    "name": "Victoria",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vienna": {
    "id": "vienna",
    "name": "Vienna",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "vignette": {
    "id": "vignette",
    "name": "Vignette",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "voi": {
    "id": "voi",
    "name": "Voi",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "volta-cv": {
    "id": "volta-cv",
    "name": "Volta Cv",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "wajir": {
    "id": "wajir",
    "name": "Wajir",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "warsaw": {
    "id": "warsaw",
    "name": "Warsaw",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "watamu": {
    "id": "watamu",
    "name": "Watamu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zahabu": {
    "id": "zahabu",
    "name": "Zahabu",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zanzibar": {
    "id": "zanzibar",
    "name": "Zanzibar",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zege": {
    "id": "zege",
    "name": "Zege",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zenith": {
    "id": "zenith",
    "name": "Zenith",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "zurich": {
    "id": "zurich",
    "name": "Zurich",
    "version": "1.0.0",
    "source": "native",
    "category": "cv",
    "family": "pending",
    "tier": "core",
    "accessibleTo": [
      "sumaiya"
    ],
    "editable_fields": [
      {
        "path": "personalInfo.fullName",
        "type": "text",
        "required": true,
        "label": "Full Name"
      },
      {
        "path": "personalInfo.email",
        "type": "email",
        "required": true,
        "label": "Email"
      },
      {
        "path": "personalInfo.phone",
        "type": "phone",
        "required": false,
        "label": "Phone"
      },
      {
        "path": "personalInfo.location",
        "type": "text",
        "required": false,
        "label": "Location"
      },
      {
        "path": "personalInfo.headline",
        "type": "text",
        "required": false,
        "label": "Professional Headline"
      },
      {
        "path": "summary",
        "type": "multiline",
        "required": false,
        "label": "Professional Summary"
      },
      {
        "path": "experience",
        "type": "array",
        "required": false,
        "label": "Experience",
        "itemSchema": {
          "company": "text",
          "title": "text",
          "startDate": "date",
          "endDate": "date",
          "description": "multiline",
          "keyAchievements": "array"
        }
      },
      {
        "path": "education",
        "type": "array",
        "required": false,
        "label": "Education",
        "itemSchema": {
          "institution": "text",
          "degree": "text",
          "field": "text",
          "graduationDate": "date"
        }
      },
      {
        "path": "skills",
        "type": "array",
        "required": false,
        "label": "Skills",
        "itemSchema": {
          "name": "text",
          "level": "enum"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
};
