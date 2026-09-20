"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, AlertCircle, CheckCircle2, Wand2, FileText, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { track } from "@/lib/analytics";
import { scoreResumeText, type AtsTextResult } from "@/lib/ats-text";
import { MAX_PDF_UPLOAD_BYTES, MAX_PDF_UPLOAD_MB } from "@/lib/upload-limits";

function ScoreRing({ score }: { score: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const color = score >= 80 ? "#2F6B4F" : score >= 55 ? "#F2A93B" : "#C8451D";
  return (
    <div className="relative w-[140px] h-[140px] shrink-0">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EDE6DB" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold text-espresso leading-none">{score}</span>
        <span className="text-[11px] text-text-muted font-semibold">/ 100</span>
      </div>
    </div>
  );
}

export function AtsCheckerClient() {
  const sw = useLang() === "sw";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AtsTextResult | null>(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [pasteText, setPasteText] = useState("");

  function analyzePaste() {
    setError("");
    const t = pasteText.trim();
    if (t.replace(/\s/g, "").length < 40) {
      setError(sw ? "Bandika angalau maandishi kidogo ya CV yako." : "Paste at least a little of your CV text.");
      return;
    }
    setText(t);
    const scored = scoreResumeText(t, sw);
    setResult(scored);
    track("ats_checked", { mode: "paste", score: scored.score, status: scored.status });
  }

  const analyze = useCallback(async (file: File) => {
    setError(""); setResult(null);
    if (file.type !== "application/pdf") {
      setError(sw ? "Tafadhali pakia faili la PDF." : "Please upload a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_UPLOAD_BYTES) {
      setError(sw ? `Faili ni kubwa mno (kiwango cha juu ni ${MAX_PDF_UPLOAD_MB} MB).` : `That file is too large (max ${MAX_PDF_UPLOAD_MB} MB).`);
      return;
    }
    setFileName(file.name);
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tools/extract-text", { method: "POST", body: fd, signal: controller.signal });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? (sw ? "Imeshindwa kusoma PDF." : "Couldn't read that PDF."));
        return;
      }
      const extracted: string = json.text ?? "";
      setText(extracted);
      const scored = scoreResumeText(extracted, sw);
      setResult(scored);
      track("ats_checked", { mode: "upload", score: scored.score, status: scored.status });
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? (sw ? "Imechukua muda mrefu. Jaribu tena au faili dogo." : "That took too long. Try again or a smaller file.")
          : (sw ? "Hitilafu ya mtandao." : "Network error.")
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [sw]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) analyze(f);
  }, [analyze]);

  function reset() {
    setResult(null); setError(""); setText(""); setFileName(""); setPasteText("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function fixThisCv() {
    try {
      localStorage.setItem("th_pending_cv_text", JSON.stringify({ text, ts: Date.now() }));
    } catch {}
    router.push("/import-cv");
  }

  const statusText = (s: AtsTextResult["status"]) =>
    s === "ready" ? (sw ? "Tayari kutuma" : "Ready to send")
      : s === "needs-work" ? (sw ? "Inahitaji kazi" : "Needs work")
      : (sw ? "Hatari kubwa" : "High risk");

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Input — upload a PDF or paste text */}
      {!result && (
        <div>
          {/* Mode toggle */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex bg-sand-2 rounded-pill p-1 border border-border">
              {(["upload", "paste"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`px-4 py-1.5 rounded-pill text-xs font-semibold transition ${
                    mode === m ? "bg-espresso text-cream" : "text-text-body hover:text-espresso"
                  }`}
                >
                  {m === "upload" ? (sw ? "Pakia PDF" : "Upload PDF") : (sw ? "Bandika maandishi" : "Paste text")}
                </button>
              ))}
            </div>
          </div>

          {mode === "upload" ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => !loading && inputRef.current?.click()}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !loading) inputRef.current?.click(); }}
              aria-label={sw ? "Pakia CV yako ya PDF" : "Upload your CV PDF"}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-card-lg p-10 transition-all cursor-pointer ${
                drag ? "border-ember bg-cream" : "border-border bg-card hover:border-text-muted hover:bg-cream"
              } ${loading ? "pointer-events-none opacity-80" : ""}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-ember shadow-ember-hard flex items-center justify-center mb-4">
                {loading ? <Loader2 className="w-8 h-8 text-cream animate-spin" /> : <FileUp className="w-8 h-8 text-cream" />}
              </div>
              <p className="text-base font-semibold text-espresso">
                {loading ? (sw ? "Inakagua CV yako…" : "Checking your CV…") : (sw ? "Pakia CV yako (PDF)" : "Upload your CV (PDF)")}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {loading ? fileName : (sw ? `Buruta hapa au bofya kuchagua · PDF hadi MB ${MAX_PDF_UPLOAD_MB} · haifadhiwi` : `Drag here or click to choose · PDF up to ${MAX_PDF_UPLOAD_MB} MB · never stored`)}
              </p>
              <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f); }} />
            </div>
          ) : (
            <div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={10}
                aria-label={sw ? "Bandika maandishi ya CV yako" : "Paste your CV text"}
                placeholder={sw ? "Bandika maandishi yote ya CV yako hapa…" : "Paste your full CV text here…"}
                className="w-full rounded-card-lg border border-border-input bg-card px-4 py-3 text-sm text-espresso placeholder-text-muted leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-text-muted">{sw ? "Haifadhiwi popote." : "Never stored anywhere."}</p>
                <button
                  onClick={analyzePaste}
                  className="inline-flex items-center gap-2 bg-ember text-cream font-semibold rounded-input-lg px-6 py-2.5 text-sm shadow-ember-hard hover:scale-[1.02] active:scale-[0.97] transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> {sw ? "Kagua CV yangu" : "Check my CV"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2.5 text-sm text-espresso bg-ember-tint border border-ember/20 rounded-card-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-card border border-border rounded-card-lg p-6">
            <ScoreRing score={result.score} />
            <div className="flex-1 text-center sm:text-left">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-pill ${
                result.status === "ready" ? "bg-pine-tint text-pine"
                  : result.status === "needs-work" ? "bg-gold-tint text-gold-text"
                  : "bg-ember-tint text-ember-hover"
              }`}>
                {statusText(result.status)}
              </span>
              <h2 className="font-display font-extrabold text-2xl text-espresso mt-3">
                {sw ? "Alama yako ya ATS" : "Your ATS score"}
              </h2>
              <p className="text-sm text-text-body mt-1.5 leading-relaxed">
                {result.status === "ready"
                  ? (sw ? "CV yako inapita ukaguzi wa mifumo mingi ya ATS. Rekebisha vidokezo vichache hapo chini." : "Your CV clears most ATS checks. Tidy up the few items below and you're set.")
                  : (sw ? "Kuna mambo yanayoweza kukufanya ukataliwe na ATS. Rekebisha yaliyo hapa chini." : "A few things could get you filtered out by an ATS. Fix the flagged items below.")}
              </p>
              <button onClick={reset} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-ember-hover transition">
                <RefreshCw className="w-3.5 h-3.5" /> {sw ? "Kagua CV nyingine" : "Check another CV"}
              </button>
            </div>
          </div>

          {/* Checks */}
          <div className="mt-5 space-y-2.5">
            {result.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-3 bg-card border border-border rounded-card px-4 py-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  c.severity === "pass" ? "bg-pine-tint" : c.severity === "warn" ? "bg-gold-tint" : "bg-ember-tint"
                }`}>
                  {c.severity === "pass"
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-pine" />
                    : <span className={`text-[11px] font-bold ${c.severity === "warn" ? "text-gold-text" : "text-ember-hover"}`}>{c.severity === "warn" ? "!" : "✕"}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-espresso">{c.label}</p>
                    <span className="text-[11px] font-mono text-text-muted shrink-0">{c.earned}/{c.max}</span>
                  </div>
                  {c.severity !== "pass" && <p className="text-xs text-text-body mt-1 leading-relaxed">{c.tip}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 rounded-card-lg bg-espresso px-6 py-7 text-center">
            <h3 className="font-display font-extrabold text-xl text-cream mb-1.5">
              {sw ? "Boresha alama yako mara moja" : "Fix your score in minutes"}
            </h3>
            <p className="text-cream/60 text-sm mb-5 max-w-md mx-auto leading-relaxed">
              {sw
                ? "Jenga upya CV yako kwa muundo rafiki kwa ATS, au rekebisha hii uliyopakia."
                : "Rebuild your CV on an ATS-friendly template, or fix the one you just uploaded — free."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {text.replace(/\s/g, "").length >= 40 && (
                <button onClick={fixThisCv}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ember text-cream font-semibold rounded-input-lg px-6 py-3 text-sm shadow-ember-hard hover:scale-[1.02] active:scale-[0.97] transition">
                  <Wand2 className="w-4 h-4" /> {sw ? "Rekebisha CV hii" : "Fix this CV"}
                </button>
              )}
              <a href="/templates"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cream text-espresso font-semibold rounded-input-lg px-6 py-3 text-sm hover:bg-white transition">
                <FileText className="w-4 h-4" /> {sw ? "Anza CV mpya" : "Start a new CV"}
              </a>
            </div>
          </div>

          <p className="text-[11px] text-text-muted/70 text-center mt-4 leading-relaxed">
            {sw
              ? "Ukaguzi huu unatathmini maandishi ya CV yako. Kila mfumo wa ATS hutofautiana kidogo."
              : "This check analyzes your CV's text the way an ATS parses it. Every ATS differs slightly."}
          </p>
        </div>
      )}
    </div>
  );
}
