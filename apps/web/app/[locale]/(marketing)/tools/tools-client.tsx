"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image, Combine, Scissors, FileText,
  RotateCw, Stamp, ListOrdered, FileMinus,
  ChevronRight, X, CheckCircle, AlertCircle, Loader2,
  ArrowDownToLine, FileUp, Wand2, Sparkles,
} from "lucide-react";
import { MarketingNav } from "@/components/ui/marketing-nav";
import { Footer } from "@/components/ui/footer";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n/context";
import { translations } from "@/lib/i18n/translations";
import { MAX_PDF_UPLOAD_BYTES, MAX_PDF_UPLOAD_MB } from "@/lib/upload-limits";

// ── Types ──────────────────────────────────────────────────────────────────────
type ToolId =
  | "image-to-pdf" | "merge" | "split" | "extract-text"
  | "rotate" | "watermark" | "page-numbers" | "delete-pages";

interface ToolConfig {
  id: ToolId;
  icon: typeof Image;
  nameKey: keyof typeof translations.en.tools;
  descKey: keyof typeof translations.en.tools;
  hintKey: keyof typeof translations.en.tools;
  accept: string;
  multiple: boolean;
  hasPassword: boolean;
  hasPages: boolean;
  hasText: boolean;   // watermark text input
  hasAngle: boolean;  // rotation selector
  endpoint: string;
  extractText: boolean;
}

const TOOLS: ToolConfig[] = [
  { id: "image-to-pdf", icon: Image, nameKey: "imageToPdf", descKey: "imageToPdfDesc", hintKey: "imageHint", accept: "image/png,image/jpeg", multiple: true, hasPassword: false, hasPages: false, hasText: false, hasAngle: false, endpoint: "/api/tools/image-to-pdf", extractText: false },
  { id: "merge", icon: Combine, nameKey: "merge", descKey: "mergeDesc", hintKey: "mergeHint", accept: "application/pdf", multiple: true, hasPassword: false, hasPages: false, hasText: false, hasAngle: false, endpoint: "/api/tools/merge", extractText: false },
  { id: "split", icon: Scissors, nameKey: "split", descKey: "splitDesc", hintKey: "splitHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: true, hasText: false, hasAngle: false, endpoint: "/api/tools/split", extractText: false },
  { id: "rotate", icon: RotateCw, nameKey: "rotate", descKey: "rotateDesc", hintKey: "rotateHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: true, hasText: false, hasAngle: true, endpoint: "/api/tools/rotate", extractText: false },
  { id: "watermark", icon: Stamp, nameKey: "watermark", descKey: "watermarkDesc", hintKey: "watermarkHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: false, hasText: true, hasAngle: false, endpoint: "/api/tools/watermark", extractText: false },
  { id: "page-numbers", icon: ListOrdered, nameKey: "pageNumbers", descKey: "pageNumbersDesc", hintKey: "pageNumbersHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: false, hasText: false, hasAngle: false, endpoint: "/api/tools/page-numbers", extractText: false },
  { id: "delete-pages", icon: FileMinus, nameKey: "deletePages", descKey: "deletePagesDesc", hintKey: "deletePagesHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: true, hasText: false, hasAngle: false, endpoint: "/api/tools/delete-pages", extractText: false },
  { id: "extract-text", icon: FileText, nameKey: "extractText", descKey: "extractTextDesc", hintKey: "extractHint", accept: "application/pdf", multiple: false, hasPassword: false, hasPages: false, hasText: false, hasAngle: false, endpoint: "/api/tools/extract-text", extractText: true },
];

// Warm Confidence accent tiles (ember / pine / gold / espresso) — keeps the
// tools page on-brand instead of the generic rainbow-gradient PDF-tool look.
const TOOL_ACCENT: Record<ToolId, string> = {
  "image-to-pdf": "bg-ember text-cream",
  merge: "bg-pine text-cream",
  split: "bg-gold text-espresso",
  rotate: "bg-pine text-cream",
  watermark: "bg-gold text-espresso",
  "page-numbers": "bg-ember text-cream",
  "delete-pages": "bg-espresso text-cream",
  "extract-text": "bg-ember-shadow text-cream",
};

// ── Tool section state ─────────────────────────────────────────────────────────
interface ToolState {
  files: File[];
  password: string;
  pages: string;
  text: string;
  angle: string;
  loading: boolean;
  error: string;
  downloadUrl: string | null;
  downloadName: string;
  extractedText: string;
}

const initialTS = (): ToolState => ({
  files: [], password: "", pages: "", text: "", angle: "90", loading: false,
  error: "", downloadUrl: null, downloadName: "", extractedText: "",
});

// ── Upload Zone ────────────────────────────────────────────────────────────────
function UploadZone({ accept, multiple, files, onFiles, id }: {
  accept: string; multiple: boolean; files: File[];
  onFiles: (f: File[]) => void; id: ToolId;
}) {
  const lang = useLang();
  const tr = translations[lang].tools;
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  // For multi-file tools (merge, image→PDF) ACCUMULATE across picks/drops so you
  // can build the set up over several selections — de-duped by name+size — rather
  // than each new pick replacing the last. Single-file tools just take the first.
  const collect = useCallback((incoming: File[]): File[] => {
    if (!multiple) return [incoming[0]].filter(Boolean);
    const seen = new Set(files.map((f) => `${f.name}:${f.size}`));
    const added = incoming.filter((f) => !seen.has(`${f.name}:${f.size}`));
    return [...files, ...added];
  }, [multiple, files]);

  const drop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    onFiles(collect(Array.from(e.dataTransfer.files)));
  }, [collect, onFiles]);

  const change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(collect(Array.from(e.target.files ?? [])));
    e.target.value = "";
  }, [collect, onFiles]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)} onDrop={drop}
        onClick={() => ref.current?.click()}
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") ref.current?.click(); }}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-card-lg p-8 transition-all duration-200 cursor-pointer ${
          drag
            ? "border-ember bg-cream"
            : "border-border bg-sand-2 hover:border-text-muted hover:bg-cream"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-ember shadow-ember-hard flex items-center justify-center mb-4">
          <FileUp className="w-7 h-7 text-cream" />
        </div>
        <p className="text-sm font-semibold text-espresso">{tr.uploadHere as string}</p>
        <p className="text-xs text-text-muted mt-1">
          {accept.split(",").map((t) => t.trim().replace("image/", ".").replace("application/", ".")).join(", ")}
        </p>
        {multiple && (
          <p className="text-[11px] text-pine font-semibold mt-1.5">
            {files.length > 0
              ? (lang === "sw" ? `Faili ${files.length} zimeongezwa · bofya kuongeza zaidi` : `${files.length} added · click to add more`)
              : (lang === "sw" ? "Chagua au dondosha nyingi — zinajikusanya" : "Pick or drop several — they stack")}
          </p>
        )}
        <input ref={ref} type="file" accept={accept} multiple={multiple} onChange={change} className="hidden" />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 text-sm text-text-body bg-sand-2 rounded-card-lg px-4 py-2.5 border border-border">
              <FileText className="w-4 h-4 text-text-muted shrink-0" />
              <span className="truncate flex-1 font-medium">{f.name}</span>
              <span className="text-xs text-text-muted shrink-0 font-mono">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => onFiles(files.filter((_, j) => j !== i))}
                className="text-text-muted hover:text-ember transition-colors shrink-0 p-0.5"
                aria-label={`${lang === "sw" ? "Ondoa" : "Remove"} ${f.name}`}>
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Downscale + re-encode a photo so a phone-camera JPEG (routinely 3–8 MB) fits
// under the image→PDF upload cap. Longest side capped at 2200px (plenty for an
// A4 page), JPEG quality 0.82. Returns the original if anything fails or if the
// re-encode didn't actually shrink it. This unblocks the flagship Android
// "photograph a document → PDF" flow, which the raw 4 MB cap otherwise rejected.
async function compressImageForPdf(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 2200;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// ── Tool Section ───────────────────────────────────────────────────────────────
function ToolSection({ tool, visible }: { tool: ToolConfig; visible: boolean }) {
  const lang = useLang(); const tr = translations[lang].tools;
  const sw = lang === "sw";
  const Icon = tool.icon; const downloading = useRef(false);
  const router = useRouter();
  const [s, set] = useState<ToolState>(initialTS);

  if (!visible) return null;

  const setFiles = (f: File[]) => set((p) => ({ ...p, files: f, error: "", downloadUrl: null, extractedText: "" }));
  // Changing a setting after a run must clear the previous result, or the
  // Process button (gated on !downloadUrl && !extractedText) stays hidden and
  // the user can only re-download the STALE output — a dead-end. Reset the
  // result so a changed setting can be re-processed.
  const setPassword = (v: string) => set((p) => ({ ...p, password: v, downloadUrl: null, extractedText: "", error: "" }));
  const setPages = (v: string) => set((p) => ({ ...p, pages: v, downloadUrl: null, extractedText: "", error: "" }));
  const setText = (v: string) => set((p) => ({ ...p, text: v, downloadUrl: null, extractedText: "", error: "" }));
  const setAngle = (v: string) => set((p) => ({ ...p, angle: v, downloadUrl: null, extractedText: "", error: "" }));

  async function process() {
    if (!s.files.length) { set((p) => ({ ...p, error: sw ? "Tafadhali chagua faili angalau moja." : "Please select at least one file." })); return; }
    if (tool.hasPassword && !s.password) { set((p) => ({ ...p, error: sw ? "Tafadhali weka nywila." : "Please enter a password." })); return; }
    if (tool.hasPages && !s.pages && tool.id !== "rotate") { set((p) => ({ ...p, error: sw ? "Tafadhali weka nambari za kurasa." : "Please enter page numbers." })); return; }
    if (tool.hasText && !s.text.trim()) { set((p) => ({ ...p, error: sw ? "Tafadhali weka maandishi ya alama ya maji." : "Please enter the watermark text." })); return; }
    if (tool.id === "merge" && s.files.length < 2) { set((p) => ({ ...p, error: sw ? "Chagua faili za PDF angalau mbili." : "Select at least two PDF files." })); return; }

    set((p) => ({ ...p, loading: true, error: "", downloadUrl: null, extractedText: "" }));

    // For image→PDF, downscale/re-encode photos first so a typical Android
    // camera JPEG (3–8 MB) fits under the cap instead of being rejected outright.
    let files = s.files;
    if (tool.id === "image-to-pdf") {
      files = await Promise.all(s.files.map((f) => compressImageForPdf(f)));
    }

    // Reject oversized uploads before we even start — a huge file is the main
    // way a request appears to "hang" (long upload + slow processing). The cap
    // matches Vercel's ~4.5 MB request-body limit: anything larger is rejected
    // at the edge with a non-JSON 413 before our handler runs, which would
    // otherwise surface as an opaque "Something went wrong". We check BOTH each
    // file and the combined total (merge sends several files in one request).
    const tooBig = files.find((f) => f.size > MAX_PDF_UPLOAD_BYTES);
    if (tooBig) {
      set((p) => ({ ...p, loading: false, error: sw ? `"${tooBig.name}" ni kubwa mno (kiwango cha juu ${MAX_PDF_UPLOAD_MB} MB). Jaribu faili ndogo zaidi.` : `"${tooBig.name}" is too large (max ${MAX_PDF_UPLOAD_MB} MB). Try a smaller file.` }));
      return;
    }
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_PDF_UPLOAD_BYTES) {
      set((p) => ({ ...p, loading: false, error: sw ? `Jumla ya faili ni kubwa mno (kiwango cha juu ${MAX_PDF_UPLOAD_MB} MB kwa jumla). Tumia faili ndogo zaidi.` : `The files are too large in total (max ${MAX_PDF_UPLOAD_MB} MB combined). Use smaller files.` }));
      return;
    }

    // Hard client-side timeout so the spinner can NEVER spin forever — if the
    // server is slow or unreachable, we abort and show a recoverable error.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const fd = new FormData();
      for (const f of files) fd.append(tool.multiple ? "files" : "file", f);
      if (tool.hasPassword) fd.append("password", s.password);
      if (tool.hasPages) fd.append("pages", s.pages);
      if (tool.hasText) fd.append("text", s.text);
      if (tool.hasAngle) fd.append("angle", s.angle);

      const res = await fetch(tool.endpoint, { method: "POST", body: fd, signal: controller.signal });
      if (!res.ok) {
        let msg = sw ? "Kuna hitilafu imetokea." : "Something went wrong.";
        try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
        set((p) => ({ ...p, loading: false, error: msg }));
        return;
      }

      if (tool.extractText) {
        const json = await res.json();
        if (json.success) set((p) => ({ ...p, loading: false, extractedText: json.text ?? "" }));
        else set((p) => ({ ...p, loading: false, error: json.error ?? (sw ? "Imeshindwa kutoa maandishi." : "Failed to extract text.") }));
      } else {
        const blob = await res.blob();
        const disp = res.headers.get("Content-Disposition") ?? "";
        const m = disp.match(/filename="?([^"]+)"?/);
        const name = m ? m[1] : "output.pdf";
        set((p) => ({ ...p, loading: false, downloadUrl: URL.createObjectURL(blob), downloadName: name }));
      }
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? (sw ? "Hii ilichukua muda mrefu mno na muda ukaisha. Jaribu faili ndogo zaidi au jaribu tena." : "This took too long and timed out. Try a smaller file or try again.")
          : err instanceof Error
          ? err.message
          : (sw ? "Hitilafu ya mtandao." : "Network error.");
      set((p) => ({ ...p, loading: false, error: msg }));
    } finally {
      clearTimeout(timer);
    }
  }

  function download() {
    if (!s.downloadUrl || downloading.current) return;
    downloading.current = true;
    const a = document.createElement("a");
    a.href = s.downloadUrl; a.download = s.downloadName; a.style.display = "none";
    // Firefox ignores .click() on an anchor that isn't in the DOM.
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(s.downloadUrl!); downloading.current = false; }, 200);
  }

  return (
    <div id={`tool-${tool.id}`} className={`scroll-mt-24 rounded-card-lg border border-border bg-card overflow-hidden transition-all duration-500`}>
      {/* Header */}
      <div className="flex items-center gap-4 px-8 pt-8 pb-5">
        <div className={`w-14 h-14 rounded-2xl ${TOOL_ACCENT[tool.id]} shadow-ember-hard flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl text-espresso font-display font-extrabold">{tr[tool.nameKey] as string}</h3>
          <p className="text-sm text-text-body mt-0.5">{tr[tool.descKey] as string}</p>
        </div>
      </div>

      {/* Hint */}
      <p className="px-8 pb-5 text-xs text-text-muted italic flex items-center gap-1.5">
        <Icon name="magic" size={12} className="text-text-muted" /> {tr[tool.hintKey] as string}
      </p>

      {/* Upload */}
      <div className="px-8 pb-5">
        <UploadZone accept={tool.accept} multiple={tool.multiple} files={s.files} onFiles={setFiles} id={tool.id} />
      </div>

      {/* Settings */}
      <div className="px-8 pb-5 space-y-3">
        {tool.hasPassword && (
          <div>
            <label className="block text-sm font-semibold text-espresso mb-1.5">{tr.password as string}</label>
            <input type="password" value={s.password} onChange={(e) => setPassword(e.target.value)}
              placeholder={tr.password as string}
              className="w-full rounded-card-lg border border-border-input bg-sand-2 px-4 py-3 text-sm text-espresso placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all" />
          </div>
        )}
        {tool.hasAngle && (
          <div>
            <label className="block text-sm font-semibold text-espresso mb-1.5">{tr.angle as string}</label>
            <div className="flex gap-2">
              {["90", "180", "270"].map((a) => (
                <button key={a} type="button" onClick={() => setAngle(a)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-input-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                    s.angle === a
                      ? "border-ember bg-ember text-cream shadow-ember-hard"
                      : "border-input bg-sand-2 text-text-body hover:border-text-muted"
                  }`}>
                  <RotateCw className="w-3.5 h-3.5" /> {a}°
                </button>
              ))}
            </div>
          </div>
        )}
        {tool.hasText && (
          <div>
            <label className="block text-sm font-semibold text-espresso mb-1.5">{tr.watermarkText as string}</label>
            <input type="text" value={s.text} onChange={(e) => setText(e.target.value)} maxLength={60}
              placeholder={sw ? "RASIMU" : "DRAFT"}
              className="w-full rounded-card-lg border border-border-input bg-sand-2 px-4 py-3 text-sm text-espresso placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all" />
          </div>
        )}
        {tool.hasPages && (
          <div>
            <label className="block text-sm font-semibold text-espresso mb-1.5">{tr.pages as string}</label>
            <input type="text" value={s.pages} onChange={(e) => setPages(e.target.value)}
              placeholder={tr.pages as string}
              className="w-full rounded-card-lg border border-border-input bg-sand-2 px-4 py-3 text-sm text-espresso placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember transition-all font-mono" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-8 pb-8 space-y-3">
        {s.error && (
          <div role="alert" className="flex items-start gap-2.5 text-sm text-espresso bg-ember-tint border border-ember/20 rounded-card-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{s.error}</span>
          </div>
        )}

        {s.extractedText && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-espresso mb-1.5">{sw ? "Maandishi Yaliyotolewa" : "Extracted Text"}</label>
              <textarea readOnly value={s.extractedText} rows={8}
                className="w-full rounded-card-lg border border-border-input px-4 py-3 text-sm text-espresso bg-card font-mono leading-relaxed resize-y focus:outline-none" />
            </div>
            {/* Turn the extracted text into an editable CV instead of dead-ending
                here. Hand the text to /import-cv via sessionStorage so the user
                doesn't re-upload (survives the sign-in redirect if logged out). */}
            {s.extractedText.replace(/\s/g, "").length >= 40 && (
              <button
                onClick={() => {
                  // localStorage (not sessionStorage) so the text survives a
                  // magic-link sign-in that opens in a NEW tab. Timestamped so a
                  // stale handoff can be ignored on the other side.
                  try {
                    localStorage.setItem("th_pending_cv_text", JSON.stringify({ text: s.extractedText, ts: Date.now() }));
                  } catch {}
                  router.push("/import-cv");
                }}
                className="inline-flex items-center gap-2.5 bg-espresso text-cream font-semibold rounded-input-lg px-7 py-3 text-sm shadow-floating hover:bg-espresso-2 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
                <Wand2 className="w-4 h-4" /> {lang === "sw" ? "Igeuze kuwa CV inayohaririwa →" : "Turn this into an editable CV →"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {s.loading ? (
            <button disabled
              className="inline-flex items-center gap-2.5 bg-espresso-2 text-cream font-semibold rounded-xl px-7 py-3 text-sm cursor-not-allowed">
              <Loader2 className="w-4 h-4 animate-spin" /> {tr.processing as string}
            </button>
          ) : !s.extractedText && !s.downloadUrl ? (
            <button onClick={process}
              className="inline-flex items-center gap-2.5 bg-ember text-cream font-semibold rounded-input-lg px-7 py-3 text-sm shadow-ember-hard hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
              <ArrowDownToLine className="w-4 h-4" /> {tr.process as string}
            </button>
          ) : null}

          {s.downloadUrl && (
            <button onClick={download}
              className="inline-flex items-center gap-2.5 bg-pine text-cream font-semibold rounded-xl px-7 py-3 text-sm shadow-lg shadow-pine/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
              <CheckCircle className="w-4 h-4" /> {tr.download as string}
            </button>
          )}
        </div>

        {(s.downloadUrl || s.extractedText) && (
          <a href="/editor/cv/try"
            className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-espresso/[0.04] border border-border px-4 py-3 text-sm hover:border-ember/40 transition group/cta">
            <span className="text-text-body">
              {lang === "sw" ? "Unatuma maombi ya kazi? Tengeneza CV bila malipo →" : "Applying for a job? Build a CV — free →"}
            </span>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover/cta:text-ember shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Tool Card ──────────────────────────────────────────────────────────────────
function ToolCard({ tool, active, onTry, index }: {
  tool: ToolConfig; active: boolean; onTry: () => void; index: number;
}) {
  const lang = useLang(); const tr = translations[lang].tools;
  const Icon = tool.icon;

  return (
    <div
      className={`relative group rounded-card-lg border-2 transition-all duration-300 ${
        active
          ? "border-ember ring-4 ring-ember-tint shadow-card-hover scale-[1.02]"
          : "border-border bg-card hover:border-text-muted hover:shadow-card-hover hover:-translate-y-1"
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Warm Confidence top bar */}
      <div className="h-2 rounded-t-card-lg bg-ember" />

      <div className="p-7">
        <div className={`w-14 h-14 rounded-2xl ${TOOL_ACCENT[tool.id]} shadow-ember-hard flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-espresso mb-2">{tr[tool.nameKey] as string}</h3>
        <p className="text-sm text-text-body leading-relaxed mb-6 min-h-[40px]">{tr[tool.descKey] as string}</p>

        <div className="flex items-center gap-4">
          <button onClick={onTry}
            className={`inline-flex items-center gap-2 text-sm font-semibold rounded-input-lg px-5 py-2.5 transition-all duration-200 active:scale-[0.97] ${
              active
                ? "bg-espresso text-cream hover:bg-espresso-2 shadow-floating"
                : "bg-sand text-text-body hover:bg-espresso hover:text-cream"
            }`}>
            {tr.tryIt} <ChevronRight className="w-4 h-4" />
          </button>
          {/* Crawlable internal link to the tool's SEO landing page. */}
          <a href={`/tools/${tool.id}`}
            className="text-sm font-medium text-text-muted hover:text-ember transition-colors">
            {lang === "sw" ? "Pata maelezo" : "Learn more"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ToolsClient() {
  const lang = useLang(); const tr = translations[lang].tools;
  const [active, setActive] = useState<ToolId | null>(null);

  function scroll(id: ToolId) {
    setActive(id);
    setTimeout(() => {
      document.getElementById(`tool-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  // Deep-link support: /tools#tool-<id> (from the landing band + nav dropdown)
  // opens that tool directly and scrolls to it.
  useEffect(() => {
    const id = window.location.hash.replace(/^#tool-/, "");
    if (id && TOOLS.some((t) => t.id === id)) {
      setActive(id as ToolId);
      setTimeout(() => {
        document.getElementById(`tool-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, []);

  return (
    <div className="min-h-screen bg-sand text-espresso">
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="bg-espresso relative overflow-hidden py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, #F2A93B 0%, transparent 70%)" }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-ember-tint/10 border border-ember/20 rounded-pill px-4 py-1.5 mb-6">
            <Icon name="bolt" size={14} className="text-gold" />
            <span className="text-xs font-semibold text-cream/70 tracking-wider uppercase">
              {lang === "sw" ? "Bure kabisa" : "100% Free"}
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-cream mb-5 tracking-tight leading-tight">
            {tr.title}
          </h1>
          <p className="text-base md:text-lg text-cream/60 max-w-2xl mx-auto leading-relaxed">
            {tr.subtitle}
          </p>
        </div>
      </section>

      {/* ── TOOL CARDS ── */}
      <section className="relative -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} active={active === tool.id} onTry={() => scroll(tool.id)} index={i} />
          ))}
        </div>
      </section>

      {/* ── ACTIVE TOOL WORKSPACE ── */}
      {active && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 space-y-8">
          {TOOLS.map((tool) => (
            <ToolSection key={tool.id} tool={tool} visible={active === tool.id} />
          ))}
        </section>
      )}

      {/* ── IMPORT-CV BRIDGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-card-lg bg-espresso px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.10] pointer-events-none"
            style={{ background: "radial-gradient(circle, #F2A93B 0%, transparent 70%)" }} />
          <div className="relative flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-ember text-cream shadow-ember-hard flex items-center justify-center shrink-0">
              <Wand2 className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-ember/15 border border-ember/25 rounded-pill px-3 py-1 mb-2.5">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[11px] font-semibold text-cream/70 tracking-wider uppercase">
                  {lang === "sw" ? "Naifanya mimi" : "I do this one"}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-cream tracking-tight">
                {tr.importCv}
              </h2>
              <p className="text-sm text-cream/60 mt-1.5 max-w-xl leading-relaxed">{tr.importCvDesc}</p>
            </div>
          </div>
          <a href="/import-cv"
            className="relative shrink-0 inline-flex items-center gap-2.5 bg-ember text-cream font-semibold rounded-input-lg px-7 py-3.5 text-sm shadow-ember-hard hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
            <Wand2 className="w-4 h-4" /> {lang === "sw" ? "Ingiza CV yako" : "Import your CV"}
          </a>
        </div>
      </section>

      {/* ── ATS CHECKER BRIDGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
        <div className="relative overflow-hidden rounded-card-lg border border-border bg-card px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-pine text-cream shadow-ember-hard flex items-center justify-center shrink-0">
              <Icon name="target" size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-pine-tint border border-pine/20 rounded-pill px-3 py-1 mb-2.5">
                <Icon name="bolt" size={12} className="text-pine" />
                <span className="text-[11px] font-semibold text-pine tracking-wider uppercase">
                  {lang === "sw" ? "Bure · Papo hapo" : "Free · Instant"}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-espresso tracking-tight">
                {lang === "sw" ? "Je, CV yako inapita ATS?" : "Will your CV pass the ATS?"}
              </h2>
              <p className="text-sm text-text-body mt-1.5 max-w-xl leading-relaxed">
                {lang === "sw"
                  ? "Pakia CV yako upate alama ya papo hapo pamoja na marekebisho kamili ya kupita mifumo ya waajiri."
                  : "Upload your CV and get an instant ATS score with the exact fixes to pass recruiter screening software."}
              </p>
            </div>
          </div>
          <a href="/ats-checker"
            className="relative shrink-0 inline-flex items-center gap-2.5 bg-espresso text-cream font-semibold rounded-input-lg px-7 py-3.5 text-sm shadow-floating hover:bg-espresso-2 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
            <Icon name="target" size={16} /> {lang === "sw" ? "Kagua CV yako" : "Check my CV"}
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-4">
            {lang === "sw" ? "Tayari kuunda CV yako?" : "Ready to build your CV?"}
          </h2>
          <p className="text-text-body mb-8 max-w-md mx-auto">
            {lang === "sw"
              ? "Miundo ya kitaalamu inayopita vichujio vya waajiri, pamoja na msaidizi wa kazi."
              : "Professional ATS-optimized templates with a writing assistant."}
          </p>
          <a href="/templates"
            className="inline-flex items-center gap-2.5 bg-espresso hover:bg-espresso-2 text-cream font-semibold rounded-input-lg px-8 py-3.5 text-sm shadow-floating hover:shadow-card-hover transition-all duration-200 active:scale-[0.97]">
            <FileText className="w-4 h-4" /> {lang === "sw" ? "Ona Miundo" : "See the looks"}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
