"use client";

// Universal document assistant ("Sumaiya"). A real, AI-driven chat that can
// create ANY supported document — CV, cover letter, business card, or formal
// letter. The user picks what to make (tap a chip or just start talking), then
// the assistant converses naturally (following their lead), and finally writes
// the document and drops them into the right editor to preview & edit.
//
// One AI call per turn (/api/ai/assistant-turn, doc-type aware). The final build
// goes through /api/ai/build-doc which returns the right shape per type; the
// client maps it into that type's create API. Persists across refresh.

import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SumaiyaMark } from "@/components/ui/sumaiya-mark";
import { ChevronLeft, Send, Loader2, Sparkles, RotateCcw, FileText, Mail, CreditCard, ScrollText, Paperclip, Bolt, CheckCircle2, AlertTriangle, XCircle, Target, Check, Volume2, VolumeX, Mic, MicOff, Briefcase, History, Trash2, Plus, SlidersHorizontal, Search, LayoutTemplate, Settings } from "lucide-react";
import { nanoid } from "nanoid";
import { computeComposerHeight, COMPOSER_MAX_HEIGHT_PX } from "@/lib/assistant/composer-height";
import { micErrorMessage } from "@/lib/assistant/mic-error";
import { s, errorMsg } from "@/lib/assistant/error-message";
import { resolveTemplatePreview } from "@/lib/assistant/template-preview";
import { TemplatePreviewCard } from "@/components/assistant/template-preview-card";
import { StartChooser, type StartChoice } from "@/components/assistant/start-chooser";
import { ChatCard } from "@/components/assistant/chat-card";
import { CvReadyCard } from "@/components/assistant/cv-ready-card";
import { NakuruTemplate } from "@/components/templates/nakuru";
import { exportElementToPdf, buildCvText, exportCvToText, triggerBlobDownload } from "@/lib/pdf";
import { downloadCvDocx } from "@/lib/docx";
import { toCvData } from "@/lib/cv/from-parsed";
import { extractTextFromFile, ExtractionError } from "@/lib/client-cv-extract";
import { analyzeCv, atsScore, type AtsCheck } from "@/lib/ats-score";
import { matchCvToJd, looksLikeJobDescription, findLastJobInHistory } from "@/lib/job-match";
import { computeCompositeScore } from "@/lib/score/composite";
import { explainScore } from "@/lib/score/explain";
import { diffCv } from "@/lib/document-diff";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { detectMessageLang, countIdenticalUserMessages } from "@/lib/assistant/conversation-lang";
import type { EvidenceClaim } from "@/lib/career-profile/evidence";
import { verifyAiContent } from "@/lib/career-profile/evidence";
import { applyDirective } from "@/lib/smartfit";
import { ConfirmationsCard, type PendingConfirmation } from "@/components/assistant/confirmations-card";
import { SignalsCard } from "@/components/assistant/signals-card";
import { TrackUpdateCard } from "@/components/assistant/track-update-card";
import type { Signal } from "@/lib/assistant/signals";
import { signalKey } from "@/lib/assistant/signals";
import { toApiMessages } from "@/lib/assistant/messages";
import {
  conversationTitle,
  deleteConversation,
  firstUserMessage,
  isValidConversation,
  migrateLegacy,
  openConversation,
  pruneConversations,
  searchConversations,
  upsertConversation,
  type ConversationStoreData,
  type LegacyThread,
  type StoredConversation,
} from "@/lib/assistant/conversation-store";
import { useTts } from "@/lib/tts/use-tts";
import {
  createEmptyBusinessCardData, createEmptyLetterData,
  type CVData, type BusinessCardData, type LetterData, type LetterType,
} from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import { INTER_STACK } from "@/lib/fonts";
import { TemplateCanvas } from "@/components/templates/template-canvas";

export interface AssistantProfile {
  fullName: string; jobTitle: string; email: string; phone: string; location: string;
  linkedin?: string; website?: string; summary?: string;
}

interface Props {
  lang: Lang; firstName?: string; profile?: AssistantProfile | null; guest?: boolean;
  // Per-user storage scope: without this a shared browser restores the previous
  // user's full conversation (privacy leak). Guests get their own scope too.
  userId?: string;
  // An "active CV" turns the assistant into a cockpit: it can run instant,
  // deterministic checks on this CV and render them as inline cards.
  activeCv?: CVData | null; activeCvId?: string; activeCvTitle?: string;
  // Phase 2 (B): pending needs-confirmation facts, from the unified context.
  initialUnconfirmed?: number;
}

// A rendered result card carried on an assistant message (persisted with it).
type CardData =
  | { kind: "ats"; score: number; checks: AtsCheck[] }
  | { kind: "match"; score: number; matched: string[]; missing: string[]; jd: string; composite?: import("@/lib/score/composite").CompositeScore; explanation?: import("@/lib/score/explain").ScoreExplanation; dismissed?: boolean }
  | { kind: "tailor"; summary: string; experience: { id: string; description: string }[]; applied?: boolean; dismissed?: boolean; evidence?: EvidenceClaim[]; confirmed?: boolean }
  | { kind: "jobs"; query: string; jobs: { id: string; title: string; company: string; location: string }[] }
  | { kind: "summary"; summary: string; applied?: boolean; evidence?: EvidenceClaim[]; confirmed?: boolean }
  | { kind: "skills"; skills: string[]; applied?: boolean }
  | { kind: "coverLetter"; content: string; jobTitle?: string; company?: string; savedId?: string }
  | { kind: "trackJob"; jobTitle?: string; companyName?: string; jobDescription?: string; tracked?: boolean }
  | { kind: "docIntel"; op: "summarize" | "expand" | "shorten" | "proofread" | "convert" | "compare" | "structure"; text: string; section?: string; target?: string; applied?: boolean; savedId?: string; evidence?: EvidenceClaim[]; confirmed?: boolean }
  | { kind: "smartFit"; directive: string; templateId?: string; density?: "compact" | "normal" | "airy"; sectionOrder?: string[]; rationale: { en: string; sw: string }; applied?: boolean }
  | { kind: "skillGap"; jobTitle?: string; strengths: string[]; gaps: string[]; score: number; learningPlan: { step: string; gap: string }[] | null; summary?: string; resources: { title: string; provider: string; url: string; free: boolean }[] }
  | { kind: "cvCompare"; verdict: string; onlyA: string[]; onlyB: string[]; shared: string[]; scored: boolean; aScore?: number; bScore?: number; winner?: "a" | "b" | "tie" }
  | { kind: "confirmations"; items: PendingConfirmation[]; resolved?: boolean }
  | { kind: "signals"; items: Signal[] }
  | { kind: "trackUpdate"; applicationId?: string; title?: string; currentStatus?: string; nextStatus: string; updated?: boolean };

// `apiContent`, when set, is what's sent to the model/build (e.g. the full text
// of an uploaded CV) while `content` stays short for display.
type Msg = { role: "assistant" | "user"; content: string; apiContent?: string; card?: CardData };
type DocType = "cv" | "cover-letter" | "business-card" | "letter";

/** Write a guest's CV into the guest-editor's localStorage doc. */
function stashGuestCv(cv: CVData, templateId: string, primaryColor: string, sw: boolean) {
  try {
    localStorage.setItem("sumaiya-guest-cv", JSON.stringify({
      cv,
      title: cv.personal?.fullName ? `${cv.personal.fullName} — CV` : (sw ? "CV yako" : "My CV"),
      templateId,
      primaryColor,
      fontFamily: "Inter",
    }));
  } catch { /* private mode — non-fatal */ }
}

// Per-user conversation storage: the key carries a stable per-user/guest scope
// so one shared browser never leaks user A's chat into user B's session.
// v4 = multi-conversation store (see lib/assistant/conversation-store.ts).
const storageKey = (userId?: string) =>
  `sumaiya-assistant-v4${userId ? `:${userId}` : ":guest"}`;
// Legacy single-thread key — read once on mount and migrated into the v4
// store so existing users keep their history.
const legacyStorageKey = (userId?: string) =>
  `sumaiya-assistant-v3${userId ? `:${userId}` : ":guest"}`;
type SavedState = { messages: Msg[]; docType: DocType | null; done: boolean; seenSignals?: string[]; effort?: string };

const LETTER_TYPES: LetterType[] = [
  "reference", "resignation", "application", "employment-verification",
  "salary-increase", "promotion", "leave-of-absence", "job-offer",
  "appointment-confirmation", "termination", "business-proposal", "complaint",
  "apology", "inquiry", "authorization", "partnership-mou", "vacate-notice",
  "scholarship", "internship", "sponsorship", "quotation", "invoice", "letterhead",
];

const DOC_CHIPS: { id: DocType; sw: string; en: string; Icon: typeof FileText }[] = [
  { id: "cv", sw: "CV / Wasifu", en: "CV / Résumé", Icon: FileText },
  { id: "cover-letter", sw: "Barua ya Maombi", en: "Cover letter", Icon: Mail },
  { id: "business-card", sw: "Kadi ya biashara", en: "Business card", Icon: CreditCard },
  { id: "letter", sw: "Barua rasmi", en: "Formal letter", Icon: ScrollText },
];

const DOC_LABEL: Record<DocType, { sw: string; en: string }> = {
  cv: { sw: "CV", en: "CV" },
  "cover-letter": { sw: "barua ya maombi", en: "cover letter" },
  "business-card": { sw: "kadi ya biashara", en: "business card" },
  letter: { sw: "barua rasmi", en: "formal letter" },
};

// Fix 2: a user hammering the EXACT same sentence gets a varied, deterministic
// ack — not another AI round-trip that can repeat itself verbatim. Rotated by
// repeat count so even the ack varies. Companion-first: the ack NEVER pushes a
// career next-step (the old "ATS check / match a job / build a document" offers
// were exactly the nagging this chat is built to avoid).
const REPEAT_THRESHOLD = 3;
const REPEAT_REPLIES_SW = [
  "Nimesikia 😊 Umekwisha niambia hivyo. Niko hapa — tufanye nini sasa? Tupige story tu, au niambie unachohitaji.",
  "Bado unarudia kile kile 😄 labda unataka kubadili mada? Niko tayari — wewe chagua, hata kama ni kuongea tu.",
  "Nimekuelewa, umerudia mara kadhaa! 😄 Tuanze kitu kipya — niambie unachotaka, chochote kile.",
];
const REPEAT_REPLIES_EN = [
  "Heard you 😊 You've told me that already. I'm here — what shall we do next? We can just chat, or tell me what you need.",
  "You're repeating yourself a bit 😄 fancy a change of subject? I'm game — you pick, even if it's just talking.",
  "Got it — you've said that a few times now! 😄 Let's do something fresh — tell me what you'd like, anything.",
];

export function CvAssistantClient({ lang, firstName, profile, guest = false, userId, activeCv = null, activeCvId, activeCvTitle, initialUnconfirmed = 0 }: Props) {
  const sw = lang === "sw";
  // Fix 3: the conversation language — what the USER actually types / how the
  // AI is replying — NOT the UI cookie. Starts as the UI lang and follows the
  // user's messages from there (a Swahili speaker on an English UI gets a
  // fully Swahili assistant experience, including the AI's replies).
  const [convoSw, setConvoSw] = useState(sw);
  const router = useRouter();
  // Resolve the per-user storage key once per mount (stable for the session).
  const STORAGE_KEY = storageKey(userId);

  const returning = !!profile?.fullName;
  const greeting = convoSw
    ? (guest
        ? `Karibu! Mimi ni Sumaiya 😊 Niko hapa kukusaidia kutengeneza CV yako ya kitaalamu — bure, kwa dakika chache. Gusa kimoja hapa chini, pakia CV yako ya zamani, au niambie tu jina lako.`
        : `${returning ? `Karibu tena, ${firstName}!` : `Karibu${firstName ? `, ${firstName}` : ""}!`} Mimi ni Sumaiya 😊 Niko hapa — naweza kutengeneza CV, barua ya maombi, kadi ya biashara au barua rasmi, na pia tupige story tu. Unachotaka leo?`)
    : (guest
        ? `Welcome! I'm Sumaiya 😊 I'll write your professional CV, free — in minutes. Tap one below, upload your old CV, or just tell me your name.`
        : `${returning ? `Welcome back, ${firstName}!` : `Welcome${firstName ? `, ${firstName}` : ""}!`} I'm Sumaiya 😊 I'm here — I can create a CV, a cover letter, a business card, or a formal letter, and we can also just chat. What would you like today?`);

  // Cockpit mode: the assistant opened with a specific CV in hand. It leads —
  // acknowledging the CV and proactively offering to act on it — rather than
  // showing the generic "what would you like to build" opener.
  const cockpit = !!activeCvId;
  const openingMessage = cockpit
    ? (convoSw
        ? `Nimeipata CV yako${activeCvTitle ? ` "${activeCvTitle}"` : ""}${firstName ? `, ${firstName}` : ""}. Ningeweza kuikagua, au kuilinganisha na kazi unayolenga na kuiboresha. Gusa hapa chini — au niambie tu.`
        : `I've got your CV${activeCvTitle ? ` "${activeCvTitle}"` : ""}${firstName ? `, ${firstName}` : ""}. I can run an ATS check, or match it to a job you're eyeing and tailor it. Tap below — or just tell me.`)
    : greeting;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [docType, setDocType] = useState<DocType | null>(null);
  const [effort, setEffort] = useState<"fast" | "balanced" | "deep">("balanced");
  const [showEffort, setShowEffort] = useState(false);
  const [showCaps, setShowCaps] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState("");
  const [restored, setRestored] = useState(false);
  // v4 — multi-conversation store (list + active pointer) + the list drawer.
  const [convos, setConvos] = useState<ConversationStoreData>({ conversations: [], activeId: null });
  const [showConvos, setShowConvos] = useState(false);
  const [convoQuery, setConvoQuery] = useState("");
  // Built-document downloads: after build succeeds the user stays in the chat
  // and picks a format (PDF / Word / TXT) right there — instant, no editor hop.
  type BuiltDoc =
    | { kind: "cv"; id: string; editorBase: string; title: string; cvData: CVData }
    | { kind: "letter"; id: string; editorBase: string; title: string; textContent: string }
    | { kind: "card"; id: string; editorBase: string; title: string; textContent: string };
  const [builtDoc, setBuiltDoc] = useState<BuiltDoc | null>(null);
  // A guest's freshly-built CV — shown as a preview card in the chat (see it,
  // pick a colour, download) instead of dropping them into the full editor.
  const [guestCvReady, setGuestCvReady] = useState<CVData | null>(null);
  const [exporting, setExporting] = useState<null | "pdf" | "docx" | "txt">(null);
  const cvExportRef = useRef<HTMLDivElement>(null);
  const letterExportRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  // Phase 2 (B): the confirmations chip under the header hides once tapped.
  const [showConfirmChip, setShowConfirmChip] = useState(true);
  // Live pending-confirmation count. initialUnconfirmed is a server snapshot;
  // this state tracks resolutions made IN this thread (ConfirmationsCard) so
  // the chip count never goes stale after the user confirms facts.
  const [pendingCount, setPendingCount] = useState(initialUnconfirmed);
  // Phase 2 (D): the last tool actually executed (read completed / write
  // applied), sent with the next turn so the server chains the next step.
  const lastExecutedRef = useRef<{ tool: string; args: Record<string, unknown>; score?: number; applicationId?: string } | null>(null);
  const markExecuted = useCallback((a: { tool: string; args: Record<string, unknown>; score?: number; applicationId?: string }) => {
    lastExecutedRef.current = a;
  }, []);
  // The one-tap continuation proposed by the server (suggestedNext).
  const [suggestedNext, setSuggestedNext] = useState<{ tool: string; args: Record<string, unknown>; href?: string; reason: { en: string; sw: string } } | null>(null);
  // Bug 4 fix — advance the chain IMMEDIATELY after a write tool completes.
  // The server's suggestedNext only arrives on the NEXT turn (send() sets it
  // from the response), so after saving a cover letter the chip kept showing
  // the stale "Endelea: coverLetter.generate" from the previous turn — tapping
  // it regenerated a letter instead of proposing jobs.track. This mirrors the
  // orchestrator's deterministic rules (lib/assistant/orchestrator.ts) so the
  // chip always reflects the step that just finished, without waiting for the
  // next round-trip. Read-only mirror: never auto-runs, only proposes.
  const advanceChain = useCallback((a: { tool: string; args: Record<string, unknown>; applicationId?: string }) => {
    if (a.tool === "cv.tailor") {
      const jd = typeof a.args?.jobDescription === "string" ? a.args.jobDescription : lastJdRef.current;
      setSuggestedNext({
        tool: "coverLetter.generate",
        args: jd ? { jobDescription: jd } : {},
        reason: {
          en: "CV tailored — next, write the cover letter for this job.",
          sw: "CV imekamilika — sasa andika barua ya maombi ya kazi hii.",
        },
      });
      return;
    }
    if (a.tool === "coverLetter.generate") {
      const jd = lastJdRef.current || undefined;
      setSuggestedNext({
        tool: "jobs.track",
        args: {
          jobTitle: typeof a.args?.jobTitle === "string" ? a.args.jobTitle : undefined,
          companyName: typeof a.args?.company === "string" ? a.args.company : undefined,
          jobDescription: jd,
        },
        reason: {
          en: "Letter ready — track the application so we can follow up.",
          sw: "Barua iko tayari — fuatilia ombi ili tuweze kufuatilia.",
        },
      });
      return;
    }
    if (a.tool === "jobs.track") {
      setSuggestedNext({
        tool: "interview.prep",
        args: {},
        href: a.applicationId ? `/interview?app=${a.applicationId}` : "/interview",
        reason: {
          en: "Application tracked — want to prep for the interview?",
          sw: "Ombi limefuatiliwa — unataka kujitayarisha kwa mahojiano?",
        },
      });
    }
  }, []);
  // Cockpit state: the live active CV (edits apply to it), whether we're waiting
  // for a pasted job description, and which apply-action is in flight.
  const [cv, setCv] = useState<CVData | null>(activeCv);

  // WS-4 — AI auto-versioning: capture a recoverable snapshot BEFORE any AI
  // write applies, so a regretted tailor/enhance is always undoable from the
  // editor's version history. Fire-and-forget — a failed snapshot must never
  // block the apply (the versions route prunes to the newest 20 per doc).
  const snapshotBeforeAiApply = async (toolName: string) => {
    if (!activeCvId || !cv) return;
    try {
      await fetch("/api/documents/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: activeCvId,
          documentType: "cv",
          title: `AI: ${toolName} (${new Date().toISOString().slice(0, 16).replace("T", " ")})`,
          snapshot: { title: activeCvTitle ?? "", data: cv },
        }),
      });
    } catch { /* non-fatal */ }
  };

  // WS-9 — deterministic before/after diff for a tailor proposal.
  // Defensive: an OLD persisted tailor card (pre-WS-9) may lack `experience`
  // entirely — never let a restored thread crash the whole page. A missing
  // experience array just means no per-entry diff (summary-only change).
  const diffForTailor = (current: CVData, card: Extract<CardData, { kind: "tailor" }>) => {
    const expById = new Map(
      Array.isArray(card.experience)
        ? card.experience.map((e) => [e?.id, e?.description])
        : [],
    );
    const proposed: CVData = {
      ...current,
      summary: card.summary ?? current.summary,
      experience: current.experience.map((e) => (expById.has(e.id) ? { ...e, description: expById.get(e.id)! } : e)),
    };
    return diffCv(current, proposed);
  };

  // WS-9 — "Keep original": retire the card (presentation only, no mutation).
  const dismissCard = (msgIndex: number) => {
    setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card ? { ...msg, card: { ...msg.card, dismissed: true } } : msg)));
  };
  const [awaitingJd, setAwaitingJd] = useState(false);
  const [actionBusy, setActionBusy] = useState<null | "tailor" | "apply" | "summary" | "pdf" | "cover" | "track">(null);
  // Raw attached files, kept so the AI can run PDF tools on them (server-side).
  const attachedFilesRef = useRef<File[]>([]);
  const [attachedCount, setAttachedCount] = useState(0);
  // A file the user attached while a turn was in flight — read its text and
  // feed it in as soon as we're free. Without this the file sat in the chip
  // "attached" but its contents never reached the AI, so Sumaiya kept asking
  // for a CV that was right there.
  const pendingFileRef = useRef<File | null>(null);
  const [attachState, setAttachState] = useState<"" | "reading" | "waiting" | "read" | "error">("");
  // Shared memory: the last job description seen this thread (from a match or
  // tailor), so cover-letter / tracking can reuse it without re-pasting.
  const lastJdRef = useRef<string>("");
  // Phase 2 (C) restraint: signal keys (type|trigger) already rendered this
  // thread. Sent back to the server so a nudge is never offered twice, and
  // persisted with the thread so it survives a reload. Mid-build (gathering a
  // document in chat) the whole nudge channel is silenced — see suppressSignals.
  const signalsShownRef = useRef<Set<string>>(new Set());
  // A brief "thinking" beat before instant deterministic cards — so the
  // assistant feels like it's working, not spitting out a form.
  const [analyzing, setAnalyzing] = useState(false);
  // The "what do you want today?" chooser retires once the user picks a card
  // or chooses to just type (the "I have a question" card).
  const [chooserDismissed, setChooserDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // ── Universal voice ─────────────────────────────────────────────────────────
  // TTS read-back reuses the shared lib/tts service (the same one the Career
  // Interview uses) — no parallel speech system. Voice INPUT uses the Web
  // Speech API only where the browser actually supports it (typing fallback
  // everywhere; iOS Safari hides the mic — it has no SpeechRecognition even
  // prefixed, so we never claim it works there).
  const tts = useTts({ lang: convoSw ? "sw" : "en" });
  const [listening, setListening] = useState(false);
  // Friendly inline mic state (P5): permission denied / no speech / generic
  // errors are explained instead of a silent no-op. Localised at set time.
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);
  // Browser-API detection MUST happen after mount — `typeof window` in a
  // useMemo/state initializer makes the server HTML (false) differ from the
  // client (true) → React hydration error #418/#422 on EVERY page load. The
  // mic button simply appears a frame later on supporting browsers; on
  // unsupported ones it stays hidden (typing fallback).
  const [micSupported, setMicSupported] = useState(false);
  useEffect(() => {
    setMicSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);
  const speakMessage = (text: string) => {
    if (tts.speaking) tts.cancel();
    else tts.speak(text);
  };
  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      // Mic button is hidden when unsupported — this is just a defensive guard
      // so the state is never a silent no-op if the API vanishes mid-session.
      setMicError(micErrorMessage("service-not-allowed", sw));
      return;
    }
    setMicError(null);
    // Snapshot what the user already typed so dictation APPENDS to it instead
    // of replacing it. Then always write snapshot + latest cumulative
    // transcript — never append transcripts across interim events (that
    // duplicates words; the newest result is already cumulative).
    const base = input.trim() ? input.trim() + " " : "";
    const rec = new SR();
    rec.lang = sw ? "sw-TZ" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      // Take the LAST result's transcript: for interim results it is the
      // cumulative utterance so far; appending each event would repeat words.
      const last = e.results[e.results.length - 1]?.[0]?.transcript;
      if (last) setInput(base + last.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      // Friendly inline state for permission-denied / no-speech / generic —
      // never a silent no-op (P5).
      const msg = micErrorMessage(e?.error, sw);
      if (msg) setMicError(msg);
    };
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };
  useEffect(() => () => { recRef.current?.stop(); }, []);
  // Synchronous in-flight lock: setSending flips a tick late, so two rapid
  // submits could both pass the `sending` guard and fire the AI turn twice
  // (duplicate greeting / double build). This ref is the authoritative lock.
  const sendingRef = useRef(false);

  // Composer auto-grow (P2): measure with overflow hidden so every engine
  // (iOS WebKit included) reports the FULL content height — an already-
  // scrolling textarea can clamp scrollHeight to its visible box, which makes
  // it "forget" to grow and hides the overflow behind a one-row strip. The
  // clamp itself lives in the pure computeComposerHeight (unit-tested).
  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    const prevOverflow = el.style.overflowY;
    el.style.overflowY = "hidden";
    el.style.height = "auto";
    const sizing = computeComposerHeight(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX);
    el.style.height = `${sizing.height}px`;
    el.style.overflowY = sizing.scrolls ? "auto" : prevOverflow;
  }, []);

  // useLayoutEffect warns during SSR; fall back to useEffect on the server.
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

  // Re-fit the composer after every controlled re-render (typing, paste,
  // autofill, restore) — not just on the onChange tick, so a long value can
  // never land in an un-grown box.
  useIsomorphicLayoutEffect(() => {
    autoGrow(inputRef.current);
  }, [input, autoGrow]);

  useEffect(() => {
    // Cockpit mode is a fresh, ephemeral thread for THIS CV — don't restore (or
    // clobber) the separate build session; lead with the proactive greeting.
    if (cockpit) {
      setMessages([{ role: "assistant", content: openingMessage }]);
      setRestored(true);
      return;
    }
    try {
      // v4 — multi-conversation store: read it, validate every conversation
      // (tampered storage never crashes render), and restore the ACTIVE one.
      // No v4 store yet → migrate the legacy v3 single thread.
      let store: ConversationStoreData | null = null;
      const rawV4 = localStorage.getItem(STORAGE_KEY);
      if (rawV4) {
        try {
          const parsed = JSON.parse(rawV4) as ConversationStoreData;
          if (parsed && Array.isArray(parsed.conversations)) {
            const valid = parsed.conversations.filter(isValidConversation);
            store = pruneConversations({ conversations: valid, activeId: parsed.activeId ?? null });
          }
        } catch { /* fall through to legacy migration */ }
      }
      if (!store) {
        const rawV3 = localStorage.getItem(legacyStorageKey(userId));
        if (rawV3) {
          try {
            const legacy = JSON.parse(rawV3) as LegacyThread;
            store = migrateLegacy(legacy, Date.now(), sw);
          } catch { /* fresh start */ }
        }
      }
      if (store) {
        setConvos(store);
        const active =
          store.conversations.find((c) => c.id === store.activeId) ??
          store.conversations[0] ??
          null;
        // Shape-validate the restored thread: stale/tampered storage (schema
        // drift, hand-edited) must never crash the render (e.g. docType not in
        // DOC_LABEL, cards missing arrays). Invalid → fresh start.
        if (
          active &&
          Array.isArray(active.messages) &&
          active.messages.length > 0 &&
          active.messages.every((m) => {
            const mm = m as Partial<Msg> | null;
            return mm && (mm.role === "assistant" || mm.role === "user") && typeof mm.content === "string";
          })
        ) {
          const saved = active as unknown as SavedState & { messages: Msg[] };
          if (saved.effort === "fast" || saved.effort === "deep") setEffort(saved.effort);
          const dt = saved.docType;
          const docTypeOk = dt === null || (typeof dt === "string" && dt in DOC_LABEL);
          // Sanitize restored cards: a persisted thread can carry cards written
          // by an OLDER build whose shape drifted (e.g. pre-WS-9 tailor cards
          // with a missing `experience` array). An invalid card must NEVER
          // crash the whole page — drop just that card, keep the message text.
          const sanitizedMessages = saved.messages.map((m) => {
            if (!m.card) return m;
            const c = m.card as Record<string, unknown>;
            const kind = c.kind as string;
            const validCard =
              (kind === "ats" && typeof c.score === "number" && Array.isArray(c.checks)) ||
              (kind === "match" && typeof c.score === "number" && Array.isArray(c.matched) && Array.isArray(c.missing) && typeof c.jd === "string") ||
              (kind === "tailor" && typeof c.summary === "string" && Array.isArray(c.experience)) ||
              (kind === "jobs" && typeof c.query === "string" && Array.isArray(c.jobs)) ||
              (kind === "summary" && typeof c.summary === "string") ||
              (kind === "skills" && Array.isArray(c.skills)) ||
              (kind === "coverLetter" && typeof c.content === "string") ||
              (kind === "trackJob") ||
              (kind === "docIntel" && typeof c.op === "string" && typeof c.text === "string") ||
              (kind === "smartFit" && typeof c.templateId === "string") ||
              (kind === "skillGap" && typeof c.jobTitle === "string" && Array.isArray(c.strengths) && Array.isArray(c.gaps)) ||
              (kind === "cvCompare" && typeof c.otherTitle === "string") ||
              (kind === "confirmations" && Array.isArray(c.items)) ||
              (kind === "signals" && Array.isArray(c.items));
            return validCard ? m : { ...m, card: undefined };
          });
          setMessages(sanitizedMessages);
          setDocType((docTypeOk ? dt : null) as DocType | null);
          setDone(!!saved.done);
          // Fix 3: a restored thread keeps its OWN language — a Swahili thread
          // started on an English UI must not flip back to English on reload.
          const lastUserMsg = [...saved.messages].reverse().find((m) => m.role === "user");
          if (lastUserMsg) {
            const threadLang = detectMessageLang(lastUserMsg.apiContent ?? lastUserMsg.content);
            if (threadLang) setConvoSw(threadLang === "sw");
          }
          // Thread memory survives reloads: remember the last pasted job so
          // match/tailor never re-asks for it, and the nudges already shown so
          // the server can filter repeats.
          const pasted = findLastJobInHistory(saved.messages);
          if (pasted) lastJdRef.current = pasted;
          if (Array.isArray(saved.seenSignals)) {
            saved.seenSignals.forEach((k) => signalsShownRef.current.add(k));
          }
        } else {
          setMessages([{ role: "assistant", content: openingMessage }]);
        }
        // Persist the migrated/pruned store once so the next mount is stable.
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* non-fatal */ }
        // Trust-loop fix: a restored thread can carry a STALE confirmations
        // card or "facts await" nudge from before the user confirmed facts
        // elsewhere (editor/Settings). Re-check the live pending list and
        // drop any confirmations surfaces that no longer have pending facts
        // — the count shown must always reflect the DB, not the last save.
        // Guests have no profile/DB — skip the call (it would just 401).
        void (async () => {
          if (guest) return;
          try {
            const res = await fetch("/api/profile/confirmations");
            const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: PendingConfirmation[] };
            if (!j.success) return;
            const liveKeys = new Set((j.data ?? []).map((c) => c.key));
            setPendingCount(j.data?.length ?? 0);
            setMessages((msgs) => msgs.map((mm) => {
              if (mm.card?.kind === "confirmations") {
                // Keep only facts still pending; retire the card when none.
                const items = mm.card.items.filter((c) => liveKeys.has(c.key));
                if (!items.length) return { ...mm, card: { ...mm.card, resolved: true } };
                return { ...mm, card: { ...mm.card, items } };
              }
              if (mm.card?.kind === "signals") {
                // Drop confirmations nudges when NOTHING is pending anymore
                // (the stale "N facts await" chip must not survive a reload).
                if (j.data?.length === 0) {
                  const items = mm.card.items.filter((s) => s.type !== "confirmations");
                  return items.length ? { ...mm, card: { ...mm.card, items } } : { ...mm, card: undefined };
                }
              }
              return mm;
            }));
          } catch { /* fresh start */ }
        })();
        setRestored(true);
        return;
      }
    } catch { /* fresh start */ }
    setMessages([{ role: "assistant", content: openingMessage }]);
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The lang context resolves AFTER first paint, so the mount snapshot can be
  // in the wrong language. Re-sync the opener — but ONLY when the thread is a
  // single untouched opener (no user turns, no cards, content still the
  // greeting). Once the conversation has started, never rewrite history.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant" || prev[0].card || prev[0].content === openingMessage) {
        return prev;
      }
      return [{ role: "assistant", content: openingMessage }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sw, openingMessage]);

  useEffect(() => {
    // Don't persist the cockpit thread — it's tied to a CV, not the build funnel.
    if (!restored || building || cockpit) return;
    // Nothing to save until the user actually engages (greeting-only threads
    // would pile up as "New chat" entries).
    const hasUserTurn = messages.some((m) => m.role === "user") || done;
    if (!hasUserTurn) return;
    setConvos((prev) => {
      const existing = prev.conversations.find((c) => c.id === prev.activeId);
      const label = docType ? (sw ? DOC_LABEL[docType].sw : DOC_LABEL[docType].en) : null;
      const convo: StoredConversation = {
        id: prev.activeId ?? nanoid(),
        title: conversationTitle(firstUserMessage(messages as { role?: string; content?: string }[]), label ?? existing?.title ?? null, sw),
        docType,
        done,
        effort,
        seenSignals: [...signalsShownRef.current],
        messages: messages as unknown[],
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      const next = upsertConversation(prev, convo);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
      catch { /* non-fatal */ }
      return next;
    });
    // STORAGE_KEY is stable per mount (derived from the immutable userId).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, docType, done, restored, building, cockpit, sw]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, building, analyzing]);

  // Re-pin the newest message when the composer grows: the message list is a
  // flex child, so a taller textarea shrinks it — without this the list keeps
  // its old scrollTop and the newest message hides behind the composer bar.
  // Only re-pin when the user was already at the bottom (never yank a reader
  // who scrolled up to review history).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const wasPinned = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (wasPinned) el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [input]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const showChips = !docType && !sending && !uploading && userTurns === 0;

  const send = useCallback(async (history: Msg[], dt: DocType | null) => {
    if (sendingRef.current) return; // synchronous lock — blocks rapid double-submit
    sendingRef.current = true;
    setSending(true);
    setError("");
    // P0 FIX 3: remember the last REAL job description the user pasted /
    // attached in this thread, so jobs.match / cv.tailor can reuse it instead
    // of running a match on a conversational sentence.
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const content = lastUser.apiContent ?? lastUser.content;
      if (looksLikeJobDescription(content)) lastJdRef.current = content;
    }
    // Phase 2 (C) restraint: while the user is mid-build in a chat thread
    // (gathering a document, not done, not cockpit), the proactive nudge
    // channel is silenced — Sumaiya must not interrupt the build with offers.
    // After `done` (or in the cockpit with a CV loaded) nudges are welcome.
    const suppressSignals = !done && !cockpit && messages.some((m) => m.role === "user");
    try {
      const res = await fetch("/api/ai/assistant-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Card-only messages (confirmations/signals/jobs) carry empty
          // content — they're UI artifacts, not turns. Strip them here
          // (primary fix) so an empty entry never 400s the schema; the
          // server also drops empties as a backstop.
          messages: toApiMessages(history),
          lang: convoSw ? "sw" : "en",
          // Companion-first: docType is ONLY sent once the user actually chose
          // a document (chip / explicit ask). Free text before that stays
          // general conversation — the server's intent engine decides whether
          // a document is being built, never a client-side "default to CV".
          ...(dt ? { docType: dt } : {}),
          profile: profile ?? undefined,
          hasCv: !!cv,
          hasFile: attachedFilesRef.current.length > 0,
          lastExecuted: lastExecutedRef.current ?? undefined,
          // The thread's target job (already pasted) — the server tells the
          // model this IS the job, so it never re-asks "paste the job".
          lastJd: lastJdRef.current || undefined,
          // Restraint: nudges already shown (dedupe) + silence mid-build.
          seenSignals: [...signalsShownRef.current],
          suppressSignals,
          effort,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { reply: string; done: boolean; action?: { tool: string; args: Record<string, unknown> } | null; confirmations?: PendingConfirmation[]; signals?: Signal[]; suggestedNext?: { tool: string; args: Record<string, unknown>; href?: string; reason: { en: string; sw: string } } | null; leaveDocMode?: boolean }; error?: string };
      if (!res.ok || !json.success || !json.data?.reply) throw new Error(s(json.error) || "failed");
      const data = json.data;
      // If the assistant chose a read-tool action, run it and attach its result
      // card to this reply. Write tools (tailor, etc.) are handled via their own
      // preview+confirm cards, not here.
      let card: CardData | undefined;
      const act = data.action;
      if (act && cv) {
        if (act.tool === "ats.check") {
          const checks = analyzeCv(cv, sw);
          const score = atsScore(checks);
          card = { kind: "ats", score, checks };
          markExecuted({ tool: "ats.check", args: act.args ?? {}, score });
        } else if (act.tool === "jobs.match") {
          // P0 FIX 3: never run a match on conversational text. Accept the
          // server's JD only if it looks like one; otherwise fall back to the
          // last real job pasted in this thread. No real JD → no card at all
          // (the assistant's text reply asks for the job) — a bogus 0% match
          // with the user's own words as "missing keywords" is never rendered.
          const raw = String(act.args?.jobDescription ?? "");
          let jd = looksLikeJobDescription(raw) ? raw : lastJdRef.current;
          if (!looksLikeJobDescription(jd)) {
            const fromThread = [...history]
              .reverse()
              .filter((m) => m.role === "user")
              .map((m) => m.apiContent ?? m.content)
              .find((c) => looksLikeJobDescription(c)) ?? "";
            jd = fromThread;
          }
          if (looksLikeJobDescription(jd)) {
            lastJdRef.current = jd;
            const r = matchCvToJd(cv, jd);
            card = { kind: "match", score: r.score, matched: r.matched, missing: r.missing, jd };
            markExecuted({ tool: "jobs.match", args: { jobDescription: jd }, score: r.score });
          }
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply, ...(card ? { card } : {}) }]);
      if (data.done) setDone(true);
      // Companion-first: the user refused/abandoned the selected document twice
      // — drop the docType so the UI returns to general chat (chips reappear)
      // and the next turn goes out WITHOUT a forced document mode.
      if (data.leaveDocMode) setDocType(null);
      // Phase 2 (D): the server's proposed next step (one-tap continuation).
      setSuggestedNext(data.suggestedNext ?? null);

      // Phase 2 (A): the trust loop — facts Sumaiya drafted that still await
      // the user's confirmation. Render the inline confirm card once per
      // thread (never nag repeatedly); resolving here updates every surface.
      if (data.confirmations?.length) {
        setMessages((m) =>
          m.some((msg) => msg.card?.kind === "confirmations")
            ? m
            : [...m, { role: "assistant", content: "", card: { kind: "confirmations", items: data.confirmations as PendingConfirmation[] } }],
        );
      }
      // Phase 2 (C): proactive signals — render the nudge chips once per
      // thread; tapping one runs the resolving tool. Record every rendered
      // key so the server filters repeats on the next turn (restraint).
      if (data.signals?.length) {
        data.signals.forEach((sig) => signalsShownRef.current.add(signalKey(sig)));
        setMessages((m) =>
          m.some((msg) => msg.card?.kind === "signals")
            ? m
            : [...m, { role: "assistant", content: "", card: { kind: "signals", items: data.signals as Signal[] } }],
        );
      }

      // Write-tool actions: kick off the AI/preview flow that ends in a
      // confirm-before-save card (via the stable handlers ref, so no stale cv).
      if (act && cv) {
        if (act.tool === "cv.tailor") {
          // The server's tailor intent may carry a fresh JD or none. When none,
          // reuse the thread's remembered job — never die silently. And with
          // NO job on file at all, ask for it in chat (the answer flows back
          // through the normal turn and the server re-issues the intent).
          const jd = String((act.args?.jobDescription ?? "") as string);
          const target = looksLikeJobDescription(jd) ? jd : lastJdRef.current;
          if (looksLikeJobDescription(target)) {
            writeHandlersRef.current.runTailor(target);
          } else {
            setMessages((m) => [...m, { role: "assistant", content: sw ? "Niambie — bandika maelezo ya kazi unayolenga, nami nitengeneze CV yako kuilenga." : "Paste the job you're targeting and I'll tailor your CV to it." }]);
          }
        } else if (act.tool === "cv.improveSummary") {
          const directive = typeof act.args?.directive === "string" ? act.args.directive : undefined;
          void writeHandlersRef.current.runImproveSummary(directive);
        } else if (act.tool === "cv.addSkills") {
          const skills = Array.isArray(act.args?.skills) ? (act.args.skills as unknown[]).map(String).filter(Boolean) : [];
          if (skills.length) writeHandlersRef.current.previewSkills(skills);
        } else if (act.tool === "coverLetter.generate") {
          void writeHandlersRef.current.runCoverLetter(act.args ?? {});
        } else if (act.tool === "jobs.track") {
          writeHandlersRef.current.previewTrackJob(act.args ?? {});
        } else if (act.tool === "application.update") {
          previewTrackUpdate(act.args ?? {});
        }
      }
      // PDF tools operate on the attached file(s), independent of the CV.
      if (act && act.tool.startsWith("pdf.")) {
        void writeHandlersRef.current.runPdfOp(act.tool, act.args ?? {});
      }
      // Document intelligence tools (doc.*) run against the active CV.
      if (act && act.tool.startsWith("doc.") && cv) {
        const op = act.tool.replace("doc.", "") as "summarize" | "expand" | "shorten" | "proofread" | "convert" | "compare";
        void writeHandlersRef.current.runDocIntel(op, act.args ?? {});
      }
      // Templates + SmartFit (template.smartFit) — deterministic design engine.
      if (act?.tool === "template.smartFit") {
        const directive = typeof act.args?.directive === "string" ? act.args.directive : "";
        if (directive.trim()) writeHandlersRef.current.runSmartFit(directive);
      }
      // Skill-gap check (career.skillGap) — deterministic facts + AI plan.
      if (act?.tool === "career.skillGap") {
        const jd = typeof act.args?.jobDescription === "string" ? act.args.jobDescription : "";
        if (jd.trim()) void writeHandlersRef.current.runSkillGap({
          jobTitle: typeof act.args?.jobTitle === "string" ? act.args.jobTitle : undefined,
          jobDescription: jd,
        });
        markExecuted({ tool: "career.skillGap", args: act.args ?? {} });
      }
      // CV comparison (cv.compare) — two CVs vs each other / vs a job.
      if (act?.tool === "cv.compare") {
        const other = typeof act.args?.otherCvText === "string" ? act.args.otherCvText : "";
        if (other.trim()) void writeHandlersRef.current.runCvCompare({
          otherCvText: other,
          jobDescription: typeof act.args?.jobDescription === "string" ? act.args.jobDescription : undefined,
        });
        markExecuted({ tool: "cv.compare", args: act.args ?? {} });
      }
      // Business documents (letter.*) — reuse the letter engine: switch the
      // doc type so the build flow produces a letter (the model picks the
      // letterType — quotation/invoice/letterhead/business-proposal — from the
      // conversation on build). The assistant's reply already carries the
      // questions; no seeded message or re-send needed (re-entering send would
      // deadlock on the sendingRef lock).
      if (act?.tool && ["letter.quotation", "letter.invoice", "letter.letterhead", "letter.proposal"].includes(act.tool)) {
        setDocType("letter");
      }

      // jobs.search is async (fetch the live feed, filter client-side by the
      // query since the feed endpoint takes no params) — append a jobs card.
      if (act?.tool === "jobs.search") {
        try {
          const jres = await fetch("/api/jobs/");
          const jjson = (await jres.json().catch(() => ({}))) as { data?: { id: string; title: string; company: string; location: string; category?: string; description?: string }[] };
          const all = jjson.data ?? [];
          const q = String((act.args?.query ?? "") as string).toLowerCase().trim();
          // Score by how many query words appear in the job — a naive substring
          // match on the whole phrase returned nothing for "pharmacy sales rep".
          const qWords = q.split(/[^a-z0-9+#]+/).filter((w) => w.length > 2);
          const scored = all
            .map((j) => {
              const hay = `${j.title} ${j.company} ${j.category ?? ""} ${j.description ?? ""}`.toLowerCase();
              const score = qWords.length ? qWords.filter((w) => hay.includes(w)).length : 1;
              return { j, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score);
          const top = (scored.length ? scored.map((x) => x.j) : all).slice(0, 4)
            .map((j) => ({ id: j.id, title: j.title, company: j.company, location: j.location }));
          setMessages((m) => [...m, {
            role: "assistant",
            content: top.length
              ? (sw ? "Hizi hapa nafasi zinazoendana — bofya kuona zote na kuomba:" : "Here are some matching openings — tap through to see all of them and apply:")
              : all.length === 0
                ? (sw ? "Hakuna nafasi zilizoorodheshwa bado. Nitakuandalia CV yenye nguvu ili uwe tayari zitakapokuja." : "There aren't any jobs listed yet. Let's get your CV strong so you're ready when they land.")
                : (sw ? `Sikupata inayoendana na "${q}". Angalia nafasi zote → /jobs` : `Nothing matched "${q}". Browse everything on the jobs page → /jobs`),
            ...(top.length ? { card: { kind: "jobs" as const, query: q, jobs: top } } : {}),
          }]);
          markExecuted({ tool: "jobs.search", args: act.args ?? {} });
        } catch { /* non-fatal — the reply already shows */ }
      }
    } catch (err) {
      // Surface the server's real error (quota 429, AI unconfigured 503, …) so
      // the user sees WHY the turn failed instead of a generic retry loop.
      // Never leak a raw object ("[object Object]") — errorMsg coerces.
      setError(errorMsg(err, convoSw, convoSw ? "Samahani, imeshindwa kupata jibu. Jaribu tena." : "Sorry, I couldn't get a reply. Please try again."));
    } finally {
      setSending(false);
      sendingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [sw, profile, cv]);

  // Pick a document type from a chip — kicks off the tailored conversation.
  const handleStartChoice = (choice: StartChoice) => {
    setChooserDismissed(true);
    if (choice === "cv") pickDoc("cv");
    else if (choice === "cover-letter") pickDoc("cover-letter");
    else if (choice === "apply") router.push("/snap");
    else setTimeout(() => inputRef.current?.focus(), 0); // "ask" — just type
  };

  const pickDoc = (dt: DocType) => {
    if (sendingRef.current || sending || building) return;
    const userMsg: Msg = { role: "user", content: sw ? DOC_CHIPS.find((d) => d.id === dt)!.sw : DOC_CHIPS.find((d) => d.id === dt)!.en };
    const history = [...messages, userMsg];
    setMessages(history);
    setDocType(dt);
    void send(history, dt);
  };

  const submit = () => {
    const value = input.trim();
    if (!value || sendingRef.current || sending || building || uploading) return;
    // Stop any active dictation — the message is being sent as-is (P5).
    recRef.current?.stop();
    setListening(false);
    // Cockpit: the assistant is waiting for a job description to match against.
    if (awaitingJd && cv) {
      // P0 (Fix 1): never run a match on a conversational sentence in the
      // awaiting-JD path. A chat message as a "JD" produces a bogus 0% card
      // with the user's own words as missing keywords. Fail closed: reply in
      // the conversation language, ask for the real advert, STAY in awaitingJd.
      if (!looksLikeJobDescription(value)) {
        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        const reply = convoSw
          ? "Hiyo haionekani kama tangazo la kazi — bandika maelezo halisi ya kazi (mahitaji, majukumu, kampuni) nami nitakulinganisha na CV yako."
          : "That doesn't look like a job posting — paste the actual job description (requirements, duties, company) and I'll match it against your CV.";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        return; // stay in awaitingJd — the next paste is still treated as a JD
      }
      setAwaitingJd(false);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      runMatch(value);
      return;
    }
    // A pasted link (usually a job posting) is read instead of sent as a message.
    if (/^https?:\/\/\S+$/i.test(value)) {
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      void onAttachUrl(value);
      return;
    }
    // Fix 3: the conversation language follows what the USER actually types.
    // A JD is content, not conversation — never flip on pasted adverts.
    const detected = looksLikeJobDescription(value) ? null : detectMessageLang(value);
    if (detected) setConvoSw(detected === "sw");
    // Fix 2: the exact same sentence three times gets a VARIED, deterministic
    // ack + concrete next steps — no AI round-trip that repeats itself
    // verbatim. (Different off-topic messages still go to the model; the
    // system prompt now also instructs it to vary redirects.)
    const repeatCount = countIdenticalUserMessages(messages, value);
    if (repeatCount + 1 >= REPEAT_THRESHOLD) {
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      const pool = convoSw ? REPEAT_REPLIES_SW : REPEAT_REPLIES_EN;
      const reply = pool[(repeatCount + 1 - REPEAT_THRESHOLD) % pool.length];
      const userMsg: Msg = { role: "user", content: value };
      setMessages((m) => [...m, userMsg, { role: "assistant", content: reply }]);
      return;
    }
    // Companion-first: typing WITHOUT choosing a document chip stays general
    // conversation — no more "default to CV". The server's intent engine
    // engages document mode only when the user actually asks for career help.
    const dt: DocType | null = docType;
    const userMsg: Msg = { role: "user", content: value };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    void send(history, dt);
  };

  const retry = () => {
    if (sendingRef.current || sending || building) return;
    void send(messages, docType);
  };

  // Feed extracted content (from a file OR a link) into the conversation. The
  // assistant's intent engine decides what it is and whether a document is
  // being built — attaching a file no longer force-switches the whole chat
  // into CV-build mode (that hijacked a "show me jobs" conversation).
  // Only extracted text leaves the device.
  const feedAttachment = (label: string, text: string, source: string) => {
    const apiContent = `[The user attached ${source}]. Content below — read it and use it correctly: if it's the user's own CV / certificate / personal details, use it to fill THEIR information and answer what they actually asked (don't re-ask what the file shows). If it's a JOB POSTING, note the role + company and offer to match/tailor. NEVER claim experience the user doesn't have.\n\n"""\n${text.slice(0, 12000)}\n"""`;
    const userMsg: Msg = { role: "user", content: label, apiContent };
    const history = [...messages, userMsg];
    setMessages(history);
    void send(history, docType);
  };

  // Upload ANY supported file — PDF, photo/scan, or text — extract its text in
  // the browser (text layer, or OCR for images/scans), then feed it in.
  const onAttachFile = async (file: File) => {
    // Busy right now — remember the file and read it the moment we're free.
    if (sendingRef.current || sending || building || uploading) {
      pendingFileRef.current = file;
      setAttachState("waiting");
      return;
    }
    setError("");
    setAttachState("reading");
    setUploading(sw ? "Inasoma faili yako…" : "Reading your file…");
    const isPdfOrDoc =
      /pdf|wordprocessingml|msword/.test(file.type) || /\.(pdf|docx?)$/i.test(file.name);
    try {
      let text = "";
      try {
        ({ text } = await extractTextFromFile(file, (p) => {
          setUploading(
            p.stage === "ocr"
              ? (sw ? `Inasoma picha… ${p.pct}%` : `Reading image… ${p.pct}%`)
              : (sw ? "Inasoma faili yako…" : "Reading your file…")
          );
        }));
      } catch (clientErr) {
        // Browser extraction is fragile (pdf.js worker, WASM OCR, mammoth). For
        // PDFs and Word docs the server has a reliable path (unpdf / mammoth) —
        // fall back to it before giving up.
        if (!isPdfOrDoc) throw clientErr;
        setUploading(sw ? "Inasoma faili yako…" : "Reading your file…");
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/tools/extract-text", { method: "POST", body: form });
        const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        if (!res.ok || !json.text) throw clientErr;
        text = json.text;
      }
      setUploading(null);
      if (!text || text.replace(/\s/g, "").length < 30) {
        setAttachState("error");
        setError(sw ? "Sikuweza kusoma faili hii. Jaribu nyingine, au andika taarifa." : "Couldn't read that file. Try another, or just type the details.");
        return;
      }
      pendingFileRef.current = null;
      setAttachState("read");
      const short = file.name.length > 32 ? file.name.slice(0, 30) + "…" : file.name;
      feedAttachment(`📎 ${short}`, text, `a file ("${file.name}")`);
    } catch (e) {
      setUploading(null);
      setAttachState("error");
      const code = e instanceof ExtractionError ? e.code : "";
      setError(
        code === "TOO_LARGE" ? (sw ? "Faili ni kubwa mno (kiwango 25MB)." : "That file is too large (max 25MB).")
          : code === "TIMEOUT" || code === "MEMORY" ? (sw ? "Faili hii ni kubwa au ngumu sana kuisoma kwenye simu. Jaribu CV fupi (kurasa 1–3), au andika/bandika taarifa zako hapa." : "This file is too large or complex to read on a phone. Try a shorter CV (1–3 pages), or just type/paste your details here.")
          : code === "OCR_FAILED" || code === "NO_TEXT" ? (sw ? "Sikuweza kusoma maandishi kwenye faili hii." : "Couldn't read text from that file.")
          : (sw ? "Imeshindwa kusoma faili. Jaribu tena." : "Couldn't read the file. Try again.")
      );
    }
  };

  // Read a pasted link (usually a job posting) server-side and feed it in.
  const onAttachUrl = async (url: string) => {
    if (sending || building || uploading) return;
    setError("");
    setUploading(sw ? "Inasoma kiungo…" : "Reading the link…");
    try {
      const res = await fetch("/api/ai/read-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { text: string; title?: string }; error?: string };
      setUploading(null);
      if (!res.ok || !json.success || !json.data?.text) {
        setError(errorMsg(json.error, sw, sw ? "Sikuweza kusoma kiungo. Bandika maandishi ya kazi badala yake." : "Couldn't read that link. Paste the job text instead."));
        return;
      }
      const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "link"; } })();
      feedAttachment(`🔗 ${json.data.title || host}`, json.data.text, `a link (${url})`);
    } catch {
      setUploading(null);
      setError(sw ? "Imeshindwa kusoma kiungo. Jaribu tena." : "Couldn't read the link. Try again.");
    }
  };

  // A file was attached mid-turn — read it now that we're free.
  useEffect(() => {
    if (sendingRef.current || sending || building || uploading) return;
    const f = pendingFileRef.current;
    if (!f) return;
    const id = setTimeout(() => { if (pendingFileRef.current === f) void onAttachFile(f); }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending, building, uploading]);

  // Turn the whole conversation into the chosen document, then open its editor.
  const build = useCallback(async () => {
    // Never let build race an in-flight send(): the transcript snapshot could
    // miss a turn the AI is still appending, and two AI calls would run at
    // once. The CTA is also disabled while sending, but this is the authority.
    if (sendingRef.current || sending) return;
    const dt = docType ?? "cv";
    setBuilding(true);
    setError("");
    const transcript = messages
      .map((m) => `${m.role === "user" ? (sw ? "MIMI" : "ME") : (sw ? "MSAIDIZI" : "ASSISTANT")}: ${m.apiContent ?? m.content}`)
      .join("\n");

    const fail = (msg?: unknown) => { setError(errorMsg(msg, sw, sw ? "Imeshindwa. Jaribu tena." : "Something went wrong. Try again.")); setBuilding(false); };

    try {
      const buildRes = await fetch("/api/ai/build-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: dt, text: transcript.slice(0, 24000), lang: convoSw ? "sw" : "en" }),
      });
      const buildJson = (await buildRes.json().catch(() => ({}))) as { success?: boolean; data?: Record<string, unknown>; error?: string };
      if (!buildRes.ok || !buildJson.success || !buildJson.data) {
        return fail(sw ? "Imeshindwa kuandika hati. Jaribu tena." : "Couldn't write the document. Please try again.");
      }
      const d = buildJson.data;

      // Guests: no DB write. Stash the built CV in the guest editor's localStorage
      // doc and hand off — the guest editor prompts sign-up only to save/download.
      if (guest) {
        const cvData: CVData = toCvData(d);
        stashGuestCv(cvData, "rift", "#DA4A1C", sw);
        setGuestCvReady(cvData);
        setDone(true);
        setBuilding(false);
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: sw
            ? "Nimemaliza! Hii hapa CV yako — chagua rangi, pakua, au fungua kihariri kwa mabadiliko zaidi."
            : "Done! Here's your CV — pick a colour, download it, or open the editor for more.",
        }]);
        return;
      }

      const p = profile;
      const or = (v: string, fallback?: string) => v || fallback || "";

      // Map the AI output into the right create request per type, filling any
      // identity/contact BLANKS from the saved profile (memory). Also collect the
      // facts to seed back into the profile so it learns for next time.
      let endpoint: string;
      let payload: Record<string, unknown>;
      let editorBase: string;
      let seed: Record<string, string> = {};
      // The built CV data (profile-merged) — kept for instant in-chat downloads.
      let builtCvData: CVData | null = null;

      if (dt === "cv") {
        const cvData: CVData = toCvData(d);
        cvData.personal = {
          ...cvData.personal,
          fullName: or(cvData.personal.fullName, p?.fullName),
          jobTitle: or(cvData.personal.jobTitle, p?.jobTitle),
          email: or(cvData.personal.email, p?.email),
          phone: or(cvData.personal.phone, p?.phone),
          location: or(cvData.personal.location, p?.location),
          linkedin: or(cvData.personal.linkedin ?? "", p?.linkedin),
          website: or(cvData.personal.website ?? "", p?.website),
        };
        endpoint = "/api/cv";
        payload = { title: cvData.personal.fullName ? `${cvData.personal.fullName} — CV` : (sw ? "CV yako" : "My CV"), data: cvData };
        editorBase = "/editor/cv/";
        builtCvData = cvData;
        // NOTE: deliberately NOT seeding `summary` into the profile. The summary
        // here is AI-written from the conversation; profile is treated as
        // ground truth for future sessions (targeted CVs, assistant memory), so
        // only identity/contact facts the user themselves stated get seeded.
        seed = { fullName: cvData.personal.fullName, jobTitle: cvData.personal.jobTitle, email: cvData.personal.email, phone: cvData.personal.phone, location: cvData.personal.location, linkedin: cvData.personal.linkedin ?? "", website: cvData.personal.website ?? "" };
      } else if (dt === "cover-letter") {
        const jobTitle = or(s(d.jobTitle), p?.jobTitle), companyName = s(d.companyName);
        endpoint = "/api/cover-letter";
        payload = {
          title: jobTitle ? `${jobTitle}${companyName ? " — " + companyName : ""}` : (sw ? "Barua ya Maombi" : "Cover Letter"),
          content: s(d.content), jobTitle, companyName,
        };
        editorBase = "/editor/cover-letter/";
        seed = { jobTitle };
      } else if (dt === "business-card") {
        const bc: BusinessCardData = {
          ...createEmptyBusinessCardData(),
          name: or(s(d.name), p?.fullName), title: or(s(d.title), p?.jobTitle), company: s(d.company),
          email: or(s(d.email), p?.email), phone: or(s(d.phone), p?.phone),
          website: or(s(d.website), p?.website), address: or(s(d.address), p?.location), tagline: s(d.tagline),
        };
        endpoint = "/api/business-card";
        payload = { title: bc.name ? `${bc.name} — Card` : (sw ? "Kadi Yangu" : "My Card"), data: bc };
        editorBase = "/editor/business-card/";
        seed = { fullName: bc.name, jobTitle: bc.title, email: bc.email, phone: bc.phone, website: bc.website ?? "", location: bc.address ?? "" };
      } else {
        const from = (d.from ?? {}) as Record<string, unknown>;
        const to = (d.to ?? {}) as Record<string, unknown>;
        const letterType: LetterType = LETTER_TYPES.includes(d.letterType as LetterType) ? (d.letterType as LetterType) : "reference";
        const base = createEmptyLetterData(letterType, convoSw ? "sw" : "en");
        const fromMerged = {
          name: or(s(from.name), p?.fullName), title: or(s(from.title), p?.jobTitle),
          company: s(from.company), address: or(s(from.address), p?.location),
          email: or(s(from.email), p?.email), phone: or(s(from.phone), p?.phone),
        };
        const letterData: LetterData = {
          ...base,
          letterType,
          from: fromMerged,
          to: { name: s(to.name), title: s(to.title), company: s(to.company), address: s(to.address) },
          subject: s(d.subject) || base.subject,
          body: s(d.body),
          closing: s(d.closing) || base.closing,
        };
        endpoint = "/api/letter";
        payload = { title: letterData.subject || (sw ? "Barua yako" : "My Letter"), letterType, data: letterData };
        editorBase = "/editor/letter/";
        seed = { fullName: fromMerged.name, jobTitle: fromMerged.title, email: fromMerged.email, phone: fromMerged.phone, location: fromMerged.address };
      }

      const createRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createJson = (await createRes.json().catch(() => ({}))) as { success?: boolean; data?: { id?: string }; error?: string };
      if (!createRes.ok || !createJson.success || !createJson.data?.id) {
        return fail(errorMsg(createJson.error, sw, sw ? "Imeshindwa kuhifadhi. Jaribu tena." : "Couldn't save it. Please try again."));
      }

      // Learn: fill any BLANK profile fields from this document (the /seed route
      // never overwrites data the user already has), so next time the assistant
      // knows more. Best-effort — never blocks the user from reaching the editor.
      try {
        const seedBody: Record<string, string> = {};
        for (const [k, v] of Object.entries(seed)) {
          if (!v) continue;
          if (k === "email" && !v.includes("@")) continue; // /seed validates email shape
          seedBody[k] = v;
        }
        if (Object.keys(seedBody).length) {
          await fetch("/api/profile/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(seedBody) });
        }
      } catch { /* learning is best-effort */ }

      // The document is saved — stay in the chat and offer instant downloads
      // (PDF / Word / TXT) right here, instead of force-navigating away.
      // (v4 keeps the conversation in history — no storage wipe.)
      const docTitle = typeof payload.title === "string" ? payload.title : (sw ? "Hati Yangu" : "My Document");
      let built: BuiltDoc | null = null;
      if (dt === "cv" && builtCvData) {
        built = { kind: "cv", id: createJson.data.id, editorBase, title: docTitle, cvData: builtCvData };
      } else if (dt === "cover-letter") {
        built = { kind: "letter", id: createJson.data.id, editorBase, title: docTitle, textContent: s(d.content) };
      } else if (dt === "letter") {
        built = { kind: "letter", id: createJson.data.id, editorBase, title: docTitle, textContent: s(d.body) };
      } else if (dt === "business-card") {
        const b = (payload.data ?? {}) as Record<string, unknown>;
        const cardText = [b.name, b.title, b.company, b.email, b.phone, b.website, b.address]
          .filter((v) => typeof v === "string" && v.trim())
          .join("\n");
        built = { kind: "card", id: createJson.data.id, editorBase, title: docTitle, textContent: cardText };
      }
      if (built) {
        setBuiltDoc(built);
        setDone(true);
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: sw
            ? "Hati yako iko tayari! ✅ Chagua muundo hapa chini — PDF, Word, au maandishi — au fungua kwenye mhariri."
            : "Your document is ready! ✅ Pick a format below — PDF, Word, or plain text — or open it in the editor.",
        }]);
      } else {
        router.push(`${editorBase}${createJson.data.id}`);
      }
    } catch {
      fail(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
    }
  }, [docType, messages, router, sw, profile, guest, sending, STORAGE_KEY]);

  const restart = () => {
    if (building) return;
    // New chat — history stays in the store; we just detach from it.
    setConvos((prev) => {
      const next = { ...prev, activeId: null };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
    setMessages([{ role: "assistant", content: openingMessage }]);
    setDocType(null);
    setDone(false);
    setError("");
    setInput("");
    setShowConvos(false);
    setConvoQuery("");
    setBuiltDoc(null);
  };

  // Open a saved conversation: restore its thread, doc context, language and
  // memory (last pasted job + shown nudges) exactly like a reload would.
  const openConvo = (id: string) => {
    const c = convos.conversations.find((x) => x.id === id);
    if (!c) return;
    setConvos((prev) => {
      const next = openConversation(prev, id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
    const msgs = c.messages as Msg[];
    setMessages(msgs);
    const dt = c.docType;
    setDocType((dt === null || (typeof dt === "string" && dt in DOC_LABEL) ? dt : null) as DocType | null);
    setDone(!!c.done);
    setError("");
    setInput("");
    if (Array.isArray(c.seenSignals)) c.seenSignals.forEach((k) => signalsShownRef.current.add(k));
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      const threadLang = detectMessageLang(lastUserMsg.apiContent ?? lastUserMsg.content);
      if (threadLang) setConvoSw(threadLang === "sw");
    }
    const pasted = findLastJobInHistory(msgs);
    if (pasted) lastJdRef.current = pasted;
    setShowConvos(false);
    setConvoQuery("");
    setBuiltDoc(null);
  };

  const removeConvo = (id: string) => {
    setConvos((prev) => {
      const next = deleteConversation(prev, id);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
      return next;
    });
    // Deleting the ACTIVE thread falls back to a fresh chat (never a stale one).
    if (id === convos.activeId) {
      setMessages([{ role: "assistant", content: openingMessage }]);
      setDocType(null);
      setDone(false);
    }
  };

  const convoTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60_000);
    if (m < 1) return sw ? "sasa hivi" : "just now";
    if (m < 60) return sw ? `${m} dk` : `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return sw ? `${h} saa` : `${h}h`;
    const d = Math.floor(h / 24);
    return sw ? `${d} siku` : `${d}d`;
  };

  // ── Built-document downloads — instant, multi-format, straight from chat ──
  const downloadBuiltPdf = async () => {
    if (!builtDoc || exporting) return;
    setExporting("pdf");
    try {
      const el = builtDoc.kind === "cv" ? cvExportRef.current : letterExportRef.current;
      if (!el) return;
      await exportElementToPdf(el, {
        filename: `${builtDoc.title}.pdf`,
        textLayer: builtDoc.kind === "cv" ? buildCvText(builtDoc.cvData, lang) : undefined,
      });
    } catch {
      setError(sw ? "Imeshindwa kutengeneza PDF. Jaribu tena." : "Couldn't create the PDF. Try again.");
    } finally {
      setExporting(null);
    }
  };

  const downloadBuiltDocx = async () => {
    if (!builtDoc || exporting || builtDoc.kind !== "cv") return;
    setExporting("docx");
    try {
      await downloadCvDocx(builtDoc.cvData, `${builtDoc.title}.docx`);
    } catch {
      setError(sw ? "Imeshindwa kutengeneza faili ya Word. Jaribu tena." : "Couldn't create the Word file. Try again.");
    } finally {
      setExporting(null);
    }
  };

  const downloadBuiltTxt = () => {
    if (!builtDoc || exporting) return;
    setExporting("txt");
    try {
      if (builtDoc.kind === "cv") {
        exportCvToText(builtDoc.cvData, `${builtDoc.title}.txt`, lang);
      } else {
        triggerBlobDownload(
          new Blob([builtDoc.textContent], { type: "text/plain;charset=utf-8" }),
          `${builtDoc.title}.txt`
        );
      }
    } catch {
      setError(sw ? "Imeshindwa kutengeneza faili. Jaribu tena." : "Couldn't create the file. Try again.");
    } finally {
      setExporting(null);
    }
  };

  const openBuiltDoc = () => {
    if (!builtDoc) return;
    router.push(`${builtDoc.editorBase}${builtDoc.id}`);
  };

  // Cockpit action: run an instant, deterministic ATS check on the active CV
  // and drop the result into the thread as a card. No AI call, no latency.
  const runAtsCheck = async () => {
    if (!cv || analyzing || actionBusy) return;
    setMessages((m) => [...m, { role: "user", content: sw ? "Kagua CV yangu" : "Run an ATS check on my CV" }]);
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 650)); // a beat — feels considered
    const checks = analyzeCv(cv, sw);
    const score = atsScore(checks);
    setMessages((m) => [...m, {
      role: "assistant",
      content: sw
        ? `Hii hapa alama ya CV yako${activeCvTitle ? ` "${activeCvTitle}"` : ""}. Gusa kitufe chochote kuiboresha.`
        : `Here's the ATS readiness of your CV${activeCvTitle ? ` "${activeCvTitle}"` : ""}. Open the editor to fix anything flagged.`,
      card: { kind: "ats", score, checks },
    }]);
    setAnalyzing(false);
  };

  // PHASE 2 (C): run a proactive signal — the nudge's resolving tool. Read
  // tools run instantly; write tools go through their preview+confirm flow;
  // confirmations opens the shared card; follow-up links to the tracker.
  const runSignal = useCallback(async (sig: Signal) => {
    if (sig.type === "confirmations") {
      if (guest) return;
      try {
        const res = await fetch("/api/profile/confirmations");
        const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: PendingConfirmation[] };
        if (j.success && j.data?.length && !messages.some((m) => m.card?.kind === "confirmations")) {
          setMessages((m) => [...m, { role: "assistant", content: "", card: { kind: "confirmations", items: j.data as PendingConfirmation[] } }]);
        }
      } catch { /* ignore */ }
      return;
    }
    if (sig.type === "application.followUp") {
      router.push("/dashboard?tab=applications");
      return;
    }
    // Job-scoped signals need the job's real description — fetch the live feed
    // and find it by id (the signal carries only the light shape).
    const needsJd = sig.tool === "cv.tailor" || sig.tool === "coverLetter.generate" || sig.tool === "career.skillGap";
    let jd = "";
    let jTitle = "";
    let jCompany = "";
    if (needsJd && sig.jobId && cv) {
      try {
        const jres = await fetch("/api/jobs/");
        const jjson = (await jres.json().catch(() => ({}))) as { data?: { id: string; title: string; company: string; description?: string }[] };
        const found = (jjson.data ?? []).find((x) => x.id === sig.jobId);
        if (found) { jd = found.description ?? ""; jTitle = found.title; jCompany = found.company; }
      } catch { /* fall through with empty jd */ }
    }
    if (sig.tool === "ats.check") {
      void runAtsCheck();
      return;
    }
    if (sig.tool === "cv.tailor" && jd.replace(/\s/g, "").length >= 20) {
      writeHandlersRef.current.runTailor(jd);
      return;
    }
    if (sig.tool === "coverLetter.generate") {
      writeHandlersRef.current.runCoverLetter({ jobTitle: jTitle, company: jCompany, jobDescription: jd });
      return;
    }
    if (sig.tool === "career.skillGap" && jd.trim()) {
      void writeHandlersRef.current.runSkillGap({ jobTitle: jTitle, jobDescription: jd });
      return;
    }
    // No CV / no JD: surface the honest fallback — open the assistant flow by
    // echoing the trigger as a user turn so Sumaiya can drive it in chat.
    setMessages((m) => [...m, { role: "user", content: sw ? sig.title.sw : sig.title.en }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv, messages, router, sw]);

  // PHASE 2 (D): one-tap continuation — run the server's proposed next step.
  // Read steps run instantly; write steps go through preview→confirm (the
  // client's write handlers); interview.prep links to the interview page.
  const runSuggestedNext = useCallback(async (next: NonNullable<typeof suggestedNext>) => {
    setSuggestedNext(null);
    if (next.href) { router.push(next.href); return; }
    if (next.tool === "cv.tailor") {
      const jd = typeof next.args.jobDescription === "string" ? next.args.jobDescription : (lastJdRef.current || "");
      if (jd.replace(/\s/g, "").length >= 20) writeHandlersRef.current.runTailor(jd);
      return;
    }
    if (next.tool === "cv.improveSummary") {
      writeHandlersRef.current.runImproveSummary();
      return;
    }
    if (next.tool === "coverLetter.generate") {
      writeHandlersRef.current.runCoverLetter(next.args ?? {});
      return;
    }
    if (next.tool === "jobs.track") {
      writeHandlersRef.current.previewTrackJob(next.args ?? {});
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Cockpit: ask for the job, then show an instant (deterministic) match card.
  const startMatch = () => {
    // The thread already knows its target job (pasted earlier — even before a
    // reload, thanks to thread memory) — run the match immediately. Asking
    // again would make the user repeat themselves.
    if (looksLikeJobDescription(lastJdRef.current)) {
      void runMatch(lastJdRef.current);
      return;
    }
    setAwaitingJd(true);
    setMessages((m) => [...m, {
      role: "assistant",
      content: convoSw ? "Sawa — bandika maelezo ya kazi unayolenga, nami nitakuonyesha unavyolingana na nini cha kurekebisha." : "Great — paste the job you're targeting and I'll show your match and what to fix.",
    }]);
  };

  // THE SPINE: one-tap matched jobs inside the assistant — the profile/CV we
  // already have drives the live feed, so "landing → profile → jobs → apply"
  // is one continuous motion without leaving the chat.
  const startJobs = () => {
    if (sendingRef.current || sending || building || uploading) return;
    const dt: DocType = docType ?? "cv";
    const prompt = sw
      ? "Onyesha kazi zinazofanana na wasifu wangu — kadri iwezekanavyo, pamoja na viungo vya kuomba."
      : "Show me jobs that match my profile — as many as you can, with apply links.";
    const userMsg: Msg = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    if (!docType) setDocType(dt);
    void send(history, dt);
  };

  const runMatch = async (jd: string) => {
    if (!cv || analyzing) return;
    lastJdRef.current = jd;
    setMessages((m) => [...m, { role: "user", content: jd.length > 80 ? jd.slice(0, 78) + "…" : jd }]);
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 350)); // a beat — feels considered
    const r = matchCvToJd(cv, jd);
    // WS-1/WS-9 — the ONE authoritative composite score + structured explanation.
    const composite = computeCompositeScore({ data: cv, jd, sw: convoSw });
    const explanation = explainScore(composite, cv, jd, convoSw);
    setMessages((m) => [...m, {
      role: "assistant",
      content: convoSw ? `Unalingana kwa ${composite.score}/100 na kazi hii. Naweza kuiboresha CV yako kuilenga — kwa ukweli, kutoka ulichonacho.` : `You match this job ${composite.score}/100. I can tailor your CV to it — truthfully, from what you already have.`,
      card: { kind: "match", score: composite.score, matched: r.matched, missing: r.missing, jd, composite, explanation },
    }]);
    setAnalyzing(false);
  };

  // Cockpit apply-action: AI rewrites the summary + experience to target the job
  // (truth-constrained), returned as a preview the user approves before saving.
  const runTailor = async (jd: string) => {
    if (!cv || actionBusy) return;
    lastJdRef.current = jd;
    setActionBusy("tailor");
    try {
      const res = await fetch("/api/ai/tailor-cv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jd,
          jobTitle: cv.personal.jobTitle || undefined,
          summary: cv.summary,
          experience: cv.experience.map((e) => ({ id: e.id, position: e.position, company: e.company, description: e.description })),
          lang: convoSw ? "sw" : "en",
          // The evidence engine verifies the rewrite against the real CV —
          // unverified claims (invented metrics/skills/employers) are flagged
          // needs-confirmation instead of silently committed.
          currentCv: cv,
        }),
      });
      const json = await res.json().catch(() => ({})) as {
        success?: boolean;
        data?: { summary: string; experience: { id: string; description: string }[] };
        evidence?: { unconfirmed?: EvidenceClaim[] } | null;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuboresha sasa. Jaribu tena." : "Couldn't tailor it right now. Please try again.") }]);
      } else {
        const data = json.data;
        const unconfirmed = json.evidence?.unconfirmed ?? [];
        setMessages((m) => [...m, {
          role: "assistant",
          content: unconfirmed.length
            ? (sw
                ? `Nimeandaa toleo lililolengwa. Lipitie — kuna mambo ${unconfirmed.length} ambayo hayapo kwenye CV yako; niambie kama ni kweli kabla siyaweke.`
                : `Here's a tailored version. Review it — ${unconfirmed.length} ${unconfirmed.length === 1 ? "item isn't" : "items aren't"} in your CV; confirm them before I apply.`)
            : (sw ? "Nimeandaa toleo lililolengwa. Angalia, kisha ukitaka niliweke kwenye CV yako." : "Here's a tailored version. Review it, then I'll apply it to your CV if you're happy."),
          card: { kind: "tailor", summary: data.summary, experience: data.experience, evidence: unconfirmed },
        }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // User confirmed the AI-added claims are true — unblock Apply for this card.
  const confirmTailorEvidence = (msgIndex: number, _card: Extract<CardData, { kind: "tailor" }>) => {
    setMessages((m) => m.map((msg, i) =>
      (i === msgIndex && msg.card?.kind === "tailor"
        ? { ...msg, card: { ...msg.card, confirmed: true } }
        : msg),
    ));
  };

  // Persist the approved tailor to the CV (PATCH), update the live CV, confirm.
  const applyTailor = async (msgIndex: number, card: Extract<CardData, { kind: "tailor" }>) => {
    if (!cv || !activeCvId || actionBusy) return;
    // Hard gate (fail-closed, same as applySummary): never apply a tailored
    // rewrite whose claims aren't in the user's real CV until the user
    // confirms them. Only an explicit "yes" (confirmed) unblocks Apply.
    if (card.evidence?.length && !card.confirmed) return;
    await snapshotBeforeAiApply("cv.tailor");
    setActionBusy("apply");
    try {
      const expById = new Map(card.experience.map((e) => [e.id, e.description]));
      const nextCv: CVData = {
        ...cv,
        summary: card.summary,
        experience: cv.experience.map((e) => (expById.has(e.id) ? { ...e, description: expById.get(e.id)! } : e)),
      };
      const res = await fetch(`/api/cv/${activeCvId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextCv }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuhifadhi. Jaribu tena." : "Couldn't save that. Please try again.") }]);
      } else {
        setCv(nextCv);
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "tailor" ? { ...msg, card: { ...msg.card, applied: true } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimeiweka kwenye CV yako na kuihifadhi. ✅" : "Applied to your CV and saved. ✅" }]));
        try { confetti({ particleCount: 90, spread: 70, origin: { y: 0.75 } }); } catch { /* non-fatal */ }
        markExecuted({ tool: "cv.tailor", args: { jobDescription: lastJdRef.current || undefined } });
        // Bug 4: propose the next chain step NOW (cover letter) — don't wait
        // for the next turn's server response, which would leave the chip
        // showing the stale "Endelea: coverLetter.generate" from before.
        advanceChain({ tool: "cv.tailor", args: { jobDescription: lastJdRef.current || undefined } });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── cv.improveSummary — AI strengthens the summary (truth-constrained),
  // returned as a preview the user approves before it saves.
  const runImproveSummary = async (directive?: string) => {
    if (!cv || actionBusy) return;
    setActionBusy("summary");
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "summary",
          content: cv.summary || "",
          jobTitle: cv.personal.jobTitle || undefined,
          directive: directive || (convoSw ? "sw" : undefined),
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { enhanced: string }; error?: string };
      const enhanced = json.data?.enhanced;
      if (!res.ok || !json.success || !enhanced) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuboresha muhtasari sasa." : "Couldn't improve the summary right now.") }]);
      } else {
        // Anti-fabrication: scan the AI rewrite against the real CV. Claims the
        // user's own text doesn't support (invented metrics/skills/employers)
        // are flagged needs-confirmation and gate the Apply button — same
        // evidence engine the tailor flow uses.
        const evidence = verifyAiContent(enhanced, [], cv);
        const unconfirmed = evidence.unconfirmed ?? [];
        setMessages((m) => [...m, {
          role: "assistant",
          content: unconfirmed.length
            ? (sw
                ? `Nimeandika muhtasari upya. Kuna mambo ${unconfirmed.length} yasiyopo kwenye CV yako — niambie kama ni kweli kabla siyaweke.`
                : `Here's a stronger summary. ${unconfirmed.length} ${unconfirmed.length === 1 ? "item isn't" : "items aren't"} in your CV — confirm them before I save.`)
            : (sw ? "Nimeandika muhtasari upya. Angalia, kisha niutie kwenye CV yako ukiridhika." : "Here's a stronger summary. Review it, then I'll save it to your CV if you're happy."),
          card: { kind: "summary", summary: enhanced, evidence: unconfirmed },
        }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // User confirmed the AI-added claims in the summary are true — unblock Apply.
  const confirmSummaryEvidence = (msgIndex: number) => {
    setMessages((m) => m.map((msg, i) =>
      (i === msgIndex && msg.card?.kind === "summary"
        ? { ...msg, card: { ...msg.card, confirmed: true } }
        : msg),
    ));
  };

  const applySummary = async (msgIndex: number, card: Extract<CardData, { kind: "summary" }>) => {
    if (!cv || !activeCvId || actionBusy) return;
    await snapshotBeforeAiApply("AI-write");
    // Hard gate: never apply an unconfirmed AI rewrite that introduced claims
    // not in the user's CV. Only a user "yes" (confirmed) unblocks Apply.
    if (card.evidence?.length && !card.confirmed) return;
    setActionBusy("apply");
    try {
      const nextCv: CVData = { ...cv, summary: card.summary };
      const res = await fetch(`/api/cv/${activeCvId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextCv }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuhifadhi. Jaribu tena." : "Couldn't save that. Please try again.") }]);
      } else {
        setCv(nextCv);
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "summary" ? { ...msg, card: { ...msg.card, applied: true } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimeuweka kwenye CV yako. ✅" : "Saved to your CV. ✅" }]));
        markExecuted({ tool: "cv.improveSummary", args: {} });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── cv.addSkills — no AI: the user named the skills; preview then merge. Skips
  // any the CV already lists (case-insensitive).
  const previewSkills = (raw: string[]) => {
    if (!cv) return;
    const have = new Set(cv.skills.map((s) => s.name.trim().toLowerCase()));
    const fresh = raw.map((s) => s.trim()).filter((s) => s && !have.has(s.toLowerCase()));
    const unique = Array.from(new Set(fresh.map((s) => s.toLowerCase()))).map((low) => fresh.find((s) => s.toLowerCase() === low)!);
    if (!unique.length) {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Ujuzi huo tayari uko kwenye CV yako." : "Those skills are already on your CV." }]);
      return;
    }
    setMessages((m) => [...m, {
      role: "assistant",
      content: sw ? "Naweza kuongeza ujuzi huu kwenye CV yako:" : "I can add these skills to your CV:",
      card: { kind: "skills", skills: unique },
    }]);
  };

  const applySkills = async (msgIndex: number, card: Extract<CardData, { kind: "skills" }>) => {
    if (!cv || !activeCvId || actionBusy) return;
    await snapshotBeforeAiApply("cv.addSkills");
    setActionBusy("apply");
    try {
      const added = card.skills.map((name, i) => ({ id: `_s${Date.now()}${i}`, name, level: 3 as const }));
      const nextCv: CVData = { ...cv, skills: [...cv.skills, ...added] };
      const res = await fetch(`/api/cv/${activeCvId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextCv }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuhifadhi. Jaribu tena." : "Couldn't save that. Please try again.") }]);
      } else {
        setCv(nextCv);
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "skills" ? { ...msg, card: { ...msg.card, applied: true } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimeongeza ujuzi kwenye CV yako. ✅" : "Added to your CV. ✅" }]));
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── PDF tools — run server-side on the attached file(s), then hand the user
  // the processed file (download) or the extracted text.
  const runPdfOp = async (toolId: string, args: Record<string, unknown>) => {
    // ── PDF intelligence: extract text from the attached file(s), then run
    // the document-intelligence engine on it. Read-only, renders a card.
    const INTEL: Record<string, { op: "summarize" | "structure" | "compare"; multi?: boolean }> = {
      "pdf.summarize": { op: "summarize" },
      "pdf.structure": { op: "structure" },
      "pdf.compare": { op: "compare", multi: true },
    };
    if (INTEL[toolId] || toolId === "pdf.ocr") {
      const files = attachedFilesRef.current;
      if (!files.length) {
        setMessages((m) => [...m, { role: "assistant", content: sw ? "Ambatanisha faili kwanza." : "Attach a file first." }]);
        return;
      }
      if (INTEL[toolId]?.multi && files.length < 2) {
        setMessages((m) => [...m, { role: "assistant", content: sw ? "Ulinganisho unahitaji faili mbili." : "Comparison needs two files." }]);
        return;
      }
      setActionBusy("pdf");
      try {
        const targets = INTEL[toolId]?.multi ? files : [files[0]];
        const texts: string[] = [];
        for (const f of targets) {
          const fd = new FormData();
          fd.append("file", f);
          const r = await fetch("/api/tools/extract-text", { method: "POST", body: fd });
          const j = (await r.json().catch(() => ({}))) as { success?: boolean; text?: string; error?: string };
          texts.push(j.success && j.text ? j.text : "");
        }
        const combined = targets.length > 1
          ? texts.map((t, i) => `FILE ${i + 1}:\n${t}`).join("\n\n")
          : texts[0];
        if (!combined.trim()) {
          setMessages((m) => [...m, {
            role: "assistant",
            content: toolId === "pdf.ocr"
              ? (sw ? "Faili hili halina safu ya maandishi (inaonekana ni skani). OCR halisi haipatikani bado — andika maelezo muhimu au pakia PDF yenye maandishi." : "This file has no text layer (looks like a scan). True OCR isn't available yet — type the key details or upload a text PDF.")
              : (sw ? "Sikuweza kutoa maandishi kutoka kwenye faili (huenda ni skani). Jaribu faili lenye maandishi." : "Couldn't extract text from the file (it may be a scan). Try a text-based file."),
          }]);
          return;
        }
        if (toolId === "pdf.ocr") {
          const text = combined.length > 4000 ? combined.slice(0, 4000) + "…" : combined;
          setMessages((m) => [...m, { role: "assistant", content: (sw ? "Haya hapa maandishi:\n\n" : "Here's the text:\n\n") + text }]);
          return;
        }
        const res = await fetch("/api/ai/doc-intel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: INTEL[toolId]!.op, docType: "cv", text: combined }),
        });
        const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { text?: string }; error?: string };
        const text = json.data?.text;
        if (json.success && text) {
          setMessages((m) => [...m, { role: "assistant", content: text, card: { kind: "docIntel", op: INTEL[toolId]!.op, text } }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuchambua faili. Jaribu tena." : "Couldn't analyze the file. Please try again.") }]);
        }
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
      } finally {
        setActionBusy(null);
      }
      return;
    }
    const OPS: Record<string, { endpoint: string; multi?: boolean; fields?: string[]; download: string }> = {
      "pdf.merge": { endpoint: "merge", multi: true, download: "merged.pdf" },
      "pdf.split": { endpoint: "split", fields: ["pages"], download: "split.pdf" },
      "pdf.deletePages": { endpoint: "delete-pages", fields: ["pages"], download: "edited.pdf" },
      "pdf.rotate": { endpoint: "rotate", fields: ["angle", "pages"], download: "rotated.pdf" },
      "pdf.watermark": { endpoint: "watermark", fields: ["text"], download: "watermarked.pdf" },
      "pdf.pageNumbers": { endpoint: "page-numbers", download: "numbered.pdf" },
      "pdf.imageToPdf": { endpoint: "image-to-pdf", multi: true, download: "images.pdf" },
      "pdf.extractText": { endpoint: "extract-text", download: "" },
    };
    const op = OPS[toolId];
    const files = attachedFilesRef.current;
    if (!op || actionBusy) return;
    if (!files.length) {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Ambatanisha faili kwanza, kisha niambie nifanye nini." : "Attach a file first, then tell me what to do with it." }]);
      return;
    }
    if (op.multi === true && files.length < 2 && toolId === "pdf.merge") {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Kuunganisha kunahitaji faili mbili au zaidi. Ambatanisha nyingine." : "Merging needs two or more files. Attach another one." }]);
      return;
    }
    setActionBusy("pdf");
    try {
      const fd = new FormData();
      if (op.multi) files.forEach((f) => fd.append("files", f));
      else fd.append("file", files[0]);
      for (const key of op.fields ?? []) {
        const v = args?.[key];
        if (v != null && String(v).trim()) fd.append(key, String(v));
      }
      const res = await fetch(`/api/tools/${op.endpoint}`, { method: "POST", body: fd });

      if (op.endpoint === "extract-text") {
        const json = await res.json().catch(() => ({})) as { success?: boolean; text?: string; error?: string };
        if (!res.ok || !json.success || !json.text) {
          setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Sikuweza kutoa maandishi (huenda ni faili ya picha)." : "Couldn't extract text (it may be a scanned/image PDF).") }]);
        } else {
          const text = json.text.length > 4000 ? json.text.slice(0, 4000) + "…" : json.text;
          setMessages((m) => [...m, { role: "assistant", content: (sw ? "Haya hapa maandishi:\n\n" : "Here's the text:\n\n") + text }]);
        }
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(j.error, sw, sw ? "Imeshindwa kuchakata faili. Jaribu tena." : "Couldn't process the file. Please try again.") }]);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = op.download;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      setMessages((m) => [...m, { role: "assistant", content: sw ? `Nimekamilisha — faili "${op.download}" imepakuliwa. ✅` : `Done — "${op.download}" has downloaded. ✅` }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── coverLetter.generate — AI writes a cover letter from the CV + job, shown
  // as a preview the user can save as a real cover-letter document.
  const runCoverLetter = async (args: Record<string, unknown>) => {
    if (!cv || actionBusy) return;
    const jobTitle = typeof args.jobTitle === "string" ? args.jobTitle : undefined;
    const company = typeof args.company === "string" ? args.company : undefined;
    const jobDescription = (typeof args.jobDescription === "string" && args.jobDescription.trim()) ? args.jobDescription : (lastJdRef.current || undefined);
    setActionBusy("cover");
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cv.personal.fullName || undefined,
          jobTitle: jobTitle || cv.personal.jobTitle || undefined,
          company,
          highlights: cv.summary || undefined,
          jobDescription,
          // The letter must be generated in the user's UI language — the
          // model flips to English by default when no language is given.
          lang: convoSw ? "sw" : "en",
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { content: string }; error?: string };
      const content = json.data?.content;
      if (!res.ok || !json.success || !content) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuandika barua sasa." : "Couldn't write the letter right now.") }]);
      } else {
        setMessages((m) => [...m, {
          role: "assistant",
          content: sw ? "Nimeandika barua ya maombi. Angalia, kisha niihifadhi kama hati ukiridhika." : "Here's a cover letter. Review it, then I'll save it as a document if you're happy.",
          card: { kind: "coverLetter", content, jobTitle, company },
        }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  const saveCoverLetter = async (msgIndex: number, card: Extract<CardData, { kind: "coverLetter" }>) => {
    if (actionBusy) return;
    setActionBusy("apply");
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: card.jobTitle ? `Cover letter — ${card.jobTitle}` : "Cover letter",
          content: card.content,
          jobTitle: card.jobTitle,
          companyName: card.company,
          cvId: activeCvId,
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id: string }; error?: string };
      if (!res.ok || !json.success || !json.data?.id) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuhifadhi barua." : "Couldn't save the letter.") }]);
      } else {
        const id = json.data.id;
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "coverLetter" ? { ...msg, card: { ...msg.card, savedId: id } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimeihifadhi barua yako. ✅" : "Saved your cover letter. ✅" }]));
        markExecuted({ tool: "coverLetter.generate", args: { jobTitle: card.jobTitle, company: card.company, jobDescription: lastJdRef.current || undefined } });
        // Bug 4: after saving the letter, the next chain step is jobs.track.
        // Advance immediately so the chip shows "Endelea: jobs.track" instead
        // of the stale "coverLetter.generate" from the previous turn.
        advanceChain({ tool: "coverLetter.generate", args: { jobTitle: card.jobTitle, company: card.company, jobDescription: lastJdRef.current || undefined } });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── jobs.track — start an application linked to the CV (preview then confirm).
  const previewTrackJob = (args: Record<string, unknown>) => {
    if (!cv) return;
    const jobTitle = typeof args.jobTitle === "string" ? args.jobTitle : undefined;
    const companyName = typeof args.companyName === "string" ? args.companyName : undefined;
    const jobDescription = (typeof args.jobDescription === "string" && args.jobDescription.trim()) ? args.jobDescription : (lastJdRef.current || undefined);
    setMessages((m) => [...m, {
      role: "assistant",
      content: sw ? "Naweza kuanzisha maombi ya kazi hii na kuiunganisha na CV yako:" : "I can start tracking this application, linked to your CV:",
      card: { kind: "trackJob", jobTitle, companyName, jobDescription },
    }]);
  };

  const confirmTrackJob = async (msgIndex: number, card: Extract<CardData, { kind: "trackJob" }>) => {
    if (!activeCvId || actionBusy) return;
    setActionBusy("track");
    try {
      const res = await fetch("/api/applications/from-cv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId: activeCvId,
          jobTitle: card.jobTitle,
          companyName: card.companyName,
          jobDescription: card.jobDescription,
          matchScore: (cv && card.jobDescription) ? matchCvToJd(cv, card.jobDescription).score : undefined,
          // Phase 2 (E): chat-side tracking starts the lifecycle at "applied".
          status: "applied",
          appliedAt: new Date().toISOString(),
        }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: { id?: string }; error?: string };
      if (!res.ok || !json.success) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kuanzisha maombi." : "Couldn't start the application.") }]);
      } else {
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "trackJob" ? { ...msg, card: { ...msg.card, tracked: true } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimeianzisha. Iko kwenye maombi yako. ✅" : "Started — it's in your applications. ✅" }]));
        markExecuted({ tool: "jobs.track", args: { jobTitle: card.jobTitle, companyName: card.companyName }, applicationId: json.data?.id });
        // Bug 4: tracked → propose interview prep with the application id.
        advanceChain({ tool: "jobs.track", args: { jobTitle: card.jobTitle, companyName: card.companyName }, applicationId: json.data?.id });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── Phase 2 (E): application.update — preview a lifecycle status change,
  // confirm writes through the SAME PATCH the dashboard tracker uses.
  const previewTrackUpdate = (args: Record<string, unknown>) => {
    const applicationId = typeof args.applicationId === "string" ? args.applicationId : undefined;
    const nextStatus = typeof args.status === "string" ? args.status : "";
    if (!applicationId || !nextStatus) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: sw
          ? "Niombi ombi gani (jina lake), na hali mpya — k.m. 'Nimeitwa mahojiano ya NMB'."
          : "Tell me which application (its title) and the new status — e.g. 'I got an interview at NMB'.",
      }]);
      return;
    }
    setMessages((m) => [...m, {
      role: "assistant",
      content: sw
        ? `Naweza kubadilisha hali ya ombi hili kuwa "${nextStatus}":`
        : `I can update this application's status to "${nextStatus}":`,
      card: { kind: "trackUpdate", applicationId, title: undefined, currentStatus: undefined, nextStatus },
    }]);
  };

  const confirmTrackUpdate = async (msgIndex: number, card: Extract<CardData, { kind: "trackUpdate" }>) => {
    if (!card.applicationId || actionBusy) return;
    setActionBusy("apply");
    try {
      const res = await fetch(`/api/applications/${card.applicationId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: card.nextStatus }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setMessages((m) => [...m, { role: "assistant", content: errorMsg(json.error, sw, sw ? "Imeshindwa kusasisha ombi." : "Couldn't update the application.") }]);
      } else {
        setMessages((m) => m.map((msg, i) => (i === msgIndex && msg.card?.kind === "trackUpdate" ? { ...msg, card: { ...msg.card, updated: true } } : msg))
          .concat([{ role: "assistant", content: sw ? "Nimesasisha hali ya ombi. ✅" : "Application status updated. ✅" }]));
        markExecuted({ tool: "application.update", args: { applicationId: card.applicationId, status: card.nextStatus } });
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again." }]);
    } finally {
      setActionBusy(null);
    }
  };

  // ── Document intelligence (doc.* tools) ────────────────────────────────────
  // Runs the doc-intel endpoint against the active CV and renders a card.
  // Edit ops (expand/shorten/convert) are applied ONLY on explicit confirm.
  const runDocIntel = async (op: "summarize" | "expand" | "shorten" | "proofread" | "convert" | "compare" | "structure", args: Record<string, unknown> = {}) => {
    if (!cv) return;
    setAnalyzing(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/ai/doc-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          op,
          docType: "cv",
          data: cv,
          section: typeof args.section === "string" ? args.section : undefined,
          target: typeof args.target === "string" ? args.target : undefined,
          otherText: typeof args.otherText === "string" ? args.otherText : undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { text?: string }; error?: string };
      const text = json.data?.text;
      if (json.success && text) {
        // Anti-fabrication: when the op will REPLACE the summary (expand/shorten
        // on the summary section), scan the AI text against the real CV before
        // offering Apply. Invented claims gate the button until confirmed.
        const isSummaryEdit = (op === "expand" || op === "shorten") && (args.section ?? "summary") === "summary";
        const evidence = isSummaryEdit ? verifyAiContent(text, [], cv) : null;
        const unconfirmed = evidence?.unconfirmed ?? [];
        setMessages((m) => [...m, {
          role: "assistant",
          content: unconfirmed.length
            ? (sw
                ? `Nimeandika sehemu hiyo upya. Kuna mambo ${unconfirmed.length} yasiyopo kwenye CV yako — niambie kama ni kweli kabla siyaweke.`
                : `Here's the rewrite. ${unconfirmed.length} ${unconfirmed.length === 1 ? "item isn't" : "items aren't"} in your CV — confirm them before I apply.`)
            : text,
          card: { kind: "docIntel", op, text, section: typeof args.section === "string" ? args.section : undefined, target: typeof args.target === "string" ? args.target : undefined, evidence: unconfirmed.length ? unconfirmed : undefined },
        }]);
      } else {
        setError(errorMsg(json.error, sw, sw ? "Imeshindwa kuchambua hati. Jaribu tena." : "Couldn't analyze the document. Please try again."));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(sw ? "Ombi limeisha muda. Jaribu tena." : "Request timed out. Please try again.");
      } else {
        setError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setAnalyzing(false);
    }
  };

  // User confirmed the AI-added claims in a doc-intel rewrite — unblock Apply.
  const confirmDocIntelEvidence = (msgIndex: number) => {
    setMessages((m) => m.map((msg, i) =>
      (i === msgIndex && msg.card?.kind === "docIntel"
        ? { ...msg, card: { ...msg.card, confirmed: true } }
        : msg),
    ));
  };

  const applyDocIntel = async (msgIndex: number, card: Extract<CardData, { kind: "docIntel" }>) => {
    if (!cv || !activeCvId || card.applied) return;
    await snapshotBeforeAiApply("AI-write");
    // convert → create the target document type with the produced text.
    if (card.op === "convert") {
      const target = (card.target ?? "").toLowerCase();
      if (target.includes("cover")) {
        const res = await fetch("/api/cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sw ? "Barua ya maombi (kutoka CV)" : "Cover letter (from CV)",
            cvId: activeCvId,
            content: card.text,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { id?: string; title?: string }; error?: string };
        if (json.success && json.data?.id) {
          setMessages((m) => m.map((msg, i) => (i === msgIndex ? { ...msg, card: { ...msg.card, applied: true, savedId: json.data?.id } as CardData } : msg)));
        } else {
          setError(errorMsg(json.error, sw, sw ? "Imeshindwa kuunda hati. Jaribu tena." : "Couldn't create the document. Please try again."));
        }
      }
      return;
    }
    // expand/shorten → replace the target section (only summary is safely
    // replaceable here; other sections are copy-to-editor).
    if ((card.op === "expand" || card.op === "shorten") && card.section === "summary") {
      // Hard gate: unconfirmed AI-invented claims block Apply (same evidence
      // engine as tailor). Only a user yes unblocks it.
      if (card.evidence?.length && !card.confirmed) return;
      const next = { ...cv, summary: card.text };
      const res = await fetch(`/api/cv/${activeCvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: next }),
      });
      if (res.ok) {
        setCv(next);
        setMessages((m) => m.map((msg, i) => (i === msgIndex ? { ...msg, card: { ...msg.card, applied: true } as CardData } : msg)));
      } else {
        setError(sw ? "Imeshindwa kusasisha CV. Jaribu tena." : "Couldn't update the CV. Please try again.");
      }    }
  };

  // ── Templates + SmartFit (template.smartFit) ───────────────────────────────
  // Reasons about density/style with the deterministic engine, previews the
  // proposed engine settings, applies on confirm via PATCH /api/cv/:id.
  const runSmartFit = (directive: string) => {
    if (!cv) return;
    const change = applyDirective(directive, { data: cv, density: (cv as CVData & { density?: "compact" | "normal" | "airy" }).density });
    if (!change) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: sw
          ? "Niweze kubadilisha mtindo, niambie unataka nini — mf. \"make it executive\", \"modern\", \"minimal\", \"classic\", \"creative\", au \"it doesn't fit on one page\"."
          : "To restyle or fit the CV, tell me the direction — e.g. \"make it executive\", \"modern\", \"minimal\", \"classic\", \"creative\", or \"it doesn't fit on one page\".",
      }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: sw ? change.rationale.sw : change.rationale.en, card: { kind: "smartFit", directive, templateId: change.templateId, density: change.density, sectionOrder: change.sectionOrder, rationale: change.rationale } }]);
  };

  const applySmartFit = async (msgIndex: number, card: Extract<CardData, { kind: "smartFit" }>) => {
    if (!cv || !activeCvId || card.applied) return;
    await snapshotBeforeAiApply("template.smartFit");
    const nextData = { ...cv, ...(card.density ? { density: card.density } : {}), ...(card.sectionOrder ? { sectionOrder: card.sectionOrder } : {}) };
    const res = await fetch(`/api/cv/${activeCvId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: nextData, ...(card.templateId ? { templateId: card.templateId } : {}) }),
    });
    if (res.ok) {
      setCv(nextData as CVData);
      setMessages((m) => m.map((msg, i) => (i === msgIndex ? { ...msg, card: { ...msg.card, applied: true } as CardData } : msg)));
    } else {
      setError(sw ? "Imeshindwa kusasisha muundo. Jaribu tena." : "Couldn't update the design. Please try again.");    }
  };

  // ── Skill-gap check (career.skillGap) ──────────────────────────────────────
  // Deterministic strengths/gaps/score from the real match engine (facts),
  // then the AI writes a learning plan from the gaps only (recommendation).
  const runSkillGap = async (args: { jobTitle?: string; jobDescription: string }) => {
    if (!cv) return;
    setAnalyzing(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/ai/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ data: cv, jobTitle: args.jobTitle, jobDescription: args.jobDescription, lang: convoSw ? "sw" : "en" }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean; error?: string;
        data?: { facts?: { strengths?: string[]; gaps?: string[]; score?: number; resources?: { title: string; provider: string; url: string; free: boolean }[] }; learningPlan?: { plan?: { step: string; gap: string }[]; summary?: string } | null };
      };
      const facts = json.data?.facts;
      if (json.success && facts) {
        const plan = json.data?.learningPlan;
        setMessages((m) => [...m, {
          role: "assistant",
          content: sw
            ? (facts.gaps?.length
                ? `Uko na uwezo wa ${facts.strengths?.length ?? 0} kati ya vitu vinavyotakiwa (alama ${facts.score ?? 0}%). Unakosa: ${facts.gaps.slice(0, 6).join(", ")}${facts.gaps.length > 6 ? "…" : ""}. Hapa kuna mpango wa kujifunza.`
                : `Habari njema — CV yako inagusa kila kitu muhimu cha kazi hii (alama ${facts.score ?? 0}%).`)
            : (facts.gaps?.length
                ? `You cover ${facts.strengths?.length ?? 0} of the job's keywords (score ${facts.score ?? 0}%). Missing: ${facts.gaps.slice(0, 6).join(", ")}${facts.gaps.length > 6 ? "…" : ""}. Here's a learning plan to close them.`
                : `Good news — your CV already covers every keyword this job asks for (score ${facts.score ?? 0}%).`),
          card: {
            kind: "skillGap",
            jobTitle: args.jobTitle,
            strengths: facts.strengths ?? [],
            gaps: facts.gaps ?? [],
            score: facts.score ?? 0,
            learningPlan: plan?.plan?.length ? plan.plan : null,
            summary: plan?.summary,
            resources: facts.resources ?? [],
          },
        }]);
      } else {
        setError(errorMsg(json.error, sw, sw ? "Imeshindwa kuchambua mapungufu. Jaribu tena." : "Couldn't analyze skill gaps. Please try again."));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(sw ? "Ombi limeisha muda. Jaribu tena." : "Request timed out. Please try again.");
      } else {
        setError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setAnalyzing(false);
    }
  };

  // ── CV comparison (cv.compare) ─────────────────────────────────────────────
  // Both CVs scored deterministically by the match engine (facts), then the AI
  // explains the verdict. Reads only — no document is modified.
  const runCvCompare = async (args: { otherCvText: string; jobDescription?: string }) => {
    if (!cv) return;
    setAnalyzing(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/ai/cv-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ cvA: cv, cvBText: args.otherCvText, jobDescription: args.jobDescription, lang: convoSw ? "sw" : "en" }),
      });
      // The other CV arrives as text; the server parses it into CVData. If that
      // fails we still get a structural comparison from the text.
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean; error?: string;
        data?: { verdict?: string; facts?: { scored?: boolean; onlyA?: string[]; onlyB?: string[]; shared?: string[]; a?: { score?: number }; b?: { score?: number }; winner?: "a" | "b" | "tie" } };
      };
      if (json.success && json.data?.verdict) {
        const f = json.data.facts;
        setMessages((m) => [...m, {
          role: "assistant",
          content: sw ? "Linganisho la CV zako:" : "Here's how your CVs compare:",
          card: {
            kind: "cvCompare",
            verdict: json.data!.verdict ?? "",
            onlyA: f?.onlyA ?? [],
            onlyB: f?.onlyB ?? [],
            shared: f?.shared ?? [],
            scored: f?.scored ?? false,
            aScore: f?.a?.score,
            bScore: f?.b?.score,
            winner: f?.winner,
          },
        }]);
      } else {
        setError(errorMsg(json.error, sw, sw ? "Imeshindwa kulinganisha CV. Jaribu tena." : "Couldn't compare the CVs. Please try again."));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(sw ? "Ombi limeisha muda. Jaribu tena." : "Request timed out. Please try again.");
      } else {
        setError(sw ? "Hitilafu ya mtandao. Jaribu tena." : "Network error. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      setAnalyzing(false);
    }
  };

  // Latest write-tool handlers, read by the memoized `send` when it dispatches an
  // action — a ref so send never captures a stale closure.
  const writeHandlersRef = useRef({ runTailor, runImproveSummary, previewSkills, runPdfOp, runCoverLetter, previewTrackJob, runDocIntel, applyDocIntel, runSmartFit, applySmartFit, runSkillGap, runCvCompare });
  writeHandlersRef.current = { runTailor, runImproveSummary, previewSkills, runPdfOp, runCoverLetter, previewTrackJob, runDocIntel, applyDocIntel, runSmartFit, applySmartFit, runSkillGap, runCvCompare };

  const buildLabel = sw ? DOC_LABEL[docType ?? "cv"].sw : DOC_LABEL[docType ?? "cv"].en;
  const canBuildEarly = !!docType && userTurns >= 3 && !done;
  const showCockpit = !!cv && !sending && !uploading && !building && !awaitingJd && !analyzing && actionBusy === null;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-sand-2">
      {/* Hidden render targets for instant in-chat downloads — rendered (not
          display:none) because html2canvas can't capture hidden elements. */}
      <div aria-hidden="true" className="pointer-events-none" style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }}>
        {builtDoc?.kind === "cv" && (
          <div ref={cvExportRef} style={{ width: 794, background: "#fff" }}>
            <TemplateCanvas>
              <NakuruTemplate data={builtDoc.cvData} primaryColor="#DA4A1C" fontFamily={INTER_STACK} lang={sw ? "sw" : "en"} />
            </TemplateCanvas>
          </div>
        )}
        {builtDoc && builtDoc.kind !== "cv" && (
          <div ref={letterExportRef} style={{ width: 794, background: "#fff", padding: 56, boxSizing: "border-box" }}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#1a1a1a" }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{builtDoc.textContent}</p>
            </div>
          </div>
        )}
      </div>
      {/* Header */}
      <div className="bg-espresso border-b border-espresso-line px-4 h-14 flex items-center gap-3 flex-shrink-0">
        <Link href={guest ? "/" : "/dashboard"} className="flex items-center gap-1 text-cream/60 hover:text-cream transition text-sm shrink-0" aria-label={sw ? "Rudi" : "Back"}>
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">{sw ? "Rudi" : "Back"}</span>
        </Link>
        <div className="h-5 w-px bg-espresso-line hidden sm:block" />
        <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center shrink-0">
          <SumaiyaMark size={17} state={sending || building ? "thinking" : "idle"} className="text-cream" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream leading-tight">Sumaiya</p>
          <p className="text-[11px] text-cream/50 leading-tight">{cockpit ? (sw ? `Ninafanyia kazi CV yako${activeCvTitle ? ` — ${activeCvTitle}` : ""}` : `Working on your CV${activeCvTitle ? ` — ${activeCvTitle}` : ""}`) : (sw ? "Tuongee — nitakutengenezea hati yako" : "Let's chat — I'll create your document")}</p>
        </div>
        {/* Conversations: open the saved-chat list; Restart = a NEW chat. */}
        <button onClick={() => setShowConvos((v) => { if (v) setConvoQuery(""); return !v; })} disabled={cockpit}
          className={`flex items-center gap-1 text-[11px] transition disabled:opacity-40 shrink-0 ${showConvos ? "text-ember" : "text-cream/50 hover:text-cream"}`}
          aria-label={sw ? "Mazungumzo yako" : "Your conversations"}>
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{sw ? "Mazungumzo" : "Chats"}</span>
        </button>
        {messages.length > 1 && (
          <button onClick={restart} disabled={building}
            className="flex items-center gap-1 text-[11px] text-cream/50 hover:text-cream transition disabled:opacity-40 shrink-0"
            aria-label={sw ? "Mazungumzo mapya" : "New conversation"}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sw ? "Mpya" : "New"}</span>
          </button>
        )}
      </div>

      {/* Conversation list — search, open a saved chat, start fresh, or delete. */}
      {showConvos && (
        <div className="border-b border-border bg-card flex flex-col max-h-96 flex-shrink-0 shadow-card z-10">
          {/* The list scrolls; the "go to" nav below stays put, so the pinned
              feature links are reachable no matter how long the chat list gets. */}
          <div className="overflow-y-auto flex-1 min-h-0">
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {sw ? "Mazungumzo yako" : "Your conversations"}
            </span>
            <button onClick={() => { restart(); }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ember hover:text-ember-hover transition"
              aria-label={sw ? "Anza mazungumzo mapya" : "Start a new conversation"}>
              <Plus size={13} />
              {sw ? "Mpya" : "New"}
            </button>
          </div>
          {convos.conversations.length > 0 && (
            <div className="px-4 pt-2 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="search" value={convoQuery} onChange={(e) => setConvoQuery(e.target.value)}
                  placeholder={sw ? "Tafuta mazungumzo…" : "Search conversations…"}
                  aria-label={sw ? "Tafuta mazungumzo" : "Search conversations"}
                  className="w-full bg-sand rounded-lg pl-8 pr-3 py-2 text-[13px] text-espresso placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-ember" />
              </div>
            </div>
          )}
          {(() => {
            const filtered = searchConversations(convos.conversations, convoQuery);
            if (convos.conversations.length === 0) {
              return (
                <p className="px-4 pb-3 text-xs text-text-muted">
                  {sw ? "Hakuna mazungumzo bado — anza mpya hapo juu." : "No conversations yet — start a new one above."}
                </p>
              );
            }
            if (filtered.length === 0) {
              return (
                <p className="px-4 pb-3 text-xs text-text-muted">
                  {sw ? "Hakuna mazungumzo yanayolingana." : "No conversations match your search."}
                </p>
              );
            }
            return (
              <ul>
                {filtered.map((c) => {
                  const lastMsg = [...c.messages].reverse().find((m) => m && typeof (m as Msg).content === "string" && (m as Msg).content);
                  const isActive = c.id === convos.activeId;
                  return (
                    <li key={c.id} className="flex items-center gap-1 px-2">
                      <button onClick={() => openConvo(c.id)}
                        className={`flex-1 min-w-0 text-left px-2 py-2 rounded-lg transition ${isActive ? "bg-sand" : "hover:bg-sand/60"}`}>
                        <span className="block text-[13px] font-semibold text-espresso truncate">{c.title}</span>
                        <span className="block text-[11px] text-text-muted truncate">
                          {(lastMsg as Msg | undefined)?.content ?? (sw ? "Hakuna maudhui" : "No content")}
                        </span>
                        <span className="block text-[10px] text-text-muted/70 mt-0.5">{convoTimeAgo(c.updatedAt)}</span>
                      </button>
                      <button onClick={() => removeConvo(c.id)}
                        className="shrink-0 p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition"
                        aria-label={sw ? "Futa mazungumzo" : "Delete conversation"}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
          <p className="px-4 pb-2.5 text-[10px] text-text-muted">
            {sw
              ? "Mazungumzo yasiyotumiwa kwa siku 30 yanafutwa kiotomatiki. Huhifadhiwi kwenye seva."
              : "Conversations idle for 30 days are auto-deleted. Stored on this device only."}
          </p>
          </div>
          {!guest && (
            <div className="border-t border-border px-2 pt-2 pb-2">
              <span className="block px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {sw ? "Nenda kwenye" : "Go to"}
              </span>
              <ul>
                <li>
                  <Link href="/templates" onClick={() => setShowConvos(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-espresso hover:bg-sand transition">
                    <LayoutTemplate className="w-3.5 h-3.5 text-ember" />
                    {sw ? "Miundo" : "Templates"}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" onClick={() => setShowConvos(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-espresso hover:bg-sand transition">
                    <FileText className="w-3.5 h-3.5 text-ember" />
                    {sw ? "CV zako" : "My CVs"}
                  </Link>
                </li>
                <li>
                  <Link href="/ats-checker" onClick={() => setShowConvos(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-espresso hover:bg-sand transition">
                    <Bolt className="w-3.5 h-3.5 text-ember" />
                    {sw ? "Kagua CV" : "ATS check"}
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" onClick={() => setShowConvos(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-espresso hover:bg-sand transition">
                    <Briefcase className="w-3.5 h-3.5 text-ember" />
                    {sw ? "Ajira" : "Jobs"}
                  </Link>
                </li>
                <li>
                  <Link href="/settings" onClick={() => setShowConvos(false)}
                    className="flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] text-espresso hover:bg-sand transition">
                    <Settings className="w-3.5 h-3.5 text-ember" />
                    {sw ? "Mipangilio" : "Settings"}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Phase 2 (B): pending confirmations from the unified context — a quiet
          chip under the header (the full card surfaces on the first turn). */}
      {!guest && showConfirmChip && pendingCount > 0 && (
        <button
          onClick={() => {
            setShowConfirmChip(false);
            void (async () => {
              try {
                const res = await fetch("/api/profile/confirmations");
                const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: PendingConfirmation[] };
                if (j.success && j.data?.length && !messages.some((m) => m.card?.kind === "confirmations")) {
                  setMessages((m) => [...m, { role: "assistant", content: "", card: { kind: "confirmations", items: j.data as PendingConfirmation[] } }]);
                }
              } catch { /* ignore */ }
            })();
          }}
          className="mx-4 mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition self-start"
          aria-label={sw ? "Thibitisha taarifa" : "Confirm facts"}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {sw
            ? `Taarifa ${pendingCount} zinasubiri uthibitisho — thibitisha`
            : `${pendingCount} ${pendingCount === 1 ? "fact" : "facts"} await your confirmation`}
        </button>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
        {/* Before the first user turn the thread is just the greeting + chooser
            — centre it so a tall desktop viewport doesn't show a dead band.
            Once the conversation starts, anchor to the bottom (newest by the
            composer). */}
        <div
          className={`min-h-full max-w-2xl mx-auto flex flex-col space-y-3 ${userTurns === 0 ? "justify-center" : "justify-end"}`}
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <div key={i} className="space-y-2 msg-enter">
              {m.content && (
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-ember text-cream rounded-br-md" : "bg-card border border-border text-espresso rounded-bl-md"
                  }`}>
                    {m.content}
                  </div>
                </div>
              )}
              {m.role === "assistant" && m.content && tts.supported && (
                <div className="flex justify-start pl-1">
                  <button
                    onClick={() => speakMessage(m.content)}
                    aria-label={tts.speaking ? (sw ? "Simamisha usomaji" : "Stop reading") : (sw ? "Sikiliza kwa sauti" : "Listen")}
                    title={tts.speaking ? (sw ? "Simamisha" : "Stop") : (sw ? "Sikiliza" : "Listen")}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted/70 hover:text-ember-hover transition"
                  >
                    {tts.speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {tts.speaking && <span>{sw ? "Simamisha" : "Stop"}</span>}
                  </button>
                </div>
              )}
              {m.card?.kind === "jobs" && (
                <JobsResultCard jobs={m.card.jobs} sw={sw} />
              )}
              {m.card?.kind === "ats" && (
                <AtsResultCard score={m.card.score} checks={m.card.checks} sw={sw}
                  onFix={activeCvId ? () => router.push(`/editor/cv/${activeCvId}`) : undefined} />
              )}
              {m.card?.kind === "match" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <MatchResultCard score={m.card.score} matched={m.card.matched} missing={m.card.missing} sw={sw}
                  composite={(m.card as Extract<CardData, { kind: "match" }>).composite}
                  explanation={(m.card as Extract<CardData, { kind: "match" }>).explanation}
                  onTailor={() => runTailor((m.card as Extract<CardData, { kind: "match" }>).jd)}
                  onDismiss={() => dismissCard(i)}
                  tailorBusy={actionBusy === "tailor"} />
                </motion.div>
              )}
              {m.card?.kind === "tailor" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <TailorPreviewCard summary={m.card.summary} count={Array.isArray(m.card.experience) ? m.card.experience.length : 0} applied={!!m.card.applied} sw={sw}
                  evidence={m.card.evidence} confirmed={m.card.confirmed}
                  canApply={!!activeCvId}
                  diff={cv ? diffForTailor(cv, m.card as Extract<CardData, { kind: "tailor" }>) : undefined}
                  onConfirm={() => confirmTailorEvidence(i, m.card as Extract<CardData, { kind: "tailor" }>)}
                  onApply={() => applyTailor(i, m.card as Extract<CardData, { kind: "tailor" }>)}
                  onDismiss={() => dismissCard(i)}
                  applyBusy={actionBusy === "apply"}
                  editHref={activeCvId ? `/editor/cv/${activeCvId}` : undefined} />
                </motion.div>
              )}
              {m.card?.kind === "summary" && (
                <SummaryPreviewCard summary={m.card.summary} applied={!!m.card.applied} sw={sw}
                  evidence={m.card.evidence} confirmed={!!m.card.confirmed}
                  canApply={!!activeCvId}
                  onConfirm={m.card.evidence?.length && !m.card.confirmed ? () => confirmSummaryEvidence(i) : undefined}
                  onApply={() => applySummary(i, m.card as Extract<CardData, { kind: "summary" }>)}
                  applyBusy={actionBusy === "apply"}
                  editHref={activeCvId ? `/editor/cv/${activeCvId}` : undefined} />
              )}
              {m.card?.kind === "skills" && (
                <SkillsPreviewCard skills={m.card.skills} applied={!!m.card.applied} sw={sw}
                  canApply={!!activeCvId}
                  onApply={() => applySkills(i, m.card as Extract<CardData, { kind: "skills" }>)}
                  applyBusy={actionBusy === "apply"}
                  editHref={activeCvId ? `/editor/cv/${activeCvId}` : undefined} />
              )}
              {m.card?.kind === "coverLetter" && (
                <CoverLetterPreviewCard content={m.card.content} savedId={m.card.savedId} sw={sw}
                  onSave={() => saveCoverLetter(i, m.card as Extract<CardData, { kind: "coverLetter" }>)}
                  saveBusy={actionBusy === "apply"} />
              )}
              {m.card?.kind === "trackJob" && (
                <TrackJobCard jobTitle={m.card.jobTitle} companyName={m.card.companyName} tracked={!!m.card.tracked} sw={sw}
                  onConfirm={() => confirmTrackJob(i, m.card as Extract<CardData, { kind: "trackJob" }>)}
                  confirmBusy={actionBusy === "track"} />
              )}
              {m.card?.kind === "docIntel" && (
                <DocIntelCard op={m.card.op} text={m.card.text} section={m.card.section} target={m.card.target}
                  applied={!!m.card.applied} savedId={m.card.savedId} sw={sw}
                  evidence={m.card.evidence} confirmed={!!m.card.confirmed}
                  onConfirm={m.card.evidence?.length && !m.card.confirmed ? () => confirmDocIntelEvidence(i) : undefined}
                  onApply={m.card.applied ? undefined : () => applyDocIntel(i, m.card as Extract<CardData, { kind: "docIntel" }>)}
                  applyBusy={actionBusy === "apply"} />
              )}
              {m.card?.kind === "smartFit" && (
                <SmartFitCard templateId={m.card.templateId} density={m.card.density} sectionOrder={m.card.sectionOrder}
                  rationale={m.card.rationale} applied={!!m.card.applied} sw={sw}
                  onApply={m.card.applied ? undefined : () => applySmartFit(i, m.card as Extract<CardData, { kind: "smartFit" }>)}
                  applyBusy={actionBusy === "apply"} />
              )}
              {m.card?.kind === "skillGap" && (
                <SkillGapCard jobTitle={m.card.jobTitle} strengths={m.card.strengths} gaps={m.card.gaps}
                  score={m.card.score} learningPlan={m.card.learningPlan} summary={m.card.summary}
                  resources={m.card.resources ?? []} sw={sw} />
              )}
              {m.card?.kind === "cvCompare" && (
                <CvCompareCard verdict={m.card.verdict} onlyA={m.card.onlyA} onlyB={m.card.onlyB}
                  shared={m.card.shared} scored={m.card.scored} aScore={m.card.aScore} bScore={m.card.bScore}
                  winner={m.card.winner} sw={sw} />
              )}
              {m.card?.kind === "confirmations" && (
                <ConfirmationsCard
                  items={m.card.items}
                  sw={sw}
                  resolved={!!m.card.resolved}
                  onResolved={(keys) => {
                    // Trust-loop fix: after facts are confirmed/removed here,
                    // (1) shrink the live count so the header chip and the
                    // server's next signal computation never show stale
                    // "awaiting confirmation" facts again, (2) drop the
                    // confirmations nudge from ANY signals card in this thread
                    // (the stale chip would otherwise survive the reload via
                    // localStorage and keep saying "2 facts await" after
                    // they're already resolved), (3) retire this card when
                    // everything on it is done.
                    setPendingCount((n) => Math.max(0, n - keys.length));
                    setMessages((msgs) => msgs.map((mm) => {
                      if (mm.card?.kind === "signals" && mm.card.items.some((s) => s.type === "confirmations")) {
                        const items = mm.card.items.filter((s) => s.type !== "confirmations");
                        return items.length ? { ...mm, card: { ...mm.card, items } } : { ...mm, card: undefined };
                      }
                      return mm;
                    }));
                    if (keys.length >= ((m.card as Extract<CardData, { kind: "confirmations" }> | undefined)?.items?.length ?? 0)) {
                      setMessages((msgs) => msgs.map((mm, j) => (j === i && mm.card?.kind === "confirmations" ? { ...mm, card: { ...mm.card, resolved: true } } : mm)));
                    }
                  }}
                />
              )}
              {m.card?.kind === "signals" && (
                <SignalsCard signals={m.card.items} sw={sw} onRun={(sig) => void runSignal(sig)} />
              )}
              {m.card?.kind === "trackUpdate" && (
                <TrackUpdateCard
                  title={m.card.title}
                  currentStatus={m.card.currentStatus}
                  nextStatus={m.card.nextStatus}
                  sw={sw}
                  onConfirm={async () => { await confirmTrackUpdate(i, m.card as Extract<CardData, { kind: "trackUpdate" }>); }}
                />
              )}
            </div>
          ))}

          {/* A guest's freshly-built CV — see it, recolour it, download it,
              right here. "Open the editor" carries the chosen look across. */}
          {guestCvReady && (
            <CvReadyCard
              cv={guestCvReady}
              sw={sw}
              onOpenEditor={(look, color) => {
                stashGuestCv(guestCvReady, look, color, sw);
                router.push("/editor/cv/try");
              }}
            />
          )}

          {/* Cockpit chips — shown when an active CV is loaded (/assistant?cv=<id>).
              These run instant, deterministic checks as inline cards. */}
          {showCockpit && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={startMatch}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm">
                <Target className="w-4 h-4 text-ember" />
                {sw ? "Linganisha na kazi" : "Match to a job"}
              </button>
              <button onClick={runAtsCheck}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm">
                <Bolt className="w-4 h-4 text-ember" />
                {sw ? "Kagua CV yako" : "Run an ATS check"}
              </button>
              <button onClick={startJobs}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm">
                <Briefcase className="w-4 h-4 text-ember" />
                {sw ? "Kazi zinazofanana na mimi" : "Jobs matching me"}
              </button>
            </div>
          )}

          {/* Fresh thread → "what do you want today?" as four big cards
              (one decision, big targets), then a slim row of extras. Retires
              once the user picks or chooses to type. */}
          {showChips && !chooserDismissed && (
            <StartChooser sw={sw} onPick={handleStartChoice} />
          )}
          {showChips && (
            <div className="flex gap-2 pt-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              <button onClick={() => router.push("/interview")}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm shrink-0">
                <Bolt className="w-4 h-4 text-ember" />
                {sw ? "Jiandae na usaili" : "Interview prep"}
              </button>
              <button onClick={startJobs}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm shrink-0">
                <Briefcase className="w-4 h-4 text-ember" />
                {sw ? "Ona nafasi zinazofanana" : "Matching jobs"}
              </button>
              <button onClick={() => pickDoc("business-card")}
                className="inline-flex items-center gap-2 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-sm font-medium rounded-full pl-3 pr-4 py-2 transition shadow-sm shrink-0">
                <CreditCard className="w-4 h-4 text-ember" />
                {sw ? "Kadi ya biashara" : "Business card"}
              </button>
            </div>
          )}

          {uploading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-text-body flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-ember" />
                {uploading}
              </div>
            </div>
          )}

          {(sending || analyzing) && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5" aria-label={sw ? "Anaandika" : "Typing"}>
                {analyzing && <span className="text-[11px] text-text-muted mr-1">{sw ? "Inachambua" : "Analyzing"}</span>}
                <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce" />
              </div>
            </div>
          )}

          {sending && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-text-body flex items-center gap-2">
                <span className="flex gap-1" aria-hidden>
                  <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ember animate-bounce" style={{ animationDelay: "240ms" }} />
                </span>
                {sw ? "Kuchambua ombi lako…" : "Analyzing your request…"}
              </div>
            </div>
          )}
          {building && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-text-body flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-ember" />
                {sw ? `Naandika ${buildLabel} yako…` : `Writing your ${buildLabel}…`}
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 max-w-[85%]">
                <p className="text-sm text-red-700">{error}</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={done ? build : retry} disabled={sending || building}
                    className="text-xs font-semibold text-ember-hover hover:underline disabled:opacity-50">
                    {sw ? "Jaribu tena" : "Try again"}
                  </button>
                  <Link href={guest ? "/" : "/dashboard"} className="text-xs font-semibold text-text-muted hover:text-espresso">
                    {guest ? (sw ? "Nenda mwanzo" : "Go home") : (sw ? "Nenda nyumbani" : "Go to dashboard")}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for the "upload old CV" shortcut */}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt,.md,.csv"
        className="hidden"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) {
            // Keep the raw file(s) so the AI can run PDF tools on them, and
            // extract text from the first for CV/JD context.
            attachedFilesRef.current = files;
            setAttachedCount(files.length);
            void onAttachFile(files[0]);
          }
          e.target.value = "";
        }}
      />

      {/* Composer / build CTA — WS-12: floating rounded card, not a full-bleed
          bar. On mobile this reads as a proper chat composer and the message
          list scrolls behind it. */}
      <div className="px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 flex-shrink-0">
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-card px-3 pt-3 pb-3">
          {/* Built-document downloads — instant PDF / Word / TXT right in chat */}
          {builtDoc && (
            <div className="mb-2 rounded-input-lg border border-pine/30 bg-pine-tint/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />
                  <span className="text-[13px] font-bold text-espresso truncate">{builtDoc.title}</span>
                </span>
                <button onClick={() => setBuiltDoc(null)}
                  className="shrink-0 p-1 rounded-md text-text-muted hover:text-espresso transition"
                  aria-label={sw ? "Funga" : "Dismiss"}>
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-text-muted mb-2">
                {sw ? "Pakua sasa — muundo wowote:" : "Download now — any format:"}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => void downloadBuiltPdf()} disabled={!!exporting}
                  className="flex items-center justify-center gap-1 rounded-lg bg-espresso text-cream text-[11px] font-semibold px-2 py-2 hover:bg-black/80 transition disabled:opacity-50">
                  {exporting === "pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  PDF
                </button>
                {builtDoc.kind === "cv" && (
                  <button onClick={() => void downloadBuiltDocx()} disabled={!!exporting}
                    className="flex items-center justify-center gap-1 rounded-lg bg-espresso text-cream text-[11px] font-semibold px-2 py-2 hover:bg-black/80 transition disabled:opacity-50">
                    {exporting === "docx" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    Word
                  </button>
                )}
                <button onClick={downloadBuiltTxt} disabled={!!exporting}
                  className="flex items-center justify-center gap-1 rounded-lg bg-espresso text-cream text-[11px] font-semibold px-2 py-2 hover:bg-black/80 transition disabled:opacity-50">
                  {exporting === "txt" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  TXT
                </button>
              </div>
              <button onClick={openBuiltDoc}
                className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-pine hover:underline transition">
                {sw ? "Fungua kwenye mhariri →" : "Open in editor →"}
              </button>
            </div>
          )}
          {/* Phase 2 (D): one-tap continuation — the server's proposed next
              step. Tapping runs it (read instantly, write preview→confirm). */}
          {suggestedNext && (
            <button
              onClick={() => void runSuggestedNext(suggestedNext)}
              className="w-full mb-2 flex items-center justify-between gap-2 rounded-input-lg border border-ember/30 bg-ember-tint/40 hover:bg-ember-tint/70 transition px-3 py-2.5 text-left group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-ember shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-espresso truncate">
                    {sw ? "Endelea: " : "Next: "}{suggestedNext.tool.replace(".", " ")}
                  </span>
                  <span className="block text-[11px] text-text-body truncate">
                    {sw ? suggestedNext.reason.sw : suggestedNext.reason.en}
                  </span>
                </span>
              </span>
              <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-ember-hover group-hover:translate-x-0.5 transition-transform">
                {sw ? "Endelea" : "Continue"}
              </span>
            </button>
          )}
          {done && !guestCvReady ? (
            <div className="flex flex-col gap-2">
              <button onClick={build} disabled={building || sending}
                className="w-full flex items-center justify-center gap-2 bg-ember text-cream text-sm font-semibold py-3 rounded-input-lg shadow-ember-hard active:shadow-ember-active active:translate-y-[2px] hover:bg-ember-hover disabled:opacity-60 transition">
                {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {sw ? `Tengeneza ${buildLabel} yangu` : `Create my ${buildLabel}`}
              </button>
              <button onClick={() => setDone(false)} disabled={building}
                className="text-xs font-medium text-text-muted hover:text-espresso transition disabled:opacity-50">
                {sw ? "Ngoja — nina la kuongeza" : "Wait — I want to add something"}
              </button>
            </div>
          ) : (
            <>
              {attachedCount > 0 && (
                <div className="mb-2 inline-flex items-center gap-2 text-xs bg-ember-tint/40 border border-ember/20 rounded-full px-3 py-1">
                  <span className="text-espresso font-medium flex items-center gap-1.5 max-w-[220px] truncate">
                    <Paperclip className="w-3 h-3 text-ember shrink-0" />
                    {attachedFilesRef.current[0]?.name ?? (sw ? "Faili" : "File")}
                    {attachState === "reading" || attachState === "waiting" ? (
                      <span className="text-text-muted">· {sw ? "inasoma…" : "reading…"}</span>
                    ) : attachState === "read" ? (
                      <Check className="w-3 h-3 text-pine" />
                    ) : attachState === "error" ? (
                      <span className="text-ember-hover">· {sw ? "imeshindwa" : "failed"}</span>
                    ) : null}
                  </span>
                  {attachState === "error" ? (
                    <button
                      onClick={() => { const f = attachedFilesRef.current[0]; if (f) void onAttachFile(f); }}
                      className="text-ember-hover hover:text-ember font-semibold"
                    >
                      {sw ? "Jaribu tena" : "Retry"}
                    </button>
                  ) : null}
                  <button onClick={() => { attachedFilesRef.current = []; setAttachedCount(0); pendingFileRef.current = null; setAttachState(""); }}
                    className="text-text-muted hover:text-espresso font-medium">
                    {sw ? "Ondoa" : "Clear"}
                  </button>
                </div>
              )}
              {canBuildEarly && (
                <div className="flex justify-center mb-2">
                  <button onClick={build} disabled={building || sending}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-ember-hover hover:text-ember border border-ember/30 hover:border-ember rounded-full px-3.5 py-1.5 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1 focus-visible:ring-offset-cream">
                    <Sparkles className="w-3.5 h-3.5" />
                    {sw ? `Nimemaliza — tengeneza sasa` : "I'm done — create it now"}
                  </button>
                </div>
              )}
              {micError && (
                <div role="status" aria-live="polite" className="mb-2 flex items-start gap-1.5 text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-300 rounded-input px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px text-amber-700" />
                  <span>{micError}</span>
                </div>
              )}
              {/* WS-12 — after the thread starts, the starter chips retire but
                  capabilities stay one tap away: a compact collapsible row
                  above the composer (never crowding, never lost). */}
              {userTurns > 0 && !done && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowCaps((v) => !v)}
                    aria-expanded={showCaps}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-muted hover:text-ember-hover transition"
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${showCaps ? "rotate-45" : ""}`} />
                    {sw ? "Ninachoweza kufanya" : "What I can do"}
                  </button>
                  {showCaps && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <button onClick={startMatch}
                        className="inline-flex items-center gap-1.5 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                        <Target className="w-3.5 h-3.5 text-ember" />
                        {sw ? "Lenga CV kwa kazi" : "Tailor to a job"}
                      </button>
                      <button onClick={() => pickDoc("cv")}
                        className="inline-flex items-center gap-1.5 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                        <FileText className="w-3.5 h-3.5 text-ember" />
                        {sw ? "Unda CV" : "Create a CV"}
                      </button>
                      <button onClick={() => pickDoc("cover-letter")}
                        className="inline-flex items-center gap-1.5 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                        <Mail className="w-3.5 h-3.5 text-ember" />
                        {sw ? "Barua ya maombi" : "Cover letter"}
                      </button>
                      <button onClick={() => router.push("/interview")}
                        className="inline-flex items-center gap-1.5 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                        <Bolt className="w-3.5 h-3.5 text-ember" />
                        {sw ? "Mahojiano" : "Interview prep"}
                      </button>
                      <button onClick={startJobs}
                        className="inline-flex items-center gap-1.5 bg-card border border-border-input hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                        <Briefcase className="w-3.5 h-3.5 text-ember" />
                        {sw ? "Kazi zinazofanana" : "Matching jobs"}
                      </button>
                      {!guest && (
                        <button onClick={() => router.push("/snap")}
                          className="inline-flex items-center gap-1.5 bg-card border border-ember/30 hover:border-ember hover:bg-ember-tint/40 text-espresso text-xs font-medium rounded-full pl-2.5 pr-3 py-1.5 transition">
                          <Sparkles className="w-3.5 h-3.5 text-ember" />
                          {sw ? "Snap-to-Apply" : "Snap-to-Apply"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* WS-6 — thinking effort selector: Haraka / Wastani / Kina.
                  WS-12 — collapsed to a single sliders icon so the composer stays
                  clean; the three options live in a compact popover above it.
                  Presentation only; persists per conversation; changes the
                  model's reasoning budget, never the deterministic scores. */}
              <div className="relative mb-2">
                <button
                  type="button"
                  onClick={() => setShowEffort((v) => !v)}
                  disabled={sending || building}
                  aria-expanded={showEffort}
                  aria-label={sw ? "Kiwango cha uchambuzi wa AI" : "AI thinking effort"}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition disabled:opacity-40 ${
                    showEffort
                      ? "bg-ember border-ember text-cream"
                      : "border-border-input text-text-muted hover:text-ember hover:border-ember"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {effort === "fast" ? (sw ? "Haraka" : "Fast") : effort === "balanced" ? (sw ? "Wastani" : "Balanced") : (sw ? "Kina" : "Deep")}
                </button>
                {showEffort && (
                  <div className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1 rounded-2xl border border-border bg-card shadow-floating px-1.5 py-1.5 z-20">
                    {(["fast", "balanced", "deep"] as const).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setEffort(e); setShowEffort(false); }}
                        disabled={sending || building}
                        aria-pressed={effort === e}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition disabled:opacity-40 ${
                          effort === e
                            ? "bg-ember border-ember text-cream"
                            : "border-border-input text-text-muted hover:text-ember hover:border-ember"
                        }`}
                      >
                        {e === "fast" ? (sw ? "Haraka" : "Fast") : e === "balanced" ? (sw ? "Wastani" : "Balanced") : (sw ? "Kina" : "Deep")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={sending || building || !!uploading}
                  aria-label={sw ? "Ambatanisha faili" : "Attach a file"}
                  className="w-10 h-10 rounded-full border border-border-input text-text-muted hover:text-ember hover:border-ember flex items-center justify-center disabled:opacity-40 transition shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                {micSupported && (
                  <button
                    onClick={toggleMic}
                    disabled={sending || building}
                    aria-label={listening ? (sw ? "Acha kusikiliza" : "Stop listening") : (sw ? "Sema badala ya kuandika" : "Speak instead of typing")}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition disabled:opacity-40 ${
                      listening
                        ? "bg-ember border-ember text-cream animate-pulse"
                        : "border-border-input text-text-muted hover:text-ember hover:border-ember"
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); if (micError) setMicError(null); autoGrow(e.target); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                  placeholder={sending ? (convoSw ? "Subiri kidogo…" : "One moment…") : awaitingJd ? (convoSw ? "Bandika maelezo ya kazi hapa…" : "Paste the job description here…") : (showChips ? (convoSw ? "Andika, au bandika kiungo cha kazi…" : "Type, or paste a job link…") : (convoSw ? "Andika, au bandika kiungo…" : "Type, or paste a link…"))}
                  rows={1}
                  disabled={sending || building}
                  autoFocus
                  className="flex-1 resize-none px-4 py-2.5 text-base sm:text-sm leading-relaxed bg-sand-2 border border-border-input rounded-2xl focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/60 max-h-[25vh] overflow-y-auto scrollbar-hide disabled:opacity-60"
                />
                <button onClick={submit} disabled={!input.trim() || sending || building}
                  aria-label={sw ? "Tuma" : "Send"}
                  className="w-10 h-10 rounded-full bg-ember hover:bg-ember-hover text-cream flex items-center justify-center disabled:opacity-40 transition shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline ATS result card ──────────────────────────────────────────────────
// A deterministic ATS readiness card rendered right in the conversation — the
// first of the assistant's "cockpit" cards. No AI call; paints instantly.
function AtsResultCard({ score, checks, sw, onFix }: { score: number; checks: AtsCheck[]; sw: boolean; onFix?: () => void }) {
  const ringColor = score >= 80 ? "#059669" : score >= 55 ? "#D97706" : "#EF4444";
  const label = sw
    ? (score >= 80 ? "Tayari" : score >= 55 ? "Inahitaji kazi" : "Hatari kubwa")
    : (score >= 80 ? "Ready" : score >= 55 ? "Needs work" : "High risk");
  const rank: Record<AtsCheck["severity"], number> = { fail: 0, warn: 1, pass: 2 };
  const sorted = [...checks].sort((a, b) => rank[a.severity] - rank[b.severity]);
  const passed = checks.filter((c) => c.severity === "pass").length;
  const problems = checks.length - passed;
  const C = 2 * Math.PI * 15;
  return (
    <div className="max-w-[88%]">
      <ChatCard
        tone={score >= 80 ? "pine" : score >= 55 ? "neutral" : "ember"}
        defaultOpen={score < 80}
        icon={
          <span className="relative w-9 h-9 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 absolute inset-0">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#EFE7DA" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={ringColor} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)" }} />
            </svg>
            <span className="text-[11px] font-black" style={{ color: ringColor }}>{score}</span>
          </span>
        }
        summary={
          <>
            <span className="font-bold">{sw ? "Utayari wa CV" : "ATS readiness"}: {label}</span>
            <span className="block text-xs text-text-muted font-normal">
              {problems > 0
                ? sw ? `${problems} vya kurekebisha` : `${problems} to fix`
                : sw ? "Vyote sawa" : "All good"}
              {" · "}{passed}/{checks.length}
            </span>
          </>
        }
        action={onFix && problems > 0 ? { label: sw ? "Rekebisha kwenye kihariri" : "Fix in the editor", onClick: onFix } : undefined}
      >
        <div className="space-y-1.5">
          {sorted.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              {c.severity === "pass" ? <CheckCircle2 className="w-3.5 h-3.5 text-pine shrink-0 mt-0.5" />
                : c.severity === "warn" ? <AlertTriangle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold leading-tight ${c.severity === "pass" ? "text-text-muted" : "text-espresso"}`}>{c.label}</p>
                {c.severity !== "pass" && <p className="text-[10px] text-text-muted leading-snug mt-0.5">{c.tip}</p>}
              </div>
            </div>
          ))}
        </div>
      </ChatCard>
    </div>
  );
}

// ── Inline job-match card ───────────────────────────────────────────────────
// Deterministic match score + matched/missing keywords, with the apply-action
// "Tailor my CV to this job" (the AI actually makes the change, previewed).
function MatchResultCard({ score, matched, missing, composite, explanation, sw, onTailor, onDismiss, tailorBusy }: {
  score: number; matched: string[]; missing: string[]; sw: boolean; onTailor: () => void; onDismiss?: () => void; tailorBusy: boolean;
  composite?: import("@/lib/score/composite").CompositeScore; explanation?: import("@/lib/score/explain").ScoreExplanation;
}) {
  const tone = score >= 70 ? "text-pine" : score >= 40 ? "text-gold-text" : "text-red-600";
  const bar = score >= 70 ? "bg-pine" : score >= 40 ? "bg-gold" : "bg-red-500";
  // WS-11 — animated count-up on the headline number.
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const ex = explanation;
  return (
    <div className="max-w-[88%]">
      <ChatCard
        tone={score >= 70 ? "pine" : score >= 40 ? "neutral" : "ember"}
        defaultOpen={score < 70}
        icon={<span className={`text-[13px] font-black ${tone}`}>{display}</span>}
        summary={
          <>
            <span className="font-bold">{sw ? "Ulinganifu na kazi hii" : "Match to this job"}: {display}/100</span>
            {missing.length > 0 && (
              <span className="block text-xs text-text-muted font-normal">
                {sw ? `${missing.length} maneno muhimu yanakosekana` : `${missing.length} key words missing`}
              </span>
            )}
          </>
        }
        action={{
          label: tailorBusy ? (sw ? "Inaboresha…" : "Tailoring…") : (sw ? "Lenga CV yako kwa kazi hii" : "Tailor my CV to this job"),
          onClick: onTailor,
          busy: tailorBusy,
        }}
      >
      <div className="space-y-3">
      <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-[width] duration-700 ${bar}`} style={{ width: `${score}%` }} />
      </div>
      {ex && (
        <>
          {ex.good.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-pine mb-1">{sw ? "Zilizopo vizuri" : "What is good"}</p>
              <ul className="text-[11px] text-text-body space-y-0.5">
                {ex.good.slice(0, 4).map((g) => <li key={g}>✓ {g}</li>)}
              </ul>
            </div>
          )}
          {ex.missing.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ember-hover mb-1">{sw ? "Zinazokosekana" : "Holding you back"}</p>
              <ul className="text-[11px] text-text-body space-y-0.5">
                {ex.missing.slice(0, 4).map((g) => <li key={g}>− {g}</li>)}
              </ul>
            </div>
          )}
          {ex.needsUserInput.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gold-text mb-1">{sw ? "Unahitajika kuthibitisha" : "Only you can confirm"}</p>
              <ul className="text-[11px] text-text-body space-y-0.5">
                {ex.needsUserInput.slice(0, 3).map((g) => <li key={g}>? {g}</li>)}
              </ul>
            </div>
          )}
          <p className="text-[9px] text-text-muted italic">{sw ? ex.disclaimer.sw : ex.disclaimer.en}</p>
        </>
      )}
      {missing.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-ember-hover mb-1">{sw ? "Yanayokosekana" : "Missing keywords"} ({missing.length})</p>
          <div className="flex flex-wrap gap-1">
            {missing.slice(0, 10).map((t) => (
              <span key={t} className="text-[10px] bg-ember-tint/50 border border-ember-tint text-espresso rounded-pill px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      )}
      {onDismiss && (
        <button onClick={onDismiss}
          className="w-full py-2 rounded-input-lg border border-border-input text-text-muted hover:text-ember hover:border-ember text-xs font-medium transition">
          {sw ? "Acha CV yako kama ilivyo" : "Keep my CV as it is"}
        </button>
      )}
      </div>
      </ChatCard>
    </div>
  );
}

// ── Inline tailor preview + apply card ──────────────────────────────────────
// The AI's proposed rewrite. The user approves before it is written to the CV —
// preview-before-apply, truth-constrained, reversible in the editor.
function TailorPreviewCard({ summary, count, applied, sw, onApply, onDismiss, applyBusy, editHref, evidence, onConfirm, confirmed, canApply = true, diff }: {
  summary: string; count: number; applied: boolean; sw: boolean; onApply: () => void; onDismiss?: () => void; applyBusy: boolean; editHref?: string;
  evidence?: EvidenceClaim[]; onConfirm?: () => void; confirmed?: boolean; canApply?: boolean;
  diff?: import("@/lib/document-diff").DiffSection[];
}) {
  const unconfirmed = evidence ?? [];
  const needsConfirm = unconfirmed.length > 0 && !confirmed;
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Muhtasari mpya" : "New summary"}</p>
      <div className="text-[12px] leading-relaxed text-espresso bg-sand-2 border border-border rounded-input px-3 py-2 max-h-40 overflow-y-auto">
        {summary}
      </div>
      {count > 0 && (
        <p className="text-[10px] text-pine font-medium flex items-center gap-1">
          <Check className="w-3 h-3" />
          {sw ? `Pamoja na sehemu ${count} za uzoefu zilizoandikwa upya` : `Plus ${count} work ${count === 1 ? "entry" : "entries"} rewritten`}
        </p>
      )}
      {/* WS-9 — deterministic before/after diff: exactly what changes. */}
      {diff && diff.filter((d) => d.changed).length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Mabadiliko" : "Changes"} ({diff.filter((d) => d.changed).length})</p>
          {diff.filter((d) => d.changed).slice(0, 3).map((d) => (
            <div key={d.sectionId} className="border border-border rounded-input overflow-hidden">
              <p className="text-[10px] font-semibold bg-sand-2 px-2.5 py-1 text-espresso">{d.label[sw ? "sw" : "en"]}</p>
              <div className="px-2.5 py-1.5 text-[11px] space-y-1">
                <div className="text-red-600 line-through decoration-red-300">{d.before.join(" ").slice(0, 160) || "—"}</div>
                <div className="text-pine">{d.after.join(" ").slice(0, 160) || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Anti-fabrication gate: claims not in the user's CV are flagged and
          must be confirmed before the rewrite can be applied. */}
      {unconfirmed.length > 0 && (
        <div className={`border rounded-input px-3 py-2 space-y-1.5 ${confirmed ? "border-pine/30 bg-pine-tint/30" : "border-amber-300 bg-amber-50"}`}>
          <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {sw ? "Haya hayapo kwenye CV yako — yameongezwa na AI. Thibitisha kama ni kweli:" : "These aren't in your CV — AI added them. Confirm if true:"}
          </p>
          <ul className="space-y-0.5">
            {unconfirmed.map((c, i) => (
              <li key={i} className="text-[11px] text-espresso flex items-start gap-1.5">
                <span className="text-amber-500 mt-px">•</span>
                <span>
                  <strong>{c.claim}</strong>{" "}
                  <span className="text-text-muted">({sw ? "katika" : "in"} {c.location})</span>
                </span>
              </li>
            ))}
          </ul>
          {!confirmed && onConfirm && (
            <button onClick={onConfirm} disabled={applyBusy}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-input transition disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
              {sw ? "Ndiyo, haya ni kweli — endelea" : "Yes, these are true — continue"}
            </button>
          )}
        </div>
      )}
      {applied ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Imewekwa kwenye CV yako" : "Applied to your CV"}
          {editHref && <Link href={editHref} className="text-ember-hover hover:underline ml-1">{sw ? "Fungua kihariri →" : "Open editor →"}</Link>}
        </p>
      ) : canApply ? (
        <div className="flex gap-2">
          <button onClick={onApply} disabled={applyBusy || needsConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
            {applyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {applyBusy ? (sw ? "Inahifadhi…" : "Applying…") : (sw ? "Weka kwenye CV yako" : "Apply to my CV")}
          </button>
          {onDismiss && (
            <button onClick={onDismiss}
              className="px-3 py-2.5 rounded-input-lg border border-border-input text-text-muted hover:text-ember hover:border-ember text-sm font-medium transition">
              {sw ? "Acha" : "Keep original"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-sand-2 border border-border rounded-input px-3 py-2.5 text-[11.5px] text-text-muted leading-snug">
          {sw
            ? "Huna CV inayotumika bado — unda CV kwanza ili niweze kuiweka hii."
            : "You don't have an active CV yet — create one and I'll apply this to it."}{" "}
          <Link href="/editor/cv/new" className="text-ember-hover font-semibold hover:underline">{sw ? "Unda CV →" : "Create a CV →"}</Link>
        </div>
      )}
    </div>
  );
}

// Jobs card — a short list of live listings the assistant surfaced, each linking
// to the jobs page. Read-only: it's a preview into the feed, not an action.
function JobsResultCard({ jobs, sw }: { jobs: { id: string; title: string; company: string; location: string }[]; sw: boolean }) {
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Kazi zinazoendana" : "Matching jobs"}</p>
      <div className="space-y-1.5">
        {jobs.map((j) => (
          <Link key={j.id} href="/jobs" className="block bg-sand-2 border border-border rounded-input px-3 py-2 hover:border-ember/50 transition">
            <p className="text-[12.5px] font-semibold text-espresso leading-snug">{j.title}</p>
            <p className="text-[11px] text-text-muted">{[j.company, j.location].filter(Boolean).join(" · ")}</p>
          </Link>
        ))}
      </div>
      <Link href="/jobs" className="text-[12px] text-ember-hover font-semibold hover:underline inline-block">{sw ? "Ona kazi zote →" : "See all jobs →"}</Link>
    </div>
  );
}

// Summary preview — the AI-strengthened summary, applied only on confirm.
// Same anti-fabrication gate as the tailor card: claims not in the user's CV
// are flagged needs-confirmation and must be confirmed before Apply.
function SummaryPreviewCard({ summary, applied, sw, onApply, applyBusy, editHref, evidence, onConfirm, confirmed, canApply = true }: {
  summary: string; applied: boolean; sw: boolean; onApply: () => void; applyBusy: boolean; editHref?: string;
  evidence?: EvidenceClaim[]; onConfirm?: () => void; confirmed?: boolean; canApply?: boolean;
}) {
  const unconfirmed = evidence ?? [];
  const needsConfirm = unconfirmed.length > 0 && !confirmed;
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Muhtasari mpya" : "New summary"}</p>
      <div className="text-[12px] leading-relaxed text-espresso bg-sand-2 border border-border rounded-input px-3 py-2 max-h-40 overflow-y-auto">
        {summary}
      </div>
      {unconfirmed.length > 0 && (
        <div className={`border rounded-input px-3 py-2 space-y-1.5 ${confirmed ? "border-pine/30 bg-pine-tint/30" : "border-amber-300 bg-amber-50"}`}>
          <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {sw ? "Haya hayapo kwenye CV yako — yameongezwa na AI. Thibitisha kama ni kweli:" : "These aren't in your CV — AI added them. Confirm if true:"}
          </p>
          <ul className="space-y-0.5">
            {unconfirmed.map((c, i) => (
              <li key={i} className="text-[11px] text-espresso flex items-start gap-1.5">
                <span className="text-amber-500 mt-px">•</span>
                <span>
                  <strong>{c.claim}</strong>{" "}
                  <span className="text-text-muted">({sw ? "katika" : "in"} {c.location})</span>
                </span>
              </li>
            ))}
          </ul>
          {!confirmed && onConfirm && (
            <button onClick={onConfirm} disabled={applyBusy}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-input transition disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
              {sw ? "Ndiyo, haya ni kweli — endelea" : "Yes, these are true — continue"}
            </button>
          )}
        </div>
      )}
      {applied ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Imewekwa kwenye CV yako" : "Saved to your CV"}
          {editHref && <Link href={editHref} className="text-ember-hover hover:underline ml-1">{sw ? "Fungua kihariri →" : "Open editor →"}</Link>}
        </p>
      ) : canApply ? (
        <button onClick={onApply} disabled={applyBusy || needsConfirm}
          className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
          {applyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {applyBusy ? (sw ? "Inahifadhi…" : "Saving…") : (sw ? "Weka kwenye CV yako" : "Save to my CV")}
        </button>
      ) : (
        <div className="bg-sand-2 border border-border rounded-input px-3 py-2.5 text-[11.5px] text-text-muted leading-snug">
          {sw
            ? "Huna CV inayotumika bado — unda CV kwanza ili niweze kuiweka hii."
            : "You don't have an active CV yet — create one and I'll save this to it."}{" "}
          <Link href="/editor/cv/new" className="text-ember-hover font-semibold hover:underline">{sw ? "Unda CV →" : "Create a CV →"}</Link>
        </div>
      )}
    </div>
  );
}

// Skills preview — the skills the AI will add, applied only on confirm.
function SkillsPreviewCard({ skills, applied, sw, onApply, applyBusy, editHref, canApply = true }: {
  skills: string[]; applied: boolean; sw: boolean; onApply: () => void; applyBusy: boolean; editHref?: string; canApply?: boolean;
}) {
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Ujuzi wa kuongeza" : "Skills to add"}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className="text-[12px] font-medium text-espresso bg-sand-2 border border-border rounded-full px-2.5 py-1">{s}</span>
        ))}
      </div>
      {applied ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Imeongezwa kwenye CV yako" : "Added to your CV"}
          {editHref && <Link href={editHref} className="text-ember-hover hover:underline ml-1">{sw ? "Fungua kihariri →" : "Open editor →"}</Link>}
        </p>
      ) : canApply ? (
        <button onClick={onApply} disabled={applyBusy}
          className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
          {applyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {applyBusy ? (sw ? "Inahifadhi…" : "Adding…") : (sw ? "Ongeza kwenye CV yako" : "Add to my CV")}
        </button>
      ) : (
        <div className="bg-sand-2 border border-border rounded-input px-3 py-2.5 text-[11.5px] text-text-muted leading-snug">
          {sw
            ? "Huna CV inayotumika bado — unda CV kwanza ili niweze kuongeza ujuzi huu."
            : "You don't have an active CV yet — create one and I'll add these skills to it."}{" "}
          <Link href="/editor/cv/new" className="text-ember-hover font-semibold hover:underline">{sw ? "Unda CV →" : "Create a CV →"}</Link>
        </div>
      )}
    </div>
  );
}

// Cover-letter preview — the generated letter, saved as a document on confirm.
function CoverLetterPreviewCard({ content, savedId, sw, onSave, saveBusy }: {
  content: string; savedId?: string; sw: boolean; onSave: () => void; saveBusy: boolean;
}) {
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Barua ya maombi" : "Cover letter"}</p>
      <div className="text-[12px] leading-relaxed text-espresso bg-sand-2 border border-border rounded-input px-3 py-2 max-h-52 overflow-y-auto whitespace-pre-wrap">
        {content}
      </div>
      {savedId ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Imehifadhiwa" : "Saved"}
          <Link href={`/editor/cover-letter/${savedId}`} className="text-ember-hover hover:underline ml-1">{sw ? "Fungua kihariri →" : "Open editor →"}</Link>
        </p>
      ) : (
        <button onClick={onSave} disabled={saveBusy}
          className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
          {saveBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saveBusy ? (sw ? "Inahifadhi…" : "Saving…") : (sw ? "Hifadhi kama hati" : "Save as a document")}
        </button>
      )}
    </div>
  );
}

// Track-job confirm — starts an application linked to the CV on confirm.
function TrackJobCard({ jobTitle, companyName, tracked, sw, onConfirm, confirmBusy }: {
  jobTitle?: string; companyName?: string; tracked: boolean; sw: boolean; onConfirm: () => void; confirmBusy: boolean;
}) {
  const label = [jobTitle, companyName].filter(Boolean).join(" · ");
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Fuatilia maombi" : "Track application"}</p>
      {label && <p className="text-[12.5px] font-semibold text-espresso">{label}</p>}
      {tracked ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Imeanzishwa" : "Started"}
          <Link href="/dashboard" className="text-ember-hover hover:underline ml-1">{sw ? "Ona maombi →" : "See applications →"}</Link>
        </p>
      ) : (
        <button onClick={onConfirm} disabled={confirmBusy}
          className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
          {confirmBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {confirmBusy ? (sw ? "Inaanzisha…" : "Starting…") : (sw ? "Anzisha maombi" : "Start tracking")}
        </button>
      )}
    </div>
  );
}

// Document-intelligence result card — summarizes/expands/shortens/proofreads/
// converts/compares the active document. Edit ops preview the text and apply
// ONLY on the user's confirm (expand/shorten → replace summary; convert →
// create the target document). Never auto-applies.
function DocIntelCard({ op, text, section, target, applied, savedId, sw, onApply, applyBusy, evidence, onConfirm, confirmed }: {
  op: string; text: string; section?: string; target?: string; applied: boolean; savedId?: string; sw: boolean;
  onApply?: () => void; applyBusy: boolean;
  evidence?: EvidenceClaim[]; onConfirm?: () => void; confirmed?: boolean;
}) {
  const label = (op === "summarize" ? (sw ? "Muhtasari wa hati" : "Document summary")
    : op === "expand" ? (sw ? "Upanuzi wa sehemu" : "Section expanded")
    : op === "shorten" ? (sw ? "Hati imefupishwa" : "Document shortened")
    : op === "proofread" ? (sw ? "Urekebishaji wa hati" : "Proofread")
    : op === "convert" ? (sw ? "Hati iliyobadilishwa" : "Converted document")
    : op === "structure" ? (sw ? "Muundo wa hati" : "Document structure")
    : (sw ? "Ulinganisho wa hati" : "Document comparison"));
  const canApply = (op === "expand" || op === "shorten") && section === "summary";
  const canConvert = op === "convert" && (target ?? "").toLowerCase().includes("cover");
  const unconfirmed = evidence ?? [];
  const needsConfirm = unconfirmed.length > 0 && !confirmed;
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      {section && <p className="text-[10px] font-medium text-ember-hover">{section}</p>}
      <p className="text-[12.5px] text-espresso leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">{text}</p>
      {unconfirmed.length > 0 && (
        <div className={`border rounded-input px-3 py-2 space-y-1.5 ${confirmed ? "border-pine/30 bg-pine-tint/30" : "border-amber-300 bg-amber-50"}`}>
          <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            {sw ? "Haya hayapo kwenye CV yako — yameongezwa na AI. Thibitisha kama ni kweli:" : "These aren't in your CV — AI added them. Confirm if true:"}
          </p>
          <ul className="space-y-0.5">
            {unconfirmed.map((c, i) => (
              <li key={i} className="text-[11px] text-espresso flex items-start gap-1.5">
                <span className="text-amber-500 mt-px">•</span>
                <span>
                  <strong>{c.claim}</strong>{" "}
                  <span className="text-text-muted">({sw ? "katika" : "in"} {c.location})</span>
                </span>
              </li>
            ))}
          </ul>
          {!confirmed && onConfirm && (
            <button onClick={onConfirm} disabled={applyBusy}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-input transition disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
              {sw ? "Ndiyo, haya ni kweli — endelea" : "Yes, these are true — continue"}
            </button>
          )}
        </div>
      )}
      {applied ? (
        canConvert && savedId ? (
          <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {sw ? "Imehifadhiwa" : "Saved"}
            <Link href={`/editor/cover-letter/${savedId}`} className="text-ember-hover hover:underline ml-1">{sw ? "Fungua →" : "Open →"}</Link>
          </p>
        ) : (
          <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {sw ? "Imetumika kwenye CV" : "Applied to CV"}
          </p>
        )
      ) : (
        (canApply || canConvert) && onApply && (
          <button onClick={onApply} disabled={applyBusy || needsConfirm}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
            {applyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {applyBusy
              ? (sw ? "Inahifadhi…" : "Applying…")
              : canConvert
                ? (sw ? "Hifadhi kama barua ya maombi" : "Save as cover letter")
                : (sw ? "Tumia kwenye CV" : "Apply to CV")}
          </button>
        )
      )}
      {!applied && !canApply && !canConvert && (
        <p className="text-[10px] text-text-muted">
          {sw ? "Nakili maandishi unayotaka kwenye mhariri." : "Copy the text you want into the editor."}
        </p>
      )}    </div>
  );
}
// SmartFit preview card — the deterministic engine's proposed design changes
// (template family / density / section order). Applies ONLY on confirm via
// the real design engine settings (same fields the editor's presets write).
function SmartFitCard({ templateId, density, sectionOrder, rationale, applied, sw, onApply, applyBusy }: {
  templateId?: string; density?: "compact" | "normal" | "airy"; sectionOrder?: string[]; rationale: { en: string; sw: string };
  applied: boolean; sw: boolean; onApply?: () => void; applyBusy: boolean;
}) {
  // P3: a referenced template renders as a real inline preview card (thumbnail
  // + title + tap-to-open). Unknown ids degrade to the old text chip.
  const tplInfo = templateId ? resolveTemplatePreview(templateId) : null;
  const densityLabel = (d: string) =>
    d === "compact" ? (sw ? "Compact (bana)" : "Compact")
    : d === "airy" ? (sw ? "Airy (pana)" : "Airy")
    : (sw ? "Normal" : "Normal");
  return (
    <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-bl-md p-4 space-y-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "Mpango wa muundo" : "Design plan"}</p>
      <p className="text-[12.5px] text-espresso leading-relaxed">{sw ? rationale.sw : rationale.en}</p>
      {tplInfo && <TemplatePreviewCard info={tplInfo} sw={sw} />}
      {(density || sectionOrder) && (
        <div className="flex flex-wrap gap-1.5">
          {density && (
            <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
              {sw ? "Msongamano:" : "Density:"} {densityLabel(density)}
            </span>
          )}
          {sectionOrder && (
            <span className="text-[10px] font-medium bg-sand text-text-body rounded-pill px-2 py-0.5 border border-border">
              {sectionOrder.length} {sw ? "sehemu za msingi" : "core sections"}
            </span>
          )}
        </div>
      )}
      {templateId && !tplInfo && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-medium bg-ember-tint/40 border border-ember-tint text-espresso rounded-pill px-2 py-0.5">
            {sw ? "Templeti:" : "Template:"} {templateId}
          </span>
        </div>
      )}
      {applied ? (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Muundo umesasishwa — fungua mhariri kuona." : "Design applied — open the editor to see it."}
        </p>
      ) : (
        onApply && (
          <button onClick={onApply} disabled={applyBusy}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-pine/90 text-cream text-sm font-semibold py-2.5 rounded-input-lg transition disabled:opacity-50">
            {applyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {applyBusy ? (sw ? "Inasasisha…" : "Applying…") : (sw ? "Tumia muundo huu" : "Apply this design")}
          </button>
        )
      )}
    </div>
  );
}

// Skill-gap card — the deterministic facts (strengths/gaps/score from the real
// match engine) clearly separated from the AI's learning-plan recommendation.
// The plan is labelled as a recommendation, never as a claim about the CV.
function SkillGapCard({ jobTitle, strengths, gaps, score, learningPlan, summary, resources, sw }: {
  jobTitle?: string; strengths: string[]; gaps: string[]; score: number;
  learningPlan: { step: string; gap: string }[] | null; summary?: string; sw: boolean;
  resources?: { title: string; provider: string; url: string; free: boolean }[];
}) {
  return (
    <div className="max-w-[88%]">
      <ChatCard
        tone={gaps.length === 0 ? "pine" : "neutral"}
        defaultOpen={gaps.length > 0}
        icon={<span className="text-[12px] font-black text-espresso">{score}%</span>}
        summary={
          <>
            <span className="font-bold">
              {sw ? "Mapungufu ya ujuzi" : "Skill-gap check"}{jobTitle ? ` — ${jobTitle}` : ""}
            </span>
            <span className="block text-xs text-text-muted font-normal">
              {gaps.length === 0
                ? sw ? "Hakuna mapungufu makubwa" : "No major gaps"
                : sw ? `${gaps.length} ya kujenga · ${score}% ya kazi imefikiwa` : `${gaps.length} to build · ${score}% covered`}
            </span>
          </>
        }
      >
      <div className="space-y-2.5">
      {strengths.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-pine mb-1">
            {sw ? "Unacho tayari" : "What you already have"}
          </p>
          <div className="flex flex-wrap gap-1">
            {strengths.slice(0, 12).map((s) => (
              <span key={s} className="text-[10px] font-medium bg-pine/10 border border-pine/30 text-pine rounded-pill px-2 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}
      {gaps.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ember-hover mb-1">
            {sw ? "Unachokosa (ukweli kutoka CV yako)" : "Missing from your CV (facts)"}
          </p>
          <div className="flex flex-wrap gap-1">
            {gaps.slice(0, 12).map((g) => (
              <span key={g} className="text-[10px] font-medium bg-ember-tint/40 border border-ember-tint text-espresso rounded-pill px-2 py-0.5">{g}</span>
            ))}
          </div>
        </div>
      )}
      {learningPlan && (
        <div className="border-t border-border pt-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ember-hover">
            {sw ? "Pendekezo la mpango wa kujifunza (AI)" : "Suggested learning plan (AI recommendation)"}
          </p>
          {summary && <p className="text-[11.5px] text-espresso leading-relaxed">{summary}</p>}
          <ol className="space-y-1">
            {learningPlan.map((s, i) => (
              <li key={i} className="text-[11.5px] text-espresso flex gap-1.5">
                <span className="text-ember-hover font-semibold shrink-0">{i + 1}.</span>
                <span>
                  {s.step}
                  {s.gap && <span className="text-text-muted"> ({s.gap})</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {resources && resources.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-pine">
            {sw ? "Rasilimali halisi za kujifunza" : "Real learning resources"}
          </p>
          <ul className="space-y-1">
            {resources.slice(0, 4).map((r, i) => (
              <li key={`${r.url}-${i}`} className="text-[11.5px] leading-snug">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ember-hover hover:text-ember font-semibold underline underline-offset-2"
                >
                  {r.title}
                </a>
                <span className="text-text-muted"> · {r.provider}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-text-muted">
            {sw
              ? "Kila rasilimali imehakikiwa — kozi halisi, si maelekezo ya jumla."
              : "Every resource is a real, verified course — not generic advice."}
          </p>
        </div>
      )}
      {gaps.length === 0 && (
        <p className="text-[12px] font-semibold text-pine flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {sw ? "Hakuna mapungufu makubwa — tayari uko tayari kuomba nafasi hii." : "No major gaps — you're ready to apply for this role."}
        </p>
      )}
      </div>
      </ChatCard>
    </div>
  );
}

// CV-comparison card — deterministic scores for both CVs (facts from the match
// engine, shown as numbers) plus the AI's short explanation of the verdict.
function CvCompareCard({ verdict, onlyA, onlyB, shared, scored, aScore, bScore, winner, sw }: {
  verdict: string; onlyA: string[]; onlyB: string[]; shared: string[];
  scored: boolean; aScore?: number; bScore?: number; winner?: "a" | "b" | "tie"; sw: boolean;
}) {
  const winnerLabel = winner === "a" ? (sw ? "CV yako" : "Your CV")
    : winner === "b" ? (sw ? "CV nyingine" : "The other CV")
    : (sw ? "Sawa" : "Tie");
  return (
    <div className="max-w-[88%]">
      <ChatCard
        tone="neutral"
        defaultOpen
        icon={<span className="text-[10px] font-black text-espresso">VS</span>}
        summary={
          <>
            <span className="font-bold">{sw ? "Ulinganisho wa CV" : "CV comparison"}</span>
            {scored && (
              <span className="block text-xs text-text-muted font-normal">
                {winner === "tie" ? (sw ? "Zina alama sawa" : "Equal") : `${sw ? "Bora" : "Stronger"}: ${winnerLabel}`}
                {typeof aScore === "number" && typeof bScore === "number" ? ` · ${aScore}% vs ${bScore}%` : ""}
              </span>
            )}
          </>
        }
      >
      <div className="space-y-2.5">
      {scored && typeof aScore === "number" && typeof bScore === "number" && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-text-muted">{sw ? "CV yako" : "Your CV"}</p>
            <p className={`text-xl font-bold ${winner === "a" ? "text-pine" : "text-espresso"}`}>{aScore}%</p>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{sw ? "dhidi ya kazi" : "vs the job"}</div>
          <div className="flex-1 text-right">
            <p className="text-[10px] font-semibold text-text-muted">{sw ? "CV nyingine" : "Other CV"}</p>
            <p className={`text-xl font-bold ${winner === "b" ? "text-pine" : "text-espresso"}`}>{bScore}%</p>
          </div>
        </div>
      )}
      {scored && (
        <p className="text-[11px] font-semibold text-pine">
          {winner === "tie"
            ? (sw ? "Zina alama sawa — hakuna bora zaidi kwa kazi hii." : "They score equally — neither is clearly better for this job.")
            : (sw ? `Bora zaidi: ${winnerLabel}` : `Stronger: ${winnerLabel}`)}
        </p>
      )}
      <p className="text-[12.5px] text-espresso leading-relaxed whitespace-pre-wrap">{verdict}</p>
      {(onlyA.length > 0 || onlyB.length > 0 || shared.length > 0) && (
        <div className="space-y-1.5 border-t border-border pt-2">
          {onlyA.length > 0 && (
            <p className="text-[10px] text-espresso">
              <span className="font-semibold text-pine">{sw ? "CV yako pekee: " : "Only your CV: "}</span>
              {onlyA.slice(0, 8).join(", ")}
            </p>
          )}
          {onlyB.length > 0 && (
            <p className="text-[10px] text-espresso">
              <span className="font-semibold text-ember-hover">{sw ? "CV nyingine pekee: " : "Only the other CV: "}</span>
              {onlyB.slice(0, 8).join(", ")}
            </p>
          )}
          {shared.length > 0 && (
            <p className="text-[10px] text-text-muted">
              <span className="font-semibold">{sw ? "Zote: " : "Both: "}</span>
              {shared.slice(0, 8).join(", ")}
            </p>
          )}
        </div>
      )}
      </div>
      </ChatCard>
    </div>
  );
}
