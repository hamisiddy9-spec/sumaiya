/**
 * The curated learning catalogue — small and high-quality, not a directory.
 *
 * Each entry is a SKILL (not "a course"): the skill's weight in the East-
 * African job market, the job-advert words that signal an employer wants it,
 * one strong primary course, an optional fast path (a short video for someone
 * who needs work now), and prompts that hand the user straight to Sumaiya to
 * practise it — in their own language.
 *
 * Backend quality rule for anything added here: verified provider, working
 * URL, skill tags, difficulty, duration, free/paid, language, career
 * relevance, lastVerified. A monthly link check hides a dead URL.
 */

export type Priority = "high" | "medium" | "low";

export interface Course {
  title: string;
  provider: string;
  url: string;
  free: boolean;
  /** Rough commitment. */
  durationWeeks: number;
  /** Language the course itself is taught in. */
  language: "en";
  whyEn: string;
  whySw: string;
  /** 2–4 things this course actually builds — shown as chips. */
  improves: { en: string; sw: string }[];
  lastVerified: string; // YYYY-MM
}

export interface SkillArea {
  id: string;
  skill: { en: string; sw: string };
  /** 1 (nice to have) … 5 (almost every job wants it) in this market. */
  weight: 1 | 2 | 3 | 4 | 5;
  /** Lowercased words/phrases in a job advert that mean "we want this skill". */
  jobKeywords: string[];
  /** Lowercased words in a CV / profile that mean "I already have this". */
  cvKeywords: string[];
  course: Course;
  /** A 10–20 min head start for someone who can't commit to a full course. */
  fastPath?: { label: { en: string; sw: string }; url: string };
  /** Seeds handed to the Sumaiya chat — practise, don't just watch. */
  practice: { en: string; sw: string }[];
}

const V = "2026-09";

export const SKILL_AREAS: SkillArea[] = [
  {
    id: "excel",
    skill: { en: "Microsoft Excel", sw: "Microsoft Excel" },
    weight: 5,
    jobKeywords: ["excel", "spreadsheet", "spreadsheets", "ms office", "microsoft office", "pivot", "vlookup", "data entry"],
    cvKeywords: ["excel", "spreadsheet", "pivot", "vlookup", "ms office", "microsoft office"],
    course: {
      title: "Excel Skills for Business: Essentials",
      provider: "Coursera · Macquarie University",
      url: "https://www.coursera.org/learn/excel-essentials",
      free: true,
      durationWeeks: 5,
      language: "en",
      whyEn: "Excel turns up in most admin, operations, retail and finance adverts — and it's the fastest skill to make visible on a CV.",
      whySw: "Excel inaonekana kwenye matangazo mengi ya utawala, oparesheni, duka na fedha — na ni ujuzi wa haraka zaidi kuuonyesha kwenye CV.",
      improves: [
        { en: "Excel", sw: "Excel" },
        { en: "Reporting", sw: "Kuripoti" },
        { en: "Data handling", sw: "Kushughulikia data" },
      ],
      lastVerified: V,
    },
    fastPath: { label: { en: "15-min Excel basics (video)", sw: "Excel ya msingi dakika 15 (video)" }, url: "https://www.youtube.com/watch?v=Vl0H-qTclOg" },
    practice: [
      { en: "Give me 5 Excel interview questions for an operations job, then check my answers.", sw: "Nipe maswali 5 ya usaili ya Excel kwa kazi ya oparesheni, kisha ukague majibu yangu." },
      { en: "Walk me through building a simple stock-count sheet in Excel, step by step.", sw: "Nielekeze kutengeneza jedwali rahisi la kuhesabu bidhaa kwenye Excel, hatua kwa hatua." },
    ],
  },
  {
    id: "communication",
    skill: { en: "Communication", sw: "Mawasiliano" },
    weight: 5,
    jobKeywords: ["communication", "communicate", "verbal", "written communication", "interpersonal", "presentation", "articulate"],
    cvKeywords: ["communication", "presented", "liaised", "coordinated", "stakeholder"],
    course: {
      title: "Improving Communication Skills",
      provider: "Coursera · University of Pennsylvania",
      url: "https://www.coursera.org/learn/wharton-communication-skills",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "Almost every advert lists communication. Employers read it as: can you be clear on the phone, in an email, and in a meeting.",
      whySw: "Karibu kila tangazo linataja mawasiliano. Waajiri wanamaanisha: unawasilisha wazi kwa simu, kwa barua pepe, na kwenye mkutano.",
      improves: [
        { en: "Clarity", sw: "Uwazi" },
        { en: "Email", sw: "Barua pepe" },
        { en: "Persuasion", sw: "Ushawishi" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Help me answer 'tell me about a time you handled a difficult customer' for a retail job.", sw: "Nisaidie kujibu 'niambie wakati ulishughulikia mteja mgumu' kwa kazi ya duka." },
      { en: "Rewrite this message to a manager so it sounds professional: [paste yours]", sw: "Andika upya ujumbe huu kwa meneja usikike wa kitaalamu: [bandika wako]" },
    ],
  },
  {
    id: "customer-service",
    skill: { en: "Customer service", sw: "Huduma kwa wateja" },
    weight: 5,
    jobKeywords: ["customer service", "customer care", "client", "clients", "customer support", "complaint", "front desk", "help desk"],
    cvKeywords: ["customer service", "customer care", "clients", "front desk", "reception", "complaint"],
    course: {
      title: "Customer Service Fundamentals",
      provider: "Coursera · Knowledge Accelerators",
      url: "https://www.coursera.org/learn/customer-service-fundamentals",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "Retail, hospitality, banking and telecoms all screen for this. It also directly helps your interview answers.",
      whySw: "Duka, ukarimu, benki na mawasiliano yote yanaangalia hili. Pia linasaidia majibu yako ya usaili moja kwa moja.",
      improves: [
        { en: "Complaint handling", sw: "Kushughulikia malalamiko" },
        { en: "Client relations", sw: "Uhusiano na wateja" },
        { en: "Patience", sw: "Uvumilivu" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Ask me 6 common customer-service interview questions and score my answers.", sw: "Niulize maswali 6 ya kawaida ya usaili ya huduma kwa wateja na upe alama majibu yangu." },
    ],
  },
  {
    id: "sales",
    skill: { en: "Sales", sw: "Mauzo" },
    weight: 5,
    jobKeywords: ["sales", "selling", "targets", "revenue", "upsell", "pipeline", "quota", "business development", "closing"],
    cvKeywords: ["sales", "sold", "targets", "revenue", "clients", "closing", "upsell"],
    course: {
      title: "Sales Training: Techniques for a Human-Centric Sales Process",
      provider: "Coursera · HubSpot Academy",
      url: "https://www.coursera.org/learn/sales-process-techniques-training",
      free: true,
      durationWeeks: 2,
      language: "en",
      whyEn: "Sales roles are the most-advertised entry jobs in the region and the easiest to grow from. This is practical, not theory.",
      whySw: "Kazi za mauzo ndizo zinazotangazwa zaidi kwa waanzao katika ukanda huu na rahisi kupanda. Hii ni ya vitendo, si nadharia.",
      improves: [
        { en: "Prospecting", sw: "Kutafuta wateja" },
        { en: "Objection handling", sw: "Kushughulikia pingamizi" },
        { en: "Closing", sw: "Kufunga mauzo" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Role-play a sales call with me — I'm selling airtime to a shop owner.", sw: "Fanya mchezo wa simu ya mauzo nami — nauza airtime kwa mmiliki wa duka." },
    ],
  },
  {
    id: "digital-marketing",
    skill: { en: "Digital marketing", sw: "Masoko ya kidijitali" },
    weight: 4,
    jobKeywords: ["digital marketing", "social media", "seo", "content", "facebook ads", "instagram", "campaign", "google ads"],
    cvKeywords: ["digital marketing", "social media", "content", "campaign", "seo", "canva"],
    course: {
      title: "Fundamentals of Digital Marketing",
      provider: "Google Digital Garage",
      url: "https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing",
      free: true,
      durationWeeks: 6,
      language: "en",
      whyEn: "A recognised free certificate. Opens marketing-assistant, social-media and content roles, and useful if you run your own business.",
      whySw: "Cheti cha bure kinachotambulika. Kinafungua kazi za msaidizi wa masoko, mitandao ya kijamii na maudhui, na kinasaidia ukiwa na biashara yako.",
      improves: [
        { en: "Social media", sw: "Mitandao ya kijamii" },
        { en: "Ads", sw: "Matangazo" },
        { en: "Analytics", sw: "Uchambuzi" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Help me plan one week of Instagram posts for a small clothing shop.", sw: "Nisaidie kupanga wiki moja ya machapisho ya Instagram kwa duka dogo la nguo." },
    ],
  },
  {
    id: "bookkeeping",
    skill: { en: "Bookkeeping & accounting basics", sw: "Uhasibu wa msingi" },
    weight: 4,
    jobKeywords: ["bookkeeping", "accounting", "accounts", "ledger", "reconciliation", "quickbooks", "invoicing", "payroll", "petty cash"],
    cvKeywords: ["bookkeeping", "accounting", "ledger", "reconciliation", "quickbooks", "invoicing", "payroll"],
    course: {
      title: "Bookkeeping Basics",
      provider: "Coursera · Intuit",
      url: "https://www.coursera.org/learn/bookkeeping-basics",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "Opens accounts-assistant and cashier roles across every sector, and lets you handle your own business's books.",
      whySw: "Kinafungua kazi za msaidizi wa hesabu na keshia katika kila sekta, na kinakuwezesha kushika hesabu za biashara yako.",
      improves: [
        { en: "Ledgers", sw: "Leja" },
        { en: "Reconciliation", sw: "Upatanisho wa hesabu" },
        { en: "Invoicing", sw: "Ankara" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Explain debits and credits with a simple duka example, in Swahili.", sw: "Eleza debit na credit kwa mfano rahisi wa duka, kwa Kiswahili." },
    ],
  },
  {
    id: "project-management",
    skill: { en: "Project management", sw: "Usimamizi wa miradi" },
    weight: 4,
    jobKeywords: ["project management", "project coordinator", "gantt", "milestones", "stakeholders", "deliverables", "scope", "timeline"],
    cvKeywords: ["project", "coordinated", "managed", "milestones", "stakeholders", "deliverables"],
    course: {
      title: "Foundations of Project Management",
      provider: "Coursera · Google",
      url: "https://www.coursera.org/learn/project-management-foundations",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "The vocabulary alone — scope, milestones, stakeholders — makes a CV read like a coordinator's, not just a doer's.",
      whySw: "Msamiati wenyewe — wigo, hatua muhimu, wadau — hufanya CV isomeke kama ya mratibu, si tu mtekelezaji.",
      improves: [
        { en: "Planning", sw: "Upangaji" },
        { en: "Coordination", sw: "Uratibu" },
        { en: "Tracking", sw: "Ufuatiliaji" },
      ],
      lastVerified: V,
    },
    practice: [],
  },
  {
    id: "data-analysis",
    skill: { en: "Data analysis", sw: "Uchambuzi wa data" },
    weight: 4,
    jobKeywords: ["data analysis", "data analyst", "reporting", "dashboards", "sql", "insights", "metrics", "power bi"],
    cvKeywords: ["data analysis", "reporting", "dashboards", "sql", "metrics", "power bi", "analysis"],
    course: {
      title: "Foundations: Data, Data, Everywhere",
      provider: "Coursera · Google",
      url: "https://www.coursera.org/learn/foundations-data",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "A soft entry into a fast-growing, better-paid track. Pairs well with Excel.",
      whySw: "Mlango laini wa njia inayokua haraka na yenye malipo bora. Inaenda vizuri na Excel.",
      improves: [
        { en: "Spreadsheets", sw: "Majedwali" },
        // "Dashibodi" was rejected as a loanword elsewhere in the app —
        // "muhtasari" (overview board) says the same thing without it.
        { en: "Dashboards", sw: "Dashibodi" },
        { en: "Insight", sw: "Maarifa" },
      ],
      lastVerified: V,
    },
    practice: [],
  },
  {
    id: "it-support",
    skill: { en: "IT support", sw: "Msaada wa TEHAMA" },
    weight: 4,
    jobKeywords: ["it support", "helpdesk", "help desk", "technical support", "troubleshooting", "networking", "hardware", "windows"],
    cvKeywords: ["it support", "helpdesk", "troubleshooting", "networking", "hardware", "technical support"],
    course: {
      title: "Technical Support Fundamentals",
      provider: "Coursera · Google",
      url: "https://www.coursera.org/learn/technical-support-fundamentals",
      free: true,
      durationWeeks: 6,
      language: "en",
      whyEn: "First course of the Google IT Support certificate — a real path from no experience to a helpdesk job.",
      whySw: "Kozi ya kwanza ya cheti cha Google IT Support — njia halisi kutoka bila uzoefu hadi kazi ya helpdesk.",
      improves: [
        { en: "Troubleshooting", sw: "Utatuzi wa matatizo" },
        { en: "Networking", sw: "Mitandao" },
        { en: "Hardware", sw: "Vifaa vya kompyuta" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Ask me helpdesk troubleshooting scenarios and tell me if my steps are right.", sw: "Niulize hali za utatuzi wa helpdesk na uniambie kama hatua zangu ni sahihi." },
    ],
  },
  {
    id: "ai-productivity",
    skill: { en: "AI at work", sw: "AI kazini" },
    weight: 5,
    jobKeywords: ["ai", "chatgpt", "automation", "prompt", "generative ai", "ai tools", "efficiency"],
    cvKeywords: ["ai", "chatgpt", "automation", "prompt", "generative"],
    course: {
      title: "Google AI Essentials",
      provider: "Coursera · Google",
      url: "https://www.coursera.org/learn/google-ai-essentials",
      free: true,
      durationWeeks: 2,
      language: "en",
      whyEn: "Short. Being the person on the team who uses AI well is now a hiring signal in itself — in any role.",
      whySw: "Fupi. Kuwa mtu kwenye timu anayetumia AI vizuri sasa ni ishara ya kuajiriwa yenyewe — katika kazi yoyote.",
      improves: [
        { en: "Prompting", sw: "Kuandika maagizo" },
        { en: "Drafting", sw: "Kuandaa rasimu" },
        { en: "Speed", sw: "Kasi" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Show me 5 ways I could use AI in a storekeeper job every week.", sw: "Nionyeshe njia 5 ambazo ningetumia AI kwenye kazi ya karani wa duka kila wiki." },
    ],
  },
  {
    id: "job-search",
    skill: { en: "Job search & LinkedIn profile", sw: "Kutafuta kazi na wasifu wa LinkedIn" },
    weight: 5,
    jobKeywords: [],
    cvKeywords: [],
    course: {
      title: "Successful Career Development",
      provider: "Coursera · Kennesaw State University",
      url: "https://www.coursera.org/learn/career-advancement",
      free: true,
      durationWeeks: 2,
      language: "en",
      whyEn: "Not job-specific — this is about being found. Most jobs here are filled through referrals and a clean profile.",
      whySw: "Si ya kazi maalum — hii ni kuhusu kuonekana. Kazi nyingi hapa zinajazwa kupitia mapendekezo na wasifu safi.",
      improves: [
        { en: "Profile", sw: "Wasifu" },
        { en: "Networking", sw: "Kujenga mahusiano" },
        { en: "Confidence", sw: "Kujiamini" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Write me a short LinkedIn 'About' section from my profile.", sw: "Niandikie sehemu fupi ya 'Kuhusu' ya LinkedIn kutoka wasifu wangu." },
    ],
  },
  {
    id: "interview",
    skill: { en: "Interview skills", sw: "Ujuzi wa usaili" },
    weight: 5,
    jobKeywords: [],
    cvKeywords: [],
    course: {
      title: "Interview Research and Preparation",
      provider: "Coursera · University of Maryland",
      url: "https://www.coursera.org/learn/interview-preparation",
      free: true,
      durationWeeks: 3,
      language: "en",
      whyEn: "The gap between a callback and an offer is almost always interview delivery, not the CV. Practise it before you need it.",
      whySw: "Pengo kati ya kuitwa na kupewa kazi karibu kila mara ni jinsi unavyofanya usaili, si CV. Fanya mazoezi kabla ya kuihitaji.",
      improves: [
        { en: "STAR answers", sw: "Majibu ya mtindo wa STAR" },
        { en: "Confidence", sw: "Kujiamini" },
        { en: "Follow-up", sw: "Ufuatiliaji baada ya usaili" },
      ],
      lastVerified: V,
    },
    practice: [
      { en: "Run a full mock interview with me for [job], then give me feedback.", sw: "Fanya usaili kamili wa mazoezi nami kwa [kazi], kisha nipe maoni." },
    ],
  },
  {
    id: "business-writing",
    skill: { en: "Business writing", sw: "Uandishi wa kibiashara" },
    weight: 3,
    jobKeywords: ["business writing", "report writing", "correspondence", "minutes", "documentation", "email etiquette", "proposals"],
    cvKeywords: ["report writing", "correspondence", "minutes", "documentation", "proposals", "drafted"],
    course: {
      title: "Business Writing",
      provider: "Coursera · University of Colorado Boulder",
      url: "https://www.coursera.org/learn/business-writing",
      free: true,
      durationWeeks: 4,
      language: "en",
      whyEn: "Useful for admin, HR, comms and any role that writes reports or emails to clients.",
      whySw: "Inasaidia utawala, rasilimali watu, mawasiliano na kazi yoyote inayoandika ripoti au barua pepe kwa wateja.",
      improves: [
        { en: "Emails", sw: "Barua pepe" },
        { en: "Reports", sw: "Ripoti" },
        { en: "Proposals", sw: "Mapendekezo" },
      ],
      lastVerified: V,
    },
    practice: [],
  },
  {
    id: "leadership",
    skill: { en: "Leadership & supervision", sw: "Uongozi na usimamizi" },
    weight: 3,
    jobKeywords: ["leadership", "supervisor", "team lead", "manage a team", "supervising", "mentoring", "delegation"],
    cvKeywords: ["led", "supervised", "managed a team", "team lead", "mentored", "trained"],
    course: {
      title: "Connected Leadership",
      provider: "Coursera · Yale University",
      url: "https://www.coursera.org/learn/connected-leadership",
      free: true,
      durationWeeks: 5,
      language: "en",
      whyEn: "For the step from doing the work to running a shift or a team — supervisor and team-lead roles.",
      whySw: "Kwa hatua kutoka kufanya kazi hadi kusimamia zamu au timu — kazi za msimamizi na kiongozi wa timu.",
      improves: [
        { en: "Delegation", sw: "Ugawaji wa majukumu" },
        { en: "Feedback", sw: "Maoni" },
        { en: "Motivation", sw: "Kuhamasisha" },
      ],
      lastVerified: V,
    },
    practice: [],
  },
];

/**
 * East-Africa field → the skills that field's jobs most reward. Field ids
 * match lib/career-fields.ts. Used so someone who's only done first-run (no
 * CV) still gets a real "your next skills" list.
 */
export const SKILLS_BY_FIELD: Record<string, string[]> = {
  "sales-retail": ["sales", "customer-service", "communication", "excel"],
  "customer-service": ["customer-service", "communication", "excel", "business-writing"],
  "admin-office": ["excel", "business-writing", "communication", "data-analysis"],
  "finance-accounting": ["bookkeeping", "excel", "data-analysis", "business-writing"],
  "healthcare": ["communication", "customer-service", "excel", "business-writing"],
  "education": ["communication", "business-writing", "project-management", "ai-productivity"],
  "it-software": ["it-support", "data-analysis", "ai-productivity", "communication"],
  "engineering": ["project-management", "excel", "data-analysis", "communication"],
  "construction-trades": ["project-management", "leadership", "communication", "excel"],
  "logistics-transport": ["excel", "data-analysis", "communication", "project-management"],
  "hospitality-food": ["customer-service", "communication", "sales", "leadership"],
  "agriculture": ["bookkeeping", "project-management", "sales", "excel"],
  "security": ["communication", "leadership", "business-writing", "customer-service"],
  "marketing-comms": ["digital-marketing", "communication", "business-writing", "ai-productivity"],
  "manufacturing": ["excel", "leadership", "project-management", "data-analysis"],
  "hr-people": ["communication", "business-writing", "excel", "bookkeeping"],
  "beauty-wellness": ["customer-service", "sales", "communication", "digital-marketing"],
  "driving": ["customer-service", "communication", "business-writing"],
  "general-labour": ["communication", "customer-service", "excel", "leadership"],
  "business-owner": ["bookkeeping", "digital-marketing", "sales", "ai-productivity"],
};

export function skillArea(id: string): SkillArea | undefined {
  return SKILL_AREAS.find((s) => s.id === id);
}
