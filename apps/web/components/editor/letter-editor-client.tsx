"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { FileText, Wand2 } from "lucide-react";
import { EditorShell } from "@/components/editor/editor-shell";
import {
  LETTER_TEMPLATES,
  LETTER_TYPE_META,
  createEmptyLetterData,
  type LetterData,
  type LetterType,
  type LetterTemplateId,
} from "@/types";
import { LETTER_COMPONENTS } from "@/components/templates/letter";

// Guard against an unknown/legacy templateId (e.g. a pre-rename id in a stored
// doc): an unrecognised id would make LETTER_COMPONENTS[id] undefined and crash
// the whole editor with "Element type is invalid". Fall back to "formal", the
// same defensive pattern the CV and cover-letter editors already use.
function toLetterTemplateId(raw: unknown): LetterTemplateId {
  return typeof raw === "string" && raw in LETTER_COMPONENTS ? (raw as LetterTemplateId) : "formal";
}
import { exportElementToPdf, sharePdf } from "@/lib/pdf";
import { t, type Lang } from "@/lib/i18n/translations";
import { SharedProfilePanel } from "@/components/editor/shared-profile-panel";
import { AiSuggestionModal, type RefineDirective } from "@/components/editor/ai-suggestion-modal";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { PreviewWatermark } from "@/components/editor/preview-watermark";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialDoc: {
    id: string;
    title: string;
    letterType: string;
    templateId: string;
    primaryColor: string;
    data: Record<string, unknown>;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  userId: string;
  accessToken?: string;
  isPremium: boolean;
  lang?: Lang;
  guestMode?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_SWATCHES = [
  "#DA4A1C",
  "#12433D",
  "#1e293b",
  "#0D9488",
  "#7C3AED",
  "#D97706",
];

const CLOSING_OPTIONS_EN = [
  "Yours sincerely",
  "Yours faithfully",
  "Kind regards",
  "Best regards",
  "Warm regards",
];

const CLOSING_OPTIONS_SW = [
  "Wako mwaminifu",
  "Kwa heshima",
  "Wako mtiifu",
  "Salamu njema",
  "Ahsante",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function castLetterData(
  raw: Record<string, unknown>,
  letterType: LetterType
): LetterData {
  if (
    raw &&
    typeof raw === "object" &&
    typeof raw.body === "string" &&
    raw.from &&
    raw.to
  ) {
    return raw as unknown as LetterData;
  }
  return createEmptyLetterData(letterType);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-text-muted mb-1">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent bg-white"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LetterEditorClient({
  initialDoc,
  accessToken,
  isPremium: isPremiumProp,
  lang = "en",
  guestMode = false,
}: Props) {
  const isPremium = true; // payment temporarily disabled
  const letterType = initialDoc.letterType as LetterType;
  const typeMeta = LETTER_TYPE_META[letterType] ?? LETTER_TYPE_META.reference;

  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialDoc.title);
  const [templateId, setTemplateId] = useState<LetterTemplateId>(
    toLetterTemplateId(initialDoc.templateId)
  );
  const [primaryColor, setPrimaryColor] = useState(
    initialDoc.primaryColor || "#1e293b"
  );
  const [letterData, setLetterData] = useState<LetterData>(() =>
    castLetterData(initialDoc.data, letterType)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const sw = lang === "sw";
  const [aiPreview, setAiPreview] = useState<{ original: string; suggested: string } | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  // Responsive preview scale — fit the A4 page to the panel width instead of a
  // fixed 476px box that overflowed/clipped on phones. Caps at 0.6 (original
  // desktop size), floors at 0.28 against a briefly-zero offsetWidth on tab
  // switch.
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.6);
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(Math.max(0.28, Math.min(0.6, (el.offsetWidth - 32) / 794)));
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [mobileView]);

  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateFrom = useCallback(
    (field: keyof LetterData["from"], value: string) => {
      setLetterData((prev) => ({
        ...prev,
        from: { ...prev.from, [field]: value },
      }));
    },
    []
  );

  const updateTo = useCallback(
    (field: keyof LetterData["to"], value: string) => {
      setLetterData((prev) => ({
        ...prev,
        to: { ...prev.to, [field]: value },
      }));
    },
    []
  );

  const updateField = useCallback(
    <K extends keyof LetterData>(field: K, value: LetterData[K]) => {
      setLetterData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const doSave = useCallback(async (opts?: { keepalive?: boolean }) => {
    // Guests have no account to save to — they build + download; saving happens
    // after they sign in. Skipping avoids a 401 on every autosave.
    if (guestMode) return;
    setIsSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await fetch(`/api/documents/letter/${initialDoc.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          title,
          templateId,
          primaryColor,
          data: letterData,
        }),
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
  }, [guestMode, initialDoc.id, title, templateId, primaryColor, letterData, accessToken]);

  // Guests have no account to save to — persist the whole draft to localStorage
  // so a refresh or accidental navigation never wipes the letter.
  const GUEST_LETTER_KEY = "sumaiya-guest-letter";
  const persistGuestDraft = useCallback(() => {
    try {
      localStorage.setItem(GUEST_LETTER_KEY, JSON.stringify({ title, templateId, primaryColor, data: letterData }));
    } catch {}
  }, [title, templateId, primaryColor, letterData]);

  // Refs to the latest save/persist so the unmount/unload flush uses current state.
  const doSaveRef = useRef(doSave);
  doSaveRef.current = doSave;
  const persistGuestDraftRef = useRef(persistGuestDraft);
  persistGuestDraftRef.current = persistGuestDraft;

  const triggerAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      autoSaveRef.current = undefined;
      if (guestMode) persistGuestDraft();
      else void doSave();
    }, 800);
  }, [guestMode, doSave, persistGuestDraft]);

  // Trigger auto-save whenever anything changes — but skip the mount run so
  // simply opening the letter doesn't fire a needless PATCH.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    triggerAutoSave();
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [title, templateId, primaryColor, letterData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush a pending save when leaving: on client-side unmount (the cleanup above
  // only cleared the timer, dropping the last <800ms of edits) and on real page
  // unload (tab close/reload/mobile hide) with keepalive so it survives teardown.
  useEffect(() => {
    const flush = (keepalive: boolean) => {
      if (!autoSaveRef.current) return;
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = undefined;
      if (guestMode) persistGuestDraftRef.current();
      else void doSaveRef.current({ keepalive });
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

  // Restore a guest's persisted draft on mount so a refresh doesn't lose it.
  useEffect(() => {
    if (!guestMode) return;
    try {
      const raw = localStorage.getItem(GUEST_LETTER_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { title?: string; templateId?: string; primaryColor?: string; data?: unknown };
      if (d.title) setTitle(d.title);
      if (d.templateId) setTemplateId(toLetterTemplateId(d.templateId));
      if (d.primaryColor) setPrimaryColor(d.primaryColor);
      if (d.data) setLetterData(castLetterData(d.data as Record<string, unknown>, letterType));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── AI Enhance ─────────────────────────────────────────────────────────────

  const handleEnhance = async (opts?: { content?: string; directive?: RefineDirective }) => {
    const base = opts?.content ?? letterData.body;
    if (!base.trim()) return;
    setIsEnhancing(true);
    setEnhanceError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers,
        body: JSON.stringify({
          section: "letter-body",
          content: base,
          jobTitle: letterData.subject || undefined,
          directive: opts?.directive,
        }),
      });
      const result = await res.json().catch(() => ({})) as { success?: boolean; data?: { enhanced: string }; error?: string };
      if (result.success && result.data?.enhanced) {
        setAiPreview({ original: base, suggested: result.data.enhanced });
      } else {
        setEnhanceError(result.error || (sw ? "Sikuweza sasa. Jaribu tena." : "Couldn't enhance right now. Please try again."));
      }
    } catch {
      setEnhanceError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // ── PDF export ─────────────────────────────────────────────────────────────

  // Shared by download + share: preview element, ATS text layer, safe filename.
  const buildExport = () => {
    const el = document.getElementById("letter-preview");
    if (!el) return null;
    const { from, to } = letterData;
    const textLayer = [
      [from.name, from.title].filter(Boolean).join(", "),
      from.company, from.address, from.email,
      "",
      letterData.date,
      "",
      [to.name, to.title].filter(Boolean).join(", "),
      to.company,
      "",
      letterData.subject,
      "",
      letterData.body,
      "",
      letterData.closing,
      from.name,
    ].filter((l) => l !== undefined && l !== null && l !== "").join("\n").trim();
    const safeName = (title || from.name || "Letter").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Letter";
    return { el, textLayer, safeName };
  };

  const handleShare = async () => {
    const ex = buildExport();
    if (!ex) { setDownloadError(sw ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }
    setIsSharing(true);
    setDownloadError("");
    try {
      await sharePdf(ex.el, {
        filename: `${ex.safeName}.pdf`, textLayer: ex.textLayer,
        shareTitle: title || (sw ? "Barua yangu" : "My letter"),
        shareText: sw ? "Barua yangu — Sumaiya" : "My letter — made with Sumaiya",
      });
      try { await fetch(`/api/documents/letter/${initialDoc.id}/download`, { method: "POST" }); } catch {}
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setDownloadError(sw ? "Sikuweza kushiriki. Tumia Pakua badala yake." : "Couldn't share. Try Download instead.");
        setTimeout(() => setDownloadError(""), 5000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsDownloading(true);
    setDownloadDone(false);
    setDownloadError("");
    try {
      const ex = buildExport();
      if (!ex) { setDownloadError(sw ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }
      await exportElementToPdf(ex.el, { filename: `${ex.safeName}.pdf`, textLayer: ex.textLayer });
      try {
        await fetch(`/api/documents/letter/${initialDoc.id}/download`, { method: "POST" });
      } catch {}
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : (sw ? "Sikuweza kupakua PDF. Jaribu tena." : "PDF export failed. Try again."));
      setTimeout(() => setDownloadError(""), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const TemplateComponent = LETTER_COMPONENTS[templateId] ?? LETTER_COMPONENTS.formal;

  return (
    <>
      <EditorShell
        lang={lang}
        backHref="/dashboard"
        title={title}
        onTitleChange={setTitle}
        docTypeMarker={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-espresso-2 text-xs font-medium text-cream/70 shrink-0">
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">{typeMeta.label}</span>
          </span>
        }
        saving={isSaving}
        saved={saved}
        saveError={saveError}
        onManualSave={() => void doSave()}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        onShare={() => void handleShare()}
        sharing={isSharing}
        onDownload={() => void handleExportPdf()}
        downloading={isDownloading}
        downloadSuccess={downloadDone}
        errorBanner={downloadError}
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className={`${mobileView === "edit" ? "flex" : "hidden"} md:flex w-full md:w-[380px] bg-white border-r border-border flex-col overflow-hidden flex-shrink-0`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">

            {/* Shared profile — pull your saved identity into the sender block */}
            <div className="border border-border rounded-xl p-3">
              <SharedProfilePanel
                accessToken={accessToken}
                lang={lang}
                onProfileChange={(profile) => {
                  if (profile.fullName) updateFrom("name", profile.fullName);
                  if (profile.jobTitle) updateFrom("title", profile.jobTitle);
                  if (profile.email) updateFrom("email", profile.email);
                  if (profile.phone) updateFrom("phone", profile.phone);
                  if (profile.location) updateFrom("address", profile.location);
                }}
              />
            </div>

            {/* FROM */}
            <div>
              <SectionLabel>{sw ? "Kutoka (wewe)" : "From"}</SectionLabel>
              <div className="space-y-2">
                <div>
                  <FieldLabel>{sw ? "Jina Kamili" : "Full Name"}</FieldLabel>
                  <TextInput
                    value={letterData.from.name}
                    onChange={(v) => updateFrom("name", v)}
                    placeholder={sw ? "mf. Jane Mwangi" : "e.g. Jane Mwangi"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Cheo" : "Title / Position"}</FieldLabel>
                  <TextInput
                    value={letterData.from.title ?? ""}
                    onChange={(v) => updateFrom("title", v)}
                    placeholder={sw ? "mf. Meneja Mkuu" : "e.g. Senior Manager"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Kampuni / Shirika" : "Company / Organisation"}</FieldLabel>
                  <TextInput
                    value={letterData.from.company ?? ""}
                    onChange={(v) => updateFrom("company", v)}
                    placeholder={sw ? "mf. Acme Ltd" : "e.g. Acme Ltd"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Anwani" : "Address"}</FieldLabel>
                  <TextInput
                    value={letterData.from.address ?? ""}
                    onChange={(v) => updateFrom("address", v)}
                    placeholder={sw ? "mf. S.L.P. 1234, Nairobi" : "e.g. P.O. Box 1234, Nairobi"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Barua pepe" : "Email"}</FieldLabel>
                  <TextInput
                    value={letterData.from.email ?? ""}
                    onChange={(v) => updateFrom("email", v)}
                    placeholder={sw ? "mf. jane@example.com" : "e.g. jane@example.com"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Simu" : "Phone"}</FieldLabel>
                  <TextInput
                    value={letterData.from.phone ?? ""}
                    onChange={(v) => updateFrom("phone", v)}
                    placeholder={sw ? "mf. +254 700 000 000" : "e.g. +254 700 000 000"}
                  />
                </div>
              </div>
            </div>

            {/* TO */}
            <div className="border-t border-border pt-5">
              <SectionLabel>{sw ? "Kwenda (mpokeaji)" : "To"}</SectionLabel>
              <div className="space-y-2">
                <div>
                  <FieldLabel>{sw ? "Jina la Mpokeaji" : "Recipient Name"}</FieldLabel>
                  <TextInput
                    value={letterData.to.name}
                    onChange={(v) => updateTo("name", v)}
                    placeholder={sw ? "mf. Bw. John Otieno" : "e.g. Mr. John Otieno"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Cheo" : "Title / Position"}</FieldLabel>
                  <TextInput
                    value={letterData.to.title ?? ""}
                    onChange={(v) => updateTo("title", v)}
                    placeholder={sw ? "mf. Meneja wa Rasilimali Watu" : "e.g. Human Resources Manager"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Kampuni / Shirika" : "Company / Organisation"}</FieldLabel>
                  <TextInput
                    value={letterData.to.company ?? ""}
                    onChange={(v) => updateTo("company", v)}
                    placeholder={sw ? "mf. Zuri Fintech" : "e.g. Zuri Fintech"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Anwani" : "Address"}</FieldLabel>
                  <TextInput
                    value={letterData.to.address ?? ""}
                    onChange={(v) => updateTo("address", v)}
                    placeholder={sw ? "mf. Westlands, Nairobi" : "e.g. Westlands, Nairobi"}
                  />
                </div>
              </div>
            </div>

            {/* LETTER DETAILS */}
            <div className="border-t border-border pt-5">
              <SectionLabel>{sw ? "Maelezo ya Barua" : "Letter Details"}</SectionLabel>
              <div className="space-y-2">
                <div>
                  <FieldLabel>{sw ? "Tarehe" : "Date"}</FieldLabel>
                  <TextInput
                    value={letterData.date}
                    onChange={(v) => updateField("date", v)}
                    placeholder={sw ? "mf. 19 Juni 2026" : "e.g. 19 June 2026"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Mada" : "Subject"}</FieldLabel>
                  <TextInput
                    value={letterData.subject}
                    onChange={(v) => updateField("subject", v)}
                    placeholder={sw ? "mf. Barua ya Rejea kwa James Kariuki" : "e.g. Letter of Reference for James Kariuki"}
                  />
                </div>
                <div>
                  <FieldLabel>{sw ? "Kimalizio" : "Closing"}</FieldLabel>
                  <select
                    value={letterData.closing}
                    onChange={(e) => updateField("closing", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent bg-white"
                  >
                    {Array.from(new Set([
                      // Keep whatever the letter already has selectable, then the
                      // language-appropriate options (Swahili sign-offs in sw).
                      letterData.closing,
                      ...(sw ? CLOSING_OPTIONS_SW : CLOSING_OPTIONS_EN),
                    ])).filter(Boolean).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="border-t border-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {sw ? "Maudhui ya barua" : "Body"}
                </p>
                <button
                  onClick={() => void handleEnhance()}
                  disabled={isEnhancing || !letterData.body.trim()}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 transition font-medium"
                >
                  <Wand2 className="w-3 h-3" /> {isEnhancing ? (sw ? "Ninaboresha…" : "Enhancing…") : (sw ? "Boresha" : "Improve")}
                </button>
              </div>
              {enhanceError && <p className="text-[11px] text-red-600 mb-1.5">{enhanceError}</p>}
              <AutoTextarea
                value={letterData.body}
                onChange={(e) => updateField("body", e.target.value)}
                rows={8}
                placeholder={sw ? "Andika barua yako hapa... Tumia mistari mitupu kutenganisha aya." : "Write your letter here... Use blank lines to separate paragraphs."}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent min-h-[180px]"
              />
              <p className="text-xs text-text-muted mt-1">
                {sw ? "Tenganisha aya kwa mstari mtupu." : "Separate paragraphs with a blank line."}
              </p>
            </div>

            {/* TEMPLATE */}
            <div className="border-t border-border pt-5">
              <SectionLabel>{t(lang, "editor.template")}</SectionLabel>
              <div className="flex gap-3">
                {LETTER_TEMPLATES.map((tpl) => {
                  const Comp = LETTER_COMPONENTS[tpl.id];
                  const isActive = templateId === tpl.id;

                  // Preview data: use live data or a minimal stub
                  const previewData: LetterData = {
                    ...letterData,
                    from: {
                      ...letterData.from,
                      name: letterData.from.name || "Jane Mwangi",
                      title: letterData.from.title || "Senior Manager",
                      company: letterData.from.company || "Acme Ltd",
                    },
                    to: {
                      ...letterData.to,
                      name: letterData.to.name || "John Otieno",
                      title: letterData.to.title || "HR Manager",
                      company: letterData.to.company || "Zuri Fintech",
                    },
                    subject: letterData.subject || "Letter of Reference",
                    body:
                      letterData.body ||
                      "I am pleased to recommend this candidate for the position.\n\nThey have demonstrated exceptional skills and professionalism throughout their tenure.",
                  };

                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setTemplateId(tpl.id)}
                      className={`flex flex-col items-start gap-1.5 group focus:outline-none`}
                    >
                      {/* Scaled preview */}
                      <div
                        className={`rounded-lg overflow-hidden border-2 transition-all ${
                          isActive
                            ? "border-ember shadow-md"
                            : "border-border hover:border-text-muted"
                        }`}
                        style={{ width: 159, height: 225, position: "relative" }}
                      >
                        <div
                          style={{
                            width: 794,
                            height: 1123,
                            transform: "scale(0.2)",
                            transformOrigin: "top left",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                            userSelect: "none",
                          }}
                        >
                          <Comp
                            data={previewData}
                            primaryColor={
                              isActive ? primaryColor : tpl.previewColor
                            }
                          />
                        </div>
                      </div>
                      {/* Label */}
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-ember flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isActive ? "text-ember-hover" : "text-text-body"
                          }`}
                        >
                          {tpl.name}
                        </span>
                        {tpl.popular && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            {sw ? "Maarufu" : "Popular"}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLOR */}
            <div className="border-t border-border pt-5 pb-4">
              <SectionLabel>{t(lang, "editor.color")}</SectionLabel>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ember"
                    style={{
                      backgroundColor: c,
                      borderColor:
                        primaryColor === c ? "#111827" : "transparent",
                    }}
                    aria-label={`${sw ? "Chagua rangi" : "Choose colour"} ${c}`}
                    aria-pressed={primaryColor === c}
                    title={c}
                  />
                ))}
                {/* Custom color picker */}
                <label
                  className="relative w-7 h-7 rounded-full border border-border overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                  title={sw ? "Rangi maalum" : "Custom color"}
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
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — live preview ──────────────────────────────────── */}
        <div ref={previewContainerRef} className={`${mobileView === "preview" ? "flex" : "hidden"} md:flex flex-1 overflow-auto bg-sand-2 items-start justify-center p-3 md:p-10`}>
          {/* Page shadow wrapper */}
          <div
            style={{
              width: 794 * previewScale,
              height: 1123 * previewScale,
              position: "relative",
              flexShrink: 0,
            }}
          >
            {/* Outer shadow card */}
            <div
              className="shadow-[0_8px_40px_rgba(0,0,0,0.18)] rounded-sm overflow-hidden"
              style={{ width: 794 * previewScale, height: 1123 * previewScale, position: "relative" }}
            >
              {/* Scale container — clips at exact A4 bounds */}
              <div
                style={{
                  width: 794,
                  height: 1123,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <div id="letter-preview">
                  <TemplateComponent
                    data={letterData}
                    primaryColor={primaryColor}
                  />
                </div>
              </div>
              {/* Sibling of the captured #letter-preview — screen only. */}
              <PreviewWatermark active={!isPremium} />
            </div>
          </div>
        </div>
      </EditorShell>

      <AiSuggestionModal
        open={!!aiPreview}
        subtitle={sw ? "Nimeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "I rewrote your letter to be clearer and more impactful."}
        original={aiPreview?.original ?? ""}
        suggested={aiPreview?.suggested ?? ""}
        busy={isEnhancing}
        lang={lang}
        onApply={() => { if (aiPreview) { const v = aiPreview.suggested; setLetterData((prev) => ({ ...prev, body: v })); setMobileView("preview"); } setAiPreview(null); }}
        onRegenerate={() => void handleEnhance()}
        onRefine={(d) => { if (aiPreview) void handleEnhance({ content: aiPreview.suggested, directive: d }); }}
        onClose={() => setAiPreview(null)}
      />
    </>
  );
}
