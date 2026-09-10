/**
 * ATS readiness analysis — pure, deterministic, no AI, no network.
 * Ported from the web app's lib/ats-score.ts and adapted to the native CVData
 * shape (personalInfo, experience[].title, string skill levels, keyAchievements).
 *
 * Two analyses:
 *   analyzeCv(data)     — structured checks against the CV object (score + fixes)
 *   matchJd(data, jd)   — keyword overlap with a pasted job description
 */
import type { CVData } from "@sumaiya/types";

export type AtsCategory = "parsing" | "relevance" | "impact" | "content";

export interface AtsCheck {
  id: string;
  label: string;
  pass: boolean;
  weight: number;
  severity: "pass" | "warn" | "fail";
  category: AtsCategory;
  fix: string;
}

const ACTION_VERBS =
  /\b(led|built|managed|created|developed|designed|launched|increased|reduced|improved|delivered|coordinated|implemented|achieved|drove|grew|saved|streamlined|trained|negotiated|generated|boosted|spearheaded|oversaw|expanded|exceeded|secured|supervised|mentored|automated)\b/i;
const ACTION_VERBS_SW =
  /\b(niliongoza|nilijenga|niliunda|nilibuni|niliendeleza|nilisimamia|nilizindua|niliongeza|nilipunguza|niliboresha|nilifikisha|nilitekeleza|nilianzisha|nilikuza|niliokoa|nilifundisha|niliratibu|nilihudumia|nilishinda|nilipanga)\b/i;
const PASSIVE_RE =
  /\b(was|were|am|is|are)\s+(responsible for|in charge of|involved in|tasked with|assigned to|part of)\b/i;
const WEAK_VERB_RE =
  /\b(worked on|helped with|assisted with|handled|dealt with|worked with)\b/i;

/** CVs from the API or older local records can be missing arrays — never let a
 *  malformed CV throw inside a pure analyzer. */
function safe(data: CVData): CVData {
  return {
    personalInfo: data.personalInfo ?? { fullName: "", email: "", phone: "", location: "" },
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    summary: data.summary ?? "",
  };
}

function impactLines(data: CVData): string[] {
  return data.experience.flatMap((e) => [
    e.description ?? "",
    ...(Array.isArray(e.keyAchievements) ? e.keyAchievements : []),
  ]);
}

export function analyzeCv(raw: CVData, sw = false): AtsCheck[] {
  const data = safe(raw);
  const L = (en: string, s: string) => (sw ? s : en);
  const p = data.personalInfo;
  const hasContact = !!p.email?.trim() && !!p.phone?.trim() && !!p.location?.trim();
  const hasSummary = (data.summary ?? "").trim().length >= 60;
  const hasPhoto = !!p.profilePhoto;
  const skillCount = data.skills.length;
  const expCount = data.experience.length;
  const eduCount = data.education.length;
  const lines = impactLines(data);
  const anyImpact = lines.some((d) => d.trim().length > 0);
  const hasActionVerbs = lines.some((d) => ACTION_VERBS.test(d) || ACTION_VERBS_SW.test(d));
  const hasQuantified = lines.some((d) => /\d/.test(d) || /\b(percent|asilimia)\b/i.test(d));
  const datesConsistent = data.experience.every((e) => !e.startDate || /^\d{4}-\d{2}$/.test(e.startDate));
  const descLengths = data.experience.map((e) => (e.description ?? "").trim().length);
  const descOk = descLengths.every((l) => l === 0 || (l >= 60 && l <= 600));
  const hasHeadline = !!p.headline?.trim();

  const mk = (
    id: string,
    label: string,
    pass: boolean,
    weight: number,
    category: AtsCategory,
    fix: string,
    warnNotFail = false,
  ): AtsCheck => ({
    id,
    label,
    pass,
    weight,
    category,
    fix,
    severity: pass ? "pass" : warnNotFail ? "warn" : "fail",
  });

  return [
    mk("contact", L("Complete contact info", "Taarifa kamili za mawasiliano"), hasContact, 10, "parsing",
      L("Add your email, phone and city to the personal section — ATS needs all three.",
        "Ongeza barua pepe, simu na mji kwenye sehemu ya maelezo binafsi — ATS huhitaji vyote.")),
    mk("summary", L("Professional summary (60+ chars)", "Muhtasari (herufi 60+)"), hasSummary, 12, "content",
      L("Write 2–3 sentences: who you are, your strongest skill, the roles you target.",
        "Andika sentensi 2–3: wewe ni nani, ujuzi wako mkubwa, kazi unazolenga.")),
    mk("photo", L("No profile photo", "Hakuna picha ya wasifu"), !hasPhoto, 8, "parsing",
      L("Remove the photo — many ATS systems reject or ignore CVs with images.",
        "Ondoa picha — mifumo mingi ya ATS hukataa au haisomi CV zenye picha."), true),
    mk("skills", L("8+ skills listed", "Ujuzi 8+"), skillCount >= 8, 15, "relevance",
      L(`You have ${skillCount} skills. Aim for 8–15 that match your target roles.`,
        `Una ujuzi ${skillCount}. Lenga 8–15 unaoendana na kazi unazolenga.`), skillCount >= 4),
    mk("experience", L("Work experience entries", "Uzoefu wa kazi"), expCount >= 1, 12, "content",
      L("Add at least one entry — a job, attachment or internship counts.",
        "Ongeza angalau uzoefu mmoja — kazi, mafunzo au internship inahesabika.")),
    mk("education", L("Education listed", "Elimu imeorodheshwa"), eduCount >= 1, 5, "content",
      L("Add your highest qualification, school and year.",
        "Ongeza sifa yako ya juu, shule na mwaka."), true),
    mk("action_verbs", L("Action verbs in descriptions", "Vitenzi vya vitendo"), hasActionVerbs, 13, "impact",
      L("Start each bullet with a strong verb (Led, Built, Increased…), not 'responsible for'.",
        "Anza kila kipengele kwa kitenzi kikali (Niliongoza, Nilijenga…), si 'nilikuwa na jukumu'."), !anyImpact),
    mk("quantified", L("Achievements backed by numbers", "Mafanikio yenye namba"), hasQuantified, 12, "impact",
      L("Add a measurable result to at least one bullet — a number, percentage or amount.",
        "Ongeza matokeo yanayopimika kwenye angalau kipengele — namba, asilimia au kiasi."), !anyImpact),
    mk("desc_length", L("Descriptions well-sized (60–600)", "Maelezo yenye urefu sahihi"), descOk, 8, "content",
      L("Trim or expand each job description to 60–600 characters.",
        "Fupisha au ongeza maelezo hadi herufi 60–600."), true),
    mk("dates", L("Consistent date format (YYYY-MM)", "Muundo thabiti wa tarehe"), datesConsistent, 8, "parsing",
      L("Use YYYY-MM for every start/end date so ATS parses them.",
        "Tumia YYYY-MM kwa kila tarehe ili ATS isome vizuri."), true),
    mk("headline", L("Headline / target title", "Kichwa / cheo lengwa"), hasHeadline, 7, "relevance",
      L("Add a headline under your name matching the roles you apply for.",
        "Ongeza kichwa chini ya jina lako kinacholingana na kazi unazoomba."), true),
  ];
}

export function atsScore(checks: AtsCheck[]): number {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  return total ? Math.round((earned / total) * 100) : 0;
}

export interface AtsPillar {
  key: AtsCategory;
  label: string;
  score: number;
  checks: AtsCheck[];
}

export function atsBreakdown(checks: AtsCheck[], sw = false): AtsPillar[] {
  const meta: Record<AtsCategory, string> = {
    parsing: sw ? "Usomaji" : "Parsing",
    relevance: sw ? "Ulinganifu wa kazi" : "Job relevance",
    impact: sw ? "Athari" : "Impact",
    content: sw ? "Maudhui" : "Content",
  };
  return (["parsing", "relevance", "impact", "content"] as AtsCategory[]).map((key) => {
    const pillarChecks = checks.filter((c) => c.category === key);
    return { key, label: meta[key], score: atsScore(pillarChecks), checks: pillarChecks };
  });
}

// ── Line-level findings ──────────────────────────────────────────────────────
export interface LineFinding {
  id: string;
  where: string;
  line: string;
  issue: string;
  fix: string;
  severity: "warn" | "fail";
}

export function lineFindings(raw: CVData, sw = false): LineFinding[] {
  const data = safe(raw);
  const L = (en: string, s: string) => (sw ? s : en);
  const out: LineFinding[] = [];
  for (const e of data.experience) {
    const where = e.company || e.title || L("experience", "uzoefu");
    const bullets = (e.description ?? "")
      .split("\n")
      .map((b) => b.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    bullets.forEach((line, i) => {
      const id = `${e.id}-${i}`;
      if (PASSIVE_RE.test(line))
        out.push({ id, where, line, severity: "fail",
          issue: L("Passive phrasing", "Maneno ya kutendeshwa"),
          fix: L("Rewrite starting with a verb: Led, Built, Delivered…", "Andika upya kuanzia kitenzi: Niliongoza, Nilijenga…") });
      else if (WEAK_VERB_RE.test(line))
        out.push({ id, where, line, severity: "warn",
          issue: L("Weak verb", "Kitenzi dhaifu"),
          fix: L("Swap for a precise verb + what you produced.", "Badilisha kwa kitenzi kamili + ulichokitoa.") });
      if (!/\d/.test(line) && line.length > 20)
        out.push({ id: id + "-n", where, line, severity: "warn",
          issue: L("No measurable result", "Hakuna matokeo yanayopimika"),
          fix: L("Add one true number, percentage or amount.", "Ongeza namba, asilimia au kiasi cha kweli.") });
      if (line.length > 240)
        out.push({ id: id + "-l", where, line, severity: "warn",
          issue: L("Bullet too long", "Kipengele kirefu sana"),
          fix: L("Split into two bullets, each with its own verb + result.", "Gawanya katika vipengele viwili.") });
    });
  }
  return out;
}

// ── Job-description keyword match ─────────────────────────────────────────────
const STOP = new Set(
  ("a an the and or but if then else for to of in on at by with from as is are be was were been being this that these those we you they i he she it our your their his her its will shall can may must should would could have has had do does did not no yes about into over under out up down off above below more most less least very just also than too so such only own same each any all both few other some more work role team job company position candidate experience skills ability strong excellent good great years year new using use used help required requirements responsibilities responsible")
    .split(/\s+/),
);

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) ?? []).filter((w) => !STOP.has(w));
}

/** Crude stem so "managing" / "managed" / "manages" collapse to one form. */
function stem(w: string): string {
  return w
    .replace(/(?:ing|ed|es|s)$/i, "")
    .replace(/(.)\1$/, "$1"); // "manag" from "managg" edge
}

/** Single words + the 2-word phrases inside each clause (never across
 *  punctuation — commas separate list items that shouldn't pair up). */
function phrases(s: string): string[] {
  const out: string[] = [];
  for (const clause of s.toLowerCase().split(/[.,;:!?()/\n]+/)) {
    const words = (clause.match(/[a-z][a-z+#]{1,}/g) ?? []);
    for (let i = 0; i < words.length; i++) {
      const a = words[i];
      if (!STOP.has(a) && a.length >= 3) out.push(a);
      const b = words[i + 1];
      if (b && !STOP.has(a) && !STOP.has(b) && a.length >= 3 && b.length >= 3) {
        out.push(`${a} ${b}`);
      }
    }
  }
  return out;
}

export interface JdMatch {
  score: number; // 0-100
  matched: string[];
  missing: string[];
}

export function matchJd(raw: CVData, jd: string): JdMatch {
  const data = safe(raw);
  const cvText = [
    data.personalInfo.headline ?? "",
    data.summary ?? "",
    ...data.skills.map((s) => s.name),
    ...data.experience.flatMap((e) => [e.title, e.description, ...(Array.isArray(e.keyAchievements) ? e.keyAchievements : [])]),
    ...data.education.map((e) => `${e.degree} ${e.field}`),
  ]
    .join(" ")
    .toLowerCase();

  const cvStems = new Set(tokens(cvText).map(stem));

  // Rank JD terms (single words + 2-word phrases) by frequency; a phrase is
  // worth more than the words it contains.
  const freq = new Map<string, number>();
  for (const p of phrases(jd)) freq.set(p, (freq.get(p) ?? 0) + (p.includes(" ") ? 2 : 1));
  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
  // Keep the strongest single words and a few of the strongest phrases.
  const singles = ranked.filter((w) => !w.includes(" ")).slice(0, 20);
  const phrasesTop = ranked.filter((w) => w.includes(" ")).slice(0, 6);
  const keywords = [...singles, ...phrasesTop];

  const hit = (k: string) =>
    k.includes(" ")
      ? cvText.includes(k) || k.split(" ").every((w) => cvStems.has(stem(w)))
      : cvText.includes(k) || cvStems.has(stem(k));

  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of keywords) (hit(k) ? matched : missing).push(k);

  const score = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
  return { score, matched, missing: missing.slice(0, 12) };
}
