// Social proof for the landing page.
//
// ⚠️ REPLACE THESE WITH REAL ONES before relying on them for conversion.
// Every entry must be a real person who gave permission — a first name, their
// city, and a specific outcome. Fabricated testimonials are worse than none:
// they're a trust risk if noticed and they attract nobody. Until you have
// real quotes, keep this list SHORT (or empty — the section hides itself).

export interface Testimonial {
  quote: { en: string; sw: string };
  name: string;
  detail: { en: string; sw: string };
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: {
      en: "I had no idea how to lay out a CV. Sumaiya wrote each section from a few notes and I had three callbacks in two weeks.",
      sw: "Sikujua namna ya kupanga CV. Sumaiya aliandika kila sehemu kutoka maelezo machache na nikapata simu tatu ndani ya wiki mbili.",
    },
    name: "Amina",
    detail: { en: "Marketing assistant · Dar es Salaam", sw: "Msaidizi wa masoko · Dar es Salaam" },
  },
  {
    quote: {
      en: "The ATS checker told me exactly what was missing. Fixed it, re-downloaded, got the interview.",
      sw: "Kikagua cha ATS kiliniambia hasa kilichokosekana. Nilirekebisha, nikapakua tena, nikapata mahojiano.",
    },
    name: "Brian",
    detail: { en: "Logistics · Nairobi", sw: "Usafirishaji · Nairobi" },
  },
  {
    quote: {
      en: "Did the whole thing on my phone during lunch. Free, in Swahili, and it actually looked professional.",
      sw: "Nilifanya yote kwenye simu wakati wa chakula cha mchana. Bure, kwa Kiswahili, na ilionekana ya kitaalamu kweli.",
    },
    name: "Faith",
    detail: { en: "Nursing graduate · Mwanza", sw: "Mhitimu wa uuguzi · Mwanza" },
  },
];

// ⚠️ REPLACE with the real number (round down, don't inflate). Set to 0 to hide.
export const CVS_CREATED = 0;
