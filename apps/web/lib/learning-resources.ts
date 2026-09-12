// Deterministic learning-resource knowledge base — REAL courses only.
//
// Anti-fabrication for learning advice: every resource in this KB is a real,
// well-known course/tutorial with a live URL (verified by
// scripts/verify-learning-urls.sh). We NEVER ask the model to invent one and
// never guess. When a gap term has no entry, we return NOTHING — an honest
// "no specific resource" is better than a made-up course.
//
// Used by:
//  - lib/skill-gap.ts (SkillGapFacts.resources — deterministic facts layer)
//  - lib/requirement-evidence.ts (per-requirement resources in the Evidence Bank)

export interface LearningResource {
  /** Course/tutorial title as shown to the user. */
  title: string;
  /** Provider/institution name (e.g. "Coursera · Macquarie"). */
  provider: string;
  /** Live URL (verified). */
  url: string;
  /**
   * True when the resource is free to complete. Kept in the shape, but the
   * catalogue only ever returns free entries — see `freeResources()`.
   */
  free: boolean;
}

// Normalized skill term (lowercased, punctuation stripped) → real resources.
// Free-first: the app serves mostly African job-seekers; paid resources are
// only added when a strong free alternative doesn't exist.
const KB: Record<string, LearningResource[]> = {
  excel: [
    { title: "Excel Skills for Business", provider: "Coursera · Macquarie", url: "https://www.coursera.org/specializations/excel", free: true },
    { title: "Microsoft Excel training", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/browse/?products=excel", free: true },
  ],
  word: [
    { title: "Microsoft Word training", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/browse/?products=office", free: true },
  ],
  powerpoint: [
    { title: "Microsoft PowerPoint training", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/browse/?products=office", free: true },
  ],
  quickbooks: [
    { title: "QuickBooks official channel", provider: "QuickBooks (YouTube)", url: "https://www.youtube.com/@QuickBooks", free: true },
  ],
  sap: [
    { title: "SAP Learning (free courses)", provider: "SAP", url: "https://learning.sap.com", free: true },
  ],
  salesforce: [
    { title: "Trailhead (free Salesforce learning)", provider: "Salesforce", url: "https://trailhead.salesforce.com", free: true },
  ],
  react: [
    { title: "Learn React (official docs)", provider: "react.dev", url: "https://react.dev/learn", free: true },
    { title: "React (freeCodeCamp)", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/front-end-development-libraries/", free: true },
  ],
  javascript: [
    { title: "Learn JavaScript (MDN)", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript", free: true },
    { title: "JavaScript Algorithms and Data Structures", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", free: true },
  ],
  typescript: [
    { title: "TypeScript Handbook", provider: "TypeScript", url: "https://www.typescriptlang.org/docs/handbook/intro.html", free: true },
  ],
  nodejs: [
    { title: "Learn Node.js (official)", provider: "nodejs.dev", url: "https://nodejs.org/en/learn", free: true },
    { title: "Back End Development and APIs", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/", free: true },
  ],
  nextjs: [
    { title: "Learn Next.js (official)", provider: "Next.js", url: "https://nextjs.org/learn", free: true },
  ],
  python: [
    { title: "Python for Everybody", provider: "Coursera · Michigan", url: "https://www.coursera.org/specializations/python", free: true },
    { title: "Scientific Computing with Python", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", free: true },
  ],
  sql: [
    { title: "SQLBolt (interactive SQL)", provider: "SQLBolt", url: "https://sqlbolt.com", free: true },
    { title: "SQL (Mode)", provider: "Mode", url: "https://mode.com/sql-tutorial/", free: true },
  ],
  postgres: [
    { title: "PostgreSQL Tutorial (official)", provider: "PostgreSQL", url: "https://www.postgresql.org/docs/current/tutorial.html", free: true },
  ],
  mysql: [
    { title: "MySQL Tutorial", provider: "MySQL", url: "https://dev.mysql.com/doc/refman/en/tutorial.html", free: true },
  ],
  mongodb: [
    { title: "MongoDB University (free)", provider: "MongoDB", url: "https://learn.mongodb.com/catalog", free: true },
  ],
  docker: [
    { title: "Docker Get Started", provider: "Docker Docs", url: "https://docs.docker.com/get-started/", free: true },
    { title: "The Docker Handbook", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/news/the-docker-handbook/", free: true },
  ],
  kubernetes: [
    { title: "Kubernetes Basics", provider: "Kubernetes Docs", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", free: true },
  ],
  aws: [
    { title: "AWS Cloud Practitioner Essentials", provider: "AWS Skill Builder", url: "https://explore.skillbuilder.aws/learn/public/learning_plan/view/1044/aws-cloud-practitioner-essentials", free: true },
  ],
  azure: [
    { title: "Microsoft Azure Fundamentals training", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/browse/?products=azure", free: true },
  ],
  gcp: [
    { title: "Google Cloud Skills Boost (free credits)", provider: "Google Cloud", url: "https://www.cloudskillsboost.google", free: true },
  ],
  git: [
    { title: "Git documentation (official)", provider: "Git", url: "https://git-scm.com/doc", free: true },
    { title: "GitHub Skills (free courses)", provider: "GitHub", url: "https://skills.github.com", free: true },
  ],
  linux: [
    { title: "Linux Journey (free)", provider: "Linux Journey", url: "https://linuxjourney.com", free: true },
  ],
  dataanalysis: [
    { title: "Google Data Analytics Certificate", provider: "Coursera · Google", url: "https://www.coursera.org/professional-certificates/google-data-analytics", free: true },
    { title: "Data Analysis with Python", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/data-analysis-with-python/", free: true },
  ],
  machinelearning: [
    { title: "Machine Learning Specialization", provider: "Coursera · Stanford", url: "https://www.coursera.org/specializations/machine-learning-introduction", free: true },
    { title: "Intro to Machine Learning (Kaggle)", provider: "Kaggle", url: "https://www.kaggle.com/learn/intro-to-machine-learning", free: true },
  ],
  communication: [
    { title: "Improving Communication Skills", provider: "Coursera · Wharton", url: "https://www.coursera.org/learn/wharton-communication-skills", free: true },
  ],
  leadership: [
    { title: "Leading People and Teams", provider: "Coursera · Michigan", url: "https://www.coursera.org/learn/leading-teams", free: true },
  ],
  projectmanagement: [
    { title: "Google Project Management Certificate", provider: "Coursera · Google", url: "https://www.coursera.org/professional-certificates/google-project-management", free: true },
  ],
  marketing: [
    { title: "Fundamentals of Digital Marketing", provider: "Google Digital Garage", url: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing", free: true },
    { title: "Inbound Marketing", provider: "HubSpot Academy", url: "https://academy.hubspot.com/courses/inbound-marketing", free: true },
  ],
  sales: [
    { title: "Inbound Sales", provider: "HubSpot Academy", url: "https://academy.hubspot.com/courses/sales", free: true },
  ],
  customerservice: [
    { title: "Customer Service Fundamentals", provider: "HubSpot Academy", url: "https://academy.hubspot.com/courses/customer-service", free: true },
  ],
  accounting: [
    { title: "Financial Accounting Fundamentals", provider: "Coursera · Virginia", url: "https://www.coursera.org/learn/uva-darden-financial-accounting", free: true },
  ],
  english: [
    { title: "BBC Learning English (free)", provider: "BBC", url: "https://www.bbc.co.uk/learningenglish", free: true },
  ],
  teamwork: [
    { title: "Teamwork (edX)", provider: "edX", url: "https://www.edx.org/learn/teamwork", free: true },
  ],
  wordpress: [
    { title: "WordPress.com Learn", provider: "WordPress.com", url: "https://wordpress.com/learn/", free: true },
  ],
  tableau: [
    { title: "Tableau free training videos", provider: "Tableau", url: "https://www.tableau.com/learn/training", free: true },
  ],
  powerbi: [
    { title: "Power BI — Data Analytics", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/paths/data-analytics-microsoft/", free: true },
  ],
  excelvba: [
    { title: "Excel VBA Beginner", provider: "Excel Easy", url: "https://www.excel-easy.com/vba.html", free: true },
  ],
  publicspeaking: [
    { title: "Introduction to Public Speaking", provider: "Coursera · Washington", url: "https://www.coursera.org/learn/public-speaking", free: true },
  ],
  negotiation: [
    { title: "Successful Negotiation", provider: "Coursera · Michigan", url: "https://www.coursera.org/learn/negotiation-skills", free: true },
  ],
  exceladvanced: [
    { title: "Excel Skills for Business: Advanced", provider: "Coursera · Macquarie", url: "https://www.coursera.org/learn/excel-advanced", free: true },
  ],
};

// Aliases map: normalized variant → KB key. Keeps the KB small while
// accepting the many spellings real JDs use.
const ALIASES: Record<string, string> = {
  "node": "nodejs",
  "node.js": "nodejs",
  "next.js": "nextjs",
  "postgresql": "postgres",
  "ms excel": "excel",
  "microsoft excel": "excel",
  "data analysis": "dataanalysis",
  "data analytics": "dataanalysis",
  "ml": "machinelearning",
  "project management": "projectmanagement",
  "pmp": "projectmanagement",
  "digital marketing": "marketing",
  "customer service": "customerservice",
  "power bi": "powerbi",
  "public speaking": "publicspeaking",
  "vba": "excelvba",
  "advanced excel": "exceladvanced",
  "excel advanced": "exceladvanced",
};

/** Normalize a raw gap term for KB lookup (lowercase, strip punctuation). */
export function normalizeSkillTerm(term: string): string {
  return (term || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/** Best-effort KB key for a raw term (or undefined when unknown). */
export function kbKeyForTerm(term: string): string | undefined {
  const norm = normalizeSkillTerm(term);
  // Aliases first — short-but-meaningful terms ("ml") must survive the length guard.
  const alias = ALIASES[term.toLowerCase().trim()];
  if (alias && KB[alias]) return alias;
  if (!norm || norm.length < 3) return undefined;
  if (KB[norm]) return norm;
  return undefined;
}

/** Real resources for ONE gap term — empty when the KB has no entry (honest). */
export function learningResourcesFor(term: string): LearningResource[] {
  const key = kbKeyForTerm(term);
  return key ? KB[key] : [];
}

/**
 * Resources covering a SET of gap terms: collects every matched entry,
 * de-dupes by URL, caps the total. Deterministic — no AI, no invented links.
 */
export function resourcesForGaps(gaps: readonly string[], limit = 4): LearningResource[] {
  const seen = new Set<string>();
  const out: LearningResource[] = [];
  for (const g of gaps) {
    for (const r of learningResourcesFor(g)) {
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      out.push(r);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
