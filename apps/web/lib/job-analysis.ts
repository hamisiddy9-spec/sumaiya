// Job analysis — deterministic, no AI, no DB. Given a job description it
// extracts what a recruiter actually evaluates: the target title, required
// skills/tools, keywords (via the shared extractTerms), seniority, employment
// type, and the concrete requirements a candidate must confirm they have.
//
// This powers the Job → Match → Targeted CV flow: analyze the job, match it
// against the Career Profile (via matchCvToJd), then build a targeted CV that
// reorders/reweights content around what THIS job asks for — using only
// verified profile facts. Nothing here invents facts.

import { extractTerms, STOP_WORDS } from "@/lib/job-match";

export interface JobAnalysis {
  title: string;
  /** Skills/tools the JD explicitly names (known-tool lexicon). */
  skills: string[];
  /** Seniority band: junior | mid | senior | lead | unstated. */
  seniority: "junior" | "mid" | "senior" | "lead" | "unstated";
  /** Employment type: full-time | part-time | contract | internship | unstated. */
  employmentType: string;
  /** Raw keywords from the JD (shared term extraction). */
  keywords: string[];
  /** Requirement phrasings worth confirming with the user ("X years of…",
   *  "certified in…", "must have…", "experience with…"). */
  requirements: string[];
}

const SENIORITY_RULES: Array<{ re: RegExp; band: JobAnalysis["seniority"] }> = [
  // Leadership bands checked first WITHOUT the word "senior" (a "Senior
  // Engineer" is senior, not lead; a "Senior Director" is lead).
  { re: /\b(principal|staff|head of|director|vp|vice president)\b/i, band: "lead" },
  { re: /\b(lead)\b/i, band: "lead" },
  { re: /\b(senior|sr\.?|experienced|5\+ years|5 years|6\+ years|7\+ years|8\+ years|10\+ years)\b/i, band: "senior" },
  { re: /\b(junior|jr\.?|entry|graduate|new grad|0-2 years|1\+ years|1-2 years|2\+ years)\b/i, band: "junior" },
];

const EMPLOYMENT_RULES: Array<{ re: RegExp; type: string }> = [
  { re: /\b(internship|intern)\b/i, type: "internship" },
  { re: /\b(part[- ]time)\b/i, type: "part-time" },
  { re: /\b(contract|freelance|consultant)\b/i, type: "contract" },
  { re: /\b(full[- ]time|permanent)\b/i, type: "full-time" },
];

// Known tools/skills a JD may list. Same philosophy as the evidence engine's
// lexicon: high-signal, no API needed.
const JD_SKILLS = [
  "sap", "salesforce", "hubspot", "quickbooks", "xero", "tableau", "power bi", "powerbi",
  "excel", "word", "powerpoint", "sharepoint", "dynamics", "oracle", "snowflake",
  "databricks", "airflow", "kubernetes", "docker", "terraform", "ansible", "jenkins",
  "gitlab", "github", "jira", "confluence", "slack", "figma", "photoshop", "illustrator",
  "after effects", "premiere", "blender", "unity", "unreal", "react", "react native",
  "angular", "vue", "svelte", "node", "node.js", "typescript", "javascript", "python",
  "java", "golang", "go", "rust", "c++", "c#", "php", "ruby", "rails", "django", "flask",
  "fastapi", "spring", "laravel", "next.js", "nextjs", "express", "graphql", "rest api",
  "postgresql", "postgres", "mysql", "mongodb", "redis", "kafka", "rabbitmq", "aws",
  "azure", "gcp", "google cloud", "firebase", "supabase", "vercel", "netlify", "stripe",
  "twilio", "sendgrid", "google analytics", "meta ads", "google ads", "seo", "sem",
  "crm", "erp", "scrum", "agile", "kanban", "lean", "six sigma", "gdpr", "hipaa",
  "accounting", "bookkeeping", "payroll", "tax", "audit", "procurement", "logistics",
  "supply chain", "inventory", "sales", "marketing", "customer service", "recruiting",
  "hr", "project management", "data analysis", "data entry", "machine learning", "ai",
  "quality assurance", "qa", "testing", "devops", "ci/cd", "linux", "bash", "sql",
] as const;

export function analyzeJob(jd: string, fallbackTitle = ""): JobAnalysis {
  const text = jd || "";
  const lower = text.toLowerCase();

  // Title — usually the first line or the "title:" hint; fall back gracefully.
  const title = extractTitle(text) || fallbackTitle;

  // Skills (known lexicon, word-boundary).
  const skills: string[] = [];
  for (const skill of JD_SKILLS) {
    const re = new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) skills.push(skill);
  }

  // Seniority — highest band wins.
  let seniority: JobAnalysis["seniority"] = "unstated";
  for (const { re, band } of SENIORITY_RULES) {
    if (re.test(lower)) { seniority = band; break; }
  }

  // Employment type.
  let employmentType = "unstated";
  for (const { re, type } of EMPLOYMENT_RULES) {
    if (re.test(lower)) { employmentType = type; break; }
  }

  // Keywords (shared term extraction — same engine the match uses, so the
  // analysis and the score always agree).
  const keywords = extractTerms(text);

  // Requirement phrasings worth confirming with the user.
  const requirements = extractRequirements(text);

  return { title, skills, seniority, employmentType, keywords, requirements };
}

// ─── JobProfile — deep, structured JD intelligence (WS-2) ─────────────────────
// Extends JobAnalysis with per-requirement importance, per-skill importance,
// responsibilities/qualifications/niceToHave split, salary, and a deterministic
// confidence estimate. Still pure + deterministic — the AI may enrich this via
// /api/ai/jd-keywords (must/nice), but the base profile never needs a model.

export type RequirementImportance = "critical" | "high" | "medium" | "low";

export interface JobRequirement {
  text: string;
  category: "responsibility" | "requirement" | "qualification" | "niceToHave";
  importance: RequirementImportance;
}

export interface JobSkill {
  name: string;
  category: "tool" | "concept";
  importance: RequirementImportance;
}

export interface JobSalary {
  min?: number;
  max?: number;
  currency: string;
}

export interface JobProfile {
  title: string;
  company?: string;
  location?: string;
  employmentType: string;
  seniority: JobAnalysis["seniority"];
  requirements: JobRequirement[];
  skills: JobSkill[];
  keywords: string[];
  responsibilities: string[];
  qualifications: string[];
  niceToHave: string[];
  salary?: JobSalary;
  /** Deterministic confidence 0..1 — how much signal the JD carried. */
  confidence: number;
}

// Phrases that raise the importance of a requirement line.
const CRITICAL_PHRASES = /\b(must have|must be|required to have|essential|critical|non-negotiable|you will have|you have)\b/i;
const HIGH_PHRASES = /\b(required|requires|need|needs|proficiency in|experience with|degree in|bachelor|master|certified|licen[cs]ed|registered|\d+\+?\s*(years?|yrs?))\b/i;
const LOW_PHRASES = /\b(preferred|nice to have|plus|desirable|a plus|bonus|would be great|familiarity with)\b/i;

// Action verbs that mark a line as a responsibility (not a qualification).
const RESPONSIBILITY_VERBS =
  /\b(manage|lead|develop|build|create|design|implement|deliver|drive|own|coordinate|oversee|ensure|support|collaborate|maintain|improve|optimize|analyze|prepare|handle|supervise|train|mentor|report|review|execute|launch|grow|plan|organize|responsible for|day to day|duties|you will)\b/i;

const QUALIFICATION_PHRASES =
  /\b(degree|bachelor|master|phd|certified|certification|licen[cs]ed|years? of experience|experience in|proficiency in|knowledge of|qualification|education|graduate)\b/i;

const SALARY_RE =
  /(?:salary|compensation|pay|range|package)\s*[:\-]?\s*([TZSKSh€£$]?\s?[\d,.]+\s*[-–to]+\s*[\d,.]+\s*(TZS|KSh|KES|USD|EUR|GBP|\$|€|£)?)/i;

const COMPANY_RE = /(?:company|organization|employer|firm)\s*[:|-]\s*([A-Za-z0-9&.,' -]{2,60})/i;
const LOCATION_RE = /(?:location|based in|located in|office in|city)\s*[:|-]\s*([A-Za-z ,'-]{2,60})/i;

function classifyImportance(line: string): RequirementImportance {
  if (CRITICAL_PHRASES.test(line)) return "critical";
  if (LOW_PHRASES.test(line)) return "low";
  if (HIGH_PHRASES.test(line)) return "high";
  return "medium";
}

function extractSalary(text: string): JobSalary | undefined {
  const m = text.match(SALARY_RE);
  if (!m) return undefined;
  const nums = (m[0].match(/[\d,.]+/g) ?? []).map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => n > 0);
  if (nums.length === 0) return undefined;
  const currency = (m[0].match(/(TZS|KSh|KES|USD|EUR|GBP|\$|€|£)/i)?.[1] || "USD").toUpperCase();
  const [min, max] = nums.length >= 2 ? [nums[0], nums[nums.length - 1]] : [nums[0], undefined];
  return { min, max, currency };
}

/**
 * Deep JD analysis → structured JobProfile. Deterministic, no AI.
 * `confidence` is 0..1 based on how much signal the JD carried.
 */
export function analyzeJobProfile(jd: string, fallbackTitle = ""): JobProfile {
  const analysis = analyzeJob(jd, fallbackTitle);
  const text = jd || "";
  const lower = text.toLowerCase();

  const company = text.match(COMPANY_RE)?.[1]?.trim();
  const location = text.match(LOCATION_RE)?.[1]?.trim();
  const salary = extractSalary(text);

  // Split requirement lines into responsibilities / qualifications / niceToHave
  // with importance. Requirement lines come from the shared extractor; then we
  // also capture "nice to have" lines the extractor may have missed.
  const lines = text
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter((l) => l.length > 8 && l.length <= 160);

  const responsibilities: string[] = [];
  const qualifications: string[] = [];
  const niceToHave: string[] = [];
  const requirements: JobRequirement[] = [];

  const seen = new Set<string>();
  const pushReq = (line: string, category: JobRequirement["category"], importance: RequirementImportance) => {
    const key = line.toLowerCase();
    if (seen.has(key) || key.length < 9) return;
    seen.add(key);
    if (category === "responsibility") responsibilities.push(line);
    else if (category === "qualification") qualifications.push(line);
    else niceToHave.push(line);
    requirements.push({ text: line, category, importance });
  };

  for (const line of lines) {
    if (LOW_PHRASES.test(line) && !CRITICAL_PHRASES.test(line)) {
      pushReq(line, "niceToHave", "low");
      continue;
    }
    if (RESPONSIBILITY_VERBS.test(line) && !QUALIFICATION_PHRASES.test(line)) {
      pushReq(line, "responsibility", classifyImportance(line));
      continue;
    }
    if (QUALIFICATION_PHRASES.test(line)) {
      pushReq(line, "qualification", classifyImportance(line));
      continue;
    }
    // Bullet-looking lines with no strong signal: treat as requirement/medium.
    if (/^[•\-*–·]/.test(line) || analysis.requirements.some((r) => line.includes(r))) {
      pushReq(line, "requirement", classifyImportance(line));
    }
  }

  // The classic extractor's requirement phrasings are the fallback source if
  // the line splitter found nothing (single-paragraph JDs).
  if (requirements.length === 0) {
    for (const req of analysis.requirements) {
      pushReq(req, QUALIFICATION_PHRASES.test(req) ? "qualification" : "requirement", classifyImportance(req));
    }
  }

  // Skills with importance: importance comes from the requirement line the
  // skill appears in (critical/high lines → same importance; otherwise medium).
  const skills: JobSkill[] = analysis.skills.map((name) => {
    const line = requirements.find((r) => r.text.toLowerCase().includes(name));
    const importance: RequirementImportance =
      line && (line.importance === "critical" || line.importance === "high")
        ? line.importance
        : "medium";
    return { name, category: "tool", importance };
  });

  // Confidence: title present + keyword volume + requirement volume.
  const signals = [
    Boolean(analysis.title),
    analysis.keywords.length >= 5,
    analysis.requirements.length >= 2,
    requirements.length >= 2,
    Boolean(salary),
  ].filter(Boolean).length;
  const confidence = Math.min(1, Math.round((0.3 + signals * 0.14) * 100) / 100);

  return {
    title: analysis.title,
    company,
    location,
    employmentType: analysis.employmentType,
    seniority: analysis.seniority,
    requirements,
    skills,
    keywords: analysis.keywords,
    responsibilities,
    qualifications,
    niceToHave,
    salary,
    confidence,
  };
}

// Role words that mark a first line as a real job-title line (not prose).
const ROLE_WORDS =
  /(engineer|developer|dev\b|manager|analyst|designer|consultant|specialist|lead\b|head\b|director|officer|assistant|coordinator|architect|scientist|administrator|associate|executive|operator|technician|intern|trainee|graduate|accountant|recruiter|writer|editor|nurse|teacher|driver|cook|chef|representative|agent\b|supervisor|clerk|sales|marketing|finance|support|product|project|qa\b|hr\b|account|analyst|devops|data)/i;

function extractTitle(text: string): string {
  // "Title: X" / "Job Title: X" lines first.
  const titled = text.match(/^(?:job\s+)?title\s*[:|-]\s*(.+)$/im);
  if (titled) return titled[1].trim().slice(0, 120);
  // Otherwise the first non-empty line, only if it actually looks like a title:
  // short, not a prose sentence, and either title-case or contains a role word.
  // Otherwise fall back to the caller's supplied title (e.g. the profile title).
  const first = text.split("\n").map((l) => l.trim()).find(Boolean);
  if (!first || first.length > 90) return "";
  if (/\b(company|location|salary|about|role|responsibilit)/i.test(first)) return "";
  if (/[.!?]$/.test(first)) return ""; // prose sentence, not a title
  if (first.split(/\s+/).length > 6) return ""; // too long for a title line
  if (!/^[A-Z]/.test(first) && !ROLE_WORDS.test(first)) return "";
  return first.slice(0, 120);
}

function extractRequirements(text: string): string[] {
  const out: string[] = [];
  const patterns = [
    /\b(\d+\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|hands-on|work))\b/gi,
    /\b(certified|licen[cs]ed|registered)\s+[^.,;\n]{2,60}\b/gi,
    /\b(must have|must be|required to have|you have)\s+[^.,;\n]{3,80}\b/gi,
    /\b(experience with|experience in|proficiency in|knowledge of)\s+[^.,;\n]{2,60}\b/gi,
    /\b(degree in|bachelor[‘'’]?s?|master[‘'’]?s?)\s+[^.,;\n]{2,60}\b/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const req = m[0].replace(/\s+/g, " ").trim();
      if (req.length > 8 && req.length <= 120) out.push(req);
    }
  }
  // Dedupe preserving order.
  return [...new Set(out)].slice(0, 12);
}

// ─── Target-role helpers (used by the targeted-CV builder) ───────────────────

/** Rank the user's skills by how many JD keywords each one covers. */
export function rankSkillsForJob<T extends { id: string; name: string; level: number }>(
  skills: T[],
  analysis: JobAnalysis,
): T[] {
  const jdLower = analysis.keywords.join(" ");
  return [...skills]
    .map((s, idx) => {
      // A nameless skill (malformed client-side CV data) must neither crash
      // the sort (`undefined.toLowerCase()`) nor rank as a hit — note
      // `jdLower.includes("")` is ALWAYS true, so an empty name must be
      // excluded before the hit test or it would sort to the top.
      const name = (s.name ?? "").toLowerCase();
      const hit = name !== "" && (analysis.skills.includes(name) || jdLower.includes(name));
      return { s, hit, idx };
    })
    // Job-relevant skills first; within each group keep the user's own order.
    .sort((a, b) => Number(b.hit) - Number(a.hit) || a.idx - b.idx)
    .map(({ s }) => s);
}

/** Rank experience entries by JD keyword coverage (reorder around the job). */
export function rankExperienceForJob<
  T extends { id: string; company: string; position: string; description: string },
>(
  experience: T[],
  analysis: JobAnalysis,
): T[] {
  const jdTerms = new Set(analysis.keywords);
  return [...experience]
    .map((e) => {
      const text = `${e.position} ${e.company} ${e.description}`.toLowerCase();
      let score = 0;
      for (const t of jdTerms) {
        if (t.length >= 4 && text.includes(t)) score += 1;
      }
      return { e, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ e }) => e);
}
