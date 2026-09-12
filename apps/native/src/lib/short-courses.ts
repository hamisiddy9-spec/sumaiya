/**
 * The free short courses in the Learning Hub.
 *
 * 1. "Jifunze kutafuta nafasi za kazi" — a job seeker's real first problem
 *    isn't a weak CV, it's having no advert to send one to. Opens with a lesson
 *    you actually read; the rest ends in something Sumaiya does WITH them.
 * 2. "Jifunze kutumia Sumaiya" — the app itself, one unit per place worth
 *    knowing, each opening that place for real.
 * 3. "Mpango wa siku 7 wa kujenga uzoefu" — for anyone who thinks they have
 *    nothing to put on a CV.
 *
 * Copy rule for everything in here: the simplest words, the thing named out
 * loud ("tangazo la kazi", never "kimoja"), and a button that says exactly what
 * happens when you press it.
 *
 * Shape rule, added after the first version read as a wall of links: a unit
 * must teach something on the screen you are already looking at (`kind:
 * "lesson"`) or send you somewhere to DO the thing (`kind: "task"`). Websites go
 * in `resources`, where they are chips and cannot be mistaken for steps.
 */
import { VACANCY_SOURCES } from "@sumaiya/api-client";
import {
  courseDone,
  courseIsComplete,
  coursePercent,
  getCourseProgress,
  markCourseUnit,
  resetCourse,
  type CourseAction,
  type CourseProgress,
  type CourseResource,
  type CourseUnit,
  type ShortCourse,
} from "./short-course";

export const JOB_SEARCH_KEY = "sumaiya_job_search_v1";
export const APP_TOUR_KEY = "sumaiya_app_tour_v1";

/** Step content for the job-search course; ids are stored on device, so add rather than rename. */
export const STARTER_STEPS: CourseUnit[] = [
  {
    id: "step:boards",
    kind: "lesson",
    action: "mark",
    title: { en: "Look at the notice boards near you", sw: "Angalia mbao za matangazo karibu nawe" },
    cta: { en: "I have looked at them", sw: "Nimeangalia zote" },
    lesson: {
      paragraphs: {
        en: [
          "Many jobs never go online at all. They are printed on paper and pinned to a notice board, because that is where people in the area walk past every day.",
          "Places to look: the district council, the ward office, VETA, colleges, churches and mosques, and the job pages of newspapers like Mwananchi, Uhuru and The Guardian.",
          "Adverts put up this way usually ask for less than the ones online, and far fewer people read them. This is how many people get their first job: they read the board, then ask someone who works there.",
        ],
        sw: [
          "Kazi nyingi haziwekwi mtandaoni kabisa. Zinachapishwa kwenye karatasi na kubandikwa kwenye ubao wa matangazo, kwa sababu hapo ndipo watu wa sehemu hiyo wanapopita kila siku.",
          "Sehemu za kuangalia: halmashauri ya wilaya, ofisi ya kata, VETA, vyuo, makanisa na misikiti, na kurasa za kazi za magazeti kama Mwananchi, Uhuru na The Guardian.",
          "Matangazo ya namna hii kawaida huhitaji vitu vichache kuliko ya mtandaoni, na wasomaji wake ni wachache sana. Watu wengi hupata kazi yao ya kwanza hivi: wanasoma ubaoni, kisha wanamuuliza mtu anayefanya kazi hapo.",
        ],
      },
      keyPoint: {
        en: "On a notice board you are competing with a handful of people. Online you are competing with thousands.",
        sw: "Ubaoni unashindana na wachache. Mtandaoni unashindana na maelfu.",
      },
      checkpoint: {
        question: { en: "Where are most jobs in Tanzania advertised?", sw: "Kazi nyingi za Tanzania zinatangazwa wapi?" },
        options: [
          { en: "Only on WhatsApp", sw: "WhatsApp pekee" },
          { en: "On notice boards and in newspapers too", sw: "Kwenye ubao wa matangazo na magazeti pia" },
          { en: "Only on television", sw: "Kwenye televisheni pekee" },
        ],
        answer: 1,
        why: {
          en: "Most jobs never reach the internet at all. Notice boards, newspapers and simply asking people are the main route — which is why walking these places yourself is worth the trip.",
          sw: "Kazi nyingi hazifikii mtandaoni kabisa. Ubao wa matangazo, magazeti na kuuliza watu ndiyo njia kubwa — ndiyo maana inafaa kupitia sehemu hizi mwenyewe.",
        },
      },
    },
  },
  {
    id: "step:shortlist",
    kind: "task",
    action: "jobs",
    title: { en: "Pick three adverts you can do", sw: "Chagua matangazo matatu unayoweza" },
    body: {
      en: "Open the list of jobs and pick three adverts whose work you can already do today. Three real ones beat thirty you only skim.",
      sw: "Fungua orodha ya kazi na chagua matangazo matatu yenye kazi unayoweza kufanya leo. Matatu ya kweli ni bora kuliko thelathini unazodurusu.",
    },
    cta: { en: "Open the list of jobs", sw: "Fungua orodha ya kazi" },
  },
  {
    id: "step:advert",
    kind: "task",
    action: "sumaiya",
    title: { en: "Send me the advert", sw: "Niletee tangazo la kazi" },
    body: {
      en: "Have you seen a job anywhere? Send it to me — paste the words, share the link, or take a photo of the page. I will tell you what the job needs, which of your skills fit, and what to change.",
      sw: "Umeona nafasi ya kazi sehemu yoyote? Niletee — bandika maneno yake, tuma kiungo, au piga picha ya ukurasa. Nitakuambia kazi inahitaji nini, ujuzi upi wako unafaa, na cha kubadilisha.",
    },
    cta: { en: "Send me the advert", sw: "Nitumie tangazo" },
  },
  {
    id: "step:apply",
    kind: "task",
    action: "applications",
    title: { en: "Apply, then follow up", sw: "Omba kazi, kisha fuatilie" },
    body: {
      en: "Send the CV and the letter tuned to that advert, then write the deadline in your applications so nothing slips past you.",
      sw: "Tuma CV na barua iliyolengwa kwa tangazo hilo, kisha andika tarehe ya mwisho kwenye maombi yako ili kitu kisikupite.",
    },
    cta: { en: "Open my applications", sw: "Fungua maombi yangu" },
  },
];

/**
 * The six verified websites — as resources, not steps.
 *
 * They used to be units, which made them steps 1–6 of a course whose first real
 * lesson was step 7. Someone opening "Jifunze kutafuta nafasi za kazi" saw six
 * links before a single sentence of teaching. They are still here, still
 * verified, still one tap away — attached to the lesson that explains where
 * vacancies actually are, instead of standing in front of it.
 */
export const JOB_SEARCH_RESOURCES: CourseResource[] = VACANCY_SOURCES.map((s) => ({
  id: `src:${s.id}`,
  name: s.name,
  note: s.note,
  url: s.url,
}));

export const JOB_SEARCH_COURSE: ShortCourse = {
  id: JOB_SEARCH_KEY,
  tier: "free",
  minutes: 12,
  title: { en: "Learn to find job vacancies", sw: "Jifunze kutafuta nafasi za kazi" },
  blurb: {
    en: "Where vacancies really are, and what to do with one once you find it. Starts with a short lesson.",
    sw: "Nafasi za kazi ziko wapi hasa, na cha kufanya ukishapata moja. Inaanza na somo fupi.",
  },
  units: STARTER_STEPS,
  resources: JOB_SEARCH_RESOURCES,
  resourcesAfter: "step:boards",
};

export const APP_TOUR_COURSE: ShortCourse = {
  id: APP_TOUR_KEY,
  tier: "free",
  minutes: 6,
  title: { en: "Learn to use Sumaiya", sw: "Jifunze kutumia Sumaiya" },
  blurb: {
    en: "Six things the app can do for you — tap each one and it opens for real.",
    sw: "Mambo sita ambayo app inaweza kukufanyia — gusa kila moja na ifunguke.",
  },
  units: [
    {
      id: "tour:sumaiya",
      kind: "task",
      action: "sumaiya",
      title: { en: "Ask me anything", sw: "Niulize kitu chochote" },
      body: {
        en: "Type in Swahili or English. Ask what a job needs, how to answer an interview question, or what to write in your CV.",
        sw: "Andika kwa Kiswahili au Kiingereza. Uliza kazi inahitaji nini, jinsi ya kujibu swali la usaili, au cha kuandika kwenye CV yako.",
      },
      cta: { en: "Open Sumaiya", sw: "Fungua Sumaiya" },
    },
    {
      id: "tour:cv",
      kind: "task",
      action: "cvs",
      title: { en: "Put in your CV", sw: "Weka CV yako" },
      body: {
        en: "Already have a CV? She keeps your words and makes them stronger. No CV yet? She writes one from a few questions.",
        sw: "Una CV tayari? Anaacha maneno yako na kuyaongeza nguvu. Hauna? Anaitengeneza kwa maswali machache.",
      },
      cta: { en: "Open my CVs", sw: "Fungua CV zangu" },
    },
    {
      id: "tour:upload",
      kind: "task",
      action: "import",
      title: { en: "Upload a file or a photo", sw: "Pakia faili au picha" },
      body: {
        en: "An old CV, a certificate, or a photo of a job advert — upload it and I'll read it for you.",
        sw: "CV ya zamani, cheti, au picha ya tangazo la kazi — ipakie na nikusomee.",
      },
      cta: { en: "Open upload", sw: "Fungua kupakia" },
    },
    {
      id: "tour:ats",
      kind: "task",
      action: "ats",
      title: { en: "Check your CV before you send it", sw: "Kagua CV yako kabla kutuma" },
      body: {
        en: "Big employers read CVs with software first. This shows your score out of 100 and exactly what to fix.",
        sw: "Waajiri wakubwa husoma CV kwa programu kwanza. Hii inaonyesha alama yako kati ya 100 na cha kurekebisha.",
      },
      cta: { en: "Check my CV", sw: "Kagua CV yangu" },
    },
    {
      id: "tour:profile",
      kind: "task",
      action: "profile",
      title: { en: "Complete your profile", sw: "Kamilisha wasifu wako" },
      body: {
        en: "Your work history and skills in one place. Everything I write comes from here, so the better it is, the better I am.",
        sw: "Historia yako ya kazi na ujuzi mahali pamoja. Kila ninachoandika kinatoka hapa, kwa hivyo kikamilike, nitakuwa bora zaidi.",
      },
      cta: { en: "Open my profile", sw: "Fungua wasifu wangu" },
    },
    {
      id: "tour:letter",
      kind: "task",
      action: "letter",
      title: { en: "Write the letter of application", sw: "Andika barua ya maombi" },
      body: {
        en: "Bring me the advert and I'll write a letter that answers it — using only what is true about you.",
        sw: "Niletee tangazo na niandike barua inayolijibu — kwa kutumia yale ya kweli kukuhusu.",
      },
      cta: { en: "Write my letter", sw: "Andika barua yangu" },
    },
  ],
};

/**
 * The deep one: from "I have nothing to put on a CV" to a CV with proof
 * behind it, day by day. Free like the rest — see the note on `tier` in
 * short-course.ts.
 */
export const EXPERIENCE_KEY = "sumaiya_experience_course_v1";

export const EXPERIENCE_COURSE: ShortCourse = {
  id: EXPERIENCE_KEY,
  tier: "free",
  minutes: 15,
  title: { en: "A 7-day plan to build experience", sw: "Mpango wa siku 7 wa kujenga uzoefu" },
  blurb: {
    en: "For anyone who thinks they have nothing to put on a CV. Seven days, five steps, and you stop saying \"sina uzoefu\".",
    sw: "Kwa yeyote anayedhani hana cha kuweka kwenye CV. Siku saba, hatua tano, na unaacha kusema \"sina uzoefu\".",
  },
  units: [
    {
      id: "exp:list",
      kind: "task",
      action: "sumaiya",
      title: { en: "Day 1: write down everything you have already done", sw: "Siku 1: andika kila ulichokwisha kufanya" },
      body: {
        en: "Answer my questions — attachment, class projects, the kiosk, volunteering, the family shop — and I turn each one into experience an employer can read.",
        sw: "Jibu maswali yangu — mafunzo kwa vitendo, miradi ya darasa, kibanda, kujitolea, biashara ya familia — na mimi hubadilisha kila kimoja kuwa uzoefu ambao mwajiri anaweza kuusoma.",
      },
      cta: { en: "Start with Sumaiya", sw: "Anza na Sumaiya" },
    },
    {
      id: "exp:numbers",
      kind: "task",
      action: "cvs",
      title: { en: "Day 2: put numbers on the work you did", sw: "Siku 2: weka namba kwenye kazi uliyofanya" },
      body: {
        en: "How many customers did you serve in a day? How much stock did you arrange? Numbers show an employer the size of the job you already handled.",
        sw: "Ulihudumia wateja wangapi kwa siku? Ulipanga bidhaa kiasi gani? Namba zinaonyesha kwa mwajiri ukubwa wa kazi uliyokwisha shughulikia.",
      },
      cta: { en: "Open my CV", sw: "Fungua CV yangu" },
    },
    {
      id: "exp:proof",
      kind: "task",
      action: "import",
      title: { en: "Day 3 and 4: add proof", sw: "Siku 3 na 4: ongeza ushahidi" },
      body: {
        en: "A certificate, a letter from a former employer, or a photo of work you did — upload it and it goes into your profile.",
        sw: "Cheti, barua kutoka kwa mwajiri wa zamani, au picha ya kazi uliyofanya — ipakie na inaingia kwenye wasifu wako.",
      },
      cta: { en: "Upload a file or photo", sw: "Pakia faili au picha" },
    },
    {
      id: "exp:answer",
      kind: "task",
      action: "sumaiya",
      title: { en: "Day 5: answer \"you have no experience?\"", sw: "Siku 5: jibu swali \"huna uzoefu?\"" },
      body: {
        en: "Practise with me: how to answer without apologising, using one real job you have done and what it taught you.",
        sw: "Fanya mazoezi nami: jinsi ya kujibu bila kujitetea, kwa kutumia kazi moja halisi uliyoifanya na ulichojifunza.",
      },
      cta: { en: "Practise the answer", sw: "Fanya mazoezi ya jibu" },
    },
    {
      id: "exp:apply",
      kind: "task",
      action: "jobs",
      title: { en: "Day 6 and 7: apply to jobs that take beginners", sw: "Siku 6 na 7: omba kazi zinazokubali waanza" },
      body: {
        en: "Pick adverts that accept people starting out — sales, customer service, stores, clerical — and send the CV you just built.",
        sw: "Chagua matangazo yanayokubali waanza — mauzo, huduma kwa wateja, stoo, ukarani — na tuma CV uliyoijenga.",
      },
      cta: { en: "Open the list of jobs", sw: "Fungua orodha ya kazi" },
    },
  ],
};

/** Free first, paid last — nobody should have to scroll past a paywall to start. */
export const SHORT_COURSES: ShortCourse[] = [JOB_SEARCH_COURSE, APP_TOUR_COURSE, EXPERIENCE_COURSE];

/**
 * Progress helpers, kept per course so callers never pass the wrong store key.
 * Both courses share the shape in short-course.ts.
 */
export function jobSearchProgress(p: CourseProgress) {
  return { done: courseDone(p, JOB_SEARCH_COURSE), total: JOB_SEARCH_COURSE.units.length, percent: coursePercent(p, JOB_SEARCH_COURSE), complete: courseIsComplete(p, JOB_SEARCH_COURSE) };
}
