"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X as XIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { CreateEntryButton } from "@/components/editor/create-entry-options";
import { useLang } from "@/lib/i18n/context";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { BUSINESS_CARD_COMPONENTS } from "@/components/templates/business-card";
import { LETTER_COMPONENTS } from "@/components/templates/letter";
import {
  COVER_LETTER_TEMPLATES,
  COVER_LETTER_COMPONENTS,
} from "@/components/templates/cover-letter";
import {
  CURATED_CV_TEMPLATES,
  BUSINESS_CARD_TEMPLATES,
  LETTER_TEMPLATES,
  isPremiumTemplate,
  type CVData,
  type BusinessCardData,
  type LetterData,
} from "@/types";
import { PremiumTemplateModal } from "@/components/premium-template-modal";
import { usePremium } from "@/lib/use-premium";
import { INTER_STACK } from "@/lib/fonts";
import { getSampleCV } from "@/lib/sample-cv";

// The gallery offers the curated, genuinely-distinct CV layouts (not every
// recolor variant). Existing documents still render via the full registry.
const TEMPLATES = CURATED_CV_TEMPLATES;

// Inline SVG avatar — darker skin tone, short natural hair
const SAMPLE_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e8d5c0'/%3E%3Ccircle cx='100' cy='75' r='45' fill='%238B5E3C'/%3E%3Cellipse cx='100' cy='46' rx='32' ry='20' fill='%233D2314'/%3E%3Cpath d='M15 200 C15 148 55 130 100 130 C145 130 185 148 185 200Z' fill='%238B5E3C'/%3E%3C/svg%3E";

// The gallery shows the SAME example CV as the homepage, from one shared
// source (lib/sample-cv.ts). It used to carry its own third copy —
// "James Kariuki", Nairobi, +254, University of Nairobi, 2M+ users — which the
// brand review found on the live gallery and named as a Tanzanian reader's
// reason to assume the product was not for her.
const SAMPLE_CV_BY_LANG = {
  en: { ...getSampleCV("en"), personal: { ...getSampleCV("en").personal, photo: SAMPLE_PHOTO } },
  sw: { ...getSampleCV("sw"), personal: { ...getSampleCV("sw").personal, photo: SAMPLE_PHOTO } },
};

const SAMPLE_BUSINESS_CARD: BusinessCardData = {
  name: "Neema Joseph",
  title: "Office Administrator",
  company: "Kilimanjaro Retail Ltd",
  email: "neema.joseph@gmail.com",
  phone: "+255 712 345 678",
  website: "linkedin.com/in/neemajoseph",
  address: "Dar es Salaam, Tanzania",
};

const SAMPLE_LETTER: LetterData = {
  letterType: "reference",
  from: {
    name: "Neema Joseph",
    title: "Office Administrator",
    company: "Kilimanjaro Retail Ltd",
    address: "Dar es Salaam, Tanzania",
    email: "neema.joseph@gmail.com",
  },
  to: {
    name: "Hiring Manager",
    company: "Pamoja Distributors",
  },
  date: "19 June 2025",
  subject: "Letter of Reference",
  body: "I am pleased to write this letter of reference for a colleague I worked with closely.\n\nAt Kilimanjaro Retail she kept the daily sales, stock and staff records for a shop with twelve employees, and the weekly stock report was always ready before the manager asked for it. She is careful with money, calm with customers, and she trains new staff without being asked.",
  closing: "Yours sincerely",
};

// Sample Cover Letter data for gallery previews.
// Written for the same Tanzanian persona as the CV sample: an early-career
// office administrator applying to a real-shaped local advert, not a 7-year
// product manager writing to Google. The old sample was the second half of the
// same relevance problem the CV sample had.
const SAMPLE_COVER_LETTER_CONTENT = `I am writing to apply for the Office Administrator position advertised at your Dar es Salaam branch. I have three years of experience keeping sales, stock and staff records for a retail business, and I would like to bring that to your team.

At Kilimanjaro Retail Ltd I keep the daily records for a shop with twelve employees and I prepare the weekly stock and sales report in Excel for the manager. Before that, at Pamoja Distributors, I served customers on the shop floor and balanced the till at closing, so I understand both the paperwork and the customer side of the business.

I completed a Diploma in Business Administration at VETA (NTA Level 6) in 2021 and I am comfortable working on my own initiative. I am available to start at short notice.

I would welcome the chance to discuss how I can support your office team.`;

// Cover Letter: 794x1123 native; render at 200px wide
const CL_SCALE = 200 / 794;
const CL_PREVIEW_W = 200;
const CL_PREVIEW_H = Math.round(1123 * CL_SCALE); // ~ 283

// Business card: 350x200 native; render at ~280px wide
const BC_SCALE = 280 / 350;
const BC_PREVIEW_W = 280;
const BC_PREVIEW_H = Math.round(200 * BC_SCALE); // ~ 160

// Letter: 794x1123 native; render at 200px wide
const LTR_SCALE = 200 / 794;
const LTR_PREVIEW_W = 200;
const LTR_PREVIEW_H = Math.round(1123 * LTR_SCALE); // ~ 283

// Warm Confidence category pill styles
const STYLE_CHIP: Record<string, { label: string; className: string }> = {
  sidebar:  { label: "Easy to read", className: "bg-pine-tint text-pine" },
  minimal:  { label: "Minimal",      className: "bg-sand text-text-body" },
  header:   { label: "Header",       className: "bg-pine-tint text-pine" },
  creative: { label: "Creative",     className: "bg-ember-tint text-ember-glow" },
  classic:  { label: "Classic",      className: "bg-gold-tint text-gold-text" },
};

// Swahili labels for the style categories (shared by chips + filters)
const STYLE_LABEL_SW: Record<string, string> = {
  sidebar: "Inasomeka",
  minimal: "Sahili",
  header: "Kichwa",
  creative: "Kibunifu",
  classic: "Klasiki",
};

function StyleChip({ style }: { style: string }) {
  const sw = useLang() === "sw";
  const chip = STYLE_CHIP[style] ?? { label: style, className: "bg-sand text-text-body" };
  const label = sw ? (STYLE_LABEL_SW[style] ?? chip.label) : chip.label;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-pill uppercase tracking-wide ${chip.className}`}>
      {label}
    </span>
  );
}

/** Small "Popular" marker for the card footer — kept out of the preview so it
 *  never covers the template's own header. */
function PopularPill() {
  const sw = useLang() === "sw";
  return (
    <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide bg-gold-tint text-gold-text">
      <Icon name="star" size={9} />
      {sw ? "Maarufu" : "Popular"}
    </span>
  );
}

function PremiumPill() {
  const sw = useLang() === "sw";
  return (
    <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide bg-espresso text-cream">
      <Icon name="lock" size={9} />
      {sw ? "Premium" : "Premium"}
    </span>
  );
}

function PreviewCard({ template, cardScale, premium }: { template: typeof TEMPLATES[0]; cardScale: number; premium: boolean }) {
  const sw = useLang() === "sw";
  const lang = sw ? "sw" : "en";
  const Component = TEMPLATE_COMPONENTS[template.id] ?? NakuruTemplate;
  const previewH = Math.round(1123 * cardScale);
  // Premium is a tier, not a lock: someone with an active earned window gets the
  // design like anyone else. Before this, the card was gated purely on the
  // template id, so a referrer who had earned 7 days of Premium was still shown
  // the padlock on exactly the designs their Premium was supposed to unlock.
  const locked = isPremiumTemplate(template.id) && !premium;
  const [showLock, setShowLock] = useState(false);

  return (
    <div className="group flex flex-col bg-card rounded-card overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      {/* Preview well — fixed h-56 on grid, but responsive for actual CV preview */}
      <div
        className="relative overflow-hidden bg-sand-2 flex-shrink-0"
        style={{ height: Math.max(previewH, 224) }}
      >
        <div
          style={{
            width: 794,
            height: 1123,
            transform: `scale(${cardScale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        >
          <Component data={SAMPLE_CV_BY_LANG[lang]} primaryColor={template.previewColor} fontFamily={INTER_STACK} />
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          {locked ? (
            <button
              onClick={() => setShowLock(true)}
              className="opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 bg-card text-espresso font-semibold text-sm px-5 py-2.5 rounded-input-lg shadow-floating hover:bg-cream inline-flex items-center gap-1.5"
            >
              <Icon name="lock" size={13} />
              {sw ? "Templeti ya Premium" : "Premium template"}
            </button>
          ) : (
            <CreateEntryButton
              docType="cv"
              lang={lang}
              templateId={template.id}
              as="div"
              className="opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 bg-card text-espresso font-semibold text-sm px-5 py-2.5 rounded-input-lg shadow-floating hover:bg-cream"
            >
              {sw ? "Tumia templeti hii" : "Use this template"}
            </CreateEntryButton>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-espresso text-sm truncate">{template.name}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <StyleChip style={template.style} />
            {/* The badge still shows for a subscriber — it labels the design,
                and hiding it the moment Premium is earned would make the thing
                they paid (or referred) for look indistinguishable from free. */}
            {isPremiumTemplate(template.id) ? <PremiumPill /> : template.popular ? <PopularPill /> : null}
          </div>
        </div>
        <div className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border/50" style={{ backgroundColor: template.previewColor }} />
      </div>

      {showLock && <PremiumTemplateModal onClose={() => setShowLock(false)} />}
    </div>
  );
}

function BusinessCardGalleryCard({ template }: { template: typeof BUSINESS_CARD_TEMPLATES[0] }) {
  const sw = useLang() === "sw";
  const lang = sw ? "sw" : "en";
  const Component = BUSINESS_CARD_COMPONENTS[template.id];

  return (
    <div className="group flex flex-col bg-card rounded-card overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      {/* Business Card Preview */}
      <div
        className="relative overflow-hidden bg-sand-2 flex items-center justify-center flex-shrink-0"
        style={{ height: BC_PREVIEW_H + 32 }}
      >
        <div
          style={{
            width: BC_PREVIEW_W,
            height: BC_PREVIEW_H,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 350,
              height: 200,
              transform: `scale(${BC_SCALE})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <Component data={SAMPLE_BUSINESS_CARD} primaryColor={template.previewColor} />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <CreateEntryButton
            docType="business-card"
            lang={lang}
            templateId={template.id}
            as="div"
            className="opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 bg-card text-espresso font-semibold text-sm px-5 py-2.5 rounded-input-lg shadow-floating hover:bg-cream"
          >
            {sw ? "Tumia templeti hii" : "Use this template"}
          </CreateEntryButton>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display font-bold text-espresso text-sm truncate">{template.name}</p>
            {template.popular && <PopularPill />}
          </div>
          <p className="text-text-muted text-xs mt-0.5 truncate">{template.description}</p>
        </div>
        <div className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border/50" style={{ backgroundColor: template.previewColor }} />
      </div>
    </div>
  );
}

function LetterGalleryCard({ template }: { template: typeof LETTER_TEMPLATES[0] }) {
  const sw = useLang() === "sw";
  const lang = sw ? "sw" : "en";
  const Component = LETTER_COMPONENTS[template.id];

  return (
    <div className="group flex flex-col bg-card rounded-card overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      {/* Letter Preview */}
      <div
        className="relative overflow-hidden bg-sand-2 flex items-start justify-center flex-shrink-0"
        style={{ height: LTR_PREVIEW_H + 24 }}
      >
        <div
          style={{
            width: LTR_PREVIEW_W,
            height: LTR_PREVIEW_H,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 794,
              height: 1123,
              transform: `scale(${LTR_SCALE})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <Component data={SAMPLE_LETTER} primaryColor={template.previewColor} />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <CreateEntryButton
            docType="letter"
            lang={lang}
            templateId={template.id}
            as="div"
            className="opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 bg-card text-espresso font-semibold text-sm px-5 py-2.5 rounded-input-lg shadow-floating hover:bg-cream"
          >
            {sw ? "Tumia templeti hii" : "Use this template"}
          </CreateEntryButton>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display font-bold text-espresso text-sm truncate">{template.name}</p>
            {template.popular && <PopularPill />}
          </div>
          <p className="text-text-muted text-xs mt-0.5 truncate">{template.description}</p>
        </div>
        <div className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border/50" style={{ backgroundColor: template.previewColor }} />
      </div>
    </div>
  );
}

function CoverLetterGalleryCard({ template }: { template: typeof COVER_LETTER_TEMPLATES[0] }) {
  const sw = useLang() === "sw";
  const lang = sw ? "sw" : "en";
  const Component = COVER_LETTER_COMPONENTS[template.id];

  return (
    <div className="group flex flex-col bg-card rounded-card overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      {/* Cover Letter Preview */}
      <div
        className="relative overflow-hidden bg-sand-2 flex items-start justify-center flex-shrink-0"
        style={{ height: CL_PREVIEW_H + 24 }}
      >
        <div
          style={{
            width: CL_PREVIEW_W,
            height: CL_PREVIEW_H,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 794,
              height: 1123,
              transform: `scale(${CL_SCALE})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <Component
              senderName="Neema Joseph"
              senderTitle="Senior Software Engineer"
              recipientName="Hiring Manager"
              recipientCompany="Google Africa"
              date="July 2025"
              content={SAMPLE_COVER_LETTER_CONTENT}
              primaryColor={template.previewColor}
              fontFamily={INTER_STACK}
            />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 md:bg-black/0 md:group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <CreateEntryButton
            docType="cover-letter"
            lang={lang}
            templateId={template.id}
            as="div"
            className="opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200 bg-card text-espresso font-semibold text-sm px-5 py-2.5 rounded-input-lg shadow-floating hover:bg-cream"
          >
            {sw ? "Tumia templeti hii" : "Use this template"}
          </CreateEntryButton>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-display font-bold text-espresso text-sm truncate">{template.name}</p>
            {template.popular && <PopularPill />}
          </div>
          <p className="text-text-muted text-xs mt-0.5 truncate">{template.description}</p>
        </div>
        <div className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border/50" style={{ backgroundColor: template.previewColor }} />
      </div>
    </div>
  );
}

type TabId = "cv" | "cover-letter" | "business-card" | "letter";

const TABS: { id: TabId; label: string }[] = [
  { id: "cv",            label: "CV / Resume" },
  { id: "cover-letter",  label: "Cover Letters" },
  { id: "business-card", label: "Business Cards" },
  { id: "letter",        label: "Letters" },
];

type StyleFilter = "all" | "popular" | "sidebar" | "minimal" | "creative" | "classic" | "header";

const STYLE_FILTERS: { id: StyleFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "popular",  label: "Popular" },
  { id: "sidebar",  label: "ATS-Friendly" },
  { id: "classic",  label: "Classic" },
  { id: "minimal",  label: "Minimal" },
  { id: "creative", label: "Creative" },
  { id: "header",   label: "Header" },
];

const PAGE_SIZE = 12;

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const sw = useLang() === "sw";
  if (totalPages <= 1) return null;
  // Compact window of page numbers around the current page.
  const nums: number[] = [];
  const push = (n: number) => { if (n >= 1 && n <= totalPages && !nums.includes(n)) nums.push(n); };
  push(1); push(2);
  for (let n = page - 1; n <= page + 1; n++) push(n);
  push(totalPages - 1); push(totalPages);
  nums.sort((a, b) => a - b);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label={sw ? "Kurasa" : "Pagination"}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="px-3 py-1.5 rounded-input text-sm font-semibold text-text-body border border-border hover:border-text-muted disabled:opacity-40 disabled:cursor-not-allowed transition">
        ‹ {sw ? "Iliyopita" : "Prev"}
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-text-muted">…</span>}
          <button onClick={() => onChange(n)}
            className={`min-w-[36px] px-2 py-1.5 rounded-input text-sm font-semibold transition ${
              n === page ? "bg-ember text-cream shadow-ember-hard" : "text-text-body border border-border hover:border-text-muted"
            }`}>
            {n}
          </button>
        </span>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-input text-sm font-semibold text-text-body border border-border hover:border-text-muted disabled:opacity-40 disabled:cursor-not-allowed transition">
        {sw ? "Ifuatayo" : "Next"} ›
      </button>
    </nav>
  );
}

export function TemplateGalleryClient() {
  const sw = useLang() === "sw";
  // Earned Premium (referral days, or a paid tier when billing returns). Asked
  // once here rather than per card — the hook memoises, but a single call site
  // keeps the gate obvious. Resolved client-side on purpose: this page is a
  // CDN-cached static prerender (see lib/use-premium.ts).
  const { premium } = usePremium();
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [cardScale, setCardScale] = useState(0.27);
  const [activeTab, setActiveTab] = useState<TabId>("cv");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Reset to the first page whenever the visible set changes.
  useEffect(() => { setPage(1); }, [activeTab, styleFilter, search]);

  useEffect(() => {
    const el = firstCardRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) setCardScale(w / 794);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filteredTemplates = useMemo(() => {
    let list = TEMPLATES;
    if (styleFilter === "popular") list = TEMPLATES.filter((t) => t.popular);
    else if (styleFilter !== "all") list = TEMPLATES.filter((t) => t.style === styleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.style.toLowerCase().includes(q));
    }
    return list;
  }, [styleFilter, search]);

  return (
    <div>
      {/* Segmented tab control */}
      <div className="flex items-center border-b border-border mb-8 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setStyleFilter("all"); }}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "border-ember text-ember-hover"
                : "border-transparent text-text-muted hover:text-text-body hover:border-border"
            }`}
          >
            {sw
              ? (tab.id === "cv" ? "CV" : tab.id === "cover-letter" ? "Barua za Maombi" : tab.id === "business-card" ? "Kadi za Biashara" : "Barua")
              : tab.label}
          </button>
        ))}
      </div>

      {/* CV / Resume tab */}
      {activeTab === "cv" && (
        <>
          {/* Search */}
          <div className="relative max-w-xs mx-auto mb-6">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={sw ? "Tafuta templeti" : "Search templates"}
              placeholder={sw ? "Tafuta templeti..." : "Search templates..."}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-sand-2 text-espresso placeholder:text-text-muted rounded-input-lg focus:outline-none focus:ring-2 focus:ring-ember-tint focus:bg-cream transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label={sw ? "Futa utafutaji" : "Clear search"} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
            {STYLE_FILTERS.map((f) => {
              const count = f.id === "all" ? TEMPLATES.length
                : f.id === "popular" ? TEMPLATES.filter((t) => t.popular).length
                : TEMPLATES.filter((t) => t.style === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => { setStyleFilter(f.id); setSearch(""); }}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition-all duration-150 border ${
                    styleFilter === f.id
                      ? "bg-espresso text-white border-espresso"
                      : "bg-card text-text-body border-border hover:border-text-muted hover:text-espresso"
                  }`}
                >
                  {sw
                    ? (f.id === "all" ? "Zote" : f.id === "popular" ? "Maarufu" : STYLE_LABEL_SW[f.id] ?? f.label)
                    : f.label}
                  {f.id !== "all" && (
                    <span className="ml-1.5 opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
            const safePage = Math.min(page, totalPages);
            const start = filteredTemplates.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
            const end = Math.min(safePage * PAGE_SIZE, filteredTemplates.length);
            return (
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-text-muted font-medium">
                  {filteredTemplates.length === 0
                    ? (sw ? "Templeti 0" : "0 templates")
                    : sw
                      ? `Inaonyesha ${start}–${end} kati ya ${filteredTemplates.length}${filteredTemplates.length !== TEMPLATES.length ? ` (imechujwa kutoka ${TEMPLATES.length})` : ""}`
                      : `Showing ${start}–${end} of ${filteredTemplates.length}${filteredTemplates.length !== TEMPLATES.length ? ` (filtered from ${TEMPLATES.length})` : ""}`}
                </p>
                {filteredTemplates.length < TEMPLATES.length && (
                  <button
                    onClick={() => { setStyleFilter("all"); setSearch(""); }}
                    className="text-xs font-semibold px-3 py-1 rounded-pill border border-ember-tint text-ember-hover hover:bg-ember-tint transition"
                  >
                    {sw ? "Ondoa vichujio" : "Clear filters"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Card grid (paginated) — re-keyed so filter/search/page changes cross-fade + stagger in */}
          <motion.div
            key={`cv-${styleFilter}-${page}-${search}`}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.035 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {filteredTemplates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((template, i) => (
              <motion.div
                key={template.id}
                ref={i === 0 ? firstCardRef : undefined}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <PreviewCard template={template} cardScale={cardScale} premium={premium} />
              </motion.div>
            ))}
          </motion.div>

          <Pager page={page} totalPages={Math.ceil(filteredTemplates.length / PAGE_SIZE)} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted text-sm mb-2">
                {search
                  ? (sw ? `Hakuna templeti inayolingana na "${search}"` : `No templates matching "${search}"`)
                  : (sw ? "Bado hakuna templeti katika mtindo huu." : "No templates in this style yet.")}
              </p>
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-ember-hover hover:underline">
                  {sw ? "Ondoa utafutaji" : "Clear search"}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Business Cards tab */}
      {activeTab === "business-card" && (
        <>
          <p className="text-xs text-text-muted font-medium mb-4">{sw ? `Templeti ${BUSINESS_CARD_TEMPLATES.length}` : `${BUSINESS_CARD_TEMPLATES.length} templates`}</p>
          <motion.div
            key={`bc-${page}`}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.035 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {BUSINESS_CARD_TEMPLATES.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((template) => (
              <motion.div
                key={template.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <BusinessCardGalleryCard template={template} />
              </motion.div>
            ))}
          </motion.div>
          <Pager page={page} totalPages={Math.ceil(BUSINESS_CARD_TEMPLATES.length / PAGE_SIZE)} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}

      {/* Cover Letters tab */}
      {activeTab === "cover-letter" && (
        <>
          <p className="text-xs text-text-muted font-medium mb-4">{sw ? `Templeti ${COVER_LETTER_TEMPLATES.length}` : `${COVER_LETTER_TEMPLATES.length} templates`}</p>
          <motion.div
            key={`cl-${page}`}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.035 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {COVER_LETTER_TEMPLATES.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((template) => (
              <motion.div
                key={template.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <CoverLetterGalleryCard template={template} />
              </motion.div>
            ))}
          </motion.div>
          <Pager page={page} totalPages={Math.ceil(COVER_LETTER_TEMPLATES.length / PAGE_SIZE)} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}

      {/* Letters tab */}
      {activeTab === "letter" && (
        <>
          <p className="text-xs text-text-muted font-medium mb-4">{sw ? `Templeti ${LETTER_TEMPLATES.length}` : `${LETTER_TEMPLATES.length} templates`}</p>
          <motion.div
            key={`letter-${page}`}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.035 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {LETTER_TEMPLATES.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((template) => (
              <motion.div
                key={template.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <LetterGalleryCard template={template} />
              </motion.div>
            ))}
          </motion.div>
          <Pager page={page} totalPages={Math.ceil(LETTER_TEMPLATES.length / PAGE_SIZE)} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </div>
  );
}
