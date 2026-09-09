"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { LETTER_TYPE_META } from "@/types";
import type { LetterType } from "@/types";
import { useLang } from "@/lib/i18n/context";
import { CreateEntryButton } from "@/components/editor/create-entry-options";

const LETTER_TYPES: LetterType[] = [
  "reference", "resignation", "application",
  "employment-verification", "salary-increase", "promotion",
  "leave-of-absence", "job-offer", "appointment-confirmation",
  "termination", "business-proposal", "complaint",
  "apology", "inquiry", "authorization",
  "partnership-mou", "vacate-notice", "scholarship",
  "internship", "sponsorship", "quotation", "invoice", "letterhead",
];

const SW_LABELS: Record<LetterType, { label: string; description: string }> = {
  reference:           { label: "Barua ya Mapendekezo",   description: "Pendekeza mwanachama au mfanyakazi" },
  resignation:         { label: "Barua ya Kujiuzulu",     description: "Jiuzulu rasmi kutoka kwenye nafasi" },
  application:         { label: "Barua ya Maombi",        description: "Omba kazi au programu" },
  "employment-verification": { label: "Uthibitisho wa Ajira",    description: "Thibitisha cheo, muda na mshahara" },
  "salary-increase":   { label: "Ombi la Nyongeza ya Mshahara", description: "Ombi la nyongeza yenye ushahidi" },
  promotion:           { label: "Ombi la Kupandishwa Cheo",     description: "Hoja za kupandishwa cheo" },
  "leave-of-absence":  { label: "Ombi la Likizo",              description: "Likizo ya kila mwaka, masomo au matibabu" },
  "job-offer":         { label: "Barua ya Kutoa Kazi",         description: "Mwajiri kwa mtahiniwa, masharti yamojumuishwa" },
  "appointment-confirmation": { label: "Uthibitisho wa Uteuzi",       description: "Uthibitisho wa mahojiano au mkutano" },
  termination:         { label: "Notisi ya Kusitisha Ajira",   description: "Notisi ya kumaliza mkataba" },
  "business-proposal": { label: "Pendekezo la Biashara",       description: "Barua ya pendekezo la zabuni" },
  complaint:           { label: "Barua ya Malalamiko",        description: "Malalamiko ya kitaalamu" },
  apology:             { label: "Barua ya Kuomba Radhi",      description: "Kuomba radhi kwa makosa" },
  inquiry:             { label: "Barua ya Uchunguzi",         description: "Ombi la habari au bei" },
  authorization:       { label: "Barua ya Idhini",            description: "Mkabidhi mtu kutenda kwa niaba yako" },
  "partnership-mou":   { label: "Barua ya Ushirikiano / MOU", description: "Tambulisha makubaliano ya ushirikiano" },
  "vacate-notice":     { label: "Notisi ya Kuhama",           description: "Notisi ya mpangaji/mwenye nyumba" },
  scholarship:         { label: "Ombi la Scholarship",        description: "Ombi la ufadhili kwa masomo" },
  internship:          { label: "Ombi la Internship",         description: "Mwanafunzi kuomba kwa mwajiri" },
  sponsorship:         { label: "Ombi la Ufadhili",           description: "Ombi la ufadhili wa tukio au jamii" },
  quotation:           { label: "Quotation",                  description: "Bei ya bidhaa au huduma kwa mteja" },
  invoice:             { label: "Invoice",                    description: "Bili ya bidhaa au huduma" },
  letterhead:          { label: "Letterhead",                 description: "Kichwa cha barua cha kampuni" },
};

interface Props {
  className?: string;
}

export function LetterTypePicker({ className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lang = useLang();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const triggerClass =
    className ??
    "inline-flex items-center gap-2 bg-card border border-border hover:border-text-muted text-text-body font-semibold px-4 py-2.5 rounded-input-lg transition text-sm";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <Plus className="w-4 h-4" />
        {lang === "sw" ? "Barua Rasmi Mpya" : "New Formal Letter"}
        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-card-lg shadow-floating py-1 min-w-[240px] max-h-[480px] overflow-y-auto">
          {LETTER_TYPES.map((type) => {
            const meta = LETTER_TYPE_META[type];
            const label       = lang === "sw" ? SW_LABELS[type].label       : meta.label;
            const description = lang === "sw" ? SW_LABELS[type].description : meta.description;
            return (
              <CreateEntryButton
                key={type}
                docType="letter"
                lang={lang}
                as="button"
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-sand-2 transition"
              >
                <span className="text-base leading-none mt-0.5">{meta.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-espresso">{label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{description}</p>
                </div>
              </CreateEntryButton>
            );
          })}
        </div>
      )}
    </div>
  );
}
