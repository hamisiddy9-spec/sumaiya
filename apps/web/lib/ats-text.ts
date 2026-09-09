// Text-based ATS heuristics for the standalone CV checker. Unlike the editor's
// AtsPanel (which scores a structured CVData object), this scores the RAW TEXT
// extracted from an uploaded PDF — the same thing a real Applicant Tracking
// System parses. Pure and dependency-free so it runs client-side.

export interface AtsTextCheck {
  id: string;
  label: string;
  earned: number;
  max: number;
  severity: "pass" | "warn" | "fail";
  tip: string;
}

export interface AtsTextResult {
  score: number; // 0–100
  checks: AtsTextCheck[];
  wordCount: number;
  status: "ready" | "needs-work" | "high-risk";
}

const ACTION_VERBS =
  /\b(led|built|managed|created|developed|designed|launched|increased|reduced|improved|delivered|coordinated|implemented|achieved|drove|spearheaded|streamlined|generated|negotiated|oversaw|established|optimi[sz]ed|mentored|grew|cut|saved)\b/i;

const SECTION_WORDS: { key: string; re: RegExp }[] = [
  { key: "experience", re: /\b(experience|employment|work history|professional background)\b/i },
  { key: "education", re: /\b(education|academic|qualifications?)\b/i },
  { key: "skills", re: /\b(skills|competenc(?:e|ies)|proficienc(?:y|ies)|technical)\b/i },
  { key: "summary", re: /\b(summary|profile|objective|about me)\b/i },
];

export function scoreResumeText(raw: string, sw = false): AtsTextResult {
  const L = (en: string, s: string) => (sw ? s : en);
  const text = (raw ?? "").trim();
  const lower = text.toLowerCase();
  const head = text.slice(0, 450).toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const hasCountryCode = /\+\d{1,3}[\s-]?\d/.test(text);
  const hasLinkedIn = /linkedin\.com\/|github\.com\/|\b[a-z0-9-]+\.(dev|me|io|com)\b/i.test(text);
  const sectionsFound = SECTION_WORDS.filter((s) => s.re.test(lower)).length;
  const hasActionVerbs = ACTION_VERBS.test(text);
  const hasNumbers = /(\b\d{2,}\b|\d+%|\$\s?\d|ksh|tsh|ugx)/i.test(text);
  const years = text.match(/\b(19|20)\d{2}\b/g) ?? [];
  const contactAtTop = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(head) || /(\+?\d[\d\s().-]{7,}\d)/.test(head);

  const checks: AtsTextCheck[] = [];
  const add = (c: AtsTextCheck) => checks.push(c);

  // 1. Machine-readable text (the single biggest ATS failure: a scanned image).
  {
    const ok = wordCount >= 120;
    const partial = wordCount >= 40;
    add({
      id: "readable",
      label: L("Machine-readable text", "Maandishi yanayosomeka na mashine"),
      earned: ok ? 16 : partial ? 6 : 0,
      max: 16,
      severity: ok ? "pass" : partial ? "warn" : "fail",
      tip: L(
        "Very little selectable text was found — your PDF may be a scan or image, which an ATS reads as a blank page. Export a text-based PDF.",
        "Maandishi machache sana yamepatikana — huenda PDF yako ni picha/skani, ambayo ATS huisoma kama ukurasa tupu. Tengeneza PDF yenye maandishi."
      ),
    });
  }

  // 2. Email
  add({
    id: "email",
    label: L("Email address present", "Barua pepe imewekwa"),
    earned: hasEmail ? 10 : 0,
    max: 10,
    severity: hasEmail ? "pass" : "fail",
    tip: L("No email found. Put a professional email at the top in plain text.", "Hakuna barua pepe. Weka barua pepe ya kitaalamu juu kwa maandishi wazi."),
  });

  // 3. Phone
  add({
    id: "phone",
    label: L("Phone number present", "Namba ya simu imewekwa"),
    earned: hasPhone ? (hasCountryCode ? 9 : 6) : 0,
    max: 9,
    severity: hasPhone ? (hasCountryCode ? "pass" : "warn") : "fail",
    tip: hasPhone
      ? L("Add your country code (e.g. +254, +255) so recruiters abroad can reach you.", "Ongeza msimbo wa nchi (mfano +254, +255) ili waajiri wa nje wakupate.")
      : L("No phone number found. Add one in plain text near your email.", "Hakuna namba ya simu. Ongeza karibu na barua pepe yako."),
  });

  // 4. Sections
  add({
    id: "sections",
    label: L("Clear section headings", "Vichwa vya sehemu vilivyo wazi"),
    earned: Math.round((sectionsFound / SECTION_WORDS.length) * 16),
    max: 16,
    severity: sectionsFound >= 4 ? "pass" : sectionsFound >= 2 ? "warn" : "fail",
    tip: L(
      `Found ${sectionsFound}/4 standard sections. Use clear headings: Summary, Experience, Education, Skills — ATS files your details by them.`,
      `Zimepatikana sehemu ${sectionsFound}/4. Tumia vichwa wazi: Muhtasari, Uzoefu, Elimu, Ujuzi — ATS hupanga taarifa kwa vichwa hivyo.`
    ),
  });

  // 5. Action verbs
  add({
    id: "action_verbs",
    label: L("Action verbs in experience", "Maneno ya vitendo katika uzoefu"),
    earned: hasActionVerbs ? 12 : 0,
    max: 12,
    severity: hasActionVerbs ? "pass" : "fail",
    tip: L("Start bullet points with verbs: Led, Built, Managed, Increased, Delivered…", "Anza vipengele kwa vitenzi: Niliongoza, Nilijenga, Nilisimamia, Niliongeza…"),
  });

  // 6. Quantified achievements
  add({
    id: "numbers",
    label: L("Quantified achievements", "Mafanikio yenye takwimu"),
    earned: hasNumbers ? 12 : 0,
    max: 12,
    severity: hasNumbers ? "pass" : "warn",
    tip: L("Add numbers to your wins: “grew sales 30%”, “managed 12 staff”, “saved KSh 2M”.", "Ongeza takwimu kwenye mafanikio: “niliongeza mauzo 30%”, “nilisimamia watu 12”, “niliokoa KSh 2M”."),
  });

  // 7. Healthy length
  {
    const ok = wordCount >= 200 && wordCount <= 1100;
    add({
      id: "length",
      label: L("Healthy length (≈1 page)", "Urefu mzuri (≈ukurasa 1)"),
      earned: ok ? 9 : wordCount >= 120 ? 4 : 0,
      max: 9,
      severity: ok ? "pass" : "warn",
      tip:
        wordCount > 1100
          ? L("Your CV is long. Trim to the most relevant 1–2 pages — recruiters skim.", "CV yako ni ndefu. Punguza hadi kurasa 1–2 muhimu — waajiri husoma haraka.")
          : L("Your CV looks short. Add more detail to your experience and skills.", "CV yako ni fupi. Ongeza maelezo zaidi ya uzoefu na ujuzi."),
    });
  }

  // 8. Contact at top
  add({
    id: "contact_top",
    label: L("Contact details at the top", "Mawasiliano yako yapo juu"),
    earned: contactAtTop ? 8 : 0,
    max: 8,
    severity: contactAtTop ? "pass" : "warn",
    tip: L("Put your name and contact details at the very top — some ATS only scan the header for them.", "Weka jina na mawasiliano juu kabisa — baadhi ya ATS husoma kichwa pekee."),
  });

  // 9. Dates
  add({
    id: "dates",
    label: L("Dates on your history", "Tarehe kwenye historia yako"),
    earned: years.length >= 2 ? 8 : years.length === 1 ? 4 : 0,
    max: 8,
    severity: years.length >= 2 ? "pass" : "warn",
    tip: L("Include start/end years for each role and qualification so an ATS can build your timeline.", "Weka miaka ya kuanza/kumaliza kwa kila kazi na sifa ili ATS itengeneze ratiba yako."),
  });

  const earned = checks.reduce((s, c) => s + c.earned, 0);
  const max = checks.reduce((s, c) => s + c.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((earned / max) * 100)));
  const status = score >= 80 ? "ready" : score >= 55 ? "needs-work" : "high-risk";

  return { score, checks, wordCount, status };
}
