import { cvHeadings } from "@/lib/i18n/cv-headings";
import type { Lang } from "@/lib/i18n/translations";

interface ExportOptions {
  /** Saved file name, including the .pdf extension. */
  filename: string;
  /**
   * html2canvas rasterization scale. Higher = sharper but larger file.
   * "standard" = 2 (default), "high" = 3.
   */
  scale?: number | "standard" | "high";
  orientation?: "portrait" | "landscape";
  /** jsPDF page format — "a4" or an explicit [width, height] in `unit`. */
  format?: string | [number, number];
  unit?: "px" | "mm" | "in";
  /**
   * Plain-text content of the document. When provided it is embedded as an
   * INVISIBLE text layer over the rasterized image, so the PDF is pixel-perfect
   * for humans AND machine-readable for ATS / recruiters (copy-paste, search,
   * résumé parsers). Without this a screenshot-style PDF parses as blank.
   */
  textLayer?: string;
}

/** How an exported PDF was delivered to the user's device. */
export type PdfDelivery = "downloaded" | "shared" | "opened" | "cancelled";

/**
 * iOS Safari (incl. iPadOS 13+, which reports a Macintosh UA — detectable via
 * touch capability). iOS ignores programmatic blob downloads, so it needs the
 * share-sheet / new-tab path instead of the anchor download.
 */
export function isIOSBrowser(ua: string, maxTouchPoints?: number): boolean {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+: "Mozilla/5.0 (Macintosh; …) AppleWebKit/… Safari/…" + touch.
  if (/Macintosh/.test(ua) && typeof maxTouchPoints === "number" && maxTouchPoints > 1 && /Safari/.test(ua)) {
    return true;
  }
  return false;
}

/** Pure decision: which delivery path does this platform get? */
export function resolvePdfDelivery(
  ua: string,
  canShareFiles: boolean,
  maxTouchPoints?: number,
): "share" | "open" | "download" {
  if (!isIOSBrowser(ua, maxTouchPoints)) return "download";
  return canShareFiles ? "share" : "open";
}

/**
 * html2canvas rasterization scale with a low-end-mobile OOM guard. The
 * default "standard" (2×) on a 794px-wide CV produces a ~1600px-wide canvas
 * that can be 8–16 MP for a multi-page document — enough to OOM / render
 * blank on a 2–3 GB Android. Reads navigator.deviceMemory (Chrome/Android)
 * and steps the scale down; never below 1.
 */
export function resolveExportScale(requested: number, ua: string, deviceMemory?: number): number {
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
  if (!mobile) return requested;
  if (typeof deviceMemory === "number" && deviceMemory > 0) {
    if (deviceMemory < 2) return Math.min(requested, 1);
    if (deviceMemory < 4) return Math.min(requested, 1.5);
  }
  return Math.min(requested, 2); // mobile cap — "high" (3) is desktop-only
}

/**
 * How many PDF pages a rasterized document needs.
 *
 * `slop` absorbs a fraction of a page of trailing content so a CV that fills
 * the page almost exactly — a full-height template sidebar, sub-pixel
 * rounding, or a source PAGE_H a hair taller than jsPDF's a4-in-px — doesn't
 * spill a few pixels onto a near-blank trailing page. Default 2% ≈ the bottom
 * margin; genuine second-page content (>2% over) still gets its page.
 */
export function computePageCount(
  canvasHeight: number,
  pxPerPage: number,
  slop = 0.02,
): number {
  if (!(pxPerPage > 0)) return 1;
  return Math.max(1, Math.ceil((canvasHeight - pxPerPage * slop) / pxPerPage));
}

/**
 * Finds a page-break row that no text crosses, so a multi-page slice never
 * shears a line of text in half. A row is "clean" when it looks the same as the
 * rows just above and below it across the full width — true for the blank gap
 * between text lines (and for solid template sidebars), false where glyph edges
 * cross. Searches from the ideal boundary UP to minCut; returns the ideal cut if
 * no clean row is found (a graceful fall back to fixed-height slicing).
 */
function findCleanCut(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  ideal: number,
  minCut: number,
): number {
  const GAP = 3;          // rows above/below to compare against
  const STEP = 3;         // sample every Nth column for speed
  const THRESHOLD = 16;   // per-sample luminance tolerance
  const lum = (y: number, x: number) => {
    const i = (y * width + x) * 4;
    return 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  };
  for (let y = ideal; y >= minCut; y--) {
    const above = Math.max(0, y - GAP);
    const below = Math.min(height - 1, y + GAP);
    let clean = true;
    for (let x = 0; x < width; x += STEP) {
      const base = lum(y, x);
      if (Math.abs(base - lum(above, x)) > THRESHOLD || Math.abs(base - lum(below, x)) > THRESHOLD) {
        clean = false;
        break;
      }
    }
    if (clean) return y;
  }
  return ideal;
}

/**
 * Rasterizes a DOM element and saves it as a PDF.
 *
 * For multi-page content (e.g. a CV or letter taller than one page) the image
 * is split across as many pages as needed instead of being squashed onto a
 * single page. Fixed-size formats (e.g. a business card) naturally produce one
 * page. html2canvas and jspdf are imported dynamically to keep them out of the
 * initial bundle.
 */
async function renderPdfDoc(el: HTMLElement, opts: ExportOptions): Promise<any> {
  const [html2canvas, jsPDF] = await Promise.all([
    import("html2canvas").then((m) => m.default),
    import("jspdf").then((m) => m.default),
  ]);

  const {
    scale: scaleOpt = "standard",
    orientation = "portrait",
    format = "a4",
    unit = "px",
  } = opts;

  const scale = resolveExportScale(
    scaleOpt === "standard" ? 2 : scaleOpt === "high" ? 3 : scaleOpt,
    typeof navigator !== "undefined" ? navigator.userAgent : "",
    typeof navigator !== "undefined" ? (navigator as { deviceMemory?: number }).deviceMemory : undefined,
  );

  // html2canvas can't render elements inside display:none parents.
  // Walk up the tree, temporarily un-hide any hidden ancestors.
  const hidden: Array<{ node: HTMLElement; prev: string }> = [];
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    if (window.getComputedStyle(node).display === "none") {
      hidden.push({ node, prev: node.style.display });
      node.style.setProperty("display", node.tagName === "DIV" ? "block" : "flex", "important");
    }
    node = node.parentElement;
  }

  // Editors render the preview element shrunk via a CSS transform (scale < 1) so
  // the A4 fits the viewport. html2canvas rasterizes the element AT ITS DISPLAYED
  // size, so capturing the scaled node then upscaling it into the PDF produces a
  // blurry result. Neutralize the transform for the capture so it rasterizes at
  // the full 794px width, then restore it.
  const prevTransform = el.style.transform;
  const prevOrigin = el.style.transformOrigin;
  el.style.transform = "none";
  el.style.transformOrigin = "top left";

  // Wait for webfonts to finish loading before rasterizing. Without this a cold
  // export (fired right after the editor mounts, fonts still swapping in) can
  // capture fallback glyphs, so the PDF's typography differs from the on-screen
  // preview. Best-effort — guard for environments without the Font Loading API.
  try {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch { /* ignore — proceed with whatever is loaded */ }

  let canvas: HTMLCanvasElement;
  try {
    try {
      canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
    } catch (err) {
      // OOM guard: if the first rasterization throws (large canvas on a
      // low-end device), retry at scale 1 rather than failing the export.
      if (scale > 1) {
        canvas = await html2canvas(el, {
          scale: 1,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });
      } else {
        throw err;
      }
    }
  } finally {
    el.style.transform = prevTransform;
    el.style.transformOrigin = prevOrigin;
    for (const { node: n, prev } of hidden) {
      n.style.display = prev;
    }
  }

  const pdf = new jsPDF({ orientation, unit, format });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // How many source-canvas pixels map to one PDF page of height.
  const pxPerPage = (canvas.width * pageH) / pageW;

  // Grab the raster once so we can nudge each page break to a "clean" row (one
  // with no text crossing it) instead of shearing a line of text in half at a
  // fixed pixel boundary. Best-effort: if the pixels can't be read (tainted
  // canvas) we fall back to the old fixed-height slicing.
  let pixels: Uint8ClampedArray | null = null;
  try {
    pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data ?? null;
  } catch {
    pixels = null;
  }

  // Encode ONE page slice at a time as JPEG rather than embedding a single
  // full-height PNG on every page. Two big wins over the old approach:
  //  - JPEG (quality 0.95) is ~5–10× smaller than lossless PNG for this content.
  //  - Each page carries only its own slice, so an N-page CV is no longer N
  //    copies of the whole image. Together this took site CVs from ~13 MB to
  //    well under 1 MB (also keeps them under Vercel's ~4.5 MB upload limit).
  // Fix the page count at the minimum up front. Clean-cut nudging only ever
  // moves a break UP, so without this a nudged break could push a few leftover
  // pixels onto an extra, nearly-blank trailing page. We cap at pageCount and
  // only nudge when there's enough slack to still fit the rest of the content in
  // the remaining pages (else we keep the hard cut for that break).
  const pageCount = computePageCount(canvas.height, pxPerPage);
  let sliceTop = 0;
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const isLast = pageIndex === pageCount - 1;
    let sliceBottom = isLast ? canvas.height : Math.min(canvas.height, sliceTop + pxPerPage);
    if (!isLast && pixels) {
      // Nudge the cut UP to the nearest text-free row within a small window, but
      // never below what's needed to fit the remaining content in the remaining
      // pages, and never above the page mid-point. If no clean row is found the
      // ideal (hard) cut is kept — identical to the previous behaviour.
      const ideal = Math.floor(sliceBottom);
      const remainingAfter = pageCount - 1 - pageIndex;
      const mustReach = Math.ceil(canvas.height - remainingAfter * pxPerPage);
      const minCut = Math.max(
        sliceTop + Math.floor(pxPerPage * 0.5),
        ideal - Math.floor(pxPerPage * 0.14),
        mustReach,
      );
      if (minCut <= ideal) {
        sliceBottom = findCleanCut(pixels, canvas.width, canvas.height, ideal, minCut);
      }
    }
    const sliceH = sliceBottom - sliceTop;
    if (sliceH <= 0) break;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.ceil(sliceH);
    const ctx = pageCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(canvas, 0, sliceTop, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    }
    const sliceData = pageCanvas.toDataURL("image/jpeg", 0.95);
    const drawH = (sliceH * pageW) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, "JPEG", 0, 0, pageW, drawH);
    sliceTop = sliceBottom;
  }

  // Invisible, machine-readable text layer for ATS / recruiters. Rendered in
  // PDF text mode 3 (invisible), so it sits under the image without altering the
  // look but is fully extractable/searchable. Paginated across the document's
  // pages: jsPDF does NOT wrap text onto new pages, and many résumé parsers
  // respect each page's crop box — so on a 2+ page CV, text drawn past page 1's
  // height would be dropped by the parser. We split it so nothing overflows.
  if (opts.textLayer && opts.textLayer.trim()) {
    pdf.setTextColor(0, 0, 0);
    const LHF = 1.15;
    const margin = pageW * 0.06;
    const pageCount = pdf.getNumberOfPages();
    const usableH = pageH - margin * 2;

    // Pick the largest font (≤9pt) at which the whole text layer fits within the
    // document's existing pages. This guarantees NOTHING is dropped: a very dense
    // CV shrinks the invisible text rather than silently losing trailing skills/
    // certifications past the last page's crop box. (Invisible layer, so the
    // smaller size has no visual effect — the image is what humans see.)
    let fontSize = 9;
    let lines = pdf.splitTextToSize(opts.textLayer.trim(), pageW - margin * 2);
    let linesPerPage = 1;
    for (; fontSize >= 4; fontSize -= 0.5) {
      pdf.setFontSize(fontSize);
      lines = pdf.splitTextToSize(opts.textLayer.trim(), pageW - margin * 2);
      const lineH = pdf.getTextDimensions("Ay").h * LHF;
      linesPerPage = Math.max(1, Math.floor(usableH / lineH));
      if (lines.length <= linesPerPage * pageCount) break;
    }

    for (let p = 0; p < pageCount; p++) {
      const chunk = lines.slice(p * linesPerPage, (p + 1) * linesPerPage);
      if (chunk.length === 0) break;
      pdf.setPage(p + 1);
      pdf.text(chunk, margin, margin, {
        renderingMode: "invisible",
        baseline: "top",
        lineHeightFactor: LHF,
      });
    }
  }

  return pdf;
}

/**
 * Rasterize an element to a PDF and deliver it the way the platform requires.
 * Returns how it was delivered:
 *  - Android / desktop → blob download (kept alive long enough for mobile
 *    Chrome to fetch it — jsPDF's own save() revokes too early).
 *  - iOS Safari (Web Share files supported) → OS share sheet ("Save to
 *    Files", AirDrop, Mail…). iOS ignores programmatic blob downloads, so the
 *    anchor-click path leaves the user unable to save their CV.
 *  - iOS Safari without file-share → the PDF opens in a new tab, where the
 *    browser's own share/save works.
 * A user cancelling the native sheet returns "cancelled" (a no-op, not an
 * error) — callers should not treat it as a failure.
 */
export async function exportElementToPdf(el: HTMLElement, opts: ExportOptions): Promise<PdfDelivery> {
  const pdf = await renderPdfDoc(el, opts);
  const blob = pdf.output("blob") as Blob;
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0;
  const nav = navigator as unknown as { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
  const canShareFiles = !!(nav.canShare && nav.share && nav.canShare({ files: [new File([blob], opts.filename, { type: "application/pdf" })] }));

  const delivery = resolvePdfDelivery(ua, canShareFiles, maxTouchPoints);
  if (delivery === "share") {
    try {
      await nav.share!({ files: [new File([blob], opts.filename, { type: "application/pdf" })], title: opts.filename });
      return "shared";
    } catch (err) {
      // User dismissed the sheet — that's a no-op, not an error.
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Any other failure (activation lost, permission) → open-in-new-tab.
      openBlobInNewTab(blob, opts.filename);
      return "opened";
    }
  }
  if (delivery === "open") {
    openBlobInNewTab(blob, opts.filename);
    return "opened";
  }
  // Use our own blob download rather than jsPDF's pdf.save(): jsPDF revokes the
  // blob URL almost immediately, which on Android Chrome cancels the download
  // before it starts — the button flips to "Downloaded" but no file lands.
  // triggerBlobDownload keeps the URL alive long enough for mobile to fetch it.
  triggerBlobDownload(blob, opts.filename);
  return "downloaded";
}

/**
 * Opens a PDF blob in a new tab (iOS Safari fallback when file-sharing is
 * unavailable) so the user can save/share via the browser's own UI. If the
 * popup is blocked, falls back to the anchor-download path.
 */
export function openBlobInNewTab(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    triggerBlobDownload(blob, filename);
    return;
  }
  // Revoke long after the tab has had time to load the blob URL.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Rasterize an element to a PDF and return it as a Blob (for Web Share, upload, etc.). */
export async function renderElementToPdfBlob(el: HTMLElement, opts: ExportOptions): Promise<Blob> {
  const pdf = await renderPdfDoc(el, opts);
  return pdf.output("blob") as Blob;
}

/**
 * Rasterize an element to a PDF and open the OS share sheet with the file
 * attached (WhatsApp / Telegram / Gmail / Drive…) via the Web Share API. Where
 * file-sharing isn't supported (most desktops) it falls back to a reliable
 * download. Returns how it was delivered. A user cancelling the native sheet
 * throws a DOMException with name "AbortError" — callers should treat that as a
 * no-op, not an error.
 */
export async function sharePdf(
  el: HTMLElement,
  opts: ExportOptions & { shareTitle?: string; shareText?: string },
): Promise<"shared" | "downloaded"> {
  const blob = await renderElementToPdfBlob(el, opts);
  const file = new File([blob], opts.filename, { type: "application/pdf" });
  const nav = navigator as unknown as { canShare?: (d: unknown) => boolean; share?: (d: unknown) => Promise<void> };
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title: opts.shareTitle, text: opts.shareText });
    return "shared";
  }
  triggerBlobDownload(blob, opts.filename);
  return "downloaded";
}

export interface CvTextInput {
  personal: { fullName?: string; jobTitle?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
  summary?: string;
  experience?: Array<{ position?: string; company?: string; location?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
  education?: Array<{ degree?: string; field?: string; institution?: string; startDate?: string; endDate?: string; grade?: string }>;
  skills?: Array<{ name?: string }>;
  languages?: Array<{ name?: string; proficiency?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  /** Section order on the page: summary, experience, PROJECTS, education, … */
  projects?: Array<{ name?: string; role?: string; date?: string; description?: string; url?: string }>;
  /** Last section on the page, after certifications. */
  referees?: Array<{ name?: string; title?: string; company?: string; email?: string; phone?: string }>;
  hobbies?: string;
  /** Sections the user hid in the editor. They are not on the page, so they must
   *  not be in the machine-readable copy either. */
  hiddenSections?: string[];
}

/**
 * Builds a clean, ATS-friendly plain-text rendering of a CV. Shared by the .txt
 * export and the invisible PDF text layer so both stay in sync.
 *
 * `lang` makes the machine copy match the human copy: on a Swahili CV the
 * headings are the same Swahili headings the template renders (MUHTASARI,
 * UZOEFU WA KAZI, …), so an ATS does not receive an English document describing
 * a Swahili page. English output is byte-identical to before.
 */
export function buildCvText(cv: CvTextInput, lang: Lang = "en"): string {
  const lines: string[] = [];
  const { personal } = cv;
  const sw = lang === "sw";
  const H = cvHeadings(lang);
  const hidden = (key: string) => (cv.hiddenSections ?? []).includes(key);

  // Join only the non-empty parts, so blank fields never leave stray "|"
  // separators, empty "start – end" date ranges, or literal "undefined" in the
  // .txt export and the invisible ATS text layer (mirrors lib/docx.ts).
  const join = (parts: Array<string | undefined>, sep: string) =>
    parts.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);
  const period = (start?: string, end?: string, current?: boolean) => {
    const to = current ? (sw ? "Sasa" : "Present") : (end ?? "").trim();
    return join([start, to], " – ");
  };

  if (personal.fullName) lines.push(personal.fullName);
  if (personal.jobTitle) lines.push(personal.jobTitle);

  const contacts = join([personal.email, personal.phone, personal.location, personal.linkedin, personal.website], " | ");
  if (contacts) lines.push(contacts);

  if (cv.summary?.trim() && !hidden("summary")) {
    lines.push("", (sw ? H.summary : "Professional Summary").toUpperCase(), cv.summary.trim());
  }

  if (cv.experience?.length && !hidden("experience")) {
    lines.push("", (sw ? H.experience : "Experience").toUpperCase());
    for (const exp of cv.experience) {
      const org = join([exp.company, exp.location], ", ");
      const header = join([exp.position, org, period(exp.startDate, exp.endDate, exp.current)], " | ");
      if (header) lines.push(header);
      if (exp.description?.trim()) lines.push(exp.description.trim());
      lines.push("");
    }
  }

  // Projects and referees were visible in the exported PDF but were never
  // written into the text layer, so no ATS could see a candidate's projects or
  // their referees at all (docs/CV_DESIGN_AUDIT.md §3).
  if (cv.projects?.length && !hidden("projects")) {
    lines.push("", (sw ? H.projects : "Projects").toUpperCase());
    for (const p of cv.projects) {
      const head = join([p.name, p.role, p.date], " | ");
      if (head) lines.push(head);
      if (p.description?.trim()) lines.push(p.description.trim());
      if (p.url?.trim()) lines.push(p.url.trim());
    }
  }

  if (cv.education?.length && !hidden("education")) {
    lines.push("", (sw ? H.education : "Education").toUpperCase());
    for (const ed of cv.education) {
      const degree = join([ed.degree, ed.field], " ");
      lines.push(join([degree, ed.institution, period(ed.startDate, ed.endDate), ed.grade], " | "));
    }
  }

  if (cv.skills?.length && !hidden("skills")) {
    const skills = join(cv.skills.map((s) => s.name), ", ");
    if (skills) lines.push("", (sw ? H.skills : "Skills").toUpperCase(), skills);
  }

  if (cv.languages?.length && !hidden("languages")) {
    const langs = cv.languages
      .map((l) => (l.proficiency ? `${(l.name ?? "").trim()} (${l.proficiency})` : (l.name ?? "").trim()))
      .filter((s) => s.trim())
      .join(", ");
    if (langs) lines.push("", (sw ? H.languages : "Languages").toUpperCase(), langs);
  }

  if (cv.certifications?.length && !hidden("certifications")) {
    lines.push("", (sw ? H.certifications : "Certifications").toUpperCase());
    for (const c of cv.certifications) {
      const cert = join([c.name, c.issuer, c.date], " | ");
      if (cert) lines.push(cert);
    }
  }

  if (cv.referees?.length && !hidden("referees")) {
    lines.push("", (sw ? H.referees : "Referees").toUpperCase());
    for (const r of cv.referees) {
      const head = join([r.name, join([r.title, r.company], ", ")], " | ");
      if (head) lines.push(head);
      const contact = join([r.email, r.phone], " | ");
      if (contact) lines.push(contact);
    }
  }

  if (cv.hobbies?.trim() && !hidden("hobbies")) {
    lines.push("", (sw ? H.interests : "Interests").toUpperCase(), cv.hobbies.trim());
  }

  return lines.join("\n");
}

/**
 * Exports CV data as a plain-text .txt file so ATS systems can parse the content.
 */
export function exportCvToText(cv: CvTextInput, filename: string, lang: Lang = "en"): void {
  const blob = new Blob([buildCvText(cv, lang)], { type: "text/plain;charset=utf-8" });
  triggerBlobDownload(blob, filename);
}

/**
 * Reliable cross-browser blob download. Firefox ignores `.click()` on an anchor
 * that isn't in the DOM, and revoking the object URL synchronously can cancel
 * the download before the browser reads the blob — so append, click, then
 * revoke on the next tick.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Revoke well AFTER the browser has started the download. Revoking on the next
  // tick (setTimeout 0) races the download on mobile Chrome and silently cancels
  // it — the click reports success but no file is written. A few seconds is safe.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 15000);
}
