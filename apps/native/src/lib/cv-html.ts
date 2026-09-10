import type { CV, CVData } from "@sumaiya/types";

/**
 * One HTML renderer for a CV — used by the PDF export and the in-app preview
 * (a WebView shows exactly what will print). Self-contained: inline CSS, no
 * external assets, so it works in expo-print and react-native-webview alike.
 *
 * A "template" here is a layout + type treatment. Free tier ships four; two
 * more are premium (rendered the same, gated only in the picker UI).
 */

export type CvTemplateId = "classic" | "modern" | "minimal" | "sidebar" | "executive" | "compact";

export interface CvTemplateMeta {
  id: CvTemplateId;
  name: { en: string; sw: string };
  blurb: { en: string; sw: string };
  tier: "free" | "premium";
}

export const CV_TEMPLATES: CvTemplateMeta[] = [
  { id: "classic", name: { en: "Classic", sw: "Rasmi" }, blurb: { en: "Safe everywhere. Great for ATS.", sw: "Salama kila mahali. Nzuri kwa ATS." }, tier: "free" },
  { id: "modern", name: { en: "Modern", sw: "Ya kisasa" }, blurb: { en: "A coloured header, clean body.", sw: "Kichwa cha rangi, mwili safi." }, tier: "free" },
  { id: "minimal", name: { en: "Minimal", sw: "Sahili" }, blurb: { en: "No colour. Just structure and air.", sw: "Bila rangi. Muundo na nafasi tu." }, tier: "free" },
  { id: "sidebar", name: { en: "Sidebar", sw: "Pembeni" }, blurb: { en: "Contact & skills down the left.", sw: "Mawasiliano na ujuzi upande wa kushoto." }, tier: "free" },
  { id: "executive", name: { en: "Executive", sw: "Kiongozi" }, blurb: { en: "Serif, centred, senior.", sw: "Serif, katikati, ngazi ya juu." }, tier: "premium" },
  { id: "compact", name: { en: "Compact", sw: "Fupi" }, blurb: { en: "Fits a long history on one page.", sw: "Inaingiza historia ndefu ukurasa mmoja." }, tier: "premium" },
];

export interface CvHtmlOptions {
  accent?: string;
  lang?: "en" | "sw";
  template?: CvTemplateId;
}

const LABELS = {
  en: { summary: "Professional Summary", experience: "Experience", education: "Education", skills: "Skills", languages: "Languages", contact: "Contact", present: "Present", gpa: "GPA" },
  sw: { summary: "Muhtasari wa Kikazi", experience: "Uzoefu", education: "Elimu", skills: "Ujuzi", languages: "Lugha", contact: "Mawasiliano", present: "Sasa", gpa: "GPA" },
};

function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface Parts {
  L: typeof LABELS.en;
  p: { fullName?: string; email?: string; phone?: string; location?: string; headline?: string };
  d: Partial<CVData>;
  experience: NonNullable<CVData["experience"]>;
  education: NonNullable<CVData["education"]>;
  skills: NonNullable<CVData["skills"]>;
  languages: NonNullable<CVData["languages"]>;
}

const contactLine = ({ p }: Parts) => [p.email, p.phone, p.location].filter(Boolean).map(esc).join(" &nbsp;•&nbsp; ");

const summaryBlock = ({ L, d }: Parts) =>
  d.summary ? `<div class="section"><div class="section-title">${L.summary}</div><p class="summary">${esc(d.summary)}</p></div>` : "";

const experienceBlock = ({ L, experience }: Parts) =>
  experience.length
    ? `<div class="section"><div class="section-title">${L.experience}</div>${experience
        .map(
          (e) => `<div class="entry">
      <div class="entry-title">${esc(e.title)}</div>
      <div class="entry-sub">${esc(e.company)}</div>
      <div class="entry-date">${esc(e.startDate)} – ${esc(e.endDate) || L.present}</div>
      ${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ""}
    </div>`,
        )
        .join("")}</div>`
    : "";

const educationBlock = ({ L, education }: Parts) =>
  education.length
    ? `<div class="section"><div class="section-title">${L.education}</div>${education
        .map(
          (e) => `<div class="entry">
      <div class="entry-title">${esc(e.degree)}${e.field ? ` — ${esc(e.field)}` : ""}</div>
      <div class="entry-sub">${esc(e.institution)}</div>
      <div class="entry-date">${esc(e.graduationDate)}${e.gpa ? ` · ${L.gpa}: ${esc(e.gpa)}` : ""}</div>
    </div>`,
        )
        .join("")}</div>`
    : "";

const skillsBlock = ({ L, skills }: Parts) =>
  skills.length
    ? `<div class="section"><div class="section-title">${L.skills}</div><div class="skills">${skills
        .map((s) => `<span class="skill">${esc(s.name)}</span>`)
        .join("")}</div></div>`
    : "";

const languagesBlock = ({ L, languages }: Parts) =>
  languages.length
    ? `<div class="section"><div class="section-title">${L.languages}</div>${languages
        .map((l) => `<div class="entry"><span class="entry-title">${esc(l.language)}</span> <span class="entry-sub">(${esc(l.proficiency)})</span></div>`)
        .join("")}</div>`
    : "";

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #2b2b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .name { margin: 0; }
  .section { margin-bottom: 16px; }
  .entry { margin-bottom: 10px; }
  .entry-title { font-weight: 700; color: #211A15; }
  .entry-sub { color: #666; }
  .entry-date { color: #999; }
  .entry-desc { color: #4a4a4a; margin-top: 3px; }
  .summary { color: #4a4a4a; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; }
`;

function templateCss(id: CvTemplateId, accent: string): string {
  switch (id) {
    case "modern":
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 12.5px; line-height: 1.55; }
        .head { background: ${accent}; color: #fff; padding: 30px 44px 22px; }
        .head .name { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
        .head .headline { font-weight: 600; opacity: 0.92; font-size: 13.5px; margin-top: 2px; }
        .head .contact { font-size: 11px; opacity: 0.9; margin-top: 8px; }
        .body { padding: 24px 44px; }
        .section-title { font-size: 12px; font-weight: 800; color: ${accent}; letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 8px; }
        .entry-title { font-size: 13px; }
        .skill { background: ${accent}1f; color: ${accent}; padding: 3px 9px; border-radius: 12px; font-size: 10.5px; font-weight: 700; }`;
    case "minimal":
      return `${BASE_CSS}
        body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 12px; line-height: 1.6; padding: 48px 52px; color: #333; }
        .name { font-size: 27px; font-weight: 700; letter-spacing: -0.3px; }
        .headline { color: #555; font-size: 13px; margin: 2px 0 4px; }
        .contact { font-size: 10.5px; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 16px; margin-bottom: 20px; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #999; margin-bottom: 9px; }
        .entry-title { font-size: 12.5px; }
        .skill { border: 1px solid #ccc; color: #555; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; }`;
    case "sidebar":
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 12px; line-height: 1.5; }
        .grid { display: flex; min-height: 100%; }
        .aside { width: 33%; background: ${accent}12; padding: 34px 24px; }
        .aside .name { font-size: 22px; font-weight: 800; color: #211A15; letter-spacing: -0.4px; }
        .aside .headline { color: ${accent}; font-weight: 700; font-size: 12px; margin: 3px 0 14px; }
        .aside .contact { font-size: 10.5px; color: #555; line-height: 1.9; }
        .aside .section-title { font-size: 10.5px; font-weight: 800; color: ${accent}; letter-spacing: 0.8px; text-transform: uppercase; margin: 18px 0 7px; }
        .main { flex: 1; padding: 34px 32px; }
        .main .section-title { font-size: 12px; font-weight: 800; color: #211A15; letter-spacing: 0.6px; text-transform: uppercase; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-bottom: 10px; }
        .skills { flex-direction: column; gap: 4px; }
        .skill { color: #444; font-size: 11px; }`;
    case "executive":
      return `${BASE_CSS}
        body { font-family: Georgia, "Times New Roman", serif; font-size: 12.5px; line-height: 1.6; padding: 46px 56px; color: #2b2b2b; }
        .head { text-align: center; border-bottom: 2px solid ${accent}; padding-bottom: 16px; margin-bottom: 20px; }
        .name { font-size: 30px; font-weight: 700; letter-spacing: 0.5px; }
        .headline { font-style: italic; color: ${accent}; font-size: 13.5px; margin-top: 3px; }
        .contact { font-size: 11px; color: #666; margin-top: 8px; }
        .section-title { font-size: 12.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${accent}; text-align: center; margin-bottom: 10px; }
        .entry-title { font-size: 13px; }
        .skill { color: #444; font-size: 11.5px; }
        .skills { gap: 4px 14px; }`;
    case "compact":
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 10.5px; line-height: 1.4; padding: 32px 40px; }
        .name { font-size: 22px; font-weight: 800; color: #211A15; letter-spacing: -0.4px; }
        .headline { color: ${accent}; font-weight: 700; font-size: 11px; }
        .contact { font-size: 9.5px; color: #666; border-bottom: 2px solid ${accent}; padding-bottom: 8px; margin-bottom: 12px; }
        .section { margin-bottom: 10px; }
        .section-title { font-size: 10px; font-weight: 800; color: ${accent}; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 5px; }
        .entry { margin-bottom: 6px; }
        .entry-title { font-size: 11px; }
        .skill { background: ${accent}1a; color: ${accent}; padding: 2px 7px; border-radius: 9px; font-size: 9px; font-weight: 700; }`;
    case "classic":
    default:
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 12.5px; line-height: 1.55; padding: 40px 44px; }
        .name { font-size: 30px; font-weight: 800; color: #211A15; letter-spacing: -0.5px; margin-bottom: 3px; }
        .headline { color: ${accent}; font-weight: 700; font-size: 13.5px; margin-bottom: 6px; }
        .contact { font-size: 11px; color: #6b6b6b; border-bottom: 3px solid ${accent}; padding-bottom: 14px; margin-bottom: 18px; }
        .section-title { font-size: 12.5px; font-weight: 800; color: ${accent}; letter-spacing: 0.6px; text-transform: uppercase; border-bottom: 1px solid #e6e6e6; padding-bottom: 5px; margin-bottom: 10px; }
        .entry-title { font-size: 13px; }
        .skill { background: ${accent}1f; color: ${accent}; padding: 3px 9px; border-radius: 12px; font-size: 10.5px; font-weight: 700; }`;
  }
}

function templateBody(id: CvTemplateId, parts: Parts): string {
  const { p, L } = parts;
  const name = `<p class="name">${esc(p.fullName) || "&nbsp;"}</p>`;
  const headline = p.headline ? `<div class="headline">${esc(p.headline)}</div>` : "";
  const contact = `<div class="contact">${contactLine(parts)}</div>`;
  const main = [summaryBlock(parts), experienceBlock(parts), educationBlock(parts), skillsBlock(parts), languagesBlock(parts)].join("");

  if (id === "modern") {
    return `<div class="head">${name}${headline}<div class="contact">${contactLine(parts)}</div></div><div class="body">${main}</div>`;
  }
  if (id === "sidebar") {
    const asideSkills = parts.skills.length
      ? `<div class="section-title">${L.skills}</div><div class="skills">${parts.skills.map((s) => `<span class="skill">${esc(s.name)}</span>`).join("")}</div>`
      : "";
    const asideLangs = parts.languages.length
      ? `<div class="section-title">${L.languages}</div>${parts.languages.map((l) => `<div class="entry"><span class="entry-title">${esc(l.language)}</span> <span class="entry-sub">(${esc(l.proficiency)})</span></div>`).join("")}`
      : "";
    return `<div class="grid">
      <div class="aside">${name}${headline}<div class="contact">${[p.email, p.phone, p.location].filter(Boolean).map(esc).join("<br/>")}</div>${asideSkills}${asideLangs}</div>
      <div class="main">${summaryBlock(parts)}${experienceBlock(parts)}${educationBlock(parts)}</div>
    </div>`;
  }
  if (id === "executive") {
    return `<div class="head">${name}${headline}${contact}</div>${main}`;
  }
  return `${name}${headline}${contact}${main}`;
}

export function cvToHtml(cv: CV, opts: CvHtmlOptions = {}): string {
  const accent = opts.accent && /^#[0-9a-fA-F]{6}$/.test(opts.accent) ? opts.accent : "#DA4A1C";
  const id: CvTemplateId = CV_TEMPLATES.some((tpl) => tpl.id === opts.template) ? (opts.template as CvTemplateId) : "classic";
  const L = LABELS[opts.lang === "sw" ? "sw" : "en"];
  const d: Partial<CVData> = cv.data ?? {};

  const parts: Parts = {
    L,
    p: (d.personalInfo ?? {}) as Parts["p"],
    d,
    experience: d.experience ?? [],
    education: d.education ?? [],
    skills: d.skills ?? [],
    languages: d.languages ?? [],
  };

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=794">
<style>${templateCss(id, accent)}</style></head><body>${templateBody(id, parts)}</body></html>`;
}
