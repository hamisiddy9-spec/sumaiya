/**
 * Role-taxonomy framing — closes the gap the business audit flagged: AI
 * tailoring prompts weave in a job's keywords but don't shift TONE by field.
 * A sales CV should read like sales (quota, closing, relationship-building);
 * a clinical CV should read like clinical care (safety, precision,
 * compliance) — the AI shouldn't sound the same regardless of field.
 *
 * Deterministic, no AI, no DB — same philosophy as lib/job-analysis.ts's
 * JD_SKILLS lexicon. Detects a role BUCKET from the job title/description via
 * a word-boundary lexicon, and returns one short instruction block to
 * interpolate into the existing tailoring prompts in lib/api/routes/ai.ts.
 *
 * This generalizes a rule that already existed by hand in the /parse-cv
 * prompt (never reframe a vet's role as sales/marketing/customer-service) —
 * every bucket below carries the same "don't impose this vocabulary on a
 * role it doesn't fit" discipline, and truthfulness always wins over theme.
 */

export type RoleBucket =
  | "sales" | "clinical" | "trades" | "education" | "admin" | "hospitality"
  | "agriculture" | "logistics" | "it" | "creative" | "finance";

interface RoleBucketDef {
  id: RoleBucket;
  label: string;
  signals: string[];
  guidance: string;
}

const BUCKETS: RoleBucketDef[] = [
  {
    id: "sales", label: "sales",
    signals: ["sales", "account executive", "business development", "sales associate", "sales representative", "retail assistant", "mauzo"],
    guidance: "emphasise quota/target achievement, building repeat-customer relationships, reading buying signals, and closing confidently.",
  },
  {
    id: "clinical", label: "clinical/care",
    signals: ["nurse", "doctor", "daktari", "clinical officer", "pharmacist", "veterinarian", "midwife", "lab technician", "caregiver", "muuguzi", "afya"],
    guidance: "lead with safety, precision, patient/animal care quality, and protocol/compliance adherence.",
  },
  {
    id: "trades", label: "trades/technical",
    signals: ["electrician", "plumber", "mechanic", "welder", "carpenter", "fundi", "technician", "repair"],
    guidance: "lead with hands-on skill, safety compliance, reliability, and accurate diagnosis/repair work.",
  },
  {
    id: "education", label: "education",
    signals: ["teacher", "tutor", "lecturer", "instructor", "mwalimu", "trainer"],
    guidance: "lead with outcomes for the people taught — learning results, curriculum delivery, mentorship.",
  },
  {
    id: "admin", label: "admin/office",
    signals: ["administrator", "secretary", "clerk", "office assistant", "receptionist", "data entry", "karani"],
    guidance: "lead with accuracy, organisation, process reliability, and attention to detail.",
  },
  {
    id: "hospitality", label: "hospitality",
    signals: ["waiter", "waitress", "chef", "cook", "hotel", "restaurant", "barista", "housekeeping", "hoteli"],
    guidance: "lead with guest experience, speed and composure under pressure, presentation, and teamwork during peak service.",
  },
  {
    id: "agriculture", label: "agriculture",
    signals: ["farmer", "agronomist", "livestock", "agriculture", "kilimo", "ufugaji", "agribusiness"],
    guidance: "lead with yield/production outcomes, crop or animal health, seasonal planning, and hands-on land/livestock management.",
  },
  {
    id: "logistics", label: "logistics/supply chain",
    signals: ["logistics", "supply chain", "warehouse", "dispatch", "procurement", "inventory", "driver", "fleet"],
    guidance: "lead with on-time delivery, record/stock accuracy, route or cost efficiency, and coordination under deadline.",
  },
  {
    id: "it", label: "IT/software",
    signals: ["developer", "software engineer", "programmer", "it support", "data analyst", "devops", "system administrator"],
    guidance: "lead with technical problem-solving, systems reliability, and any measurable performance or efficiency gain.",
  },
  {
    id: "creative", label: "creative",
    signals: ["designer", "photographer", "videographer", "content creator", "graphic designer", "illustrator", "editor"],
    guidance: "lead with concrete creative output (a portfolio-first mindset), brand/client fit, and turnaround reliability.",
  },
  {
    id: "finance", label: "finance/accounting",
    signals: ["accountant", "bookkeeper", "auditor", "finance officer", "accounting", "payroll", "tax"],
    guidance: "lead with accuracy, compliance, reconciliation discipline, and any real cost-saving or reporting outcome the candidate stated.",
  },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** First bucket whose signal word/phrase appears in the text, or null. */
export function detectRoleBucket(text: string): RoleBucketDef | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const b of BUCKETS) {
    for (const s of b.signals) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(s)}([^a-z0-9]|$)`, "i");
      if (re.test(lower)) return b;
    }
  }
  return null;
}

/**
 * One prompt block to interpolate into a tailoring/cover-letter prompt, or ""
 * when no bucket is detected (leaves the existing generic behaviour as-is —
 * this only ADDS framing, never removes the base truthfulness rules).
 */
export function roleTaxonomyPromptBlock(jobTitleOrJd: string): string {
  const b = detectRoleBucket(jobTitleOrJd);
  if (!b) return "";
  return ` ROLE FRAMING (${b.label} role): ${b.guidance} Only surface details the candidate actually stated — never invent an achievement, number, or duty to fit this framing, and if their real background doesn't naturally fit this field's usual emphasis, stay truthful over on-theme.`;
}
