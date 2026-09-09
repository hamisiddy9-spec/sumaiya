// Golden datasets for the eval harness — real-ish CVs + JDs with expected
// PROPERTIES (not exact strings). These are the regression pins: a change to
// the deterministic engines (job-match, targeted-cv, evidence, orchestrator,
// prompt builders) that breaks any asserted property fails CI.
//
// Pinning philosophy:
//   - Scores are pinned at authoring time against the real engine on master.
//     A scoring REGRESSION (e.g. scoreTerms matching everything) drifts the
//     pin and fails. Tolerance is 0 by default — a deliberate, reviewed
//     scoring change must bump the pin in the same PR.
//   - Semantic invariants (matched/missing membership) are the stable layer:
//     they hold regardless of exact stopword-list churn.
//   - No real personal data — every fixture is a synthetic persona.

import type { CareerProfile, CVData } from "@/types";

// ─── CV fixtures (synthetic personas) ────────────────────────────────────────

export const cvFrontend: CVData = {
  personal: {
    fullName: "Amina Hassan",
    jobTitle: "Frontend Engineer",
    email: "amina@example.com",
    phone: "+255700000001",
    location: "Dar es Salaam",
    linkedin: "linkedin.com/in/amina-hassan",
    website: "",
    photo: "",
  },
  summary:
    "Frontend engineer with 4 years of experience building web applications with React, TypeScript and Next.js. Focus on clean, accessible interfaces and reliable REST API integrations.",
  experience: [
    {
      id: "e1",
      company: "Nala Finance",
      position: "Frontend Developer",
      location: "Dar es Salaam",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "Built customer-facing web dashboards with React and TypeScript. Integrated REST APIs, wrote Jest unit tests and shipped a shared design-system component library.",
    },
    {
      id: "e2",
      company: "Studio Pixel",
      position: "Junior Web Developer",
      location: "Dar es Salaam",
      startDate: "2020-01",
      endDate: "2022-02",
      current: false,
      description:
        "Built marketing sites with HTML, CSS and JavaScript. Maintained Git workflows and deployed to Vercel.",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "University of Dar es Salaam",
      degree: "BSc",
      field: "Computer Science",
      startDate: "2015-09",
      endDate: "2019-06",
    },
  ],
  skills: [
    { id: "s1", name: "React", level: 5 },
    { id: "s2", name: "TypeScript", level: 4 },
    { id: "s3", name: "JavaScript", level: 5 },
    { id: "s4", name: "Next.js", level: 4 },
    { id: "s5", name: "CSS", level: 4 },
    { id: "s6", name: "HTML", level: 5 },
    { id: "s7", name: "Git", level: 4 },
    { id: "s8", name: "REST API", level: 4 },
    { id: "s9", name: "Jest", level: 3 },
  ],
  projects: [
    {
      id: "p1",
      name: "Marketplace PWA",
      role: "Frontend lead",
      description:
        "Progressive web app for a local marketplace with offline support and push notifications.",
    },
  ],
  languages: [
    { id: "l1", name: "English", proficiency: "Fluent" },
    { id: "l2", name: "Swahili", proficiency: "Native" },
  ],
  certifications: [
    { id: "c1", name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", date: "2023-05" },
  ],
  referees: [],
  hobbies: "Photography, hiking",
};

export const cvSales: CVData = {
  personal: {
    fullName: "John Mwakasege",
    jobTitle: "Sales Manager",
    email: "john@example.com",
    phone: "+255700000002",
    location: "Arusha",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary:
    "Sales manager with 6 years of B2B experience, leading teams to hit revenue targets across East Africa.",
  experience: [
    {
      id: "e1",
      company: "Tanzania Agro Supplies",
      position: "Regional Sales Manager",
      location: "Arusha",
      startDate: "2021-01",
      endDate: "",
      current: true,
      description:
        "Led a team of 12 sales representatives across three regions. Managed the full sales pipeline in Salesforce, negotiated annual contracts worth over $1M and grew regional revenue by 30% year over year.",
    },
    {
      id: "e2",
      company: "Kilimo Plus",
      position: "Account Executive",
      location: "Arusha",
      startDate: "2018-02",
      endDate: "2020-12",
      current: false,
      description:
        "Prospected new B2B accounts, maintained CRM records in HubSpot and closed deals for agricultural inputs and equipment.",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "University of Dar es Salaam",
      degree: "BA",
      field: "Business Administration",
      startDate: "2013-09",
      endDate: "2017-06",
    },
  ],
  skills: [
    { id: "s1", name: "Salesforce", level: 4 },
    { id: "s2", name: "HubSpot", level: 4 },
    { id: "s3", name: "CRM", level: 5 },
    { id: "s4", name: "Excel", level: 4 },
    { id: "s5", name: "Negotiation", level: 5 },
    { id: "s6", name: "Prospecting", level: 4 },
    { id: "s7", name: "Pipeline Management", level: 5 },
    { id: "s8", name: "B2B Sales", level: 5 },
    { id: "s9", name: "Contract Negotiation", level: 4 },
  ],
  projects: [],
  languages: [
    { id: "l1", name: "English", proficiency: "Fluent" },
    { id: "l2", name: "Swahili", proficiency: "Native" },
  ],
  certifications: [],
  referees: [],
  hobbies: "Football, reading",
};

export const cvGraduate: CVData = {
  personal: {
    fullName: "Neema Joseph",
    jobTitle: "Data Analyst",
    email: "neema@example.com",
    phone: "+255700000003",
    location: "Mwanza",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary:
    "Recent Statistics graduate passionate about turning data into decisions. Completed an internship in data analysis and enjoy building dashboards and reports.",
  experience: [
    {
      id: "e1",
      company: "DataWise Analytics",
      position: "Data Analyst Intern",
      location: "Mwanza",
      startDate: "2024-06",
      endDate: "2024-12",
      current: false,
      description:
        "Cleaned and analysed customer datasets with SQL and Excel. Built weekly reports and dashboards in Power BI and presented findings to the analytics team.",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "Mzumbe University",
      degree: "BSc",
      field: "Statistics",
      startDate: "2019-09",
      endDate: "2023-06",
    },
  ],
  skills: [
    { id: "s1", name: "Excel", level: 5 },
    { id: "s2", name: "SQL", level: 4 },
    { id: "s3", name: "Python", level: 3 },
    { id: "s4", name: "Tableau", level: 3 },
    { id: "s5", name: "Power BI", level: 4 },
    { id: "s6", name: "Statistics", level: 4 },
    { id: "s7", name: "Data Cleaning", level: 4 },
    { id: "s8", name: "Reporting", level: 4 },
  ],
  projects: [
    {
      id: "p1",
      name: "Tanzania Food Security Dashboard",
      role: "Solo analyst",
      description:
        "Analysed open government datasets in Python and built an interactive Tableau dashboard on regional food availability.",
    },
  ],
  languages: [
    { id: "l1", name: "English", proficiency: "Fluent" },
    { id: "l2", name: "Swahili", proficiency: "Native" },
  ],
  certifications: [],
  referees: [],
  hobbies: "Volunteering, swimming",
};

/** A deliberately WEAK CV — short summary, passive bullets, no quantification.
 *  The AI-tailor eval asserts truthful tailoring lifts its ATS score. */
export const cvWeak: CVData = {
  personal: {
    fullName: "Baraka Mushi",
    jobTitle: "Software Developer",
    email: "baraka@example.com",
    phone: "+255700000004",
    location: "Dodoma",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary: "Graduate looking for work.",
  experience: [
    {
      id: "e1",
      company: "Local Tech Hub",
      position: "Developer",
      location: "Dodoma",
      startDate: "2023-01",
      endDate: "",
      current: true,
      description: "Worked on web projects. Did some coding.",
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "Dodoma University",
      degree: "BSc",
      field: "Informatics",
      startDate: "2017-09",
      endDate: "2021-06",
    },
  ],
  skills: [
    { id: "s1", name: "JavaScript", level: 3 },
    { id: "s2", name: "React", level: 2 },
    { id: "s3", name: "HTML", level: 3 },
    { id: "s4", name: "CSS", level: 3 },
  ],
  projects: [
    {
      id: "p1",
      name: "Student fee tracker",
      role: "Solo developer",
      description: "A small web app for tracking school fee payments.",
    },
  ],
  languages: [
    { id: "l1", name: "English", proficiency: "Intermediate" },
    { id: "l2", name: "Swahili", proficiency: "Native" },
  ],
  certifications: [],
  referees: [],
  hobbies: "",
};

// ─── JD fixtures ─────────────────────────────────────────────────────────────

export const jdFrontend = `Senior Frontend Engineer — Full-time
We are looking for a Senior Frontend Engineer with 5+ years of experience with React, TypeScript and Next.js. Experience with GraphQL, CI/CD pipelines and AWS is a plus. You will build and scale our design system, mentor junior engineers and ship accessible, high-performance interfaces.
Responsibilities: implement new product features, review pull requests, maintain Jest test suites.
Requirements: strong JavaScript fundamentals, experience with modern CSS, familiarity with agile delivery.
Apply now via our careers page.`;

export const jdSales = `Sales Manager — B2B
We are looking for an experienced Sales Manager to lead our B2B sales team.
Responsibilities: build and manage the sales pipeline, hit monthly quotas, coach account executives, maintain accurate CRM records.
Requirements: 5+ years of B2B sales, experience with Salesforce, strong negotiation skills, proficiency in Excel for reporting.
The ideal candidate is a proven leader who can close enterprise deals.`;

export const jdDataAnalyst = `Junior Data Analyst — Full-time
We are hiring a Junior Data Analyst to join our insights team.
Responsibilities: write SQL queries to extract and clean data, build Excel and Tableau dashboards, analyse trends with Python and Power BI, and present weekly reports.
Requirements: degree in Statistics or a related field, experience with data cleaning, attention to detail.`;

/** Hard-negative pair: a software CV against an unrelated trade job. The match
 *  must stay LOW — a scoring regression that inflates the score fails here. */
export const jdPlumber = `Plumber — Full-time
We are hiring an experienced plumber to install and repair pipes, drainage systems and water heaters in residential and commercial buildings.
Responsibilities: diagnose leaks, fit bathrooms, maintain tools and equipment.
Requirements: 3+ years of plumbing experience, own tools, valid driving licence.`;

// ─── Golden match pairs with pinned scores ───────────────────────────────────
// Pins are measured on master at authoring time (evals/probe-pins.ts). The
// semantic invariants are the stable layer; the pins catch scoring regressions.

export interface GoldenMatchPair {
  name: string;
  cv: CVData;
  jd: string;
  /** Pinned matchCvToJd score (0–100) from the real engine at authoring time. */
  pinnedScore: number;
  /** Tolerance for the pin (0 = exact). Bump ONLY with a reviewed scoring change. */
  tolerance: number;
  /** Terms that MUST be matched for this pair (word-boundary semantics). */
  mustMatch: string[];
  /** Terms that MUST be missing (the CV genuinely lacks them). */
  mustMiss: string[];
}

export const goldenPairs: GoldenMatchPair[] = [
  {
    name: "frontend-engineer",
    cv: cvFrontend,
    jd: jdFrontend,
    pinnedScore: 39, // measured 2026-08-18 (evals/probe-pins.ts)
    tolerance: 0,
    mustMatch: ["react", "typescript", "jest", "javascript", "aws"],
    mustMiss: ["graphql", "pipelines"],
  },
  {
    name: "sales-manager",
    cv: cvSales,
    jd: jdSales,
    pinnedScore: 54,
    tolerance: 0,
    mustMatch: ["salesforce", "crm", "excel", "b2b", "negotiation"],
    mustMiss: ["quotas", "coach", "monthly"],
  },
  {
    name: "graduate-data-analyst",
    cv: cvGraduate,
    jd: jdDataAnalyst,
    pinnedScore: 55,
    tolerance: 0,
    mustMatch: ["sql", "tableau", "python", "statistics", "excel"],
    mustMiss: ["queries", "insights", "trends"],
  },
  {
    name: "hard-negative-plumber",
    cv: cvFrontend,
    jd: jdPlumber,
    pinnedScore: 12, // low on purpose — the hard negative
    tolerance: 0,
    mustMatch: [],
    mustMiss: ["plumbing", "pipes", "drainage", "water"],
  },
];

// ─── Golden profiles for the deterministic tailor builder ────────────────────

/** Helper: start from an empty profile and overlay only what the fixture needs. */
export function profileFrom(partial: Partial<CareerProfile>): CareerProfile {
  return { ...createEmpty(), ...partial };
}

// Local import shim — types re-exports createEmptyCareerProfile.
import { createEmptyCareerProfile as createEmpty } from "@/types";

export const profileFrontend: CareerProfile = profileFrom({
  personal: {
    fullName: "Amina Hassan",
    jobTitle: "Frontend Engineer",
    email: "amina@example.com",
    phone: "+255700000001",
    location: "Dar es Salaam",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary:
    "Frontend engineer with 4 years of experience building web applications with React, TypeScript and Next.js.",
  skills: [
    { id: "s1", name: "React", level: 5 },
    { id: "s2", name: "TypeScript", level: 4 },
    { id: "s3", name: "JavaScript", level: 5 },
    { id: "s4", name: "Next.js", level: 4 },
    { id: "s5", name: "CSS", level: 4 },
    { id: "s6", name: "Git", level: 4 },
  ],
  experience: [
    {
      id: "e1",
      company: "Nala Finance",
      position: "Frontend Developer",
      location: "Dar es Salaam",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "Built customer-facing web dashboards with React and TypeScript. Integrated REST APIs and wrote Jest unit tests.",
    },
  ],
  education: [],
  languages: [],
  certifications: [],
  projects: [],
  achievements: [],
  volunteer: [],
  preferences: { targetRoles: [], preferredLocations: [], remotePreference: "" },
  factMeta: {},
});

export const profileSales: CareerProfile = profileFrom({
  personal: {
    fullName: "John Mwakasege",
    jobTitle: "Sales Manager",
    email: "john@example.com",
    phone: "+255700000002",
    location: "Arusha",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary:
    "Sales manager with 6 years of B2B experience, leading teams to hit revenue targets across East Africa.",
  skills: [
    { id: "s1", name: "Salesforce", level: 4 },
    { id: "s2", name: "CRM", level: 5 },
    { id: "s3", name: "Excel", level: 4 },
    { id: "s4", name: "Negotiation", level: 5 },
    { id: "s5", name: "B2B Sales", level: 5 },
  ],
  experience: [
    {
      id: "e1",
      company: "Tanzania Agro Supplies",
      position: "Regional Sales Manager",
      location: "Arusha",
      startDate: "2021-01",
      endDate: "",
      current: true,
      description:
        "Led a team of 12 sales representatives across three regions. Managed the sales pipeline end-to-end and grew revenue by 30% year over year.",
    },
  ],
  education: [],
  languages: [],
  certifications: [],
  projects: [],
  achievements: [],
  volunteer: [],
  preferences: { targetRoles: [], preferredLocations: [], remotePreference: "" },
  factMeta: {},
});

/** A profile whose skill set genuinely misses a hard requirement of its JD —
 *  used to assert the builder surfaces it as `toConfirm`, never auto-adds it. */
export const profileGap: CareerProfile = profileFrom({
  personal: {
    fullName: "Neema Joseph",
    jobTitle: "Data Analyst",
    email: "neema@example.com",
    phone: "+255700000003",
    location: "Mwanza",
    linkedin: "",
    website: "",
    photo: "",
  },
  summary: "Recent Statistics graduate who enjoys building dashboards and reports.",
  skills: [
    { id: "s1", name: "Excel", level: 5 },
    { id: "s2", name: "SQL", level: 4 },
    { id: "s3", name: "Power BI", level: 4 },
  ],
  experience: [
    {
      id: "e1",
      company: "DataWise Analytics",
      position: "Data Analyst Intern",
      location: "Mwanza",
      startDate: "2024-06",
      endDate: "2024-12",
      current: false,
      description: "Cleaned and analysed customer datasets with SQL and Excel. Built reports in Power BI.",
    },
  ],
  education: [],
  languages: [],
  certifications: [],
  projects: [],
  achievements: [],
  volunteer: [],
  preferences: { targetRoles: [], preferredLocations: [], remotePreference: "" },
  factMeta: {},
});
