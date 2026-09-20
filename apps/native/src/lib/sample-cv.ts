import type { CV } from "@sumaiya/types";

/**
 * A realistic sample CV used to render template previews.
 *
 * Template galleries (Canva, Enhancv, Resume.io) all show designs filled with
 * a sample persona, not the user's own data: a full example shows every section
 * the template supports, keeps the comparison fair across designs, and never
 * leaks the user's real details into a public preview.
 *
 * ONE source, two languages. The structure — ids, dates, skill levels, the
 * persona's identity — is built once in `build()`; only the words a reader sees
 * live in the EN/SW word tables. This replaces a single English `SAMPLE_CV`
 * constant, which is how a gallery of 224 designs came to render an English
 * sample CV inside a Swahili session: the thumbnail hardcoded `lang: "en"`.
 * Every caller must now name the language it is rendering for.
 */

export type SampleLang = "en" | "sw";

/** The per-language words. Anything not here (names, companies, dates,
 *  education institution) is shared so the two renderings cannot drift apart. */
interface SampleWords {
  headline: string;
  summary: string;
  /** Printed as the end date of the current role. */
  present: string;
  role1: string;
  role2: string;
  exp1: string;
  exp1k1: string;
  exp1k2: string;
  exp2: string;
  exp2k: string;
  degree: string;
  field: string;
  skills: [string, string, string, string];
  /** Language NAMES only. The proficiency values stay "native"/"fluent" in both
   *  languages: they are an enum the templates map to level bars, so translating
   *  them would silently drop every language to the default. */
  langNames: [string, string];
}

const EN: SampleWords = {
  headline: "Storekeeper & Operations Lead",
  summary:
    "Detail-oriented storekeeper with 6+ years managing inventory, stock reconciliation and supplier coordination across retail and wholesale operations.",
  present: "Present",
  role1: "Senior Storekeeper",
  role2: "Storekeeper",
  exp1: "Managed a 2,000-SKU warehouse and cut stock variance from 4.1% to 1.2% through weekly cycle counts.",
  exp1k1: "Reduced stock variance by 70%",
  exp1k2: "Trained a team of 4 assistants",
  exp2: "Received, recorded and issued stock; kept accurate bin cards and daily stock reports.",
  exp2k: "Introduced daily reconciliation reports",
  degree: "Diploma",
  field: "Procurement & Logistics",
  skills: ["Inventory Management", "Excel", "Stock Reconciliation", "Supplier Coordination"],
  langNames: ["Swahili", "English"],
};

const SW: SampleWords = {
  headline: "Mfanyakazi wa Ghala na Usimamizi wa Bidhaa",
  summary:
    "Mfanyakazi wa ghala mwenye uzoefu wa zaidi ya miaka 6 katika kusimamia bidhaa, kuoanisha hesabu za stoo na kuratibu wauzaji katika biashara za rejareja na jumla.",
  present: "Sasa",
  role1: "Mfanyakazi Mkuu wa Ghala",
  role2: "Mfanyakazi wa Ghala",
  exp1: "Nilisimamia ghala lenye aina 2,000 za bidhaa na kupunguza tofauti ya stoo kutoka 4.1% hadi 1.2% kwa kuhesabu bidhaa kila wiki.",
  exp1k1: "Nilipunguza tofauti ya stoo kwa 70%",
  exp1k2: "Nilifunza timu ya wasaidizi 4",
  exp2: "Nilipokea, nilirekodi na kutoa bidhaa; niliweka kadi za rafu na ripoti za stoo za kila siku.",
  exp2k: "Nilianzisha ripoti za uoanishaji wa kila siku",
  degree: "Stashahada",
  field: "Manunuzi na Usafirishaji",
  skills: ["Usimamizi wa Bidhaa", "Excel", "Uoanishaji wa Stoo", "Uratibu wa Wauzaji"],
  langNames: ["Kiswahili", "Kiingereza"],
};

function build(w: SampleWords): CV {
  return {
    id: "sample-preview",
    userId: "sample",
    templateId: "nakuru",
    title: "Amina Hassan",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    data: {
      personalInfo: {
        fullName: "Amina Hassan",
        email: "amina@example.com",
        phone: "+255 712 345 678",
        location: "Dar es Salaam, Tanzania",
        headline: w.headline,
      },
      summary: w.summary,
      experience: [
        {
          id: "s1",
          title: w.role1,
          company: "Kilimanjaro Retail Ltd",
          startDate: "2021-03",
          endDate: w.present,
          description: w.exp1,
          keyAchievements: [w.exp1k1, w.exp1k2],
        },
        {
          id: "s2",
          title: w.role2,
          company: "Zanzibar Trading Co",
          startDate: "2018-06",
          endDate: "2021-02",
          description: w.exp2,
          keyAchievements: [w.exp2k],
        },
      ],
      education: [
        {
          id: "e1",
          institution: "Dar es Salaam Institute of Technology",
          degree: w.degree,
          field: w.field,
          graduationDate: "2017",
        },
      ],
      skills: [
        { id: "k1", name: w.skills[0], level: "expert" },
        { id: "k2", name: w.skills[1], level: "advanced" },
        { id: "k3", name: w.skills[2], level: "advanced" },
        { id: "k4", name: w.skills[3], level: "intermediate" },
      ],
      certifications: [],
      languages: [
        { id: "l1", language: w.langNames[0], proficiency: "native" },
        { id: "l2", language: w.langNames[1], proficiency: "fluent" },
      ],
    },
  };
}

/** The sample CV in the reader's language. Deliberately NO English-only export:
 *  a default-language constant is what the gallery reached for when it wanted a
 *  thumbnail, and every design then previewed an English CV to a Swahili user. */
export function sampleCv(lang: SampleLang = "en"): CV {
  return build(lang === "sw" ? SW : EN);
}
