// ATS readiness analysis — pure, deterministic, no AI and no React. Extracted
// from the editor's ATS panel so the same checks power both the editor panel
// and the conversational assistant's inline ATS card (one source of truth).

import type { CVData } from "@/types";

export type AtsCategory = "parsing" | "relevance" | "impact" | "content";

export interface AtsCheck {
  id: string;
  label: string;
  pass: boolean;
  weight: number;
  tip: string;
  severity: "pass" | "warn" | "fail";
  /** Which pillar this check belongs to (explainable breakdown). */
  category: AtsCategory;
  /** Where the problem occurs — "personal", "summary", or an entry id. */
  location: string;
  /** The suggested fix, phrased for the user. */
  fix: string;
  /** Whether the fix is grounded purely in facts already on the CV. */
  evidenceBacked: boolean;
  /** Whether this fix can be applied automatically (user-approved only). */
  autoFixable: boolean;
}

export function analyzeCv(data: CVData, sw: boolean): AtsCheck[] {
  const L = (en: string, s: string) => (sw ? s : en);
  const hasEmail = !!data.personal.email?.trim();
  const hasPhone = !!data.personal.phone?.trim();
  const hasLocation = !!data.personal.location?.trim();
  const hasSummary = data.summary.trim().length >= 60;
  const hasPhoto = !!data.personal.photo;
  const skillCount = data.skills.length;
  const expCount = data.experience.length;
  // Impact content is drawn from experience AND projects — a graduate's projects
  // often carry their strongest, most quantified work, so they count too.
  const impactText = [
    ...data.experience.map(e => e.description),
    ...(data.projects ?? []).map(p => p.description),
  ];
  const hasImpactContent = impactText.some(d => (d ?? "").trim().length > 0);
  // Bilingual: an English-only regex unfairly failed every Swahili-written CV.
  const hasActionVerbs = impactText.some(d =>
    /\b(led|built|managed|created|developed|designed|launched|increased|reduced|improved|delivered|coordinated|implemented|achieved|drove|grew|saved|streamlined|trained|negotiated|generated|boosted|spearheaded|oversaw|expanded|exceeded|secured|supervised|mentored|automated)\b/i.test(d) ||
    /\b(niliongoza|nilijenga|niliunda|nilibuni|niliendeleza|nilisimamia|nilizindua|niliongeza|nilipunguza|niliboresha|nilifikisha|nilitekeleza|nilianzisha|nilikuza|niliokoa|nilifundisha|niliratibu|nilihudumia|nilishinda|nilipanga)\b/i.test(d)
  );
  // Quantified impact — numbers, percentages or amounts in a bullet. The single
  // strongest recruiter/ATS signal, and previously unchecked.
  const hasQuantified = impactText.some(d =>
    /\d/.test(d) || /\b(percent|asilimia)\b/i.test(d)
  );
  const hasLinkedIn = !!data.personal.linkedin?.trim();
  const datesConsistent = data.experience.every(e =>
    !e.startDate || /^\d{4}-\d{2}$/.test(e.startDate)
  );
  const descLengths = data.experience.map(e => e.description.trim().length);
  const descOk = descLengths.every(l => l === 0 || (l >= 60 && l <= 600));

  return [
    {
      id: "contact",
      label: L("Complete contact info", "Taarifa kamili za mawasiliano"),
      pass: hasEmail && hasPhone && hasLocation,
      weight: 10,
      tip: L("Add your email, phone, and location — ATS requires all three.", "Ongeza barua pepe, simu na eneo — ATS huhitaji vyote vitatu."),
      severity: hasEmail && hasPhone && hasLocation ? "pass" : "fail",
      category: "parsing",
      location: "personal",
      fix: L("Add your email, phone and city/location to the personal section.", "Ongeza barua pepe, simu na mji/eneo kwenye sehemu ya maelezo binafsi."),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "summary",
      label: L("Professional summary (60+ chars)", "Muhtasari mfupi (herufi 60+)"),
      pass: hasSummary,
      weight: 12,
      tip: L("Write a 2-3 sentence summary. ATS uses it for keyword matching.", "Andika muhtasari wa sentensi 2-3. ATS huutumia kulinganisha maneno muhimu."),
      severity: hasSummary ? "pass" : "fail",
      category: "content",
      location: "summary",
      fix: L("Write 2–3 sentences: who you are, your strongest skill, and the roles you target.", "Andika sentensi 2–3: wewe ni nani, ujuzi wako mkubwa, na kazi unazolenga."),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "photo",
      label: L("No profile photo", "Hakuna picha ya wasifu"),
      pass: !hasPhoto,
      weight: 10,
      tip: L("Photo detected. Remove it for US/UK tech roles — ATS often rejects or ignores photos.", "Umeweka picha. Iondoe kwa kazi za US/UK — mifumo mingi hukataa au haisomi picha."),
      severity: hasPhoto ? "warn" : "pass",
      category: "parsing",
      location: "personal",
      fix: L("Remove the photo from the personal section for ATS-friendly parsing.", "Ondoa picha kwenye sehemu ya maelezo binafsi ili ATS isome vizuri."),
      evidenceBacked: true,
      autoFixable: true,
    },
    {
      id: "skills",
      label: L("8+ skills listed", "Ujuzi 8+ umeorodheshwa"),
      pass: skillCount >= 8,
      weight: 15,
      tip: L(`Only ${skillCount} skills. Add more to improve keyword matching (aim for 8–15).`, `Ujuzi ${skillCount} tu. Ongeza zaidi kuboresha ulinganishaji (lenga 8–15).`),
      severity: skillCount >= 8 ? "pass" : skillCount >= 4 ? "warn" : "fail",
      category: "relevance",
      location: "skills",
      fix: L(`You have ${skillCount} skills. Aim for 8–15 that match your target roles.`, `Una ujuzi ${skillCount}. Lenga 8–15 unaoendana na kazi unazolenga.`),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "experience",
      label: L("Work experience entries", "Uzoefu wa kazi"),
      pass: expCount >= 1,
      weight: 12,
      tip: L("No experience entries. Add your work history.", "Hakuna uzoefu. Ongeza historia yako ya kazi."),
      severity: expCount >= 1 ? "pass" : "fail",
      category: "content",
      location: "experience",
      fix: L("Add at least one experience entry (a job, attachment or internship counts).", "Ongeza angalau uzoefu mmoja (kazi, mafunzo ya kazini au internship inahesabika)."),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "action_verbs",
      label: L("Action verbs in descriptions", "Maneno ya vitendo katika maelezo"),
      pass: hasActionVerbs,
      weight: 13,
      tip: L("Start bullet points with verbs: Led, Built, Managed, Increased, Delivered...", "Anza kila kipengele kwa kitenzi: Niliongoza, Nilijenga, Nilisimamia, Niliongeza..."),
      severity: hasActionVerbs ? "pass" : !hasImpactContent ? "warn" : "fail",
      category: "impact",
      location: "experience",
      fix: L("Start each bullet with a strong verb (Led, Built, Increased…) instead of 'responsible for'.", "Anza kila kipengele kwa kitenzi kikali (Niliongoza, Nilijenga, Niliongeza…) badala ya 'nilikuwa na jukumu la'."),
      evidenceBacked: true,
      autoFixable: false,
    },
    {
      id: "quantified",
      label: L("Achievements backed by numbers", "Mafanikio yaliyoungwa mkono na namba"),
      pass: hasQuantified,
      weight: 12,
      tip: L("Add measurable results — amounts, percentages, counts (e.g. \"increased sales by 30%\").", "Ongeza matokeo yanayopimika — kiasi, asilimia, idadi (mf. \"niliongeza mauzo kwa 30%\")."),
      severity: hasQuantified ? "pass" : !hasImpactContent ? "warn" : "fail",
      category: "impact",
      location: "experience",
      fix: L("Add a measurable result to at least one bullet — a number, percentage or amount.", "Ongeza matokeo yanayopimika kwenye angalau kipengele kimoja — namba, asilimia au kiasi."),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "desc_length",
      label: L("Descriptions well-sized (60–600 chars)", "Maelezo yenye urefu sahihi (herufi 60–600)"),
      pass: descOk,
      weight: 8,
      tip: L("Keep each job description between 60–600 characters for optimal ATS parsing.", "Weka kila maelezo ya kazi kati ya herufi 60–600 kwa usomaji bora wa ATS."),
      severity: descOk ? "pass" : "warn",
      category: "content",
      location: "experience",
      fix: L("Trim or expand descriptions to 60–600 characters each.", "Fupisha au ongeza maelezo hadi herufi 60–600 kila moja."),
      evidenceBacked: true,
      autoFixable: false,
    },
    {
      id: "dates",
      label: L("Consistent date format (YYYY-MM)", "Muundo thabiti wa tarehe (YYYY-MM)"),
      pass: datesConsistent,
      weight: 8,
      tip: L("Use consistent YYYY-MM date format across all entries.", "Tumia muundo thabiti wa tarehe YYYY-MM kila mahali ulipoandika."),
      severity: datesConsistent ? "pass" : "warn",
      category: "parsing",
      location: "experience",
      fix: L("Use YYYY-MM for every start/end date so ATS parses them correctly.", "Tumia YYYY-MM kwa kila tarehe ya kuanza/kuisha ili ATS isome vizuri."),
      evidenceBacked: true,
      autoFixable: false,
    },
    {
      id: "linkedin",
      label: L("LinkedIn URL included", "Kiungo cha LinkedIn kimewekwa"),
      pass: hasLinkedIn,
      weight: 7,
      tip: L("Add your LinkedIn URL — many ATS systems cross-reference it.", "Ongeza kiungo chako cha LinkedIn — mifumo mingi ya ATS huirejelea."),
      severity: hasLinkedIn ? "pass" : "warn",
      category: "parsing",
      location: "personal",
      fix: L("Add your LinkedIn profile URL to the personal section.", "Ongeza kiungo cha LinkedIn yako kwenye sehemu ya maelezo binafsi."),
      evidenceBacked: false,
      autoFixable: false,
    },
    {
      id: "job_title",
      label: L("Job title on CV", "Cheo cha kazi kwenye CV"),
      pass: !!data.personal.jobTitle?.trim(),
      weight: 5,
      tip: L("Add a job title that matches the roles you're applying for.", "Ongeza cheo cha kazi kinacholingana na nafasi unazoomba."),
      severity: data.personal.jobTitle?.trim() ? "pass" : "warn",
      category: "relevance",
      location: "personal",
      fix: L("Add the job title you're targeting under your name.", "Ongeza cheo cha kazi unacholenga chini ya jina lako."),
      evidenceBacked: false,
      autoFixable: false,
    },
  ];
}

/** Overall 0–100 ATS readiness score from the weighted checks. */
export function atsScore(checks: AtsCheck[]): number {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = checks.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  return totalWeight ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

// ─── Explainable breakdown ───────────────────────────────────────────────────
// Groups the checks into the four pillars a recruiter actually evaluates, so
// the user sees WHERE they're strong and WHERE the points are lost — not just
// a number. Each finding explains what, why, where, and the evidence-backed fix.

export interface AtsPillar {
  key: AtsCategory;
  label: string;
  swLabel: string;
  score: number;
  checks: AtsCheck[];
}

export function atsBreakdown(checks: AtsCheck[], sw: boolean): AtsPillar[] {
  const pillars: AtsCategory[] = ["parsing", "relevance", "impact", "content"];
  const meta: Record<AtsCategory, { label: string; swLabel: string }> = {
    parsing: { label: "Parsing", swLabel: "Usomaji" },
    relevance: { label: "Job Relevance", swLabel: "Ulinganifu wa Kazi" },
    impact: { label: "Impact", swLabel: "Athari" },
    content: { label: "Content", swLabel: "Maudhui" },
  };
  return pillars.map((key) => {
    const pillarChecks = checks.filter((c) => c.category === key);
    return {
      key,
      ...meta[key],
      score: atsScore(pillarChecks),
      checks: pillarChecks,
    };
  });
}

// ─── Line-level findings (Resume Worded-style) ───────────────────────────────
// Drills into each experience entry's bullets and reports the concrete lines
// that hurt: passive phrasing, missing numbers, over-long bullets, weak verbs,
// repeated openers. Every finding says what's wrong, why it matters, where it
// occurs, and the fix — plus whether the fix is evidence-backed (grounded in
// facts already on the CV) so AutoFix never fabricates.

export interface LineFinding {
  id: string;
  entryId: string;
  company: string;
  position: string;
  line: string;
  issue: string;
  why: string;
  fix: string;
  evidenceBacked: boolean;
  autoFixable: boolean;
  severity: "warn" | "fail";
}

const PASSIVE_RE = /\b(was|were|am|is|are)\s+(responsible for|in charge of|involved in|tasked with|assigned to|part of)\b/i;
const WEAK_VERB_RE = /\b(worked on|helped with|assisted with|did|made|got|handled|dealt with|worked with)\b/i;

export function lineFindings(data: CVData, sw: boolean): LineFinding[] {
  const findings: LineFinding[] = [];
  const L = (en: string, s: string) => (sw ? s : en);
  const openers = new Map<string, number>();

  for (const entry of data.experience) {
    const bullets = entry.description
      .split("\n")
      .map((b) => b.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    const label = entry.company || entry.position || "experience";

    bullets.forEach((bullet, idx) => {
      const id = `${entry.id}-${idx}`;
      const firstWord = (bullet.split(/\s+/)[0] ?? "").toLowerCase();

      // Passive "responsible for" phrasing — the single most common ATS weakness.
      if (PASSIVE_RE.test(bullet)) {
        findings.push({
          id, entryId: entry.id, company: entry.company, position: entry.position, line: bullet,
          issue: L("Passive phrasing", "Maneno ya kutendesha"),
          why: L("ATS and recruiters scan for action verbs; 'responsible for' says what you owned, not what you did.", "ATS na waajiri hutafuta vitendo; 'nilikuwa na jukumu la' husema ulikuwa na nini, si ulichofanya."),
          fix: L("Rewrite starting with a strong verb: 'Led', 'Built', 'Delivered'…", "Andika upya kuanzia na kitenzi: 'Niliongoza', 'Nilijenga', 'Nilifikisha'…"),
          evidenceBacked: true, autoFixable: false, severity: "fail",
        });
      }
      // Weak verbs.
      if (WEAK_VERB_RE.test(bullet)) {
        findings.push({
          id, entryId: entry.id, company: entry.company, position: entry.position, line: bullet,
          issue: L("Weak verb", "Kitenzi dhaifu"),
          why: L("'Worked on'/'helped with' carry no signal — a recruiter can't tell your contribution.", "'Nilifanyia kazi'/'nimesaidia' haisemi chochote — mwajiri hawezi kujua mchango wako."),
          fix: L("Swap for a precise verb + what you produced (Built, Launched, Increased…).", "Badilisha kwa kitenzi kamili + ulichokitoa (Nilijenga, Nilizindua, Niliongeza…)."),
          evidenceBacked: true, autoFixable: false, severity: "warn",
        });
      }
      // No numbers.
      if (!/\d/.test(bullet) && bullet.length > 20) {
        findings.push({
          id, entryId: entry.id, company: entry.company, position: entry.position, line: bullet,
          issue: L("No measurable result", "Hakuna matokeo yanayopimika"),
          why: L("Quantified results are the strongest hiring signal — without numbers, impact is invisible.", "Matokeo yenye namba ndiyo ishara kali zaidi — bila namba, athari haionekani."),
          fix: L("Add one number, percentage or amount that's TRUE (e.g. 'served 200+ customers').", "Ongeza namba, asilimia au kiasi cha KWELI (mf. 'nilihudumia wateja 200+')."),
          evidenceBacked: false, autoFixable: false, severity: "warn",
        });
      }
      // Over-long bullet.
      if (bullet.length > 240) {
        findings.push({
          id, entryId: entry.id, company: entry.company, position: entry.position, line: bullet,
          issue: L("Bullet too long", "Kipengele kirefu sana"),
          why: L("Recruiters skim in seconds; a 4-line bullet buries your strongest point.", "Waajiri husoma kwa sekunde; kipengele cha mistari 4 huficha jambo lako kubwa."),
          fix: L("Split into two bullets, each with its own verb + result.", "Gawanya katika vipengele viwili, kila kimoja kikiwa na kitenzi + matokeo."),
          evidenceBacked: true, autoFixable: false, severity: "warn",
        });
      }
      // Repeated first words across the same entry.
      if (firstWord) {
        openers.set(firstWord, (openers.get(firstWord) ?? 0) + 1);
        if (openers.get(firstWord)! >= 3) {
          findings.push({
            id: `${entry.id}-repeat`, entryId: entry.id, company: entry.company, position: entry.position,
            line: bullet,
            issue: L(`Repeated opener "${firstWord}"`, `Kitenzi kinachojirudia "${firstWord}"`),
            why: L("3+ bullets starting with the same word reads robotic and kills rhythm.", "Vipengele 3+ vinavyoanza kwa neno moja husoma kama roboti."),
            fix: L("Vary the verbs across bullets.", "Badilisha vitendo kwenye vipengele."),
            evidenceBacked: true, autoFixable: false, severity: "warn",
          });
        }
      }
    });
  }
  return findings;
}

// ─── AutoFix (user-approved, evidence-backed only) ───────────────────────────
// Deterministic fixes that NEVER invent facts: they rearrange or trim what is
// already on the CV. Each returns a patched CVData. The UI previews the change
// and only applies it after the user clicks Apply.

export interface AutoFixResult {
  applied: boolean;
  message: string;
  data: CVData;
}

/** Remove the profile photo (ATS parsing fix — photo is not a fact). */
export function autoFixRemovePhoto(data: CVData): AutoFixResult {
  if (!data.personal.photo) return { applied: false, message: "No photo to remove", data };
  return {
    applied: true,
    message: "Photo removed — ATS-friendly",
    data: { ...data, personal: { ...data.personal, photo: undefined } },
  };
}

/** Normalize experience dates to YYYY-MM (keeps existing values, fixes shape). */
export function autoFixDates(data: CVData): AutoFixResult {
  let changed = false;
  const experience = data.experience.map((e) => {
    const fix = (d: string) => {
      if (!d) return d;
      const m = d.trim().match(/^(\d{4})-(\d{1,2})$/);
      if (m) { const mm = m[2].padStart(2, "0"); if (mm !== m[2]) changed = true; return `${m[1]}-${mm}`; }
      const y = d.trim().match(/^(\d{4})$/);
      if (y) { changed = true; return `${y[1]}-01`; }
      return d;
    };
    return { ...e, startDate: fix(e.startDate), endDate: fix(e.endDate) };
  });
  if (!changed) return { applied: false, message: "Dates already consistent", data };
  return { applied: true, message: "Dates normalized to YYYY-MM", data: { ...data, experience } };
}

/** Strip empty/whitespace-only bullets from experience descriptions. */
export function autoFixEmptyBullets(data: CVData): AutoFixResult {
  let changed = false;
  const experience = data.experience.map((e) => {
    const lines = e.description.split("\n");
    const kept = lines.filter((l) => l.replace(/^[-•*]\s*/, "").trim().length > 0);
    if (kept.length !== lines.length) changed = true;
    return { ...e, description: kept.join("\n") };
  });
  if (!changed) return { applied: false, message: "No empty bullets", data };
  return { applied: true, message: "Empty bullets removed", data: { ...data, experience } };
}

/** Deduplicate skills by name (case-insensitive, keeps the highest level). */
export function autoFixDuplicateSkills(data: CVData): AutoFixResult {
  const seen = new Map<string, typeof data.skills[number]>();
  for (const s of data.skills) {
    const key = s.name.trim().toLowerCase();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing || (s.level ?? 0) > (existing.level ?? 0)) seen.set(key, s);
  }
  const deduped = [...seen.values()];
  if (deduped.length === data.skills.length) {
    return { applied: false, message: "No duplicate skills", data };
  }
  return { applied: true, message: "Duplicate skills merged", data: { ...data, skills: deduped } };
}

export type AutoFixId = "remove-photo" | "normalize-dates" | "remove-empty-bullets" | "dedupe-skills";

export const AUTO_FIXES: Record<AutoFixId, (data: CVData) => AutoFixResult> = {
  "remove-photo": autoFixRemovePhoto,
  "normalize-dates": autoFixDates,
  "remove-empty-bullets": autoFixEmptyBullets,
  "dedupe-skills": autoFixDuplicateSkills,
};

/** Which AutoFixes are currently applicable (non-empty effect). */
export function applicableAutoFixes(data: CVData): AutoFixId[] {
  return (Object.keys(AUTO_FIXES) as AutoFixId[]).filter((id) => AUTO_FIXES[id](data).applied);
}
