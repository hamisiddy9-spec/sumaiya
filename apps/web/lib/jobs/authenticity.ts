/**
 * Authenticity guards for the jobs pipeline.
 *
 * Keeps scam / placeholder listings out of the feed WITHOUT needing AI — the
 * trusted-source APIs (Remotive, Jobicy, Arbeitnow…) already vet the postings
 * they carry, and these layers catch the junk that slips through:
 *
 *   1. URL shape      — only http(s); known shorteners and mailto:/javascript:
 *                       links are rejected (a real employer posts on its own
 *                       domain or a reputable board).
 *   2. Scam phrases   — high-signal patterns that legitimate job posts don't
 *                       contain ("pay to apply", "training fee", "guaranteed
 *                       income"…).
 *   3. Placeholders   — test/sample/lorem postings that are not real openings.
 *
 * Every function is pure and synchronous so it can be unit-tested and reused
 * anywhere (ingest, admin review, API layer).
 */

// Known URL shorteners — a legit job ad points somewhere real, not a redirect
// wrapper. (Rejecting these keeps phishing links out of the feed.)
const SHORTENER_RE = /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|cutt\.ly|is\.gd|buff\.ly|shorturl\.at|rebrand\.ly|rb\.gy|surl\.li|bl\.ink|short\.io)\b/i;

// High-signal scam patterns. Deliberately specific — we'd rather keep a weird
// but real posting than block on a broad match.
const SCAM_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /pay\s+(to\s+)?(apply|for\s+the\s+job)|application\s+fee|registration\s+fee|processing\s+fee/i, reason: "fee to apply" },
  { re: /training\s+fee|pay\s+for\s+training|cost\s+of\s+training|buy\s+equipment|purchase\s+equipment/i, reason: "training/equipment fee" },
  { re: /guaranteed\s+income|guaranteed\s+earnings|make\s+\$\d{3,}\s*(a|per)\s*day|earn\s+\$\d{3,}\s*(a|per)\s*day/i, reason: "guaranteed income" },
  { re: /mystery\s+shopper|secret\s+santa\s+job|package\s+reship|reship(ing)?\s+packages/i, reason: "known scam category" },
  { re: /wire\s+(the\s+)?money|western\s+union|moneygram\s+transfer|send\s+us\s+money/i, reason: "wire transfer request" },
  { re: /no\s+interview\s+needed|no\s+interview\s+required|immediate\s+hire\s+no\s+experience|start\s+today\s+no\s+experience/i, reason: "no-interview hook" },
  { re: /claim\s+your\s+prize|lucky\s+winner|you\s+have\s+been\s+selected\s+to\s+receive/i, reason: "prize/lottery style" },
  { re: /bitcoin\s+mining\s+job|crypto\s+investment\s+job|invest\s+\$\d+\s+to\s+start/i, reason: "crypto/investment scam" },
];

// Some patterns need a NEGATION guard: real ATS postings (Greenhouse, Lever,
// SmartRecruiters, Workday…) embed anti-scam boilerplate that MENTIONS the
// scam phrase to warn candidates — e.g. Duolingo's JD says "we'll never ask
// you to ... purchase equipment, or exchange money during the interview
// process." Flagging that as a scam would drop a real employer's posting.
// When the scam phrase sits in a sentence with a negator (never/not/no/
// won't/don't/do not/will not/avoid), it is a WARNING, not a demand.
const NEGATION_RE =
  /\b(never|not|no|won'?t|don'?t|do\s+not|does\s+not|will\s+not|shall\s+not|would\s+not|must\s+not|avoid|refuse|refuses|unlikely|shouldn'?t|can'?t|cannot|won'?t)\b/i;

/** Patterns that must NOT fire inside an anti-scam warning sentence. */
const NEGATION_GUARDED_PATTERNS: RegExp[] = [
  /training\s+fee|pay\s+for\s+training|cost\s+of\s+training|buy\s+equipment|purchase\s+equipment/i,
  /pay\s+(to\s+)?(apply|for\s+the\s+job)|application\s+fee|registration\s+fee|processing\s+fee/i,
  /wire\s+(the\s+)?money|western\s+union|moneygram\s+transfer|send\s+us\s+money/i,
  /guaranteed\s+income|guaranteed\s+earnings|make\s+\$\d{3,}\s*(a|per)\s*day|earn\s+\$\d{3,}\s*(a|per)\s*day/i,
];

/** Split text into sentences (roughly) so negation scoping stays local. */
function sentences(text: string): string[] {
  return (text || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

/** Does this sentence negate the scam phrase (i.e. it's a warning, not a demand)? */
function isNegatedWarning(sentence: string): boolean {
  return NEGATION_RE.test(sentence);
}

/** Does the scam phrase appear OUTSIDE any negated (warning) sentence? */
function appearsUnnegated(haystack: string, re: RegExp): boolean {
  for (const s of sentences(haystack)) {
    if (isNegatedWarning(s)) continue; // anti-scam boilerplate — skip
    if (re.test(s)) return true;
  }
  return false;
}

// Placeholder / test postings that are not real openings.
const PLACEHOLDER_RE = /lorem\s+ipsum|test\s+job|sample\s+job|test\s+posting|job\s+title\s+goes\s+here|asdfgh|^test\b|\bxxx\b|placeholder|demo\s+listing|do\s+not\s+apply/i;

export interface AuthenticityVerdict {
  ok: boolean;
  reasons: string[];
}

/** Is this apply URL a real, non-shortened http(s) link? */
export function isSafeApplyUrl(url: string): boolean {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false; // rejects javascript:, mailto:, data:, relative
  if (SHORTENER_RE.test(url)) return false;
  return true;
}

/** Does the listing carry high-signal scam phrasing? */
export function findScamSignals(title: string, company: string, description: string): string[] {
  const haystack = `${title} ${company} ${description}`.toLowerCase();
  const found: string[] = [];
  for (const p of SCAM_PATTERNS) {
    // Negation-guarded patterns only fire OUTSIDE anti-scam warning
    // sentences ("we'll never ask you to purchase equipment") — real ATS
    // employers embed those warnings in their own JDs.
    if (NEGATION_GUARDED_PATTERNS.some((g) => g.source === p.re.source)) {
      if (appearsUnnegated(haystack, p.re)) found.push(p.reason);
      continue;
    }
    if (p.re.test(haystack)) found.push(p.reason);
  }
  return found;
}

/** Is this a placeholder / test listing, not a real opening? */
export function isPlaceholder(title: string, description: string): boolean {
  return PLACEHOLDER_RE.test(`${title} ${description}`.toLowerCase());
}

/** Full check: URL + scam phrases + placeholders. */
export function verifyListing(input: {
  title: string;
  company: string;
  description: string;
  applyUrl: string;
}): AuthenticityVerdict {
  const reasons: string[] = [];

  if (!isSafeApplyUrl(input.applyUrl)) {
    reasons.push(`apply url is not a safe http(s) link${input.applyUrl ? "" : " (empty)"}`);
  }
  reasons.push(...findScamSignals(input.title, input.company, input.description));
  if (isPlaceholder(input.title, input.description)) {
    reasons.push("looks like a placeholder/test listing");
  }

  return { ok: reasons.length === 0, reasons };
}
