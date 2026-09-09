// OCR utilities for CV scanning and field extraction
import type { CVData, PersonalInfo, Experience } from "@sumaiya/types";

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface ExtractedFields {
  fullName?: string;
  email?: string;
  phone?: string;
  experience: Partial<Experience>[];
  skills: string[];
}

/**
 * Extract structured fields from OCR text.
 * Runs on both web (via API) and mobile (after OCR).
 */
export function extractFieldsFromText(text: string): ExtractedFields {
  const fields: ExtractedFields = {
    experience: [],
    skills: [],
  };

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    fields.email = emailMatch[0];
  }

  // Extract phone (simple pattern)
  const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
  if (phoneMatch) {
    fields.phone = phoneMatch[0];
  }

  // Extract experience (job titles + companies)
  const experiencePatterns = [
    /(?:Senior|Junior|Lead)?\s*([a-zA-Z\s]+?)(?:\s+at|\s+@|\n)\s*([a-zA-Z\s]+?)(?:\n|\.|,)/gi,
  ];

  experiencePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      fields.experience.push({
        title: match[1]?.trim() || "",
        company: match[2]?.trim() || "",
      });
    }
  });

  // Extract skills (comma-separated or bullet points)
  const skillsSection = text.match(/Skills?:?\s*([\s\S]*?)(?=\n\n|Experience|$)/i);
  if (skillsSection) {
    const skillsText = skillsSection[1];
    fields.skills = skillsText
      .split(/[,•·\n-]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 50);
  }

  return fields;
}

/**
 * Calculate OCR text confidence (mock for now, replaced with actual ML model).
 */
export function calculateConfidence(text: string): number {
  // Simple heuristics:
  // - More words = higher confidence (up to a point)
  // - Presence of emails/phones = higher confidence
  const words = text.split(/\s+/).length;
  let confidence = Math.min(words / 100, 0.8); // Base confidence from word count

  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    confidence += 0.1;
  }

  if (/(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}/.test(text)) {
    confidence += 0.05;
  }

  return Math.min(confidence, 0.99);
}

/**
 * Merge OCR-extracted fields into CV data.
 */
export function mergOcrIntoCV(cvData: CVData, extracted: ExtractedFields): CVData {
  return {
    ...cvData,
    personalInfo: {
      ...cvData.personalInfo,
      fullName: extracted.fullName || cvData.personalInfo.fullName,
      email: extracted.email || cvData.personalInfo.email,
      phone: extracted.phone || cvData.personalInfo.phone,
    },
    experience: extracted.experience.length > 0 ? extracted.experience as any[] : cvData.experience,
    skills: extracted.skills.length > 0
      ? extracted.skills.map((name, idx) => ({
          id: `skill-${idx}`,
          name,
          level: "intermediate" as const,
        }))
      : cvData.skills,
  };
}
