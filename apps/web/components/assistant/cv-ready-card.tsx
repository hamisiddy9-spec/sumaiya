"use client";

// The "your CV is ready" moment — shown IN the chat after Sumaiya builds it,
// instead of dumping the user straight into the full editor.
//
//   L1  a real preview + one big "Download PDF"
//   L2  three looks to tap through + a colour row
//   L3  "Open the full editor" for everything else
//
// A user who isn't tech-savvy sees their CV, picks a colour, downloads. A
// curious user opens the editor.

import { useMemo, useRef, useState } from "react";
import { Download, Loader2, Pencil } from "lucide-react";
import type { CVData } from "@/types";
import { HERO_TEMPLATE_COMPONENTS } from "@/components/templates/hero-registry";
import { exportElementToPdf } from "@/lib/pdf";
import { INTER_STACK } from "@/lib/fonts";

const LOOKS: { id: string; label: { en: string; sw: string } }[] = [
  { id: "rift", label: { en: "Classic", sw: "Rasmi" } },
  { id: "nuru", label: { en: "Modern", sw: "Ya kisasa" } },
  { id: "pemba", label: { en: "Simple", sw: "Sahili" } },
];
const COLORS = ["#DA4A1C", "#12433D", "#211A15", "#7C3AED", "#B57A18", "#059669"];

const PAGE_W = 794;
const PAGE_H = 1123;

export function CvReadyCard({
  cv,
  sw,
  onOpenEditor,
  initialLook = "rift",
  initialColor = "#DA4A1C",
}: {
  cv: CVData;
  sw: boolean;
  onOpenEditor: (look: string, color: string) => void;
  initialLook?: string;
  initialColor?: string;
}) {
  const [look, setLook] = useState(LOOKS.some((l) => l.id === initialLook) ? initialLook : "rift");
  const [color, setColor] = useState(initialColor);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const Template = useMemo(
    () => HERO_TEMPLATE_COMPONENTS[look as keyof typeof HERO_TEMPLATE_COMPONENTS] ?? HERO_TEMPLATE_COMPONENTS.rift,
    [look],
  );

  const thumbW = 260;
  const scale = thumbW / PAGE_W;

  const download = async () => {
    if (downloading || !exportRef.current) return;
    setDownloading(true);
    try {
      const name = cv.personal?.fullName?.trim();
      await exportElementToPdf(exportRef.current, {
        filename: `${name ? name.replace(/\s+/g, "-") : "CV"}-Sumaiya.pdf`,
        scale: "high",
        format: "a4",
      });
    } catch {
      /* the export helper surfaces its own error UI on iOS etc. */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-[88%] bg-card border border-ember/30 rounded-card-lg shadow-sm p-3.5 space-y-3">
      <p className="text-sm font-bold text-espresso">
        {sw ? "CV yako iko tayari 🎉" : "Your CV is ready 🎉"}
      </p>

      {/* preview */}
      <div
        className="mx-auto rounded-lg overflow-hidden border border-border bg-white shadow-card"
        style={{ width: thumbW, height: Math.round(PAGE_H * scale) }}
      >
        <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
          <Template data={cv} primaryColor={color} fontFamily={INTER_STACK} />
        </div>
      </div>

      {/* looks */}
      <div className="flex justify-center gap-1.5">
        {LOOKS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLook(l.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-pill border transition ${
              look === l.id ? "bg-ember text-cream border-ember" : "border-border-input text-text-body hover:border-ember"
            }`}
          >
            {sw ? l.label.sw : l.label.en}
          </button>
        ))}
      </div>

      {/* colours */}
      <div className="flex justify-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={c}
            className={`w-6 h-6 rounded-full transition ${color === c ? "ring-2 ring-offset-1 ring-espresso scale-110" : "hover:scale-110"}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* actions */}
      <button
        onClick={download}
        disabled={downloading}
        className="w-full inline-flex items-center justify-center gap-2 bg-ember text-cream font-semibold text-sm rounded-pill py-2.5 hover:bg-ember-hover disabled:opacity-60 transition"
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {sw ? "Pakua PDF" : "Download PDF"}
      </button>
      <button
        onClick={() => onOpenEditor(look, color)}
        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-ember-hover hover:text-ember py-1.5"
      >
        <Pencil className="w-3.5 h-3.5" />
        {sw ? "Fungua kihariri kamili" : "Open the full editor"}
      </button>

      {/* offscreen full-size render for the PDF export */}
      <div style={{ position: "fixed", left: -99999, top: 0, width: PAGE_W, pointerEvents: "none" }} aria-hidden>
        <div ref={exportRef} style={{ width: PAGE_W, minHeight: PAGE_H, background: "#fff" }}>
          <Template data={cv} primaryColor={color} fontFamily={INTER_STACK} />
        </div>
      </div>
    </div>
  );
}
