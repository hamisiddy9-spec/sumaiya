// Template matching based on CV data, career stage, industry
import type { Template, CVData } from "@sumaiya/types";

export interface TemplateScore {
  templateId: string;
  score: number;
  reason: string;
}

export type CareerStage = "entry" | "mid" | "senior" | "executive";
export type Industry = "tech" | "creative" | "business" | "academic" | "other";

/**
 * Detect career stage from experience length and seniority indicators.
 */
export function detectCareerStage(cvData: CVData): CareerStage {
  const years = cvData.experience.length;
  const titles = cvData.experience.map((e) => e.title.toLowerCase()).join(" ");

  const isSenior = /senior|lead|manager|director|principal/.test(titles);
  const isExecutive = /ceo|cto|vp|vice president|executive/.test(titles);

  if (isExecutive) return "executive";
  if (isSenior && years >= 5) return "senior";
  if (years >= 3) return "mid";
  return "entry";
}

/**
 * Detect industry from job titles and skills.
 */
export function detectIndustry(cvData: CVData): Industry {
  const allText = [
    ...cvData.experience.map((e) => e.title + " " + e.description),
    ...cvData.skills.map((s) => s.name),
  ]
    .join(" ")
    .toLowerCase();

  if (/engineer|developer|programmer|software|frontend|backend|devops|data/.test(allText)) {
    return "tech";
  }
  if (/design|creative|art|video|motion|ux|ui|brand/.test(allText)) {
    return "creative";
  }
  if (/finance|marketing|sales|business|strategy|consultant|manager/.test(allText)) {
    return "business";
  }
  if (/professor|research|academic|phd|thesis|publication/.test(allText)) {
    return "academic";
  }

  return "other";
}

/**
 * Score templates based on CV profile (stage + industry).
 * Returns ranked list of templates.
 */
export function scoreTemplates(
  templates: Template[],
  cvData: CVData
): TemplateScore[] {
  const careerStage = detectCareerStage(cvData);
  const industry = detectIndustry(cvData);

  const scores: TemplateScore[] = templates.map((template) => {
    let score = 50; // base score

    // Career stage matching
    const templateName = template.name.toLowerCase();
    if (careerStage === "executive" && /executive|monarch|titan/.test(templateName)) {
      score += 25;
    } else if (careerStage === "senior" && /senior|apex|premium/.test(templateName)) {
      score += 20;
    } else if (careerStage === "mid" && /modern|meridian|vertex/.test(templateName)) {
      score += 15;
    } else if (careerStage === "entry" && /clean|minimal|starter/.test(templateName)) {
      score += 10;
    }

    // Industry matching
    if (industry === "tech" && /tech|silicon|nordic|modern|metro/.test(templateName)) {
      score += 15;
    } else if (industry === "creative" && /creative|studio|canvas|muse/.test(templateName)) {
      score += 15;
    } else if (industry === "business" && /executive|oxford|classic/.test(templateName)) {
      score += 15;
    } else if (industry === "academic" && /academic|oxford|imperial/.test(templateName)) {
      score += 15;
    }

    // ATS bonus
    if (template.isAtsOptimized) {
      score += 10;
    }

    // Language bonus
    if (cvData.personalInfo.fullName) {
      score += 5;
    }

    return {
      templateId: template.id,
      score: Math.min(score, 100),
      reason: `${careerStage} ${industry} role, ${template.name}`,
    };
  });

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Get top N templates for a CV.
 */
export function getRecommendedTemplates(
  templates: Template[],
  cvData: CVData,
  limit: number = 5
): Template[] {
  const scores = scoreTemplates(templates, cvData);
  const recommended = scores.slice(0, limit).map((s) => s.templateId);
  return templates.filter((t) => recommended.includes(t.id));
}
