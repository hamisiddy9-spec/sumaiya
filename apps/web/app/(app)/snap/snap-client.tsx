"use client";

// E1 Snap-to-Apply — paste-text slice (mobile-first, guest-friendly).
//
// Flow: paste a job description → /api/ai/snap → ATS match score + tailored
// CV + cover letter. Anti-fabrication is enforced server-side (JD guard,
// TRUTH_CONSTRAINT, evidence engine); this client renders the results and
// surfaces unconfirmed claims for the user to confirm before saving — it
// never silently commits an AI claim.

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardPaste,
  Camera,
  ImagePlus,
  ScanText,
  Loader2,
  Sparkles,
  Target,
  FileText,
  Mail,
  Check,
  Copy,
  RefreshCw,
  AlertTriangle,
  Info,
  Download,
  UserPlus,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth-client";
// D7 perf: the extractor module is pulled in ONLY when the user actually
// activates photo mode (first camera/gallery pick) — the paste path never
// loads it. tesseract.js (WASM) is itself dynamic-imported behind
// loadOcrEngine() in lib/client-cv-extract.ts, so paste users pay for
// neither the extractor nor the OCR engine. Type-only import is erased.
import type { ExtractProgress } from "@/lib/client-cv-extract";
import { isOcrTextUsable, snapOcrNoTextMessage, snapOcrRetryMessage } from "@/lib/snap-ocr";
import { nextSnapTab, snapResultsLiveMessage, tailoredCvTitle, snapScoreAt } from "@/lib/snap-a11y";
import { STRINGS } from "@/lib/snap-strings";
import { readJdPrefill, clearJdPrefill } from "@/lib/snap-prefill";
import { buildShareUrl, snapShareText } from "@/lib/snap-share";
import { snapApplicationPayload } from "@/lib/snap-application";
import { exportElementToPdf, buildCvText } from "@/lib/pdf";
import { snapExportFilename } from "@/lib/snap-export";
import { NakuruTemplate } from "@/components/templates/nakuru";
import type { CVData } from "@/types";
import type { Lang } from "@/lib/i18n/translations";
import { INTER_STACK } from "@/lib/fonts";
import { TemplateCanvas } from "@/components/templates/template-canvas";

const GUEST_CV_KEY = "sumaiya-guest-cv";

// D8 funnel: fire-and-forget client→server outcome events (POST /api/snap/event).
// Best-effort by contract — a blocked/failed analytics ping must never affect
// the snap flow, so every error is swallowed. keepalive keeps the ping alive
// across the guest→sign-in navigation that follows a save.
function reportSnapEvent(event: "started" | "ocr_used" | "saved", lang: Lang, extra?: { source?: "profile" | "guest" }) {
  try {
    void fetch("/api/snap/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, lang, ...extra }),
      keepalive: true,
    }).catch(() => { /* non-fatal */ });
  } catch { /* non-fatal */ }
}

interface SnapMatch {
  before: { score: number; matched: string[]; missing: string[] };
  after: { score: number; matched: string[]; missing: string[] };
  explanation: string[];
  jobTitle: string;
  requirements: string[];
  tailored: boolean;
}

interface SnapEvidence {
  count: number;
  allSupported: boolean;
  unconfirmed: Array<{ claim: string; kind: string; location: string }>;
}

interface SnapResult {
  source: "profile" | "guest";
  match: SnapMatch;
  tailoredCv: CVData | null;
  evidence: SnapEvidence;
  coverLetter: string | null;
  warnings: string[];
  // D4 — signed, PII-free share token (ATS score + sanitized job title + lang
  // ONLY) minted server-side; renders the public card at /snap/share/<token>.
  shareToken?: string;
}

type SoftError = { code: "NOT_A_JOB" | "NO_PROFILE"; message: string } | null;

// D9 motion: the ATS score counts up from 0 and eases into place so the result
// lands with a satisfying deceleration instead of popping in. rAF-driven and
// transform-free (only a text node changes — no layout thrash). The easing
// math lives in lib/snap-a11y.ts (unit-tested); prefers-reduced-motion users
// get the final value instantly.
function useSnapScore(target: number | null, durationMs = 650): number {
  const [value, setValue] = useState(target ?? 0);
  useEffect(() => {
    if (target == null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const v = snapScoreAt(now - start, durationMs, target);
      setValue(v);
      if (v !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// STRINGS (en/sw) live in lib/snap-strings.ts so the bilingual-parity
// invariant is unit-tested (R3). Imported above.

export function SnapClient({ lang }: { lang: Lang }) {
  const s = STRINGS[lang];
  const sw = lang === "sw";
  const router = useRouter();

  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [softError, setSoftError] = useState<SoftError>(null);
  const [hardError, setHardError] = useState("");
  const [result, setResult] = useState<SnapResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  // M1 — when the save also creates an application workspace entry, this holds
  // its id so the saved banner can link straight into the tracker.
  const [appId, setAppId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  // D4 — "Made with Sumaiya" viral hook: share the PII-free result card
  // (native share sheet where available, copy-link fallback).
  const [shareCopied, setShareCopied] = useState(false);
  // E2 — photo/OCR slice: Paste | Photo mode.
  const [mode, setMode] = useState<"paste" | "photo">("paste");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoText, setPhotoText] = useState("");
  // D2 — "Tailor my CV for this job" hand-off from the jobs feed: the REAL JD
  // arrives via sessionStorage (recency-guarded). Consumed once on mount.
  const [prefillMeta, setPrefillMeta] = useState<{ label: string } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // D3 — which PDF is being prepared right now ("cv" | "letter"), if any.
  const [exporting, setExporting] = useState<"cv" | "letter" | null>(null);
  // D3 — off-screen render targets for the PDF export (the real Nakuru CV
  // template + a clean letter layout). Rendered but off-screen so html2canvas
  // can capture them; never display:none (html2canvas can't capture hidden).
  const cvExportRef = useRef<HTMLDivElement>(null);
  const letterExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // D2: consume a pending jobs-feed prefill exactly once. readJdPrefill
  // refuses stale/corrupted/empty payloads, so a broken hand-off degrades to a
  // clean page — never a fabricated JD. The storage entry is cleared so a later
  // direct visit does not re-prefill.
  useEffect(() => {
    const prefill = readJdPrefill();
    if (!prefill) return;
    clearJdPrefill();
    setJd(prefill.jd);
    setMode("paste");
    const label = [prefill.title, prefill.company].filter(Boolean).join(" — ");
    setPrefillMeta(label ? { label } : null);
    requestAnimationFrame(() => document.getElementById("snap-jd")?.focus());
  }, []);

  // D8 funnel: snap.started — once per page mount (ref guards dev double-mount).
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    reportSnapEvent("started", lang);
  }, [lang]);

  const run = useCallback(async () => {
    const text = jd.trim();
    if (!text || loading) return;
    setLoading(true);
    setSoftError(null);
    setHardError("");
    setResult(null);
    setSavedId(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);

    // Guests send their localStorage CV draft (same key the guest builder and
    // migrate-guest use) so the server tailors against REAL facts.
    let guestCv: Record<string, unknown> | undefined;
    try {
      const raw = localStorage.getItem(GUEST_CV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { cv?: Record<string, unknown> };
        if (parsed.cv && Object.keys(parsed.cv).length) guestCv = parsed.cv;
      }
    } catch { /* non-fatal */ }

    try {
      const res = await fetch("/api/ai/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          jobDescription: text,
          lang: sw ? "sw" : "en",
          ...(guestCv ? { cv: guestCv } : {}),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        code?: string;
        message?: string;
        error?: string;
        data?: SnapResult;
      };
      if (j.success && j.data) {
        setResult(j.data);
        // R3 a11y: results replace the input card, which unmounts the focused
        // "Snap my application" button. Move focus to the results heading so
        // keyboard + screen-reader users are never dropped back to the page top.
        requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          document.getElementById("snap-results-heading")?.focus({ preventScroll: true });
        });
      } else if (j.code === "NOT_A_JOB" || j.code === "NO_PROFILE") {
        setSoftError({ code: j.code, message: j.message ?? "" });
      } else {
        setHardError(j.error || s.genericError);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") setHardError(s.timedOut);
      else setHardError(s.networkError);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [jd, loading, sw, s]);

  // ── E2 photo slice: camera/gallery → client-side OCR → same pipeline ──────
  // The OCR runs on-device (tesseract.js WASM — free, no API key). Whatever
  // text comes out fills the SAME textarea and the SAME run() → /api/ai/snap
  // call. No new server route, no bypass: looksLikeJobDescription still gates
  // the text server-side, and unusable OCR output is never sent at all.
  const handlePhotoFile = useCallback(
    async (file: File | null) => {
      if (!file || photoBusy) return;
      if (!file.type.startsWith("image/")) {
        setPhotoError(s.photoNotImage);
        return;
      }
      setPhotoError("");
      setPhotoText("");
      setPhotoProgress(0);
      setPhotoBusy(true);
      setSoftError(null);
      setHardError("");
      setResult(null);
      setSavedId(null);
      // Local preview so the user sees exactly what will be read.
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      // D8 funnel: the photo/OCR path was used (best-effort, fire-and-forget).
      reportSnapEvent("ocr_used", sw ? "sw" : "en");
      try {
        // D7: the extractor (and, behind it, the tesseract.js WASM engine) is
        // lazy-loaded here — inside the photo-mode activation path. Paste users
        // never execute this import, so they never fetch the OCR chunks.
        const { extractTextFromImage } = await import("@/lib/client-cv-extract");
        const res = await extractTextFromImage(file, (p: ExtractProgress) => {
          if (p.stage === "ocr") setPhotoProgress(p.pct);
        });
        const text = (res.text ?? "").trim();
        if (!isOcrTextUsable(text)) {
          // Poor image / no text → warm retry guidance. NEVER send empty or
          // symbol-only output down the pipeline.
          setPhotoError(`${snapOcrNoTextMessage(sw)} ${snapOcrRetryMessage(sw)}`);
          setPhotoText("");
          setJd("");
          return;
        }
        // Usable text → fill the shared input so the EXACT same run() applies.
        // Stay in photo mode: the user sees the poster preview + the extracted
        // text together, edits if OCR erred, then snaps.
        setPhotoText(text);
        setJd(text);
        requestAnimationFrame(() => document.getElementById("snap-jd")?.focus());
      } catch {
        setPhotoError(`${s.photoError} ${snapOcrRetryMessage(sw)}`);
        setPhotoText("");
        setJd("");
      } finally {
        setPhotoBusy(false);
        setPhotoProgress(null);
        // Revoke the blob URL after a beat so the preview stays visible.
        setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
      }
    },
    [photoBusy, sw, s],
  );

  const pickCamera = useCallback(() => cameraInputRef.current?.click(), []);
  const pickGallery = useCallback(() => galleryInputRef.current?.click(), []);

  // R3 a11y: WAI-ARIA tabs keyboard pattern — ArrowLeft/Right wrap around,
  // Home/End jump to first/last; selection follows focus so keyboard users
  // move through Paste/Photo and into the shared textarea without a mouse.
  const onTablistKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const current = mode === "paste" ? 0 : 1;
      const next = nextSnapTab(current, e.key, 2);
      const nextMode = next === 0 ? "paste" : "photo";
      setMode(nextMode);
      requestAnimationFrame(() =>
        document.getElementById(next === 0 ? "snap-tab-paste" : "snap-tab-photo")?.focus(),
      );
    },
    [mode],
  );

  // ── Save: authed users → /api/cv; guests → stash + sign-up conversion ─────
  // Shared with the D3 PDF downloads: a guest's tailored CV is stashed under
  // the migration key (same one /migrate-guest + the sign-in form read) so no
  // work is lost when they convert — never a dead end.
  const stashGuestCv = useCallback((cv: CVData, title: string) => {
    try {
      localStorage.setItem(GUEST_CV_KEY, JSON.stringify({
        cv,
        title,
        templateId: "nakuru",
        primaryColor: "#DA4A1C",
        fontFamily: "Inter",
        migrationId: crypto.randomUUID(),
      }));
    } catch { /* non-fatal — the redirect still happens */ }
    router.push("/sign-in");
  }, [router]);

  const save = useCallback(async () => {
    if (!result?.tailoredCv || saving) return;
    setSaving(true);
    try {
      const { data: { session } } = await getSession();
      const title = tailoredCvTitle(sw, result.match.jobTitle);
      if (session) {
        const res = await fetch("/api/cv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title,
            templateId: "nakuru",
            primaryColor: "#DA4A1C",
            fontFamily: "Inter",
            data: result.tailoredCv,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { success?: boolean; data?: { id?: string } };
        if (res.ok && j.success && j.data?.id) {
          setSavedId(j.data.id);
          // D8 funnel: authed save landed.
          reportSnapEvent("saved", sw ? "sw" : "en", { source: "profile" });

          // M1 — Application Mode: the save also opens a tracker entry so the
          // job + JD + match + tailored CV live in the workspace, not just the
          // editor. Best-effort by contract — if this fails the CV is already
          // saved and the user still sees the editor link; nothing blocks.
          const appPayload = snapApplicationPayload({
            cvId: j.data.id,
            jobTitle: result.match.jobTitle,
            jobDescription: jd,
            matchScore: result.match.after.score,
          });
          if (appPayload) {
            try {
              const appRes = await fetch("/api/applications/from-cv", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  ...appPayload,
                  // M2 — persist the snap-time breakdown (REAL parsed data) so
                  // the workspace can show per-requirement evidence later.
                  requirements: result.match.requirements,
                  matched: result.match.after.matched,
                  missing: result.match.after.missing,
                }),
              });
              const appJ = (await appRes.json().catch(() => ({}))) as {
                success?: boolean;
                data?: { id?: string };
              };
              if (appRes.ok && appJ.success && appJ.data?.id) setAppId(appJ.data.id);
            } catch { /* non-fatal — CV already saved */ }
          }
        } else {
          // Session said authed but the write failed (expired) — fall through
          // to the guest stash so the work is never lost.
          reportSnapEvent("saved", sw ? "sw" : "en", { source: "guest" });
          stashGuestCv(result.tailoredCv, title);
        }
      } else {
        // Guest → save the migration pattern: stash under the same key the
        // sign-in form and /migrate-guest read, then convert.
        reportSnapEvent("saved", sw ? "sw" : "en", { source: "guest" });
        stashGuestCv(result.tailoredCv, title);
      }
    } catch {
      setHardError(s.networkError);
    } finally {
      setSaving(false);
    }
  }, [result, saving, stashGuestCv, s, jd]);

  // ── D3: one-tap PDF export — the promise, in hand ─────────────────────────
  // Renders the REAL result (Nakuru template for the tailored CV, a clean A4
  // layout for the letter) via lib/pdf.ts exportElementToPdf, which handles
  // Android/desktop download + the iOS share-sheet/new-tab path. The PDF gets
  // an invisible ATS text layer so recruiters can parse it. Guests convert to
  // sign-in first (same migration pattern as save — the app's download gate).
  const downloadCvPdf = useCallback(async () => {
    if (!result?.tailoredCv || exporting) return;
    const { data: { session } } = await getSession().catch(() => ({ data: { session: null } }));
    if (!session) {
      const title = `Tailored CV${result.match.jobTitle ? ` — ${result.match.jobTitle}` : ""}`;
      stashGuestCv(result.tailoredCv, title);
      return;
    }
    setExporting("cv");
    try {
      const el = cvExportRef.current;
      if (!el) return;
      await exportElementToPdf(el, {
        filename: snapExportFilename("cv", result.match.jobTitle, sw),
        textLayer: buildCvText(result.tailoredCv, lang),
      });
    } catch {
      setHardError(s.pdfError);
    } finally {
      setExporting(null);
    }
  }, [result, exporting, sw, s, stashGuestCv]);

  const downloadLetterPdf = useCallback(async () => {
    if (!result?.coverLetter || exporting) return;
    const { data: { session } } = await getSession().catch(() => ({ data: { session: null } }));
    if (!session) {
      // A guest has no saved letter artifact to carry through sign-in — the
      // CV stash is what converts; the letter is re-snappable in seconds.
      if (result.tailoredCv) {
        const title = `Tailored CV${result.match.jobTitle ? ` — ${result.match.jobTitle}` : ""}`;
        stashGuestCv(result.tailoredCv, title);
      } else {
        router.push("/sign-in");
      }
      return;
    }
    setExporting("letter");
    try {
      const el = letterExportRef.current;
      if (!el) return;
      await exportElementToPdf(el, {
        filename: snapExportFilename("letter", result.match.jobTitle, sw),
        textLayer: result.coverLetter,
      });
    } catch {
      setHardError(s.pdfError);
    } finally {
      setExporting(null);
    }
  }, [result, exporting, sw, s, stashGuestCv, router]);

  const copyLetter = useCallback(async () => {
    if (!result?.coverLetter) return;
    try {
      await navigator.clipboard.writeText(result.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* non-fatal */ }
  }, [result]);

  // ── D4: "Made with Sumaiya" viral hook ────────────────────────────────
  // The result carries a signed, PII-free share token (ATS score + sanitized
  // job title ONLY — no CV text, no names, no contacts) minted server-side,
  // so ANY user (guest or authed) can share their result without leaking
  // personal data. The URL comes exclusively from the server's real token —
  // a missing/invalid token simply means no share link (never fabricated).
  // Native share sheet where available (mobile), copy-link fallback.
  const shareResult = useCallback(async () => {
    if (!result?.shareToken) return;
    const url = buildShareUrl(
      typeof window !== "undefined" ? window.location.origin : "",
      result.shareToken,
    );
    if (!url) return;
    const text = snapShareText(sw, result.match.jobTitle);
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: s.shareSheetTitle, text, url });
        return; // shared via the native sheet — done
      } catch (err) {
        // AbortError = user dismissed the sheet; any other failure falls
        // through to copy-link so the affordance still works.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* clipboard blocked — non-fatal */ }
  }, [result, sw, s]);

  const reset = useCallback(() => {
    setResult(null);
    setSoftError(null);
    setHardError("");
    setJd("");
    setSavedId(null);
    setMode("paste");
    setPhotoPreview(null);
    setPhotoBusy(false);
    setPhotoProgress(null);
    setPhotoError("");
    setPhotoText("");
    setPrefillMeta(null);
    // R3 a11y: the results unmount on reset — move focus back into the input
    // card (paste tab) instead of losing it to the document.
    requestAnimationFrame(() => document.getElementById("snap-tab-paste")?.focus());
  }, []);

  const match = result?.match;
  const evidence = result?.evidence;
  // Count-up display value — animates 0 → score when results arrive.
  const animatedScore = useSnapScore(match?.after.score ?? null);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <Badge icon={<Sparkles className="w-3.5 h-3.5" />}>{s.badge}</Badge>
        <h1 className="font-display text-espresso text-2xl sm:text-3xl font-extrabold mt-3">{s.title}</h1>
        <p className="text-text-body text-sm sm:text-base mt-1.5">{s.subtitle}</p>
      </div>

      {/* Input */}
      {!result && (
        <div className="bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
          {/* Paste | Photo toggle */}
          <div
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-sand/60 p-1"
            role="tablist"
            aria-label={s.snapModeLabel}
            onKeyDown={onTablistKeyDown}
          >
            <button
              type="button"
              role="tab"
              id="snap-tab-paste"
              aria-controls="snap-panel"
              aria-selected={mode === "paste"}
              onClick={() => setMode("paste")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                mode === "paste" ? "bg-white text-espresso shadow-card" : "text-text-muted hover:text-espresso"
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              {s.pasteTab}
            </button>
            <button
              type="button"
              role="tab"
              id="snap-tab-photo"
              aria-controls="snap-panel"
              aria-selected={mode === "photo"}
              onClick={() => setMode("photo")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98] ${
                mode === "photo" ? "bg-white text-espresso shadow-card" : "text-text-muted hover:text-espresso"
              }`}
            >
              <Camera className="w-4 h-4" />
              {s.photoTab}
            </button>
          </div>

          {/* Shared tabpanel: photo capture UI + textarea + errors + run */}
          <div
            id="snap-panel"
            role="tabpanel"
            aria-labelledby={mode === "paste" ? "snap-tab-paste" : "snap-tab-photo"}
            aria-busy={loading || photoBusy}
          >

          {/* Photo capture (E2) */}
          {mode === "photo" && (
            <div className="snap-panel mb-4 rounded-xl border border-border bg-sand/60 p-3.5">
              <p id="snap-photo-hint" className="flex items-start gap-1.5 text-xs text-text-muted">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {s.photoHint}
              </p>

              {photoPreview && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt={s.posterPreviewAlt} className="max-h-64 w-full object-contain" />
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={pickCamera}
                  disabled={photoBusy}
                  aria-describedby="snap-photo-hint"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-espresso px-3 py-2.5 text-sm font-semibold text-cream transition hover:bg-black/80 active:scale-[0.98] disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {s.takePhoto}
                </button>
                <button
                  type="button"
                  onClick={pickGallery}
                  disabled={photoBusy}
                  aria-describedby="snap-photo-hint"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-espresso transition hover:bg-sand active:scale-[0.98] disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  {s.uploadImage}
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  void handlePhotoFile(f);
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  void handlePhotoFile(f);
                }}
              />

              {/* R3: reserved height so the OCR status/error never shoves the
                  textarea + run button down mid-read (no layout shift). */}
              <div className="min-h-[64px]">
                {photoBusy && (
                  <div className="mt-3 rounded-xl border border-ember/30 bg-ember-tint/50 p-3" role="status">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ember-hover">
                      <ScanText className="w-4 h-4 animate-pulse" />
                      {photoProgress != null ? s.ocrProgress.replace("{pct}", String(photoProgress)) : s.readingPhoto}
                    </p>
                    {photoProgress != null && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ember/15">
                        <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${photoProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {photoError && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5" role="alert">
                    <p className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      {s.ocrNoTextTitle}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">{photoError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D2: notice when the JD was prefilled from a tapped job card. */}
          {prefillMeta && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-ember/25 bg-ember-tint/40 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-espresso min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-ember shrink-0" />
                <span className="truncate">{s.prefillNotice.replace("{job}", prefillMeta.label)}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setJd("");
                  setPrefillMeta(null);
                  requestAnimationFrame(() => document.getElementById("snap-jd")?.focus());
                }}
                className="shrink-0 text-xs font-semibold text-ember-hover hover:text-ember transition-colors"
                aria-label={s.prefillClear}
              >
                {s.prefillClear}
              </button>
            </div>
          )}

          <label htmlFor="snap-jd" className="sr-only">{s.textareaPlaceholder}</label>
          <textarea
            id="snap-jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder={s.textareaPlaceholder}
            rows={9}
            className="w-full resize-y rounded-xl border border-border bg-white p-3.5 text-sm text-espresso placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ember/50 min-h-36"
          />
          <p className="mt-2 flex items-start gap-1.5 text-xs text-text-muted">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {mode === "photo" && photoText ? s.ocrCheckHint : s.pasteHint}
          </p>
          {mode === "photo" && photoText && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-ember-hover">
              <ScanText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {s.ocrCheckTitle}
            </p>
          )}

          {softError && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5" role="alert">
              <p className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {softError.code === "NOT_A_JOB" ? s.notJobTitle : s.noProfileTitle}
              </p>
              <p className="mt-1 text-sm text-amber-700">{softError.message}</p>
              {softError.code === "NOT_A_JOB" && (
                <p className="mt-1 text-xs text-amber-600">{s.notJobHint}</p>
              )}
              {softError.code === "NO_PROFILE" && (
                <a
                  href="/assistant"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-cream shadow-ember-hard hover:bg-ember-hover"
                >
                  <UserPlus className="w-4 h-4" />
                  {s.buildCv}
                </a>
              )}
            </div>
          )}
          {hardError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700" role="alert">
              {hardError}
            </div>
          )}

          <button
            onClick={run}
            disabled={loading || !jd.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3.5 text-sm font-semibold text-cream shadow-ember-hard transition hover:bg-ember-hover active:scale-[0.98] active:shadow-ember-active disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                {s.running}
              </>
            ) : (
              <>
                <ClipboardPaste className="w-4.5 h-4.5" />
                {s.run}
              </>
            )}
          </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && match && (
        <div ref={resultRef} className="space-y-4">
          {/* R3 a11y: polite live region — screen readers announce the results
              even if the user's focus is elsewhere on the page. */}
          <p className="sr-only" role="status">
            {snapResultsLiveMessage(sw, match.after.score)}
          </p>
          {result.warnings.length > 0 && (
            <div className="snap-rise rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800 flex items-start gap-2" role="status">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{s.aiOffline}</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="mt-0.5 text-amber-700">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* ATS match card */}
          <div className="snap-rise snap-rise-1 bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
            <div className="flex items-center gap-2 text-ember">
              <Target className="w-4.5 h-4.5" />
              <h2 id="snap-results-heading" tabIndex={-1} className="font-display text-espresso text-lg font-semibold outline-none">{s.scoreLabel}</h2>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <div className="text-5xl font-bold font-display text-ember leading-none">{animatedScore}%</div>
              {match.tailored ? (
                <div className="pb-1 text-sm text-text-muted">
                  {s.scoreBefore} <span className="font-semibold text-espresso">{match.before.score}%</span> → {s.scoreAfter}{" "}
                  <span className="font-semibold text-espresso">{match.after.score}%</span>
                </div>
              ) : (
                <div className="pb-1 text-sm text-text-muted">
                  {s.scoreBefore} <span className="font-semibold text-espresso">{match.before.score}%</span>
                </div>
              )}
            </div>
            {match.explanation.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{s.why}</p>
                <ul className="mt-1.5 space-y-1 text-sm text-text-body">
                  {match.explanation.map((e, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="text-ember">•</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {match.after.matched.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{s.matched}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {match.after.matched.slice(0, 18).map((t) => (
                    <span key={t} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {match.after.missing.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{s.missing}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {match.after.missing.slice(0, 18).map((t) => (
                    <span key={t} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tailored CV card */}
          {result.tailoredCv && (
            <div className="snap-rise snap-rise-2 bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-ember">
                  <FileText className="w-4.5 h-4.5" />
                  <h2 className="font-display text-espresso text-lg font-semibold">{s.tailoredTitle}</h2>
                </div>
                {/* D3: take the tailored CV with you — one tap → PDF. */}
                <button
                  onClick={() => void downloadCvPdf()}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-espresso px-3 py-1.5 text-xs font-semibold text-cream hover:bg-black/80 disabled:opacity-50"
                >
                  {exporting === "cv" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {exporting === "cv" ? s.preparingPdf : s.downloadCvPdf}
                </button>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{s.tailoredSub}</p>
              {result.tailoredCv.summary && (
                <p className="mt-3 text-sm text-text-body leading-relaxed">{result.tailoredCv.summary}</p>
              )}
              {result.tailoredCv.experience.length > 0 && (
                <div className="mt-4 space-y-3">
                  {result.tailoredCv.experience.map((e) => (
                    <div key={e.id} className="rounded-xl border border-border bg-sand/60 p-3">
                      <p className="text-sm font-semibold text-espresso">
                        {e.position}{e.company ? ` — ${e.company}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-text-body whitespace-pre-line">{e.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {evidence && evidence.count > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {s.evidenceTitle} ({evidence.count})
                  </p>
                  <p className="mt-1 text-xs text-amber-700">{s.evidenceHint}</p>
                  <ul className="mt-2 space-y-1">
                    {evidence.unconfirmed.slice(0, 8).map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <span className="mt-1 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                        <span>
                          <span className="font-medium">&quot;{c.claim}&quot;</span>{" "}
                          <span className="text-amber-600">({s.claimKinds[c.kind as keyof typeof s.claimKinds] ?? c.kind})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Cover letter card */}
          {result.coverLetter && (
            <div className="snap-rise snap-rise-3 bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-ember">
                  <Mail className="w-4.5 h-4.5" />
                  <h2 className="font-display text-espresso text-lg font-semibold">{s.coverTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* D3: take the letter with you — one tap → PDF. */}
                  <button
                    onClick={() => void downloadLetterPdf()}
                    disabled={exporting !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand disabled:opacity-50"
                  >
                    {exporting === "letter" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {exporting === "letter" ? s.preparingPdf : s.downloadLetterPdf}
                  </button>
                  <button
                    onClick={copyLetter}
                    aria-live="polite"
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                      copied
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-border bg-white text-espresso hover:bg-sand"
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? s.copied : s.copyLetter}
                  </button>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{s.coverSub}</p>
              <p className="mt-3 text-sm text-text-body leading-relaxed whitespace-pre-line">{result.coverLetter}</p>
            </div>
          )}

          {/* Save / convert */}
          <div className="snap-rise snap-rise-4 bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
            {savedId ? (
              <div className="flex flex-col gap-2">
                <a
                  href={`/editor/cv/${savedId}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                >
                  <Check className="w-4.5 h-4.5" />
                  {s.saved}
                </a>
                {/* M1 — the save also opened a tracker entry; link into the
                    application workspace so the job, match and docs live there. */}
                {appId && (
                  <a
                    href={`/applications/${appId}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 px-5 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                  >
                    {s.openApplication}
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={save}
                disabled={saving || !result.tailoredCv}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-espresso px-5 py-3.5 text-sm font-semibold text-cream shadow transition hover:bg-black/80 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Download className="w-4.5 h-4.5" />}
                {saving ? s.saving : result.source === "guest" ? s.guestSave : s.save}
              </button>
            )}
            {!savedId && result.source === "guest" && (
              <p className="mt-2 text-center text-xs text-text-muted">{s.guestSaveHint}</p>
            )}
          </div>

          {/* D4 — "Made with Sumaiya" viral hook: share the PII-free result
              card. The token is signed server-side and carries ONLY the ATS
              score + sanitized job title, so guests AND authed users can share
              with zero PII risk. Native share sheet → copy-link fallback. */}
          {result.shareToken && (
            <div className="bg-card rounded-card-lg shadow-card border border-border p-4 sm:p-5">
              <div className="flex items-center gap-2 text-ember">
                <Share2 className="w-4.5 h-4.5" />
                <h2 className="font-display text-espresso text-lg font-semibold">{s.madeWith}</h2>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{s.shareSub}</p>
              <button
                onClick={() => void shareResult()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ember/30 bg-ember-tint/50 px-5 py-3 text-sm font-semibold text-ember-hover transition hover:bg-ember-tint"
              >
                {shareCopied ? <Check className="w-4.5 h-4.5 text-emerald-600" /> : <Share2 className="w-4.5 h-4.5" />}
                {shareCopied ? s.shareCopied : s.shareButton}
              </button>
              <p className="mt-2 text-center text-[11px] text-text-muted">{s.shareLinkHint}</p>
            </div>
          )}

          <button
            onClick={reset}
            className="snap-rise snap-rise-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-espresso transition hover:bg-sand active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            {s.tryAnother}
          </button>

          <p className="snap-rise snap-rise-4 pt-1 text-center text-[11px] uppercase tracking-widest text-text-muted">
            {s.madeWith} ✦
          </p>
        </div>
      )}

      {/* D3 — off-screen PDF render targets. Always mounted while a result is
          shown so the export captures the EXACT tailored output: the real
          Nakuru template for the CV (A4, 794px) and a clean letter layout.
          position:fixed + off-viewport keeps them out of the layout and the
          tab order; they are rendered (not display:none) because html2canvas
          cannot capture hidden elements. */}
      <div aria-hidden="true" className="pointer-events-none" style={{ position: "fixed", left: -10000, top: 0, zIndex: -1 }}>
        {result?.tailoredCv && (
          <div ref={cvExportRef} style={{ width: 794, background: "#fff" }}>
            <TemplateCanvas>
              <NakuruTemplate data={result.tailoredCv} primaryColor="#DA4A1C" fontFamily={INTER_STACK} lang={sw ? "sw" : "en"} />
            </TemplateCanvas>
          </div>
        )}
        {result?.coverLetter && (
          <div ref={letterExportRef} style={{ width: 794, background: "#fff", padding: 56, boxSizing: "border-box" }}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#1a1a1a" }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{result.coverLetter}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
