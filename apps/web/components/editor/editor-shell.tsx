"use client";

// EditorShell — the one frame every document editor wears.
//
// Before this, the cover-letter / formal-letter / business-card editors each
// re-implemented the same top bar, save indicator and mobile Edit/Preview
// toggle with small drifts (different back icons, some showed a manual Save on
// mobile, inconsistent labels). That made switching document types feel like
// switching apps. This component owns the shared chrome so all of them look and
// behave as one; each editor supplies only its two-column body as children.

import Link from "next/link";
import { ChevronLeft, Download, Loader2, Save, Check, Share2 } from "lucide-react";
import { t, type Lang } from "@/lib/i18n/translations";

export interface EditorShellProps {
  lang: Lang;
  backHref: string;

  // Title (editable, lives in the top bar)
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder?: string;

  // Optional marker beside the title (e.g. a document-type pill/icon)
  docTypeMarker?: React.ReactNode;

  // Save state — saving is automatic; the manual button is a desktop affordance.
  saving: boolean;
  saved: boolean;
  saveError: boolean;
  onManualSave: () => void;

  // Mobile Edit/Preview segmented toggle
  mobileView: "edit" | "preview";
  onMobileViewChange: (view: "edit" | "preview") => void;

  // Primary actions (right cluster)
  onShare?: () => void;
  sharing?: boolean;
  onDownload: () => void;
  downloading?: boolean;
  downloadSuccess?: boolean;

  // Non-blocking error surfaced under the bar (e.g. a failed export)
  errorBanner?: string;

  // The editor's own two-column body (left form + right preview)
  children: React.ReactNode;
}

export function EditorShell({
  lang,
  backHref,
  title,
  onTitleChange,
  titlePlaceholder,
  docTypeMarker,
  saving,
  saved,
  saveError,
  onManualSave,
  mobileView,
  onMobileViewChange,
  onShare,
  sharing = false,
  onDownload,
  downloading = false,
  downloadSuccess = false,
  errorBanner,
  children,
}: EditorShellProps) {
  const sw = lang === "sw";

  return (
    <div className="flex flex-col h-dvh bg-sand-2 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="bg-espresso border-b border-espresso-line h-14 flex items-center px-4 gap-3 z-20 flex-shrink-0">
        <Link
          href={backHref}
          className="flex items-center gap-1 text-cream/60 hover:text-cream transition text-sm shrink-0"
          aria-label={t(lang, "editor.back")}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">{t(lang, "editor.back")}</span>
        </Link>
        <div className="h-5 w-px bg-espresso-line hidden sm:block" />

        {docTypeMarker}

        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="text-sm font-semibold text-cream border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-ember rounded px-1 py-0.5 min-w-0 flex-1 placeholder:text-cream/40"
          aria-label={sw ? "Kichwa cha hati" : "Document title"}
        />

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> {t(lang, "editor.saved")}
            </span>
          )}
          {saveError && !saving && (
            <span className="text-xs text-gold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" /> {sw ? "Haikuhifadhiwa" : "Not saved"}
            </span>
          )}

          {/* Saving is automatic (debounced + flushed on exit). The manual
              button is desktop-only; on mobile the compact spinner carries the
              reassurance without crowding the bar. */}
          <button
            onClick={onManualSave}
            disabled={saving}
            className="hidden sm:flex items-center gap-1.5 text-sm text-cream/70 hover:text-cream disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t(lang, "editor.saving") : t(lang, "editor.save")}
          </button>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-cream/60 sm:hidden" />}

          {onShare && (
            <button
              onClick={onShare}
              disabled={sharing || downloading}
              title={sw ? "Shiriki (WhatsApp, n.k.)" : "Share (WhatsApp, etc.)"}
              aria-label={sw ? "Shiriki" : "Share"}
              className="flex items-center gap-1.5 text-sm text-cream/70 hover:text-cream disabled:opacity-50 transition"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{sw ? "Shiriki" : "Share"}</span>
            </button>
          )}

          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60 bg-ember hover:bg-ember-hover text-white"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? t(lang, "editor.generating") : downloadSuccess ? t(lang, "editor.downloaded") : t(lang, "editor.download")}
          </button>
        </div>
      </div>

      {/* ── Non-blocking error (e.g. export failed) ── */}
      {errorBanner && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-sm text-red-700 flex-shrink-0">
          {errorBanner}
        </div>
      )}

      {/* ── Mobile Edit/Preview toggle ── */}
      <div className="md:hidden flex border-b border-border bg-white flex-shrink-0">
        <button
          onClick={() => onMobileViewChange("edit")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileView === "edit" ? "text-ember-hover border-b-2 border-ember" : "text-text-muted"}`}
        >
          {t(lang, "common.edit")}
        </button>
        <button
          onClick={() => onMobileViewChange("preview")}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${mobileView === "preview" ? "text-ember-hover border-b-2 border-ember" : "text-text-muted"}`}
        >
          {t(lang, "editor.preview")}
        </button>
      </div>

      {/* ── Body (editor-specific two columns) ── */}
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
