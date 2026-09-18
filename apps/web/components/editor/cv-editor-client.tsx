"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ChevronDown, Download, Loader2, Save, Palette,
  Plus, Trash2, GripVertical, Wand2, Check, Eye, EyeOff, Mail, X,
  FileText, User, Briefcase, GraduationCap, Zap, MoreHorizontal,
  LayoutGrid, Type, Sparkles, PartyPopper, AlertTriangle, History, RotateCcw, type LucideIcon,
} from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "@/lib/stores/editor-store";
import { TEMPLATE_COMPONENTS } from "@/components/templates/registry";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { TEMPLATES, CURATED_CV_TEMPLATES, DEFAULT_SECTION_ORDER, isTemplateId, isPremiumTemplate, parseCVData, type TemplateId, type CVData } from "@/types";
import { SECTION_TEMPLATES } from "@/lib/data/samples";
import { ENGINE_PRESETS } from "@/components/templates/engine/presets";
import { AtsPanel } from "@/components/editor/ats-panel";
import { WhatChanged } from "@/components/editor/what-changed";
import { AtsExplain } from "@/components/editor/ats-explain";
import { AuthenticWritingPanel } from "@/components/editor/authentic-writing-panel";
import { JobTargetPanel } from "@/components/editor/job-target-panel";
import { matchCvToJd } from "@/lib/job-match";
import { SharedProfilePanel } from "@/components/editor/shared-profile-panel";
import { ConfirmationsCard, type PendingConfirmation } from "@/components/assistant/confirmations-card";
import { CrossSellBanner } from "@/components/editor/cross-sell-banner";
import { EditorProfileMenu } from "@/components/editor/editor-profile-menu";
import type { CV } from "@/lib/db/schema";
import { t, type Lang } from "@/lib/i18n/translations";
import { MARKETPLACE_ENABLED } from "@/lib/flags";
import confetti from "canvas-confetti";
import { track, identify, type ExportSource } from "@/lib/analytics";
import posthog from "@/lib/analytics";
import { renderElementToPdfBlob, exportCvToText, buildCvText, triggerBlobDownload } from "@/lib/pdf";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Icon } from "@/components/ui/icon";
import { PremiumTemplateModal } from "@/components/premium-template-modal";
import { usePremium } from "@/lib/use-premium";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";
import { haptics } from "@/lib/haptics";
import { Share2, FileType2, Globe } from "lucide-react";
import { ShareCvModal } from "@/components/editor/share-cv-modal";
import { metaTrack } from "@/components/meta-pixel";
import { getPairingTip, getFamilyForCv, getCoverLetterForCv } from "@/lib/template-families";
import { DOC_FONTS, INTER_STACK, resolveFontStack } from "@/lib/fonts";
import { TemplateCanvas } from "@/components/templates/template-canvas";
import { getSampleCV } from "@/lib/sample-cv";
import { PreviewWatermark } from "@/components/editor/preview-watermark";
import { Button } from "@/components/ui/button";
import { label } from "@/lib/i18n/labels";

// ─── Helper components ────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Guest sign-up copy ────────────────────────────────────────────────────────
// The account prompt does TWO different jobs and they need different words:
//  - "account": the visitor is reaching for something that genuinely needs an
//    account (save online, version history) — here the prompt IS the gate.
//  - "postExport": a guest has ALREADY downloaded their file — here the prompt
//    is an offer to carry it to another device, never a demand before delivery.
// Both variants live side by side on purpose: the wording gets tuned in ONE
// place instead of being scattered through the render tree.
type SignUpIntent = "account" | "postExport";

const SIGN_UP_COPY: Record<SignUpIntent, {
  titleEn: string; titleSw: string;
  bodyEn: string; bodySw: string;
  sentNoteEn: string; sentNoteSw: string;
}> = {
  account: {
    titleEn: "Save your CV online",
    titleSw: "Hifadhi CV yako mtandaoni",
    bodyEn: "Create a free account to keep it safe, restore earlier versions and open it on another device.",
    bodySw: "Fungua akaunti bila malipo ili kuihifadhi, kurudisha matoleo ya awali na kuifungua kwenye kifaa kingine.",
    sentNoteEn: "Your CV will be saved automatically.",
    sentNoteSw: "CV yako itahifadhiwa kiotomatiki.",
  },
  postExport: {
    titleEn: "Open it on your phone too?",
    titleSw: "Kuifungua kwenye simu yako pia?",
    bodyEn: "Your CV is saved on this device — sign in to open it on your phone.",
    bodySw: "CV yako imehifadhiwa kwenye kifaa hiki — ingia ili kuifungua kwenye simu yako.",
    sentNoteEn: "Your file is already on this device — the link opens it on your other devices.",
    sentNoteSw: "Faili lako lipo tayari kwenye kifaa hiki — kiungo hiki kitaifungua kwenye vifaa vyako vingine.",
  },
};

function SignUpModal({ onClose, sw, intent = "account" }: { onClose: () => void; sw: boolean; intent?: SignUpIntent }) {
  const copy = SIGN_UP_COPY[intent];
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"options" | "sent">("options");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const saveGuestAndGetCallback = () => {
    const s = useEditorStore.getState();
    localStorage.setItem("sumaiya-guest-cv", JSON.stringify({
      cv: s.cv, title: s.title, templateId: s.templateId,
      primaryColor: s.primaryColor, fontFamily: s.fontFamily,
      // This modal is opened from a Download action, so record the intent: after
      // sign-up + migration the editor auto-resumes the download, instead of
      // dropping the user back in the editor with no file (they came to get one).
      downloadIntent: "pdf",
    }));
    return `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/migrate-guest")}`;
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    posthog.capture('sign_in_triggered', { source: 'guest_editor', method: 'google' });
    const callbackURL = saveGuestAndGetCallback();
    await signIn.social({ provider: "google", callbackURL });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true); setError("");
    posthog.capture('sign_in_triggered', { source: 'guest_editor', method: 'email' });
    const callbackURL = saveGuestAndGetCallback();
    const result = await signIn.magicLink({ email, callbackURL });
    setIsLoading(false);
    if (result.error) {
      // Map known Supabase auth error codes to LOCALIZED messages — the raw
      // SDK string (e.g. "Email rate limit exceeded.") must never appear in
      // the Swahili modal.
      setError(authErrorMessage(result.error.code, sw, result.error.message));
    } else {
      setStep("sent");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-card-lg shadow-floating w-full max-w-md p-8 relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <button onClick={onClose} aria-label={label(sw, "close")} className="absolute top-4 right-4 text-text-muted hover:text-espresso transition p-1.5 -m-1.5">
          <Icon name="chevron-right" className="rotate-45" size={16} />
        </button>
        {step === "sent" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-ember-tint rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="mail" className="text-ember" size={24} />
            </div>
            <h2 className="text-xl font-bold text-espresso mb-2">{sw ? "Angalia kikasha chako" : "Check your inbox"}</h2>
            <p className="text-text-muted text-sm">
              {sw
                ? <>Tumetuma kiungo cha kuingia kwa <strong>{email}</strong>. {copy.sentNoteSw}</>
                : <>We sent a sign-in link to <strong>{email}</strong>. {copy.sentNoteEn}</>}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-ember-tint rounded-card flex items-center justify-center mx-auto mb-3">
                <Icon name={intent === "postExport" ? "check" : "download"} className="text-ember" size={20} />
              </div>
              <h2 className="text-xl font-bold text-espresso mb-1">{sw ? copy.titleSw : copy.titleEn}</h2>
              <p className="text-text-muted text-sm">{sw ? copy.bodySw : copy.bodyEn}</p>
            </div>
            <button onClick={handleGoogle} disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-border hover:bg-cream text-text-body font-medium py-3 rounded-input transition mb-4 disabled:opacity-60">
              <GoogleIcon className="w-5 h-5" /> {sw ? "Endelea na Google" : "Continue with Google"}
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">{sw ? "au tumia barua pepe" : "or use email"}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <form onSubmit={handleEmail} className="space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-border-input rounded-input text-sm focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2" />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {sw ? "Endelea na barua pepe" : "Continue with email"}
              </Button>
            </form>
            <p className="text-center text-xs text-text-muted mt-4">
              {sw ? "Una akaunti tayari?" : "Already have an account?"}{" "}
              <a href={`/sign-in?callbackUrl=${encodeURIComponent("/migrate-guest")}`}
                onClick={() => {
                  posthog.capture('sign_in_triggered', { source: 'guest_editor', method: 'link' });
                  saveGuestAndGetCallback();
                }} className="text-ember-hover hover:underline">{sw ? "Ingia" : "Sign in"}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose, sw }: { onClose: () => void; sw: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-card-lg shadow-floating w-full max-w-sm p-8 relative text-center max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <button onClick={onClose} aria-label={label(sw, "close")} className="absolute top-4 right-4 text-text-muted hover:text-espresso transition p-1.5 -m-1.5">
          <Icon name="chevron-right" className="rotate-45" size={16} />
        </button>
        <div className="w-14 h-14 bg-gradient-to-br from-ember to-purple-glow rounded-card flex items-center justify-center mx-auto mb-4">
          <Icon name="download" className="text-cream" size={22} />
        </div>
        <h2 className="text-xl font-bold text-espresso mb-2">{sw ? "Boresha ili kupakua" : "Upgrade to download"}</h2>
        <p className="text-text-muted text-sm mb-6">{sw ? "Pata upakuaji wa PDF bila kikomo, miundo yote, na maboresho ya AI." : "Get unlimited PDF downloads, every look, and AI-powered enhancements."}</p>
        <ul className="text-left space-y-2 mb-6">
          {(sw
            ? ["Upakuaji wa PDF bila kikomo", "Miundo yote ya kitaalamu", "Uboreshaji wa maudhui kwa AI", "Zana za kuboresha ATS"]
            : ["Unlimited PDF downloads", "Every professional look", "AI content enhancement", "ATS optimization tools"]
          ).map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-text-body">
              <Icon name="check" className="text-pine" size={16} />
              {f}
            </li>
          ))}
        </ul>
        <Button href="/pricing" className="w-full mb-3" size="lg">
          {sw ? "Angalia mipango — kuanzia $2.90" : "See plans — from $2.90"}
        </Button>
        <button onClick={onClose} className="text-sm text-text-muted hover:text-espresso transition">
          {sw ? "Labda baadaye" : "Maybe later"}
        </button>
      </div>
    </div>
  );
}

function SortableCard({ id, children }: { id: string; children: (drag: React.HTMLAttributes<HTMLElement>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

function AnimatedScoreBar({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setDisplayed(score), 150);
    return () => clearTimeout(id);
  }, [score]);
  return (
    <div className="w-full h-2 bg-cream/15 rounded-full overflow-hidden">
      <div className="h-full rounded-full"
        style={{ width: `${displayed}%`, backgroundColor: color, transition: "width 550ms cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function AccordionPanel({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 300ms cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Input enforcers ──────────────────────────────────────────────────────────

// YYYY-MM — auto-inserts hyphen, blocks non-digits, caps at 7 chars
function enforceDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length > 4) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return digits;
}

// Phone — allows digits, +, -, spaces, brackets, dots only
function enforcePhone(raw: string): string {
  return raw.replace(/[^\d\s+\-(). ]/g, "").slice(0, 20);
}

// URL — strips leading/trailing whitespace and common typos
function enforceUrl(raw: string): string {
  const v = raw.trim();
  // If user typed something that looks like a domain without a protocol, add https://
  if (v && !v.startsWith("http") && !v.startsWith("/") && v.includes(".")) {
    return `https://${v}`;
  }
  return v;
}

// Validate helpers — return true if value is valid or empty
function isValidDate(v: string) { return v === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v); }
function isValidEmail(v: string) { return v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidUrl(v: string) { return v === "" || /^https?:\/\/.+\..+/.test(v); }

// Shared input class builder — adds red ring when invalid
function inputCls(base: string, invalid: boolean) {
  return `${base} ${invalid ? "border-red-300 shadow-[0_0_0_1px_#FCA5A5] focus:shadow-[0_0_0_3px_#FCA5A5,0_0_0_1px_#EF4444]" : "border-border-input focus:shadow-focus-ember"}`;
}

const BASE_INPUT_SM = "w-full px-2.5 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2";
const BASE_INPUT_MD = "w-full px-3 py-2 text-sm border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2";

// ─── Reusable DateInput ────────────────────────────────────────────────────────
function DateInput({ value, onChange, className, placeholder = "YYYY-MM" }: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string;
}) {
  const invalid = !isValidDate(value) && value.length > 0;
  return (
    <div className="relative">
      <input
        value={value}
        maxLength={7}
        placeholder={placeholder}
        inputMode="numeric"
        onChange={(e) => onChange(enforceDateInput(e.target.value))}
        className={inputCls(className ?? BASE_INPUT_SM, invalid)}
      />
      {invalid && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-red-500 font-medium pointer-events-none">
          YYYY-MM
        </span>
      )}
    </div>
  );
}

const EXPORT_STEPS: Array<{ label: string; Icon: LucideIcon; color: string; bg: string }> = [
  { label: "Preparing layout",  Icon: LayoutGrid, color: "#6366F1", bg: "#EEF2FF" },
  { label: "Rendering fonts",   Icon: Type,       color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "Generating PDF",    Icon: FileText,   color: "#0891B2", bg: "#ECFEFF" },
  { label: "Finalising",        Icon: Sparkles,   color: "#059669", bg: "#ECFDF5" },
];

function ExportOverlay({ state, stepIdx, onClose, onRetry, name, sw, onGenerateCoverLetter, onTrackApplication, onShareOnline, nextBusy }: {
  state: "exporting" | "success" | "error";
  stepIdx: number;
  onClose: () => void;
  onRetry: () => void;
  name?: string;
  sw?: boolean;
  onGenerateCoverLetter?: () => void;
  onTrackApplication?: () => void;
  onShareOnline?: () => void;
  nextBusy?: null | "cover" | "track";
}) {
  const pct = Math.round(((stepIdx + 1) / EXPORT_STEPS.length) * 100);
  const current = EXPORT_STEPS[Math.min(stepIdx, EXPORT_STEPS.length - 1)];
  const stepLabel = (en: string) => !sw ? en : (({ "Preparing layout": "Inaandaa muundo", "Rendering fonts": "Inapakia fonti", "Generating PDF": "Inatengeneza PDF", "Finalising": "Inakamilisha" } as Record<string, string>)[en] ?? en);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[3px] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-[320px] p-8 text-center max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {state === "exporting" && (
          <>
            {/* Animated icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500"
              style={{ backgroundColor: current.bg }}>
              <current.Icon className="w-8 h-8 animate-bounce" style={{ color: current.color }} />
            </div>
            <p className="text-sm font-bold text-espresso mb-0.5">
              {name ? (sw ? `Inatengeneza CV ya ${name.split(" ")[0]}` : `Building ${name.split(" ")[0]}'s CV`) : (sw ? "Inatengeneza CV yako" : "Building your CV")}
            </p>
            <p key={stepIdx} className="text-xs font-medium mb-5 transition-all duration-300" style={{ color: current.color }}>
              {stepLabel(current.label)}…
            </p>

            {/* Colorful segmented progress bar */}
            <div className="relative h-3 bg-sand-2 rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, #6366F1, ${current.color})`,
                }}
              />
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
            <p className="text-[10px] text-text-muted mb-5 font-medium">{sw ? `${pct}% imekamilika` : `${pct}% complete`}</p>

            {/* Step dots — each colored when reached */}
            <div className="flex items-center justify-center gap-2">
              {EXPORT_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-400"
                    style={i <= stepIdx
                      ? { backgroundColor: step.color, color: "#fff", transform: "scale(1.1)" }
                      : { backgroundColor: "#F3F4F6", color: "#9CA3AF" }
                    }
                  >
                    {i < stepIdx ? "✓" : i === stepIdx ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#fff" }} /> : String(i + 1)}
                  </div>
                  <span className="text-[8px] font-medium" style={{ color: i <= stepIdx ? step.color : "#D1D5DB" }}>
                    {stepLabel(step.label).split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        {state === "success" && (
          <>
            <div className="w-14 h-14 bg-pine-tint rounded-2xl flex items-center justify-center mx-auto mb-3">
              <PartyPopper className="w-7 h-7 text-pine" />
            </div>
            <p className="text-sm font-bold text-espresso mb-1">
              {name ? `${name.split(" ")[0]}${sw ? " CV yako iko tayari!" : "'s CV is ready!"}` : (sw ? "CV yako iko tayari!" : "Your CV is ready!")}
            </p>
            <p className="text-xs text-text-muted mb-4">{sw ? "Imehifadhiwa kwenye Downloads." : "Saved to your Downloads folder."}</p>

            {/* Launchpad — export is the start of applying, not the end. */}
            {(onShareOnline || onGenerateCoverLetter || onTrackApplication) && (
              <>
                <p className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-2">{sw ? "Hatua inayofuata" : "Next step"}</p>
                <div className="space-y-2 mb-3">
                  {onShareOnline && (
                    <button onClick={onShareOnline} disabled={!!nextBusy}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-semibold py-2.5 rounded-input-lg shadow-[0_3px_0_#128C43] active:translate-y-[2px] hover:brightness-95 disabled:opacity-60 transition">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M17.6 6.3A7.9 7.9 0 0 0 12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1.1A8 8 0 1 0 17.6 6.3zM12 18.5a6.5 6.5 0 0 1-3.3-.9l-.24-.14-2.44.64.65-2.38-.16-.25A6.5 6.5 0 1 1 12 18.5zm3.6-4.9c-.2-.1-1.2-.58-1.36-.64-.19-.07-.32-.1-.46.1s-.53.64-.64.77-.23.15-.43.05a5.3 5.3 0 0 1-1.56-.96 5.9 5.9 0 0 1-1.08-1.35c-.11-.2 0-.3.09-.4l.3-.35c.1-.13.13-.22.2-.36a.37.37 0 0 0-.02-.35c-.05-.1-.46-1.1-.63-1.51-.16-.4-.33-.34-.46-.35h-.39a.75.75 0 0 0-.54.25 2.28 2.28 0 0 0-.71 1.7 3.96 3.96 0 0 0 .83 2.1 9.1 9.1 0 0 0 3.48 3.07c.49.21.87.34 1.16.43.49.16.93.14 1.28.08.39-.06 1.2-.49 1.37-.96.17-.47.17-.88.12-.96s-.18-.14-.38-.24z"/></svg>
                      {sw ? "Shiriki CV yako (WhatsApp)" : "Share your CV (WhatsApp)"}
                    </button>
                  )}
                  {onGenerateCoverLetter && (
                    <button onClick={onGenerateCoverLetter} disabled={!!nextBusy}
                      className="w-full flex items-center justify-center gap-2 bg-ember text-cream text-sm font-semibold py-2.5 rounded-input-lg shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] hover:bg-ember-hover disabled:opacity-60 transition">
                      {nextBusy === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {sw ? "Tengeneza barua ya maombi" : "Generate a matching cover letter"}
                    </button>
                  )}
                  {onTrackApplication && (
                    <button onClick={onTrackApplication} disabled={!!nextBusy}
                      className="w-full flex items-center justify-center gap-2 bg-card border border-border text-espresso text-sm font-semibold py-2.5 rounded-input-lg hover:bg-sand disabled:opacity-60 transition">
                      {nextBusy === "track" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                      {sw ? "Fuatilia ombi hili" : "Track this application"}
                    </button>
                  )}
                </div>
              </>
            )}

            <button onClick={onClose} disabled={!!nextBusy}
              className="w-full text-text-muted hover:text-espresso text-sm font-medium py-1.5 transition disabled:opacity-60">
              {sw ? "Nimemaliza" : "Done"}
            </button>
          </>
        )}
        {state === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-espresso mb-1">{sw ? "Imeshindwa kutoa" : "Export failed"}</p>
            <div className="h-2 bg-red-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-text-muted mb-5">{sw ? "Hitilafu imetokea. Tafadhali jaribu tena." : "Something went wrong. Please try again."}</p>
            <button onClick={onRetry}
              className="w-full bg-ember hover:bg-ember-hover text-cream text-sm font-semibold py-2.5 rounded-xl transition mb-2">
              {sw ? "Jaribu tena" : "Try again"}
            </button>
            <button onClick={onClose}
              className="w-full text-xs text-text-muted hover:text-text-body py-1 transition">
              {sw ? "Funga" : "Dismiss"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CV completion scoring ────────────────────────────────────────────────────

const SECTION_WEIGHTS: Record<string, { label: string; color: string; compute: (cv: CVData) => number }> = {
  personal:   { label: "Info",    color: "#6366F1", compute: cv => [cv.personal.fullName, cv.personal.jobTitle, cv.personal.email, cv.personal.phone, cv.personal.location].filter(Boolean).length / 5 },
  summary:    { label: "Summary", color: "#8B5CF6", compute: cv => cv.summary && cv.summary.length > 30 ? 1 : cv.summary?.length ? 0.5 : 0 },
  experience: { label: "Work",    color: "#0891B2", compute: cv => Math.min(cv.experience.length / 2, 1) },
  education:  { label: "Edu",     color: "#059669", compute: cv => Math.min(cv.education.length, 1) },
  skills:     { label: "Skills",  color: "#D97706", compute: cv => Math.min(cv.skills.length / 4, 1) },
  referees:   { label: "Refs",    color: "#EC4899", compute: cv => Math.min(cv.referees.length / 2, 1) },
};

function computeCompletion(cv: CVData) {
  const entries = Object.entries(SECTION_WEIGHTS);
  const scores = Object.fromEntries(entries.map(([k, v]) => [k, v.compute(cv)]));
  const total = entries.reduce((sum, [k]) => sum + scores[k], 0);
  return { scores, pct: Math.round((total / entries.length) * 100) };
}

function CvCompletionBar({ cv, onSectionClick }: { cv: CVData; onSectionClick?: (key: string) => void }) {
  const { scores, pct } = computeCompletion(cv);
  const barColor = pct >= 80 ? "#059669" : pct >= 50 ? "#D97706" : "#EF4444";
  const label = pct >= 80 ? "Looking great!" : pct >= 50 ? "Keep going!" : "Just getting started";

  return (
    <div className="px-4 py-3 bg-card border-b border-border flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">CV Completion</span>
        <span className="text-xs font-bold" style={{ color: barColor }}>{pct}% — {label}</span>
      </div>

      {/* Segmented color bar */}
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-2">
        {Object.entries(SECTION_WEIGHTS).map(([key, { color }]) => {
          const score = scores[key];
          const isEmpty = score === 0;
          const isFull = score >= 1;
          return (
            <div
              key={key}
              className="flex-1 rounded-full transition-all duration-500 cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: isEmpty ? "#EFE7DA" : isFull ? color : color + "88",
                transform: isFull ? "scaleY(1)" : "scaleY(0.85)",
              }}
              onClick={() => onSectionClick?.(key)}
              title={`${SECTION_WEIGHTS[key].label}: ${Math.round(score * 100)}%`}
            />
          );
        })}
      </div>

      {/* Section score dots */}
      <div className="flex gap-1 items-center">
        {Object.entries(SECTION_WEIGHTS).map(([key, { label, color }]) => {
          const score = scores[key];
          return (
            <button
              key={key}
              onClick={() => onSectionClick?.(key)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[9px] font-semibold transition-all hover:opacity-80"
              style={{
                backgroundColor: score >= 1 ? color + "18" : score > 0 ? "#FBF3E2" : "#EFE7DA",
                color: score >= 1 ? color : score > 0 ? "#B57A18" : "#9C9186",
                border: `1px solid ${score >= 1 ? color + "40" : score > 0 ? "#F2A93B" : "#DBD1C2"}`,
              }}
            >
              <Icon name={score >= 1 ? "check" : "chevron-right"} size={8} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// On-a-roll streak — 3+ fields filled within 5s of each other
function useStreak() {
  const [hot, setHot] = useState(false);
  const lastFillRef = useRef<number>(0);
  const countRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clear pending timer when the component unmounts
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const recordFill = useCallback(() => {
    const now = Date.now();
    countRef.current = now - lastFillRef.current < 5000 ? countRef.current + 1 : 1;
    lastFillRef.current = now;
    if (countRef.current >= 3) setHot(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
      setHot(false);
    }, 5000);
  }, []);

  return { hot, recordFill };
}

// Section confetti — fires when a section transitions to 100% (never on first load)
function useSectionConfetti(scores: Record<string, number>) {
  // null means "not yet initialised" — first effect run just seeds the ref
  const prevRef = useRef<Record<string, number> | null>(null);
  // Stable string dep so the effect only runs when score values actually change
  const scoresKey = Object.entries(scores).map(([k, v]) => `${k}:${v.toFixed(2)}`).join("|");

  useEffect(() => {
    if (prevRef.current === null) {
      // First render: record baseline without firing
      prevRef.current = { ...scores };
      return;
    }
    const prev = prevRef.current;
    prevRef.current = { ...scores };

    const fire = async () => {
      for (const [key, score] of Object.entries(scores)) {
        if ((prev[key] ?? 0) < 1 && score >= 1) {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { x: 0.5, y: 0.6 },
            colors: ["#6366F1", "#8B5CF6", "#0891B2", "#059669", "#D97706", "#F43F5E"],
            scalar: 0.9,
            ticks: 180,
          });
          break; // one burst per transition, don't stack multiple sections at once
        }
      }
    };
    fire();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresKey]);
}

// CV Strength score — richer than completion, shows point breakdowns
function CvStrengthMeter({ cv, lang }: { cv: CVData; lang?: "en" | "sw" }) {
  const sw = lang === "sw";
  const { scores, pct } = computeCompletion(cv);

  // Extra score from optional fields
  const bonusItems = [
    { label: sw ? "Picha" : "Photo", done: !!cv.personal.photo,                 pts: 5 },
    { label: "LinkedIn",       done: !!cv.personal.linkedin,                    pts: 5 },
    { label: sw ? "Miradi" : "Projects",       done: (cv.projects?.length ?? 0) > 0,            pts: 5 },
    { label: sw ? "Tovuti" : "Website",        done: !!cv.personal.website,                     pts: 5 },
    { label: sw ? "Vyeti" : "Certifications", done: cv.certifications?.length > 0,             pts: 5 },
    { label: sw ? "Lugha" : "Languages",      done: cv.languages?.length > 1,                  pts: 5 },
    { label: sw ? "Wadhamini" : "Referees",       done: cv.referees?.length > 0,                  pts: 5 },
  ];
  const bonusScore = bonusItems.filter(b => b.done).length * 4; // up to 20 bonus points
  const totalScore = Math.min(100, Math.round(pct * 0.8) + bonusScore);

  const ring = totalScore >= 90 ? "#059669" : totalScore >= 70 ? "#0891B2" : totalScore >= 45 ? "#D97706" : "#EF4444";
  const label = sw
    ? (totalScore >= 90 ? "Bingwa" : totalScore >= 70 ? "Imara" : totalScore >= 45 ? "Nzuri" : "Mwanzo")
    : (totalScore >= 90 ? "Expert" : totalScore >= 70 ? "Strong" : totalScore >= 45 ? "Good" : "Starter");
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - totalScore / 100);

  // What's missing
  const missing: string[] = [];
  if (scores.personal < 1)   missing.push(sw ? "Kamilisha maelezo yako ya mawasiliano" : "Complete your contact info");
  if (scores.summary < 1)    missing.push(sw ? "Andika muhtasari (herufi 30+)" : "Write a summary (30+ chars)");
  if (scores.experience < 1) missing.push(sw ? "Ongeza uzoefu wa kazi" : "Add work experience");
  if (scores.education < 1)  missing.push(sw ? "Ongeza elimu" : "Add education");
  if (scores.skills < 1)     missing.push(sw ? "Ongeza ujuzi angalau 4" : "Add at least 4 skills");
  bonusItems.filter(b => !b.done).slice(0, 2).forEach(b => missing.push(sw ? `Ongeza ${b.label} (+${b.pts} pts)` : `Add ${b.label} (+${b.pts} pts)`));

  return (
    <div className="px-4 py-3 bg-card border-b border-border flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Animated ring */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#EFE7DA" strokeWidth="7" />
            <circle
              cx="36" cy="36" r="28" fill="none" stroke={ring} strokeWidth="7"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.5s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black leading-none" style={{ color: ring }}>{totalScore}</span>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wide">{label}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{sw ? "Nguvu ya CV" : "CV Strength"}</span>
            {missing.length === 0 && (
              <span className="text-[9px] font-bold text-pine bg-pine-tint px-1.5 py-0.5 rounded-pill">{sw ? "Kamili!" : "Perfect!"}</span>
            )}
          </div>
          {/* Section pills */}
          <div className="flex gap-0.5 mb-1.5">
            {Object.entries(SECTION_WEIGHTS).map(([key, { color }]) => (
              <div key={key} className="flex-1 h-1.5 rounded-full overflow-hidden bg-sand">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${scores[key] * 100}%`, backgroundColor: color }}
                />
              </div>
            ))}
          </div>
          {/* Next action */}
          {missing.length > 0 ? (
            <p className="text-[10px] text-gold-text font-semibold truncate flex items-center gap-1">
              <Icon name="spark" size={10} className="text-gold" />
              {missing[0]}
            </p>
          ) : (
            <p className="text-[10px] text-pine font-semibold flex items-center gap-1">
              <Icon name="check" size={10} className="text-pine" />
              {sw ? "CV yako imekamilika na iko tayari kwa waajiri" : "Your CV is complete and recruiter-ready"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Field-fill glow — wraps an input container, flashes green border when field goes from empty to filled
function GlowField({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const [glow, setGlow] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => {
    const wasEmpty = !prevRef.current;
    prevRef.current = value; // always update before any early return
    if (wasEmpty && value) {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 700);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <div
      className={className}
      style={{
        borderLeft: glow ? "3px solid #059669" : "3px solid transparent",
        transition: "border-color 0.3s ease",
        paddingLeft: glow ? 4 : 4,
      }}
    >
      {children}
    </div>
  );
}

// ─── Sample data for template thumbnails ─────────────────────────────────────

// Inline SVG avatar — medium skin tone, short hair
const PREVIEW_PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0e6dc'/%3E%3Ccircle cx='100' cy='75' r='45' fill='%23D4956A'/%3E%3Cpath d='M55 60 Q70 30 100 27 Q130 30 145 60 Q125 40 100 42 Q75 40 55 60Z' fill='%23704214'/%3E%3Cpath d='M15 200 C15 148 55 130 100 130 C145 130 185 148 185 200Z' fill='%23D4956A'/%3E%3C/svg%3E";

const PREVIEW_CV: CVData = {
  personal: {
    fullName: "Alex Johnson", jobTitle: "Senior Product Designer",
    email: "alex.johnson@gmail.com", phone: "+1 555 0100",
    location: "New York, NY", linkedin: "linkedin.com/in/alex", website: "alexj.design",
    photo: PREVIEW_PHOTO,
  },
  summary: "Creative product designer with 6 years building digital products for global brands. Skilled in Figma, user research, and scalable design systems.",
  experience: [
    { id: "_e1", company: "Acme Corp", position: "Senior Designer", location: "New York",
      startDate: "2021-01", endDate: "", current: true,
      description: "Led redesign of core product, reducing churn by 20%. Managed design system used by 12 engineers." },
    { id: "_e2", company: "StartupXYZ", position: "UX Designer", location: "Remote",
      startDate: "2018-06", endDate: "2020-12", current: false,
      description: "Built design system from scratch. Conducted user interviews and synthesized research findings." },
  ],
  education: [
    { id: "_ed1", institution: "New York University", degree: "B.A.", field: "Visual Communication",
      startDate: "2014-09", endDate: "2018-06", grade: "3.8 GPA", description: "" },
  ],
  skills: [
    { id: "_s1", name: "Figma", level: 5 }, { id: "_s2", name: "React", level: 4 },
    { id: "_s3", name: "Prototyping", level: 5 }, { id: "_s4", name: "User Research", level: 4 },
  ],
  languages: [
    { id: "_l1", name: "English", proficiency: "Native" },
    { id: "_l2", name: "French", proficiency: "Intermediate" },
  ],
  certifications: [
    { id: "_c1", name: "Google UX Design Certificate", issuer: "Google", date: "2022-03", url: "" },
  ],
  projects: [
    { id: "_p1", name: "Design System Revamp", role: "Lead", date: "2023", description: "Built a shared component library adopted across 4 product teams, cutting design-to-dev time." },
  ],
  referees: [],
  hobbies: "Photography, Hiking, Open Source",
  hiddenSections: [],
};

// ─── Template mini-preview (renders actual template at readable scale) ──────────
// Right sidebar is w-64 (256px). 2-col grid with p-4 padding + gap-3:
// available = 256 - 32 - 12 = 212px → each cell ≈ 106px wide
const THUMB_SCALE = 106 / 794;
const THUMB_W = 106;
const THUMB_H = Math.round(1123 * THUMB_SCALE);

function TemplateMiniPreview({ templateId, color }: { templateId: TemplateId; color: string }) {
  const Component = TEMPLATE_COMPONENTS[templateId] ?? NakuruTemplate;
  return (
    <div style={{ width: THUMB_W, height: THUMB_H, overflow: "hidden", position: "relative", pointerEvents: "none", flexShrink: 0 }}>
      <div style={{ width: 794, height: 1123, transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <Component data={PREVIEW_CV} primaryColor={color} fontFamily={INTER_STACK} />
      </div>
    </div>
  );
}

// ─── Wizard step definitions ──────────────────────────────────────────────────

const WIZARD_STEPS: Array<{ key: string; label: string; Icon: React.ComponentType<{ className?: string }>; optional?: boolean }> = [
  { key: "personal",    label: "About",      Icon: User },
  { key: "experience",  label: "Work",       Icon: Briefcase },
  { key: "education",   label: "Education",  Icon: GraduationCap },
  { key: "skills",      label: "Skills",     Icon: Zap },
  { key: "extras",      label: "Extras",     Icon: MoreHorizontal, optional: true },
];

const SAMPLE_JD = `We are looking for a Senior Frontend Engineer to join our product team.

Requirements:
• 3+ years of JavaScript and TypeScript experience
• Strong proficiency in React, Next.js and modern CSS (Tailwind)
• Experience with GraphQL APIs and REST services
• Familiarity with testing frameworks: Jest and Cypress
• Git workflow, CI/CD pipelines, code review culture
• Bonus: Node.js, Docker, AWS, Figma collaboration, agile/scrum`;

const COLOR_PALETTES = [
  { name: "Ember",    hex: "#DA4A1C" },
  { name: "Pine",     hex: "#12433D" },
  { name: "Purple",   hex: "#7C3AED" },
  { name: "Forest",   hex: "#059669" },
  { name: "Coral",    hex: "#DC2626" },
  { name: "Sunset",   hex: "#D97706" },
  { name: "Ocean",    hex: "#0891B2" },
  { name: "Royal",    hex: "#2563EB" },
  { name: "Midnight", hex: "#0F172A" },
  { name: "Slate",    hex: "#64748B" },
];
const FONTS = DOC_FONTS;

// ─── Template modal thumbnail (3-col grid inside max-w-3xl) ──────────────────
const MODAL_THUMB_SCALE = 200 / 794;
const MODAL_THUMB_W = 200;
const MODAL_THUMB_H = Math.round(1123 * MODAL_THUMB_SCALE);

function TemplateLargePreview({ templateId, color }: { templateId: TemplateId; color: string }) {
  const Component = TEMPLATE_COMPONENTS[templateId] ?? NakuruTemplate;
  return (
    <div style={{ width: MODAL_THUMB_W, height: MODAL_THUMB_H, overflow: "hidden", position: "relative", pointerEvents: "none", flexShrink: 0 }}>
      <div style={{ width: 794, height: 1123, transform: `scale(${MODAL_THUMB_SCALE})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <Component data={PREVIEW_CV} primaryColor={color} fontFamily={INTER_STACK} />
      </div>
    </div>
  );
}

function TemplateModal({
  currentTemplateId, primaryColor, onSelect, onClose, sw, templateHistory,
}: {
  currentTemplateId: TemplateId; primaryColor: string;
  onSelect: (id: TemplateId) => void; onClose: () => void; sw: boolean;
  /** Every template id this CV has ever been saved with — exempts them from
   *  the premium lock so switching away and back never paywalls a template
   *  the owner already used for free. */
  templateHistory: string[];
}) {
  const [lockedTemplate, setLockedTemplate] = useState<TemplateId | null>(null);
  // Earned Premium — see lib/use-premium.ts. Without this the picker gated on
  // the template id alone, so a referrer who had earned Premium days was locked
  // out of the very designs those days were for.
  const { premium } = usePremium();
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-espresso">{sw ? "Chagua muundo" : "Choose a look"}</h2>
            <p className="text-sm text-text-muted mt-0.5">{sw ? "Maudhui yako yanabaki — muundo pekee ndio unabadilika." : "Your content stays — only the design changes."}</p>
          </div>
          <button onClick={onClose} aria-label={label(sw, "close")} className="w-9 h-9 rounded-lg hover:bg-sand flex items-center justify-center transition text-text-muted hover:text-espresso flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(CURATED_CV_TEMPLATES.some((t) => t.id === currentTemplateId)
              ? CURATED_CV_TEMPLATES
              : [...TEMPLATES.filter((t) => t.id === currentTemplateId), ...CURATED_CV_TEMPLATES]
            ).map((tpl) => {
              const isActive = tpl.id === currentTemplateId;
              const locked = isPremiumTemplate(tpl.id) && !isActive && !premium && !templateHistory.includes(tpl.id);
              return (
                <button
                  key={tpl.id}
                  onClick={() => { if (locked) { setLockedTemplate(tpl.id); return; } onSelect(tpl.id); onClose(); }}
                  className={`group rounded-xl overflow-hidden border-2 transition-all text-left ${
                    isActive ? "border-ember shadow-md shadow-ember-tint" : "border-border hover:border-ember/50 hover:shadow-md"
                  }`}
                >
                  <div className="relative bg-sand flex items-center justify-center overflow-hidden" style={{ height: MODAL_THUMB_H + 16 }}>
                    <TemplateLargePreview templateId={tpl.id} color={primaryColor} />
                    {isActive && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-ember rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {locked ? (
                      <div className="absolute top-2 left-2 bg-espresso text-cream text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex items-center gap-1">
                        <Icon name="lock" size={8} />
                        Premium
                      </div>
                    ) : tpl.popular && !isActive ? (
                      <div className="absolute top-2 left-2 bg-gold text-espresso text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {sw ? "Maarufu" : "Popular"}
                      </div>
                    ) : null}
                  </div>
                  <div className={`px-3 py-2.5 border-t ${isActive ? "bg-ember-tint/40 border-ember/20" : "border-border bg-card"}`}>
                    <p className={`text-xs font-semibold truncate ${isActive ? "text-ember-hover" : "text-text-body"}`}>{tpl.name}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">{tpl.description}</p>
                    {(() => {
                      const tip = getPairingTip(tpl.id, tpl.name);
                      return tip ? <p className="text-[8px] text-ember-hover mt-0.5 truncate">{tip}</p> : null;
                    })()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {lockedTemplate && <PremiumTemplateModal onClose={() => setLockedTemplate(null)} />}
    </div>
  );
}

// ─── Main editor component ───────────────────────────────────────────────────

// Relative time for the version-history list ("5 min ago" / "dakika 5 zilizopita").
function formatTimeAgo(iso: string, lang: Lang): string {
  const sw = lang === "sw";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return sw ? "sekunde chache zilizopita" : "just now";
  // Noun-class agreement: "zilizopita" is plural — a count of exactly one
  // takes the singular "iliyopita" (dakika/saa/siku are all N-class nouns,
  // same singular/plural form but different relative-verb agreement). The
  // English side already handles its own singular/plural ("1 hr" vs "2 hrs");
  // the Swahili side was missing the equivalent.
  const mins = Math.floor(secs / 60);
  if (mins < 60) return sw ? `dakika ${mins} ${mins === 1 ? "iliyopita" : "zilizopita"}` : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return sw ? `saa ${hrs} ${hrs === 1 ? "iliyopita" : "zilizopita"}` : `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return sw ? `siku ${days} ${days === 1 ? "iliyopita" : "zilizopita"}` : `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(sw ? "sw" : "en", { day: "numeric", month: "short" });
}

// One-tap AI "adjust" directions offered on a staged suggestion — the
// career-assistant refine loop.
type Directive = "shorter" | "ats" | "measurable" | "leadership" | "sw" | "en";
const REFINE_OPTIONS: { id: Exclude<Directive, "sw" | "en">; en: string; sw: string }[] = [
  { id: "shorter", en: "Shorter", sw: "Fupisha" },
  { id: "ats", en: "More ATS", sw: "Kusomeka na mifumo (ATS)" },
  { id: "measurable", en: "More measurable", sw: "Ongeza vipimo" },
  { id: "leadership", en: "More leadership", sw: "Uongozi zaidi" },
];

interface Props { initialDoc: CV; userId: string; guestMode?: boolean; requestedTemplateId?: string | null; isPremium?: boolean; uiLang?: Lang; backHref?: string; }

export function CVEditorClient({ initialDoc, userId, accessToken, guestMode, requestedTemplateId, isPremium: isPremiumProp = false, uiLang = "en", backHref }: Props & { accessToken?: string }) {
  const isPremium = true; // payment temporarily disabled
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const prevSavingRef = useRef(false);
  const [savedFlash, setSavedFlash] = useState(false);
  // Persistent "saved" resting state. A signed-in doc opened from the dashboard
  // is already persisted, so it starts true; a fresh guest draft flips true
  // after its first successful save.
  const [everSaved, setEverSaved] = useState(false);
  // Which account prompt is open (null = none). The intent picks the copy:
  // "account" gates something that needs an account, "postExport" is the
  // after-delivery offer a guest sees once their file has been downloaded.
  const [signUpPrompt, setSignUpPrompt] = useState<SignUpIntent | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview" | "design">("edit");
  const [wizardStep, setWizardStep] = useState(0);
  const [previewScale, setPreviewScale] = useState(1);
  const [isEnhancing, setIsEnhancing] = useState(false);
  // AI enhance is non-destructive: the suggestion lands in this preview so the
  // user can compare and Apply / Discard / Regenerate — never a silent overwrite.
  const [enhancePreview, setEnhancePreview] = useState<{ label: string; original: string; enhanced: string; source?: "ai" | "local"; onApply: (v: string) => void; regenerate: () => void; refine?: (d: Directive) => void } | null>(null);
  // Unified toast for errors/success — replaces alert() everywhere in this editor.
  const [toast, setToast] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const showToast = useCallback((text: string, tone: "error" | "success" = "error") => setToast({ text, tone }), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  const [translateProgress, setTranslateProgress] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number>();
  const [showAppModal, setShowAppModal] = useState(false);
  const [appJd, setAppJd] = useState("");
  const [appCompany, setAppCompany] = useState("");
  const [savingApp, setSavingApp] = useState(false);
  // Phase 2 (A): needs-confirmation facts (AI-drafted prose) from the Career
  // Profile — badge the matching fields and offer the shared confirm card.
  const [pendingConfirms, setPendingConfirms] = useState<PendingConfirmation[]>([]);
  const [showConfirmPanel, setShowConfirmPanel] = useState(false);

  // Load pending confirmations once (signed-in users only — guests have no
  // profile). Non-fatal: a failure just means no badges.
  useEffect(() => {
    if (guestMode || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/confirmations");
        const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: PendingConfirmation[] };
        if (!cancelled && j.success) setPendingConfirms(j.data ?? []);
      } catch { /* no badges is fine */ }
    })();
    return () => { cancelled = true; };
  }, [guestMode, userId]);
  const pendingKeySet = useMemo(() => new Set(pendingConfirms.map((p) => p.key)), [pendingConfirms]);

  const saveAsApplication = async () => {
    const jd = appJd.trim();
    if (!jd) return;
    setSavingApp(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const isFullJd = jd.length > 100;
      // Compute the match score up front so the application lands in the
      // workspace already showing fit, instead of blank until the user re-pastes
      // the JD. Same heuristic the Job Target panel and jobs feed use.
      const matchScore = isFullJd ? matchCvToJd(cvData, jd).score : undefined;
      const res = await fetch("/api/applications/from-cv", {
        method: "POST", headers,
        body: JSON.stringify({
          cvId: initialDoc.id,
          jobTitle: isFullJd ? undefined : jd,
          jobDescription: isFullJd ? jd : undefined,
          companyName: appCompany.trim() || undefined,
          matchScore,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (json.success) {
        posthog.capture('application_created', { source: 'save_as_application' });
        window.location.href = "/dashboard?tab=applications"; return;
      }
      showToast(json.error || (uiLang === "sw" ? "Imeshindwa kuhifadhi ombi. Jaribu tena." : "Couldn't save the application. Please try again."));
    } catch {
      showToast(uiLang === "sw" ? "Imeshindwa kuhifadhi ombi. Jaribu tena." : "Couldn't save the application. Please try again.");
    }
    setSavingApp(false);
  };

  // Post-export launchpad actions — turn "your CV is ready" into the start of
  // the next step (apply), instead of a dead end.
  const [exportNextBusy, setExportNextBusy] = useState<null | "cover" | "track">(null);

  async function generateCoverLetterFromExport(jobDescription?: string) {
    if (exportNextBusy) return;
    setExportNextBusy("cover");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const personal = cvData.personal ?? {};

      // Write a REAL letter body from the CV's actual content (summary, top
      // experience, projects, skills) via the AI endpoint. If that fails for any
      // reason, fall back to a safe generic body so the flow never blocks.
      let content = `I am writing to express my interest in the ${personal.jobTitle || ""} position. ${cvData.summary ? cvData.summary + "\n\n" : ""}I look forward to discussing how my skills and experience align with your team's needs.`;
      try {
        const highlights = [
          cvData.summary,
          ...cvData.experience.slice(0, 3).map((e) => `${e.position}${e.company ? " at " + e.company : ""}: ${e.description}`),
          ...(cvData.projects ?? []).slice(0, 2).map((p) => `Project — ${p.name}: ${p.description}`),
          cvData.skills.length ? `Skills: ${cvData.skills.map((s) => s.name).join(", ")}` : "",
        ].filter(Boolean).join("\n").slice(0, 3800);
        const aiRes = await fetch("/api/ai/cover-letter", {
          method: "POST", headers,
          body: JSON.stringify({ fullName: personal.fullName || undefined, jobTitle: personal.jobTitle || undefined, highlights, jobDescription: jobDescription?.trim() || undefined }),
        });
        const aiJson = await aiRes.json().catch(() => ({})) as { success?: boolean; data?: { content?: string } };
        if (aiRes.ok && aiJson.success && aiJson.data?.content?.trim()) content = aiJson.data.content.trim();
      } catch { /* keep the generic fallback */ }

      const res = await fetch("/api/cover-letter", {
        method: "POST", headers,
        body: JSON.stringify({
          title: `Cover Letter for ${title}`,
          cvId: initialDoc.id,
          // Carry the kit across: match the cover-letter template + accent to
          // the CV's, so a Zege CV opens a Zege-matching cover letter.
          templateId: getCoverLetterForCv(templateId),
          primaryColor,
          // Body paragraphs ONLY — the template renders its own "Dear Hiring
          // Manager," salutation and the "Sincerely, <sender>" signature (from
          // the profile). Embedding a greeting/sign-off here duplicated both and
          // leaked the CV's name into the signature.
          content,
          jobTitle: personal.jobTitle || undefined,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id?: string }; error?: string };
      if (json.success && json.data?.id) { window.location.href = `/editor/cover-letter/${json.data.id}`; return; }
      showToast(json.error || (uiLang === "sw" ? "Imeshindwa kutengeneza barua. Jaribu tena." : "Couldn't create the cover letter. Please try again."));
    } catch {
      showToast(uiLang === "sw" ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    }
    setExportNextBusy(null);
  }

  async function trackApplicationFromExport() {
    if (exportNextBusy) return;
    setExportNextBusy("track");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/applications/from-cv", {
        method: "POST", headers,
        body: JSON.stringify({ cvId: initialDoc.id, jobTitle: cvData.personal.jobTitle || undefined }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id?: string }; error?: string };
      if (json.success) {
        posthog.capture('application_created', { source: 'export_launchpad' });
        const id = json.data?.id;
        // Land in the Application Workspace — the same hub the jobs feed's
        // "Track this job" opens — so the journey has one destination, not two.
        window.location.href = id ? `/applications/${id}` : "/dashboard?tab=applications";
        return;
      }
      showToast(json.error || (uiLang === "sw" ? "Imeshindwa kuhifadhi ombi. Jaribu tena." : "Couldn't start tracking. Please try again."));
    } catch {
      showToast(uiLang === "sw" ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    }
    setExportNextBusy(null);
  }

  // ── Marketplace: submit this CV's style (color/font/section-order over its base
  // template) to the moderation queue. Flag-gated; never ships arbitrary layout.
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDesc, setTplDesc] = useState("");
  const [tplCat, setTplCat] = useState("");
  const [submittingTpl, setSubmittingTpl] = useState(false);

  const submitAsTemplate = async () => {
    const name = tplName.trim();
    if (!name) return;
    setSubmittingTpl(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/marketplace/submit", {
        method: "POST", headers,
        body: JSON.stringify({
          docType: "cv",
          name,
          description: tplDesc.trim() || undefined,
          category: tplCat.trim() || undefined,
          baseTemplateId: templateId,
          primaryColor,
          fontFamily,
          sectionOrder: cvData.sectionOrder,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (json.success) { setShowTplModal(false); showToast(uiLang === "sw" ? "Imewasilishwa kwa ukaguzi. Asante!" : "Submitted for review. Thanks!", "success"); }
      else showToast(json.error || (uiLang === "sw" ? "Imeshindwa kuwasilisha kwa sasa. Jaribu tena." : "Couldn't submit right now. Please try again."));
    } catch {
      showToast(uiLang === "sw" ? "Imeshindwa kuwasilisha kwa sasa. Jaribu tena." : "Couldn't submit right now. Please try again.");
    }
    setSubmittingTpl(false);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [isDocx, setIsDocx] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [downloadMenu, setDownloadMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<{ id: string; title: string; createdAt: string }[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [centerMenu, setCenterMenu] = useState(false);
  const [exportOverlay, setExportOverlay] = useState<"hidden" | "exporting" | "success" | "error">("hidden");
  const [exportStepIdx, setExportStepIdx] = useState(0);
  const [showAtsPanel, setShowAtsPanel] = useState(false);
  const [showJobTarget, setShowJobTarget] = useState(false);
  const [panelTab, setPanelTab] = useState<"design" | "optimize">("design");
  const [showPresets, setShowPresets] = useState(false);
  const [showSectionOrder, setShowSectionOrder] = useState(false);
  const [sampleJdActive, setSampleJdActive] = useState(false);

  const {
    cv: cvData, templateId, primaryColor, fontFamily, isSaving,
    setInitialState, updatePersonal, setSummary, loadCvData,
    addExperience, updateExperience, removeExperience, reorderExperience,
    addEducation, updateEducation, removeEducation, reorderEducation,
    addSkill, updateSkill, removeSkill, reorderSkills,
    addLanguage, updateLanguage, removeLanguage, reorderLanguages,
    addCertification, updateCertification, removeCertification, reorderCertifications,
    addProject, updateProject, removeProject, reorderProjects,
    addReferee, updateReferee, removeReferee, reorderReferees,
    setHobbies, setTemplate, setPrimaryColor, setFontFamily,
    setTitle, saveCv, exportPdf, title, setAccessToken,
    toggleSectionVisibility, setSectionOrder, setDensity, saveError,
  } = useEditorStore();

  // "Start from an example" — offered only while the CV is still essentially
  // blank, so a first-timer faces a finished CV instead of empty fields.
  const [exampleDismissed, setExampleDismissed] = useState(false);
  const cvIsBlank =
    !cvData.personal.fullName.trim() &&
    !cvData.summary.trim() &&
    !cvData.experience.some((e) => e.company.trim() || e.position.trim() || e.description.trim()) &&
    !cvData.skills.some((s) => s.name.trim());
  const loadExample = useCallback(() => {
    loadCvData(getSampleCV(uiLang));
    setExampleDismissed(true);
    goToStep(0);
    track("sample_cv_loaded");
    showToast(uiLang === "sw" ? "Mfano umepakiwa — badilisha uwe wako." : "Example loaded — edit it to make it yours.", "success");
    triggerAutoSave();
  }, [loadCvData, uiLang, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function makeDragEndHandler(reorder: (from: number, to: number) => void, items: { id: string }[]) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const from = items.findIndex((i) => i.id === active.id);
        const to = items.findIndex((i) => i.id === over.id);
        if (from !== -1 && to !== -1) { reorder(from, to); triggerAutoSave(); }
      }
    };
  }

  function handleSectionReorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = cvData.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
    const from = order.indexOf(active.id as string);
    const to = order.indexOf(over.id as string);
    if (from === -1 || to === -1) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSectionOrder(next);
    triggerAutoSave();
  }

  // useLayoutEffect so the store is synced before the browser paints, preventing
  // a flash of the wrong template when navigating between documents.
  useLayoutEffect(() => {
    if (guestMode) {
      const saved = localStorage.getItem("sumaiya-guest-cv");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { cv?: CVData; title?: string; templateId?: string; primaryColor?: string; fontFamily?: string };
          if (parsed.cv) {
            useEditorStore.setState({
              // Normalize through the schema so a stale/corrupt draft (missing a
              // newer array field) can't crash the section mutators later.
              cv: parseCVData(parsed.cv), title: parsed.title ?? "My CV",
              // If a template was explicitly requested from the gallery, honour it.
              // Otherwise restore whatever the user last used (stored in localStorage).
              templateId: (() => {
                const candidate = requestedTemplateId ?? parsed.templateId ?? "nakuru";
                return isTemplateId(candidate) ? candidate : "nakuru";
              })(),
              primaryColor: parsed.primaryColor ?? "#DA4A1C", fontFamily: parsed.fontFamily ?? "Inter",
            });
            return;
          }
        } catch { /* ignore */ }
      }
    }
    setInitialState(initialDoc);
  }, [initialDoc.id, requestedTemplateId, guestMode]);

  useEffect(() => { if (accessToken) setAccessToken(accessToken); }, [accessToken]);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    // Floor the scale so a hidden→visible tab switch (offsetWidth briefly 0)
    // can't produce a negative/zero scale and leave the A4 canvas at native
    // 794px inside a narrow column → horizontal scroll on mobile. Recompute
    // synchronously when the Preview tab opens.
    const update = () => setPreviewScale(Math.max(0.28, Math.min(1, (el.offsetWidth - 32) / 794)));
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [mobileTab]);

  // Identify user + fire session-start events on mount
  useEffect(() => {
    if (guestMode) return;
    identify(userId);
    const age = Date.now() - new Date(initialDoc.createdAt).getTime();
    if (age < 30_000) track("document_created", { documentType: "cv" });
    track("wizard_started");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasTrackedNameRef = useRef(false);
  const hasFiredConfettiRef = useRef(false);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      // Mark the timer as consumed so the unmount/unload flush guards below don't
      // fire a redundant duplicate save after this one has already run.
      autoSaveRef.current = undefined;
      if (guestMode) {
        const s = useEditorStore.getState();
        localStorage.setItem("sumaiya-guest-cv", JSON.stringify({
          cv: s.cv, title: s.title, templateId: s.templateId,
          primaryColor: s.primaryColor, fontFamily: s.fontFamily,
        }));
      } else {
        saveCv(initialDoc.id);
      }
    }, 2000);
  }, [initialDoc.id, guestMode, saveCv]);

  // Flash "Saved ✓" briefly whenever a save round-trip completes successfully,
  // and latch the persistent "saved" resting state.
  useEffect(() => {
    if (prevSavingRef.current && !isSaving && !saveError) {
      setSavedFlash(true);
      setEverSaved(true);
      const t = setTimeout(() => setSavedFlash(false), 2000);
      return () => clearTimeout(t);
    }
    prevSavingRef.current = isSaving;
  }, [isSaving, saveError]);

  // An existing signed-in document is already persisted when it loads.
  useEffect(() => {
    if (!guestMode && initialDoc.id) setEverSaved(true);
  }, [guestMode, initialDoc.id]);

  // Activation: fire once when the CV builder is opened, so the funnel shows how
  // many visitors actually reach the editor (the step between sign-in and export).
  useEffect(() => {
    track("cv_editor_opened", { guest: guestMode, templateId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush any pending auto-save immediately when the component unmounts (a
  // client-side nav — opening another document, going to the dashboard, etc.).
  // For signed-in users this is critical for TWO reasons:
  //   1. it saves the last <2s of edits that the debounce hadn't yet flushed, and
  //   2. it fires the save SYNCHRONOUSLY while the global store still holds THIS
  //      document's data — before the next editor mounts and calls
  //      setInitialState(), which would otherwise let a late timer write the next
  //      document's content back to this document's id (cross-doc corruption).
  useEffect(() => {
    return () => {
      if (!autoSaveRef.current) return;
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = undefined;
      if (guestMode) {
        const s = useEditorStore.getState();
        try {
          localStorage.setItem("sumaiya-guest-cv", JSON.stringify({
            cv: s.cv, title: s.title, templateId: s.templateId,
            primaryColor: s.primaryColor, fontFamily: s.fontFamily,
          }));
        } catch {}
      } else {
        saveCv(initialDoc.id, { keepalive: true });
      }
    };
  }, [guestMode, initialDoc.id, saveCv]);

  // Flush a pending autosave on real page unload (tab close / reload / hard
  // nav), which does NOT trigger React unmount. Guests persist to localStorage
  // (reliable); signed-in users fire the pending save best-effort. Without this,
  // edits made within the autosave debounce window are lost silently.
  useEffect(() => {
    const flush = () => {
      if (!autoSaveRef.current) return;
      clearTimeout(autoSaveRef.current);
      if (guestMode) {
        const s = useEditorStore.getState();
        try {
          localStorage.setItem("sumaiya-guest-cv", JSON.stringify({
            cv: s.cv, title: s.title, templateId: s.templateId,
            primaryColor: s.primaryColor, fontFamily: s.fontFamily,
          }));
        } catch {}
      } else {
        // keepalive so the request survives the imminent tab teardown.
        saveCv(initialDoc.id, { keepalive: true });
      }
    };
    window.addEventListener("beforeunload", flush);
    // visibilitychange fires more reliably than beforeunload on mobile.
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [guestMode, initialDoc.id, saveCv]);

  // Fire guest_try_start once when the guest editor mounts
  useEffect(() => {
    if (guestMode) {
      posthog.capture('guest_try_start', { templateId: initialDoc.templateId });
    }
  }, [guestMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadRef = useRef<(source?: ExportSource) => void>(() => {});
  const handleDownload = async (source: ExportSource = "topbar") => {
    // No guest wall here: a visitor who built a CV on /editor/cv/try gets the
    // FILE. The account ask moved to after delivery (see the success path
    // below) — asking first is what was costing us the whole funnel.
    if (!isPremium) { setShowUpgradeModal(true); return; }
    // Guests on a phone start on the Edit tab, where the Preview pane is
    // display:none — and the Preview is exactly what gets rendered to PDF.
    // Switch to it first so a mobile guest's first download isn't blank.
    if (guestMode) setMobileTab("preview");
    track("export_started", { source });
    posthog.capture('export_start', { source });
    setIsDownloading(true);
    setExportStepIdx(0);
    setExportOverlay("exporting");
    // Guarantee at least 1.4s experience so user sees ≥2 steps even on fast machines.
    // Promise.all means we don't pad beyond what the export actually needs.
    const MIN_MS = 1400;
    const timers = [900, 1800].map((delay, i) =>
      setTimeout(() => setExportStepIdx(i + 1), delay)
    );
    try {
      await Promise.all([exportPdf(previewRef, uiLang), new Promise<void>(r => setTimeout(r, MIN_MS))]);
      timers.forEach(clearTimeout);
      setExportStepIdx(EXPORT_STEPS.length - 1);
      await new Promise<void>(r => setTimeout(r, 400));
      setExportOverlay("success");
      haptics.success();
      // Delivery is done — NOW the guest gets the account ask, and not before.
      // It renders under the success overlay (later sibling, same z-index), so
      // they read "your CV is ready" first and get the prompt when they dismiss
      // it. Failure never reaches this line (see the catch below).
      if (guestMode) setSignUpPrompt("postExport");
      // Fire confetti celebration once per session on first successful download
      if (!hasFiredConfettiRef.current) {
        hasFiredConfettiRef.current = true;
        void confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DA4A1C', '#2A9D8F', '#E9C46A', '#264653'],
        });
        posthog.capture('export_success', { templateId: String(initialDoc.templateId) });
      }
      track("export_completed", { source, templateId });
      track("document_exported", { documentType: "cv", templateId });
      // Meta Pixel conversion — a completed CV download is the money moment ad
      // campaigns should optimize toward. Inert unless the pixel is configured.
      metaTrack("Lead", { content_name: "cv_download" });
      // Every download is a natural checkpoint — snapshot it so the user can
      // always get back to "the version I downloaded".
      void saveVersion({ silent: true });
    } catch (err) {
      timers.forEach(clearTimeout);
      setExportOverlay("error");
      track("export_failed", { source, error: err instanceof Error ? err.message : "unknown" });
    } finally {
      setIsDownloading(false);
    }
  };
  // Keep ref current so keyboard handler always calls latest closure
  handleDownloadRef.current = handleDownload;

  // Resume a download that a guest started before the sign-up wall. The
  // migration redirect appends ?download=pdf; switch to the Preview so the
  // labelled "Pakua PDF" button is right there even if the auto-run is blocked
  // by the browser, then fire the export once. Strip the param so a refresh
  // doesn't re-trigger it.
  useEffect(() => {
    if (guestMode) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("download") !== "pdf") return;
    params.delete("download");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    setMobileTab("preview");
    const t = setTimeout(() => handleDownloadRef.current("post-signup"), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestMode]);

  // ── Version history ────────────────────────────────────────────────────────
  // People ruin CVs (over-editing, a regretted AI rewrite). A version is a
  // snapshot of the full document payload; restoring loads it back and is itself
  // snapshotted first, so a restore is never destructive.
  const snapshotPayload = () => {
    const s = useEditorStore.getState();
    return { title: s.title, templateId: s.templateId, primaryColor: s.primaryColor, fontFamily: s.fontFamily, data: s.cv };
  };
  const loadVersions = async () => {
    if (guestMode) return;
    setVersionsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/versions/cv/${initialDoc.id}`, { headers });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id: string; title: string; createdAt: string }[] };
      if (json?.success) setVersions(json.data ?? []);
    } catch {} finally { setVersionsLoading(false); }
  };
  const saveVersion = async (opts?: { silent?: boolean }) => {
    if (guestMode) { if (!opts?.silent) setSignUpPrompt("account"); return; }
    if (!opts?.silent) setSavingVersion(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      await fetch("/api/versions", {
        method: "POST", headers,
        body: JSON.stringify({ documentId: initialDoc.id, documentType: "cv", title: useEditorStore.getState().title, snapshot: snapshotPayload() }),
      });
      if (!opts?.silent) { await loadVersions(); showToast(uiLang === "sw" ? "Toleo limehifadhiwa ✓" : "Version saved ✓"); }
    } catch {
      if (!opts?.silent) showToast(uiLang === "sw" ? "Imeshindwa kuhifadhi toleo." : "Couldn't save version.");
    } finally { if (!opts?.silent) setSavingVersion(false); }
  };
  const openHistory = () => {
    setDownloadMenu(false);
    // Version history lives on the server (and its snapshots are per-account),
    // so this one genuinely needs an account — the prompt IS the gate.
    if (guestMode) { setSignUpPrompt("account"); return; }
    setShowHistory(true);
    void loadVersions();
  };
  const restoreVersion = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/versions/item/${id}`, { headers });
      const json = await res.json().catch(() => ({})) as { data?: { snapshot?: { title?: string; templateId?: string; primaryColor?: string; fontFamily?: string; data?: unknown } } };
      const snap = json?.data?.snapshot;
      if (!snap) { showToast(uiLang === "sw" ? "Imeshindwa kurejesha." : "Couldn't restore."); return; }
      // Snapshot the current state first, so restoring is undoable too.
      await saveVersion({ silent: true });
      if (snap.title) setTitle(snap.title);
      if (snap.templateId) setTemplate(snap.templateId as Parameters<typeof setTemplate>[0]);
      if (snap.primaryColor) setPrimaryColor(snap.primaryColor);
      if (snap.fontFamily) setFontFamily(snap.fontFamily);
      if (snap.data) loadCvData(snap.data as Parameters<typeof loadCvData>[0]);
      triggerAutoSave();
      setShowHistory(false);
      showToast(uiLang === "sw" ? "Toleo limerejeshwa ✓" : "Version restored ✓");
    } catch { showToast(uiLang === "sw" ? "Imeshindwa kurejesha." : "Couldn't restore."); }
  };

  // Word (.docx) export — a genuine, ATS-optimised Word file built from the CV
  // data (single column, standard headings, real bullets; no image). Many ATS
  // and recruiters prefer/require .docx.
  const handleDownloadDocx = async () => {
    setDownloadMenu(false);
    if (!isPremium) { setShowUpgradeModal(true); return; }
    setIsDocx(true);
    try {
      const { downloadCvDocx } = await import("@/lib/docx");
      const base = (title || cvData.personal.fullName || "CV").replace(/\s+/g, "_");
      await downloadCvDocx(cvData, base, primaryColor);
      track("document_exported", { documentType: "cv", templateId });
      // File delivered — only now the (guest) account ask. The catch below
      // skips it, so a failed export never nags.
      if (guestMode) setSignUpPrompt("postExport");
      // Download log is per-account; a guest has no document id to log against
      // (their fixed path segment is "try", which is not a CV id).
      const cvId = typeof window !== "undefined" ? window.location.pathname.split("/").pop() : null;
      if (!guestMode && cvId && cvId !== "new") {
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        fetch(`/api/cv/${cvId}/download`, { method: "POST", headers }).catch(() => {});
      }
    } catch {
      showToast(uiLang === "sw" ? "Kutoa Word kumeshindwa. Jaribu tena." : "Word export failed. Please try again.");
    } finally {
      setIsDocx(false);
    }
  };

  // Plain-text (.txt) export — the leanest ATS-safe format.
  const handleDownloadText = () => {
    setDownloadMenu(false);
    if (!isPremium) { setShowUpgradeModal(true); return; }
    const base = (title || cvData.personal.fullName || "CV").replace(/\s+/g, "_");
    exportCvToText(cvData, `${base}.txt`, uiLang);
    track("document_exported", { documentType: "cv", templateId });
    // Delivered (the .txt is written synchronously by the anchor click above).
    if (guestMode) setSignUpPrompt("postExport");
  };

  // Native share — opens the OS share sheet (email, Google Drive, WhatsApp,
  // Telegram…) with the actual PDF attached, via the Web Share API. Falls back
  // to a normal download where files-sharing isn't supported (most desktops).
  const handleShare = async () => {
    setDownloadMenu(false);
    if (!isPremium) { setShowUpgradeModal(true); return; }
    if (!previewRef.current) return;
    const base = (title || cvData.personal.fullName || "CV").replace(/\s+/g, "_");
    setIsSharing(true);
    try {
      const blob = await renderElementToPdfBlob(previewRef.current, { filename: `${base}.pdf`, textLayer: buildCvText(cvData, uiLang) });
      const file = new File([blob], `${base}.pdf`, { type: "application/pdf" });
      const nav = navigator as unknown as { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: title || "My CV", text: "My CV — made with Sumaiya" });
      } else {
        // Desktop / no file-share support: fall back to a reliable download.
        // (Firefox ignores .click() on a detached anchor and cancels on
        // synchronous URL revoke — triggerBlobDownload handles both.)
        triggerBlobDownload(blob, `${base}.pdf`);
      }
      track("document_exported", { documentType: "cv", templateId });
      // Same rule as the other three outputs: the file/PDF is out, THEN the
      // account offer. A cancelled native share sheet throws AbortError and
      // lands in the catch below, so no prompt and no false success.
      if (guestMode) setSignUpPrompt("postExport");
      // Log the export so dashboard download stats count shares too (the plain
      // PDF-download path already logs via the store; this path didn't).
      if (!guestMode && initialDoc.id && initialDoc.id !== "new") {
        const h: Record<string, string> = {};
        if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
        void fetch(`/api/cv/${initialDoc.id}/download`, { method: "POST", headers: h }).catch(() => {});
      }
    } catch (err) {
      // User cancelling the native sheet throws AbortError — that's not an error.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        showToast(uiLang === "sw" ? "Imeshindwa kushiriki kwa sasa. Tumia Pakua badala yake." : "Couldn't share right now. Try Download instead.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        handleDownloadRef.current("shortcut");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Shared, non-destructive enhance: fetch a suggestion and stage it in the
  // preview (Apply/Discard/Regenerate) instead of overwriting the field.
  async function runEnhance(opts: { section: "summary" | "experience" | "skills"; content: string; jobTitle?: string; directive?: Directive; label: string; onApply: (v: string) => void }) {
    if (!opts.content.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/enhance", {
        method: "POST", headers,
        body: JSON.stringify({ section: opts.section, content: opts.content, jobTitle: opts.jobTitle || undefined, directive: opts.directive }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; data?: { enhanced?: string; source?: "ai" | "local" }; error?: string };
      if (data.success && data.data?.enhanced) {
        const enhancedText = data.data.enhanced;
        setEnhancePreview({
          label: opts.label,
          original: opts.content,
          enhanced: enhancedText,
          source: data.data.source,
          onApply: opts.onApply,
          regenerate: () => runEnhance(opts),
          // One-tap refine: re-run the AI on the CURRENT suggestion with an
          // adjustment (shorter, more ATS, translate…) and restage the preview.
          refine: (directive: Directive) => runEnhance({ ...opts, content: enhancedText, directive }),
        });
      } else {
        showToast(data.error || (uiLang === "sw" ? "Imeshindwa kuboresha kwa sasa. Jaribu tena." : "Couldn't enhance right now. Please try again."));
      }
    } catch {
      showToast(uiLang === "sw" ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }

  // When the summary is EMPTY, AI Enhance has nothing to rewrite — so instead
  // generate a summary from the candidate's own background (experience, skills,
  // education + target job title). This is what "where does it get the lead?"
  // needs: the input is your CV data, not an empty field.
  async function runGenerateSummary(roleHint?: string) {
    if (isEnhancing) return;
    const parts: string[] = [];
    for (const exp of cvData.experience) {
      const head = [exp.position, exp.company].filter(Boolean).join(" at ");
      const line = [head, exp.description].filter((s) => s && s.trim()).join(" — ");
      if (line.trim()) parts.push(line.trim());
    }
    const skills = cvData.skills.map((s) => s.name).filter(Boolean).join(", ");
    if (skills) parts.push(`Skills: ${skills}`);
    for (const edu of cvData.education) {
      const line = [edu.degree, edu.institution].filter(Boolean).join(", ");
      if (line.trim()) parts.push(line.trim());
    }
    // The profession is the strongest anchor for the summary, so seed the
    // background with the job title / role hint too — this lets the AI write a
    // profession-appropriate summary even before any experience is filled in.
    const jobTitle = cvData.personal.jobTitle?.trim() || roleHint?.trim() || "";
    if (jobTitle) parts.unshift(`Profession / role: ${jobTitle}`);
    const background = parts.join("\n").trim();
    if (!background) {
      showToast(uiLang === "sw"
        ? "Ongeza cheo cha kazi, uzoefu au ujuzi kwanza — kisha AI itaandika muhtasari wako."
        : "Add a job title, some experience or skills first — then AI can write your summary.");
      return;
    }
    setIsEnhancing(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/ai/summary", {
        method: "POST", headers,
        body: JSON.stringify({ jobTitle: jobTitle || undefined, background }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; data?: { summary?: string }; error?: string };
      if (data.success && data.data?.summary) {
        const generated = data.data.summary;
        setEnhancePreview({
          label: uiLang === "sw" ? "Muhtasari (mpya)" : "Professional summary (written for you)",
          original: "",
          enhanced: generated,
          source: "ai",
          onApply: (v) => { setSummary(v); triggerAutoSave(); },
          regenerate: () => runGenerateSummary(),
          // Let the user refine the freshly-written summary in one tap too.
          refine: (directive: Directive) => runEnhance({
            section: "summary",
            content: generated,
            jobTitle: cvData.personal.jobTitle || undefined,
            directive,
            label: uiLang === "sw" ? "Muhtasari" : "Professional summary",
            onApply: (v) => { setSummary(v); triggerAutoSave(); },
          }),
        });
      } else {
        showToast(data.error || (uiLang === "sw" ? "Imeshindwa kutengeneza muhtasari. Jaribu tena." : "Couldn't write a summary right now. Please try again."));
      }
    } catch {
      showToast(uiLang === "sw" ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }

  const handleEnhance = () => {
    const s = cvData.summary.trim();
    // A "summary" under ~30 chars is really just a job title or fragment (the UI
    // even prompts "herufi 30+"). Polishing it makes the AI invent a whole career
    // (a vet got a generic sales blurb). Generate a fresh, profession-anchored
    // summary from the role + background instead, passing the fragment as a hint.
    if (s.length >= 30) {
      runEnhance({ section: "summary", content: cvData.summary, jobTitle: cvData.personal.jobTitle || undefined, label: uiLang === "sw" ? "Muhtasari" : "Professional summary", onApply: (v) => { setSummary(v); triggerAutoSave(); } });
    } else {
      runGenerateSummary(s || undefined);
    }
  };

  // Translate the CV's prose fields (summary + experience descriptions) into the
  // other language. One call per field, sequential with progress; caps at 12 so a
  // huge CV can't spin forever. Names, titles and dates are left untouched.
  const translateTarget: "en" | "sw" = uiLang === "sw" ? "en" : "sw";
  const handleTranslate = async () => {
    if (translateProgress) return;

    // Build the work list: summary first, then experience descriptions.
    const jobs: Array<{ text: string; apply: (t: string) => void }> = [];
    if (cvData.summary.trim()) {
      jobs.push({ text: cvData.summary, apply: (t) => setSummary(t) });
    }
    for (const exp of cvData.experience) {
      if (exp.description.trim()) {
        const id = exp.id;
        jobs.push({ text: exp.description, apply: (t) => updateExperience(id, { description: t }) });
      }
    }
    const capped = jobs.slice(0, 12);
    if (capped.length === 0) { showToast(uiLang === "sw" ? "Hakuna cha kutafsiri bado — ongeza muhtasari au uzoefu kwanza." : "Nothing to translate yet — add a summary or experience first."); return; }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    try {
      // One batch call for all fields: a single quota unit, and atomic —
      // either every field is translated or none is (no half-translated doc).
      setTranslateProgress(uiLang === "sw" ? "Inatafsiri…" : "Translating…");
      const res = await fetch("/api/ai/translate", {
        method: "POST", headers,
        body: JSON.stringify({ texts: capped.map((j) => j.text), target: translateTarget }),
      });
      const data = await res.json().catch(() => ({})) as { success?: boolean; data?: { texts?: string[] }; error?: string };
      if (!res.ok || !data.success || !data.data?.texts || data.data.texts.length !== capped.length) {
        showToast(data.error || (uiLang === "sw" ? "Imeshindwa kutafsiri. Jaribu tena." : "Couldn't translate right now. Please try again."));
        return;
      }
      // Apply all at once, then save.
      data.data.texts.forEach((t, i) => capped[i].apply(t));
      triggerAutoSave();
    } finally {
      setTranslateProgress(null);
    }
  };

  const visibleData = {
    ...cvData,
    summary: (cvData.hiddenSections ?? []).includes("summary") ? "" : cvData.summary,
    experience: (cvData.hiddenSections ?? []).includes("experience") ? [] : cvData.experience,
    education: (cvData.hiddenSections ?? []).includes("education") ? [] : cvData.education,
    skills: (cvData.hiddenSections ?? []).includes("skills") ? [] : cvData.skills,
    projects: (cvData.hiddenSections ?? []).includes("projects") ? [] : (cvData.projects ?? []),
    languages: (cvData.hiddenSections ?? []).includes("languages") ? [] : cvData.languages,
    certifications: (cvData.hiddenSections ?? []).includes("certifications") ? [] : cvData.certifications,
    hobbies: (cvData.hiddenSections ?? []).includes("hobbies") ? "" : cvData.hobbies,
  };
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId] || NakuruTemplate;

  const goToStep = (n: number) => setWizardStep(Math.max(0, Math.min(WIZARD_STEPS.length - 1, n)));

  const personalFields: { key: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; maxLength?: number }[] = [
    { key: "fullName" },
    { key: "jobTitle" },
    { key: "email",    type: "email" },
    { key: "phone",    inputMode: "tel", maxLength: 20 },
    { key: "location" },
    { key: "linkedin", type: "url" },
    { key: "website",  type: "url" },
  ];

  // ── ADHD mechanics ────────────────────────────────────────────────────────────
  const { scores: completionScores, pct: completionPct } = computeCompletion(cvData);
  const { hot: isOnRoll, recordFill } = useStreak();
  useSectionConfetti(completionScores);

  // ── Wizard step completion scoring ────────────────────────────────────────────
  const stepScores: Record<string, number> = {
    personal:   completionScores.personal,
    experience: completionScores.experience,
    education:  completionScores.education,
    skills:     completionScores.skills,
    extras:     Math.min((cvData.languages.length > 0 ? 0.5 : 0) + (cvData.hobbies ? 0.5 : 0), 1),
  };

  const STEP_COLORS = ["#6366F1", "#0891B2", "#059669", "#D97706", "#8B5CF6"];

  // ── Wizard progress indicator ────────────────────────────────────────────────
  const StepProgress = () => (
    <div className="px-3 pt-3 pb-2 border-b border-border flex-shrink-0 bg-card">
      <div className="flex items-center">
        {WIZARD_STEPS.map(({ label, Icon: StepIcon, key }, i) => {
          const score = stepScores[key] ?? 0;
          const localLabel = uiLang === "sw"
            ? (({ personal: "Kuhusu", experience: "Kazi", education: "Elimu", skills: "Ujuzi", extras: "Nyongeza" } as Record<string, string>)[key] ?? label)
            : label;
          const isActive = i === wizardStep;
          const isDone = i < wizardStep;
          const stepColor = STEP_COLORS[i];
          const hasSomeContent = score > 0;
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => goToStep(i)}
                className="flex flex-col items-center gap-0.5 group relative"
                title={`${localLabel} — ${Math.round(score * 100)}% ${uiLang === "sw" ? "imejazwa" : "filled"}`}
              >
                {/* Completion ring behind the circle */}
                {hasSomeContent && !isDone && !isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full"
                    style={{ border: `2px solid ${stepColor}60` }} />
                )}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                  style={isActive
                    ? { backgroundColor: stepColor, borderColor: stepColor, color: "#fff", boxShadow: `0 0 0 3px ${stepColor}30` }
                    : isDone
                    ? { backgroundColor: stepColor, borderColor: stepColor, color: "#fff" }
                    : hasSomeContent
                    ? { backgroundColor: `${stepColor}12`, borderColor: `${stepColor}50`, color: stepColor }
                    : { backgroundColor: "#fff", borderColor: "#DBD1C2", color: "#9C9186" }
                  }
                >
                  {isDone ? <Icon name="check" size={14} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                </div>

                {/* Label + score micro-bar */}
                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                  <span className="text-[9px] font-semibold leading-none"
                    style={{ color: isActive ? stepColor : isDone ? stepColor : hasSomeContent ? "#6B5F54" : "#9C9186" }}>
                    {localLabel}
                  </span>
                  {/* Tiny fill bar under each label */}
                  <div className="w-6 h-0.5 bg-sand rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score * 100}%`, backgroundColor: score >= 1 ? stepColor : `${stepColor}80` }} />
                  </div>
                </div>
              </button>

              {/* Connector */}
              {i < WIZARD_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 mb-4 rounded overflow-hidden" style={{ backgroundColor: "#EFE7DA" }}>
                  <div className="h-full rounded transition-all duration-500"
                    style={{
                      width: i < wizardStep ? "100%" : "0%",
                      background: `linear-gradient(90deg, ${STEP_COLORS[i]}, ${STEP_COLORS[i + 1]})`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Wizard navigation footer ─────────────────────────────────────────────────
  const StepNav = () => (
    <div className="border-t border-border p-3 flex items-center justify-between flex-shrink-0 bg-card">
      <button
        onClick={() => goToStep(wizardStep - 1)}
        disabled={wizardStep === 0}
        className="flex items-center gap-1 text-sm text-text-muted hover:text-espresso disabled:opacity-30 transition px-3 py-2 rounded-input hover:bg-cream"
      >
        <Icon name="chevron-right" className="rotate-180" size={14} /> {uiLang === "sw" ? "Nyuma" : "Back"}
      </button>
      <div className="flex items-center gap-2">
        {WIZARD_STEPS[wizardStep]?.optional && (
          <button
            onClick={() => {
              if (wizardStep < WIZARD_STEPS.length - 1) goToStep(wizardStep + 1);
              else setMobileTab("preview");
            }}
            className="text-sm text-text-muted hover:text-espresso transition px-2 py-1"
          >
            {uiLang === "sw" ? "Ruka" : "Skip"}
          </button>
        )}
        <button
          onClick={() => {
            track("wizard_step_completed", { step: wizardStep, stepName: WIZARD_STEPS[wizardStep].key });
            if (wizardStep < WIZARD_STEPS.length - 1) {
              goToStep(wizardStep + 1);
            } else {
              setMobileTab("preview");
            }
          }}
          className="flex items-center gap-1.5 bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2 rounded-input shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] transition-all"
        >
          {wizardStep === WIZARD_STEPS.length - 1 ? (
            <><Eye className="w-4 h-4" /> {uiLang === "sw" ? "Ona CV" : "View CV"}</>
          ) : (
            <>{uiLang === "sw" ? "Endelea" : "Next"} <Icon name="chevron-right" size={14} /></>
          )}
        </button>
      </div>
    </div>
  );

  // ── Step 0: Personal ─────────────────────────────────────────────────────────
  const StepPersonal = () => {
  // Offer the guided path only while the CV is still essentially blank — once
  // there's real content, a "start over with Sumaiya" prompt is just noise.
  const cvIsBlank =
    !cvData.personal.fullName?.trim() &&
    !cvData.summary?.trim() &&
    cvData.experience.length === 0 &&
    cvData.education.length === 0;
  return (
    <div className="space-y-3">
      {cvIsBlank && (
        <Link
          href="/assistant"
          onClick={() => posthog.capture('editor_guided_intake_click', { guest: !!guestMode })}
          className="flex items-start gap-3 rounded-card border border-purple-glow/25 bg-purple-tint/50 p-3 hover:border-purple-glow/50 transition group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.12)", boxShadow: "0 0 12px rgba(124,58,237,0.2)" }}>
            <SumaiyaMark size={15} state="idle" className="text-purple-glow" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-espresso">
              {uiLang === "sw" ? "Hutaki kujaza fomu? Acha Sumaiya aandike CV yako" : "Don't want to fill in a form? Let Sumaiya write your CV"}
            </p>
            <p className="text-[11px] text-text-body leading-snug mt-0.5">
              {uiLang === "sw"
                ? "Jibu maswali machache kwa maneno yako mwenyewe — naye anaandika kila sehemu. Unarudi hapa kuhariri."
                : "Answer a few questions in your own words — she writes every section. You come back here to edit."}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-glow mt-1.5 group-hover:gap-1.5 transition-all">
              {uiLang === "sw" ? "Anza na Sumaiya" : "Start with Sumaiya"} →
            </span>
          </div>
        </Link>
      )}
      <p className="text-xs text-text-muted -mt-0.5 mb-1">{uiLang === "sw" ? "Jina lako linaonekana kwenye onyesho unapoandika." : "Your name appears in the preview as you type."}</p>
      {/* Name + title FIRST — user sees their data appear in the preview immediately */}
      <GlowField value={cvData.personal.fullName ?? ""}>
        <label className="block text-xs font-medium text-text-body mb-1">{uiLang === "sw" ? "Jina kamili" : "Full name"}</label>
        <input type="text" value={cvData.personal.fullName ?? ""}
          onChange={(e) => {
            if (!hasTrackedNameRef.current && e.target.value.trim()) {
              hasTrackedNameRef.current = true;
              track("first_name_entered");
            }
            if (!cvData.personal.fullName && e.target.value) recordFill();
            updatePersonal({ fullName: e.target.value });
            triggerAutoSave();
          }}
          className="w-full px-3 py-2 text-sm border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2"
          placeholder={uiLang === "sw" ? "mf. Alex Johnson" : "e.g. Alex Johnson"} autoFocus />
      </GlowField>
      <GlowField value={cvData.personal.jobTitle ?? ""}>
        <label className="block text-xs font-medium text-text-body mb-1">{uiLang === "sw" ? "Cheo cha kazi" : "Job title"}</label>
        <input type="text" value={cvData.personal.jobTitle ?? ""}
          onChange={(e) => { if (!cvData.personal.jobTitle && e.target.value) recordFill(); updatePersonal({ jobTitle: e.target.value }); triggerAutoSave(); }}
          className="w-full px-3 py-2 text-sm border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2"
          placeholder={uiLang === "sw" ? "mf. Mbunifu Bidhaa wa Ngazi ya Juu" : "e.g. Senior Product Designer"} />
      </GlowField>
      {/* Photo upload — secondary, not the opening ask */}
      <div>
        <label className="block text-xs font-medium text-text-body mb-2">{uiLang === "sw" ? "Picha ya wasifu" : "Profile photo"} <span className="text-text-muted font-normal">{uiLang === "sw" ? "(si lazima)" : "(optional)"}</span></label>
        <div className="flex items-center gap-3">
          {cvData.personal.photo ? (
            <img src={cvData.personal.photo} alt={uiLang === "sw" ? "Wasifu" : "Profile"} className="w-14 h-14 rounded-full object-cover border-2 border-ember/30 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-sand border-2 border-dashed border-border-input flex items-center justify-center flex-shrink-0">
              <span className="text-text-muted text-[10px] text-center leading-tight px-1">{uiLang === "sw" ? "Hakuna picha" : "No photo"}</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="cursor-pointer text-xs font-semibold text-ember-hover hover:text-ember transition">
              {cvData.personal.photo ? (uiLang === "sw" ? "Badilisha picha" : "Change photo") : (uiLang === "sw" ? "Pakia picha" : "Upload photo")}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { showToast(uiLang === "sw" ? "Picha lazima iwe chini ya 2MB." : "Photo must be under 2MB."); return; }
                  const reader = new FileReader();
                  reader.onload = (ev) => { updatePersonal({ photo: ev.target?.result as string }); triggerAutoSave(); };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {cvData.personal.photo && (
              <button onClick={() => { updatePersonal({ photo: undefined }); triggerAutoSave(); }}
                className="text-xs text-red-500 hover:text-red-600 transition text-left">{uiLang === "sw" ? "Ondoa" : "Remove"}</button>
            )}
            <span className="text-[10px] text-text-muted">{uiLang === "sw" ? "Kiwango cha juu 2MB · JPG / PNG / WebP" : "Max 2MB · JPG / PNG / WebP"}</span>
          </div>
        </div>
      </div>
      {/* Remaining contact fields */}
      {personalFields.filter(f => f.key !== "fullName" && f.key !== "jobTitle").map(({ key, type, inputMode, maxLength }) => {
        const raw = (cvData.personal as unknown as Record<string, string>)[key] ?? "";
        const invalid =
          (key === "email" && !isValidEmail(raw)) ||
          ((key === "website" || key === "linkedin") && !isValidUrl(raw));
        const label = key === "linkedin" ? "LinkedIn URL"
          : key === "website" ? (uiLang === "sw" ? "Tovuti URL" : "Website URL")
          : uiLang === "sw"
            ? (({ email: "Barua pepe", phone: "Simu", location: "Mahali" } as Record<string, string>)[key] ?? key.replace(/([A-Z])/g, " $1"))
            : key.replace(/([A-Z])/g, " $1");
        const placeholder = key === "linkedin" ? "https://linkedin.com/in/yourname" : key === "website" ? "https://yoursite.com" : label;
        return (
          <div key={key}>
            <label className="block text-xs font-medium text-text-body mb-1 capitalize">{label}</label>
            <input
              type={type || "text"}
              inputMode={inputMode}
              maxLength={maxLength}
              value={raw}
              onChange={(e) => {
                let val = e.target.value;
                if (key === "phone") val = enforcePhone(val);
                if (!raw && val) recordFill();
                updatePersonal({ [key]: val } as unknown as Partial<typeof cvData.personal>);
                triggerAutoSave();
              }}
              onBlur={(e) => {
                if (key === "website" || key === "linkedin") {
                  const fixed = enforceUrl(e.target.value);
                  if (fixed !== e.target.value) { updatePersonal({ [key]: fixed } as unknown as Partial<typeof cvData.personal>); triggerAutoSave(); }
                }
              }}
              className={inputCls(`${BASE_INPUT_MD}`, invalid && raw.length > 0)}
              placeholder={placeholder}
            />
            {invalid && raw.length > 0 && (
              <p className="text-[10px] text-red-500 mt-0.5">
                {key === "email" ? (uiLang === "sw" ? "Weka anwani sahihi ya barua pepe" : "Enter a valid email address") : (uiLang === "sw" ? "Weka URL sahihi (https://…)" : "Enter a valid URL (https://…)")}
              </p>
            )}
          </div>
        );
      })}
      <div>
        <label className="block text-xs font-medium text-text-body mb-1">
          {uiLang === "sw" ? "Muhtasari Wako" : "Professional Summary"}
          {pendingKeySet.has("summary") && (
            <button onClick={() => setShowConfirmPanel(true)}
              className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5 hover:bg-amber-200 transition align-middle"
              aria-label={uiLang === "sw" ? "Thibitisha muhtasari" : "Confirm summary"}>
              <AlertTriangle className="w-3 h-3" />
              {uiLang === "sw" ? "Haijathibitishwa" : "Unconfirmed"}
            </button>
          )}
        </label>
        <AutoTextarea value={cvData.summary}
          onChange={(e) => { setSummary(e.target.value); triggerAutoSave(); }}
          rows={4} className="w-full px-3 py-2 text-sm border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2 min-h-[92px]"
          placeholder={uiLang === "sw" ? "Muhtasari mfupi wa historia yako ya kikazi na uwezo wako muhimu..." : "Brief overview of your professional background and key strengths..."} />
        <div className="flex items-center justify-between mt-1">
          <button onClick={handleEnhance} disabled={isEnhancing || !cvData.summary.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-glow hover:text-purple-glow/80 disabled:opacity-40 transition">
            {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon name="spark" className="w-3 h-3" />}
            {uiLang === "sw" ? "Boresha na AI" : "Enhance with AI"}
          </button>
          <span className={`text-[10px] ${cvData.summary.length > 300 ? "text-red-500" : cvData.summary.length > 150 ? "text-ember-hover" : "text-text-muted"}`}>
            {cvData.summary.length}/300
          </span>
        </div>
      </div>
    </div>
  );
  };

  // ── Step 1: Experience ───────────────────────────────────────────────────────
  const StepExperience = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{uiLang === "sw" ? "Ongeza historia yako ya kazi, ya hivi karibuni kwanza." : "Add your work history, most recent first."}</p>
        <button onClick={() => { toggleSectionVisibility("experience"); triggerAutoSave(); }}
          aria-pressed={!(cvData.hiddenSections ?? []).includes("experience")}
          aria-label={uiLang === "sw" ? "Onyesha au ficha uzoefu kwenye CV" : "Toggle experience visibility"}
          className={`flex items-center gap-1 text-xs transition ${(cvData.hiddenSections ?? []).includes("experience") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}
          title={(cvData.hiddenSections ?? []).includes("experience") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}>
          {(cvData.hiddenSections ?? []).includes("experience") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderExperience, cvData.experience)}>
        <SortableContext items={cvData.experience.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {cvData.experience.map((exp) => (
            <SortableCard key={exp.id} id={exp.id}>
              {(drag) => (
                <div className="border border-border rounded-input p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span {...drag} className="cursor-grab active:cursor-grabbing touch-none">
                        <Icon name="menu" size={16} className="text-text-muted" />
                      </span>
                      <span className="text-xs font-semibold text-text-body truncate">{exp.company || (uiLang === "sw" ? "Uzoefu Mpya" : "New Experience")}</span>
                    </div>
                    <button onClick={() => { removeExperience(exp.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa uzoefu" : "Remove experience"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  {(["company", "position", "location"] as const).map((f) => (
                    <div key={f}>
                      <label className="block text-xs text-text-muted mb-1 capitalize">{uiLang === "sw" ? (({ company: "Kampuni", position: "Cheo", location: "Mahali" } as Record<string, string>)[f] ?? f.replace(/([A-Z])/g, " $1")) : f.replace(/([A-Z])/g, " $1")}</label>
                      <input value={exp[f] ?? ""} onChange={(e) => { updateExperience(exp.id, { [f]: e.target.value }); triggerAutoSave(); }}
                        className={`${BASE_INPUT_SM}`} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-text-muted mb-1">{uiLang === "sw" ? "Tarehe ya Kuanza" : "Start Date"}</label>
                    <DateInput value={exp.startDate ?? ""} onChange={(v) => { updateExperience(exp.id, { startDate: v }); triggerAutoSave(); }} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={exp.current}
                      onChange={(e) => { updateExperience(exp.id, { current: e.target.checked }); triggerAutoSave(); }}
                      className="w-3.5 h-3.5 rounded border-border-input text-ember focus:ring-ember/30" />
                    <span className="text-xs text-text-body">{uiLang === "sw" ? "Ninafanya kazi hapa sasa" : "I currently work here"}</span>
                  </label>
                  {!exp.current && (
                    <div>
                      <label className="block text-xs text-text-muted mb-1">{uiLang === "sw" ? "Tarehe ya Mwisho" : "End Date"}</label>
                      <DateInput value={exp.endDate ?? ""} onChange={(v) => { updateExperience(exp.id, { endDate: v }); triggerAutoSave(); }} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      {uiLang === "sw" ? "Maelezo" : "Description"}
                      {pendingKeySet.has(`${exp.id}.description`) && (
                        <button onClick={() => setShowConfirmPanel(true)}
                          className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5 hover:bg-amber-200 transition align-middle"
                          aria-label={uiLang === "sw" ? "Thibitisha maelezo" : "Confirm description"}>
                          <AlertTriangle className="w-3 h-3" />
                          {uiLang === "sw" ? "Haijathibitishwa" : "Unconfirmed"}
                        </button>
                      )}
                    </label>
                    <AutoTextarea value={exp.description} onChange={(e) => { updateExperience(exp.id, { description: e.target.value }); triggerAutoSave(); }}
                      rows={3} className="w-full px-2.5 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2 min-h-[64px]"
                      placeholder={uiLang === "sw" ? "• Eleza majukumu yako muhimu na mafanikio yako..." : "• Describe your key responsibilities and achievements..."} />
                    {exp.description.trim() && (
                      <button
                        onClick={() => runEnhance({
                          section: "experience",
                          content: exp.description,
                          jobTitle: exp.position || cvData.personal.jobTitle || undefined,
                          label: uiLang === "sw" ? "Maelezo ya kazi" : "Experience description",
                          onApply: (v) => { updateExperience(exp.id, { description: v }); triggerAutoSave(); },
                        })}
                        disabled={isEnhancing}
                        className="mt-1 flex items-center gap-1 text-[10px] font-medium text-purple-glow hover:text-purple-glow/80 disabled:opacity-40 transition">
                        {isEnhancing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Icon name="spark" size={10} />}
                        {uiLang === "sw" ? "Boresha na AI" : "Improve with AI"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={() => { addExperience(); triggerAutoSave(); }}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-ember hover:bg-ember-tint/30 rounded-input py-3 text-sm font-medium text-text-muted hover:text-ember transition">
        <Icon name="plus" size={16} /> {uiLang === "sw" ? "Ongeza Uzoefu" : "Add Experience"}
      </button>
    </div>
  );

  // ── Step 2: Education ────────────────────────────────────────────────────────
  const StepEducation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{uiLang === "sw" ? "Ongeza elimu yako." : "Add your academic background."}</p>
        <button onClick={() => { toggleSectionVisibility("education"); triggerAutoSave(); }}
          aria-pressed={!(cvData.hiddenSections ?? []).includes("education")}
          aria-label={uiLang === "sw" ? "Onyesha au ficha elimu kwenye CV" : "Toggle education visibility"}
          title={(cvData.hiddenSections ?? []).includes("education") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
          className={`flex items-center gap-1 text-xs transition ${(cvData.hiddenSections ?? []).includes("education") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
          {(cvData.hiddenSections ?? []).includes("education") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderEducation, cvData.education)}>
        <SortableContext items={cvData.education.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {cvData.education.map((edu) => (
            <SortableCard key={edu.id} id={edu.id}>
              {(drag) => (
                <div className="border border-border rounded-input p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span {...drag} className="cursor-grab active:cursor-grabbing touch-none">
                        <Icon name="menu" size={16} className="text-text-muted" />
                      </span>
                      <span className="text-xs font-semibold text-text-body truncate">{edu.institution || (uiLang === "sw" ? "Elimu Mpya" : "New Education")}</span>
                    </div>
                    <button onClick={() => { removeEducation(edu.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa elimu" : "Remove education"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  {(["institution", "degree", "field", "grade"] as const).map((f) => (
                    <div key={f}>
                      <label className="block text-xs text-text-muted mb-1 capitalize">{uiLang === "sw" ? (({ institution: "Taasisi", degree: "Shahada", field: "Fani", grade: "Alama" } as Record<string, string>)[f] ?? f) : f}</label>
                      <input value={edu[f] ?? ""} onChange={(e) => { updateEducation(edu.id, { [f]: e.target.value }); triggerAutoSave(); }}
                        className={`${BASE_INPUT_SM}`} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-text-muted mb-1">{uiLang === "sw" ? "Tarehe ya Kuanza" : "Start Date"}</label>
                    <DateInput value={edu.startDate ?? ""} onChange={(v) => { updateEducation(edu.id, { startDate: v }); triggerAutoSave(); }} />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">{uiLang === "sw" ? "Tarehe ya Mwisho" : "End Date"}</label>
                    <DateInput value={edu.endDate ?? ""} onChange={(v) => { updateEducation(edu.id, { endDate: v }); triggerAutoSave(); }} />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">{uiLang === "sw" ? "Maelezo" : "Description"}</label>
                    <AutoTextarea value={edu.description ?? ""} onChange={(e) => { updateEducation(edu.id, { description: e.target.value }); triggerAutoSave(); }}
                      rows={2} className="w-full px-2.5 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2 min-h-[44px]"
                      placeholder={uiLang === "sw" ? "Masomo husika, mafanikio..." : "Relevant coursework, achievements..."} />
                  </div>
                </div>
              )}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={() => { addEducation(); triggerAutoSave(); }}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-ember hover:bg-ember-tint/30 rounded-input py-3 text-sm font-medium text-text-muted hover:text-ember transition">
        <Icon name="plus" size={16} /> {uiLang === "sw" ? "Ongeza Elimu" : "Add Education"}
      </button>
    </div>
  );

  // ── Step 3: Skills + Languages ───────────────────────────────────────────────
  const StepSkills = () => (
    <div className="space-y-6">
      {/* Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-text-body uppercase tracking-wider">{uiLang === "sw" ? "Ujuzi" : "Skills"}</h4>
          <button onClick={() => { toggleSectionVisibility("skills"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("skills")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha ujuzi kwenye CV" : "Toggle skills visibility"}
            title={(cvData.hiddenSections ?? []).includes("skills") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`text-xs transition ${(cvData.hiddenSections ?? []).includes("skills") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("skills") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderSkills, cvData.skills)}>
          <SortableContext items={cvData.skills.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.skills.map((skill) => (
              <SortableCard key={skill.id} id={skill.id}>
                {(drag) => (
                  <div className="flex items-center gap-2">
                    <span {...drag} className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                      <Icon name="menu" size={16} className="text-text-muted" />
                    </span>
                    <input value={skill.name} onChange={(e) => { updateSkill(skill.id, { name: e.target.value }); triggerAutoSave(); }}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2" placeholder={uiLang === "sw" ? "Jina la ujuzi" : "Skill name"} />
                    <select value={skill.level} onChange={(e) => { updateSkill(skill.id, { level: Number(e.target.value) as 1|2|3|4|5 }); triggerAutoSave(); }}
                      className="px-2 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2">
                      {[1,2,3,4,5].map((l) => <option key={l} value={l}>{l}/5</option>)}
                    </select>
                    <button onClick={() => { removeSkill(skill.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa ujuzi" : "Remove skill"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition flex-shrink-0">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={() => { addSkill(); triggerAutoSave(); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2.5 text-sm font-medium text-text-body hover:text-brand-600 transition">
          <Plus className="w-4 h-4" /> {uiLang === "sw" ? "Ongeza Ujuzi" : "Add Skill"}
        </button>
        {cvData.skills.length < 8 && (
          <div>
            <p className="text-[10px] text-text-muted mb-2">{uiLang === "sw" ? "Ujuzi wa kawaida — gusa kuongeza:" : "Common skills — tap to add:"}</p>
            <div className="flex flex-wrap gap-1.5">
              {["Microsoft Office", "Project Management", "Data Analysis", "Communication", "Python", "JavaScript", "SQL", "Figma", "Leadership", "Excel", "Marketing", "Customer Service"]
                .filter(s => !cvData.skills.some(sk => sk.name.toLowerCase() === s.toLowerCase()))
                .slice(0, 8)
                .map(s => (
                  <button key={s} onClick={() => {
                    addSkill();
                    const newSkill = useEditorStore.getState().cv.skills.at(-1);
                    if (newSkill) { updateSkill(newSkill.id, { name: s, level: 3 }); triggerAutoSave(); }
                  }}
                    className="text-[10px] bg-sand-2 hover:bg-brand-100 hover:text-brand-700 text-text-body px-2.5 py-1 rounded-full transition font-medium">
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-sand-2" />

      {/* Languages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-espresso uppercase tracking-wider">{uiLang === "sw" ? "Lugha" : "Languages"}</h4>
          <button onClick={() => { toggleSectionVisibility("languages"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("languages")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha lugha kwenye CV" : "Toggle languages visibility"}
            title={(cvData.hiddenSections ?? []).includes("languages") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`text-xs transition ${(cvData.hiddenSections ?? []).includes("languages") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("languages") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderLanguages, cvData.languages)}>
          <SortableContext items={cvData.languages.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.languages.map((lang) => (
              <SortableCard key={lang.id} id={lang.id}>
                {(drag) => (
                  <div className="flex items-center gap-2">
                    <span {...drag} className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                      <GripVertical className="w-4 h-4 text-text-muted/50" />
                    </span>
                    <input value={lang.name} onChange={(e) => { updateLanguage(lang.id, { name: e.target.value }); triggerAutoSave(); }}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2" placeholder={uiLang === "sw" ? "Lugha" : "Language"} />
                    <select value={lang.proficiency} onChange={(e) => { updateLanguage(lang.id, { proficiency: e.target.value as "Native"|"Fluent"|"Advanced"|"Intermediate"|"Basic" }); triggerAutoSave(); }}
                      className="px-2 py-1.5 text-xs border border-border-input rounded-input bg-sand-2 focus:outline-none focus:shadow-focus-ember focus:border-ember">
                      {["Native","Fluent","Advanced","Intermediate","Basic"].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={() => { removeLanguage(lang.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa lugha" : "Remove language"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={() => { addLanguage(); triggerAutoSave(); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2.5 text-sm font-medium text-text-body hover:text-brand-600 transition">
          <Plus className="w-4 h-4" /> {uiLang === "sw" ? "Ongeza Lugha" : "Add Language"}
        </button>
      </div>
    </div>
  );

  // ── Step 4: Extras ───────────────────────────────────────────────────────────
  const StepExtras = () => (
    <div className="space-y-6">
      <p className="text-xs text-text-muted bg-sand rounded-lg px-3 py-2">{uiLang === "sw" ? "Sehemu hizi si za lazima. Ruka kama huzihitaji." : "These sections are optional. Skip if you don't need them."}</p>

      {/* Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-espresso uppercase tracking-wider">{uiLang === "sw" ? "Miradi" : "Projects"}</h4>
          <button onClick={() => { toggleSectionVisibility("projects"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("projects")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha miradi kwenye CV" : "Toggle projects visibility"}
            title={(cvData.hiddenSections ?? []).includes("projects") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`transition ${(cvData.hiddenSections ?? []).includes("projects") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("projects") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[11px] text-text-muted -mt-1">{uiLang === "sw" ? "Nzuri kwa wahitimu: miradi ya chuo, ya binafsi au ya kujitolea." : "Great for graduates: academic, personal or volunteer projects."}</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderProjects, cvData.projects ?? [])}>
          <SortableContext items={(cvData.projects ?? []).map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {(cvData.projects ?? []).map((proj) => (
              <SortableCard key={proj.id} id={proj.id}>
                {(drag) => (
                  <div className="border border-border rounded-xl p-3 space-y-2.5 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span {...drag} className="cursor-grab active:cursor-grabbing touch-none">
                          <GripVertical className="w-4 h-4 text-text-muted/50" />
                        </span>
                        <span className="text-xs font-semibold text-espresso truncate">{proj.name || (uiLang === "sw" ? "Mradi Mpya" : "New Project")}</span>
                      </div>
                      <button onClick={() => { removeProject(proj.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa mradi" : "Remove project"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Jina la mradi" : "Project name"}</label>
                      <input value={proj.name} onChange={(e) => { updateProject(proj.id, { name: e.target.value }); triggerAutoSave(); }} className={BASE_INPUT_SM} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Nafasi yako" : "Your role"}</label>
                        <input value={proj.role ?? ""} onChange={(e) => { updateProject(proj.id, { role: e.target.value }); triggerAutoSave(); }} className={BASE_INPUT_SM} />
                      </div>
                      <div>
                        <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Mwaka" : "Year"}</label>
                        <DateInput value={proj.date ?? ""} onChange={(v) => { updateProject(proj.id, { date: v }); triggerAutoSave(); }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Maelezo" : "Description"}</label>
                      <textarea value={proj.description} onChange={(e) => { updateProject(proj.id, { description: e.target.value }); triggerAutoSave(); }}
                        rows={3} placeholder={uiLang === "sw" ? "Ulichofanya na matokeo yake…" : "What you did and the result…"}
                        className={`${BASE_INPUT_SM} resize-none leading-relaxed`} />
                    </div>
                    <div>
                      <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Kiungo (si lazima)" : "Link (optional)"}</label>
                      <input
                        type="url"
                        value={proj.url ?? ""}
                        onChange={(e) => { updateProject(proj.id, { url: e.target.value }); triggerAutoSave(); }}
                        onBlur={(e) => { const fixed = enforceUrl(e.target.value); if (fixed !== e.target.value) { updateProject(proj.id, { url: fixed }); triggerAutoSave(); } }}
                        placeholder="https://..."
                        className={inputCls(`${BASE_INPUT_SM}`, !isValidUrl(proj.url ?? "") && (proj.url ?? "").length > 0)}
                      />
                      {!isValidUrl(proj.url ?? "") && (proj.url ?? "").length > 0 && (
                        <p className="text-[10px] text-red-500 mt-0.5">{uiLang === "sw" ? "Weka URL sahihi (https://…)" : "Enter a valid URL (https://…)"}</p>
                      )}
                    </div>
                  </div>
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={() => { addProject(); triggerAutoSave(); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2.5 text-sm font-medium text-text-body hover:text-brand-600 transition">
          <Plus className="w-4 h-4" /> {uiLang === "sw" ? "Ongeza Mradi" : "Add Project"}
        </button>
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-espresso uppercase tracking-wider">{uiLang === "sw" ? "Vyeti" : "Certifications"}</h4>
          <button onClick={() => { toggleSectionVisibility("certifications"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("certifications")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha vyeti kwenye CV" : "Toggle certifications visibility"}
            title={(cvData.hiddenSections ?? []).includes("certifications") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`transition ${(cvData.hiddenSections ?? []).includes("certifications") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("certifications") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderCertifications, cvData.certifications)}>
          <SortableContext items={cvData.certifications.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.certifications.map((cert) => (
              <SortableCard key={cert.id} id={cert.id}>
                {(drag) => (
                  <div className="border border-border rounded-xl p-3 space-y-2.5 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span {...drag} className="cursor-grab active:cursor-grabbing touch-none">
                          <GripVertical className="w-4 h-4 text-text-muted/50" />
                        </span>
                        <span className="text-xs font-semibold text-espresso truncate">{cert.name || (uiLang === "sw" ? "Cheti Kipya" : "New Certification")}</span>
                      </div>
                      <button onClick={() => { removeCertification(cert.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa cheti" : "Remove certification"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {(["name", "issuer"] as const).map((f) => (
                      <div key={f}>
                        <label className="block text-xs text-text-body mb-1 capitalize">{uiLang === "sw" ? (({ name: "Jina", issuer: "Mtoaji" } as Record<string, string>)[f] ?? f) : f}</label>
                        <input value={cert[f] ?? ""} onChange={(e) => { updateCertification(cert.id, { [f]: e.target.value }); triggerAutoSave(); }}
                          className={BASE_INPUT_SM} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Tarehe" : "Date"}</label>
                      <DateInput value={cert.date ?? ""} onChange={(v) => { updateCertification(cert.id, { date: v }); triggerAutoSave(); }} />
                    </div>
                    <div>
                      <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "URL ya Cheti" : "Certificate URL"}</label>
                      <input
                        type="url"
                        value={cert.url ?? ""}
                        onChange={(e) => { updateCertification(cert.id, { url: e.target.value }); triggerAutoSave(); }}
                        onBlur={(e) => { const fixed = enforceUrl(e.target.value); if (fixed !== e.target.value) { updateCertification(cert.id, { url: fixed }); triggerAutoSave(); } }}
                        placeholder="https://..."
                        className={inputCls(`${BASE_INPUT_SM}`, !isValidUrl(cert.url ?? "") && (cert.url ?? "").length > 0)}
                      />
                      {!isValidUrl(cert.url ?? "") && (cert.url ?? "").length > 0 && (
                        <p className="text-[10px] text-red-500 mt-0.5">{uiLang === "sw" ? "Weka URL sahihi (https://…)" : "Enter a valid URL (https://…)"}</p>
                      )}
                    </div>
                  </div>
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={() => { addCertification(); triggerAutoSave(); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2.5 text-sm font-medium text-text-body hover:text-brand-600 transition">
          <Plus className="w-4 h-4" /> {uiLang === "sw" ? "Ongeza Cheti" : "Add Certification"}
        </button>
      </div>

      {/* Referees */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-espresso uppercase tracking-wider">{uiLang === "sw" ? "Wadhamini" : "Referees"}</h4>
          <button onClick={() => { toggleSectionVisibility("referees"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("referees")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha wadhamini kwenye CV" : "Toggle referees visibility"}
            title={(cvData.hiddenSections ?? []).includes("referees") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`transition ${(cvData.hiddenSections ?? []).includes("referees") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("referees") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEndHandler(reorderReferees, cvData.referees)}>
          <SortableContext items={cvData.referees.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.referees.map((ref) => (
              <SortableCard key={ref.id} id={ref.id}>
                {(drag) => (
                  <div className="border border-border rounded-xl p-3 space-y-2.5 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span {...drag} className="cursor-grab active:cursor-grabbing touch-none">
                          <GripVertical className="w-4 h-4 text-text-muted/50" />
                        </span>
                        <span className="text-xs font-semibold text-espresso truncate">{ref.name || (uiLang === "sw" ? "Mtazamaji Mpya" : "New Referee")}</span>
                      </div>
                      <button onClick={() => { removeReferee(ref.id); triggerAutoSave(); }} aria-label={uiLang === "sw" ? "Ondoa mdhamini" : "Remove referee"} className="p-2 -m-1 text-text-muted hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {(["name", "title", "company"] as const).map((f) => (
                      <div key={f}>
                        <label className="block text-xs text-text-body mb-1 capitalize">{uiLang === "sw" ? (({ name: "Jina", title: "Cheo", company: "Kampuni" } as Record<string, string>)[f] ?? f) : f}</label>
                        <input value={ref[f] ?? ""} onChange={(e) => { updateReferee(ref.id, { [f]: e.target.value }); triggerAutoSave(); }}
                          className={BASE_INPUT_SM} />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Barua pepe" : "Email"}</label>
                        <input type="email" value={ref.email ?? ""} onChange={(e) => { updateReferee(ref.id, { email: e.target.value }); triggerAutoSave(); }}
                          className={BASE_INPUT_SM} />
                      </div>
                      <div>
                        <label className="block text-xs text-text-body mb-1">{uiLang === "sw" ? "Simu" : "Phone"}</label>
                        <input type="tel" value={ref.phone ?? ""} onChange={(e) => { updateReferee(ref.id, { phone: e.target.value }); triggerAutoSave(); }}
                          className={BASE_INPUT_SM} />
                      </div>
                    </div>
                  </div>
                )}
              </SortableCard>
            ))}
          </SortableContext>
        </DndContext>
        <button onClick={() => { addReferee(); triggerAutoSave(); }}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-brand-400 hover:bg-brand-50 rounded-xl py-2.5 text-sm font-medium text-text-body hover:text-brand-600 transition">
          <Plus className="w-4 h-4" /> {uiLang === "sw" ? "Ongeza Mdhamini" : "Add Referee"}
        </button>
      </div>

      <div className="h-px bg-sand-2" />

      {/* Hobbies */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-espresso uppercase tracking-wider">{uiLang === "sw" ? "Mapendeleo & Shughuli" : "Hobbies & Interests"}</h4>
          <button onClick={() => { toggleSectionVisibility("hobbies"); triggerAutoSave(); }}
            aria-pressed={!(cvData.hiddenSections ?? []).includes("hobbies")}
            aria-label={uiLang === "sw" ? "Onyesha au ficha mambo unayopenda kwenye CV" : "Toggle hobbies visibility"}
            title={(cvData.hiddenSections ?? []).includes("hobbies") ? (uiLang === "sw" ? "Onyesha kwenye CV" : "Show in CV") : (uiLang === "sw" ? "Ficha kutoka CV" : "Hide from CV")}
            className={`transition ${(cvData.hiddenSections ?? []).includes("hobbies") ? "text-text-muted/50" : "text-text-muted hover:text-text-body"}`}>
            {(cvData.hiddenSections ?? []).includes("hobbies") ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <AutoTextarea value={cvData.hobbies} onChange={(e) => { setHobbies(e.target.value); triggerAutoSave(); }}
          rows={4} className="w-full px-3 py-2 text-sm border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2 min-h-[80px]"
          placeholder={uiLang === "sw" ? "mf. Upigaji picha, Open-source, Chess, Kupanda milima..." : "e.g. Photography, Open-source, Chess, Hiking..."} />
        <p className="text-[10px] text-text-muted">{uiLang === "sw" ? "Tenganisha kwa mkato au mistari mipya" : "Separate with commas or new lines"}</p>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-dvh bg-sand/50 overflow-hidden">
      {signUpPrompt && <SignUpModal intent={signUpPrompt} onClose={() => setSignUpPrompt(null)} sw={uiLang === "sw"} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} sw={uiLang === "sw"} />}
      {showShareModal && !guestMode && (
        <ShareCvModal
          cvId={initialDoc.id}
          accessToken={accessToken}
          sw={uiLang === "sw"}
          initialIsPublic={Boolean((initialDoc as { isPublic?: boolean }).isPublic)}
          initialSlug={(initialDoc as { publicSlug?: string | null }).publicSlug ?? null}
          initialShowContact={(initialDoc as { publicShowContact?: boolean }).publicShowContact ?? true}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center gap-2 flex-shrink-0">
              <History className="w-4 h-4 text-ember" />
              <span className="text-sm font-bold text-espresso">{uiLang === "sw" ? "Historia ya matoleo" : "Version history"}</span>
              <button onClick={() => setShowHistory(false)} className="ml-auto text-text-muted hover:text-espresso p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-3 border-b border-border flex-shrink-0">
              <button
                onClick={() => saveVersion()}
                disabled={savingVersion}
                className="w-full flex items-center justify-center gap-2 bg-ember hover:bg-ember-hover text-cream text-sm font-semibold px-4 py-2.5 rounded-input-lg transition disabled:opacity-60"
              >
                {savingVersion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {uiLang === "sw" ? "Hifadhi toleo la sasa" : "Save current version"}
              </button>
              <p className="text-[11px] text-text-muted mt-1.5 text-center">{uiLang === "sw" ? "Kila unapopakua CV, toleo huhifadhiwa kiotomatiki." : "Every download is saved automatically too."}</p>
            </div>
            <div className="p-3 flex-1 min-h-0 overflow-y-auto">
              {versionsLoading ? (
                <div className="flex items-center justify-center py-8 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : versions.length === 0 ? (
                <p className="text-center text-xs text-text-muted py-8">{uiLang === "sw" ? "Bado hakuna matoleo yaliyohifadhiwa. Hifadhi moja hapo juu au pakua CV yako." : "No saved versions yet. Save one above, or download your CV."}</p>
              ) : (
                <ul className="space-y-1.5">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 rounded-input border border-border bg-sand-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-espresso truncate">{v.title || (uiLang === "sw" ? "CV" : "CV")}</p>
                        <p className="text-[10px] text-text-muted">{formatTimeAgo(v.createdAt, uiLang)}</p>
                      </div>
                      <button
                        onClick={() => restoreVersion(v.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-ember-hover hover:text-ember border border-ember/30 hover:bg-ember-tint/20 px-2.5 py-1.5 rounded-pill transition shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" /> {uiLang === "sw" ? "Rejesha" : "Restore"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-destructive AI enhance preview */}
      {enhancePreview && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setEnhancePreview(null)}>
          <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="spark" size={16} className={enhancePreview.source === "local" ? "text-text-muted" : "text-purple-glow"} />
                <span className="text-sm font-bold text-espresso">
                  {enhancePreview.source === "local"
                    ? (uiLang === "sw" ? "Usafishaji wa msingi" : "Basic cleanup")
                    : (uiLang === "sw" ? "Pendekezo la AI" : "AI suggestion")}
                </span>
                <span className="text-[11px] text-text-muted">· {enhancePreview.label}</span>
                <button onClick={() => setEnhancePreview(null)} className="ml-auto text-text-muted hover:text-espresso p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                {enhancePreview.source === "local"
                  ? (uiLang === "sw"
                      ? "AI haipatikani kwa sasa, kwa hivyo tumefanya usafi mdogo wa maandishi tu. Kagua kisha uweke ukipenda."
                      : "AI is unavailable right now, so this is a light tidy-up only — not an AI rewrite. Review, then apply if you like it.")
                  : (uiLang === "sw"
                      ? "AI imeandika upya maandishi yako yawe wazi na yenye nguvu zaidi. Kagua kisha uweke ukipenda."
                      : "AI rewrote your text to be clearer and more impactful. Review, then apply if you like it.")}
              </p>
            </div>
            <div className="p-5 space-y-3 flex-1 min-h-0 overflow-y-auto">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{uiLang === "sw" ? "Ya sasa" : "Current"}</p>
                <div className="text-xs leading-relaxed text-text-body bg-sand-2 border border-border rounded-input px-3 py-2 whitespace-pre-wrap">{enhancePreview.original}</div>
              </div>
              <WhatChanged
                before={enhancePreview.original}
                after={enhancePreview.enhanced}
                sw={uiLang === "sw"}
                isLocal={enhancePreview.source === "local"}
              />
              {enhancePreview.source !== "local" && enhancePreview.refine && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">{uiLang === "sw" ? "Rekebisha kwa mguso mmoja" : "Adjust with one tap"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REFINE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => enhancePreview.refine?.(opt.id)}
                        disabled={isEnhancing}
                        className="text-[11px] font-medium px-2.5 py-1.5 rounded-pill border border-border-input text-text-body hover:border-ember hover:text-ember hover:bg-ember-tint/20 transition disabled:opacity-50"
                      >
                        {uiLang === "sw" ? opt.sw : opt.en}
                      </button>
                    ))}
                    <button
                      onClick={() => enhancePreview.refine?.(uiLang === "sw" ? "en" : "sw")}
                      disabled={isEnhancing}
                      className="text-[11px] font-medium px-2.5 py-1.5 rounded-pill border border-border-input text-text-body hover:border-ember hover:text-ember hover:bg-ember-tint/20 transition disabled:opacity-50"
                    >
                      {uiLang === "sw" ? "Kwa Kiingereza" : "Kwa Kiswahili"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-5 py-3.5 border-t border-border flex-shrink-0 flex-wrap">
              <Button onClick={() => { enhancePreview.onApply(enhancePreview.enhanced); setEnhancePreview(null); }} size="sm" className="flex-1">
                <Icon name="check" size={14} /> {uiLang === "sw" ? "Tumia" : "Apply"}
              </Button>
              <Button onClick={() => enhancePreview.regenerate()} disabled={isEnhancing} variant="secondary" size="sm">
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon name="spark" size={14} />}
                {uiLang === "sw" ? "Tengeneza tena" : "Regenerate"}
              </Button>
              <Button onClick={() => setEnhancePreview(null)} variant="ghost" size="sm">{uiLang === "sw" ? "Acha" : "Discard"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Unified toast (errors + success) — replaces alert() */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] text-cream text-xs font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 max-w-[90vw] ${toast.tone === "success" ? "bg-pine" : "bg-espresso"}`} role="alert">
          {toast.tone === "success" ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
          <span className="truncate">{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-cream/70 hover:text-cream shrink-0 p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 focus-visible:ring-offset-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {exportOverlay !== "hidden" && (
        <ExportOverlay state={exportOverlay} stepIdx={exportStepIdx} onClose={() => setExportOverlay("hidden")} onRetry={() => handleDownload("retry")} name={cvData.personal.fullName ?? undefined} sw={uiLang === "sw"} onShareOnline={guestMode ? undefined : () => { setExportOverlay("hidden"); setShowShareModal(true); }} onGenerateCoverLetter={generateCoverLetterFromExport} onTrackApplication={trackApplicationFromExport} nextBusy={exportNextBusy} />
      )}
      {showTemplateModal && (
        <TemplateModal
          currentTemplateId={templateId}
          primaryColor={primaryColor}
          onSelect={(id) => { setTemplate(id); triggerAutoSave(); track("template_changed", { templateId: id }); }}
          onClose={() => setShowTemplateModal(false)}
          sw={uiLang === "sw"}
          templateHistory={Array.isArray(initialDoc.templateHistory) ? (initialDoc.templateHistory as string[]) : []}
        />
      )}

      {/* TOP BAR — Warm Confidence Espresso Toolbar */}
      <div className="bg-espresso border-b border-espresso-line text-cream h-14 flex items-center px-4 gap-2 z-20 flex-shrink-0">
        {/* Left: back + doc identity */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href={backHref ?? (guestMode ? "/" : "/dashboard")}
            className="flex items-center gap-1 text-cream/60 hover:text-cream transition text-sm shrink-0"
            aria-label={t(uiLang, "editor.back")}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t(uiLang, "editor.back")}</span>
          </Link>
          <div className="h-5 w-px bg-espresso-line flex-shrink-0 hidden sm:block" />
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); triggerAutoSave(); }}
            className="text-sm font-semibold text-cream bg-transparent hover:bg-espresso-2 focus:bg-espresso-2 focus:outline-none rounded-md px-1.5 py-0.5 min-w-0 flex-1 transition-colors placeholder:text-cream/40"
            placeholder={uiLang === "sw" ? "CV Yangu" : "My CV"}
          />
          {/* Save status — visible on mobile too (label collapses on small
              screens), with a persistent resting state and a visible failure. */}
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-cream/50 flex-shrink-0" title={uiLang === "sw" ? "Inahifadhi…" : "Saving…"}>
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span className="hidden sm:inline">{uiLang === "sw" ? "Inahifadhi…" : "Saving…"}</span>
            </span>
          ) : saveError ? (
            <button
              onClick={() => { guestMode ? triggerAutoSave() : saveCv(initialDoc.id); }}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-gold flex-shrink-0 hover:text-gold/80 transition"
              title={uiLang === "sw" ? "Kuhifadhi kumeshindwa — gusa kujaribu tena" : "Save failed — tap to retry"}
            >
              <AlertTriangle className="w-3 h-3 text-gold" />
              <span className="hidden sm:inline">{uiLang === "sw" ? "Jaribu tena" : "Retry save"}</span>
            </button>
          ) : everSaved ? (
            <span className={`flex items-center gap-1.5 text-[10px] font-semibold flex-shrink-0 transition-colors ${savedFlash ? "text-green-400" : "text-cream/60"}`}
              title={guestMode ? (uiLang === "sw" ? "Imehifadhiwa kwenye kifaa hiki" : "Saved on this device") : (uiLang === "sw" ? "Mabadiliko yote yamehifadhiwa" : "All changes saved")}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="hidden sm:inline">
                {guestMode ? (uiLang === "sw" ? "Imehifadhiwa" : "Saved locally") : (uiLang === "sw" ? "Imehifadhiwa" : "Saved")}
              </span>
            </span>
          ) : null}
          {isOnRoll && (
            <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-gold flex-shrink-0 animate-pulse-scale">
              <Icon name="flame" size={12} className="text-gold" /> {uiLang === "sw" ? "Unaenda vyema!" : "On a roll!"}
            </span>
          )}
        </div>
        {/* Right: template selector, color swatches, Download */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Profile button — Use current / Upload / Fresh */}
          {!guestMode && (
            <EditorProfileMenu
              accessToken={accessToken}
              onDataChanged={triggerAutoSave}
              sw={uiLang === "sw"}
            />
          )}
          {/* Template selector */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="hidden md:flex items-center gap-1.5 text-[11px] font-medium text-cream/80 hover:text-cream bg-espresso-2 hover:bg-espresso-line rounded-lg px-2.5 py-1.5 transition"
          >
            {TEMPLATES.find((tpl) => tpl.id === templateId)?.name ?? (uiLang === "sw" ? "Muundo" : "Look")}
            <Icon name="chevron-down" size={12} className="text-cream/50" />
          </button>
          {/* Color swatches */}
          <div className="hidden md:flex items-center gap-1 px-2 border-l border-espresso-line">
            {COLOR_PALETTES.slice(0, 5).map(({ hex }) => (
              <button
                key={hex}
                onClick={() => { setPrimaryColor(hex); triggerAutoSave(); }}
                className={`w-5 h-5 rounded-full transition-all ${
                  primaryColor === hex
                    ? "ring-2 ring-cream ring-offset-1 ring-offset-espresso scale-110"
                    : "hover:scale-110 ring-1 ring-transparent"
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
            <span className="text-[9px] text-cream/40 ml-0.5">+{COLOR_PALETTES.length - 5}</span>
          </div>
          {/* Export & Share — a SPLIT button: the main part downloads a PDF in
              one tap (a novice's goal), the chevron opens the other formats +
              share. Previously a single tap opened a 5-option jargon menu. */}
          <span className="relative flex items-stretch rounded-input shadow-ember-hard overflow-hidden">
            {completionPct >= 60 && !isDownloading && !isDocx && !isSharing && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full ring-2 ring-espresso animate-pulse z-10" />
            )}
            <button
              onClick={() => handleDownloadRef.current("topbar")}
              disabled={isDownloading || isDocx || isSharing}
              title={uiLang === "sw" ? "Pakua PDF (⌘D)" : "Download PDF (⌘D)"}
              className="flex items-center gap-1.5 bg-ember hover:bg-ember-hover text-cream text-xs font-semibold pl-3 pr-2.5 md:pl-4 py-2 active:translate-y-[1px] transition-all disabled:opacity-60"
            >
              {isDownloading || isDocx || isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon name="download" size={14} />}
              {/* Labelled on mobile too — the primary "get my CV" action was a
                  bare unlabelled icon on phones, easy to miss or mistake. */}
              <span>
                {isDownloading || isDocx || isSharing ? t(uiLang, "editor.generating") : t(uiLang, "editor.download")}
              </span>
            </button>
            <button
              onClick={() => setDownloadMenu((v) => !v)}
              disabled={isDownloading || isDocx || isSharing}
              aria-label={uiLang === "sw" ? "Miundo mingine ya kupakua" : "More download formats"}
              className="flex items-center bg-ember hover:bg-ember-hover text-cream px-2 py-2 border-l border-cream/25 active:translate-y-[1px] transition-all disabled:opacity-60"
            >
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
            {downloadMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDownloadMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-card-hover py-1.5 min-w-[248px] text-left overflow-hidden">
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">{uiLang === "sw" ? "Pakua" : "Download"}</p>
                  <button onClick={() => { setDownloadMenu(false); handleDownload("topbar"); }} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left">
                    <Icon name="download" size={15} className="text-ember mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-espresso">PDF</span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Muundo kamili + maandishi ya ATS" : "Pixel-perfect design + invisible ATS text"}</span>
                    </span>
                  </button>
                  <button onClick={handleDownloadDocx} disabled={isDocx} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left disabled:opacity-60">
                    <FileText size={15} className="text-pine mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-espresso">Word (.docx)</span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Maandishi ya ATS · sio design ya template" : "ATS text version · not the template design"}</span>
                    </span>
                  </button>
                  <button onClick={handleDownloadText} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left">
                    <FileType2 size={15} className="text-text-body mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-espresso">{uiLang === "sw" ? "Maandishi (.txt)" : "Plain text (.txt)"}</span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Nyepesi zaidi, salama kwa ATS" : "Leanest ATS-safe format"}</span>
                    </span>
                  </button>
                  <div className="h-px bg-border my-1.5" />
                  <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">{uiLang === "sw" ? "Shiriki" : "Share"}</p>
                  <button
                    onClick={() => { setDownloadMenu(false); if (guestMode) setSignUpPrompt("account"); else setShowShareModal(true); }}
                    className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left"
                  >
                    <Globe size={15} className="text-pine mt-0.5 shrink-0" />
                    <span>
                      <span className="text-xs font-semibold text-espresso flex items-center gap-1.5">
                        {uiLang === "sw" ? "Shiriki mtandaoni" : "Share online"}
                        <span className="text-[8px] font-bold uppercase tracking-wide bg-ember-tint text-ember-hover rounded px-1 py-[1px]">{uiLang === "sw" ? "Mpya" : "New"}</span>
                      </span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Pata kiungo cha kushiriki WhatsApp" : "Get a link to share on WhatsApp"}</span>
                    </span>
                  </button>
                  <button onClick={handleShare} disabled={isSharing} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left disabled:opacity-60">
                    <Share2 size={15} className="text-ember mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-espresso">{isSharing ? (uiLang === "sw" ? "Inaandaa…" : "Preparing…") : (uiLang === "sw" ? "Shiriki faili…" : "Share file…")}</span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Barua pepe, Drive, WhatsApp…" : "Email, Google Drive, WhatsApp…"}</span>
                    </span>
                  </button>
                  <div className="h-px bg-border my-1.5" />
                  <button onClick={openHistory} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left">
                    <History size={15} className="text-text-body mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-espresso">{uiLang === "sw" ? "Historia ya matoleo" : "Version history"}</span>
                      <span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Rejesha toleo la awali la CV yako" : "Restore an earlier version of your CV"}</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </span>
          {guestMode && (
            <Button variant="primary" size="sm" onClick={() => {
              posthog.capture('sign_in_triggered', { source: 'guest_editor_topbar', method: 'button' });
              setSignUpPrompt("account");
            }}>
              {uiLang === "sw" ? "Jisajili bure" : "Sign up free"}
            </Button>
          )}
        </div>
      </div>

      {guestMode && (
        <div className="bg-gold-tint border-b border-gold/30 px-3 md:px-4 py-2 flex items-center justify-between flex-shrink-0 z-10">
          {/* The banner must agree with what the editor actually does: the
              download is free and account-free (the landing page's "Hakuna
              usajili wa lazima"), and an account is only needed to save the
              work online / open it on another device. */}
          <span className="text-xs md:text-sm text-gold-text"><strong>{uiLang === "sw" ? "Hali ya mgeni" : "Guest mode"}</strong> — {uiLang === "sw" ? "pakua bila malipo, hakuna usajili; kazi yako imehifadhiwa kwenye kivinjari hiki tu." : "download free, no sign-up; your work is saved in this browser only."}</span>
          <button onClick={() => {
            posthog.capture('sign_in_triggered', { source: 'guest_editor_banner', method: 'button' });
            setSignUpPrompt("account");
          }} className="text-xs md:text-sm font-semibold text-gold-text hover:underline ml-3 flex-shrink-0">
            {uiLang === "sw" ? "Hifadhi mtandaoni →" : "Save online →"}
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — Wizard */}
        <div className={`${mobileTab === "edit" ? "flex" : "hidden"} lg:flex w-full lg:w-[290px] bg-card border-r border-border flex-col overflow-hidden flex-shrink-0`}>
          <StepProgress />
          <CvStrengthMeter cv={cvData} lang={uiLang} />
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {wizardStep === 0 && cvIsBlank && !exampleDismissed && (
              <div className="rounded-card border border-ember/25 bg-ember-tint/40 p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="spark" size={14} className="text-ember" />
                  <span className="text-[13px] font-bold text-espresso">
                    {uiLang === "sw" ? "Anza haraka" : "Get a head start"}
                  </span>
                </div>
                <p className="text-[11px] text-text-body leading-relaxed mb-3">
                  {uiLang === "sw"
                    ? "Pakia CV ya mfano uione ikikamilika, kisha badilisha maandishi yawe yako — ni haraka kuliko kuanza na fomu tupu."
                    : "Load an example CV to see it fully filled in, then edit the text to make it yours — faster than starting from a blank form."}
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={loadExample} size="sm" className="flex-1">
                    <Icon name="spark" size={13} /> {uiLang === "sw" ? "Anza na mfano" : "Start from an example"}
                  </Button>
                  <button
                    onClick={() => setExampleDismissed(true)}
                    className="text-[11px] font-medium text-text-muted hover:text-espresso px-2 py-1.5"
                  >
                    {uiLang === "sw" ? "Anza tupu" : "Start blank"}
                  </button>
                </div>
              </div>
            )}
            {wizardStep === 0 && pendingConfirms.length > 0 && showConfirmPanel && (
              <div className="mb-3">
                <ConfirmationsCard
                  items={pendingConfirms}
                  sw={uiLang === "sw"}
                  onResolved={(keys) => setPendingConfirms((p) => p.filter((c) => !keys.includes(c.key)))}
                />
              </div>
            )}
            {wizardStep === 0 && StepPersonal()}
            {wizardStep === 1 && StepExperience()}
            {wizardStep === 2 && StepEducation()}
            {wizardStep === 3 && StepSkills()}
            {wizardStep === 4 && StepExtras()}
          </div>
          <StepNav />
        </div>

        {/* CENTER — A4 Preview on sand bg */}
        <div ref={previewContainerRef}
          className={`${mobileTab === "preview" ? "flex" : "hidden"} lg:flex flex-1 flex-col items-center overflow-auto p-4 lg:p-8 bg-sand`}>
          <div style={{ width: `${794 * previewScale}px`, height: `${1123 * previewScale}px`, position: "relative", flexShrink: 0 }}>
            <div ref={previewRef} id="cv-preview"
              style={{ width: "794px", minHeight: "1123px", fontFamily, transform: `scale(${previewScale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}
              className="bg-card shadow-floating ring-1 ring-black/[0.04] rounded-[2px]">
              <TemplateCanvas>
                <TemplateComponent data={visibleData} primaryColor={primaryColor} fontFamily={resolveFontStack(fontFamily)} lang={uiLang} />
              </TemplateCanvas>
            </div>
            {/* Sibling of #cv-preview (the captured element) so downloads stay
                clean while the on-screen preview / any screenshot is marked. */}
            <PreviewWatermark active={!isPremium} />
          </div>
          {/* Download — a split button: click to make a PDF, or open the menu for
              Word / text / share (same actions as the top-bar Export menu). */}
          <div className="mt-6 mb-4 flex flex-col items-center gap-1.5">
            <div className="relative inline-flex">
              <button
                onClick={() => handleDownload("preview")}
                disabled={isDownloading || isDocx || isSharing}
                title={uiLang === "sw" ? "Pakua PDF (⌘D)" : "Download PDF (⌘D)"}
                className="flex items-center gap-2 bg-ember hover:bg-ember-hover disabled:opacity-60 text-cream text-sm font-semibold pl-6 pr-4 py-2.5 rounded-l-input shadow-ember-hard active:translate-y-[2px] transition-all"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="download" size={16} />}
                {isDownloading ? (uiLang === "sw" ? "Inatengeneza…" : "Generating…") : (uiLang === "sw" ? "Pakua PDF" : "Download PDF")}
              </button>
              <button
                onClick={() => setCenterMenu((v) => !v)}
                disabled={isDownloading || isDocx || isSharing}
                aria-label={uiLang === "sw" ? "Chaguo zaidi za kupakua" : "More download options"}
                aria-haspopup="menu"
                aria-expanded={centerMenu}
                className="flex items-center bg-ember hover:bg-ember-hover disabled:opacity-60 text-cream px-2.5 py-2.5 rounded-r-input shadow-ember-hard active:translate-y-[2px] transition-all border-l border-ember-shadow/40"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${centerMenu ? "rotate-180" : ""}`} />
              </button>
              {centerMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCenterMenu(false)} />
                  <div className="absolute right-0 bottom-full mb-2 z-50 bg-card border border-border rounded-xl shadow-card-hover py-1.5 min-w-[248px] text-left overflow-hidden" role="menu">
                    <button onClick={() => { setCenterMenu(false); handleDownload("preview"); }} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left" role="menuitem">
                      <Icon name="download" size={15} className="text-ember mt-0.5 shrink-0" />
                      <span><span className="block text-xs font-semibold text-espresso">PDF</span><span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Muundo kamili + maandishi ya ATS" : "Pixel-perfect design + invisible ATS text"}</span></span>
                    </button>
                    <button onClick={() => { setCenterMenu(false); handleDownloadDocx(); }} disabled={isDocx} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left disabled:opacity-60" role="menuitem">
                      <FileText size={15} className="text-pine mt-0.5 shrink-0" />
                      <span><span className="block text-xs font-semibold text-espresso">Word (.docx)</span><span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Maandishi ya ATS · sio design ya template" : "ATS text version · not the template design"}</span></span>
                    </button>
                    <button onClick={() => { setCenterMenu(false); handleDownloadText(); }} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left" role="menuitem">
                      <FileType2 size={15} className="text-text-body mt-0.5 shrink-0" />
                      <span><span className="block text-xs font-semibold text-espresso">{uiLang === "sw" ? "Maandishi (.txt)" : "Plain text (.txt)"}</span><span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Nyepesi zaidi, salama kwa ATS" : "Leanest ATS-safe format"}</span></span>
                    </button>
                    <div className="h-px bg-border my-1.5" />
                    <button onClick={() => { setCenterMenu(false); handleShare(); }} disabled={isSharing} className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-sand transition text-left disabled:opacity-60" role="menuitem">
                      <Share2 size={15} className="text-ember mt-0.5 shrink-0" />
                      <span><span className="block text-xs font-semibold text-espresso">{uiLang === "sw" ? "Shiriki…" : "Share…"}</span><span className="block text-[10px] text-text-muted">{uiLang === "sw" ? "Barua pepe, Drive, WhatsApp…" : "Email, Google Drive, WhatsApp…"}</span></span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <span className="text-[10px] text-text-muted">{uiLang === "sw" ? "PDF · Word · Maandishi · Shiriki" : "PDF · Word · Text · Share"}</span>
          </div>
        </div>

        {/* RIGHT PANEL — Design / Optimize */}
        <div className={`${mobileTab === "design" ? "flex" : "hidden"} lg:flex w-full lg:w-[280px] bg-card border-l border-border flex-col overflow-hidden flex-shrink-0`}>

          {/* Tab bar */}
          <div className="flex border-b border-border flex-shrink-0">
            {(["design", "optimize"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPanelTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition border-b-2 ${
                  panelTab === tab
                    ? "text-ember-hover border-ember"
                    : "text-text-muted border-transparent hover:text-text-body"
                }`}
              >
                {tab === "design" ? (uiLang === "sw" ? "Muundo" : "Design") : (uiLang === "sw" ? "Boresha" : "Optimize")}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {panelTab === "design" ? (
              <>
                {/* CV Strength */}
                <div className="rounded-card overflow-hidden border border-border">
                  <CvStrengthMeter cv={cvData} lang={uiLang} />
                </div>

                {/* Template */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.1em]">{uiLang === "sw" ? "Muundo" : "Look"}</h3>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="w-full flex items-center justify-between border border-border hover:border-ember-tint hover:bg-ember-tint/30 rounded-input px-3 py-2.5 transition group"
                  >
                    <span className="text-sm font-medium text-text-body truncate">
                      {TEMPLATES.find((tpl) => tpl.id === templateId)?.name ?? templateId}
                    </span>
                    <span className="text-xs text-ember-hover font-semibold flex-shrink-0 ml-2 group-hover:underline">{uiLang === "sw" ? "Badilisha" : "Change"}</span>
                  </button>
                </div>

                {/* Color */}
                <div>
                  <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.1em] mb-3 flex items-center gap-1.5">
                    <Icon name="shapes" size={12} className="text-text-muted" /> {uiLang === "sw" ? "Rangi" : "Color"}
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {COLOR_PALETTES.map(({ name, hex }) => (
                      <button key={hex} onClick={() => { setPrimaryColor(hex); triggerAutoSave(); }}
                        title={name}
                        className="flex flex-col items-center gap-1 group">
                        <div className={`w-9 h-9 rounded-lg border-2 transition-all ${primaryColor === hex ? "border-espresso scale-110 shadow-sm" : "border-transparent hover:scale-105"}`}
                          style={{ backgroundColor: hex }} />
                        <span className={`text-[9px] font-medium leading-none transition-colors ${primaryColor === hex ? "text-espresso" : "text-text-muted group-hover:text-text-body"}`}>{name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); triggerAutoSave(); }}
                      className="w-8 h-8 rounded cursor-pointer border border-border flex-shrink-0" />
                    <input value={primaryColor} onChange={(e) => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) { setPrimaryColor(e.target.value); triggerAutoSave(); } }}
                      className="flex-1 px-2 py-1.5 text-xs border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember bg-sand-2 font-mono" />
                  </div>
                </div>

                {/* Font */}
                <div>
                  <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.1em] mb-3">{uiLang === "sw" ? "Fonti" : "Font"}</h3>
                  <div className="space-y-1.5">
                    {FONTS.map((font) => {
                      const isActive = fontFamily === font.stack || fontFamily === font.name;
                      return (
                        <button key={font.name} onClick={() => { setFontFamily(font.stack); triggerAutoSave(); }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition ${isActive ? "bg-ember-tint border border-ember/20" : "hover:bg-cream border border-transparent"}`}>
                          <p className={`text-[11px] font-semibold mb-0.5 ${isActive ? "text-ember-hover" : "text-text-body"}`}
                            style={{ fontFamily: font.stack }}>{font.name}</p>
                          <p className="text-[10px] text-text-muted" style={{ fontFamily: font.stack }}>{font.blurb}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Density */}
                <div>
                  <h3 className="text-[10px] font-medium text-text-muted uppercase tracking-[0.1em] mb-3">{uiLang === "sw" ? "Msongamano" : "Density"}</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: "compact", label: uiLang === "sw" ? "Fupi" : "Compact", desc: uiLang === "sw" ? "Maudhui zaidi" : "More content" },
                      { id: "normal",  label: uiLang === "sw" ? "Kawaida" : "Normal",  desc: uiLang === "sw" ? "Uwiano" : "Balanced" },
                      { id: "airy",    label: uiLang === "sw" ? "Wazi" : "Airy",    desc: uiLang === "sw" ? "Nafasi zaidi" : "Spacious" },
                    ] as const).map(({ id, label, desc }) => {
                      const active = (cvData.density ?? "normal") === id;
                      return (
                        <button key={id} onClick={() => { setDensity(id); triggerAutoSave(); }}
                          className={`flex flex-col items-center py-2 px-1 rounded-lg border transition text-center ${
                            active ? "bg-ember-tint border-ember/30 text-ember-hover" : "border-border hover:border-ember/20 text-text-muted hover:text-text-body"
                          }`}>
                          <span className={`text-[11px] font-semibold ${active ? "text-ember-hover" : ""}`}>{label}</span>
                          <span className="text-[9px] text-text-muted mt-0.5">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Enhance */}
                <div>
                  <button onClick={handleEnhance} disabled={isEnhancing}
                    className="w-full flex items-center justify-center gap-2 bg-purple-tint text-purple-glow text-sm font-semibold py-2.5 rounded-input transition hover:bg-purple-tint/80 disabled:opacity-50 border border-purple-glow/20">
                    {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="spark" size={16} className="text-purple-glow" />}
                    {isEnhancing ? (uiLang === "sw" ? "Inaboresha..." : "Enhancing...") : (uiLang === "sw" ? "Boresha na AI" : "Enhance with AI")}
                  </button>
                  <p className="text-xs text-text-muted text-center mt-2">{uiLang === "sw" ? "Boresha muhtasari wako na AI" : "Improve your summary with AI"}</p>
                </div>
              </>
            ) : (
              <>
                {/* AI Tools — one labeled menu of discrete actions. The user picks
                    exactly the task they want (never one magic "improve" button),
                    which is both clearer and safer. Each entry jumps to its tool. */}
                <div className="bg-card border border-border rounded-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-tint flex items-center justify-center">
                      <Icon name="spark" size={14} className="text-purple-glow" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-espresso leading-tight">{uiLang === "sw" ? "Zana za AI" : "AI Tools"}</p>
                      <p className="text-[10px] text-text-muted leading-tight">{uiLang === "sw" ? "Chagua kazi moja — wewe unadhibiti" : "Pick one task — you stay in control"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {([
                      { id: "ai-tool-jobmatch", icon: "target", label: { sw: "Linganisha na kazi", en: "Match to a job" }, desc: { sw: "Alama ya kufanana + mabadiliko yanayopendekezwa", en: "Fit score + recommended changes" } },
                      { id: "ai-tool-ats", icon: "bolt", label: { sw: "Kagua ATS", en: "ATS check" }, desc: { sw: "Ona kama mifumo ya waajiri itasoma CV yako", en: "See how ATS systems read your CV" } },
                      { id: "ai-tool-rewrite", icon: "magic", label: { sw: "Boresha maandishi", en: "Improve writing" }, desc: { sw: "AI iandike upya muhtasari wako", en: "Let AI rewrite your summary" } },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { if (typeof document !== "undefined") document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-input hover:bg-sand transition"
                      >
                        <Icon name={t.icon} size={14} className="text-ember flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-espresso leading-tight">{uiLang === "sw" ? t.label.sw : t.label.en}</p>
                          <p className="text-[10px] text-text-muted leading-tight">{uiLang === "sw" ? t.desc.sw : t.desc.en}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted mt-2.5 pt-2.5 border-t border-border">
                    {uiLang === "sw" ? "Kidokezo: kila sehemu (Muhtasari, Uzoefu) ina kitufe chake cha AI kwenye kichupo cha Yaliyomo." : "Tip: each section (Summary, Experience) has its own AI button in the Content tab."}
                  </p>
                </div>

                {/* Optimize CTA */}
                <div className="bg-ember-tint border border-ember/20 rounded-card p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-ember flex items-center justify-center">
                      <Icon name="spark" className="text-cream" size={14} />
                    </div>
                    <p className="text-xs font-semibold text-espresso">{uiLang === "sw" ? "Fanya CV yako ifanye kazi zaidi" : "Make your CV work harder"}</p>
                  </div>
                  <p className="text-[11px] text-text-body mb-3 leading-relaxed">
                    {uiLang === "sw" ? "Kagua uzingatiaji wa ATS na uone jinsi CV yako inavyolingana na kazi maalum — bila akaunti." : "Check ATS compliance and see how well your CV fits a specific role — no account needed."}
                  </p>
                  <button
                    onClick={() => { setSampleJdActive(true); setShowJobTarget(true); setShowAtsPanel(false); track("job_target_sample_jd_used"); }}
                    className="text-[11px] font-semibold text-ember-hover hover:text-ember transition"
                  >
                    {uiLang === "sw" ? "Jaribu mfano: Mhandisi Frontend wa Ngazi ya Juu →" : "Try sample: Senior Frontend Engineer →"}
                  </button>
                </div>

                {/* Shared Profile Panel */}
                <div className="border border-border rounded-card overflow-hidden">
                  <div className="p-3">
                    <SharedProfilePanel
                      accessToken={accessToken}
                      lang={uiLang}
                      onProfileChange={(profile) => {
                        if (profile.fullName) updatePersonal({ fullName: profile.fullName });
                        if (profile.jobTitle) updatePersonal({ jobTitle: profile.jobTitle });
                        if (profile.email) updatePersonal({ email: profile.email });
                        if (profile.phone) updatePersonal({ phone: profile.phone });
                        if (profile.location) updatePersonal({ location: profile.location });
                        if (profile.linkedin) updatePersonal({ linkedin: profile.linkedin });
                        if (profile.website) updatePersonal({ website: profile.website });
                        if (profile.summary) setSummary(profile.summary);
                        // Every other mutation site schedules a save; this one
                        // must too, or an applied profile is lost if the user
                        // leaves without another keystroke.
                        triggerAutoSave();
                      }}
                    />
                  </div>
                </div>

                {/* ATS Analysis — inline card, no accordion */}
                <div id="ai-tool-ats" className="bg-pine rounded-card overflow-hidden scroll-mt-4">
                  <div className="p-4">
                    <AtsPanel data={cvData} documentId={initialDoc.id !== "new" ? initialDoc.id : undefined} accessToken={accessToken} lang={uiLang} onScore={setAtsScore} />
                    <AtsExplain data={cvData} sw={uiLang === "sw"} onApplyFix={loadCvData} />
                    <AuthenticWritingPanel data={cvData} sw={uiLang === "sw"} />
                  </div>
                </div>

                {/* Cross-sell — matching cover letter */}
                <CrossSellBanner
                  cvId={initialDoc.id}
                  cvTitle={title}
                  cvData={cvData}
                  accessToken={accessToken}
                  atsScore={atsScore} /* lifted from AtsPanel via onScore */
                  lang={uiLang}
                />

                {/* AI Assistant */}
                <div id="ai-tool-rewrite" className="bg-purple-tint border border-purple-glow/15 rounded-card p-4 scroll-mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(124,58,237,0.12)", boxShadow: "0 0 12px rgba(124,58,237,0.25)" }}>
                        <Icon name="spark" size={16} className="text-purple-glow" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-purple-glow">{uiLang === "sw" ? "Msaidizi wa AI" : "AI Assistant"}</p>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-purple-glow text-white px-1.5 py-0.5 rounded-pill leading-none">PRO</span>
                        </div>
                        <p className="text-[10px] text-text-body">{uiLang === "sw" ? "Boresha maandishi yako" : "Rewrite to be more impactful"}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mb-2.5 leading-relaxed">
                    {uiLang === "sw"
                      ? "Huchukua muhtasari wako na kuuandika upya uwe wazi, mfupi na wenye nguvu — maneno ya vitendo na matokeo. Utakagua kabla ya kuweka."
                      : "Takes your summary and rewrites it to be clearer, tighter and more impactful — strong verbs and results. You review before it's applied."}
                  </p>
                  <Button
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    variant="dark"
                    size="sm"
                    className="w-full"
                  >
                    {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon name="spark" size={14} />}
                    {isEnhancing ? (uiLang === "sw" ? "Inaboresha..." : "Enhancing...") : (uiLang === "sw" ? "Boresha muhtasari" : "Enhance summary")}
                  </Button>
                  <button
                    onClick={handleTranslate}
                    disabled={translateProgress !== null}
                    className="mt-2 w-full flex items-center justify-center gap-2 border border-purple-glow/25 text-purple-glow text-sm font-semibold py-2.5 rounded-input transition hover:bg-purple-tint/60 disabled:opacity-50"
                  >
                    {translateProgress !== null
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> {uiLang === "sw" ? "Inatafsiri" : "Translating"} {translateProgress}…</>
                      : <><Icon name="globe" size={14} /> {translateTarget === "sw" ? (uiLang === "sw" ? "Tafsiri maudhui kwa Kiswahili" : "Translate content to Swahili") : (uiLang === "sw" ? "Tafsiri maudhui kwa Kiingereza" : "Translate content to English")}</>}
                  </button>
                </div>

                {/* Job Match — a flagship "get hired" feature, surfaced with an
                    accent frame + recommended eyebrow so it isn't lost among the
                    styling controls. */}
                <div id="ai-tool-jobmatch" className="border-2 border-ember/25 bg-ember-tint/10 rounded-card overflow-hidden scroll-mt-4">
                  <div className="flex items-center gap-1.5 px-3 pt-2.5">
                    <Icon name="bolt" size={12} className="text-ember" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ember-hover">
                      {uiLang === "sw" ? "Inapendekezwa · Lenga kazi" : "Recommended · Tailor to a job"}
                    </span>
                  </div>
                  <div className="p-3 pt-2">
                    <JobTargetPanel
                      data={cvData}
                      lang={uiLang}
                      defaultJd={sampleJdActive ? SAMPLE_JD : undefined}
                      accessToken={accessToken}
                      onApplySummary={(summary) => { setSummary(summary); triggerAutoSave(); }}
                      onApplyTailoredCv={(summary, expDescById) => {
                        setSummary(summary);
                        for (const [id, description] of Object.entries(expDescById)) updateExperience(id, { description });
                        triggerAutoSave();
                      }}
                      onGenerateCoverLetter={(jd) => void generateCoverLetterFromExport(jd)}
                      coverLetterBusy={exportNextBusy === "cover"}
                      onAddSkill={(name) => {
                        addSkill();
                        const newSkill = useEditorStore.getState().cv.skills.at(-1);
                        if (newSkill) { updateSkill(newSkill.id, { name, level: 3 }); }
                        triggerAutoSave();
                      }}
                    />
                  </div>
                </div>

                {/* Mode Presets */}
                <div className="border border-border rounded-card overflow-hidden">
                  <button onClick={() => setShowPresets(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cream transition text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon name="bolt" size={16} className="text-text-muted flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-body">{uiLang === "sw" ? "Mipangilio Tayari" : "Mode Presets"}</p>
                        <p className="text-[10px] text-text-muted">{uiLang === "sw" ? "ATS · Mtendaji · Ubunifu · Mwanafunzi" : "ATS · Executive · Creative · Student"}</p>
                      </div>
                    </div>
                    <Icon name="chevron-right" className={`text-text-muted transition-transform duration-[300ms] flex-shrink-0 ml-2 ${showPresets ? "rotate-90" : ""}`} size={14} />
                  </button>
                  <AccordionPanel open={showPresets}>
                    <div className="border-t border-border p-2 space-y-0.5">
                      {Object.entries(ENGINE_PRESETS).map(([key, preset]) => {
                        const currentOrder = cvData.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
                        const currentDensity = cvData.density ?? "normal";
                        const orderMatch = JSON.stringify(currentOrder.slice(0, preset.sectionOrder.length)) === JSON.stringify(preset.sectionOrder);
                        const isActive = orderMatch && currentDensity === preset.density;
                        return (
                          <button key={key}
                            onClick={() => { setSectionOrder(preset.sectionOrder); setDensity(preset.density); triggerAutoSave(); }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${isActive ? "bg-ember-tint" : "hover:bg-cream"}`}>
                            <span className="text-base leading-none">{preset.icon}</span>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold ${isActive ? "text-ember-hover" : "text-text-body"}`}>{preset.label}</p>
                              <p className="text-[10px] text-text-muted truncate">{preset.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionPanel>
                </div>

                {/* Section Order */}
                {(() => {
                  const SECTION_LABELS: Record<string, string> = uiLang === "sw"
                    ? {
                        summary: "Muhtasari", experience: "Uzoefu wa Kazi", education: "Elimu",
                        skills: "Ujuzi", projects: "Miradi", languages: "Lugha", certifications: "Vyeti", referees: "Wadhamini", hobbies: "Shughuli za Ziada",
                      }
                    : {
                        summary: "Summary", experience: "Work Experience", education: "Education",
                        skills: "Skills", projects: "Projects", languages: "Languages", certifications: "Certifications", referees: "Referees", hobbies: "Interests",
                      };
                  const order = cvData.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
                  return (
                    <div className="border border-border rounded-card overflow-hidden">
                      <button onClick={() => setShowSectionOrder(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-cream transition text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="list" size={16} className="text-text-muted flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-body">{uiLang === "sw" ? "Mpangilio wa Sehemu" : "Section Order"}</p>
                            <p className="text-[10px] text-text-muted">{uiLang === "sw" ? "Buruta kupanga upya · jicho kuficha" : "Drag to reorder · eye to hide"}</p>
                          </div>
                        </div>
                        <Icon name="chevron-right" className={`text-text-muted transition-transform duration-[300ms] flex-shrink-0 ml-2 ${showSectionOrder ? "rotate-90" : ""}`} size={14} />
                      </button>
                      <AccordionPanel open={showSectionOrder}>
                        <div className="border-t border-border p-2">
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionReorder}>
                            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                              <div className="space-y-1">
                                {order.map(key => {
                                  const hidden = (cvData.hiddenSections ?? []).includes(key);
                                  return (
                                    <SortableCard key={key} id={key}>
                                      {(drag) => (
                                        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition ${hidden ? "bg-sand border-border/50 opacity-50" : "bg-card border-border hover:border-ember/20"}`}>
                                          <span {...drag} className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                                            <Icon name="menu" size={14} className="text-text-muted" />
                                          </span>
                                          <span className="flex-1 text-xs font-medium text-text-body min-w-0 truncate">
                                            {SECTION_LABELS[key] ?? key}
                                          </span>
                                          <button onClick={() => { toggleSectionVisibility(key); triggerAutoSave(); }}
                                            aria-pressed={!hidden}
                                            aria-label={`${hidden ? (uiLang === "sw" ? "Onyesha" : "Show") : (uiLang === "sw" ? "Ficha" : "Hide")} ${SECTION_LABELS[key] ?? key}`}
                                            className={`flex-shrink-0 transition ${hidden ? "text-text-muted" : "text-text-muted hover:text-espresso"}`}
                                            title={hidden ? (uiLang === "sw" ? "Onyesha sehemu" : "Show section") : (uiLang === "sw" ? "Ficha sehemu" : "Hide section")}>
                                            {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                          </button>
                                        </div>
                                      )}
                                    </SortableCard>
                                  );
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      </AccordionPanel>
                    </div>
                  );
                })()}

                {/* Create Application Kit */}
                {initialDoc.id !== "new" && (
                  <button
                    onClick={() => setShowAppModal(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-card border border-dashed border-ember/40 text-left hover:bg-ember-tint/30 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-ember-tint flex items-center justify-center flex-shrink-0">
                      <Icon name="briefcase" size={14} className="text-ember" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-ember-hover">{uiLang === "sw" ? "Hifadhi kama Ombi" : "Save as Application"}</p>
                      <p className="text-[9px] text-text-muted">{uiLang === "sw" ? "Fuatilia CV hii dhidi ya kazi" : "Track this CV against a job"}</p>
                    </div>
                  </button>
                )}

                {/* Submit to marketplace (flag-gated) */}
                {MARKETPLACE_ENABLED && initialDoc.id !== "new" && (
                  <button
                    onClick={() => { setTplName(title); setShowTplModal(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-card border border-dashed border-pine/40 text-left hover:bg-pine-tint/40 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-pine-tint flex items-center justify-center flex-shrink-0">
                      <Icon name="share" size={14} className="text-pine" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-pine">{uiLang === "sw" ? "Wasilisha kama templeti" : "Submit as template"}</p>
                      <p className="text-[9px] text-text-muted">{uiLang === "sw" ? "Shiriki muundo huu na jumuiya" : "Share this design with the community"}</p>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit-as-template modal (marketplace) */}
      {showTplModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/40 p-4"
          onClick={() => { if (!submittingTpl) setShowTplModal(false); }}>
          <div className="w-full max-w-md rounded-card-lg bg-card border border-border shadow-card-hover p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-extrabold text-lg text-espresso mb-1">{uiLang === "sw" ? "Wasilisha kama templeti" : "Submit as template"}</h3>
            <p className="text-xs text-text-muted mb-4">{uiLang === "sw" ? "Inashiriki mtindo wa muundo huu (rangi, fonti, mpangilio wa sehemu) — kamwe si maudhui yako binafsi. Huenda kwa ukaguzi kabla ya kuonekana kwenye galeri." : "Shares this design's style (colors, font, section order) — never your personal content. It goes to review before appearing in the gallery."}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">{uiLang === "sw" ? "Jina la templeti" : "Template name"}</label>
                <input value={tplName} onChange={(e) => setTplName(e.target.value)}
                  className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">{uiLang === "sw" ? "Aina (si lazima)" : "Category (optional)"}</label>
                <input value={tplCat} onChange={(e) => setTplCat(e.target.value)} placeholder={uiLang === "sw" ? "mf. Rahisi, Ubunifu" : "e.g. Minimal, Creative"}
                  className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">{uiLang === "sw" ? "Maelezo (si lazima)" : "Description (optional)"}</label>
                <textarea value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} rows={2}
                  className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember resize-y" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowTplModal(false)} disabled={submittingTpl}
                className="px-4 py-2 rounded-input text-sm font-semibold text-text-body hover:bg-sand transition disabled:opacity-50">{uiLang === "sw" ? "Ghairi" : "Cancel"}</button>
              <button onClick={submitAsTemplate} disabled={submittingTpl || !tplName.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-input text-sm font-semibold bg-pine text-cream shadow-lg shadow-pine/20 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {submittingTpl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="share" size={14} />} {uiLang === "sw" ? "Wasilisha" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save-as-Application modal (replaces raw window.prompt) */}
      {showAppModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/40 p-4"
          onClick={() => { if (!savingApp) setShowAppModal(false); }}>
          <div className="w-full max-w-md rounded-card-lg bg-card border border-border shadow-card-hover p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-extrabold text-lg text-espresso mb-1">{uiLang === "sw" ? "Hifadhi kama Ombi" : "Save as Application"}</h3>
            <p className="text-xs text-text-muted mb-4">{uiLang === "sw" ? "Fuatilia CV hii dhidi ya kazi maalum." : "Track this CV against a specific job."}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">{uiLang === "sw" ? "Cheo cha kazi au maelezo" : "Job title or description"}</label>
                <AutoTextarea value={appJd} onChange={(e) => setAppJd(e.target.value)} rows={3} maxHeight={260}
                  placeholder={uiLang === "sw" ? "mf. Mhandisi wa Programu — au bandika maelezo kamili ya kazi" : "e.g. Software Engineer — or paste the full job description"}
                  className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember min-h-[64px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-espresso mb-1">{uiLang === "sw" ? "Kampuni (si lazima)" : "Company (optional)"}</label>
                <input value={appCompany} onChange={(e) => setAppCompany(e.target.value)}
                  placeholder={uiLang === "sw" ? "mf. Zuri Fintech" : "e.g. Zuri Fintech"}
                  className="w-full rounded-input border border-border-input bg-sand-2 px-3 py-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAppModal(false)} disabled={savingApp}
                className="px-4 py-2 rounded-input text-sm font-semibold text-text-body hover:bg-sand transition disabled:opacity-50">
                {uiLang === "sw" ? "Ghairi" : "Cancel"}
              </button>
              <button onClick={saveAsApplication} disabled={savingApp || !appJd.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-input text-sm font-semibold bg-ember text-cream shadow-ember-hard hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                {savingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon name="briefcase" size={14} />} {uiLang === "sw" ? "Hifadhi" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden flex border-t border-border bg-card flex-shrink-0" style={{ height: 56 }}>
        {([
          { id: "edit" as const, Icon: FileText, label: t(uiLang, "common.edit") },
          { id: "preview" as const, Icon: Eye, label: t(uiLang, "editor.preview") },
          { id: "design" as const, Icon: Palette, label: t(uiLang, "editor.color") },
        ]).map(({ id, Icon, label }) => (
          <button key={id} onClick={() => setMobileTab(id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
            style={{ color: mobileTab === id ? "#DA4A1C" : "#9C9186" }}>
            {mobileTab === id && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-ember rounded-full" />
            )}
            <Icon className="w-5 h-5" />
            <span className={`text-[10px] font-medium ${mobileTab === id ? "font-semibold" : ""}`}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
