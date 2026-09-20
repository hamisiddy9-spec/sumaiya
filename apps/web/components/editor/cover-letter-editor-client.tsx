"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Wand2, Sparkles, Target } from "lucide-react";
import { EditorShell } from "@/components/editor/editor-shell";
import type { CoverLetter } from "@/lib/db/schema";
import {
  COVER_LETTER_COMPONENTS,
  COVER_LETTER_TEMPLATES,
  type CoverLetterTemplateId,
} from "@/components/templates/cover-letter";
import { exportElementToPdf, sharePdf } from "@/lib/pdf";
import { FONT_SELECT_OPTIONS } from "@/lib/fonts";
import { t, type Lang } from "@/lib/i18n/translations";
import { SharedProfilePanel } from "@/components/editor/shared-profile-panel";
import { AiSuggestionModal, type RefineDirective } from "@/components/editor/ai-suggestion-modal";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { PreviewWatermark } from "@/components/editor/preview-watermark";

interface Props {
  initialDoc: CoverLetter;
  userId: string;
  accessToken?: string;
  isPremium?: boolean;
  lang?: Lang;
  guestMode?: boolean;
  initialSenderName?: string;
  initialSenderTitle?: string;
  backHref?: string;
}

const FONT_OPTIONS = FONT_SELECT_OPTIONS;

const COLOR_PRESETS = [
  "#DA4A1C", "#12433D", "#1e293b", "#7C3AED",
  "#059669", "#D97706", "#DC2626", "#DB2777",
];

function toTemplateId(raw: string): CoverLetterTemplateId {
  // Validate against the real registry so every cover-letter template (and the
  // kit handoff from a CV) is honoured — not just classic/modern.
  return raw && raw in COVER_LETTER_COMPONENTS
    ? (raw as CoverLetterTemplateId)
    : "classic";
}

export function CoverLetterEditorClient({ initialDoc, accessToken, isPremium: isPremiumProp = false, lang = "en", guestMode = false, initialSenderName = "", initialSenderTitle = "", backHref = "/dashboard" }: Props) {
  const isPremium = true; // payment temporarily disabled
  const [title, setTitle] = useState(initialDoc.title);
  const [content, setContent] = useState(initialDoc.content);
  const [jobTitle, setJobTitle] = useState(initialDoc.jobTitle ?? "");
  const [companyName, setCompanyName] = useState(initialDoc.companyName ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialDoc.primaryColor ?? "#1e293b");
  const [templateId, setTemplateId] = useState<CoverLetterTemplateId>(
    toTemplateId(initialDoc.templateId)
  );
  const [fontFamily, setFontFamily] = useState(initialDoc.fontFamily ?? "Georgia, serif");

  // Fields stored in localStorage (not in DB) to avoid schema change. Seeded
  // from the account so a fresh letter is signed with the real name, not a
  // "Your Name" placeholder.
  const [senderName, setSenderName] = useState(initialSenderName);
  const [senderTitle, setSenderTitle] = useState(initialSenderTitle);
  const [recipientName, setRecipientName] = useState("");
  const [recipientTitle, setRecipientTitle] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [jd, setJd] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const sw = lang === "sw";
  // Non-destructive AI: results land here for review before replacing the text.
  const [aiPreview, setAiPreview] = useState<{ subtitle: string; original: string; suggested: string; regenerate: () => void } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  // Responsive preview scale — fit the A4 page to the panel width instead of a
  // fixed 476px box that overflowed/clipped on phones. Caps at 0.6 (the original
  // desktop size) and floors at 0.28 so a hidden→visible tab switch (offsetWidth
  // briefly 0) can't leave the page at native 794px and cause horizontal scroll.
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

  // Restore localStorage-persisted fields after mount
  useEffect(() => {
    const id = initialDoc.id;
    const stored = (key: string) => localStorage.getItem(`cl-${key}-${id}`) ?? "";
    setFontFamily(stored("font") || "Georgia, serif");
    // Keep the account-seeded name unless the user has explicitly saved their own.
    setSenderName(stored("senderName") || initialSenderName);
    setSenderTitle(stored("senderTitle") || initialSenderTitle);
    setRecipientName(stored("recipientName"));
    setRecipientTitle(stored("recipientTitle"));
    setRecipientCompany(stored("recipientCompany"));
    // Guests persist the full draft (body/title/etc.) to localStorage — restore
    // it so a refresh doesn't lose the letter. Signed-in users get these from DB.
    if (guestMode) {
      const t = stored("title"); if (t) setTitle(t);
      const c = stored("content"); if (c) setContent(c);
      const jt = stored("jobTitle"); if (jt) setJobTitle(jt);
      const cn = stored("companyName"); if (cn) setCompanyName(cn);
      const pc = stored("primaryColor"); if (pc) setPrimaryColor(pc);
      const tpl = stored("templateId"); if (tpl) setTemplateId(toTemplateId(tpl));
    }
  }, [initialDoc.id, guestMode, initialSenderName, initialSenderTitle]);

  const persist = (key: string, value: string) =>
    localStorage.setItem(`cl-${key}-${initialDoc.id}`, value);

  const handleSave = useCallback(async (opts?: { keepalive?: boolean }) => {
    // Guests have no account to save to — they build + download; saving happens
    // after they sign in. Skipping avoids a 401 on every autosave.
    if (guestMode) return;
    setIsSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/cover-letter/${initialDoc.id}`, {
        method: "PATCH",
        headers: h,
        body: JSON.stringify({ title, content, jobTitle, companyName, primaryColor, templateId, fontFamily }),
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
  }, [guestMode, initialDoc.id, title, content, jobTitle, companyName, primaryColor, templateId, fontFamily, accessToken]);

  // Guests have no account to save to, so their whole draft (not just the
  // sender/recipient fields) is persisted to localStorage under this doc's id
  // ("guest"), so a refresh or accidental navigation never wipes the letter.
  const persistGuestDraft = useCallback(() => {
    try {
      const put = (k: string, v: string) => localStorage.setItem(`cl-${k}-${initialDoc.id}`, v);
      put("title", title);
      put("content", content);
      put("jobTitle", jobTitle);
      put("companyName", companyName);
      put("primaryColor", primaryColor);
      put("templateId", templateId);
      put("font", fontFamily);
    } catch {}
  }, [initialDoc.id, title, content, jobTitle, companyName, primaryColor, templateId, fontFamily]);

  // Keep refs to the latest save/persist so the unmount/unload flush always uses
  // the newest state without re-subscribing listeners.
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

  // Skip the mount run so simply opening the letter doesn't fire a needless
  // PATCH; only autosave on an actual edit.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    triggerAutoSave();
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [title, content, jobTitle, companyName, primaryColor, templateId, fontFamily]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush a pending save when leaving. On client-side unmount (Back to dashboard)
  // the cleanup only cleared the timer, dropping the last <800ms of edits; and
  // there was no page-unload handler at all. Now: if a save is pending, flush it
  // on unmount, and on real unload (tab close/reload/mobile hide) with keepalive
  // so the request survives the teardown.
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
      flush(false); // component unmount (client-side nav)
    };
  }, []);

  const handleEnhance = async (opts?: { content?: string; directive?: RefineDirective }) => {
    const base = opts?.content ?? content;
    if (!base.trim()) return;
    setIsEnhancing(true);
    try {
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/enhance", {
        method: "POST", headers: h,
        body: JSON.stringify({ section: "letter-body", content: base, jobTitle: jobTitle || undefined, company: companyName || undefined, directive: opts?.directive }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; data?: { enhanced: string }; error?: string };
      if (data.success && data.data?.enhanced) {
        setAiPreview({
          subtitle: sw ? "Nimeandika upya barua yako iwe wazi na yenye nguvu zaidi." : "I rewrote your letter to be clearer and more impactful.",
          original: base,
          suggested: data.data.enhanced,
          regenerate: () => handleEnhance(opts),
        });
      } else {
        setGenerateError(data.error || (sw ? "Imeshindwa sasa. Jaribu tena." : "Couldn't enhance right now. Please try again."));
      }
    } catch {
      setGenerateError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Tailor the existing letter to a specific job. Reuses the cover-letter
  // endpoint (which accepts a jobDescription) and the same preview-before-apply
  // modal as Generate/Enhance, so it stays truthful and never auto-overwrites.
  const handleTailorToJob = async () => {
    if (isTailoring || !content.trim() || !jd.trim()) return;
    setIsTailoring(true);
    setGenerateError("");
    try {
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST", headers: h,
        body: JSON.stringify({
          fullName: senderName || undefined,
          jobTitle: jobTitle || undefined,
          company: companyName || undefined,
          highlights: content.trim(),
          jobDescription: jd.trim(),
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { content?: string }; error?: string };
      if (!res.ok || !json.success || !json.data?.content) {
        setGenerateError(json.error || (sw ? "Imeshindwa kuboresha sasa. Jaribu tena." : "Couldn't tailor right now. Please try again."));
      } else {
        setAiPreview({
          subtitle: sw ? "Nimeiboresha barua hii iilenge kazi hii." : "I tailored your letter to this job.",
          original: content,
          suggested: json.data.content,
          regenerate: handleTailorToJob,
        });
      }
    } catch {
      setGenerateError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerateError("");
    try {
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST", headers: h,
        body: JSON.stringify({
          fullName: senderName || undefined,
          jobTitle: jobTitle || undefined,
          company: companyName || undefined,
          highlights: content.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { content?: string }; error?: string };
      if (!res.ok || !json.success || !json.data?.content) {
        setGenerateError(json.error || (sw ? "Imeshindwa kutengeneza rasimu sasa. Jaribu tena." : "Couldn't generate a draft right now. Please try again."));
      } else {
        setAiPreview({
          subtitle: sw ? "Nimetengeneza rasimu mpya kutokana na maelezo yako." : "I wrote a fresh draft from your details.",
          original: content,
          suggested: json.data.content,
          regenerate: handleGenerate,
        });
      }
    } catch {
      setGenerateError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Shared between download and share: the preview element, an ATS text layer,
  // and a filesystem-safe name. Returns null if the preview isn't mounted.
  const buildExport = () => {
    const el = document.getElementById("cl-preview");
    if (!el) return null;
    const textLayer = [
      senderName, senderTitle,
      "",
      today,
      "",
      [recipientName, recipientTitle].filter(Boolean).join(", "),
      recipientCompany || companyName,
      "",
      content,
    ].filter((l) => l !== undefined && l !== null).join("\n").trim();
    const safeName = (title || senderName || "Cover_Letter").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Cover_Letter";
    return { el, textLayer, safeName };
  };

  const logDownload = () => {
    const h2: Record<string, string> = {};
    if (accessToken) h2["Authorization"] = `Bearer ${accessToken}`;
    void fetch(`/api/cover-letter/${initialDoc.id}/download`, { method: "POST", headers: h2 });
  };

  const handleShare = async () => {
    const ex = buildExport();
    if (!ex) { setDownloadError(sw ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }
    setIsSharing(true);
    setDownloadError("");
    try {
      await sharePdf(ex.el, {
        filename: `${ex.safeName}.pdf`, textLayer: ex.textLayer,
        shareTitle: title || (sw ? "Barua yangu ya maombi" : "My cover letter"),
        shareText: sw ? "Barua yangu ya maombi — Sumaiya" : "My cover letter — made with Sumaiya",
      });
      logDownload();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setDownloadError(sw ? "Imeshindwa kushiriki. Tumia Pakua badala yake." : "Couldn't share. Try Download instead.");
        setTimeout(() => setDownloadError(""), 5000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsDownloading(true);
    setDownloadError("");
    try {
      const ex = buildExport();
      if (!ex) { setDownloadError(sw ? "Onyesho halijawa tayari — jaribu tena." : "Preview not ready — try again."); return; }
      await exportElementToPdf(ex.el, { filename: `${ex.safeName}.pdf`, textLayer: ex.textLayer });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
      logDownload();
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : (sw ? "Kupakua PDF kumeshindwa. Jaribu tena." : "PDF export failed. Try again."));
      setTimeout(() => setDownloadError(""), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const TemplateComponent = COVER_LETTER_COMPONENTS[templateId];

  const previewProps = {
    senderName: senderName || "Your Name",
    senderTitle: senderTitle || undefined,
    recipientName: recipientName || undefined,
    recipientTitle: recipientTitle || undefined,
    recipientCompany: recipientCompany || companyName || undefined,
    jobTitle: jobTitle || undefined,
    companyName: companyName || undefined,
    date: today,
    content: content || (sw
      ? "Barua yako itaonekana hapa.\n\nBonyeza “Niandikie” au anza kuandika."
      : "Your cover letter content will appear here.\n\nStart writing in the panel on the left."),
    primaryColor,
    fontFamily,
    lang,
  };

  return (
    <>
      <EditorShell
        lang={lang}
        backHref={backHref}
        title={title}
        onTitleChange={setTitle}
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
        {/* LEFT PANEL */}
        <div className={`${mobileView === "edit" ? "flex" : "hidden"} md:flex w-full md:w-[360px] bg-white border-r border-border flex-col overflow-hidden flex-shrink-0`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* Shared profile — pull your saved identity into the sender fields */}
            <div className="border border-border rounded-xl p-3">
              <SharedProfilePanel
                accessToken={accessToken}
                lang={lang}
                onProfileChange={(profile) => {
                  if (profile.fullName) { setSenderName(profile.fullName); persist("senderName", profile.fullName); }
                  if (profile.jobTitle) { setSenderTitle(profile.jobTitle); persist("senderTitle", profile.jobTitle); }
                }}
              />
            </div>

            {/* TEMPLATE — first, so people pick the look before writing */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{t(lang, "editor.template")}</p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {COVER_LETTER_TEMPLATES.map((tpl) => {
                  const Comp = COVER_LETTER_COMPONENTS[tpl.id];
                  const isActive = templateId === tpl.id;
                  const SCALE = 120 / 794;
                  return (
                    <button key={tpl.id} onClick={() => setTemplateId(tpl.id)} className="flex flex-col items-start gap-1.5 focus:outline-none flex-shrink-0">
                      <div className={`rounded-lg overflow-hidden border-2 transition-all ${isActive ? "border-ember shadow-md" : "border-border hover:border-text-muted"}`}
                        style={{ width: 120, height: Math.round(1123 * SCALE), position: "relative" }}>
                        <div style={{ width: 794, height: 1123, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0, pointerEvents: "none", userSelect: "none" }}>
                          <Comp {...previewProps} primaryColor={isActive ? primaryColor : tpl.previewColor} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isActive && <div className="w-2 h-2 rounded-full bg-ember flex-shrink-0" />}
                        <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-ember-hover" : "text-text-body"}`}>{tpl.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FROM */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{sw ? "Kutoka (wewe)" : "From (you)"}</p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Jina Lako" : "Your Name"}</label>
                  <input value={senderName} onChange={(e) => { setSenderName(e.target.value); persist("senderName", e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. Jane Mwangi" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Cheo Chako" : "Your Title / Position"}</label>
                  <input value={senderTitle} onChange={(e) => { setSenderTitle(e.target.value); persist("senderTitle", e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. Software Engineer" />
                </div>
              </div>
            </div>

            {/* TO */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">{sw ? "Kwenda (mpokeaji)" : "To (recipient)"}</p>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Jina la Mpokeaji" : "Recipient Name"}</label>
                  <input value={recipientName} onChange={(e) => { setRecipientName(e.target.value); persist("recipientName", e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. Mr. John Otieno" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Cheo cha Mpokeaji" : "Recipient Title"}</label>
                  <input value={recipientTitle} onChange={(e) => { setRecipientTitle(e.target.value); persist("recipientTitle", e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. HR Manager" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Kampuni" : "Company"}</label>
                  <input value={companyName} onChange={(e) => { setCompanyName(e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. Zuri Fintech" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">{sw ? "Nafasi unayoomba" : "Role you're applying for"}</label>
                  <input value={jobTitle} onChange={(e) => { setJobTitle(e.target.value); }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                    placeholder="e.g. Senior Developer" />
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{sw ? "Maudhui ya barua" : "Body"}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => void handleGenerate()} disabled={isGenerating}
                    className="flex items-center gap-1 text-xs text-ember-hover hover:text-ember disabled:opacity-50 transition font-medium">
                    <Sparkles className="w-3 h-3" /> {isGenerating ? (sw ? "Inatengeneza…" : "Generating…") : (sw ? "Niandikie" : "Write it for me")}
                  </button>
                  <button onClick={() => void handleEnhance()} disabled={isEnhancing || !content.trim()}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 transition font-medium">
                    <Wand2 className="w-3 h-3" /> {isEnhancing ? (sw ? "Inaboresha…" : "Enhancing…") : (sw ? "Boresha" : "Improve")}
                  </button>
                </div>
              </div>
              <AutoTextarea value={content} onChange={(e) => setContent(e.target.value)} rows={10}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent min-h-[220px]"
                placeholder={sw ? "Ninaomba nafasi ya kazi...\n\nAcha mstari mtupu kuanza aya mpya." : "I am writing to express my interest in the position...\n\nUse a blank line to start a new paragraph."} />
              {generateError && <p className="text-xs text-red-600 mt-1">{generateError}</p>}
              <p className="text-xs text-text-muted mt-1">
                {sw
                  ? "Mstari mtupu = aya mpya. “Niandikie” huandaa rasimu kutoka jina, nafasi na kampuni yako."
                  : "Blank line = new paragraph. \"Write it for me\" drafts from your name, role & company; add notes to the body to guide it."}
              </p>
              {sw && (
                <p className="text-[11px] text-text-muted/80 mt-1.5 flex items-start gap-1">
                  <span aria-hidden>💡</span>
                  <span>Barua huandikwa kwa Kiingereza — ndivyo waajiri wengi wanavyopendelea.</span>
                </p>
              )}
            </div>

            {/* TAILOR TO A JOB — give the cover letter the same JD-aware
                treatment the CV has. Rewrites the body to target a pasted job,
                truthfully, with preview-before-apply. */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-ember" />
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{sw ? "Lenga kazi maalum" : "Tailor to a job"}</p>
              </div>
              <AutoTextarea value={jd} onChange={(e) => setJd(e.target.value)} rows={4}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent"
                placeholder={sw ? "Bandika maelezo ya kazi hapa ili barua ilenge kazi hii…" : "Paste the job description here to target this letter to the role…"} />
              <button onClick={() => void handleTailorToJob()} disabled={isTailoring || !content.trim() || !jd.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-ember text-cream text-sm font-semibold py-2.5 rounded-lg disabled:opacity-50 transition hover:bg-ember-hover">
                <Target className="w-4 h-4" />
                {isTailoring ? (sw ? "Inaboresha…" : "Tailoring…") : (sw ? "Boresha kulenga kazi hii" : "Tailor to this job")}
              </button>
              {!content.trim() && (
                <p className="text-[11px] text-text-muted mt-1">{sw ? "Andika au tengeneza barua kwanza, kisha uiboreshe kulenga kazi." : "Write or generate the letter first, then tailor it to a job."}</p>
              )}
            </div>

            {/* COLOR + FONT */}
            <div className="border-t border-border pt-4 pb-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t(lang, "editor.color")}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} onClick={() => setPrimaryColor(c)}
                      aria-label={`${sw ? "Chagua rangi" : "Choose colour"} ${c}`}
                      aria-pressed={primaryColor === c}
                      title={c}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
                      style={{ backgroundColor: c, borderColor: primaryColor === c ? "#111827" : "transparent" }} />
                  ))}
                  <label className="relative w-6 h-6 rounded-full border border-border overflow-hidden cursor-pointer hover:scale-110 transition-transform" title={sw ? "Rangi maalum" : "Custom color"}>
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full h-full rounded-full" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{t(lang, "editor.font")}</p>
                <select value={fontFamily} onChange={(e) => { setFontFamily(e.target.value); persist("font", e.target.value); }}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember focus:border-transparent bg-white">
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — live preview */}
        <div ref={previewContainerRef} className={`${mobileView === "preview" ? "flex" : "hidden"} md:flex flex-1 overflow-auto bg-sand-2 items-start justify-center p-3 md:p-10`}>
          <div style={{ width: 794 * previewScale, height: 1123 * previewScale, position: "relative", flexShrink: 0 }}>
            <div className="shadow-[0_8px_40px_rgba(0,0,0,0.18)] rounded-sm overflow-hidden" style={{ width: 794 * previewScale, height: 1123 * previewScale, position: "relative" }}>
              <div id="cl-preview" style={{ width: 794, height: 1123, transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0, pointerEvents: "none", userSelect: "none" }}>
                <TemplateComponent {...previewProps} />
              </div>
              {/* Sibling of #cl-preview (the captured element) — marks the
                  on-screen preview, absent from the exported PDF. */}
              <PreviewWatermark active={!isPremium} />
            </div>
          </div>
        </div>
      </EditorShell>
      <AiSuggestionModal
        open={!!aiPreview}
        subtitle={aiPreview?.subtitle ?? ""}
        original={aiPreview?.original ?? ""}
        suggested={aiPreview?.suggested ?? ""}
        busy={isEnhancing || isGenerating}
        lang={lang}
        onApply={() => { if (aiPreview) { setContent(aiPreview.suggested); triggerAutoSave(); setMobileView("preview"); } setAiPreview(null); }}
        onRegenerate={() => aiPreview?.regenerate()}
        onRefine={(d) => aiPreview && handleEnhance({ content: aiPreview.suggested, directive: d })}
        onClose={() => setAiPreview(null)}
      />
    </>
  );
}
