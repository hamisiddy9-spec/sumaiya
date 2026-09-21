import type { CV, CVData } from "@sumaiya/types";
import { TEMPLATE_REGISTRY } from "./templates/registry";
import { hasRenderer, renderTemplateHtml } from "./cv-engine/render";
import { fitSheet } from "./cv-engine/fit";
import type { NativeTemplate } from "./templates/types";

/**
 * One HTML renderer for a CV — used by the PDF export and the in-app preview
 * (a WebView shows exactly what will print). Self-contained: inline CSS, no
 * external assets, so it works in expo-print and react-native-webview alike.
 *
 * A "template" here is a layout + type treatment. Free tier ships four; two
 * more are premium (rendered the same, gated only in the picker UI).
 */

/**
 * A template id. The original six are hand-written inside this file; every
 * other id is mirrored from the web registry and drawn by the shared engine
 * (apps/native/src/lib/cv-engine). Left as `string` on purpose: the registry is
 * generated from the web, and a closed union here would silently reject a
 * template the moment the web adds one.
 */
export type CvTemplateId = string;

export interface CvTemplateMeta {
  id: CvTemplateId;
  name: { en: string; sw: string };
  blurb: { en: string; sw: string };
  tier: "free" | "premium";
  /** Design family (web `style`): sidebar | header | minimal | creative | classic.
   *  Optional because a picker must still work if an entry lacks it. */
  style?: string;
}

export const CV_TEMPLATES: CvTemplateMeta[] = [
  { id: "classic", name: { en: "Classic", sw: "Asili" }, blurb: { en: "Safe everywhere. Great for ATS.", sw: "Salama popote. Nzuri kwa waajiri." }, tier: "free", style: "classic" },
  { id: "modern", name: { en: "Modern", sw: "Kisasa" }, blurb: { en: "A coloured header, clean body.", sw: "Kichwa cha rangi, mwili safi." }, tier: "free", style: "header" },
  { id: "minimal", name: { en: "Minimal", sw: "Sahili" }, blurb: { en: "No colour. Just structure and air.", sw: "Bila rangi. Muundo na nafasi tu." }, tier: "free", style: "minimal" },
  { id: "sidebar", name: { en: "Sidebar", sw: "Safu Pembeni" }, blurb: { en: "Contact & skills down the left.", sw: "Mawasiliano na ujuzi upande wa kushoto." }, tier: "free", style: "sidebar" },
  { id: "executive", name: { en: "Executive", sw: "Kiongozi" }, blurb: { en: "Serif, centred, senior.", sw: "Serif, katikati, ngazi ya juu." }, tier: "premium", style: "classic" },
  { id: "compact", name: { en: "Compact", sw: "Fupi" }, blurb: { en: "Fits a long history on one page.", sw: "Inaingiza historia ndefu katika ukurasa mmoja." }, tier: "premium", style: "minimal" },
];

/**
 * The engine-backed templates, mirrored from the web registry. Sorted by id so
 * the picker's ordering does not depend on object key insertion order.
 */
export const ENGINE_TEMPLATES: CvTemplateMeta[] = Object.values(TEMPLATE_REGISTRY)
  .filter((tpl: NativeTemplate) => hasRenderer(tpl))
  .map((tpl: NativeTemplate) => ({
    id: tpl.id,
    name: tpl.name,
    blurb: tpl.blurb,
    tier: tpl.tier,
    style: tpl.style,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Everything the app can render: the six hand-written templates plus the
 * mirrored web registry.
 *
 * The picker screens must NOT `.map()` this straight into a ScrollView — it is
 * 200+ rows. Use TEMPLATE_PAGE_SIZE with a virtualised list, or the screens
 * will mount every thumbnail at once.
 */
export const ALL_TEMPLATES: CvTemplateMeta[] = [...CV_TEMPLATES, ...ENGINE_TEMPLATES];

/** Every id the app can persist and render. */
export function isKnownTemplate(id: string | undefined | null): boolean {
  if (!id) return false;
  return ALL_TEMPLATES.some((tpl) => tpl.id === id);
}

/** The engine layout that draws this template, or "classic" for the legacy six.
 *  Pickers use this to draw an accurate schematic thumbnail. */
export function templateLayout(id: string): string {
  return TEMPLATE_REGISTRY[id]?.layout ?? "classic";
}

/** Metadata for one template, engine-backed or legacy. */
export function templateMeta(id: string): CvTemplateMeta | undefined {
  return ALL_TEMPLATES.find((tpl) => tpl.id === id);
}

/**
 * True if cvToHtml() can actually draw this id — an engine renderer exists,
 * or it's one of the six hand-written legacy templates. Mirrors the exact
 * fallback check inside cvToHtml(). A known id (isKnownTemplate) can still
 * fail this: the "bespoke" ids listed in BESPOKE_IDS are real, pickable
 * templates with no renderer yet, and cvToHtml silently substitutes
 * "classic" for them. Pickers/previews use this to warn before that swap.
 */
export function isRenderable(id: string | undefined | null): boolean {
  if (!id) return false;
  const engineTemplate = TEMPLATE_REGISTRY[id];
  if (engineTemplate && hasRenderer(engineTemplate)) return true;
  return CV_TEMPLATES.some((tpl) => tpl.id === id);
}

export interface CvHtmlOptions {
  accent?: string;
  lang?: "en" | "sw";
  template?: CvTemplateId;
  /** Only the engine-backed templates use this; the legacy six ignore it. */
  fontFamily?: string;
  /**
   * Display width in CSS px for a WebView preview. When set, the page is wrapped
   * so it is SCALED TO FIT that width (see cv-engine/fit.ts). Omit it for the
   * print/PDF path, which must keep the page at its native 794px.
   */
  fitWidth?: number;
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
  p: { fullName?: string; email?: string; phone?: string; location?: string; headline?: string; profilePhoto?: string };
  d: Partial<CVData>;
  experience: NonNullable<CVData["experience"]>;
  education: NonNullable<CVData["education"]>;
  skills: NonNullable<CVData["skills"]>;
  languages: NonNullable<CVData["languages"]>;
}

const contactLine = ({ p }: Parts) => [p.email, p.phone, p.location].filter(Boolean).map(esc).join(" &nbsp;•&nbsp; ");

// A CV's data can come from a synced/imported source, not just this app's own
// picker — validate the value actually looks like an image src before it goes
// into an HTML attribute, rather than trusting it's always our own base64
// output.
const PHOTO_SRC_RE = /^(data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+|https:\/\/\S+)$/;
function photoTag({ p }: Parts, className = "photo"): string {
  if (!p.profilePhoto || !PHOTO_SRC_RE.test(p.profilePhoto)) return "";
  return `<img class="${className}" src="${p.profilePhoto}" alt="" />`;
}

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
        .map((l) =>
          // Same label/level treatment as the shared engine (see languagesSection
          // in cv-engine/sections.ts): the level is right-aligned in its own
          // column and a dotted leader connects it to the language, because a
          // bare label/level pair spread across the row reads as two unrelated
          // fragments in a wide column.
          `<div class="entry lang-row"><span class="entry-title lang-name">${esc(l.language)}</span><span class="entry-sub lang-level">${esc(l.proficiency)}</span></div>`,
        )
        .join("")}</div>`
    : "";

const BASE_CSS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: #2b2b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .name { margin: 0; }
  .section { margin-bottom: 16px; }
  .entry { margin-bottom: 10px; break-inside: avoid; }
  .entry-title { font-weight: 700; color: #211A15; }
  .entry-sub { color: #666; }
  .entry-date { color: #999; }
  .entry-desc { color: #4a4a4a; margin-top: 3px; }
  .summary { color: #4a4a4a; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .photo { border-radius: 50%; object-fit: cover; display: block; flex-shrink: 0; }
  .head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  /* Languages: label + dotted leader + right-aligned level (see languagesBlock). */
  .lang-row { display: flex; align-items: baseline; gap: 8px; }
  .lang-name { flex: 1 1 auto; min-width: 0; border-bottom: 1px dotted currentColor; padding-bottom: 2px; }
  .lang-level { flex: 0 0 auto; white-space: nowrap; }
`;

/** Wraps the name/headline block with the photo (if any) in a flex row — no
 *  layout change at all when there's no photo, so the common case is untouched. */
function withPhoto(nameHeadlineHtml: string, photoHtml: string, align: "start" | "center" = "start"): string {
  if (!photoHtml) return nameHeadlineHtml;
  if (align === "center") return `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">${photoHtml}${nameHeadlineHtml}</div>`;
  return `<div class="head-row"><div style="flex:1;min-width:0;">${nameHeadlineHtml}</div>${photoHtml}</div>`;
}

function templateCss(id: CvTemplateId, accent: string): string {
  switch (id) {
    case "modern":
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 12.5px; line-height: 1.55; }
        .head { background: ${accent}; color: #fff; padding: 30px 44px 22px; }
        .head .name { font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
        .head .headline { font-weight: 600; opacity: 0.92; font-size: 13.5px; margin-top: 2px; }
        .head .contact { font-size: 11px; opacity: 0.9; margin-top: 8px; }
        .head .photo { width: 76px; height: 76px; border: 3px solid #ffffff55; }
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
        .photo { width: 64px; height: 64px; }
        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #999; margin-bottom: 9px; }
        .entry-title { font-size: 12.5px; }
        .skill { border: 1px solid #ccc; color: #555; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; }`;
    case "sidebar":
      return `${BASE_CSS}
        body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 12px; line-height: 1.5; }
        .grid { display: flex; min-height: 100%; }
        .aside { width: 33%; background: ${accent}12; padding: 34px 24px; }
        .aside .photo { width: 88px; height: 88px; margin: 0 auto 16px; border: 3px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
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
        .photo { width: 92px; height: 92px; margin: 0 auto; border: 3px solid ${accent}44; }
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
        .photo { width: 44px; height: 44px; }
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
        .photo { width: 72px; height: 72px; border: 3px solid ${accent}33; }
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
  const photo = photoTag(parts);

  if (id === "modern") {
    return `<div class="head">${withPhoto(`${name}${headline}<div class="contact">${contactLine(parts)}</div>`, photo)}</div><div class="body">${main}</div>`;
  }
  if (id === "sidebar") {
    const asideSkills = parts.skills.length
      ? `<div class="section-title">${L.skills}</div><div class="skills">${parts.skills.map((s) => `<span class="skill">${esc(s.name)}</span>`).join("")}</div>`
      : "";
    const asideLangs = parts.languages.length
      ? `<div class="section-title">${L.languages}</div>${parts.languages.map((l) => `<div class="entry"><span class="entry-title">${esc(l.language)}</span> <span class="entry-sub">(${esc(l.proficiency)})</span></div>`).join("")}`
      : "";
    return `<div class="grid">
      <div class="aside">${photo}${name}${headline}<div class="contact">${[p.email, p.phone, p.location].filter(Boolean).map(esc).join("<br/>")}</div>${asideSkills}${asideLangs}</div>
      <div class="main">${summaryBlock(parts)}${experienceBlock(parts)}${educationBlock(parts)}</div>
    </div>`;
  }
  if (id === "executive") {
    return `<div class="head">${withPhoto(`${name}${headline}${contact}`, photo, "center")}</div>${main}`;
  }
  return `${withPhoto(`${name}${headline}${contact}`, photo)}${main}`;
}

export function cvToHtml(cv: CV, opts: CvHtmlOptions = {}): string {
  // Engine-backed templates (mirrored from the web registry) render through the
  // shared engine. The six hand-written ones below keep their original output
  // byte-for-byte, so nothing a user already exports changes.
  const engineTemplate = opts.template ? TEMPLATE_REGISTRY[opts.template] : undefined;
  if (engineTemplate && hasRenderer(engineTemplate)) {
    return renderTemplateHtml(engineTemplate, cv, {
      accent: opts.accent,
      fontFamily: opts.fontFamily,
      lang: opts.lang,
      fitWidth: opts.fitWidth,
    });
  }

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

  const html = templateBody(id, parts);
  // Preview path only: fit the page to the WebView instead of relying on the
  // WebView's own viewport handling (see cv-engine/fit.ts).
  if (opts.fitWidth && opts.fitWidth > 0) {
    const css = templateCss(id, accent);
    const fit = fitSheet(html, opts.fitWidth);
    // The legacy designs carry their page margin as `body { padding: 40px 44px }`.
    // The fit frame is a child of that body, so the padding shoved it 44px right
    // and off a 138px frame (measured: box left 0 -> 44, right 138 -> 182, i.e.
    // 44px of the sheet clipped). Move the same padding INSIDE the frame — the
    // page keeps its margins, and the frame keeps the whole frame.
    const bodyPad = /body\s*\{[^}]*?padding:\s*([^;}]+)/.exec(css)?.[1]?.trim() ?? "0";
    const shift = `\n  body { padding: 0 !important; }\n  #cv-page { padding: ${bodyPad}; }\n`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${fit.viewport}
<style>${css}${fit.css}${shift}</style></head><body>${fit.body}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=794">
<style>${templateCss(id, accent)}</style></head><body>${html}</body></html>`;
}
