/**
 * Cross-source canonical dedup — the same real opening appears on multiple
 * boards with different ids and slightly different wording. This module
 * collapses those into ONE canonical record and records which sources
 * corroborate the posting (multi-source corroboration is itself an
 * authenticity signal — a job listed by two independent boards is real).
 *
 * Strategy:
 *   1. PRIMARY key — normalized (company, title, location). Punctuation and
 *      case collapse, whitespace collapse. Exact match after normalization.
 *   2. FUZZY layer — near-identical titles: parentheticals stripped
 *      ("(m/f/d)", "(Remote)"), common format words removed, so
 *      "Senior React Developer" ≈ "Senior React Developer (Remote)".
 *      Company + location must STILL match exactly — we never merge two
 *      different openings at the same company by title alone.
 *
 * The winner of a collapsed group is the RICHEST record (longest
 * description — the best JD for matching/tailoring). Corroborating source
 * keys are attached so the DB row can record them.
 */
import type { NormalizedJob } from "./sources/types";

/** Letters, numbers, spaces only (Unicode-aware so Swahili/European chars survive). */
const PUNCT_RE = /[^\p{L}\p{N}\s]/gu;
const WS_RE = /\s+/g;

export function normalizeDedupText(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(PUNCT_RE, " ")
    .replace(WS_RE, " ")
    .trim();
}

/**
 * Format noise tokens that boards append inconsistently but carry NO job
 * meaning — safe to strip in the fuzzy layer. Anything else inside a
 * parenthetical (Senior/Associate, AI/Backend, Nordics/Italy) is REAL
 * signal and must never be removed: collapsing two different openings is
 * fabrication.
 */
const FORMAT_NOISE =
  /\b(m\/f\/d|w\/m\/d|d\/m\/w|all\s+genders|any\s+gender|remote|hybrid|on[- ]?site|full[- ]?time|part[- ]?time|contract|freelance|temporary|permanent)\b/gi;

/** Parenthetical + format noise stripped for the fuzzy title layer. */
export function fuzzyTitle(title: string): string {
  let t = title || "";
  // Remove parentheticals ONLY when they contain nothing but format noise:
  // "(m/f/d)", "(Remote)", "(all genders)" → stripped; "(AI)", "(Senior)",
  // "(Nordics)" → kept (real distinguishing signal).
  t = t.replace(/\(([^)]*)\)/g, (_m, inner: string) => {
    const cleaned = inner.replace(FORMAT_NOISE, " ").replace(/\s+/g, " ").trim();
    return cleaned === "" ? " " : `(${inner})`;
  });
  // Drop bare format words anywhere in the title.
  t = t.replace(FORMAT_NOISE, " ");
  // NOTE: no trailing company-suffix stripping. "— Acme" / "– Compliance"
  // suffixes are ambiguous (a company name OR a role qualifier like
  // "Nominee Director – Corporate Compliance"). Stripping them collapses
  // genuinely different openings — under-merging is SAFER than over-merging.
  // Company names live in the company field anyway; a title with a company
  // suffix simply won't fuzzy-collapse with a bare title. Conservative wins.
  return normalizeDedupText(t);
}

/** Canonical key for a job — the exact-match dedup identity. */
export function canonicalKey(j: { company: string; title: string; location: string }): string {
  const company = normalizeDedupText(j.company);
  const title = normalizeDedupText(j.title);
  const location = normalizeDedupText(j.location) || "remote";
  if (!company || !title) return "";
  return `${company}|${title}|${location}`;
}

/** Fuzzy key — same as canonical but with the fuzzy title (parentheticals out). */
export function fuzzyKey(j: { company: string; title: string; location: string }): string {
  const company = normalizeDedupText(j.company);
  const title = fuzzyTitle(j.title);
  const location = normalizeDedupText(j.location) || "remote";
  if (!company || !title) return "";
  return `${company}|${title}|${location}`;
}

export interface DedupeResult {
  /** One record per collapsed group — the richest version. */
  jobs: NormalizedJob[];
  /** canonicalKey → source keys that carried the same posting. */
  corroboration: Map<string, string[]>;
  /** How many duplicate postings were collapsed away. */
  collapsed: number;
  /** How many groups were corroborated by 2+ sources. */
  corroboratedGroups: number;
}

/**
 * Collapse a fetched batch into canonical records.
 *
 * Order matters: exact canonical key wins first; only when no exact key is
 * present do we try the fuzzy layer (so "Senior React Developer" and
 * "Senior React Developer (Remote)" at the same company+location collapse,
 * but a genuinely different title at the same company does NOT).
 */
export function dedupeJobs(jobs: NormalizedJob[]): DedupeResult {
  const corroboration = new Map<string, string[]>();
  const seenExact = new Map<string, NormalizedJob>();
  const seenFuzzy = new Map<string, NormalizedJob>();
  const out: NormalizedJob[] = [];
  let collapsed = 0;

  const recordCorroboration = (key: string, source: string) => {
    const list = corroboration.get(key) ?? [];
    if (!list.includes(source)) list.push(source);
    corroboration.set(key, list);
  };

  // Swap `oldRec` out of the output for the richer `newRec` and repoint EVERY
  // map entry that referenced the old record. A record can be reachable under
  // several keys (its exact key, its fuzzy key, and any re-seeded fuzzy key),
  // so a stale reference would make a later `out.indexOf(oldRec)` return -1
  // and the richer record would be SILENTLY DROPPED via `out[-1] = job` (a
  // non-element property — the posting vanishes from the feed entirely).
  const replaceWinner = (oldRec: NormalizedJob, newRec: NormalizedJob) => {
    const idx = out.indexOf(oldRec);
    if (idx === -1) return; // safety — maps are kept fresh, so this can't happen
    out[idx] = newRec;
    for (const [k, v] of seenExact) if (v === oldRec) seenExact.set(k, newRec);
    for (const [k, v] of seenFuzzy) if (v === oldRec) seenFuzzy.set(k, newRec);
  };

  for (const job of jobs) {
    const exact = canonicalKey(job);
    if (!exact) {
      // No company or title — cannot dedup; keep as-is (authenticity still filters).
      out.push(job);
      continue;
    }

    const existing = seenExact.get(exact);
    if (existing) {
      // Same posting from a different source (or the same source twice).
      collapsed += 1;
      recordCorroboration(exact, existing.source);
      recordCorroboration(exact, job.source);
      // Keep the richest description (best JD for matching/tailoring).
      if (job.description.length > existing.description.length) {
        replaceWinner(existing, job);
        // Re-seed the fuzzy map with the new winner so later fuzzy hits merge.
        const fk = fuzzyKey(job);
        if (!seenFuzzy.has(fk)) seenFuzzy.set(fk, job);
      }
      continue;
    }
    seenExact.set(exact, job);
    recordCorroboration(exact, job.source);

    // Fuzzy layer: only consulted when the exact key is new.
    const fuzzy = fuzzyKey(job);
    const fuzzyMatch = seenFuzzy.get(fuzzy);
    if (fuzzyMatch && fuzzyMatch !== job) {
      collapsed += 1;
      recordCorroboration(fuzzy, job.source);
      recordCorroboration(fuzzy, fuzzyMatch.source);
      if (job.description.length > fuzzyMatch.description.length) {
        replaceWinner(fuzzyMatch, job);
      }
      continue;
    }
    seenFuzzy.set(fuzzy, job);
    out.push(job);
  }

  // Count corroborated groups (2+ sources carried the same posting).
  let corroboratedGroups = 0;
  for (const sources of corroboration.values()) {
    if (sources.length >= 2) corroboratedGroups += 1;
  }

  return { jobs: out, corroboration, collapsed, corroboratedGroups };
}

/** Attach corroborating sources to a job row before upsert. */
export function corroboratingSources(
  job: NormalizedJob,
  corroboration: Map<string, string[]>
): string[] {
  const exact = canonicalKey(job);
  const fuzzy = fuzzyKey(job);
  const list = corroboration.get(exact) ?? corroboration.get(fuzzy) ?? [];
  return [...new Set([job.source, ...list])].sort();
}
