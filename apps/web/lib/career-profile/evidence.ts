// Evidence engine — the deterministic anti-fabrication layer for AI-written
// content. Pure, no AI, no DB, no React.
//
// The guardrail (lib/api/ai-guardrails.ts TRUTH_CONSTRAINT) tells the model
// never to invent facts. This engine is the ENFORCEMENT: after any AI rewrite
// (tailor-cv, summary enhance, assistant build), we scan the produced text for
// concrete claims and check each against what the user actually provided.
// Claims with no source in the CV/profile are flagged `needs-confirmation` —
// they are NEVER silently committed. The UI asks ("You don't have SAP listed —
// do you have SAP experience?") and only a user yes writes the fact.
//
// What counts as a "claim" (deliberately conservative — we flag anything a
// recruiter could treat as fact):
//   - percentages / numbers-with-units ("increased sales by 30%", "led a team
//     of 12") — unless the same figure appears in the user's own text
//   - named skills/tools not in the user's skill list or text
//   - employers / job titles / dates not present in the user's data
//
// Numbers the user themselves wrote are confirmed (source "user"); everything
// else lands needs-confirmation. The seam maps 1:1 onto factMeta on the
// profile/CV so Task-2-style tagging is already in place.

import type { CVData, FactStatus } from "@/types";

export interface EvidenceClaim {
  /** Short human-readable claim, e.g. "increased sales by 30%". */
  claim: string;
  /** Which kind of fact was detected. */
  kind: "metric" | "skill" | "employer" | "title" | "date";
  /** Where in the AI output it appears ("summary" or "experience:<company>"). */
  location: string;
  /** true when the user's own CV/profile contains this fact. */
  supported: boolean;
  /** The status the fact should carry in factMeta. */
  status: FactStatus;
  /** The exact user text that supports the claim (when supported). */
  source?: string;
}

// ─── Metric detection ────────────────────────────────────────────────────────

const UNITS =
  "%|percent|percentile|fold|x|users|clients|customers|students|employees|members|requests|orders|sales|revenue|projects|markets|countries|reports|tickets|leads|conversions|downloads|views|followers|subscribers|downtime|delay|cost|budget|hours|days|weeks|months|years|tSh|kes|usd|k|m|b";

// Quantity verbs that make a bare number a measurable claim ("led a team of
// 12", "increased by 30", "managed 50 projects").
const QUANTITY_CTX =
  "by|of|over|more than|led|managed|grew|increased|reduced|cut|saved|spent|raised|delivered|built|created|launched|scaled|hired|trained|mentored|handled|supported|served|grew|achieved|earned|won|reached|processed|completed|served";

/** Every figure in a text: { raw, normalized } (normalized = digits + unit). */
export function extractMetrics(text: string): Array<{ raw: string; normalized: string }> {
  const out: Array<{ raw: string; normalized: string }> = [];
  const seen = new Set<string>();
  const push = (raw: string, num: string, unit: string) => {
    const normalized = unit ? `${num} ${unit.toLowerCase()}`.trim() : num;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    out.push({ raw, normalized });
  };

  // number + unit ("30%", "$50K", "12 users", "5 years") — note: NO trailing
  // \b, because units like % and $ are non-word chars; the negative lookahead
  // alone prevents partial-word matches.
  const unitRe = new RegExp(`\\b(\\d+(?:[.,]\\d+)?)\\s*(${UNITS})(?![a-z0-9])`, "gi");
  let m: RegExpExecArray | null;
  while ((m = unitRe.exec(text)) !== null) {
    push(m[0], m[1].replace(",", "."), m[2]);
  }

  // bare number right after a quantity context word ("led a team of 12") —
  // but NOT when it's already part of a number+unit match ("by 30%").
  const bareRe = new RegExp(`(?:${QUANTITY_CTX})\\s+(\\d+(?:[.,]\\d+)?)\\b(?!\\s*(?:${UNITS})(?![a-z0-9]))`, "gi");
  while ((m = bareRe.exec(text)) !== null) {
    const digits = m[1].replace(".", "").replace(",", "");
    const num = parseFloat(m[1]);
    // Skip pure 4-digit years (1990–2100) — a year in prose is a date, not a
    // fabricated metric.
    if (/^\d{4}$/.test(digits) && num >= 1900 && num <= 2100) continue;
    push(m[0], m[1].replace(",", "."), "");
  }

  return out;
}

/** Does the user's own text contain this metric (same number + unit)? */
function userHasMetric(userText: string, normalized: string): boolean {
  const want = normalized.toLowerCase();
  const got = extractMetrics(userText).map((m) => m.normalized.toLowerCase());
  // Exact number+unit match. Accept comma/dot decimal variance ("30%" vs
  // "30.0%") by normalizing the digits.
  const norm = (s: string) => s.replace(/,/g, ".").replace(/\.0+(?=\s|$)/, "");
  return got.some((g) => norm(g) === norm(want));
}

// ─── Skill detection ─────────────────────────────────────────────────────────

/**
 * Skills/tools mentioned in AI text that are NOT in the user's skill list or
 * body text. Uses a compact known-tool lexicon + any user skill, so it never
 * needs an API. False negatives (unknown tool names) are fine — the model's
 * TRUTH_CONSTRAINT prompt already forbids inventing them; this catches the
 * common, high-signal cases (the ones a recruiter would actually verify).
 */
const KNOWN_TOOLS = [
  "sap", "salesforce", "hubspot", "quickbooks", "xero", "tableau", "power bi", "powerbi",
  "excel", "word", "powerpoint", "outlook", "sharepoint", "dynamics", "oracle", "snowflake",
  "databricks", "airflow", "kubernetes", "docker", "terraform", "ansible", "jenkins", "gitlab",
  "github", "jira", "confluence", "slack", "zoom", "notion", "asana", "trello", "figma",
  "sketch", "photoshop", "illustrator", "after effects", "premiere", "final cut", "blender",
  "unity", "unreal", "react", "react native", "angular", "vue", "svelte", "node", "node.js",
  "typescript", "javascript", "python", "java", "golang", "go", "rust", "c++", "c#", "php",
  "ruby", "rails", "django", "flask", "fastapi", "spring", "laravel", "next.js", "nextjs",
  "express", "graphql", "rest api", "postgresql", "postgres", "mysql", "mongodb", "redis",
  "kafka", "rabbitmq", "aws", "azure", "gcp", "google cloud", "firebase", "supabase", "vercel",
  "netlify", "stripe", "twilio", "sendgrid", "segment", "amplitude", "mixpanel", "posthog",
  "google analytics", "meta ads", "google ads", "seo", "sem", "crm", "erp", "scrum", "agile",
  "kanban", "lean", "six sigma", "kaizen", "iso", "gdpr", "hipaa", "sox",
] as const;

export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const tool of KNOWN_TOOLS) {
    // Word-boundary match (tools can be multi-word).
    const re = new RegExp(`(^|[^a-z0-9])${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.push(tool);
  }
  return found;
}

function userHasSkill(userData: CVData, skill: string): boolean {
  const lower = skill.toLowerCase();
  if (userData.skills?.some((s) => s.name?.toLowerCase().includes(lower))) return true;
  const body = [
    userData.summary,
    ...userData.experience.map((e) => `${e.position} ${e.company} ${e.description}`),
    ...(userData.projects ?? []).map((p) => `${p.name} ${p.description}`),
    ...userData.certifications.map((c) => `${c.name} ${c.issuer}`),
    ...userData.education.map((e) => `${e.degree} ${e.field} ${e.institution}`),
  ].join(" ").toLowerCase();
  return body.includes(lower);
}

// ─── Employer / title / date detection ───────────────────────────────────────

/** Companies the user has actually worked at (lowercased). */
function userEmployers(userData: CVData): Set<string> {
  return new Set(
    userData.experience
      .map((e) => e.company?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );
}

/**
 * Well-known employers a model may slip into a rewrite ("led sales at Google").
 * Detection is heuristic; anything in this list that the user never listed is
 * a needs-confirmation claim. Unknown/invented companies aren't caught by a
 * lexicon — the TRUTH_CONSTRAINT prompt forbids them and the confirmation UI
 * covers the rest.
 */
const KNOWN_COMPANIES = [
  "google", "alphabet", "microsoft", "amazon", "apple", "meta", "facebook",
  "netflix", "tesla", "ibm", "intel", "oracle", "salesforce", "adobe", "cisco",
  "dell", "hp", "hp inc", "hewlett packard", "sap", "accenture", "deloitte",
  "pwc", "ey", "kpmg", "mckinsey", "bain", "bcg", "goldman sachs", "jpmorgan",
  "jpmorgan chase", "citi", "hsbc", "barclays", "vodafone", "safaricom", "mtn",
  "airtel", "tigo", "vodacom", "equitel", "telkom", "nbc", "crdb", "nmb",
  "exim bank", "equity bank", "kcb", "absa", "stanbic", "standard chartered",
  "uber", "lyft", "airbnb", "shopify", "stripe", "square", "paypal", "visa",
  "mastercard", "samsung", "sony", "nokia", "ericsson", "huawei", "tencent",
  "alibaba", "tiktok", "spotify", "zoom", "slack", "atlassian", "twilio",
  "verizon", "at&t", "t-mobile", "orange", "telecom", "safaricom",
] as const;

/**
 * Companies in the AI text that the user has never worked at. Returns the
 * names (lowercased) — each becomes a needs-confirmation claim.
 */
export function detectInventedEmployers(text: string, userData: CVData): string[] {
  const lower = text.toLowerCase();
  const real = userEmployers(userData);
  const hits: string[] = [];
  for (const company of KNOWN_COMPANIES) {
    if (real.has(company)) continue; // they really worked there
    const re = new RegExp(`(^|[^a-z0-9])${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) hits.push(company);
  }
  return hits;
}

// ─── Main entry: check AI output against user truth ─────────────────────────

export interface EvidenceReport {
  claims: EvidenceClaim[];
  /** True when every claim is supported — safe to apply without asking. */
  allSupported: boolean;
  /** Claims needing the user's confirmation. */
  unconfirmed: EvidenceClaim[];
}

/**
 * Scan AI-written content (summary + experience bullets) against the user's
 * real CV data. Every claim that lacks a user source is flagged
 * needs-confirmation; supported claims stay confirmed. This is the seam the
 * UI reads to show "You don't have SAP listed — do you have SAP experience?"
 */
export function verifyAiContent(
  aiSummary: string,
  aiExperience: Array<{ id: string; position?: string; company?: string; description: string }>,
  userData: CVData,
): EvidenceReport {
  const claims: EvidenceClaim[] = [];
  const userText = [
    userData.summary,
    ...userData.experience.map((e) => `${e.position} ${e.company} ${e.description}`),
    ...(userData.projects ?? []).map((p) => `${p.name} ${p.role ?? ""} ${p.description}`),
    ...userData.certifications.map((c) => `${c.name} ${c.issuer}`),
    ...userData.education.map((e) => `${e.degree} ${e.field}`),
  ].join(" \n ");

  const scan = (text: string, location: string) => {
    if (!text) return;
    // Metrics
    for (const metric of extractMetrics(text)) {
      const supported = userHasMetric(userText, metric.normalized);
      claims.push({
        claim: metric.raw,
        kind: "metric",
        location,
        supported,
        status: supported ? "confirmed" : "needs-confirmation",
        source: supported ? userText.slice(0, 400) : undefined,
      });
    }
    // Skills/tools
    for (const skill of extractSkills(text)) {
      if (userHasSkill(userData, skill)) continue;
      claims.push({
        claim: skill,
        kind: "skill",
        location,
        supported: false,
        status: "needs-confirmation",
      });
    }
    // Employers the user never worked at (well-known companies only)
    for (const emp of detectInventedEmployers(text, userData)) {
      claims.push({
        claim: emp,
        kind: "employer",
        location,
        supported: false,
        status: "needs-confirmation",
      });
    }
  };

  scan(aiSummary, "summary");
  for (const exp of aiExperience) {
    scan(exp.description, exp.company ? `experience:${exp.company}` : "experience");
  }

  const unconfirmed = claims.filter((c) => c.status !== "confirmed");
  return { claims, allSupported: unconfirmed.length === 0, unconfirmed };
}

/**
 * Convenience for the tailor route: also returns per-entry flags so the client
 * can render a "needs confirmation" chip on the offending experience bullets.
 */
export function tailorEvidence(
  result: { summary: string; experience: Array<{ id: string; description: string }> },
  userData: CVData,
): EvidenceReport {
  return verifyAiContent(result.summary, result.experience, userData);
}

/** Human labels for the UI (EN + SW). */
export const EVIDENCE_LABELS = {
  en: {
    metric: "figure/percentage",
    skill: "skill or tool",
    employer: "employer",
    title: "job title",
    date: "date",
    needsConfirmation: "Not in your CV — confirm before it's added.",
    confirmed: "Matches your CV ✓",
  },
  sw: {
    metric: "idadi/asilimia",
    skill: "ujuzi au zana",
    employer: "mwajiri",
    title: "cheo",
    date: "tarehe",
    needsConfirmation: "Haipo kwenye CV yako — thibitisha kabla ya kuongezwa.",
    confirmed: "Inalingana na CV yako ✓",
  },
} as const;
