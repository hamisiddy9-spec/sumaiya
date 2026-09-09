// Scored rubric for AI-generative evals. LLM output is non-deterministic, so we
// never assert exact strings — we score PROPERTIES (language, truthfulness,
// structure, quality lift) against a pass threshold. Hard invariants (e.g. the
// evidence engine must flag every fabricated claim) stay plain assertions in
// the suites; this module provides the scored, thresholded layer.
//
// Deterministic and pure — no AI, no DB, no network. Safe for CI.

// ─── Language detection (word-boundary function-word counting) ───────────────

// Swahili function words / grammatical glue. Two-letter connectors (na, ya, wa,
// za, ni, si, tu, au) are deliberately included HERE: detection wants them,
// unlike keyword extraction where the length>=3 filter drops them.
const SW_WORDS = new Set([
  "na", "ya", "wa", "za", "ni", "si", "tu", "au", "kwa", "katika", "kama", "pia",
  "hii", "hizi", "hiyo", "hizo", "huu", "huo", "hawa", "huyu", "wao", "sisi",
  "mimi", "wewe", "yeye", "kuwa", "kutoka", "ndani", "zaidi", "sana", "kisha",
  "basi", "lakini", "ingawa", "kwamba", "vile", "wakati", "hata", "ndiyo",
  "ndio", "hapana", "yangu", "yako", "yake", "zangu", "zake", "wangu", "wako",
  "wake", "kila", "baadhi", "kabla", "baada", "kuhusu", "pamoja", "miongoni",
  "hivyo", "huko", "pale", "hapa", "wapi", "lini", "nini", "nani", "vipi",
  "jinsi", "mara", "muda", "sasa", "bado", "tena", "kitu", "kazi", "mimi",
  "yote", "zote", "wote", "vyote", "kila", "wengine", "nyingine",
]);

const EN_WORDS = new Set([
  "the", "and", "of", "to", "in", "is", "are", "was", "were", "be", "been",
  "with", "for", "on", "at", "by", "from", "as", "an", "a", "it", "this",
  "that", "these", "those", "we", "you", "they", "your", "our", "their", "has",
  "have", "had", "will", "would", "could", "should", "can", "not", "but", "or",
  "so", "if", "then", "than", "more", "most", "all", "any", "each", "some",
  "such", "no", "nor", "only", "own", "same", "too", "very", "just", "because",
  "while", "also", "both", "he", "she", "his", "her", "its", "there", "here",
  "over", "under", "again", "further", "once", "new", "work", "good", "great",
  "strong", "ability", "looking", "seeking", "join", "help", "support", "use",
  "well", "across", "within", "between", "ensure", "provide", "drive", "define",
  "manage", "build", "create", "understand", "based", "related", "required",
  "including", "candidate", "responsibilities", "qualifications", "experience",
  "skills", "role", "team", "company", "year", "years",
]);

export interface LanguageScore {
  sw: number;
  en: number;
  swRatio: number; // sw / (sw + en); 0 when both are 0
  enRatio: number;
  dominant: "sw" | "en" | "unknown";
}

export function detectLanguage(text: string): LanguageScore {
  const words = (text ?? "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let sw = 0;
  let en = 0;
  for (const w of words) {
    if (SW_WORDS.has(w)) sw += 1;
    if (EN_WORDS.has(w)) en += 1;
  }
  const total = sw + en;
  const swRatio = total ? sw / total : 0;
  const enRatio = total ? en / total : 0;
  const dominant: LanguageScore["dominant"] =
    total === 0 ? "unknown" : swRatio > enRatio ? "sw" : "en";
  return { sw, en, swRatio, enRatio, dominant };
}

/** 0..1 — how well the text matches the requested language. 1.0 = clearly that
 *  language; ~0 = clearly the other. Thresholds chosen so mixed/unknown text
 *  scores low. */
export function scoreLanguageFidelity(text: string, expected: "sw" | "en"): number {
  const d = detectLanguage(text);
  if (d.dominant === "unknown") return 0;
  return expected === "sw" ? d.swRatio : d.enRatio;
}

/** Pass threshold for scored language checks (a majority of function words in
 *  the requested language, with margin). */
export const LANGUAGE_PASS_THRESHOLD = 0.55;

// ─── Structure checks ────────────────────────────────────────────────────────

/** 0..1 — the output parses and has all required keys as non-null values. */
export function scoreStructure(
  parsed: unknown,
  requiredKeys: string[],
): number {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return 0;
  const o = parsed as Record<string, unknown>;
  const present = requiredKeys.filter((k) => o[k] !== undefined && o[k] !== null && o[k] !== "");
  return present.length / requiredKeys.length;
}

export const STRUCTURE_PASS_THRESHOLD = 1; // every required key must be present

// ─── Truthfulness score (from an EvidenceReport) ─────────────────────────────

import type { EvidenceReport } from "@/lib/career-profile/evidence";

/** 0..1 — share of claims that are supported by the user's real CV. 1.0 = no
 *  fabricated claims. The HARD gate (allSupported === true) is asserted in the
 *  suites; this is the scored, thresholded view. */
export function scoreTruthfulness(report: EvidenceReport): number {
  if (!report.claims.length) return 1;
  const supported = report.claims.filter((c) => c.supported).length;
  return supported / report.claims.length;
}

export const TRUTH_PASS_THRESHOLD = 1; // zero fabricated claims is the bar

// ─── Quality-lift score ──────────────────────────────────────────────────────

/** 0..1 — did the tailored CV beat the original on the REAL ATS engine?
 *  Reports the delta; the suite decides the bar. */
export function scoreQualityLift(beforeScore: number, afterScore: number): number {
  return afterScore > beforeScore ? 1 : afterScore === beforeScore ? 0.5 : 0;
}

/** Combined pass criterion for a generative eval: every scored dimension must
 *  clear its threshold. Returns the failing dimension names (empty = pass). */
export function evalPasses(scores: Record<string, { value: number; threshold: number }>): string[] {
  return Object.entries(scores)
    .filter(([, s]) => s.value < s.threshold)
    .map(([name]) => name);
}
