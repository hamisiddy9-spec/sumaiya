// Authentic-writing quality checks — deterministic, no AI, no DB.
//
// Recruiters read hundreds of CVs a day; clichés and buzzwords read as
// filler and keyword-stuffing reads as gaming the ATS. This engine scans the
// CV for three failure modes and suggests concrete fixes:
//
//   1. cliché   — overused empty phrases ("results-driven", "team player")
//   2. buzzword — inflated business-speak ("synergy", "cutting-edge")
//   3. stuffing — the same meaningful term repeated so often it looks
//                 artificially optimized for keyword scanners
//
// Every finding is a suggestion, never an auto-edit: the user decides.
// Section attribution makes the finding actionable inside the editor.

import type { CVData } from "@/types";

export type WritingIssueType = "cliche" | "buzzword" | "stuffing";

export interface WritingFinding {
  id: string;
  type: WritingIssueType;
  /** The offending phrase / term (original casing from the CV). */
  term: string;
  /** How many times it appeared. */
  count: number;
  /** Section where it was found: summary | experience | education | skills | all. */
  section: string;
  /** Concrete replacement or action. */
  suggestion: string;
}

export interface WritingReport {
  findings: WritingFinding[];
  /** 0–100, higher = more authentic writing. */
  score: number;
  hasIssues: boolean;
}

interface LexiconEntry {
  phrase: string;
  suggestion: string;
}

// Overused empty phrases — no concrete information behind them.
const CLICHES: LexiconEntry[] = [
  { phrase: "results-driven", suggestion: "Replace with the outcome you actually drove (e.g. \"cut load time 40%\")." },
  { phrase: "hard-working", suggestion: "Show the work: \"shipped X under deadline\" beats \"hard-working\"." },
  { phrase: "hard working", suggestion: "Show the work: \"shipped X under deadline\" beats \"hard working\"." },
  { phrase: "team player", suggestion: "Describe a collaboration: \"paired with 3 engineers to deliver X\"." },
  { phrase: "go-getter", suggestion: "Replace with an initiative you took on your own." },
  { phrase: "self-starter", suggestion: "Show it: \"started X unprompted\" instead of claiming it." },
  { phrase: "detail-oriented", suggestion: "Give proof: \"reviewed 200+ invoices with zero errors\"." },
  { phrase: "think outside the box", suggestion: "Name the creative solution, not the phrase." },
  { phrase: "outside the box", suggestion: "Name the creative solution, not the phrase." },
  { phrase: "proven track record", suggestion: "List the proof: numbers, projects, promotions." },
  { phrase: "hit the ground running", suggestion: "Say what you delivered in your first 90 days." },
  { phrase: "take ownership", suggestion: "Name what you owned and the result." },
  { phrase: "passionate about", suggestion: "Show it with a project or result, not the claim." },
  { phrase: "highly motivated", suggestion: "Demonstrate motivation through outcomes." },
  { phrase: "dynamic", suggestion: "\"Dynamic\" says nothing — describe the work." },
  { phrase: "innovative", suggestion: "Describe the innovation concretely (what, for whom, effect)." },
  { phrase: "world-class", suggestion: "Let results speak; this reads as hype." },
  { phrase: "best of breed", suggestion: "Replace with the concrete tool or method you used." },
  { phrase: "value-add", suggestion: "State the value: time saved, revenue, error reduction." },
  { phrase: "low-hanging fruit", suggestion: "Name the quick win you actually delivered." },
  { phrase: "win-win", suggestion: "Describe both sides of the outcome concretely." },
  { phrase: "move the needle", suggestion: "Give the metric the needle moved." },
  { phrase: "game-changer", suggestion: "Describe what changed and by how much." },
  { phrase: "rockstar", suggestion: "Replace with the skill or achievement." },
  { phrase: "ninja", suggestion: "Replace with the skill or achievement." },
  { phrase: "guru", suggestion: "Replace with the skill or achievement." },
  { phrase: "circle back", suggestion: "Plain language: \"followed up\"." },
  { phrase: "touch base", suggestion: "Plain language: \"checked in\"." },
  { phrase: "blue sky thinking", suggestion: "Replace with the idea itself." },
];

// Inflated business-speak — weakens otherwise good writing.
const BUZZWORDS: LexiconEntry[] = [
  { phrase: "synergy", suggestion: "Replace with the concrete collaboration or combined result." },
  { phrase: "leverage", suggestion: "Say \"used\" or \"built on\" — leverage is filler." },
  { phrase: "utilize", suggestion: "Say \"use\"." },
  { phrase: "proactive", suggestion: "Show the action you took before being asked." },
  { phrase: "strategic", suggestion: "Describe the strategy, not the adjective." },
  { phrase: "robust", suggestion: "Quantify: uptime, scale, load." },
  { phrase: "scalable", suggestion: "Give the scale: users, requests, growth." },
  { phrase: "cutting-edge", suggestion: "Name the actual technology." },
  { phrase: "state-of-the-art", suggestion: "Name the actual technology." },
  { phrase: "next-gen", suggestion: "Name the generation: what replaced what." },
  { phrase: "disruptive", suggestion: "Describe the disruption with facts." },
  { phrase: "best-in-class", suggestion: "Replace with the benchmark you met or beat." },
  { phrase: "empower", suggestion: "Say what people could now do." },
  { phrase: "holistic", suggestion: "Be specific about the scope." },
  { phrase: "streamline", suggestion: "Say \"simplified\" and give the before/after." },
  { phrase: "optimize", suggestion: "Say what you optimized and by how much." },
  { phrase: "facilitate", suggestion: "Say what you made happen." },
  { phrase: "oversee", suggestion: "Say \"managed\" — oversee is vague." },
  { phrase: "liaise", suggestion: "Say \"coordinated with\"." },
  { phrase: "deep dive", suggestion: "Describe the analysis itself." },
  { phrase: "drill down", suggestion: "Describe the analysis itself." },
  { phrase: "alignment", suggestion: "Say what aligned with what." },
  { phrase: "bandwidth", suggestion: "Say \"capacity\" or \"time\"." },
  { phrase: "circle", suggestion: "Say \"group\" or \"team\"." },
];

const MIN_STUFFING_COUNT = 5;
const STUFFING_MIN_LEN = 4;

interface SectionText {
  section: string;
  text: string;
}

function cvSections(data: CVData): SectionText[] {
  const out: SectionText[] = [];
  if (data.summary?.trim()) out.push({ section: "summary", text: data.summary });
  const exp = (data.experience ?? [])
    .map((e) => `${e.position} ${e.company} ${e.description}`)
    .filter((t) => t.trim());
  if (exp.length) out.push({ section: "experience", text: exp.join("\n") });
  const edu = (data.education ?? [])
    .map((e) => `${e.degree} ${e.field} ${e.institution}`)
    .filter((t) => t.trim());
  if (edu.length) out.push({ section: "education", text: edu.join("\n") });
  if ((data.skills ?? []).length) out.push({ section: "skills", text: (data.skills ?? []).map((s) => s.name).join(", ") });
  return out;
}

function matchLexicon(text: string, entries: LexiconEntry[], type: WritingIssueType): WritingFinding[] {
  const findings: WritingFinding[] = [];
  const lower = text.toLowerCase();
  for (const entry of entries) {
    const re = new RegExp(`\\b${entry.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    let m: RegExpExecArray | null;
    let count = 0;
    let lastMatch = "";
    while ((m = re.exec(lower)) !== null) {
      count += 1;
      lastMatch = m[0];
    }
    if (count > 0) {
      findings.push({
        id: `${type}:${entry.phrase}`,
        type,
        term: lastMatch || entry.phrase,
        count,
        section: "all",
        suggestion: entry.suggestion,
      });
    }
  }
  return findings;
}

function findStuffing(sections: SectionText[], fullName: string): WritingFinding[] {
  const counts = new Map<string, { count: number; section: string }>();
  const nameWords = new Set((fullName || "").toLowerCase().split(/\s+/).filter(Boolean));
  for (const { section, text } of sections) {
    const words = text.toLowerCase().match(/[a-z0-9+#./-]{4,}/g) ?? [];
    for (const w of words) {
      if (nameWords.has(w)) continue;
      const cur = counts.get(w);
      if (cur) {
        cur.count += 1;
      } else {
        counts.set(w, { count: 1, section });
      }
    }
  }
  const findings: WritingFinding[] = [];
  for (const [term, { count, section }] of counts) {
    if (count >= MIN_STUFFING_COUNT && term.length >= STUFFING_MIN_LEN) {
      findings.push({
        id: `stuffing:${term}`,
        type: "stuffing",
        term,
        count,
        section,
        suggestion: `"${term}" appears ${count} times — keep the strongest mention, remove the repeats.`,
      });
    }
  }
  // Most egregious first.
  findings.sort((a, b) => b.count - a.count);
  return findings.slice(0, 8);
}

export function checkAuthenticWriting(data: CVData): WritingReport {
  const sections = cvSections(data);
  const allText = sections.map((s) => s.text).join("\n");

  const cliches = matchLexicon(allText, CLICHES, "cliche");
  const buzzwords = matchLexicon(allText, BUZZWORDS, "buzzword");
  const stuffing = findStuffing(sections, data.personal?.fullName ?? "");

  const findings = [...cliches, ...buzzwords, ...stuffing];

  let score = 100;
  for (const f of findings) {
    score -= f.type === "cliche" ? 6 : f.type === "buzzword" ? 5 : 4;
  }
  score = Math.max(0, Math.min(100, score));

  return { findings, score, hasIssues: findings.length > 0 };
}
