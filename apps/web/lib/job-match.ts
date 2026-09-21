// Shared job-description ↔ CV keyword matching. Extracted from the editor's
// Job Target panel so the panel AND the Application Workspace score a CV against
// a job the same way (one source of truth). No API calls — a fast, free heuristic.

import type { CVData } from "@/types";

// Common words that carry no signal for keyword matching.
export const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","through","during","before","after","is",
  "are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","could","should","may","might","must","can","this","that",
  "these","those","you","we","they","your","our","their","its","not","as",
  "if","then","so","when","where","who","what","which","how","than","more",
  "all","any","each","few","most","other","some","such","no","nor","only",
  "own","same","too","very","just","because","while","also","both","he","she",
  "it","its","her","his","here","there","over","under","again","further",
  "once","new","work","experience","knowledge","skills","role","position",
  "team","company","business","good","great","strong","ability","looking",
  "seeking","join","help","support","using","use","used","well","across",
  "within","between","among","ensure","provide","drive","define","lead",
  "manage","build","create","understand","based","related","required","plus",
  "including","candidate","responsibilities","qualifications","preferred",
  // Generic filler that pollutes "Missing from your CV" lists (no signal):
  "don","won","cant","wont","dont","didnt","doesnt","isnt","arent","wasnt",
  "werent","havent","hasnt","hadnt","wouldnt","couldnt","shouldnt","thats",
  "whats","whos","lets","im","ive","youre","theyre","weve","youve","theyve",
  "one","two","three","kind","make","made","get","got","take","give","need",
  "needs","want","wants","like","way","ways","part","parts","thing","things",
  "something","anything","everything","nothing","someone","anyone","everyone",
  "time","times","day","days","week","weeks","month","months","year","years",
  "hour","hours","per","etc","e.g","i.e","much","many","lot","lots","going",
  "come","came","back","even","still","really","quite","sure","let",
  "market","markets","around","always","never","often","sometimes","able",
  // Swahili filler (the app's PRIMARY UI language) — grammatical glue and
  // generic nouns that carry no keyword signal. Mirrors the English list: if
  // the English counterpart is stopped ("work", "company", "skills"), the
  // Swahili one is too ("kazi", "kampuni", "ujuzi"). Two-letter connectors
  // (na, ya, wa, za, ni, si, tu…) are already excluded by the length>=3
  // filter. Real skills like "uongozi" (leadership), "mawasiliano"
  // (communication) or "usalama" (safety) are deliberately NOT here.
  "kwa", "pia", "kama", "lakini", "ingawa", "kwamba", "kisha", "halafu", "basi",
  "hivyo", "ndiyo", "ndio", "hapana", "katika", "kwenye", "ndani", "kati",
  "miongoni", "pamoja", "kuhusu", "kabla", "baada", "wakati", "hata", "vile",
  "zaidi", "sana", "kweli", "sasa", "hapa", "pale", "huko", "hii", "hizi",
  "hiyo", "hizo", "huu", "huo", "hawa", "huyu", "huyo", "ile", "zile", "wale",
  "kile", "yale", "wengine", "nyingine", "zingine", "wote", "zote", "yote",
  "vyote", "kila", "baadhi", "kidogo", "chache", "nyingi", "wengi", "mimi",
  "wewe", "yeye", "sisi", "nyinyi", "wao", "wangu", "wako", "wake", "wetu",
  "wenu", "yangu", "yako", "yake", "zangu", "zako", "zake", "nini", "nani",
  "wapi", "lini", "kwanini", "mbona", "vipi", "jinsi", "mara", "muda", "pindi",
  // Generic Swahili job-advert nouns (mirror the stopped English set):
  "kazi", "ajira", "mwajiri", "kampuni", "biashara", "timu", "ujuzi", "tajriba",
  "uzoefu", "jukumu", "majukumu", "nafasi", "uwezo", "sifa", "mahitaji",
  "elimu", "maelezo", "mwaka", "miaka", "siku", "wiki", "mwezi", "miezi", "saa", "dakika",
  "mzuri", "kubwa", "kutafuta", "kujiunga", "kusaidia", "kutumia", "kuhakikisha",
  "kutoa", "kuendesha", "kufafanua", "kuongoza", "kusimamia", "kujenga",
  "kuunda", "kuelewa", "kuhitajika", "mtahiniwa", "kuomba", "sio", "siyo",
  // Advert filler that reached the user as chips: "HAYAPO KWENYE WASIFU WAKO"
  // listed "least" and "grow" as if they were missing skills
  // (docs/QA-WEB-JOURNEYS-2026-09-20.md D11). Quantifiers, bare generic verbs
  // and adverb padding — never something an applicant would put on a CV.
  // Real skills stay: "sales", "customer", "budgeting", "region", "growth".
  "least", "grow", "grows", "growing", "grew", "prepare", "prepares", "preparing",
  "prepared", "include", "includes", "included", "various", "prior", "ideally",
  "typically", "relevant", "similar", "other", "others", "additional",
]);

// HTML / entity / URL leakage that must never count as a skill or keyword.
// Belt-and-suspenders on top of the tag/entity strip in extractTerms: a
// source may emit malformed markup (`&nbsp` without `;`, stray `amp`) that
// survives tokenization, and these words carry zero matching signal.
const MARKUP_TERMS = new Set([
  "div","span","class","href","http","https","www","com","html","htm","body",
  "style","script","css","ul","ol","li","br","strong","nbsp","amp","lt","gt",
  "quot","apos","table","tbody","thead","tr","td","th","font","img","src",
  "alt","aria","role","xml","json","svg","canvas","section","article",
  "header","footer","nav","main","aside","button","input","form","label",
  "select","option","textarea","iframe","video","audio","meta","link",
  "title","h1","h2","h3","h4","h5","h6","blockquote","code","pre","hr",
  "click","here","visit","read","more","apply","job","jobs","description",
]);

export function extractTerms(text: string): string[] {
  return [...new Set(
    (text || "")
      .toLowerCase()
      // Strip raw tags FIRST (including unterminated tag-like text at the
      // end of the string — sources truncate mid-tag), then entity
      // references (both encoded `<div>` and `&lt;div&gt;` must die before
      // tokenization — never leave "div", "class", "href", "http" behind as
      // pseudo-keywords).
      .replace(/<[/!a-zA-Z][^>]*>/g, " ")
      .replace(/<[a-z][^>]*$/gi, " ")
      .replace(/&[a-z]+;?|&#\d+;?|&#x[0-9a-f]+;?/gi, " ")
      // `+`, `#`, `.` and `/` are kept INSIDE a term (c++, c#, node.js, ci/cd)
      // but never at its edges: a sentence's punctuation used to survive as part
      // of the keyword, so the "hayapo kwenye wasifu wako" chips listed
      // "salaam." and "independently." — a user cannot tell a real keyword from
      // a spelling mistake (docs/QA-WEB-JOURNEYS-2026-09-20.md D11).
      .replace(/[^a-z0-9\s\+#./]/g, " ")
      .split(/\s+/)
      .map((w) => {
        // Sentence punctuation is never part of a keyword: "salaam." →
        // "salaam", "independently." → "independently", "node.js." → "node.js".
        let t = w.replace(/^[./]+/, "").replace(/[./]+$/, "");
        // A trailing "+"/"#" belongs to a LANGUAGE (c++, c#, g#), so it only
        // gets stripped when what remains still reads as a term on its own
        // ("react+" → "react", but "c++" stays "c++").
        t = t.replace(/[+#]+$/, (m) => (t.length - m.length >= 3 ? "" : m));
        return t;
      })
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w) && !MARKUP_TERMS.has(w)),
  )];
}

export function getCVTerms(data: CVData): Set<string> {
  const texts = [
    data.summary,
    ...data.skills.map((s) => s.name),
    ...data.experience.flatMap((e) => [e.position, e.company, e.description]),
    // Projects often carry a candidate's real skills — especially graduates
    // with little formal job history — so they must count toward the match.
    ...(data.projects ?? []).flatMap((p) => [p.name, p.role ?? "", p.description]),
    ...data.education.flatMap((e) => [e.degree, e.field, e.institution]),
    ...data.certifications.map((c) => c.name),
    data.personal.jobTitle ?? "",
  ];
  return new Set(extractTerms(texts.join(" ")));
}

export interface MatchResult {
  matched: string[];
  missing: string[];
  /** 0–100 coverage of the job's keywords by the CV. */
  score: number;
}

export function scoreTerms(jobTerms: string[], cvTerms: Set<string>): MatchResult {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const term of jobTerms) {
    const found = cvTerms.has(term) ||
      [...cvTerms].some((cv) => (cv.includes(term) || term.includes(cv)) && Math.min(cv.length, term.length) >= 4);
    if (found) matched.push(term);
    else missing.push(term);
  }
  return { matched, missing, score: jobTerms.length ? Math.round((matched.length / jobTerms.length) * 100) : 0 };
}

/** Convenience: score a CV's data against a raw job-description string. */
export function matchCvToJd(data: CVData, jobDescription: string): MatchResult {
  return scoreTerms(extractTerms(jobDescription), getCVTerms(data));
}

// ─── Job-description detection ───────────────────────────────────────────────
// P0 Fix 3: jobs.match / cv.tailor must run on a REAL job advert, never on a
// conversational sentence. A chat message treated as a "JD" produces a bogus
// 0% match card with the user's own words listed as missing keywords.

const JD_MARKERS = [
  // English job-advert markers
  "responsibilities", "requirements", "qualifications", "job description",
  "about the role", "about this role", "what you'll do", "what you will do",
  "we are looking for", "we're looking for", "the ideal candidate",
  "what we're looking for", "what we are looking for", "the role",
  "salary", "compensation", "benefits", "full-time", "full time",
  "years of experience", "degree in", "location:",
  "apply now", "how to apply", "key skills", "minimum qualifications",
  "we are hiring", "we're hiring", "now hiring", "we are seeking",
  "we're seeking", "join our team", "join the team", "job type:",
  "employment type:", "reports to:", "job opening", "we invite applications",
  // Swahili job-advert markers (colon/section forms — generic words like
  // "elimu" alone also appear in conversation, so require the section shape)
  "mahitaji", "maelezo ya kazi", "nafasi ya kazi", "tuma maombi",
  "jinsi ya kuomba", "uzoefu wa miaka", "kiwango cha mshahara",
  "elimu:", "sifa:", "wajibu:", "mahitaji:", "jukumu:",
  "tunatafuta", "tunaajiri", "nafasi wazi", "tunahitaji",
];

// Stems that, in combination, signal an advert even without section headers.
// English-only on purpose (Swahili conversational text would otherwise trip it).
const JD_SIGNAL_STEMS = [
  "responsibilit", "requirement", "qualif", "experience", "candidate",
  "salary", "hiring", "vacancy", "benefits", "degree in", "years of",
  "reporting to", "based in", "full-time", "part-time", "contract role",
];

/**
 * Does this text look like a real job description (as opposed to a
 * conversational sentence)? Requires enough length AND either an advert
 * marker, a bulleted list (pasted adverts use bullets), or several full
 * sentences — never a bare multi-line conversation.
 */
export function looksLikeJobDescription(text: string): boolean {
  const t = (text ?? "").trim();
  if (t.length < 60) return false;
  const low = t.toLowerCase();
  if (JD_MARKERS.some((m) => low.includes(m))) return true;
  // Structural: bulleted list — the shape of a pasted advert.
  const bulletLines = t.split(/\n+/).filter((l) => /^[-•*▪]\s*/.test(l.trim())).length;
  if (bulletLines >= 2) return true;
  // Keyword density: a real but unstructured posting still name-checks
  // several advert concepts. Conversational "I want a job" text does not.
  const signalHits = JD_SIGNAL_STEMS.filter((s) => low.includes(s)).length;
  if (signalHits >= 3) return true;
  // Single-paragraph blob: several full sentences.
  const sentences = t.split(/[.!?。]\s/).filter((s) => s.trim().length > 10);
  return sentences.length >= 3;
}

/**
 * Find the most recent user message in a thread that actually contains a job
 * description (pasted advert / attached link content). Returns "" when none.
 */
export function findLastJobInHistory(messages: Array<{ role: string; content: string }>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const content = m.content ?? "";
    // Attached link/file job postings carry the emoji label in `content` and
    // the real text in `apiContent` — but the server only sees `content`, so
    // also accept emoji-labelled attachments when their content is long.
    if (looksLikeJobDescription(content)) return content;
  }
  return "";
}
