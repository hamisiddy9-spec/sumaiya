/**
 * Job matching algorithm
 *
 * Purpose: Score how well a job matches a user's profile
 * Input: User profile (CV, skills, experience, preferences) + job posting
 * Output: Match score (0-100) + reasons why it's a good/bad match
 */

import type { CVData } from "@/types";

interface UserProfile {
  skills: string[];
  experience: {
    title: string;
    years: number;
  }[];
  industry?: string;
  yearsExperience: number;
  location?: string;
  preferRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  languages?: string[];
}

interface JobProfile {
  title: string;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experienceLevel: string;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  isRemote: boolean;
  industry?: string;
}

interface MatchResult {
  score: number; // 0-100
  reasons: string[];
  missingSkills: string[];
  warnings: string[];
}

/**
 * Calculate match score between user and job
 *
 * Scoring breakdown:
 * - Skills match: 40 points (required skills)
 * - Experience level: 25 points (years + level)
 * - Location/remote: 15 points
 * - Salary alignment: 15 points
 * - Industry fit: 5 points
 */
export function calculateJobMatch(user: UserProfile, job: JobProfile): MatchResult {
  const reasons: string[] = [];
  const missingSkills: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // 1. Skills matching (40 points)
  const skillsScore = scoreSkills(user.skills, job.requiredSkills, job.niceToHaveSkills);
  score += skillsScore.points;
  reasons.push(...skillsScore.reasons);
  missingSkills.push(...skillsScore.missing);

  // 2. Experience level matching (25 points)
  const expScore = scoreExperience(user.yearsExperience, job.yearsExperienceMin, job.yearsExperienceMax, job.experienceLevel);
  score += expScore.points;
  reasons.push(...expScore.reasons);
  if (expScore.warnings) warnings.push(...expScore.warnings);

  // 3. Location/remote (15 points)
  const locationScore = scoreLocation(user.location, user.preferRemote, job.location, job.isRemote);
  score += locationScore.points;
  reasons.push(...locationScore.reasons);
  if (locationScore.warnings) warnings.push(...locationScore.warnings);

  // 4. Salary alignment (15 points)
  const salaryScore = scoreSalary(user.salaryMin, user.salaryMax, job.salaryMin, job.salaryMax);
  score += salaryScore.points;
  if (salaryScore.reasons) reasons.push(...salaryScore.reasons);
  if (salaryScore.warnings) warnings.push(...salaryScore.warnings);

  // 5. Industry fit (5 points)
  if (user.industry && job.industry && user.industry.toLowerCase() === job.industry.toLowerCase()) {
    score += 5;
    reasons.push("Industry experience match");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
    missingSkills,
    warnings,
  };
}

/**
 * Score skill match (40 points max)
 */
function scoreSkills(userSkills: string[], required: string[], niceToHave: string[]) {
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const requiredLower = required.map((s) => s.toLowerCase());
  const niceLower = niceToHave.map((s) => s.toLowerCase());

  // Required skills match
  const requiredMatches = requiredLower.filter((skill) => userSkillsLower.includes(skill)).length;
  const requiredPercentage = required.length > 0 ? requiredMatches / required.length : 1;
  const requiredPoints = requiredPercentage * 30;

  // Nice-to-have skills match
  const niceMatches = niceLower.filter((skill) => userSkillsLower.includes(skill)).length;
  const nicePercentage = niceToHave.length > 0 ? niceMatches / niceToHave.length : 0;
  const nicePoints = nicePercentage * 10;

  // Missing required skills
  const missing = requiredLower.filter((s) => !userSkillsLower.includes(s));

  const reasons = [];
  if (requiredPercentage >= 0.8) reasons.push("Strong match on required skills");
  if (nicePercentage >= 0.5) reasons.push("Has many nice-to-have skills");

  return {
    points: requiredPoints + nicePoints,
    reasons,
    missing,
  };
}

/**
 * Score experience level (25 points max)
 */
function scoreExperience(
  userYears: number,
  jobMinYears?: number,
  jobMaxYears?: number,
  experienceLevel?: string
) {
  let points = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  const minYears = jobMinYears || 0;
  const maxYears = jobMaxYears || userYears + 5;

  // Check if user years fit
  if (userYears >= minYears && userYears <= maxYears) {
    points = 25; // Perfect fit
    reasons.push(`${userYears}+ years experience fits role requirement`);
  } else if (userYears < minYears) {
    points = Math.max(0, 25 - (minYears - userYears) * 3);
    warnings.push(`You have ${userYears} years, role prefers ${minYears}+`);
  } else {
    points = 20; // Overqualified
    reasons.push("You're overqualified for this role");
  }

  return { points, reasons, warnings };
}

/**
 * Score location/remote match (15 points max)
 */
function scoreLocation(
  userLocation?: string,
  userPreferRemote?: boolean,
  jobLocation?: string,
  jobRemote?: boolean
) {
  let points = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (jobRemote) {
    points = 15;
    reasons.push("Fully remote role");
  } else if (userLocation && jobLocation && userLocation.toLowerCase() === jobLocation.toLowerCase()) {
    points = 15;
    reasons.push("Perfect location match");
  } else if (userPreferRemote && !jobRemote) {
    points = 5;
    warnings.push("Role is not remote, but you prefer remote");
  } else {
    points = 8;
  }

  return { points, reasons, warnings };
}

/**
 * Score salary alignment (15 points max)
 */
function scoreSalary(
  userMin?: number,
  userMax?: number,
  jobMin?: number,
  jobMax?: number
) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let points = 10; // Base score

  if (!jobMin && !jobMax) {
    return { points: 15, reasons: ["Salary negotiable"], warnings: [] };
  }

  if (!userMin) {
    return { points, reasons, warnings };
  }

  // Check if salary expectations overlap
  const jobMinVal = jobMin || 0;
  const jobMaxVal = jobMax || userMax || 100_000_000;
  const userMaxVal = userMax || userMin + 2_000_000;

  if (userMin <= jobMaxVal && userMaxVal >= jobMinVal) {
    points = 15;
    reasons.push("Salary expectation matches");
  } else if (userMin > jobMaxVal) {
    points = 5;
    warnings.push(`You expect ${userMin}, role pays up to ${jobMaxVal}`);
  } else {
    points = 12;
    reasons.push("Salary within range");
  }

  return { points, reasons, warnings };
}

/**
 * Extract user profile from CV data
 */
export function extractUserProfileFromCV(cv: CVData): UserProfile {
  const skills = cv.skills || [];
  const experience = (cv.experience || []).map((exp: any) => ({
    title: exp.jobTitle || "",
    years: exp.endYear ? new Date().getFullYear() - (exp.startYear || 2020) : 0,
  }));

  const yearsExperience = experience.reduce((sum, exp) => sum + exp.years, 0);

  // Extract skill names from SkillEntry array
  const skillNames = skills.map((skill: any) => typeof skill === 'string' ? skill : skill.name);

  // Extract language names from LanguageEntry array
  const languageNames = (cv.languages || []).map((lang: any) => typeof lang === 'string' ? lang : lang.name || '');

  return {
    skills: skillNames,
    experience,
    yearsExperience: Math.max(0, yearsExperience),
    location: cv.personal?.location || undefined,
    languages: languageNames,
  };
}
