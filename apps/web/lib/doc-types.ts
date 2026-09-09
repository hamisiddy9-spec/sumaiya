import type { IconName } from "@/components/ui/icon";

/** The four things a user can create. One source of truth so every "Create"
 *  affordance (dashboard menu, mobile create sheet, landing grid) offers the
 *  same set and routes the same way — `/editor/<type>/new` creates the doc and
 *  redirects to its real id. */
export interface DocType {
  id: "cv" | "cover-letter" | "business-card" | "letter";
  icon: IconName;
  href: string;
  en: string;
  sw: string;
  blurbEn: string;
  blurbSw: string;
}

export const DOC_TYPES: DocType[] = [
  { id: "cv",            icon: "cv",     href: "/editor/cv/new",            en: "CV / Résumé",   sw: "CV",               blurbEn: "Recruiter-ready, ATS-friendly", blurbSw: "Tayari kwa waajiri, rafiki kwa ATS" },
  { id: "cover-letter",  icon: "mail",   href: "/editor/cover-letter/new",  en: "Cover Letter",  sw: "Barua ya Maombi",  blurbEn: "Matched to the job",            blurbSw: "Inayolingana na kazi" },
  { id: "business-card", icon: "card",   href: "/editor/business-card/new", en: "Business Card", sw: "Kadi ya Biashara", blurbEn: "Print-ready contact card",      blurbSw: "Kadi ya mawasiliano" },
  { id: "letter",        icon: "letter", href: "/editor/letter/new",        en: "Formal Letter", sw: "Barua Rasmi",      blurbEn: "Official correspondence",       blurbSw: "Mawasiliano rasmi" },
];
