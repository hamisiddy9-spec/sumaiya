/**
 * Document types
 */

export interface DocumentContent {
  [key: string]: unknown;
  personalInfo?: PersonalInfo;
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: SkillEntry[];
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  headline?: string;
  url?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  keyAchievements?: string[];
}

export interface EducationEntry {
  institution: string;
  degree?: string;
  field?: string;
  graduationDate?: string;
}

export interface SkillEntry {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface RenderedDocument {
  documentId: string;
  templateId: string;
  templateVersion: string;
  content: string;
  format: 'html' | 'pdf' | 'docx';
  renderTime: string;
  previewUrl?: string;
}
