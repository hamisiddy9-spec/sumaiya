/**
 * Deterministic copy guard for Sumaiya's SWAHILI replies.
 *
 * The prompt already forbids untranslated English and ATS jargon in Swahili
 * (and the repeat/voice guards already exist for English leaks), but a prompt is
 * advisory — live QA 2026-09-21 caught, inside ONE Swahili reply:
 *
 *   • the literal English "customer service"                 (should be "huduma kwa mteja")
 *   • an ATS explanation in English jargon, incl. `"ats"`    (should describe the outcome)
 *   • an employer-screening phrase built from "kuchuja"      (the house word is "vigezo")
 *
 * and the user's OWN CV written as "CV yangu" on one surface while every other (swahili-lint-ignore: cited counter-example)
 * surface says "CV yako" (the native swahili-lint.test.ts already enforces the
 * second person for chrome strings; a model reply never passes through it).
 *
 * So the LAST thing that happens to a Swahili reply is this pure function: it
 * rewrites the known-bad terms to the house wording. It is deliberately a small
 * closed set of measured defects — not a translator — and it only ever touches
 * Swahili replies (`lang === "sw"`); English replies are untouched, where "ATS"
 * and "customer service" are correct.
 */

export interface CopyFix {
  /** What is wrong in the shipped copy. */
  re: RegExp;
  /** What it must say instead. */
  to: string;
  /** Shown in tests to explain why this pair exists. */
  why: string;
}

/**
 * Ordered: the ATS patterns run before the generic one so "kagua ATS" becomes (swahili-lint-ignore: cited counter-example)
 * the human outcome ("ukaguzi wa CV") rather than "kagua mifumo ya kuajiri".
 */
export const SWAHILI_COPY_FIXES: CopyFix[] = [
  {
    re: /\bcustomer\s+service\b/gi,
    to: "huduma kwa mteja",
    why: "untranslated English job title inside a Swahili reply",
  },
  {
    re: /\bcustomer\s+care\b/gi,
    to: "huduma kwa mteja",
    why: "untranslated English job title inside a Swahili reply",
  },
  {
    re: /\bcover\s*letter\b/gi,
    to: "barua ya maombi",
    why: "untranslated English document name inside a Swahili reply",
  },
  {
    re: /\bCV\s+summary\b/gi,
    to: "muhtasari wa CV",
    why: "untranslated English document name inside a Swahili reply",
  },
  {
    re: /\b(alama|score)\s+ya\s+"?ATS"?\b/gi,
    to: "alama ya CV",
    why: "names the screening MECHANISM instead of the outcome ('alama ya CV' is what the app calls it)",
  },
  {
    re: /\b(kagua|kukagua)\s+"?ATS"?\b/gi,
    to: "kukagua CV",
    why: "names the screening MECHANISM instead of the outcome (native lint: no ATS in Swahili)",
  },
  {
    re: /\bATS\s+(check|scan|test|score|alama)\b/gi,
    to: "ukaguzi wa CV",
    why: "names the screening MECHANISM instead of the outcome",
  },
  {
    re: /\bATS\b/gi,
    to: "mifumo ya kuajiri",
    why: "no 'ATS' jargon in Swahili copy — describe it as hiring systems",
  },
  {
    re: /\bvichujio\s+vya\s+waajiri\b/gi,
    to: "vigezo vya waajiri",
    why: "house word for an employer's screening criteria is 'vigezo'",
  },
  {
    re: /\bvichujio\b/gi,
    to: "vigezo",
    why: "house word for screening criteria is 'vigezo'",
  },
  {
    re: /\bCV\s+yangu\b/gi,
    to: "CV yako",
    why: "the user's OWN CV is 'CV yako' — the voice is second person everywhere",
  },
  {
    re: /\bCV\s+zangu\b/gi,
    to: "CV zako",
    why: "the user's OWN CV is 'CV zako' — the voice is second person everywhere",
  },
  {
    re: /\bwasifu\s+wangu\b/gi,
    to: "wasifu wako",
    why: "the user's OWN CV is 'wasifu wako' — the voice is second person everywhere",
  },
];

/**
 * Rewrite the measured copy defects in a reply. Swahili replies only; the
 * function is a no-op for English and for text with none of the defects.
 */
export function fixSwahiliReplyCopy(reply: string, lang: "sw" | "en"): string {
  if (lang !== "sw" || !reply) return reply;
  let out = reply;
  for (const fix of SWAHILI_COPY_FIXES) {
    // A fresh RegExp per call: the exported table is shared, and `lastIndex`
    // on a /g/ regex is stateful — reusing it across calls would skip matches.
    out = out.replace(new RegExp(fix.re.source, fix.re.flags), fix.to);
  }
  return out;
}

/** True when the reply contains a term this guard would rewrite. */
export function hasSwahiliCopyDefect(reply: string): boolean {
  return SWAHILI_COPY_FIXES.some((f) => new RegExp(f.re.source, f.re.flags).test(reply || ""));
}
