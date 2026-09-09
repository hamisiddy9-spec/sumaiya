// Shared types for web and mobile

export type Lang = "sw" | "en";

export interface CV {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  data: CVData;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  isOfflineOnly?: boolean;
}

export interface CVData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  languages: LanguageProf[];
  summary?: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  profilePhoto?: string; // base64 or URL
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string; // YYYY-MM
  endDate?: string;  // YYYY-MM or "Present"
  description: string;
  keyAchievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string; // YYYY-MM
  gpa?: number;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string; // YYYY-MM
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface LanguageProf {
  id: string;
  language: string;
  proficiency: "elementary" | "limited" | "professional" | "fluent" | "native";
}

export interface Template {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  colorScheme: string;
  isAtsOptimized: boolean;
  languages: Lang[];
}

export interface SyncQueueItem {
  id: string;
  cvId: string;
  operation: "create" | "update" | "delete";
  data: CV | null; // null for deletes
  timestamp: number;
  retries: number;
  lastError?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapToApplyResult {
  resumeData: CVData;
  atsScore: number;
  matches: TemplateMatch[];
  suggestions: string[];
}

export interface TemplateMatch {
  templateId: string;
  templateName: string;
  score: number;
  reason: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType: "full-time" | "part-time" | "contract" | "internship";
  postedAt: Date;
  isApplied?: boolean;
}

export interface LearningResource {
  id: string;
  title: string;
  platform: string;
  url: string;
  skillCategory: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  rating: number;
  reviews: number;
}

// Alias for mobile template picker
export type CVTemplate = Template;

// Extended sync operation types for mobile
export type SyncOperation = "create" | "update" | "delete" | "create_cv" | "update_cv" | "delete_cv" | "apply_job" | "chat_message";
