// SEO metadata for each PDF tool. The interactive tools all live on the client
// `/tools` page (deep-linked via `/tools#tool-<id>`), which has no server-rendered
// title or crawlable copy. These records back one indexable landing page per tool
// (`/tools/<slug>`) so high-intent queries like "merge PDF" or "image to PDF free"
// have a real page to rank — mirroring the per-template SEO pages.
//
// `slug` MUST match the ToolId used on the /tools page so the CTA deep-link
// (`/tools#tool-<slug>`) opens the right tool.
//
// Sumaiya is a Swahili-first product (default lang "sw") reached from an
// in-product Swahili link, so every reader-facing field carries both languages.
// Localizable text uses a `{ en; sw }` shape (`steps` an `{ en: string[]; sw:
// string[] }`, each FAQ a `{ q: Loc; a: Loc }`); consumers pick with the
// resolved `Lang`. `keywords` stay English — they target English search demand.

// A single string localized into both supported languages. Index with a `Lang`
// (`name[lang]`) to pick the right one.
export type Loc = { en: string; sw: string };

export interface PdfToolSeo {
  slug: string;
  name: Loc;
  // Short tagline shown under the H1.
  tagline: Loc;
  // 1–2 sentence meta description (also the lead paragraph).
  description: Loc;
  // Search terms this page targets — folded into the metadata keywords.
  // English-only on purpose: these mirror how people actually search.
  keywords: string[];
  // Plain, honest "how to" steps — good on-page content and a HowTo schema.
  steps: { en: string[]; sw: string[] };
  // A few real questions people search, answered — FAQ content + FAQ schema.
  faqs: { q: Loc; a: Loc }[];
}

export const PDF_TOOLS: PdfToolSeo[] = [
  {
    slug: "image-to-pdf",
    name: { en: "Image to PDF", sw: "Picha hadi PDF" },
    tagline: {
      en: "Turn JPG & PNG photos or scans into a clean PDF",
      sw: "Geuza picha za JPG na PNG au skani kuwa PDF safi",
    },
    description: {
      en: "Convert images to PDF free. Combine JPG and PNG photos, scans, or screenshots into a single professional PDF document — right in your browser, with nothing uploaded to a server for storage.",
      sw: "Badilisha picha kuwa PDF bila malipo. Unganisha picha za JPG na PNG, skani, au picha za skrini kuwa hati moja ya PDF ya kitaalamu — moja kwa moja kwenye kivinjari chako, bila kupakia kwenye seva yoyote kwa ajili ya kuhifadhi.",
    },
    keywords: ["image to pdf", "jpg to pdf", "png to pdf", "convert photo to pdf", "scan to pdf", "picture to pdf free"],
    steps: {
      en: [
        "Select or drop the JPG/PNG images you want to convert — add as many as you like.",
        "Reorder them if needed so the pages come out in the right sequence.",
        "Click convert and download your PDF in seconds.",
      ],
      sw: [
        "Chagua au dondosha picha za JPG/PNG unazotaka kubadilisha — ongeza nyingi upendavyo.",
        "Zipange upya ikihitajika ili kurasa zitoke katika mpangilio sahihi.",
        "Bofya kubadilisha na upakue PDF yako ndani ya sekunde chache.",
      ],
    },
    faqs: [
      {
        q: { en: "Is converting images to PDF free?", sw: "Je, kubadilisha picha kuwa PDF ni bure?" },
        a: {
          en: "Yes. Image to PDF is completely free with no sign-up, watermark, or page limit.",
          sw: "Ndiyo. Picha hadi PDF ni bila malipo kabisa bila usajili, alama ya maji, au kikomo cha kurasa.",
        },
      },
      {
        q: { en: "Can I combine several photos into one PDF?", sw: "Je, naweza kuunganisha picha kadhaa kuwa PDF moja?" },
        a: {
          en: "Yes — add multiple JPG or PNG files and they'll be merged into a single PDF, one image per page.",
          sw: "Ndiyo — ongeza faili nyingi za JPG au PNG nazo zitaunganishwa kuwa PDF moja, picha moja kwa kila ukurasa.",
        },
      },
      {
        q: { en: "Are my images stored anywhere?", sw: "Je, picha zangu zinahifadhiwa mahali popote?" },
        a: {
          en: "No. Files are processed to build your PDF and are not kept — nothing is stored after your download.",
          sw: "Hapana. Faili zinachakatwa ili kutengeneza PDF yako na haziwekwi — hakuna kinachohifadhiwa baada ya kupakua kwako.",
        },
      },
    ],
  },
  {
    slug: "merge",
    name: { en: "Merge PDF", sw: "Unganisha PDF" },
    tagline: {
      en: "Combine multiple PDFs into one document",
      sw: "Unganisha PDF nyingi kuwa hati moja",
    },
    description: {
      en: "Merge PDF files free. Join two or more PDFs into a single document in the order you choose — perfect for combining a CV, cover letter, and certificates into one file to send to employers.",
      sw: "Unganisha faili za PDF bila malipo. Ambatanisha PDF mbili au zaidi kuwa hati moja katika mpangilio unaochagua — inafaa kwa kuunganisha CV, barua ya maombi, na vyeti kuwa faili moja ya kutuma kwa waajiri.",
    },
    keywords: ["merge pdf", "combine pdf", "join pdf files", "merge pdf free", "put pdfs together", "combine cv and cover letter pdf"],
    steps: {
      en: [
        "Add the PDF files you want to combine — two or more.",
        "Arrange them in the order you want them to appear.",
        "Click merge and download the single combined PDF.",
      ],
      sw: [
        "Ongeza faili za PDF unazotaka kuunganisha — mbili au zaidi.",
        "Zipange katika mpangilio unaotaka zionekane.",
        "Bofya kuunganisha na upakue PDF moja iliyounganishwa.",
      ],
    },
    faqs: [
      {
        q: { en: "How many PDFs can I merge at once?", sw: "Naweza kuunganisha PDF ngapi kwa mara moja?" },
        a: {
          en: "You can merge several PDFs in one go. Keep the total under 15 MB for the fastest results.",
          sw: "Unaweza kuunganisha PDF kadhaa kwa mara moja. Weka jumla chini ya MB 15 kwa matokeo ya haraka zaidi.",
        },
      },
      {
        q: { en: "Will merging change the quality of my PDF?", sw: "Je, kuunganisha kutabadilisha ubora wa PDF yangu?" },
        a: {
          en: "No. Merging keeps every page exactly as it was — text stays selectable and images keep their resolution.",
          sw: "Hapana. Kuunganisha kunaweka kila ukurasa kama ulivyokuwa — maandishi yanabaki yanaweza kuchaguliwa na picha zinabaki na uwazi wake.",
        },
      },
      {
        q: { en: "Is it free to merge PDF files?", sw: "Je, ni bure kuunganisha faili za PDF?" },
        a: {
          en: "Yes, merging PDFs is 100% free with no watermark and no account required.",
          sw: "Ndiyo, kuunganisha PDF ni bila malipo kabisa bila alama ya maji na bila kuhitaji akaunti.",
        },
      },
    ],
  },
  {
    slug: "split",
    name: { en: "Split PDF", sw: "Gawanya PDF" },
    tagline: {
      en: "Extract specific pages or ranges from a PDF",
      sw: "Toa kurasa au safu mahususi kutoka kwa PDF",
    },
    description: {
      en: "Split PDF free. Pull out the exact pages you need — single pages or ranges like 1-5, 7, 9-12 — into a new PDF. Great for sending just the relevant part of a longer document.",
      sw: "Gawanya PDF bila malipo. Toa kurasa hasa unazohitaji — kurasa moja moja au safu kama 1-5, 7, 9-12 — kuwa PDF mpya. Inafaa kwa kutuma sehemu husika tu ya hati ndefu.",
    },
    keywords: ["split pdf", "extract pages from pdf", "separate pdf pages", "split pdf free", "get one page from pdf", "pdf page extractor"],
    steps: {
      en: [
        "Upload the PDF you want to split.",
        "Enter the pages or ranges to keep, for example 1-5, 7, 9-12.",
        "Click split and download the new PDF with just those pages.",
      ],
      sw: [
        "Pakia PDF unayotaka kugawanya.",
        "Weka kurasa au safu za kubaki, kwa mfano 1-5, 7, 9-12.",
        "Bofya kugawanya na upakue PDF mpya yenye kurasa hizo tu.",
      ],
    },
    faqs: [
      {
        q: { en: "How do I choose which pages to keep?", sw: "Nachaguaje kurasa za kubaki?" },
        a: {
          en: "Type page numbers and ranges separated by commas — like 1-3, 6, 10 — and only those pages go into the new PDF.",
          sw: "Andika nambari za kurasa na safu zikitenganishwa kwa koma — kama 1-3, 6, 10 — na kurasa hizo tu ndizo zitaingia kwenye PDF mpya.",
        },
      },
      {
        q: { en: "Is splitting a PDF free?", sw: "Je, kugawanya PDF ni bure?" },
        a: {
          en: "Yes. Splitting a PDF is free with no sign-up or watermark.",
          sw: "Ndiyo. Kugawanya PDF ni bila malipo bila usajili au alama ya maji.",
        },
      },
      {
        q: { en: "Can I extract a single page?", sw: "Je, naweza kutoa ukurasa mmoja tu?" },
        a: {
          en: "Yes — just enter that one page number to get a one-page PDF.",
          sw: "Ndiyo — weka tu nambari ya ukurasa huo mmoja upate PDF ya ukurasa mmoja.",
        },
      },
    ],
  },
  {
    slug: "rotate",
    name: { en: "Rotate PDF", sw: "Zungusha PDF" },
    tagline: {
      en: "Turn sideways or upside-down pages the right way up",
      sw: "Rekebisha kurasa zilizolala au zilizogeuka juu chini ziwe sawa",
    },
    description: {
      en: "Rotate PDF free. Fix pages that scanned in sideways or upside down — rotate the whole document or only the pages you choose by 90, 180, or 270 degrees, then download.",
      sw: "Zungusha PDF bila malipo. Rekebisha kurasa zilizoskaniwa zikiwa zimelala au zimegeuka juu chini — zungusha hati nzima au kurasa unazochagua tu kwa digrii 90, 180, au 270, kisha upakue.",
    },
    keywords: ["rotate pdf", "turn pdf page", "fix sideways pdf", "rotate pdf pages free", "flip pdf page", "rotate scanned pdf"],
    steps: {
      en: [
        "Upload the PDF with pages facing the wrong way.",
        "Choose the rotation angle — 90°, 180°, or 270° — and, optionally, the specific pages.",
        "Click rotate and download the corrected PDF.",
      ],
      sw: [
        "Pakia PDF yenye kurasa zinazoelekea upande usio sahihi.",
        "Chagua pembe ya kuzungusha — 90°, 180°, au 270° — na, kwa hiari, kurasa mahususi.",
        "Bofya kuzungusha na upakue PDF iliyorekebishwa.",
      ],
    },
    faqs: [
      {
        q: { en: "Can I rotate only some pages?", sw: "Je, naweza kuzungusha baadhi ya kurasa tu?" },
        a: {
          en: "Yes. Leave the pages field blank to rotate the whole document, or list specific pages to rotate just those.",
          sw: "Ndiyo. Acha sehemu ya kurasa wazi ili kuzungusha hati nzima, au orodhesha kurasa mahususi kuzungusha hizo tu.",
        },
      },
      {
        q: { en: "Does rotating a PDF lose quality?", sw: "Je, kuzungusha PDF kunapoteza ubora?" },
        a: {
          en: "No. Rotation only changes the page orientation — text and images are untouched.",
          sw: "Hapana. Kuzungusha kunabadilisha tu mwelekeo wa ukurasa — maandishi na picha havichezewi.",
        },
      },
      {
        q: { en: "Is it free to rotate a PDF?", sw: "Je, ni bure kuzungusha PDF?" },
        a: {
          en: "Yes, rotating a PDF is completely free with no account needed.",
          sw: "Ndiyo, kuzungusha PDF ni bila malipo kabisa bila kuhitaji akaunti.",
        },
      },
    ],
  },
  {
    slug: "watermark",
    name: { en: "Watermark PDF", sw: "Weka Alama ya Maji" },
    tagline: {
      en: "Stamp DRAFT or CONFIDENTIAL across every page",
      sw: "Piga alama ya RASIMU au SIRI kwenye kila ukurasa",
    },
    description: {
      en: "Add a watermark to a PDF free. Stamp text like DRAFT, CONFIDENTIAL, or your name diagonally across every page to mark ownership or status before you share a document.",
      sw: "Ongeza alama ya maji kwenye PDF bila malipo. Piga maandishi kama RASIMU, SIRI, au jina lako kwa mshazari kwenye kila ukurasa ili kuonyesha umiliki au hali kabla ya kushiriki hati.",
    },
    keywords: ["watermark pdf", "add watermark to pdf", "stamp pdf", "pdf watermark free", "add draft to pdf", "confidential stamp pdf"],
    steps: {
      en: [
        "Upload the PDF you want to watermark.",
        "Type the watermark text, such as DRAFT or CONFIDENTIAL.",
        "Click apply and download the watermarked PDF.",
      ],
      sw: [
        "Pakia PDF unayotaka kuweka alama ya maji.",
        "Andika maandishi ya alama ya maji, kama RASIMU au SIRI.",
        "Bofya kutumia na upakue PDF yenye alama ya maji.",
      ],
    },
    faqs: [
      {
        q: { en: "What text can I use as a watermark?", sw: "Naweza kutumia maandishi gani kama alama ya maji?" },
        a: {
          en: "Any short text up to 60 characters — common choices are DRAFT, CONFIDENTIAL, COPY, or your name.",
          sw: "Maandishi yoyote mafupi hadi herufi 60 — machaguo ya kawaida ni RASIMU, SIRI, NAKALA, au jina lako.",
        },
      },
      {
        q: { en: "Does the watermark appear on every page?", sw: "Je, alama ya maji inaonekana kwenye kila ukurasa?" },
        a: {
          en: "Yes, the text is stamped diagonally across all pages of the document.",
          sw: "Ndiyo, maandishi yanapigwa kwa mshazari kwenye kurasa zote za hati.",
        },
      },
      {
        q: { en: "Is adding a watermark free?", sw: "Je, kuongeza alama ya maji ni bure?" },
        a: {
          en: "Yes. Watermarking a PDF is free with no sign-up or watermark from us.",
          sw: "Ndiyo. Kuweka alama ya maji kwenye PDF ni bila malipo bila usajili na bila alama ya maji kutoka kwetu.",
        },
      },
    ],
  },
  {
    slug: "page-numbers",
    name: { en: "Add Page Numbers to PDF", sw: "Ongeza Nambari za Kurasa kwenye PDF" },
    tagline: {
      en: "Number every page of a PDF automatically",
      sw: "Weka nambari kwenye kila ukurasa wa PDF kiotomatiki",
    },
    description: {
      en: "Add page numbers to a PDF free. Automatically number every page of your document — useful for reports, contracts, and multi-page applications — then download the numbered PDF.",
      sw: "Ongeza nambari za kurasa kwenye PDF bila malipo. Weka nambari kiotomatiki kwenye kila ukurasa wa hati yako — inafaa kwa ripoti, mikataba, na maombi ya kurasa nyingi — kisha upakue PDF yenye nambari.",
    },
    keywords: ["add page numbers to pdf", "number pdf pages", "pdf page numbers free", "insert page numbers pdf", "paginate pdf"],
    steps: {
      en: [
        "Upload the PDF you want to number.",
        "Click apply — every page is numbered automatically.",
        "Download the numbered PDF.",
      ],
      sw: [
        "Pakia PDF unayotaka kuweka nambari.",
        "Bofya kutumia — kila ukurasa unawekwa nambari kiotomatiki.",
        "Pakua PDF yenye nambari.",
      ],
    },
    faqs: [
      {
        q: { en: "Where do the page numbers appear?", sw: "Nambari za kurasa zinaonekana wapi?" },
        a: {
          en: "Page numbers are placed neatly at the foot of each page so they don't interfere with your content.",
          sw: "Nambari za kurasa zinawekwa vizuri chini ya kila ukurasa ili zisiingiliane na maudhui yako.",
        },
      },
      {
        q: { en: "Is adding page numbers free?", sw: "Je, kuongeza nambari za kurasa ni bure?" },
        a: {
          en: "Yes, it's completely free with no account required.",
          sw: "Ndiyo, ni bila malipo kabisa bila kuhitaji akaunti.",
        },
      },
      {
        q: { en: "Will it renumber a document that already has numbers?", sw: "Je, itaweka nambari upya kwenye hati ambayo tayari ina nambari?" },
        a: {
          en: "It adds a fresh set of numbers — for best results use it on documents that aren't already numbered.",
          sw: "Inaongeza nambari mpya — kwa matokeo bora tumia kwenye hati ambazo bado hazina nambari.",
        },
      },
    ],
  },
  {
    slug: "delete-pages",
    name: { en: "Delete Pages from PDF", sw: "Futa Kurasa kutoka kwa PDF" },
    tagline: {
      en: "Remove unwanted pages from a PDF",
      sw: "Ondoa kurasa zisizohitajika kutoka kwa PDF",
    },
    description: {
      en: "Delete pages from a PDF free. Remove blank, duplicate, or unwanted pages by listing the page numbers to drop, and download a cleaner PDF — no software to install.",
      sw: "Futa kurasa kutoka kwa PDF bila malipo. Ondoa kurasa tupu, zilizojirudia, au zisizohitajika kwa kuorodhesha nambari za kurasa za kuondoa, na upakue PDF safi zaidi — bila programu ya kusakinisha.",
    },
    keywords: ["delete pages from pdf", "remove pdf pages", "remove page from pdf free", "delete blank pages pdf", "pdf page remover"],
    steps: {
      en: [
        "Upload the PDF you want to trim.",
        "Enter the page numbers to remove, for example 2, 5, 8.",
        "Click apply and download the PDF without those pages.",
      ],
      sw: [
        "Pakia PDF unayotaka kupunguza.",
        "Weka nambari za kurasa za kuondoa, kwa mfano 2, 5, 8.",
        "Bofya kutumia na upakue PDF bila kurasa hizo.",
      ],
    },
    faqs: [
      {
        q: { en: "How do I remove more than one page?", sw: "Naondoaje zaidi ya ukurasa mmoja?" },
        a: {
          en: "List the page numbers separated by commas — like 2, 5, 8 — and all of them are removed at once.",
          sw: "Orodhesha nambari za kurasa zikitenganishwa kwa koma — kama 2, 5, 8 — nazo zote zinaondolewa kwa mara moja.",
        },
      },
      {
        q: { en: "Is deleting PDF pages free?", sw: "Je, kufuta kurasa za PDF ni bure?" },
        a: {
          en: "Yes. Removing pages from a PDF is free with no sign-up or watermark.",
          sw: "Ndiyo. Kuondoa kurasa kutoka kwa PDF ni bila malipo bila usajili au alama ya maji.",
        },
      },
      {
        q: { en: "Can I undo it?", sw: "Je, naweza kutendua?" },
        a: {
          en: "Your original file is never changed — you download a new PDF, so the original stays intact on your device.",
          sw: "Faili yako ya awali haibadilishwi kamwe — unapakua PDF mpya, hivyo ya awali inabaki salama kwenye kifaa chako.",
        },
      },
    ],
  },
  {
    slug: "extract-text",
    name: { en: "Extract Text from PDF", sw: "Toa Maandishi kutoka kwa PDF" },
    tagline: {
      en: "Pull all the text out of a PDF",
      sw: "Vuta maandishi yote kutoka kwa PDF",
    },
    description: {
      en: "Extract text from a PDF free. Copy all the text content out of a digital or scanned PDF — then turn it straight into an editable CV with our AI importer if you like.",
      sw: "Toa maandishi kutoka kwa PDF bila malipo. Nakili maudhui yote ya maandishi kutoka kwa PDF ya dijitali au ya skani — kisha uyageuze moja kwa moja kuwa CV inayohaririwa kwa kutumia kiingizaji chetu cha AI ukipenda.",
    },
    keywords: ["extract text from pdf", "pdf to text", "copy text from pdf", "get text out of pdf free", "pdf text extractor", "convert pdf to editable"],
    steps: {
      en: [
        "Upload the PDF you want to read the text from.",
        "Click extract — the text appears ready to copy.",
        "Optionally turn an extracted CV into an editable document in one click.",
      ],
      sw: [
        "Pakia PDF unayotaka kusoma maandishi yake.",
        "Bofya kutoa — maandishi yanaonekana tayari kunakiliwa.",
        "Kwa hiari, geuza CV iliyotolewa kuwa hati inayohaririwa kwa mbofyo mmoja.",
      ],
    },
    faqs: [
      {
        q: { en: "Does it work on scanned PDFs?", sw: "Je, inafanya kazi kwenye PDF za skani?" },
        a: {
          en: "It reads the text layer of a PDF. Digital PDFs work best; a scanned image with no text layer may return little or nothing.",
          sw: "Inasoma safu ya maandishi ya PDF. PDF za dijitali zinafanya kazi vizuri zaidi; picha ya skani isiyo na safu ya maandishi inaweza kurudisha kidogo au bila kitu.",
        },
      },
      {
        q: { en: "Can I edit the text afterwards?", sw: "Je, naweza kuhariri maandishi baadaye?" },
        a: {
          en: "Yes — if the text is a CV, you can send it straight to our AI importer and get an editable, ready-to-format CV.",
          sw: "Ndiyo — ikiwa maandishi ni CV, unaweza kuyatuma moja kwa moja kwa kiingizaji chetu cha AI na kupata CV inayohaririwa, tayari kupangwa.",
        },
      },
      {
        q: { en: "Is extracting text free?", sw: "Je, kutoa maandishi ni bure?" },
        a: {
          en: "Yes, extracting text from a PDF is completely free.",
          sw: "Ndiyo, kutoa maandishi kutoka kwa PDF ni bila malipo kabisa.",
        },
      },
    ],
  },
];

export function getPdfTool(slug: string): PdfToolSeo | undefined {
  return PDF_TOOLS.find((t) => t.slug === slug);
}
