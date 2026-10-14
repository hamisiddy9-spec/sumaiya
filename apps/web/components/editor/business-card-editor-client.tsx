"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Download, CreditCard, Loader2, Check } from "lucide-react";
import { EditorShell } from "@/components/editor/editor-shell";
import {
  BUSINESS_CARD_TEMPLATES,
  createEmptyBusinessCardData,
  type BusinessCardData,
  type BusinessCardTemplateId,
} from "@/types";
import { BUSINESS_CARD_COMPONENTS } from "@/components/templates/business-card";

// Guard against an unknown/legacy templateId in a stored doc: an unrecognised id
// would make BUSINESS_CARD_COMPONENTS[id] undefined and crash the editor. Fall
// back to "classic", mirroring the CV/cover-letter defensive pattern.
function toBusinessCardTemplateId(raw: unknown): BusinessCardTemplateId {
  return typeof raw === "string" && raw in BUSINESS_CARD_COMPONENTS ? (raw as BusinessCardTemplateId) : "classic";
}
import { exportElementToPdf, sharePdf } from "@/lib/pdf";
import { t, type Lang } from "@/lib/i18n/translations";
import { SharedProfilePanel } from "@/components/editor/shared-profile-panel";
import { PreviewWatermark } from "@/components/editor/preview-watermark";

interface Props {
  initialDoc: {
    id: string;
    title: string;
    templateId: string;
    primaryColor: string;
    data: unknown;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  userId: string;
  accessToken?: string;
  isPremium: boolean;
  lang?: Lang;
  guestMode?: boolean;
}

const COLOR_PRESETS = [
  "#DA4A1C",
  "#12433D",
  "#1e293b",
  "#0F172A",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DC2626",
];

// Scale factor for thumbnail previews: 87 / 350 ≈ 0.2486
const THUMB_SCALE = 87 / 350;

function castToBusinessCardData(raw: unknown): BusinessCardData {
  const empty = createEmptyBusinessCardData();
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Record<string, unknown>;
  return {
    name: typeof r.name === "string" ? r.name : empty.name,
    title: typeof r.title === "string" ? r.title : empty.title,
    company: typeof r.company === "string" ? r.company : empty.company,
    email: typeof r.email === "string" ? r.email : empty.email,
    phone: typeof r.phone === "string" ? r.phone : empty.phone,
    website: typeof r.website === "string" ? r.website : undefined,
    address: typeof r.address === "string" ? r.address : undefined,
    tagline: typeof r.tagline === "string" ? r.tagline : undefined,
  };
}

export function BusinessCardEditorClient({ initialDoc, accessToken, isPremium: isPremiumProp, lang = "en", guestMode = false }: Props) {
  const isPremium = true; // payment temporarily disabled
  const [title, setTitle] = useState(initialDoc.title);
  const [templateId, setTemplateId] = useState<BusinessCardTemplateId>(
    toBusinessCardTemplateId(initialDoc.templateId)
  );
  const [primaryColor, setPrimaryColor] = useState(initialDoc.primaryColor || "#1e293b");
  const [cardData, setCardData] = useState<BusinessCardData>(
    castToBusinessCardData(initialDoc.data)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const previewRef = useRef<HTMLDivElement>(null);

  // Keep COLOR_PRESETS including the doc's primaryColor
  const colorOptions = Array.from(new Set([primaryColor, ...COLOR_PRESETS])).slice(0, 8);

  const handleSave = useCallback(async (opts?: { keepalive?: boolean }) => {
    // Guests have no account to save to — they build + download; saving happens
    // after they sign in. Skipping avoids a 401 on every autosave.
    if (guestMode) return;
    setIsSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/documents/business-card/${initialDoc.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ title, templateId, primaryColor, data: cardData }),
        keepalive: opts?.keepalive ?? false,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }, [guestMode, initialDoc.id, title, templateId, primaryColor, cardData, accessToken]);

  // Guests have no account to save to — persist the whole draft to localStorage
  // so a refresh or navigation never wipes the card (the CV, cover-letter and
  // letter editors already do this; the business-card editor was the last gap).
  const GUEST_CARD_KEY = "sumaiya-guest-business-card";
  const persistGuestDraft = useCallback(() => {
    try {
      localStorage.setItem(GUEST_CARD_KEY, JSON.stringify({ title, templateId, primaryColor, data: cardData }));
    } catch {}
  }, [title, templateId, primaryColor, cardData]);

  // Refs to the latest save/persist so the unmount/unload flush uses current state.
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const persistGuestDraftRef = useRef(persistGuestDraft);
  persistGuestDraftRef.current = persistGuestDraft;

  const triggerAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      autoSaveRef.current = undefined;
      if (guestMode) persistGuestDraft();
      else handleSave();
    }, 800);
  }, [guestMode, handleSave, persistGuestDraft]);

  // Auto-save whenever any value changes. Skip the very first run: mounting the
  // editor with loaded data would otherwise fire a needless PATCH that writes
  // the data straight back (matches the cover-letter/letter editors' guard).
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    triggerAutoSave();
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, templateId, primaryColor, cardData]);

  // Flush a pending save when leaving (client-side unmount dropped the last
  // <800ms of edits; real unload had no handler). keepalive on unload so the
  // request survives teardown.
  useEffect(() => {
    const flush = (keepalive: boolean) => {
      if (!autoSaveRef.current) return;
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = undefined;
      if (guestMode) persistGuestDraftRef.current();
      else handleSaveRef.current({ keepalive });
    };
    const onBeforeUnload = () => flush(true);
    const onHide = () => { if (document.visibilityState === "hidden") flush(true); };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHide);
      flush(false);
    };
  }, []);

  // Restore a guest's persisted card on mount so a refresh doesn't lose it.
  useEffect(() => {
    if (!guestMode) return;
    try {
      const raw = localStorage.getItem(GUEST_CARD_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { title?: string; templateId?: string; primaryColor?: string; data?: unknown };
      if (d.title) setTitle(d.title);
      if (d.templateId) setTemplateId(toBusinessCardTemplateId(d.templateId));
      if (d.primaryColor) setPrimaryColor(d.primaryColor);
      if (d.data) setCardData(d.data as BusinessCardData);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = <K extends keyof BusinessCardData>(key: K, value: BusinessCardData[K]) => {
    setCardData((prev: BusinessCardData) => ({ ...prev, [key]: value }));
  };

  const cardPdfOpts = () => ({
    filename: `${(title || "business_card").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_")}_business_card.pdf`,
    scale: 3 as const,
    orientation: "landscape" as const,
    unit: "in" as const,
    format: [3.5, 2] as [number, number],
  });

  const handleShare = async () => {
    const el = previewRef.current;
    if (!el) { setDownloadError(lang === "sw" ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }
    setIsSharing(true);
    setDownloadError("");
    try {
      await sharePdf(el, {
        ...cardPdfOpts(),
        shareTitle: title || (lang === "sw" ? "Kadi yangu ya biashara" : "My business card"),
        shareText: lang === "sw" ? "Kadi yangu ya biashara — Sumaiya" : "My business card — made with Sumaiya",
      });
      try { await fetch(`/api/documents/business-card/${initialDoc.id}/download`, { method: "POST" }); } catch {}
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setDownloadError(lang === "sw" ? "Sikuweza kushiriki. Tumia Pakua badala yake." : "Couldn't share. Try Download instead.");
        setTimeout(() => setDownloadError(""), 5000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadError("");
    try {
      const el = previewRef.current;
      if (!el) { setDownloadError(lang === "sw" ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }

      await exportElementToPdf(el, cardPdfOpts());
      try {
        await fetch(`/api/documents/business-card/${initialDoc.id}/download`, { method: "POST" });
      } catch {}
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : (lang === "sw" ? "Sikuweza kupakua PDF. Jaribu tena." : "PDF export failed. Try again."));
      setTimeout(() => setDownloadError(""), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const ActiveTemplate = BUSINESS_CARD_COMPONENTS[templateId] ?? BUSINESS_CARD_COMPONENTS.classic;

  return (
    <>
      <EditorShell
        lang={lang}
        backHref="/dashboard"
        title={title}
        onTitleChange={setTitle}
        docTypeMarker={<CreditCard className="w-4 h-4 text-cream/50 flex-shrink-0" />}
        saving={isSaving}
        saved={saved}
        saveError={saveError}
        onManualSave={() => handleSave()}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        onShare={() => void handleShare()}
        sharing={isSharing}
        onDownload={() => void handleExportPdf()}
        downloading={isDownloading}
        downloadSuccess={downloadSuccess}
        errorBanner={downloadError}
      >
        {/* ── Left panel — controls ── */}
        <div className={`${mobileView === "edit" ? "flex" : "hidden"} md:flex w-full md:w-[400px] bg-white border-r border-border flex-col overflow-hidden flex-shrink-0`}>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Shared profile — pull your saved identity onto the card */}
            <div className="border border-border rounded-xl p-3">
              <SharedProfilePanel
                accessToken={accessToken}
                lang={lang}
                onProfileChange={(profile) => {
                  if (profile.fullName) updateField("name", profile.fullName);
                  if (profile.jobTitle) updateField("title", profile.jobTitle);
                  if (profile.email) updateField("email", profile.email);
                  if (profile.phone) updateField("phone", profile.phone);
                  if (profile.website) updateField("website", profile.website);
                  if (profile.location) updateField("address", profile.location);
                }}
              />
            </div>

            {/* ── Card Details ── */}
            <section>
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                {lang === "sw" ? "Maelezo ya Kadi" : "Card Details"}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Jina Kamili" : "Full Name"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={cardData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. Amara Njoku" : "e.g. Amara Njoku"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Cheo" : "Job Title"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={cardData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. Mhasibu Mkuu" : "e.g. Senior Accountant"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Kampuni" : "Company"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={cardData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. Zuri Fintech" : "e.g. Zuri Fintech"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Barua pepe" : "Email"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={cardData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. amara@company.co.ke" : "e.g. amara@company.co.ke"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Simu" : "Phone"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={cardData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. +254 700 000 000" : "e.g. +254 700 000 000"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Tovuti" : "Website"}{" "}
                    <span className="text-text-muted font-normal">{lang === "sw" ? "(si lazima)" : "(optional)"}</span>
                  </label>
                  <input
                    value={cardData.website ?? ""}
                    onChange={(e) => updateField("website", e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. www.amaranjoku.com" : "e.g. www.amaranjoku.com"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Anwani" : "Address"}{" "}
                    <span className="text-text-muted font-normal">{lang === "sw" ? "(si lazima)" : "(optional)"}</span>
                  </label>
                  <input
                    value={cardData.address ?? ""}
                    onChange={(e) => updateField("address", e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. Westlands, Nairobi" : "e.g. Westlands, Nairobi"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-body mb-1">
                    {lang === "sw" ? "Kaulimbiu" : "Tagline"}{" "}
                    <span className="text-text-muted font-normal">{lang === "sw" ? "(si lazima)" : "(optional)"}</span>
                  </label>
                  <input
                    value={cardData.tagline ?? ""}
                    onChange={(e) => updateField("tagline", e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder={lang === "sw" ? "mf. Kujenga mustakabali wa fedha" : "e.g. Building the future of finance"}
                  />
                </div>
              </div>
            </section>

            {/* ── Template picker ── */}
            <section className="border-t border-border pt-5">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                {t(lang, "editor.template")}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {BUSINESS_CARD_TEMPLATES.map((tpl) => {
                  const TplComponent = BUSINESS_CARD_COMPONENTS[tpl.id];
                  const isSelected = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setTemplateId(tpl.id)}
                      className={`group flex flex-col gap-1.5 items-center rounded-lg p-1.5 border-2 transition-all ${
                        isSelected
                          ? "border-ember bg-ember-tint"
                          : "border-transparent hover:border-border hover:bg-sand"
                      }`}
                    >
                      {/* Thumbnail: render template at full size then scale down */}
                      <div
                        style={{
                          width: 87,
                          height: 50,
                          overflow: "hidden",
                          borderRadius: 4,
                          flexShrink: 0,
                          position: "relative",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${THUMB_SCALE})`,
                            transformOrigin: "top left",
                            width: 350,
                            height: 200,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                          }}
                        >
                          <TplComponent
                            data={
                              cardData.name
                                ? cardData
                                : {
                                    name: "Jane Wangari",
                                    title: "Marketing Manager",
                                    company: "Zuri Fintech",
                                    email: "jane@zurifintech.co.ke",
                                    phone: "+254 700 123 456",
                                    website: "zurifintech.co.ke",
                                  }
                            }
                            primaryColor={primaryColor}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium leading-tight ${
                          isSelected ? "text-ember-hover" : "text-text-body"
                        }`}
                      >
                        {tpl.name}
                      </span>
                      {tpl.popular && (
                        <span className="text-[9px] font-semibold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full leading-none -mt-0.5">
                          {lang === "sw" ? "Maarufu" : "Popular"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Color ── */}
            <section className="border-t border-border pt-5">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                {t(lang, "editor.color")}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    title={c}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ember"
                    style={{
                      backgroundColor: c,
                      borderColor: primaryColor === c ? "#111827" : "transparent",
                      boxShadow: primaryColor === c ? "0 0 0 1px #E5E7EB" : "none",
                    }}
                  />
                ))}
                {/* Custom color picker */}
                <label
                  className="relative w-7 h-7 rounded-full border border-border overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                  title={lang === "sw" ? "Rangi maalum" : "Custom color"}
                >
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background:
                        "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                    }}
                  />
                </label>
              </div>
            </section>

            {/* ── Download section (for mobile / alternative) ── */}
            <section className="border-t border-border pt-5">
              <button
                onClick={handleExportPdf}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 bg-ember hover:bg-ember-hover text-white"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading
                  ? t(lang, "editor.generating")
                  : downloadSuccess
                  ? t(lang, "editor.downloaded")
                  : (lang === "sw" ? "Pakua PDF" : "Download PDF")}
              </button>
            </section>
          </div>
        </div>

        {/* ── Right panel — preview ── */}
        <div className={`${mobileView === "preview" ? "flex" : "hidden"} md:flex flex-1 flex-col items-center justify-center overflow-auto p-3 md:p-10 bg-sand-2 gap-6`}>
          {/* Side label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {lang === "sw" ? "Mbele" : "Front"}
            </span>
          </div>

          {/* Card preview at actual size. previewRef itself is captured for the
              export, so the watermark is a sibling in a relative wrapper. */}
          <div style={{ position: "relative", width: 350, height: 200, flexShrink: 0 }}>
            <div
              ref={previewRef}
              style={{
                width: 350,
                height: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <ActiveTemplate data={cardData} primaryColor={primaryColor} />
            </div>
            <PreviewWatermark active={!isPremium} />
          </div>

          <p className="text-xs text-text-muted text-center max-w-xs leading-relaxed">
            {lang === "sw"
              ? "3.5″ × 2″ — ukubwa wa kawaida wa kadi ya biashara. Unachokiona ndicho utakachopata."
              : "3.5″ × 2″ — standard business card size. What you see is what you get."}
          </p>
        </div>
      </EditorShell>
    </>
  );
}
