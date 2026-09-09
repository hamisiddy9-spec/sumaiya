"use client";

import { useState, useRef, useEffect, type Ref } from "react";
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
import { Footer } from "@/components/ui/footer";
import { PDF_TOOL_LINKS, pdfToolHref } from "@/lib/pdf-tools-list";
import { TESTIMONIALS, CVS_CREATED } from "@/lib/testimonials";

// ─── Sample CV data (Amara Osei) ──────────────────────────────────────────────

const SAMPLE_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e8d5c0'/%3E%3Ccircle cx='100' cy='75' r='45' fill='%238B5E3C'/%3E%3Cellipse cx='100' cy='46' rx='32' ry='20' fill='%233D2314'/%3E%3Cpath d='M15 200 C15 148 55 130 100 130 C145 130 185 148 185 200Z' fill='%238B5E3C'/%3E%3C/svg%3E";

const SAMPLE_CV: CVData = {
  personal: {
    fullName: "Amara Osei",
    jobTitle: "Software Engineer",
    email: "amara.osei@gmail.com",
    phone: "+254 722 987 654",
    location: "Nairobi, Kenya",
    linkedin: "linkedin.com/in/amaraosei",
    website: "amaraosei.dev",
    photo: SAMPLE_PHOTO,
  },
  summary:
    "Results-driven software engineer with 6+ years of experience designing and shipping scalable web applications for fintech and telecommunications. Skilled in React, Node.js, and cloud infrastructure. Led cross-functional teams of 6 engineers delivering products adopted by 1M+ users worldwide.",
  experience: [
    {
      id: "_x1",
      company: "Zuri Fintech",
      position: "Software Engineer",
      location: "Nairobi, Kenya",
      startDate: "2020-05",
      endDate: "",
      current: true,
      description:
        "Architected and shipped key features for a nationwide mobile-money platform serving millions of users. Reduced API response latency by 55% through caching and query optimisation. Mentored 4 junior engineers and championed test-driven development practices.",
    },
    {
      id: "_x2",
      company: "Kito Labs",
      position: "Full-Stack Developer",
      location: "Remote",
      startDate: "2017-08",
      endDate: "2020-04",
      current: false,
      description:
        "Built React frontends and Node.js APIs for enterprise SaaS clients across the US and Europe. Raised test coverage from 38% to 90%. Collaborated with distributed teams across 3 time zones to meet aggressive release schedules.",
    },
  ],
  education: [
    {
      id: "_ed1",
      institution: "University of Nairobi",
      degree: "B.Sc.",
      field: "Computer Science",
      startDate: "2013-09",
      endDate: "2017-06",
      grade: "First Class Honours",
      description: "Thesis: Fraud Detection in Mobile Money Networks Using Machine Learning.",
    },
  ],
  skills: [
    { id: "_s1", name: "React / Next.js", level: 5 },
    { id: "_s2", name: "Node.js", level: 5 },
    { id: "_s3", name: "TypeScript", level: 4 },
    { id: "_s4", name: "PostgreSQL", level: 4 },
    { id: "_s5", name: "AWS / GCP", level: 4 },
  ],
  languages: [{ id: "_l1", name: "English", proficiency: "Native" }],
  certifications: [
    { id: "_c1", name: "AWS Solutions Architect", issuer: "Amazon Web Services", date: "2023-04", url: "" },
    { id: "_c2", name: "Google Cloud Professional", issuer: "Google", date: "2022-11", url: "" },
  ],
  projects: [],
  referees: [],
  hobbies: "Open Source, Mentoring, Chess, Trail Running",
  hiddenSections: [],
};

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
}: {
  templateId: TemplateId;
  color: string;
  opacity: number;
  floatDelay: string;
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
        <Component data={SAMPLE_CV} primaryColor={color} fontFamily="Inter, sans-serif" />
      </div>
    </div>
  );
}

// ─── Template Preview (for product grid / template showcase) ───────────────────

function TemplatePreview({
  templateId,
  primaryColor,
  scale,
}: {
  templateId: TemplateId;
  primaryColor: string;
  scale: number;
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
        <Component data={SAMPLE_CV} primaryColor={primaryColor} fontFamily="Inter, sans-serif" />
      </div>
    </div>
  );
}

// One showcase cell that crossfades through its lane of templates on a timer.
function CyclingCell({
  lane, delayMs, intervalMs, scale, lang, innerRef,
}: {
  lane: (typeof TEMPLATES)[number][];
  delayMs: number;
  intervalMs: number;
  scale: number;
  lang: "en" | "sw";
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
            <TemplatePreview templateId={cur.id} primaryColor={cur.previewColor} scale={scale} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end p-4 transition-opacity duration-200 z-20 opacity-100 bg-gradient-to-t from-espresso/95 via-espresso/40 to-transparent md:opacity-0 md:group-hover:opacity-100 md:bg-espresso/80 md:from-transparent md:via-transparent">
        <p className="font-display font-bold text-sm text-cream mb-3 tracking-tight">{cur.name}</p>
        <Link
          href={"/editor/cv/try?template=" + cur.id}
          className="w-full text-center text-sm font-semibold text-cream bg-ember shadow-ember-hard rounded-[10px] px-4 py-2 hover:bg-ember-hover active:shadow-ember-active active:translate-y-[2px] transition-all duration-150"
        >
          {lang === "sw" ? "Tumia templeti hii" : "Use this template"}
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
    title: "CV Builder",
    desc: "47+ curated, ATS-optimized templates with live preview, AI writing suggestions, and one-click PDF download.",
    count: "47+ curated templates",
    href: "/editor/cv/try",
    bgColor: "bg-ember-tint",
    iconColor: "text-ember",
  },
  {
    iconName: "mail",
    title: "Cover Letters",
    desc: "Write a cover letter that pairs with your CV. AI-powered content tailored to your job target.",
    count: "27 templates",
    href: "/editor/cover-letter/try",
    bgColor: "bg-pine-tint",
    iconColor: "text-pine",
  },
  {
    iconName: "card",
    title: "Business Cards",
    desc: "29 business card designs. Add your details, pick your color, download as PDF. Ready to print.",
    count: "29 designs",
    href: "/editor/business-card/try",
    bgColor: "bg-gold-tint",
    iconColor: "text-gold",
  },
  {
    iconName: "letter",
    title: "Formal Letters",
    desc: "Reference, application, resignation, and formal letters — professionally structured and ready to send.",
    count: "17 templates",
    href: "/editor/letter/try",
    bgColor: "bg-purple-tint",
    iconColor: "text-purple-glow",
  },
];

const PRODUCTS_SW: ProductItem[] = [
  {
    iconName: "cv",
    title: "Kuunda CV",
    desc: "Templeti za kitaalamu zinazopita ATS. Hakiki ya moja kwa moja, mapendekezo ya AI, PDF kamili.",
    count: "Templeti 47+",
    href: "/editor/cv/try",
    bgColor: "bg-ember-tint",
    iconColor: "text-ember",
  },
  {
    iconName: "mail",
    title: "Barua za Maombi",
    desc: "Barua za maombi zinazovutia zinazolingana na CV yako. Inasaidiwa na AI, imeandikwa kwa ufundi.",
    count: "Templeti 27",
    href: "/editor/cover-letter/try",
    bgColor: "bg-pine-tint",
    iconColor: "text-pine",
  },
  {
    iconName: "card",
    title: "Kadi za Biashara",
    desc: "Miundo 29 ya kadi za biashara za kitaalamu, iliyobinafsishwa kwa maelezo yako.",
    count: "Miundo 29",
    href: "/editor/business-card/try",
    bgColor: "bg-gold-tint",
    iconColor: "text-gold",
  },
  {
    iconName: "letter",
    title: "Barua Rasmi",
    desc: "Barua za mapendekezo, maombi, kujiuzulu, na barua rasmi 17 — za kitaalamu na ziko tayari kutumwa.",
    count: "Templeti 17",
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

  // Landing FAQ — handles the common objections AND earns FAQ rich results.
  const FAQS = lang === "sw"
    ? [
        { q: "Je, Sumaiya ni bure kweli?", a: "Ndiyo. Unaweza kuunda CV, barua ya maombi, kadi ya biashara au barua rasmi na kupakua PDF bila malipo — bila kadi ya benki." },
        { q: "Je, CV zenu zinapita mifumo ya ATS?", a: "Ndiyo. Templeti zetu zimeundwa kuwa rahisi kusomwa na mifumo ya waajiri (ATS) — safu moja, vichwa wazi, na PDF yenye maandishi halisi. Pia kuna kikagua-ATSbure cha kupima CV yako." },
        { q: "Je, naweza kuitumia kwa Kiswahili?", a: "Ndiyo. Programu nzima inapatikana kwa Kiingereza na Kiswahili — badilisha wakati wowote kwa kitufe cha lugha." },
        { q: "Je, ninahitaji kufungua akaunti?", a: "Unaweza kuanza kuunda CV mara moja bila akaunti. Unahitaji tu kuingia unapotaka kuhifadhi kazi yako mtandaoni au kuipata kwenye kifaa kingine." },
        { q: "Je, naweza kuitumia popote duniani?", a: "Ndiyo. Imejengwa kwa waombaji kazi popote — templeti zinazopita ATS, ushauri wa msaidizi wa AI, na miundo inayofaa waajiri wa kimataifa." },
        { q: "Je, naweza kupata faili la Word (DOCX)?", a: "Ndiyo. Mbali na PDF safi, unaweza kupakua CV yako kama faili la Word linalohaririwa." },
      ]
    : [
        { q: "Is Sumaiya really free?", a: "Yes. You can build a CV, cover letter, business card or formal letter and download a polished PDF for free — no credit card required." },
        { q: "Are your CVs ATS-friendly?", a: "Yes. Every template is built to be read cleanly by Applicant Tracking Systems — single column, clear headings, and a real text-layer PDF. There's also a free ATS checker to score your own CV." },
        { q: "Can I use it in Swahili?", a: "Yes. The whole app is available in English and Swahili — switch any time with the language toggle." },
        { q: "Do I need to create an account?", a: "You can start building a CV instantly with no account. You only sign in when you want to save your work online or pick it up on another device." },
        { q: "Can I use it anywhere in the world?", a: "Yes. It's built for job seekers everywhere — ATS-friendly templates, AI-assistant guidance, and formats that work for employers worldwide." },
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
              {lang === "sw" ? "MSAIDIZI WA AJIRA WA AI · AFRIKA MASHARIKI" : "AI CAREER ASSISTANT · EAST AFRICA"}
            </div>

            {/* Headline — Sumaiya IS the product; the CV is what she produces. */}
            <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl tracking-[-2.5px] leading-[1.02] text-espresso mb-5 flex items-center gap-3 flex-wrap">
              <SumaiyaMark size={56} state="idle" className="text-ember shrink-0" />
              <span>{lang === "sw" ? "Kutana na " : "Meet "}<span className="text-ember">Sumaiya</span></span>
            </h1>

            {/* Sub-headline — what she does, plainly */}
            <p className="text-espresso text-lg md:text-xl max-w-lg leading-snug font-medium mb-8">
              {lang === "sw"
                ? "Msaidizi wako wa AI anayekuandikia CV, kuilenga kwa kila kazi, kukagua ATS, na kukuandaa kwa usaili — kwa Kiswahili au Kiingereza."
                : "Your AI assistant — writes your CV, targets it to every job, checks it against ATS, and preps you for the interview. In English or Swahili."}
            </p>

            {/* Primary action = start with Sumaiya. Manual builder is the fallback. */}
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <Link href="/assistant" onClick={() => posthog.capture('landing_cta_click', { cta: 'hero_ai' })}>
                <Button variant="primary" size="lg">
                  {lang === "sw" ? "Anza na Sumaiya — Bure" : "Start with Sumaiya — free"} <Icon name="chevron-right" size={16} />
                </Button>
              </Link>
              <Link
                href="/editor/cv/try"
                onClick={() => posthog.capture('landing_cta_click', { cta: 'hero_build' })}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember transition-colors"
              >
                {lang === "sw" ? "au tengeneza CV mwenyewe" : "or build a CV yourself"}
                <Icon name="chevron-right" size={14} />
              </Link>
            </div>

            {/* Free reassurance */}
            <p className="flex items-center gap-2 text-sm font-semibold text-pine mb-9">
              <Icon name="check" size={16} className="text-pine shrink-0" />
              {lang === "sw"
                ? "Hakuna kadi ya benki. Hakuna usajili wa lazima. Anza papo hapo."
                : "No credit card. No sign-up required. Start right now."}
            </p>

            {/* Simple trust row — three things people actually care about */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Icon name="target" size={14} className="text-pine" />
                <span className="text-xs text-text-body font-medium">{lang === "sw" ? "Inapita mifumo ya waajiri (ATS)" : "Passes employer screening (ATS)"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="globe-lang" size={14} className="text-ember" />
                <span className="text-xs text-ember-hover font-bold">{lang === "sw" ? "Kiswahili na Kiingereza" : "English & Swahili"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="download" size={14} className="text-pine" />
                <span className="text-xs text-text-body font-medium">{lang === "sw" ? "Pakua PDF au Word" : "Download as PDF or Word"}</span>
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
                    return <M data={SAMPLE_CV} primaryColor="#DA4A1C" fontFamily="Inter, sans-serif" />;
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
                  opacity={dimPanel === 0 ? 0 : 1}
                  floatDelay=""
                />
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[1]].id}
                  color={HERO_CYCLE[panelIdxs[1]].color}
                  opacity={dimPanel === 1 ? 0 : 1}
                  floatDelay="animation-delay-1000"
                />
              </div>
              <div className="flex flex-col gap-4 mt-0">
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[2]].id}
                  color={HERO_CYCLE[panelIdxs[2]].color}
                  opacity={dimPanel === 2 ? 0 : 1}
                  floatDelay="animation-delay-500"
                />
                <HeroCVPanel
                  templateId={HERO_CYCLE[panelIdxs[3]].id}
                  color={HERO_CYCLE[panelIdxs[3]].color}
                  opacity={dimPanel === 3 ? 0 : 1}
                  floatDelay="animation-delay-1500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — three plain steps ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-24 max-w-7xl mx-auto border-t border-border">
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
              icon: "grid" as const,
              en: { t: "1. Pick a design", d: "Choose from 47+ ready-made CV templates. You can change it later — your details stay." },
              sw: { t: "1. Chagua muundo", d: "Chagua kati ya templeti 47+ za CV zilizo tayari. Unaweza kubadilisha baadaye — maelezo yako yanabaki." },
            },
            {
              icon: "magic" as const,
              en: { t: "2. Fill it in", d: "Type your details, or just chat with Sumaiya and she writes each section for you — in English or Swahili." },
              sw: { t: "2. Jaza maelezo", d: "Andika maelezo yako, au ongea tu na Sumaiya naye anaandika kila sehemu — kwa Kiingereza au Kiswahili." },
            },
            {
              icon: "download" as const,
              en: { t: "3. Download & send", d: "Download a clean PDF or Word file, ready to attach to any job application. Free." },
              sw: { t: "3. Pakua na tuma", d: "Pakua PDF safi au faili la Word, tayari kuambatanisha na maombi yoyote ya kazi. Bure." },
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
              {lang === "sw" ? "Anza sasa — Bure" : "Start now — free"} <Icon name="chevron-right" size={16} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── SOCIAL PROOF (testimonials + a real stat) ── */}
      {TESTIMONIALS.length > 0 && (
        <section className="bg-espresso border-y border-espresso-line py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-[11px] font-mono uppercase tracking-widest text-gold/70 mb-3">
              {lang === "sw" ? "Watu halisi, kazi halisi" : "Real people, real jobs"}
            </p>
            {CVS_CREATED > 0 && (
              <p className="text-center text-cream/90 text-lg font-semibold mb-10">
                {lang === "sw"
                  ? `Zaidi ya CV ${CVS_CREATED.toLocaleString()} zimetengenezwa`
                  : `Over ${CVS_CREATED.toLocaleString()} CVs built`}
              </p>
            )}
            <div className="grid sm:grid-cols-3 gap-5 mt-8">
              {TESTIMONIALS.map((t) => (
                <figure key={t.name} className="bg-espresso-line/40 border border-espresso-line rounded-card-lg p-6">
                  <blockquote className="text-cream/90 text-sm leading-relaxed mb-4">
                    &ldquo;{lang === "sw" ? t.quote.sw : t.quote.en}&rdquo;
                  </blockquote>
                  <figcaption className="text-xs">
                    <span className="font-bold text-gold">{t.name}</span>
                    <span className="text-cream/50"> — {lang === "sw" ? t.detail.sw : t.detail.en}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-center text-cream/40 text-xs mt-8">
              {lang === "sw"
                ? "Dhamana ya kurudisha pesa ndani ya saa 48 · Ghairi wakati wowote"
                : "48-hour money-back guarantee · Cancel anytime"}
            </p>
          </div>
        </section>
      )}

      {/* ── PRODUCT GRID (What you can build) ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto">
        <div className="reveal mb-14">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "UNACHOWEZA KUTENGENEZA" : "WHAT YOU CAN BUILD"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "Kila hati unayohitaji kupata ajira" : "Every document you need to get hired"}
          </h2>
          <p className="text-lg text-text-body max-w-lg">
            {lang === "sw"
              ? "CV, barua ya maombi, kadi za biashara na barua rasmi — zote zinaendana, zimeundwa kwa mwonekano sawa."
              : "CV, cover letter, business card, and formal letters — built together, styled to match."}
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

      {/* ── CV TEMPLATES GRID ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 max-w-7xl mx-auto">
        <div className="reveal mb-14">
          <p className="text-xs font-mono uppercase tracking-wider text-ember-hover mb-4">
            {lang === "sw" ? "TEMPLETI ZA CV" : "CV TEMPLATES"}
          </p>
          <h2 className="font-display font-extrabold tracking-tight text-espresso text-3xl sm:text-4xl lg:text-5xl mb-3">
            {lang === "sw" ? "Templeti za CV zilizoundwa kupendwa na waajiri" : "CV templates built to impress employers"}
          </h2>
          <p className="text-lg text-text-body">
            {lang === "sw"
              ? "Chagua muundo wowote — maudhui yako yanabaki. Rekebisha template yoyote wakati wowote kwenye kihariri."
              : "Pick any style — your content carries over. Switch templates anytime inside the editor."}
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
              innerRef={i === 0 ? firstCardRef : undefined}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/templates">
            <Button variant="secondary" size="lg">
              {lang === "sw" ? "Angalia templeti zote" : "Browse all CV templates"}
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
                ? "Unganisha, gawanya, zungusha, bana na zaidi — moja kwa moja kwenye kivinjari chako. Hakuna usajili, faili zako hazihifadhiwi."
                : "Merge, split, rotate, convert and more — right in your browser. No sign-up, and your files are never stored."}
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
                ? "Anza leo. Unda CV yako ya kwanza bila malipo."
                : "Your next job starts with the right CV."}
            </h2>
            <p className="text-lg text-gold/80 leading-relaxed mb-10 max-w-lg mx-auto">
              {lang === "sw"
                ? "CV, barua za maombi, kadi za biashara — vifaa vyote katika mfumo mmoja. Bure kuanza."
                : "Build for free, download when you're ready — made for job seekers everywhere."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/editor/cv/try" onClick={() => posthog.capture('landing_cta_click', { cta: 'bottom_cta' })}>
                <Button variant="primary" size="lg">
                  {lang === "sw" ? "Unda CV yangu" : "Build my CV"} <Icon name="chevron-right" size={16} />
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
            <details key={i} className="group bg-card border border-border rounded-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-espresso text-sm sm:text-base">
                {f.q}
                <Icon name="chevron-down" size={18} className="text-text-muted shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="text-text-body text-sm leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
