"use client";

// Inline template preview card (P3) — a real visual instead of a bare id chip.
// Deterministic: the thumbnail is a tiny "document skeleton" derived from the
// template's existing style + previewColor metadata — no images, no network,
// no AI. Lazy by construction (only renders when a template is referenced) and
// layout-shift-free (fixed 3:4 thumbnail box, fixed text column).
import Link from "next/link";
import type { CSSProperties } from "react";
import type { TemplatePreviewInfo, TemplateThumbStyle } from "@/lib/assistant/template-preview";

function line(width: string, extra?: CSSProperties) {
  return <div style={{ height: 4, borderRadius: 2, background: "#E4DAC8", width, ...extra }} />;
}

function ThumbSkeleton({ style, color }: { style: TemplateThumbStyle; color: string }) {
  switch (style) {
    case "sidebar":
      return (
        <div className="flex h-full w-full">
          <div style={{ background: color, width: "34%" }} />
          <div className="flex-1 space-y-1 p-1.5">
            <div style={{ height: 6, width: "70%", borderRadius: 1, background: color }} />
            {line("90%")}
            {line("80%")}
            {line("60%")}
          </div>
        </div>
      );
    case "header":
      return (
        <div className="flex h-full w-full flex-col">
          <div style={{ background: color, height: "30%" }} />
          <div className="flex-1 space-y-1 p-1.5">
            {line("70%")}
            {line("90%")}
            {line("85%")}
            {line("50%")}
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className="flex h-full w-full flex-col p-1.5">
          <div style={{ height: 3, background: color }} />
          <div className="flex-1 space-y-1 pt-1.5">
            {line("55%", { margin: "0 auto" })}
            {line("85%")}
            {line("75%")}
            {line("40%")}
          </div>
        </div>
      );
    case "creative":
      return (
        <div className="flex h-full w-full flex-col gap-1 p-1.5">
          <div style={{ background: color, height: "40%", borderRadius: 3 }} />
          <div className="flex flex-1 gap-1">
            <div style={{ background: color, opacity: 0.35, flex: 1, borderRadius: 3 }} />
            <div className="flex-1 space-y-1">
              {line("90%")}
              {line("70%")}
              {line("55%")}
            </div>
          </div>
        </div>
      );
    case "classic":
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2">
          <div style={{ width: "80%", height: 2, background: color }} />
          <div style={{ height: 6, width: "50%", borderRadius: 1, background: color }} />
          {line("70%")}
          {line("50%")}
          {line("65%")}
        </div>
      );
    case "card":
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="space-y-1" style={{ border: `2px solid ${color}`, width: "72%", height: "72%", borderRadius: 6, padding: 5 }}>
            <div style={{ height: 5, width: "70%", borderRadius: 1, background: color }} />
            {line("90%")}
            {line("60%")}
          </div>
        </div>
      );
    case "letter":
      return (
        <div className="flex h-full w-full flex-col space-y-1 p-1.5">
          <div className="flex justify-between">
            {line("30%")}
            {line("30%")}
          </div>
          <div style={{ height: 3, background: color, marginTop: 1 }} />
          <div className="flex-1 space-y-1 pt-1">
            {line("90%")}
            {line("85%")}
            {line("80%")}
            {line("40%")}
          </div>
        </div>
      );
  }
}

export function TemplatePreviewCard({ info, sw }: { info: TemplatePreviewInfo; sw: boolean }) {
  return (
    <Link
      href={info.href}
      aria-label={sw ? `Fungua templeti ya ${info.name}` : `Open the ${info.name} template`}
      className="group flex max-w-[280px] items-stretch gap-2.5 rounded-2xl border border-border bg-card p-2.5 transition hover:border-ember/50"
    >
      <div className="w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-white" style={{ aspectRatio: "3 / 4" }}>
        <ThumbSkeleton style={info.thumbStyle} color={info.previewColor} />
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-0.5 py-0.5">
        <p className="truncate text-[12.5px] font-bold leading-tight text-espresso">{info.name}</p>
        {/* Names the tier instead of hiding it — the assistant should not
            recommend a design and let the padlock be the first the user hears
            of it. Same wording as the gallery's PremiumPill. */}
        {info.premium && (
          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-pill bg-espresso px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cream">
            Premium
          </span>
        )}
        <p className="line-clamp-2 text-[10.5px] leading-snug text-text-muted">{info.description}</p>
        <p className="mt-0.5 text-[10.5px] font-semibold text-ember-hover group-hover:underline">
          {sw ? "Fungua →" : "Open →"}
        </p>
      </div>
    </Link>
  );
}
