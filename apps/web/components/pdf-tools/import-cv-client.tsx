"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileUp, Loader2, Sparkles, ArrowLeft, X, FileText, Wand2, AlertCircle, Copy,
} from "lucide-react";
import { type CVData } from "@/types";
import { toCvData, type ParsedCv } from "@/lib/cv/from-parsed";
import { useLang } from "@/lib/i18n/context";
import { ExtractionError } from "@/lib/client-cv-extract";

// Extraction now happens IN THE BROWSER (text layer + OCR fallback), so the
// file is never uploaded — Vercel's ~4.5 MB body limit no longer applies. The
// only ceiling is browser memory while rendering/OCR-ing, so allow generous
// files and just guard against something absurd.
const MAX_FILE_MB = 25;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

// A slow AI response (or a stalled upload) should fail with a clear message
// rather than spinning forever. The server function has a 60s ceiling, so we
// give each request a little more and let the abort win first.
const REQUEST_TIMEOUT_MS = 65_000;

function isPdf(f: File): boolean {
  return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
}

/** fetch() with an AbortController timeout so a hung request can't spin forever. */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Parser-output → CVData mapping lives in lib/cv/from-parsed so the CV Assistant
// shares the exact same forgiving adapter (a strict validate would blank the CV).

/**
 * Map imported CV identity into a shared-profile seed payload. Trimmed to the
 * profile schema's limits and drops a malformed email, so a best-effort seed
 * can't 400 on junk parsed data. Only the fields the parser actually extracts
 * are present.
 */
function toProfileSeed(data: CVData): Record<string, string> {
  const p = data.personal;
  const clip = (s: string | undefined, n: number) => (s ?? "").trim().slice(0, n);
  const out: Record<string, string> = {};
  const put = (k: string, v: string) => { if (v) out[k] = v; };
  put("fullName", clip(p.fullName, 200));
  put("jobTitle", clip(p.jobTitle, 200));
  if (p.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) out.email = p.email.trim().slice(0, 200);
  put("phone", clip(p.phone, 50));
  put("location", clip(p.location, 200));
  put("linkedin", clip(p.linkedin, 500));
  put("website", clip(p.website, 500));
  put("summary", clip(data.summary, 2000));
  return out;
}

type Step = "idle" | "reading" | "understanding" | "opening";

export function ImportCvClient({ initialTemplateId }: { initialTemplateId?: string }) {
  const lang = useLang();
  const sw = lang === "sw";
  const router = useRouter();

  const t = {
    back: sw ? "Dashibodi" : "Dashboard",
    title: sw ? "Pakia CV yako ya zamani" : "Import your old CV",
    subtitle: sw
      ? "Pakia CV yoyote ya PDF — hata iliyotengenezwa hapa au iliyoskaniwa — tuibadilishe kuwa CV inayoharirika, tayari kubadili mtindo na taarifa."
      : "Upload any PDF résumé — even one made here or scanned — and we'll turn it into a fully editable Sumaiya CV, ready to restyle and rewrite.",
    drop: sw ? "Dondosha CV yako ya PDF hapa au bofya" : "Drop your PDF résumé here, or click to browse",
    dropHint: sw ? `PDF yoyote — yenye maandishi au ya picha/skani · hadi ${MAX_FILE_MB} MB` : `Any PDF — text or image/scan · up to ${MAX_FILE_MB} MB`,
    change: sw ? "Badilisha faili" : "Change file",
    ready: sw ? "Tayari kuingizwa" : "Ready to import",
    reading: sw ? "Inasoma faili…" : "Reading your file…",
    ocr: sw ? "Inasoma picha (OCR)" : "Reading the image (OCR)",
    understanding: sw ? "AI inaelewa CV yako…" : "AI is understanding your CV…",
    opening: sw ? "Inafungua kihariri…" : "Opening the editor…",
    // Per-failure messages — never collapse everything into one generic error,
    // so the user knows what to actually do next.
    notPdf: sw ? "Tafadhali pakia faili ya PDF." : "Please upload a PDF file.",
    tooLarge: sw
      ? `Faili ni kubwa mno (kiwango cha juu ${MAX_FILE_MB} MB). Jaribu faili ndogo.`
      : `That file is too large (max ${MAX_FILE_MB} MB). Try a smaller file.`,
    scanned: sw
      ? "Hatukuweza kusoma maandishi hata kwa OCR. Hakikisha PDF inaonekana wazi (si tupu wala yenye ukungu)."
      : "We couldn't read any text, even with OCR. Make sure the PDF is clear and legible (not blank or blurry).",
    madeHereTitle: sw ? "Njia ya haraka: uliitengeneza hapa?" : "Faster: made your CV here already?",
    madeHereBody: sw
      ? "Kama CV ipo kwenye akaunti yako, gusa \"⋯\" kwenye kadi yake dashibodi kisha Duplicate — ni papo hapo. Au endelea kuipakia hapa chini."
      : "If the CV is in your account, tap \"⋯\" on its dashboard card, then Duplicate — it's instant. Otherwise, upload it below.",
    madeHereCta: sw ? "Nenda dashibodi" : "Go to dashboard",
    readFail: sw
      ? "Tumeshindwa kusoma maandishi ya PDF hii. Hakikisha si iliyoskaniwa."
      : "We couldn't read this PDF's text. Make sure it isn't a scan.",
    aiOff: sw
      ? "Huduma ya AI haipatikani kwa sasa. Jaribu tena baadaye."
      : "The AI service is unavailable right now. Please try again later.",
    aiBusy: sw
      ? "AI ina shughuli nyingi kwa sasa. Subiri dakika moja kisha ujaribu tena."
      : "The AI is busy right now. Wait a minute and try again.",
    timeout: sw
      ? "Imechukua muda mrefu mno. Jaribu tena — mara nyingi hufaulu mara ya pili."
      : "This is taking too long. Please try again — it usually works on a second attempt.",
    saveFail: sw
      ? "Tumeshindwa kuhifadhi CV. Jaribu tena."
      : "We couldn't save your CV. Please try again.",
    failed: sw ? "Imeshindikana. Jaribu tena." : "Something went wrong. Please try again.",
    go: sw ? "Igeuze kuwa CV unayoweza kuhariri" : "Convert to an editable CV",
    steps: sw
      ? ["Pakia PDF", "AI inasoma", "Hariri & pakua"]
      : ["Upload PDF", "AI reads it", "Edit & export"],
  };

  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [detail, setDetail] = useState(""); // live sub-label (e.g. OCR page/percent)
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = step !== "idle";

  const pickFile = useCallback((list: FileList | File[]) => {
    const all = Array.from(list);
    if (all.length === 0) return;
    const f = all.find(isPdf);
    if (!f) { setError(t.notPdf); return; }
    if (f.size > MAX_FILE_BYTES) { setError(t.tooLarge); return; }
    setError("");
    setFile(f);
    // t is a stable per-render object of strings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Steps 2–3: structure already-extracted text with AI, create the CV, open
  // the editor. Shared by the file-upload flow and the /tools text handoff.
  const structureAndCreate = useCallback(async (text: string) => {
    try {
      setStep("understanding");
      const parseRes = await fetchWithTimeout("/api/ai/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 20000) }),
      });
      const parseJson = await parseRes.json().catch(() => ({})) as { success?: boolean; data?: ParsedCv; error?: string };
      if (!parseRes.ok || !parseJson.success || !parseJson.data) {
        // Prefer the server's friendly message; otherwise map the status code so
        // a non-JSON 5xx/timeout still says something useful instead of "failed".
        setError(parseJson.error || statusMessage(parseRes.status, t));
        setStep("idle");
        return;
      }

      const data = toCvData(parseJson.data);
      const title = data.personal.fullName ? `${data.personal.fullName} — CV` : "Imported CV";

      setStep("opening");
      const createRes = await fetchWithTimeout("/api/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          data,
          ...(initialTemplateId && { templateId: initialTemplateId }),
        }),
      });
      const createJson = await createRes.json().catch(() => ({})) as { success?: boolean; data?: { id?: string }; error?: string };
      if (!createRes.ok || !createJson.success || !createJson.data?.id) {
        setError(createJson.error || t.saveFail);
        setStep("idle");
        return;
      }

      // Best-effort: also seed the shared profile so future CVs, letters and
      // business cards prefill from this import too (fill-only-blanks server
      // side). Never blocks or fails the redirect.
      const seed = toProfileSeed(data);
      if (Object.keys(seed).length > 0) {
        await fetchWithTimeout("/api/profile/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seed),
        }).catch(() => {});
      }

      router.push(`/editor/cv/${createJson.data.id}`);
    } catch (err) {
      setError(isAbort(err) ? t.timeout : t.failed);
      setStep("idle");
    }
    // t is a stable per-render object of strings; router and initialTemplateId are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, initialTemplateId]);

  function extractErrorMsg(err: unknown): string {
    if (err instanceof ExtractionError) {
      switch (err.code) {
        case "TOO_LARGE":   return t.tooLarge;
        case "PARSE_FAILED": return sw
          ? "Hatukuweza kusoma PDF hii. Inaweza kuwa imeharibika au haipo katika muundo sahihi."
          : "Couldn't read this PDF. It may be corrupted or not a valid PDF.";
        case "NO_TEXT":      return t.scanned;
        case "TIMEOUT":      return sw
          ? "Imechukua muda mrefu mno. Jaribu faili ndogo au PDF yenye maandishi."
          : "This PDF took too long to process. Try a smaller file or a text-based PDF.";
        case "OCR_FAILED":   return sw
          ? "Hatukuweza kusoma maandishi kwenye PDF hii. Hakikisha si tupu."
          : "We couldn't read text from this PDF. Make sure it isn't blank.";
        case "MEMORY":       return sw
          ? "Faili ni kubwa mno kwa kumbukumbu ya kivinjari. Jaribu PDF yenye maandishi badala ya skani."
          : "This file is too large for browser memory. Try a text-based PDF instead of a scan.";
      }
    }
    if (isAbort(err)) return t.timeout;
    return t.failed;
  }

  async function handleImport() {
    if (!file || busy) return;
    // Guard again at submit time in case the file was set some other way.
    if (file.size > MAX_FILE_BYTES) { setError(t.tooLarge); return; }
    setError("");
    setDetail("");
    try {
      // 1 ── extract text IN THE BROWSER (text layer, then OCR for image PDFs).
      // Nothing is uploaded, so file size / image-only PDFs are no longer a wall.
      setStep("reading");
      const { extractCvTextFromPdf } = await import("@/lib/client-cv-extract");
      const { text } = await extractCvTextFromPdf(file, (p) => {
        if (p.stage === "ocr") setDetail(`${t.ocr} · ${p.page}/${p.total} · ${p.pct}%`);
        else setDetail("");
      });
      setDetail("");
      if (text.replace(/\s/g, "").length < 40) {
        setError(t.scanned);
        setStep("idle");
        return;
      }

      // 2–3 ── structure + create (server AI)
      await structureAndCreate(text);
    } catch (err) {
      setError(extractErrorMsg(err));
      setStep("idle");
      setDetail("");
    }
  }

  // Handoff from the public /tools "Extract Text" tool: it stashes the extracted
  // text and routes here so the user doesn't re-upload. Pick it up once on mount
  // and run straight to the editor. sessionStorage survives the sign-in redirect
  // for logged-out users, so their text isn't lost.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("th_pending_cv_text");
    if (!raw) return;
    localStorage.removeItem("th_pending_cv_text");
    let text = "";
    try {
      const parsed = JSON.parse(raw) as { text?: string; ts?: number };
      // Ignore a stale handoff (>30 min) so old text can't auto-import later.
      if (parsed.ts && Date.now() - parsed.ts < 30 * 60 * 1000) text = (parsed.text ?? "").trim();
    } catch {
      // Back-compat: a plain string from the older sessionStorage handoff.
      text = raw.trim();
    }
    if (!text || text.replace(/\s/g, "").length < 40) { if (text) setError(t.scanned); return; }
    void structureAndCreate(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureAndCreate]);

  const stepLabel =
    step === "reading" ? (detail || t.reading)
    : step === "understanding" ? t.understanding
    : t.opening;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-espresso transition mb-6">
        <ArrowLeft className="w-4 h-4" /> {t.back}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-ember text-cream shadow-ember-hard flex items-center justify-center shrink-0">
          <Wand2 className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-espresso tracking-tight">{t.title}</h1>
          <p className="text-text-body mt-1.5 leading-relaxed">{t.subtitle}</p>
        </div>
      </div>

      {/* Made-here shortcut: importing is for CVs from OTHER tools (text PDFs).
          A Sumaiya CV exports as an image, so re-uploading it dead-ends at
          the "no text" error — point those users to Duplicate instead. */}
      <Link
        href="/dashboard"
        className="flex items-start gap-3 mb-8 rounded-card-lg border border-pine/25 bg-pine/[0.06] px-4 py-3.5 hover:bg-pine/[0.1] transition"
      >
        <Copy className="w-5 h-5 text-pine shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-espresso">{t.madeHereTitle}</p>
          <p className="text-xs text-text-body mt-0.5 leading-relaxed">{t.madeHereBody}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-pine mt-1.5">
            {t.madeHereCta} <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </span>
        </div>
      </Link>

      {/* Steps ribbon */}
      <div className="flex items-center gap-2 mb-8">
        {t.steps.map((label, i) => {
          const stepIndex = step === "reading" ? 0 : step === "understanding" ? 1 : step === "opening" ? 2 : -1;
          const active = i === stepIndex;
          const done = stepIndex > i;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                  active ? "bg-ember text-cream" : done ? "bg-pine text-cream" : "bg-espresso text-cream"
                }`}>{i + 1}</span>
                <span className={`text-xs font-medium truncate ${active ? "text-ember-hover" : "text-text-body"}`}>{label}</span>
              </div>
              {i < t.steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {busy && !file ? (
        /* Auto-run from the /tools text handoff — no file to show, just progress */
        <div className="flex flex-col items-center justify-center rounded-card-lg border border-border bg-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ember text-cream shadow-ember-hard flex items-center justify-center mb-4">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-espresso">{stepLabel}</p>
          {error && (
            <p className="mt-3 text-sm text-ember-hover flex items-center gap-1.5 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      ) : !file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-card-lg p-10 transition-all cursor-pointer ${
            dragOver ? "border-ember bg-cream" : "border-border bg-card hover:border-text-muted hover:bg-sand-2"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-ember text-cream shadow-ember-hard flex items-center justify-center mb-4">
            <FileUp className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-espresso text-center">{t.drop}</p>
          <p className="text-xs text-text-muted mt-1 text-center">{t.dropHint}</p>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={(e) => { pickFile(e.target.files ?? []); e.target.value = ""; }} className="hidden" />
          {error && (
            <p className="mt-4 text-sm text-ember-hover flex items-center gap-1.5 text-center">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 bg-card rounded-card-lg px-4 py-3.5 border border-border">
            <div className="w-9 h-9 rounded-xl bg-ember-tint flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-ember" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-espresso truncate">{file.name}</p>
              <p className="text-xs text-text-muted">{t.ready} · {(file.size / 1024).toFixed(0)} KB</p>
            </div>
            {!busy && (
              <button onClick={() => { setFile(null); setError(""); }} className="text-text-muted hover:text-ember transition p-1.5 -m-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-1" aria-label={t.change}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2.5 text-sm text-espresso bg-ember-tint border border-ember/20 rounded-card-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 text-ember shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full-width primary action. During work the spinner + live step label
              sit INSIDE the button (not split off to the left, which read as two
              competing spinners on mobile), with a subtle reassurance line below. */}
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-ember text-cream font-semibold rounded-input-lg px-7 py-3.5 text-sm shadow-ember-hard hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-90 disabled:cursor-wait"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? stepLabel : t.go}
            </button>
            {busy && (
              <p className="mt-2.5 text-center text-xs text-text-muted">
                {sw ? "Hii huchukua sekunde chache…" : "This takes a few seconds…"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Map an HTTP status to a friendly message for when the response body carries
 *  no JSON `error` (e.g. a gateway timeout or an HTML 5xx page). */
function statusMessage(
  status: number,
  t: { tooLarge: string; aiBusy: string; aiOff: string; timeout: string; failed: string }
): string {
  if (status === 413) return t.tooLarge;
  if (status === 429) return t.aiBusy;
  if (status === 503) return t.aiOff;
  if (status === 408 || status === 502 || status === 504) return t.timeout;
  return t.failed;
}
