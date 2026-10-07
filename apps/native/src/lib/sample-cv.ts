import type { CV, CVData } from "@sumaiya/types";

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
 *
 * Deliberately full-length: 3 roles with achievement bullets, 2 education
 * entries, certifications, projects and referees, so a preview shows a design
 * at the density a real CV actually reaches — not a mostly-blank page. Every
 * name, employer, school and figure here is invented and generic on purpose.
 */

export type SampleLang = "en" | "sw";

/** `projects`/`referees`/`hobbies` exist in the native rendering engine (see
 *  `cv-engine/view.ts`) but not in the shared `CVData` type, which mirrors only
 *  what the app's own editor persists. A preview is free to use the fuller
 *  shape the engine already reads via duck typing. */
type PreviewCVData = CVData & {
  projects?: { id: string; name: string; role: string; date: string; description: string }[];
  referees?: { id: string; name: string; title: string; company: string; email: string; phone: string }[];
  hobbies?: string;
};

/** The per-language words. Anything not here (names, companies, dates,
 *  institutions, contact details) is shared so the two renderings cannot drift apart. */
interface SampleWords {
  headline: string;
  summary: string;
  /** Printed as the end date of the current role. */
  present: string;
  role1: string;
  role2: string;
  role3: string;
  exp1: string;
  exp1k1: string;
  exp1k2: string;
  exp1k3: string;
  exp2: string;
  exp2k1: string;
  exp2k2: string;
  exp3: string;
  exp3k1: string;
  exp3k2: string;
  degree1: string;
  field1: string;
  degree2: string;
  field2: string;
  skills: [string, string, string, string, string, string];
  /** Language NAMES only. The proficiency values stay "native"/"fluent" in both
   *  languages: they are an enum the templates map to level bars, so translating
   *  them would silently drop every language to the default. */
  langNames: [string, string];
  cert1: string;
  cert2: string;
  project1Name: string;
  project1Role: string;
  project1Desc: string;
  project2Name: string;
  project2Role: string;
  project2Desc: string;
  referee1Title: string;
  referee2Title: string;
  hobbies: string;
}

const EN: SampleWords = {
  headline: "Storekeeper & Operations Lead",
  summary:
    "Detail-oriented storekeeper with 6+ years managing inventory, stock reconciliation and supplier coordination across retail and wholesale operations. Known for turning messy stock rooms into audited, low-variance systems, and for training junior staff to keep them that way. Comfortable running a single depot or coordinating stock across several branches at once.",
  present: "Present",
  role1: "Senior Storekeeper",
  role2: "Storekeeper",
  role3: "Stock Clerk",
  exp1: "Managed a 2,000-SKU warehouse and cut stock variance from 4.1% to 1.2% through weekly cycle counts.",
  exp1k1: "Reduced stock variance by 70%",
  exp1k2: "Trained a team of 4 assistants",
  exp1k3: "Rolled out a barcode scanning system that cut receiving time by a third",
  exp2: "Received, recorded and issued stock; kept accurate bin cards and daily stock reports.",
  exp2k1: "Introduced daily reconciliation reports",
  exp2k2: "Cut order-picking errors by half within six months",
  exp3: "Supported day-to-day receiving and dispatch for a 3-branch wholesale operation, keeping stock cards up to date by hand.",
  exp3k1: "Flagged a supplier short-delivery pattern that recovered TZS 1.2m in credits",
  exp3k2: "Kept zero missed dispatch deadlines over an 18-month period",
  degree1: "Diploma",
  field1: "Procurement & Logistics",
  degree2: "Advanced Certificate of Secondary Education",
  field2: "General Sciences",
  skills: [
    "Inventory Management",
    "Excel",
    "Stock Reconciliation",
    "Supplier Coordination",
    "Warehouse Management Systems",
    "Team Leadership",
  ],
  langNames: ["Swahili", "English"],
  cert1: "Certificate in Warehouse & Inventory Management",
  cert2: "Occupational First Aid",
  project1Name: "Warehouse Digitisation Pilot",
  project1Role: "Project Lead",
  project1Desc:
    "Piloted a tablet-based stock system across one depot, replacing paper bin cards and cutting month-end counting time from two days to half a day.",
  project2Name: "Regional Stock Audit",
  project2Role: "Team Member",
  project2Desc:
    "Joined a three-branch audit that reconciled 18,000 line items and identified TZS 6.4m in unrecorded stock.",
  referee1Title: "Regional Operations Director",
  referee2Title: "Warehouse Manager",
  hobbies: "Netball, community volunteering, reading",
};

const SW: SampleWords = {
  headline: "Mfanyakazi wa Ghala na Usimamizi wa Bidhaa",
  summary:
    "Mfanyakazi wa ghala mwenye uzoefu wa zaidi ya miaka 6 katika kusimamia bidhaa, kuoanisha hesabu za stoo na kuratibu wauzaji katika biashara za rejareja na jumla. Ninajulikana kwa kubadilisha vyumba vya stoo vyenye mkanganyiko kuwa mifumo iliyokaguliwa na yenye tofauti ndogo, na kufunza wafanyakazi wapya kuiendeleza hali hiyo. Ninafanya kazi vizuri iwe ni ghala moja au kuratibu stoo za matawi kadhaa kwa wakati mmoja.",
  present: "Sasa",
  role1: "Mfanyakazi Mkuu wa Ghala",
  role2: "Mfanyakazi wa Ghala",
  role3: "Karani wa Stoo",
  exp1: "Nilisimamia ghala lenye aina 2,000 za bidhaa na kupunguza tofauti ya stoo kutoka 4.1% hadi 1.2% kwa kuhesabu bidhaa kila wiki.",
  exp1k1: "Nilipunguza tofauti ya stoo kwa 70%",
  exp1k2: "Nilifunza timu ya wasaidizi 4",
  exp1k3: "Niliweka mfumo wa kusoma bakodi uliopunguza muda wa kupokea bidhaa kwa theluthi moja",
  exp2: "Nilipokea, nilirekodi na kutoa bidhaa; niliweka kadi za rafu na ripoti za stoo za kila siku.",
  exp2k1: "Nilianzisha ripoti za uoanishaji wa kila siku",
  exp2k2: "Nilipunguza makosa ya kuchagua oda kwa nusu ndani ya miezi sita",
  exp3: "Nilisaidia kazi za kila siku za kupokea na kusambaza bidhaa kwa matawi matatu ya biashara ya jumla, nikiweka kadi za stoo kwa mkono.",
  exp3k1: "Niligundua mfumo wa upungufu wa uwasilishaji wa muuzaji uliorejesha mkopo wa TZS milioni 1.2",
  exp3k2: "Sikukosa tarehe za mwisho za usambazaji kwa muda wa miezi 18",
  degree1: "Stashahada",
  field1: "Manunuzi na Usafirishaji",
  degree2: "Cheti cha Juu cha Elimu ya Sekondari",
  field2: "Sayansi za Jumla",
  skills: [
    "Usimamizi wa Bidhaa",
    "Excel",
    "Uoanishaji wa Stoo",
    "Uratibu wa Wauzaji",
    "Mifumo ya Usimamizi wa Ghala",
    "Uongozi wa Timu",
  ],
  langNames: ["Kiswahili", "Kiingereza"],
  cert1: "Cheti cha Usimamizi wa Ghala na Bidhaa",
  cert2: "Huduma ya Kwanza Kazini",
  project1Name: "Jaribio la Kidijitali la Ghala",
  project1Role: "Kiongozi wa Mradi",
  project1Desc:
    "Nilijaribu mfumo wa stoo wa kidijitali (tablet) katika ghala moja, ukibadilisha kadi za karatasi na kupunguza muda wa kuhesabu mwishoni mwa mwezi kutoka siku mbili hadi nusu siku.",
  project2Name: "Ukaguzi wa Stoo wa Kikanda",
  project2Role: "Mjumbe wa Timu",
  project2Desc:
    "Nilishiriki katika ukaguzi wa matawi matatu uliooanisha bidhaa 18,000 na kubaini stoo ya thamani ya TZS milioni 6.4 isiyokuwa imerekodiwa.",
  referee1Title: "Mkurugenzi wa Uendeshaji Kikanda",
  referee2Title: "Meneja wa Ghala",
  hobbies: "Mpira wa pete, kujitolea kwa jamii, kusoma",
};

function build(w: SampleWords): CV & { data: PreviewCVData } {
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
          keyAchievements: [w.exp1k1, w.exp1k2, w.exp1k3],
        },
        {
          id: "s2",
          title: w.role2,
          company: "Zanzibar Trading Co",
          startDate: "2018-06",
          endDate: "2021-02",
          description: w.exp2,
          keyAchievements: [w.exp2k1, w.exp2k2],
        },
        {
          id: "s3",
          title: w.role3,
          company: "Mbeya Wholesale Traders",
          startDate: "2016-01",
          endDate: "2018-05",
          description: w.exp3,
          keyAchievements: [w.exp3k1, w.exp3k2],
        },
      ],
      education: [
        {
          id: "e1",
          institution: "Dar es Salaam Institute of Technology",
          degree: w.degree1,
          field: w.field1,
          graduationDate: "2017",
        },
        {
          id: "e2",
          institution: "Kibaha Secondary School",
          degree: w.degree2,
          field: w.field2,
          graduationDate: "2014",
        },
      ],
      skills: [
        { id: "k1", name: w.skills[0], level: "expert" },
        { id: "k2", name: w.skills[1], level: "advanced" },
        { id: "k3", name: w.skills[2], level: "advanced" },
        { id: "k4", name: w.skills[3], level: "intermediate" },
        { id: "k5", name: w.skills[4], level: "intermediate" },
        { id: "k6", name: w.skills[5], level: "beginner" },
      ],
      certifications: [
        { id: "c1", name: w.cert1, issuer: "Tanzania Institute of Logistics", issueDate: "2019-11" },
        { id: "c2", name: w.cert2, issuer: "Tanzania Red Cross Society", issueDate: "2022-04" },
      ],
      languages: [
        { id: "l1", language: w.langNames[0], proficiency: "native" },
        { id: "l2", language: w.langNames[1], proficiency: "fluent" },
      ],
      projects: [
        {
          id: "p1",
          name: w.project1Name,
          role: w.project1Role,
          date: "2022-08",
          description: w.project1Desc,
        },
        {
          id: "p2",
          name: w.project2Name,
          role: w.project2Role,
          date: "2020-05",
          description: w.project2Desc,
        },
      ],
      referees: [
        {
          id: "r1",
          name: "Grace Mushi",
          title: w.referee1Title,
          company: "Pwani Logistics Group",
          email: "grace.mushi@example.co.tz",
          phone: "+255 754 000 111",
        },
        {
          id: "r2",
          name: "Daniel Komba",
          title: w.referee2Title,
          company: "Zanzibar Trading Co",
          email: "daniel.komba@example.co.tz",
          phone: "+255 713 000 222",
        },
      ],
      hobbies: w.hobbies,
    },
  };
}

/** The sample CV in the reader's language. Deliberately NO English-only export:
 *  a default-language constant is what the gallery reached for when it wanted a
 *  thumbnail, and every design then previewed an English CV to a Swahili user. */
export function sampleCv(lang: SampleLang = "en"): CV & { data: PreviewCVData } {
  return build(lang === "sw" ? SW : EN);
}
