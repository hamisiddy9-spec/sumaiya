"use client";

import { useState, useRef, useEffect, useMemo, type Ref } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TEMPLATES, type CVData, type TemplateId } from "@/types";
import { HERO_TEMPLATE_COMPONENTS } from "@/components/templates/hero-registry";
import { useLang } from "@/lib/i18n/context";
import { translations } from "@/lib/i18n/translations";
import posthog from "@/lib/analytics";
import { Logo } from "@/components/ui/logo";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Footer } from "@/components/ui/footer";
import { ScanToApp } from "@/components/marketing/scan-to-app";
import { PDF_TOOL_LINKS, pdfToolHref } from "@/lib/pdf-tools-list";
import { getSampleCV } from "@/lib/sample-cv";
import { INTER_STACK } from "@/lib/fonts";

// ─── Sample CV data ───────────────────────────────────────────────────────────

// The example CV comes from the shared lib/sample-cv.ts, so the homepage, the
// template gallery and the editor's "start from an example" flow cannot drift
// apart. It used to be a second, hand-maintained copy of the same Kenyan persona
// ("Amara Osei", Nairobi, +254) — which is exactly the trust problem the brand
// review found: a stranger in Dar es Salaam saw a Nairobi phone number and
// concluded the product was not for her. SAMPLE_PHOTO is all that is left here:
// a decorative avatar with no person behind it.
const SAMPLE_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e8d5c0'/%3E%3Ccircle cx='100' cy='75' r='45' fill='%238B5E3C'/%3E%3Cellipse cx='100' cy='46' rx='32' ry='20' fill='%233D2314'/%3E%3Cpath d='M15 200 C15 148 55 130 100 130 C145 130 185 148 185 200Z' fill='%238B5E3C'/%3E%3C/svg%3E";


// ─── Hero cycle templates ─────────────────────────────────────────────────────

const HERO_CYCLE: { id: TemplateId; color: string }[] = [
  { id: "nakuru",       color: "#DA4A1C" },
  { id: "kilimanjaro",  color: "#211A15" },
  { id: "serengeti",    color: "#12433D" },
  { id: "zanzibar",     color: "#7C3AED" },
  { id: "ubuntu",       color: "#F2A93B" },
  { id: "savanna",      color: "#B57A18" },
];

const HERO_W = 240;
const HERO_SCALE = HERO_W / 794;
const HERO_H = Math.round(1123 * HERO_SCALE);

// ─── Hero CV Panel (floating card) ────────────────────────────────────────────

function HeroCVPanel({
  templateId,
  color,
  opacity,
  floatDelay,
  data,
}: {
  templateId: TemplateId;
  color: string;
  opacity: number;
  floatDelay: string;
  data: CVData;
}) {
  const Component = HERO_TEMPLATE_COMPONENTS[templateId];
  return (
    <div
      className={`animate-float ${floatDelay}`}
      style={{
        width: HERO_W,
        height: HERO_H,
        overflow: "hidden",
        position: "relative",
        borderRadius: 14,
        background: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(33,26,21,0.05), 0 12px 40px rgba(33,26,21,0.10)",
        flexShrink: 0,
        opacity,
        transition: "opacity 0.35s ease, transform 0.35s ease",
        transform: "perspective(800px) rotateY(-6deg) rotateX(2deg)",
      }}
    >
      <div
        style={{
          width: 794,
          minHeight: 1123,
          transform: `scale(${HERO_SCALE})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <Component data={data} primaryColor={color} fontFamily={INTER_STACK} />
      </div>
    </div>
  );
}

// ─── Template Preview (for product grid / template showcase) ───────────────────

function TemplatePreview({
  templateId,
  primaryColor,
  scale,
  data,
}: {
  templateId: TemplateId;
  primaryColor: string;
  scale: number;
  data: CVData;
}) {
  const Component = HERO_TEMPLATE_COMPONENTS[templateId];
  const previewH = Math.round(1123 * scale);
  return (
    <div style={{ width: "100%", height: previewH, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: 794,
          minHeight: 1123,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        <Component data={data} primaryColor={primaryColor} fontFamily={INTER_STACK} />
      </div>
    </div>
  );
}

// One showcase cell that crossfades through its lane of templates on a timer.
function CyclingCell({
  lane, delayMs, intervalMs, scale, lang, data, innerRef,
}: {
  lane: (typeof TEMPLATES)[number][];
  delayMs: number;
  intervalMs: number;
  scale: number;
  lang: "en" | "sw";
  data: CVData;
  innerRef?: Ref<HTMLDivElement>;
}) {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || lane.length <= 1) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      setIdx((i) => (i + 1) % lane.length);
      interval = setInterval(() => setIdx((i) => (i + 1) % lane.length), intervalMs);
    }, delayMs);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [reduce, lane.length, delayMs, intervalMs]);

  const cur = lane[idx] ?? lane[0];
  const previewH = Math.round(1123 * scale);

  return (
    <div ref={innerRef} className="reveal relative overflow-hidden bg-card group">
      <div className="relative" style={{ height: previewH }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={cur.id}
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <TemplatePreview templateId={cur.id} primaryColor={cur.previewColor} scale={scale} data={data} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end p-4 transition-opacity duration-200 z-20 opacity-100 bg-gradient-to-t from-espresso/95 via-espresso/40 to-transparent md:opacity-0 md:group-hover:opacity-100 md:bg-espresso/80 md:from-transparent md:via-transparent">
        <p className="font-display font-bold text-sm text-cream mb-3 tracking-tight">{cur.name}</p>
        <Link
          href={"/editor/cv/try?template=" + cur.id}
          className="w-full text-center text-sm font-semibold text-cream bg-ember shadow-ember-hard rounded-[10px] px-4 py-3 hover:bg-ember-hover active:shadow-ember-active active:translate-y-[2px] transition-all duration-150"
        >
          {lang === "sw" ? "Tumia muundo huu" : "Use this look"}
        </Link>
      </div>
    </div>
  );
}

// ─── Homepage template filtering ──────────────────────────────────────────────

// Animated showcase — a curated pool the six preview cells rotate through, so
// the grid stays alive and reveals the whole library over time (not 6 fixed).
const SHOWCASE_IDS = [
  "rift", "zahabu", "nuru", "pemba", "malachite", "coral",
  "kioo", "bento", "zege", "riso", "vibe", "neon",
  "regent", "marlowe", "haven", "nakuru", "serengeti", "zanzibar",
];
const SHOWCASE = SHOWCASE_IDS
  .map((id) => TEMPLATES.find((t) => t.id === id))
  .filter((t): t is (typeof TEMPLATES)[number] => Boolean(t));
// Six lanes (round-robin) so every cell shows a distinct template at any moment.
const SHOWCASE_LANES = Array.from({ length: 6 }, (_, i) =>
  SHOWCASE.filter((_, k) => k % 6 === i)
);

// ─── Product data ─────────────────────────────────────────────────────────────

interface ProductItem {
  iconName: "cv" | "mail" | "card" | "letter";
  title: string;
  desc: string;
  count: string;
  href: string;
  bgColor: string;
  iconColor: string;
}

const PRODUCTS_EN: ProductItem[] = [
  {
    iconName: "cv",
    title: "CV builder",
    desc: "Write it once, aim it at the advert you are applying for, and download a PDF you own. Free.",
    count: "47 looks",
    href: "/editor/cv/try",
    bgColor: "bg-ember-tint",
    iconColor: "text-ember",
  },
  {
    iconName: "mail",
    title: "Cover letters",
    desc: "The letter that goes with your CV, written to match the same advert.",
    count: "27 looks",
    href: "/editor/cover-letter/try",
    bgColor: "bg-pine-tint",
    iconColor: "text-pine",
  },
  {
    iconName: "card",
    title: "Business cards",
    desc: "A card with your name, phone and email, ready to print or to send as a PDF.",
    count: "29 designs",
    href: "/editor/business-card/try",
    bgColor: "bg-gold-tint",
    iconColor: "text-gold",
  },
  {
    iconName: "letter",
    title: "Formal letters",
    desc: "Application, reference and resignation letters in the format employers expect.",
    count: "17 looks",
    href: "/editor/letter/try",
    bgColor: "bg-purple-tint",
    iconColor: "text-purple-glow",
  },
];

const PRODUCTS_SW: ProductItem[] = [
  {
    iconName: "cv",
    title: "Kuunda CV",
    desc: "Andika mara moja, ilenge kwa tangazo la kazi unayoomba, kisha pakua PDF yako mwenyewe. Bure.",
    count: "Miundo 47",
    href: "/editor/cv/try",
    bgColor: "bg-ember-tint",
    iconColor: "text-ember",
  },
  {
    iconName: "mail",
    title: "Barua za Maombi",
    desc: "Barua inayoenda na CV yako, iliyoandikwa kwa tangazo hilo hilo.",
    count: "Miundo 27",
    href: "/editor/cover-letter/try",
    bgColor: "bg-pine-tint",
    iconColor: "text-pine",
  },
  {
    iconName: "card",
    title: "Kadi za Biashara",
    desc: "Kadi yenye jina lako, simu na barua pepe, tayari kuchapishwa au kutumwa kama PDF.",
    count: "Miundo 29",
    href: "/editor/business-card/try",
    bgColor: "bg-gold-tint",
    iconColor: "text-gold",
  },
  {
    iconName: "letter",
    title: "Barua Rasmi",
    desc: "Barua za maombi, mapendekezo na kujiuzulu — kwa muundo unaotarajiwa na waajiri.",
    count: "Miundo 17",
    href: "/editor/letter/try",
    bgColor: "bg-purple-tint",
    iconColor: "text-purple-glow",
  },
];

// ─── Scroll reveal hook ───────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<Element>(".reveal");
    if (!els.length) return;

    const revealAll = () => els.forEach((el) => el.classList.add("visible"));

    // Older browsers / privacy modes that lack IntersectionObserver: show
    // everything immediately rather than leave it stuck at opacity:0.
    if (typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => obs.observe(el));

    // Safety net: if the observer never fires for some elements (some Safari/
    // Opera edge cases with restored bfcache pages or zero-height reflows), make
    // sure nothing stays permanently hidden.
    const fallback = window.setTimeout(revealAll, 1600);

    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
}

// ─── Landing Page (Warm Confidence Design) ────────────────────────────────────

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cardScale, setCardScale] = useState(210 / 794);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const nextPanelRef = useRef(0);
  const nextTemplateRef = useRef(0);
  const lang = useLang();
  const tr = translations[lang];
  const router = useRouter();

  // A signed-in person should never be shown the sales pitch — they already have
  // an account. Send them to their work instead.
  //
  // Deliberately client-side. The bare `/` path is served from the CDN cache
  // (`s-maxage=300` in middleware), so a per-user redirect decided there would be
  // cached and then handed to everyone: one signed-in visitor's bounce would
  // become every stranger's first impression. The prerendered /en and /sw SEO
  // paths carry the search weight and are untouched by this.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        // Middleware localises a bare path, so no need to build `/sw/...` here.
        if (!cancelled && data.user) router.replace("/dashboard");
      } catch {
        /* a session hiccup must never break the landing page */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Hero panel cycling state
  const [panelIdxs, setPanelIdxs] = useState([0, 1, 2, 3]);
  const [dimPanel, setDimPanel] = useState<number | null>(null);

  function toggleLang() {
    const next = lang === "en" ? "sw" : "en";
    document.cookie = `lang=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  useReveal();

  // Card scale for template grid
  useEffect(() => {
    const el = firstCardRef.current;
    if (!el) return;
    const update = () => { const w = el.offsetWidth; if (w > 0) setCardScale(w / 794); };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Hero auto-cycle
  useEffect(() => {
    const t = setInterval(() => {
      const panel = nextPanelRef.current % 4;
      const nextTpl = nextTemplateRef.current % HERO_CYCLE.length;
      nextPanelRef.current++;
      nextTemplateRef.current++;
      setDimPanel(panel);
      setTimeout(() => {
        setPanelIdxs((prev) => {
          const next = [...prev];
          next[panel] = nextTpl;
          return next;
        });
        setDimPanel(null);
      }, 360);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const PRODUCTS = lang === "sw" ? PRODUCTS_SW : PRODUCTS_EN;

  // The example CV follows the interface language, from the single shared source.
  // The decorative avatar is merged in here rather than living in lib/sample-cv.ts,
  // which is deliberately photo-less.
  const SAMPLE_CV: CVData = useMemo(() => {
    const cv = getSampleCV(lang as "en" | "sw");
    return { ...cv, personal: { ...cv.personal, photo: SAMPLE_PHOTO } };
  }, [lang]);

  // Landing FAQ — handles the common objections AND earns FAQ rich results.
  //
  // Ordered by what the stranger-read pass said the page hides: money, the
  // account ask, whether it works on a bad connection, and where it is available.
  // Every answer is checkable against the product today — notably, nothing here
  // promises that an employer will reply.
  const FAQS = lang === "sw"
    ? [
        { q: "Je, Sumaiya ni bure kweli?", a: "Ndiyo. Unaunda CV yako na kupakua PDF bila kulipa kitu. Kwa sasa malipo hayajawashwa kabisa, ndiyo maana hutaona bei yoyote mahali popote." },
        { q: "Je, ninahitaji kufungua akaunti?", a: "Hapana. Unaweza kuandika CV yako na kupakua faili lako bila akaunti. Unaingia tu ukitaka kuhifadhi kazi yako mtandaoni au kuipata kwenye simu nyingine." },
        { q: "Je, inafanya kazi kwenye simu ya kawaida na bando la kawaida?", a: "Ndiyo. Hakuna cha kupakua, na PDF yako inatengenezwa ndani ya simu yako. Ukurasa wenyewe unahitaji mtandao mara moja ili ufunguke; baada ya hapo, kuandika na kupakua hakuhitaji bando lingine." },
        { q: "Je, naweza kuitumia kwa Kiswahili?", a: "Ndiyo — Kiswahili ni lugha ya kwanza ya Sumaiya. Menyu, maelekezo, mfano wa CV na ukurasa huu wote vipo kwa Kiswahili, na Kiingereza kinapatikana ukitaka." },
        { q: "Je, CV inaonekanaje kwa mwajiri?", a: "CV yako ina safu moja, vichwa wazi na maandishi halisi, ili mtu na programu ziweze kuisoma kwa urahisi. Hatuwezi kuahidi kuwa mwajiri atakujibu — hakuna zana inayoweza kuahidi hilo. Tunachoweza kuhakikisha ni kwamba CV yako inasomeka, ina sehemu zote mwajiri anazotafuta, na inalingana na tangazo uliloomba." },
        { q: "Je, Sumaiya inapatikana wapi?", a: "Tunaanza Tanzania. Kutoka hapa tunapanua Afrika Mashariki na Afrika nzima. Kila kitu kinapatikana kwa Kiswahili na Kiingereza tangu sasa." },
        { q: "Je, naweza kupata faili la Word (DOCX)?", a: "Ndiyo. Mbali na PDF safi, unaweza kupakua CV yako kama faili la Word linalohaririwa." },
      ]
    : [
        { q: "Is Sumaiya really free?", a: "Yes. You build your CV and download the PDF without paying anything. Payments are not switched on at all yet, which is why you will not see a price anywhere." },
        { q: "Do I need to create an account?", a: "No. You can write your CV and download your file without one. You sign in only if you want to save your work online or pick it up on another phone." },
        { q: "Does it work on a normal phone and a normal bundle?", a: "Yes. There is nothing to install, and your PDF is produced inside your phone. The page itself needs a connection once, to open; after that, typing and downloading do not need another bundle." },
        { q: "Can I use it in Swahili?", a: "Yes — Swahili is Sumaiya's first language. The menus, the guidance, the example CV and this whole page exist in Swahili, with English available whenever you want it." },
        { q: "How does a CV look to an employer?", a: "Single column, clear headings, real text — so a person and a screening program can both read it easily. We cannot promise that an employer will reply; no tool can promise that. What we can make sure of is that your CV is readable, has the sections employers look for, and matches the advert you applied to." },
        { q: "Where is Sumaiya available?", a: "We are starting in Tanzania. From there we are expanding across East Africa and the rest of Africa. Everything is in Swahili and English today." },
        { q: "Can I get a Word (DOCX) file?", a: "Yes. Alongside a clean PDF, you can download your CV as an editable Word document." },
      ];

  return (
    <div className="bg-sand text-espresso min-h-screen font-sans">
      {/* ── NAV ── */}
      <MarketingNav />

      {/* ── MAIN CONTENT (skip-link target) ── */}
      <main id="main" tabIndex={-1}>
      {/* ── HERO ── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-28 lg:pb-32 max-w-7xl mx-auto lg:min-h-[calc(100vh-4rem)] flex items-start lg:items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left copy — hero-reveal (transform-only) so the LCP h1 paints
              immediately instead of waiting for JS hydration */}
          <div className="hero-reveal max-w-xl">
            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-1.5 bg-ember-tint text-ember-hover font-mono text-[10px] font-semibold uppercase tracking-[2px] px-3 py-1 rounded-pill mb-6">
              <Icon name="bolt" size={12} className="text-ember" />
              {lang === "sw" ? "KWA WATAFUTA KAZI — TANZANIA" : "FOR JOB SEEKERS — TANZANIA"}
            </div>

            {/* Headline — the outcome, not the product's name.
                It used to read "Kutana na Sumaiya" / "Meet Sumaiya", which told a
                stranger nothing: the stranger-read pass could not tell whether
                Sumaiya was a chatbot, a voice, or a person. The name now appears in
                the sentence directly below, where it has a job to do.

                Deliberately a bare string: this h1 is painted pre-hydration (see
                `hero-reveal` above), so it must not gain markup that JS has to
                resolve before the LCP element can render. */}
            <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-[-2.5px] leading-[1.02] text-espresso mb-5">
              {lang === "sw" ? "CV inayolingana na kazi unayoomba." : "A CV that matches the job you are applying for."}
            </h1>

            {/* Sub-headline — the instruction, in the order the visitor performs it:
                open, type, download. It deliberately names the MANUAL path ("open the
                editor"), because that is where the one button goes and it needs no
                endpoint. It no longer promises AI writing: the assistant's AI is dark in
                production (`/api/ai/status` → {"configured":false,"provider":null}) and
                401s a guest, so promising it here would promise the one thing the page
                cannot hand over. */}
            <p className="text-espresso text-lg md:text-xl max-w-lg leading-snug font-medium mb-8 flex gap-3">
              <SumaiyaMark size={26} state="idle" className="text-ember shrink-0 mt-1" />
              <span>
                {lang === "sw"
                  ? "Mimi ni Sumaiya. Fungua kihariri, ingiza ujazo wako, pakua PDF yako — bure, bila akaunti. Kiswahili kwanza."
                  : "I'm Sumaiya. Open the editor, put in your details, download your PDF — free, no account needed. Swahili first."}
              </span>
            </p>

            {/* Primary action = the guest CV editor: the one thing a stranger can
                finish today without an account, and the product's own non-negotiable
                ("a guest must be able to finish a CV and download it BEFORE being
                asked for an account").
                It used to be /assistant — but the assistant's AI is dark in
                production (`/api/ai/status` → {"configured":false,"provider":null},
                live) and returns 401 to a guest, so the largest button on the page
                led to a surface that could not answer. Sumaiya the assistant is
                still here, named, as the secondary. */}
            {/* ONE action. The label is the site-wide label ("Write your CV — free" /
                "Andika CV yako — bure") so the same button is never renamed mid-page.
                It is "CV yako" and not the first-person possessive deliberately: the house
                voice names the user's own object in the second person (233 uses, first in
                lib/api/routes/ai.ts:687), which lib/swahili-lint.test.ts enforces.
                The old secondary was "or talk to me" → /assistant, which by the comment
                above cannot answer a guest; a second CTA that dead-ends is worse than no
                second CTA. The replacement is an in-page jump, so it adds no surface. */}
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <Link href="/editor/cv/try" onClick={() => posthog.capture('landing_cta_click', { cta: 'hero_build' })}>
                <Button variant="primary" size="lg">
                  {lang === "sw" ? "Andika CV yako — bure" : "Write your CV — free"} <Icon name="chevron-right" size={16} />
                </Button>
              </Link>
              <a
                href="#how-it-works"
                onClick={() => posthog.capture('landing_cta_click', { cta: 'hero_steps' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember transition-colors"
              >
                {lang === "sw" ? "Ona hatua tatu" : "See the three steps"}
                <Icon name="chevron-right" size={14} />
              </a>
            </div>

            {/* Free reassurance — the stranger-read pass, having criticised almost
                every other line, named this the single line worth keeping. Kept, and
                made exact: payments are off (lib/features.ts), so this is a fact
                about today rather than a discount claim. */}
            <p className="flex items-center gap-2 text-sm font-semibold text-pine mb-9">
              <Icon name="check" size={16} className="text-pine shrink-0" />
              {lang === "sw"
                ? "Hakuna kadi. Hakuna malipo. Faili lako ni lako, ukiingia au usiingie."
                : "No card. Nothing to pay. Your file is yours whether or not you sign in."}
            </p>

            {/* Three claims a reader can check in the next minute. The old row led
                with "Passes employer screening (ATS)" — a certainty no CV tool can
                back, naming the mechanism in the one language the house rule says
                must never name it. */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Icon name="download" size={14} className="text-pine" />
                <span className="text-xs text-text-body font-medium">{lang === "sw" ? "PDF yako inatengenezwa kwenye simu yako" : "Your PDF is made on your phone"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="globe-lang" size={14} className="text-ember" />
                <span className="text-xs text-ember-hover font-bold">{lang === "sw" ? "Kiswahili kwanza" : "Swahili first"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="check" size={14} className="text-pine" />
                <span className="text-xs text-text-body font-medium">{lang === "sw" ? "Hakuna kupakua programu" : "Nothing to install"}</span>
              </div>
            </div>

            {/* Mobile-only CV preview — normal users on phones must SEE the output */}
            <div className="lg:hidden mt-12 -mx-4 sm:mx-0 flex justify-center">
              <div className="w-[260px] rounded-card-lg overflow-hidden border border-border shadow-card-hover bg-white">
                <div
                  style={{
                    width: 794,
                    transform: `scale(${260 / 794})`,
                    transformOrigin: "top left",
                    height: 1123 * (260 / 794),
                    pointerEvents: "none",
                  }}
                >
                  {(() => {
                    const M = HERO_TEMPLATE_COMPONENTS["nakuru"];
                    return <M data={SAMPLE_CV} primaryColor="#DA4A1C" fontFamily={INTER_STACK} />;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Right — floating CV card stack with perspective */}
          <div className="hidden lg:flex relative justify-center items-center min-h-[600px]"
            style={{ perspective: "1000px" }}
          >
            <div className="flex gap-4 items-start"
              style={{ transform: "perspective(1000px) rotateY(-8deg) rotateX(2deg)" }}
            >
              <div className="flex flex-col gap-4 mt-8">
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[0]].id}
                  color={HERO_CYCLE[panelIdxs[0]].color}
                  data={SAMPLE_CV}
                  opacity={dimPanel === 0 ? 0 : 1}
                  floatDelay=""
                />
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[1]].id}
                  color={HERO_CYCLE[panelIdxs[1]].color}
                  data={SAMPLE_CV}
                  opacity={dimPanel === 1 ? 0 : 1}
                  floatDelay="animation-delay-1000"
                />
              </div>
              <div className="flex flex-col gap-4 mt-0">
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[2]].id}
                  color={HERO_CYCLE[panelIdxs[2]].color}
                  data={SAMPLE_CV}
                  opacity={dimPanel === 2 ? 0 : 1}
                  floatDelay="animation-delay-500"
                />
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[3]].id}
                  color={HERO_CYCLE[panelIdxs[3]].color}
                  data={SAMPLE_CV}
                  opacity={dimPanel === 3 ? 0 : 1}
                  floatDelay="animation-delay-1500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — three plain steps ── */}
      <section id="how-it-works" className="scroll-mt-24 px-4 sm:px-6 lg:px-8 py-20 lg:py-24 max-w-7xl mx-auto border-t border-border">
        <div className="reveal mb-12 text-center max-w-2xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "JINSI INAVYOFANYA KAZI" : "HOW IT WORKS"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "CV tayari kwa hatua tatu" : "Your CV in three steps"}
          </h2>
          <p className="text-lg text-text-body">
            {lang === "sw"
              ? "Hakuna programu ya kupakua. Hakuna maarifa ya kompyuta yanayohitajika."
              : "Nothing to download. No computer skills needed."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "text" as const,
              en: { t: "1. Paste the job advert", d: "Copy the advert you have seen — on a noticeboard, in a WhatsApp group, or on a website. Paste it in, and the CV is aimed at that job." },
              sw: { t: "1. Bandika tangazo la kazi", d: "Nakili tangazo uliloliona — kwenye ubao wa matangazo, kwenye kikundi cha WhatsApp, au kwenye tovuti. Bandika hapa, na CV yako ilenge kazi hiyo." },
            },
            {
              icon: "magic" as const,
              en: { t: "2. Fill in your details", d: "Type them in, or answer my questions and I write each section for you. You do not need professional wording to start." },
              sw: { t: "2. Jaza maelezo yako", d: "Andika mwenyewe, au jibu maswali yangu nami ninaandika kila sehemu. Huhitaji maneno ya kitaalamu ili kuanza." },
            },
            {
              icon: "download" as const,
              en: { t: "3. Download your PDF", d: "Download a clean PDF, ready to send by email or WhatsApp. No account, nothing to pay." },
              sw: { t: "3. Pakua PDF yako", d: "Pakua PDF safi, tayari kuituma kwa barua pepe au WhatsApp. Bila akaunti, bila malipo." },
            },
          ].map((step, i) => (
            <div key={i} className={`reveal delay-${i + 1} bg-card border border-border rounded-card p-7`}>
              <div className="w-12 h-12 rounded-xl bg-ember-tint flex items-center justify-center mb-5">
                <Icon name={step.icon} size={22} className="text-ember" />
              </div>
              <h3 className="font-display font-bold text-lg text-espresso mb-2 tracking-tight">
                {lang === "sw" ? step.sw.t : step.en.t}
              </h3>
              <p className="text-sm text-text-body leading-relaxed">
                {lang === "sw" ? step.sw.d : step.en.d}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/editor/cv/try" onClick={() => posthog.capture('landing_cta_click', { cta: 'how_it_works' })}>
            <Button variant="primary" size="lg">
              {lang === "sw" ? "Andika CV yako — bure" : "Write your CV — free"} <Icon name="chevron-right" size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── ON YOUR PHONE (the absence the stranger-read pass found first) ──
          A prepaid-data user's first question is whether this costs them a
          bundle. The page never answered it. What is said here is deliberately
          the provable half: the PDF is produced in the browser (lib/pdf.ts
          lazy-imports jspdf/html2canvas), and the draft autosaves to
          localStorage. It does NOT claim "works offline" flat — the native
          app's offline path has never been tested in airplane mode
          (docs/FEATURE-INVENTORY.md §5) and native still has no guest mode, so
          that headline would be the loudest false claim on the site. */}
      <section className="bg-espresso/[0.03] border-y border-border">
        <div className="px-4 sm:px-6 lg:px-8 py-20 lg:py-24 max-w-7xl mx-auto">
          <div className="reveal mb-12 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
              {lang === "sw" ? "KWENYE SIMU YAKO" : "ON YOUR PHONE"}
            </p>
            <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
              {lang === "sw" ? "Imeundwa kwa simu ya kawaida, na bando la kawaida" : "Built for a normal phone, and a normal bundle"}
            </h2>
            <p className="text-lg text-text-body">
              {lang === "sw"
                ? "Watu wengi wanaotafuta kazi Tanzania wanafanya kila kitu kwenye simu. Kwa hiyo Sumaiya haihitaji kompyuta, na hakuna cha kupakua."
                : "Most people looking for work in Tanzania do all of it on a phone. So Sumaiya does not need a computer, and there is nothing to install."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "wifi-off" as const,
                en: { t: "Your PDF is made on your phone", d: "Your file is produced inside your phone, not on a server. Once the page has opened, typing and downloading do not need another bundle." },
                sw: { t: "PDF yako inatengenezwa kwenye simu yako", d: "Faili lako linatengenezwa ndani ya simu yako, si kwenye seva. Ukishaifungua ukurasa, kuandika na kupakua hakuhitaji bando lingine." },
              },
              {
                icon: "download" as const,
                en: { t: "Nothing to install", d: "You start in the browser. No app store, no waiting for a large file before you have seen anything." },
                sw: { t: "Hakuna kupakua programu", d: "Unaanza kwenye kivinjari. Hakuna app store, hakuna kusubiri faili kubwa kabla ya kuona kitu." },
              },
              {
                icon: "check" as const,
                en: { t: "Your work stays on your phone", d: "What you type is saved on your own device as you go, so a dropped connection does not cost you the CV." },
                sw: { t: "Kazi yako inabaki kwenye simu yako", d: "Unachoandika kinahifadhiwa kwenye kifaa chako wakati unaandika, hivyo mtandao ukikatika hupotezi kazi yako." },
              },
            ].map((card, i) => (
              <div key={i} className={`reveal delay-${i + 1} bg-card border border-border rounded-card p-7`}>
                <div className="w-12 h-12 rounded-xl bg-ember-tint flex items-center justify-center mb-5">
                  <Icon name={card.icon} size={22} className="text-ember" />
                </div>
                <h3 className="font-display font-bold text-lg text-espresso mb-2 tracking-tight">
                  {lang === "sw" ? card.sw.t : card.en.t}
                </h3>
                <p className="text-sm text-text-body leading-relaxed">
                  {lang === "sw" ? card.sw.d : card.en.d}
                </p>
              </div>
            ))}
          </div>

          {/* The honest limit, said plainly rather than implied. */}
          <p className="mt-10 text-sm text-text-muted max-w-2xl">
            {lang === "sw"
              ? "Ukurasa wenyewe unahitaji mtandao mara moja ili ufunguke. Baada ya hapo, kuandika na kupakua hakuhitaji bando lingine."
              : "The page itself needs a connection once, to open. After that, typing and downloading do not need another bundle."}
          </p>
        </div>
      </section>

      {/* ── PROOF — only what the product can demonstrate today ──
          This replaces a testimonials band carrying three quotes under a heading
          that asserted "Real people, real jobs". They were composite examples
          (lib/testimonials.ts said so in its own header), so the band was removed
          rather than softened. Nothing here is a number we have not measured. */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-24 max-w-7xl mx-auto border-t border-border">
        <div className="reveal mb-12 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "USHAHIDI" : "PROOF"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "Usiniamini. Jaribu." : "Don't take our word for it. Try it."}
          </h2>
          <p className="text-lg text-text-body">
            {lang === "sw"
              ? "Hakuna namba za kubuni hapa. Hivi ni vitu vitatu unavyoweza kuvithibitisha mwenyewe katika dakika moja."
              : "No invented numbers here. These are three things you can verify yourself in one minute."}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              en: { t: "A real CV, a real PDF", d: "Start from the example, change it to your own details, download. What you get is a complete PDF with real selectable text — not a screenshot of a CV." },
              sw: { t: "CV halisi, PDF halisi", d: "Anza na mfano, badilisha uweke maelezo yako, pakua. Unachopata ni PDF kamili yenye maandishi halisi — si picha ya skrini." },
            },
            {
              en: { t: "No account in the way", d: "There is no sign-in page between you and your file. You are asked to sign in only after you already have what you came for." },
              sw: { t: "Hakuna akaunti inayokuzuia", d: "Hakuna ukurasa wa kuingia kati yako na faili lako. Unaombwa kuingia baada tu ya kupata kile ulichokuja kukichukua." },
            },
            {
              en: { t: "In Swahili, properly", d: "The menus, the guidance, the example CV and the FAQ are all written in Swahili first. Swahili is not a translation layer on top of an English product." },
              sw: { t: "Kwa Kiswahili, kweli", d: "Menyu, maelekezo, mfano wa CV na maswali — vyote vimeandikwa kwa Kiswahili kwanza. Kiswahili si tafsiri iliyowekwa juu ya bidhaa ya Kiingereza." },
            },
          ].map((card, i) => (
            <div key={i} className={`reveal delay-${i + 1} bg-card border border-border rounded-card p-6`}>
              <h3 className="font-display font-bold text-espresso mb-1.5">{lang === "sw" ? card.sw.t : card.en.t}</h3>
              <p className="text-sm text-text-body leading-relaxed">{lang === "sw" ? card.sw.d : card.en.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT GRID (What you can build) ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto">
        <div className="reveal mb-14">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "UNACHOWEZA KUTENGENEZA" : "WHAT YOU CAN BUILD"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "Hati za maombi, zote mahali pamoja" : "The documents an application needs, in one place"}
          </h2>
          <p className="text-lg text-text-body max-w-lg">
            {lang === "sw"
              ? "CV ni ya kwanza. Barua ya maombi inaenda nayo. Kadi na barua rasmi zinakuja baadaye — zote kwa mwonekano mmoja."
              : "The CV comes first. The cover letter goes with it. A card and formal letters come after — all in one consistent look."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((product, i) => {
            return (
              <Link
                key={product.title}
                href={product.href}
                className={`reveal delay-${i + 1} group block bg-card border border-border rounded-card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-12 h-12 rounded-xl ${product.bgColor} flex items-center justify-center mb-5`}>
                  <Icon name={product.iconName} size={22} className={product.iconColor} />
                </div>
                <h3 className="font-display font-bold text-lg text-espresso mb-2 tracking-tight">
                  {product.title}
                </h3>
                <p className="text-sm text-text-body leading-relaxed mb-4">
                  {product.desc}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-block text-xs font-mono font-semibold text-text-muted bg-sand px-3 py-1 rounded-full">
                    {product.count}
                  </span>
                  <Icon name="chevron-right" size={14} className="text-text-muted group-hover:text-ember transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── CV DESIGNS GRID ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto">
        <div className="reveal mb-14">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "MUONEKANO WA CV" : "THE LOOK"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "Miundo 47 — chagua mmoja, uanze" : "47 looks — pick one and start"}
          </h2>
          <p className="text-lg text-text-body">
            {lang === "sw"
              ? "Mfano unaoona hapa ni wa Neema, msimamizi wa ofisi Dar es Salaam. Maudhui yako hayabadiliki ukibadilisha muundo."
              : "The example you see here is Neema, an office administrator in Dar es Salaam. Your content does not change when you switch designs."}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 bg-border rounded-card-lg overflow-hidden border border-border">
          {SHOWCASE_LANES.map((lane, i) => (
            <CyclingCell
              key={i}
              lane={lane}
              delayMs={i * 600}
              intervalMs={4200}
              scale={cardScale}
              lang={lang}
              data={SAMPLE_CV}
              innerRef={i === 0 ? firstCardRef : undefined}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/templates">
            <Button variant="secondary" size="lg">
              {lang === "sw" ? "Ona miundo yote" : "See all the looks"}
              <Icon name="chevron-right" size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FREE PDF TOOLS BAND ── */}
      <section className="bg-espresso/[0.03] border-y border-border">
        <div className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto">
          <div className="reveal mb-14">
            <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
              {lang === "sw" ? "ZANA ZA PDF BILA MALIPO" : "FREE PDF TOOLS"}
            </p>
            <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
              {lang === "sw" ? "Zana zote za PDF unazohitaji" : "Every PDF tool you need, free"}
            </h2>
            <p className="text-lg text-text-body max-w-2xl">
              {lang === "sw"
                ? "Maombi mengi yanahitaji PDF: vyeti vyako vilivyoskaniwa, vitabu vya vyeti, na faili moja unayotuma. Hizi ni zana zilezile unazohitaji kwa hilo — moja kwa moja kwenye kivinjari chako. Hakuna usajili, na faili zako hazihifadhiwi."
                : "Most applications need PDFs: your scanned certificates, your transcripts, and one file to send. These are the same tools you need for that — right in your browser. No sign-up, and your files are never stored."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PDF_TOOL_LINKS.map(({ id, nameKey, Icon: ToolIcon }, i) => (
              <Link
                key={id}
                href={pdfToolHref(id)}
                className={`reveal delay-${(i % 4) + 1} group flex items-center gap-3 bg-card border border-border rounded-card px-4 py-3.5 hover:border-ember/40 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ember-tint text-ember">
                  <ToolIcon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="font-semibold text-sm text-espresso leading-tight">
                  {translations[lang].tools[nameKey]}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember transition-colors">
              {lang === "sw" ? "Fungua zana zote za PDF" : "Open all PDF tools"}
              <Icon name="chevron-right" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DARK CTA BAND ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24 max-w-7xl mx-auto">
        <div className="reveal bg-espresso rounded-card-lg p-10 sm:p-14 lg:p-20 text-center border border-espresso-line">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display font-extrabold tracking-tight text-cream text-3xl sm:text-4xl lg:text-5xl mb-4">
              {lang === "sw"
                ? "Andika CV yako ya kwanza. Bure."
                : "Write your first CV. Free."}
            </h2>
            <p className="text-lg text-gold/80 leading-relaxed mb-10 max-w-lg mx-auto">
              {lang === "sw"
                ? "Hakuna akaunti, hakuna kadi, hakuna malipo. Pakua faili lako kisha anza kutuma maombi."
                : "No account, no card, nothing to pay. Download your file, then start applying."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/editor/cv/try" onClick={() => posthog.capture('landing_cta_click', { cta: 'bottom_cta' })}>
                <Button variant="primary" size="lg">
                  {lang === "sw" ? "Andika CV yako — bure" : "Write your CV — free"} <Icon name="chevron-right" size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24 max-w-3xl mx-auto">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
        <h2 className="reveal font-display font-extrabold tracking-tight text-espresso text-2xl sm:text-3xl text-center mb-3">
          {lang === "sw" ? "Maswali yanayoulizwa mara kwa mara" : "Frequently asked questions"}
        </h2>
        <p className="reveal text-text-muted text-center text-sm mb-10">
          {lang === "sw" ? "Kila unachohitaji kujua kabla ya kuanza." : "Everything you need to know before you start."}
        </p>
        <div className="reveal space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group bg-card border border-border rounded-card px-5 [&_summary::-webkit-details-marker]:hidden">
              {/* The padding lives on the summary, not the details, so the whole
                  52px band is the clickable target (WCAG 2.5.8 AA needs 24px
                  minimum; Apple HIG wants 44). Visually identical to the old
                  `details px-5 py-4` + bare summary — same 16px gap above the
                  question and below the answer — but the target is now 52px
                  instead of the 20px text line. */}
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-espresso text-sm sm:text-base py-4">
                {f.q}
                <Icon name="chevron-down" size={18} className="text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="text-text-body text-sm leading-relaxed mt-3 pb-4">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      </main>

      {/* ── FOOTER ── */}
      <ScanToApp />
      <Footer />
    </div>
  );
}
