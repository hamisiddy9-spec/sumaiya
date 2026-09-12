/**
 * First-party guides — short, practical, written for job seekers in East
 * Africa. Free tier gets the essentials; premium gets the deep playbooks.
 *
 * Content lives here (no CMS yet) so it ships offline with the app.
 */

export type GuideTier = "free" | "premium";

export interface GuideSection {
  heading: { en: string; sw: string };
  body: { en: string; sw: string };
}

export interface Guide {
  id: string;
  tier: GuideTier;
  minutes: number;
  icon: string;
  title: { en: string; sw: string };
  summary: { en: string; sw: string };
  sections: GuideSection[];
}

export const GUIDES: Guide[] = [
  {
    id: "where-to-find-jobs",
    tier: "free",
    minutes: 5,
    icon: "map-pin",
    title: { en: "Where the vacancies actually are", sw: "Nafasi za kazi ziko wapi hasa" },
    summary: {
      en: "The places that really list Tanzanian jobs — plus the adverts you'll only find on a wall near you.",
      sw: "Sehemu zinazoorodhesha kazi za Tanzania kikweli — pamoja na matangazo ya ukutani karibu nawe.",
    },
    sections: [
      {
        heading: { en: "Government: start with Ajira Portal", sw: "Serikali: anza na Ajira Portal" },
        body: {
          en: "portal.ajira.go.tz is the official Public Service Recruitment Secretariat portal — government vacancies land there first. Read the whole advert: the deadline, the exact qualifications, and whether you apply online.",
          sw: "portal.ajira.go.tz ni tovuti rasmi ya Sekretarieti ya Ajira (Utumishi) — nafasi za serikali zinatangazwa hapo kwanza. Soma tangazo lote: mwisho wa kuomba, sifa halisi zinazotakiwa, na kama unaomba mtandaoni.",
        },
      },
      {
        heading: { en: "Private sector: the big boards", sw: "Sekta binafsi: bodi kubwa" },
        body: {
          en: "BrighterMonday (brightermonday.co.tz), JobwebTanzania (jobwebtanzania.com) and Fuzu (fuzu.com) carry most private-sector adverts. Mabumbe (mabumbe.com/ajira) gathers government adverts in one place, and ReliefWeb (reliefweb.int/jobs) is where UN, NGO and humanitarian roles appear.",
          sw: "BrighterMonday (brightermonday.co.tz), JobwebTanzania (jobwebtanzania.com) na Fuzu (fuzu.com) zina matangazo mengi ya sekta binafsi. Mabumbe (mabumbe.com/ajira) hukusanya matangazo ya serikali pamoja, na ReliefWeb (reliefweb.int/jobs) ni mahali pa nafasi za UN, NGO na misaada.",
        },
      },
      {
        heading: { en: "Offline — the ones near you", sw: "Nje ya mtandao — zile zilizo karibu nawe" },
        body: {
          en: "Many jobs are never put online. Go and look at the notice board at these places: the district council and the ward office, VETA and colleges, churches and mosques, and the job pages of Mwananchi, Uhuru and The Guardian. Or you can try searching the sites above. Most people still hear about a job from someone.",
          sw: "Kazi nyingi haziwekwi mtandaoni. Pitia kwenye ubao wa matangazo wa sehemu zifuatazo: halmashauri ya wilaya na ofisi ya kata, VETA na vyuo, makanisa na misikiti, na kurasa za kazi za Mwananchi, Uhuru na The Guardian. Au unaweza kujaribu kutafuta kwenye tovuti zilizotajwa hapo juu. Watu wengi bado husikia kazi kwa mtu mwingine.",
        },
      },
      {
        heading: { en: "Ninety seconds, not a whole afternoon", sw: "Sekunde 90, si mchana mzima" },
        body: {
          en: "Pick two sources, set a 90-second stopwatch, and only open adverts whose title matches what you can already do. Applying properly to three adverts beats skimming thirty.",
          sw: "Chagua vyanzo viwili, weka kipima muda cha sekunde 90, na fungua tu matangazo yenye cheo kinacholingana na unachoweza kufanya. Kuomba vizuri kwa matangazo matatu ni bora kuliko kudurusu thelathini.",
        },
      },
      {
        heading: { en: "Then bring the advert to me", sw: "Kisha niletee tangazo hilo" },
        body: {
          en: "Paste the advert text, send the link, or send a photo of the page. I'll read it and tell you what it really wants, which of your skills matter most, what's missing, and what to fix — then I'll tailor your CV to it and write the cover letter, using only what's true about you.",
          sw: "Bandika maandishi ya tangazo, tuma kiungo, au tuma picha ya ukurasa. Nitaisoma na kukuambia linataka nini hasa, ujuzi upi wako unahitajika zaidi, kinachokosekana, na cha kurekebisha — kisha nitalenga CV yako kwa tangazo hilo na kuandika barua ya maombi, kwa kutumia yale ya kweli kukuhusu.",
        },
      },
    ],
  },

  {
    id: "ats-basics",
    tier: "free",
    minutes: 4,
    icon: "shield-check",
    title: { en: "Get past the robot that reads your CV first", sw: "Pita mfumo unaosoma CV yako kwanza" },
    summary: {
      en: "Most CVs are read by software before a person sees them. Here's how to not get dropped.",
      sw: "CV nyingi zinasomwa na programu kabla ya mtu. Hivi ndivyo usikatwe.",
    },
    sections: [
      {
        heading: { en: "Use a plain layout", sw: "Tumia muundo sahili" },
        body: {
          en: "No tables, no text boxes, no photo, no columns the software can't follow. One clear column, normal headings: Summary, Experience, Education, Skills. My Classic and Minimal templates are built for this.",
          sw: "Hakuna jedwali, hakuna visanduku vya maandishi, hakuna picha, hakuna safu ambazo programu haiwezi kufuata. Safu moja wazi, vichwa vya kawaida: Muhtasari, Uzoefu, Elimu, Ujuzi. Miundo yangu ya Classic na Minimal imejengwa kwa hili.",
        },
      },
      {
        heading: { en: "Mirror the advert's words", sw: "Rudia maneno ya tangazo" },
        body: {
          en: "If the advert says \"stock control\" and you wrote \"inventory\", the software may not connect them. Read the advert, list the exact skills and tools it names, and use those exact words where they're true for you. Ask me to \"Tailor to a job\" and I do this for you.",
          sw: "Kama tangazo linasema \"udhibiti wa bidhaa\" na wewe uliandika \"inventory\", programu inaweza isiunganishe. Soma tangazo, orodhesha ujuzi na zana halisi inazotaja, tumia maneno hayo pale yanapokuwa kweli kwako. Niambie \"Lenga kwenye kazi\" nafanya hivi kwa ajili yako.",
        },
      },
      {
        heading: { en: "Save as PDF, name it well", sw: "Hifadhi kama PDF, ipe jina zuri" },
        body: {
          en: "Export a text-based PDF (not a photo of a printout). Name the file with your name and the role: \"Amina-Yusuf-Sales-CV.pdf\". Never send a .docx unless the advert asks for it.",
          sw: "Toa PDF yenye maandishi (si picha ya karatasi). Ipe jina lako na cheo: \"Amina-Yusuf-Sales-CV.pdf\". Usitume .docx isipokuwa tangazo linaomba.",
        },
      },
    ],
  },
  {
    id: "interview-six",
    tier: "free",
    minutes: 6,
    icon: "message-circle",
    title: { en: "The six questions you'll almost always get", sw: "Maswali sita utakayoulizwa karibu kila mara" },
    summary: {
      en: "Prepare these once and most interviews stop being scary.",
      sw: "Jiandae haya mara moja na usaili mwingi utaacha kutisha.",
    },
    sections: [
      {
        heading: { en: "\"Tell me about yourself\"", sw: "\"Nieleze kukuhusu\"" },
        body: {
          en: "Not your life story. 30–45 seconds: what you do now, one thing you're good at with a quick example, and why this role. Practice it out loud until it's smooth.",
          sw: "Si historia ya maisha yako. Sekunde 30–45: unachofanya sasa, kitu kimoja unachokifanya vizuri na mfano mfupi, na kwa nini kazi hii. Fanya mazoezi kwa sauti hadi iwe laini.",
        },
      },
      {
        heading: { en: "\"Why do you want to leave your job?\"", sw: "\"Kwa nini unataka kuacha kazi yako?\"" },
        body: {
          en: "Never insult your current employer. Talk about what you're moving toward — more responsibility, a skill you want to grow, a field you care about.",
          sw: "Usimtukane mwajiri wako wa sasa. Ongelea unachokielekea — majukumu zaidi, ujuzi unaotaka kukuza, fani unayoijali.",
        },
      },
      {
        heading: { en: "\"What's a weakness?\"", sw: "\"Udhaifu wako ni upi?\"" },
        body: {
          en: "Pick a real one you're actively fixing, and say what you're doing about it. \"I used to avoid presenting. I now volunteer for it and I've done three this quarter.\"",
          sw: "Chagua wa kweli unaoushughulikia, na sema unachofanya. \"Nilikuwa naepuka kuwasilisha. Sasa najitolea na nimefanya mara tatu robo hii.\"",
        },
      },
      {
        heading: { en: "\"Tell me about a time you…\"", sw: "\"Nieleze wakati ambao…\"" },
        body: {
          en: "Use STAR: Situation (1 sentence), Task (what you had to do), Action (what YOU did), Result (the outcome, with a number if you have one). Prepare two stories that can flex to many questions.",
          sw: "Tumia STAR: Hali (sentensi 1), Jukumu (ulichotakiwa kufanya), Hatua (ulichofanya WEWE), Matokeo (na namba kama unayo). Andaa hadithi mbili zinazoweza kutumika kwa maswali mengi.",
        },
      },
      {
        heading: { en: "\"Where do you see yourself in a few years?\"", sw: "\"Unajiona wapi baada ya miaka michache?\"" },
        body: {
          en: "Show ambition that fits this company. Growing into more responsibility in this field is a safe, honest answer.",
          sw: "Onyesha lengo linalolingana na kampuni hii. Kukua katika majukumu zaidi katika fani hii ni jibu salama na la kweli.",
        },
      },
      {
        heading: { en: "\"Do you have any questions for us?\"", sw: "\"Una maswali kwetu?\"" },
        body: {
          en: "Always have two. \"What does success look like in the first 90 days?\" and \"How is the team structured?\" show you're serious.",
          sw: "Kuwa na mawili kila mara. \"Mafanikio yanaonekanaje katika siku 90 za kwanza?\" na \"Timu imepangwaje?\" zinaonyesha uko makini.",
        },
      },
    ],
  },
  {
    id: "follow-up",
    tier: "free",
    minutes: 3,
    icon: "mail",
    title: { en: "Follow up without being annoying", sw: "Fuatilia maombi yako bila kuudhi" },
    summary: {
      en: "The line between \"keen\" and \"pest\" is timing. Here it is.",
      sw: "Tofauti kati ya \"mwenye hamu\" na \"kero\" ni wakati. Huu hapa.",
    },
    sections: [
      {
        heading: { en: "After applying", sw: "Baada ya kuomba" },
        body: {
          en: "Wait one week. Then a short message: \"I applied for the X role on [date] and I'm still very interested. Happy to share anything else you need.\" One follow-up. If nothing after another week, move on and keep applying elsewhere.",
          sw: "Subiri wiki moja. Kisha ujumbe mfupi: \"Niliomba kazi ya X tarehe [tarehe] na bado nina hamu sana. Nipo tayari kutoa chochote unachohitaji.\" Fuatilio moja. Kama hakuna baada ya wiki nyingine, endelea na kuomba kwingine.",
        },
      },
      {
        heading: { en: "After an interview", sw: "Baada ya usaili" },
        body: {
          en: "Send a thank-you the same day or the next morning. Three sentences: thank them, mention one specific thing from the conversation, restate your interest. This alone puts you ahead of most candidates.",
          sw: "Tuma shukrani siku hiyo hiyo au asubuhi inayofuata. Sentensi tatu: washukuru, taja kitu kimoja mahususi kutoka mazungumzo, rudia hamu yako. Hili peke yake linakuweka mbele ya wagombea wengi.",
        },
      },
    ],
  },
  {
    id: "no-experience",
    tier: "free",
    minutes: 5,
    icon: "trending-up",
    title: { en: "From \"I have no experience\" to \"I have experience\"", sw: "Kutoka \"Sina uzoefu\" hadi \"Nina uzoefu\"" },
    summary: {
      en: "Attachment, coursework, a hustle, volunteering, a family business — none of it is nothing. This is how it becomes experience an employer can read.",
      sw: "Mafunzo kwa vitendo, masomo, biashara ndogo, kujitolea, biashara ya familia — hakuna kisichokuwa kitu. Hivi ndivyo inakuwa uzoefu ambao mwajiri anaweza kuusoma.",
    },
    sections: [
      {
        heading: { en: "Your attachment IS a job", sw: "Mafunzo yako NI kazi" },
        body: {
          en: "List it under Experience with the organisation, the dates, and what you actually did — not \"observed\", but \"prepared\", \"handled\", \"recorded\", \"served\". One real sentence per responsibility.",
          sw: "Iorodheshe chini ya Uzoefu na taasisi, tarehe, na ulichofanya kweli — si \"kutazama\", bali \"kuandaa\", \"kushughulikia\", \"kurekodi\", \"kuhudumia\". Sentensi moja ya kweli kwa kila jukumu.",
        },
      },
      {
        heading: { en: "Coursework and projects count", sw: "Masomo na miradi vinahesabika" },
        body: {
          en: "A final-year project, a class assignment where you built or analysed something real — put it under a \"Projects\" section with what you did and the tools you used.",
          sw: "Mradi wa mwaka wa mwisho, kazi ya darasa ambapo ulijenga au kuchambua kitu halisi — iweke chini ya sehemu ya \"Miradi\" na ulichofanya na zana ulizotumia.",
        },
      },
      {
        heading: { en: "The hustle is transferable", sw: "Biashara ndogo inahamishika" },
        body: {
          en: "Sold airtime, ran a stall, managed a boda, helped in the family shop — that's cash handling, customer service, stock, and reliability. Name those skills. Employers respect people who work.",
          sw: "Uliuza vocha, uliendesha kibanda, ulisimamia boda, ulisaidia dukani — hiyo ni kushika pesa, huduma kwa wateja, bidhaa, na kutegemewa. Taja ujuzi huo. Waajiri wanaheshimu wanaofanya kazi.",
        },
      },
    ],
  },
  {
    id: "salary-nego",
    tier: "premium",
    minutes: 9,
    icon: "briefcase",
    title: { en: "Negotiating your first real offer", sw: "Kujadili ofa yako ya kwanza halisi" },
    summary: {
      en: "You can almost always ask for more — here's how to do it without losing the offer.",
      sw: "Karibu kila mara unaweza kuomba zaidi — hivi ndivyo bila kupoteza ofa.",
    },
    sections: [
      {
        heading: { en: "Premium guide", sw: "Mwongozo wa premium" },
        body: {
          en: "This is a premium guide — the full version covers your BATNA, how to research a real range in your market, the exact words to use on the call, and what to do when they say \"that's the budget\".",
          sw: "Huu ni mwongozo wa premium — toleo kamili linagusia BATNA yako, jinsi ya kutafiti kiwango halisi sokoni, maneno halisi ya kutumia kwenye simu, na cha kufanya wanaposema \"hiyo ndiyo bajeti\".",
        },
      },
    ],
  },
  {
    id: "career-change",
    tier: "premium",
    minutes: 12,
    icon: "target",
    title: { en: "Changing fields without starting from zero", sw: "Kubadili fani bila kuanza chini" },
    summary: {
      en: "Map what you have to what the new field wants, and tell a story that makes the switch obvious.",
      sw: "Oanisha ulicho nacho na fani mpya inachotaka, na simulia hadithi inayofanya mabadiliko yaonekane wazi.",
    },
    sections: [
      {
        heading: { en: "Premium guide", sw: "Mwongozo wa premium" },
        body: {
          en: "The full version includes the transferable-skills map, the bridge CV structure, and a 90-day plan to build the one missing skill that's blocking you.",
          sw: "Toleo kamili linajumuisha ramani ya ujuzi unaohamishika, muundo wa CV wa daraja, na mpango wa siku 90 wa kujenga ujuzi mmoja unaokukwamisha.",
        },
      },
    ],
  },
  {
    id: "linkedin",
    tier: "premium",
    minutes: 8,
    icon: "globe",
    title: { en: "A LinkedIn recruiters actually open", sw: "LinkedIn ambayo waajiri wanafungua kweli" },
    summary: {
      en: "The headline, the About, and the three settings that get you found.",
      sw: "Kichwa, sehemu ya About, na mipangilio mitatu inayokufanya upatikane.",
    },
    sections: [
      {
        heading: { en: "Premium guide", sw: "Mwongozo wa premium" },
        body: {
          en: "The full version has headline formulas by role, an About template you fill in, and how to turn on \"Open to work\" the right way.",
          sw: "Toleo kamili lina fomula za kichwa kwa kila cheo, kiolezo cha About unachojaza, na jinsi ya kuwasha \"Open to work\" kwa usahihi.",
        },
      },
    ],
  },
];

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}
