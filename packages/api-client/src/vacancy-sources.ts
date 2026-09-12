/**
 * Verified vacancy sources — the ONLY places Sumaiya may name when a user asks
 * where to look for work.
 *
 * Why this file exists: a job seeker's first question is "where do I even
 * find vacancies?", and an AI that invents job sites (or dead ones) burns the
 * trust the whole app runs on. Every source below was loaded and checked by
 * hand — real page, real Tanzanian adverts, live URL. Add nothing here without
 * opening it first.
 *
 * Shared by web + native so the answer to "where do I look?" is identical
 * everywhere Sumaiya speaks.
 */
export type VacancySourceKind = "government" | "private" | "ngo";

export interface VacancySource {
  id: string;
  /** Live, verified URL. */
  url: string;
  kind: VacancySourceKind;
  name: { en: string; sw: string };
  note: { en: string; sw: string };
}

export const VACANCY_SOURCES: VacancySource[] = [
  {
    id: "ajira-portal",
    url: "https://portal.ajira.go.tz",
    kind: "government",
    name: { en: "Ajira Portal (PSRS)", sw: "Ajira Portal (Utumishi)" },
    note: {
      en: "Government vacancies — the official Public Service Recruitment Secretariat portal.",
      sw: "Nafasi za serikali — tovuti rasmi ya Sekretarieti ya Ajira (Utumishi).",
    },
  },
  {
    id: "brightermonday",
    url: "https://www.brightermonday.co.tz/jobs",
    kind: "private",
    name: { en: "BrighterMonday Tanzania", sw: "BrighterMonday Tanzania" },
    note: {
      en: "The biggest private-sector job board in the country.",
      sw: "Tovuti kubwa zaidi ya nafasi za sekta binafsi nchini.",
    },
  },
  {
    id: "jobwebtanzania",
    url: "https://www.jobwebtanzania.com/jobs",
    kind: "private",
    name: { en: "JobwebTanzania", sw: "JobwebTanzania" },
    note: {
      en: "Daily private-sector adverts, with the full advert text on the page.",
      sw: "Matangazo ya sekta binafsi kila siku, yenye maelezo kamili ya tangazo.",
    },
  },
  {
    id: "fuzu",
    url: "https://www.fuzu.com",
    kind: "private",
    name: { en: "Fuzu", sw: "Fuzu" },
    note: {
      en: "Regional board — strong on graduate, sales and operations roles.",
      sw: "Tovuti ya kanda — ina nafasi nyingi za wahitimu, mauzo na uendeshaji.",
    },
  },
  {
    id: "mabumbe",
    url: "https://www.mabumbe.com/ajira",
    kind: "government",
    name: { en: "Mabumbe — Ajira Go Tz", sw: "Mabumbe — Ajira Go Tz" },
    note: {
      en: "Collects government (Ajira Go Tz) adverts in one readable place.",
      sw: "Hukusanya matangazo ya serikali (Ajira Go Tz) sehemu moja.",
    },
  },
  {
    id: "reliefweb",
    url: "https://reliefweb.int/jobs",
    kind: "ngo",
    name: { en: "ReliefWeb Jobs", sw: "ReliefWeb Jobs" },
    note: {
      en: "UN, NGO and humanitarian roles — filter the list by Tanzania.",
      sw: "Nafasi za UN, NGO na misaada — chuja orodha kwa Tanzania.",
    },
  },
];

/**
 * Where the work is announced OFF the internet. Nothing to link to, and
 * exactly what most first-job seekers miss.
 */
export const VACANCY_OFFLINE = {
  en: "Many jobs are never put online. Go and look at the notice board at these places: the district council, the ward office, VETA, colleges, churches and mosques, and the job pages of newspapers like Mwananchi, Uhuru and The Guardian. Or you can try searching the sites above.",
  sw: "Kazi nyingi haziwekwi mtandaoni. Pitia kwenye ubao wa matangazo wa sehemu zifuatazo: halmashauri ya wilaya, ofisi ya kata, VETA, vyuo, makanisa na misikiti, na kurasa za kazi za magazeti kama Mwananchi, Uhuru na The Guardian. Au unaweza kujaribu kutafuta kwenye tovuti zilizo juu.",
} as const;
