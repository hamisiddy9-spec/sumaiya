import { createEmptyCVData, type CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";

/**
 * A complete, realistic sample CV used for the "Start from an example" flow, so
 * a first-time user sees a finished CV in a beautiful template instead of a
 * blank form.
 *
 * **Tanzanian on purpose.** This used to be a Kenyan senior software engineer
 * ("Amara Osei", Nairobi, `+254`, University of Nairobi, "products used by more
 * than a million people worldwide"). A stranger reading the homepage cold — the
 * brand review read it as a 24-year-old in Dar es Salaam — saw a Nairobi phone
 * number and concluded the product was not for her. An Africa-first product
 * cannot open with another country's example. So the persona is now an
 * early-career office administrator in Dar es Salaam, with a VETA diploma and
 * TZS-scale work, which is what most of the audience actually is: employed
 * informally or between jobs and looking for something better.
 *
 * No photo is included on purpose — the example is about the content, and users
 * add their own portrait.
 *
 * Localised: Swahili users get a Swahili example, so it reads as *their* CV.
 */
function sampleEn(): CVData {
  return {
    ...createEmptyCVData(),
    personal: {
      fullName: "Neema Joseph",
      jobTitle: "Office Administrator",
      email: "neema.joseph@gmail.com",
      phone: "+255 712 345 678",
      location: "Dar es Salaam, Tanzania",
      linkedin: "",
      website: "",
      photo: "",
    },
    summary:
      "Office administrator with three years' experience supporting a busy sales team. I keep records in order, handle customer enquiries on the phone and in person, and prepare the daily sales and stock reports in Excel. I work on my own initiative and I learn new systems quickly.",
    experience: [
      {
        id: "_x1",
        company: "Kilimanjaro Retail Ltd",
        position: "Office Administrator",
        location: "Dar es Salaam, Tanzania",
        startDate: "2023-03",
        endDate: "",
        current: true,
        description:
          "Keep daily sales, stock and staff records for a shop with 12 employees.\nPrepare the weekly stock and sales report in Excel for the manager.\nHandle customer enquiries and follow up supplier orders by phone and WhatsApp.",
      },
      {
        id: "_x2",
        company: "Pamoja Distributors",
        position: "Sales Assistant",
        location: "Mwanza, Tanzania",
        startDate: "2021-06",
        endDate: "2023-01",
        current: false,
        description:
          "Served more than 30 customers a day and balanced the till at closing.\nRecorded stock received and reported shortages to the supervisor.\nTrained two new shop assistants on the till and the stock book.",
      },
    ],
    education: [
      {
        id: "_ed1",
        institution: "VETA — Chuo cha Ufundi",
        degree: "Diploma (NTA Level 6)",
        field: "Business Administration",
        startDate: "2019-09",
        endDate: "2021-05",
        grade: "Credit",
        description: "",
      },
    ],
    skills: [
      { id: "_s1", name: "Excel / Spreadsheets", level: 5 },
      { id: "_s2", name: "Record keeping", level: 5 },
      { id: "_s3", name: "Customer service", level: 4 },
      { id: "_s4", name: "Stock control", level: 4 },
      { id: "_s5", name: "QuickBooks", level: 3 },
    ],
    languages: [
      { id: "_l1", name: "Kiswahili", proficiency: "Native" },
      { id: "_l2", name: "English", proficiency: "Intermediate" },
    ],
    certifications: [
      { id: "_c1", name: "Computer & Excel Certificate", issuer: "VETA", date: "2021-07", url: "" },
    ],
    hobbies: "Community football, church choir, reading",
  };
}

function sampleSw(): CVData {
  const base = sampleEn();
  return {
    ...base,
    personal: { ...base.personal, jobTitle: "Msimamizi wa Ofisi" },
    summary:
      "Msimamizi wa ofisi mwenye uzoefu wa miaka mitatu nikisaidia timu ya mauzo yenye shughuli nyingi. Ninalinda kumbukumbu zote kwa mpangilio, ninahudumia wateja kwa simu na ana kwa ana, na naandaa ripoti za mauzo na bidhaa za kila siku kwa Excel. Nafanya kazi kwa juhudi zangu mwenyewe na najifunza mifumo mipya haraka.",
    experience: [
      {
        ...base.experience[0],
        position: "Msimamizi wa Ofisi",
        description:
          "Ninalinda kumbukumbu za mauzo, bidhaa na wafanyakazi wa kila siku kwa duka lenye wafanyakazi 12.\nNaandaa ripoti ya bidhaa na mauzo ya kila wiki kwa Excel kwa meneja.\nNahudumia wateja na kufuatilia oda za wauzaji kwa simu na WhatsApp.",
      },
      {
        ...base.experience[1],
        position: "Msaidizi wa Mauzo",
        description:
          "Nilihudumia wateja zaidi ya 30 kwa siku na kuhesabu fedha za duka kila jioni.\nNilirekodi bidhaa zilizoingia na kuripoti upungufu kwa msimamizi.\nNiliwafunza wasaidizi wawili wapya jinsi ya kutumia mashine ya fedha na kitabu cha bidhaa.",
      },
    ],
    education: [
      {
        ...base.education[0],
        degree: "Stashahada (NTA Level 6)",
        field: "Utawala wa Biashara",
        grade: "Credit",
      },
    ],
    skills: [
      { id: "_s1", name: "Excel / Majedwali", level: 5 },
      { id: "_s2", name: "Utunzaji wa kumbukumbu", level: 5 },
      { id: "_s3", name: "Huduma kwa wateja", level: 4 },
      { id: "_s4", name: "Usimamizi wa bidhaa", level: 4 },
      { id: "_s5", name: "QuickBooks", level: 3 },
    ],
    // The five proficiency tokens are a closed enum the templates map to level
    // bars (PROF[lang.proficiency] ?? 2), so they stay as-is in both languages —
    // swapping in Swahili words here would silently drop every language to 2 bars.
    languages: [
      { id: "_l1", name: "Kiswahili", proficiency: "Native" },
      { id: "_l2", name: "Kiingereza", proficiency: "Intermediate" },
    ],
    certifications: [
      { id: "_c1", name: "Cheti cha Kompyuta na Excel", issuer: "VETA", date: "2021-07", url: "" },
    ],
    hobbies: "Mpira wa miguu wa jamii, kwaya ya kanisa, kusoma",
  };
}

export function getSampleCV(lang: Lang = "en"): CVData {
  return lang === "sw" ? sampleSw() : sampleEn();
}
