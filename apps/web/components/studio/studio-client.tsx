"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Check, Download } from "lucide-react";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { TEMPLATES, createEmptyCVData, isTemplateId, type CVData } from "@/types";
import { exportElementToPdf } from "@/lib/pdf";
import { FONT_SELECT_OPTIONS } from "@/lib/fonts";
import type { CV } from "@/lib/db/schema";

// Studio color themes + font pairs — recolor / retypeset the live preview.
const COLOR_THEMES = ["#DA4A1C", "#12433D", "#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706", "#0891B2", "#211A15", "#0F172A"];
const FONT_PAIRS = FONT_SELECT_OPTIONS;
const RAIL = ["Design", "Elements", "Text", "Brand", "Photos", "Uploads"];

function castCV(raw: unknown): CVData {
  if (raw && typeof raw === "object" && "personal" in (raw as object)) return raw as CVData;
  return createEmptyCVData();
}

export function StudioClient({ initialDoc, accessToken }: { initialDoc: CV; accessToken?: string }) {
  const cvData = castCV(initialDoc.data);
  const [templateId, setTemplateId] = useState(isTemplateId(initialDoc.templateId) ? initialDoc.templateId : "nakuru");
  const [primaryColor, setPrimaryColor] = useState(initialDoc.primaryColor || "#DA4A1C");
  const [fontFamily, setFontFamily] = useState(initialDoc.fontFamily || "Inter");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [tplQuery, setTplQuery] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const saveRef = useRef<ReturnType<typeof setTimeout>>();
  const firstRun = useRef(true);

  // Fit the A4 page (794px) into the canvas.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.3, Math.min(0.85, (el.offsetWidth - 80) / 794)));
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      await fetch(`/api/cv/${initialDoc.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({ templateId, primaryColor, fontFamily }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }, [initialDoc.id, templateId, primaryColor, fontFamily, accessToken]);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setSaved(false);
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => void save(), 700);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [templateId, primaryColor, fontFamily, save]);

  const download = async () => {
    const el = pageRef.current;
    if (!el || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(false);
    try {
      await exportElementToPdf(el, { filename: `${initialDoc.title.replace(/\s+/g, "_")}.pdf`, scale: 2 });
    } catch {
      setDownloadError(true);
    } finally { setIsDownloading(false); }
  };

  const Template = TEMPLATE_COMPONENTS[templateId] ?? NakuruTemplate;
  const templates = TEMPLATES.filter((t) => !tplQuery || t.name.toLowerCase().includes(tplQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-[#1A1510] overflow-hidden">
      {/* Top bar */}
      <div className="h-[54px] bg-espresso border-b border-espresso-line flex items-center px-4 gap-4 flex-shrink-0 text-cream">
        <Link href={`/editor/cv/${initialDoc.id}`} className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-ember shadow-[0_2px_0_#A8330F]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5EE" strokeWidth="1.75" className="h-4 w-4"><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
          </div>
        </Link>
        <span className="text-sm font-medium truncate max-w-[220px]">{initialDoc.title}</span>
        <div className="flex-1" />
        <span className="text-xs text-cream/50 flex items-center gap-1.5">
          {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</> : saved ? <><Check className="w-3 h-3 text-green-400" /> All changes saved</> : "Unsaved"}
        </span>
        <div className="flex flex-col items-end">
          <button onClick={download} disabled={isDownloading}
            className="inline-flex items-center gap-1.5 bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2 rounded-[9px] shadow-[0_3px_0_#A8330F] active:shadow-[0_1px_0_#A8330F] active:translate-y-[2px] transition disabled:opacity-60">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
          </button>
          {downloadError && (
            <span className="text-[11px] text-red-300 mt-1">Download failed. Please try again.</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Icon rail */}
        <div className="hidden md:flex w-[82px] bg-espresso flex-col items-center py-3 gap-1 flex-shrink-0 border-r border-espresso-line">
          {RAIL.map((label, i) => (
            <div key={label} className={`w-[68px] flex flex-col items-center gap-1 py-2.5 rounded-[10px] ${i === 0 ? "bg-espresso-2 text-gold" : "text-cream/50"}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
              <span className="text-[10px]">{label}</span>
            </div>
          ))}
        </div>

        {/* Templates panel */}
        <div className="hidden md:flex w-[268px] bg-card border-r border-border flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="font-display font-bold text-espresso">Templates</h2>
              <span className="font-mono text-xs text-text-muted">{templates.length}</span>
            </div>
            <input value={tplQuery} onChange={(e) => setTplQuery(e.target.value)} placeholder="Search templates…"
              className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button key={t.id} onClick={() => setTemplateId(t.id)}
                className={`rounded-card overflow-hidden border-2 text-left transition ${templateId === t.id ? "border-ember" : "border-border hover:border-text-muted"}`}>
                <div className="h-24 flex items-center justify-center" style={{ background: t.previewColor + "18" }}>
                  <div className="w-10 h-14 rounded-sm bg-card border border-border" style={{ borderTopColor: t.previewColor, borderTopWidth: 4 }} />
                </div>
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-espresso truncate">{t.name}</span>
                  {templateId === t.id && <Check className="w-3 h-3 text-ember shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 relative overflow-auto flex items-start justify-center p-10"
          style={{ backgroundColor: "#E4DBCC", backgroundImage: "radial-gradient(#C9BCA6 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div style={{ width: 794 * scale, height: 1123 * scale, flexShrink: 0 }}>
            <div ref={pageRef} style={{ width: 794, minHeight: 1123, transform: `scale(${scale})`, transformOrigin: "top left", background: "#fff", boxShadow: "0 30px 70px -30px rgba(33,26,21,0.35)" }}>
              <Template data={cvData} primaryColor={primaryColor} fontFamily={fontFamily} />
            </div>
          </div>

          {/* Floating themes panel */}
          <div className="absolute top-6 right-6 w-[176px] bg-card border border-border rounded-card shadow-[0_12px_30px_-12px_rgba(33,26,21,0.25)] p-3.5 space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-muted mb-2">Color theme</p>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_THEMES.map((c) => (
                  <button key={c} onClick={() => setPrimaryColor(c)} aria-label={c}
                    className={`h-7 w-7 rounded-full border transition ${primaryColor.toLowerCase() === c.toLowerCase() ? "ring-2 ring-ember ring-offset-1" : "border-border"}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-muted mb-2">Font pair</p>
              <div className="space-y-1.5">
                {FONT_PAIRS.map((f) => (
                  <button key={f.value} onClick={() => setFontFamily(f.value)}
                    className={`w-full text-left px-3 py-1.5 rounded-input text-[13px] border transition ${fontFamily === f.value ? "border-ember bg-ember-tint text-ember-hover font-semibold" : "border-border text-text-body hover:border-text-muted"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile note */}
      <div className="md:hidden bg-espresso text-cream/60 text-xs text-center py-2 flex-shrink-0">
        The Studio is best on a larger screen. <Link href={`/editor/cv/${initialDoc.id}`} className="text-ember font-semibold">Open the editor</Link>
      </div>
    </div>
  );
}
