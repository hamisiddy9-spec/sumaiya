/**
 * Job-aware template suggestions.
 *
 * A user with 224 designs does not have a choice problem, they have a picking
 * problem. Which of these is right for a nurse? For a driver? That question has
 * a real answer, and it is not "whatever is first alphabetically".
 *
 * Two steps, both data-driven so nothing can dangle:
 *   1. infer the career field from text the user has ALREADY given us
 *      (headline, goals, experience) — no new question to answer, and it works
 *      in English and Swahili because this market writes both;
 *   2. map that field onto the design families that hiring managers in it
 *      actually expect, then pick real, renderable templates from the registry.
 *
 * Nothing here hardcodes a template id as a *requirement*: if a template is
 * renamed or removed on the web, the suggestion just resolves to a different
 * one instead of pointing at a design that no longer exists.
 */

import { ALL_TEMPLATES, type CvTemplateMeta } from "./cv-html";
import type { Lang } from "./i18n";

/** The career fields the app already knows about (see lib/career-fields.ts). */
export type CareerField = string;

/**
 * Keyword → field. Bilingual on purpose: a Dar es Salaam user writes "udereva"
 * as often as "driver". Longer/more specific terms are scored higher by
 * `inferField`, so "software engineer" beats a bare "engineer".
 */
const KEYWORDS: Record<CareerField, string[]> = {
  "it-software": ["software", "developer", "programmer", "web", "devops", "it support", "ict", "database", "cyber", "systems", "data scientist", "data analyst", "data engineer", "product manager", "product lead", "product designer", "ux", "ui ", "qa engineer", "frontend", "backend", "full stack", "analytics", "programu", "mtandao", "teknolojia", "kompyuta"],
  engineering: ["engineer", "engineering", "civil", "mechanical", "electrical", "structural", "cad", "uhandisi"],
  healthcare: ["nurse", "nursing", "clinical", "medical", "doctor", "pharmacy", "pharmacist", "midwife", "health", "hospital", "muuguzi", "daktari", "afya", "hospitali", "famasi"],
  education: ["teacher", "teaching", "tutor", "lecturer", "school", "education", "curriculum", "mwalimu", "elimu", "shule", "kufundisha"],
  "finance-accounting": ["accountant", "accounting", "finance", "audit", "bookkeep", "payroll", "tax", "cpa", "treasury", "uhasibu", "fedha", "kodi", "hesabu"],
  "sales-retail": ["sales", "retail", "shop", "shopkeeper", "cashier", "merchandis", "store", "account executive", "account manager", "business development", "key account", "duka", "mauzo", "muuzaji", "bidhaa"],
  "marketing-comms": ["marketing", "brand", "social media", "content", "communications", "pr ", "seo", "campaign", "creative", "digital marketing", "masoko", "utangazaji", "matangazo"],
  "customer-service": ["customer service", "customer success", "customer support", "call centre", "call center", "support agent", "helpdesk", "help desk", "reception", "front desk", "huduma kwa mteja", "mapokezi"],
  "admin-office": ["admin", "administrat", "secretary", "office", "clerk", "data entry", "executive assistant", "operations", "coordinator", "katibu", "ofisi", "utawala", "karani"],
  "logistics-transport": ["logistics", "supply chain", "warehouse", "procurement", "freight", "clearance", "inventory", "stores", "usafirishaji", "ghala", "manunuzi", "ugavi"],
  driving: ["driver", "driving", "chauffeur", "truck", "lorry", "delivery", "courier", "boda", "dereva", "udereva", "malori", "usafiri"],
  security: ["security", "guard", "military", "police", "surveillance", "security officer", "ulinzi", "mlinzi", "polisi", "jeshi"],
  "hospitality-food": ["chef", "cook", "waiter", "waitress", "barista", "housekeep", "hotel", "restaurant", "kitchen", "bar ", "mpishi", "hoteli", "mgahawa", "jikoni"],
  "beauty-wellness": ["beauty", "salon", "barber", "hairdress", "cosmetolog", "spa", "massage", "nail", "makeup", "saluni", "kinyozi", "urembo"],
  "construction-trades": ["construction", "mason", "welder", "plumber", "electrician", "carpenter", "painter", "site", "foreman", "ujenzi", "fundi", "seremala", "umeme"],
  manufacturing: ["manufactur", "production", "factory", "machine operator", "quality control", "assembly", "plant", "uzalishaji", "kiwanda", "mitambo"],
  agriculture: ["farm", "agricultur", "agronom", "livestock", "crop", "irrigation", "poultry", "kilimo", "shamba", "mifugo", "mkulima"],
  "hr-people": ["hr ", "human resource", "recruit", "talent", "people operations", "training officer", "utaalamu wa watu", "rasilimali watu", "ajira"],
  "general-labour": ["labour", "laborer", "cleaner", "porter", "loader", "casual", "helper", "groundsman", "kibarua", "msaidizi", "usafi"],
  "business-owner": ["owner", "founder", "entrepreneur", "business owner", "managing director", "proprietor", "mmiliki", "mfanyabiashara", "biashara yangu"],
};

/** Meta options in career-fields.ts that are not real job families. */
const NON_FIELDS = new Set(["new", "self"]);

/**
 * Which design families suit which field, and the honest one-line reason shown
 * to the user. Two families each: one "safe" and one with more personality.
 */
const FIELD_STYLES: Record<CareerField, { styles: string[]; why: { en: string; sw: string } }> = {
  "it-software": {
    styles: ["creative", "minimal"],
    why: { en: "Tech hiring reads for tools, projects and links. Creative and minimal layouts carry both without clutter.", sw: "Ajira za teknolojia zinasoma zana, miradi na viungo. Miundo ya kibunifu na sahili inabeba vyote bila msongamano." },
  },
  engineering: {
    styles: ["classic", "header"],
    why: { en: "Engineering CVs get scanned for qualifications and certifications. Classic keeps that order obvious.", sw: "CV za uhandisi zinatafutwa sifa na vyeti. Muundo wa kawaida unaweka mpangilio huo wazi." },
  },
  healthcare: {
    styles: ["classic", "minimal"],
    why: { en: "Clinical work needs licences and dates to be unmissable. Plain, high-contrast layouts read fastest.", sw: "Kazi za afya zinahitaji leseni na tarehe zisionekane kwa shida. Miundo safi yenye utofautishaji inasoma haraka." },
  },
  education: {
    styles: ["minimal", "classic"],
    why: { en: "Teaching CVs are read by panels who want subjects, classes and results. Minimal gives them room.", sw: "CV za ualimu zinasomwa na paneli zinazotaka masomo, madarasa na matokeo. Muundo sahili unawapa nafasi." },
  },
  "finance-accounting": {
    styles: ["classic", "minimal"],
    why: { en: "Finance screens hard on precision. A conventional, uncluttered layout signals that.", sw: "Fani ya fedha inatafuta usahihi. Muundo wa kawaida na safi unaonyesha hilo." },
  },
  "sales-retail": {
    styles: ["header", "sidebar"],
    why: { en: "Sales is about numbers and presence. A strong header puts your name and record up front.", sw: "Mauzo ni namba na uwepo. Kichwa kikubwa kinaweka jina lako na rekodi mbele." },
  },
  "marketing-comms": {
    styles: ["creative", "header"],
    why: { en: "A marketing CV is itself a work sample. Creative layouts are read as evidence, not decoration.", sw: "CV ya masoko yenyewe ni sampuli ya kazi. Miundo ya kibunifu inasomwa kama ushahidi, si mapambo." },
  },
  "customer-service": {
    styles: ["header", "minimal"],
    why: { en: "Service roles hire on tone and languages. A clean header surfaces both immediately.", sw: "Kazi za huduma zinaajiri kwa tabia na lugha. Kichwa safi kinaonyesha vyote mara moja." },
  },
  "admin-office": {
    styles: ["minimal", "classic"],
    why: { en: "Admin work is judged on organisation. A tidy, consistent layout is the whole argument.", sw: "Kazi za utawala zinapimwa kwa mpangilio. Muundo nadhifu na unaofanana ni hoja yenyewe." },
  },
  "logistics-transport": {
    styles: ["sidebar", "header"],
    why: { en: "Logistics CVs are scanned for routes, volumes and systems. A sidebar keeps skills visible.", sw: "CV za usafirishaji zinatafutwa njia, kiasi na mifumo. Upande wa pembeni unaweka ujuzi wazi." },
  },
  driving: {
    styles: ["classic", "minimal"],
    why: { en: "Driving roles check licences, classes and clean-record dates first. Keep it plain and dated.", sw: "Kazi za udereva zinakagua leseni, madaraja na rekodi safi kwanza. Weka wazi na tarehe." },
  },
  security: {
    styles: ["classic", "header"],
    why: { en: "Security work verifies training, clearance and reliability. Plain and formal reads as credible.", sw: "Kazi za ulinzi zinahitaji mafunzo, vibali na uaminifu. Muundo wa kawaida na rasmi unaaminika." },
  },
  "hospitality-food": {
    styles: ["header", "creative"],
    why: { en: "Hospitality hires on pace and presentation. A warm, confident header fits the industry.", sw: "Ukumbi na jikoni zinaajiri kwa kasi na muonekano. Kichwa chenye joto na ujasiri kinatoshea sekta." },
  },
  "beauty-wellness": {
    styles: ["creative", "header"],
    why: { en: "This industry sells your eye. A designed CV is part of the pitch.", sw: "Sekta hii inauza macho yako. CV iliyoundwa ni sehemu ya tangazo." },
  },
  "construction-trades": {
    styles: ["classic", "minimal"],
    why: { en: "Trades CVs get read on site and by quantity surveyors. Plain, printable, no fuss.", sw: "CV za ufundi zinasomwa site na wakaguzi. Rahisi, inachapishika, bila usumbufu." },
  },
  manufacturing: {
    styles: ["classic", "header"],
    why: { en: "Plant roles screen for machines, safety and shift experience. Structure beats styling.", sw: "Kazi za kiwanda zinatafuta mitambo, usalama na uzoefu wa zamu. Muundo unashinda mapambo." },
  },
  agriculture: {
    styles: ["classic", "minimal"],
    why: { en: "Agri CVs list land, yields, seasons and equipment. Keep the dates and numbers readable.", sw: "CV za kilimo zinaorodhesha ardhi, mavuno, misimu na vifaa. Weka tarehe na namba zisomeke." },
  },
  "hr-people": {
    styles: ["minimal", "classic"],
    why: { en: "You are the first CV the panel reads. Restraint is the strongest signal here.", sw: "Wewe ni CV ya kwanza paneli inasoma. Kujizuia ni ishara yenye nguvu hapa." },
  },
  "general-labour": {
    styles: ["classic", "minimal"],
    why: { en: "Straightforward, printable and honest. Many employers here print on a shared machine.", sw: "Rahisi, inachapishika na ya uaminifu. Waajiri wengi hapa wanachapisha kwa mashine ya pamoja." },
  },
  "business-owner": {
    styles: ["header", "sidebar"],
    why: { en: "An owner's CV is a track record. Put the business and the numbers up top.", sw: "CV ya mmiliki ni rekodi ya mafanikio. Weka biashara na namba juu." },
  },
};

/**
 * Templates I have actually rendered and read. Used to break ties inside a
 * style family so the first suggestion is never an arbitrary alphabetical one.
 */
const VERIFIED_PICKS = ["aberdare", "apex", "altus", "aurora-two", "axis", "meridian", "athena"];

/**
 * Guesses the career field from free text. Returns null when nothing matches —
 * the caller should then show no recommendation rather than a wrong one.
 */
export function inferField(text: string | null | undefined): CareerField | null {
  const hay = (text ?? "").toLowerCase();
  if (!hay.trim()) return null;

  let best: CareerField | null = null;
  let bestScore = 0;

  for (const [field, words] of Object.entries(KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (!hay.includes(w)) continue;
      // A longer, more specific term is stronger evidence than a short one:
      // "software engineer" should beat a bare "engineer".
      score += Math.max(1, w.trim().length - 3);
    }
    if (score > bestScore) {
      bestScore = score;
      best = field;
    }
  }

  return bestScore > 0 ? best : null;
}

/** Templates that suit a field, best first. Never returns a design the app
 *  cannot actually render. */
export function suggestTemplates(
  text: string | null | undefined,
  limit = 6,
): { templates: CvTemplateMeta[]; field: CareerField; why: { en: string; sw: string } } | null {
  const field = inferField(text);
  if (!field) return null;
  const rule = FIELD_STYLES[field];
  if (!rule) return null;

  const renderable = ALL_TEMPLATES.filter((t) => t.style && rule.styles.includes(t.style));
  if (!renderable.length) return null;

  const rank = (t: CvTemplateMeta) => {
    const verified = VERIFIED_PICKS.indexOf(t.id);
    const styleRank = rule.styles.indexOf(t.style ?? "");
    // Verified picks first, in their listed order; then by how well the family
    // matches; then free before premium (a suggestion should not be a paywall).
    return [verified === -1 ? 99 : verified, styleRank, t.tier === "premium" ? 1 : 0];
  };

  const templates = [...renderable]
    .sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit);

  return { templates, field, why: rule.why };
}

/** Human-facing label for a suggested field, in the requested language. */
export function fieldLabel(field: CareerField, lang: Lang = "en"): string {
  const LABELS: Record<string, { en: string; sw: string }> = {
    "it-software": { en: "IT & software", sw: "TEHAMA na programu" },
    engineering: { en: "Engineering", sw: "Uhandisi" },
    healthcare: { en: "Health", sw: "Afya" },
    education: { en: "Education", sw: "Elimu" },
    "finance-accounting": { en: "Finance & accounting", sw: "Fedha na uhasibu" },
    "sales-retail": { en: "Sales & retail", sw: "Mauzo na rejareja" },
    "marketing-comms": { en: "Marketing & comms", sw: "Masoko na mawasiliano" },
    "customer-service": { en: "Customer service", sw: "Huduma kwa mteja" },
    "admin-office": { en: "Admin & office", sw: "Utawala na ofisi" },
    "logistics-transport": { en: "Logistics", sw: "Usafirishaji na ugavi" },
    driving: { en: "Driving", sw: "Udereva" },
    security: { en: "Security", sw: "Ulinzi" },
    "hospitality-food": { en: "Hospitality & food", sw: "Hoteli na jikoni" },
    "beauty-wellness": { en: "Beauty & wellness", sw: "Urembo na afya" },
    "construction-trades": { en: "Construction & trades", sw: "Ujenzi na ufundi" },
    manufacturing: { en: "Manufacturing", sw: "Uzalishaji" },
    agriculture: { en: "Agriculture", sw: "Kilimo" },
    "hr-people": { en: "HR & people", sw: "Rasilimali watu" },
    "general-labour": { en: "General work", sw: "Kazi za jumla" },
    "business-owner": { en: "Business owner", sw: "Mmiliki wa biashara" },
  };
  const l = LABELS[field];
  if (!l) return field;
  return lang === "sw" ? l.sw : l.en;
}

export { NON_FIELDS, FIELD_STYLES, KEYWORDS };
