/**
 * One fit-to-frame mechanism for every WebView preview of a CV page.
 *
 * The page is authored at a fixed 794px so the on-screen preview and the printed
 * PDF are the same pixels. A WebView that is 137dp wide (a gallery cell) or
 * 396dp wide (the full-screen preview) has to show that 794px page SCALED TO
 * ITS WIDTH — and until this file existed, nothing in the app did that scaling.
 * The only thing standing between the user and a left-hand slice of an
 * unscaled 794px page was the WebView's own handling of
 * `<meta name="viewport" content="width=794">`, i.e. Android's
 * `WebSettings.useWideViewPort` / `loadWithOverviewMode` defaults — behaviour the
 * app never set and cannot rely on (react-native-webview does not set either).
 *
 * `fitSheet()` computes the scale here, in code we control, and wraps the page
 * in a box of exactly that size:
 *
 *   fit box  = frameW × round(1123 × scale)     (what the WebView shows)
 *   scale    = frameW / 794
 *   inner    = the page at 794px, transform-origin top left
 *
 * The injected viewport meta names the SAME width, so both WebView modes agree:
 * with the wide viewport honoured the layout width is frameW and the initial
 * scale is 1; with it ignored the layout width is the WebView's own width in CSS
 * px, which is frameW. Either way the wrapper lands the page exactly on the
 * frame and nothing is clipped on the left.
 *
 * Overflow is deliberately VISIBLE (no clipping): a CV that runs past one A4
 * page stays reachable by scrolling instead of being cut at the frame's height.
 *
 * The print path (expo-print) must NOT use this — a transform would shrink the
 * exported PDF. Callers opt in by passing a width.
 */

export const PAGE_W = 794;
export const PAGE_H = 1123;

/** No floor: the frame is authoritative. A thumbnail is MEANT to be tiny, and a
 *  "minimum scale" larger than the frame is the clipping bug in disguise (a
 *  0.28 floor would draw a 222px sheet inside a 137dp gallery cell). Mirrors
 *  MIN_FIT_SCALE in apps/web/components/templates/fit-frame.tsx so both apps
 *  render the same sheet at the same size for the same frame. */
export const MIN_FIT_SCALE = 0;

/** The scale that fits the 794px page into `width` CSS px. Pure + total. */
export function fitScaleFor(width: number, min: number = MIN_FIT_SCALE): number {
  if (!Number.isFinite(width) || width <= 0) return 1;
  return Math.max(min, Math.min(1, width / PAGE_W));
}

export interface FitSheetParts {
  /** The `<meta name="viewport">` element for the flat width. */
  viewport: string;
  /** CSS for the fit box + page wrapper (append to the page's own <style>). */
  css: string;
  /** The wrapped body. */
  body: string;
}

/** Wrap `body` (a rendered CV page) so it fits a WebView `width` CSS px wide. */
export function fitSheet(body: string, width: number): FitSheetParts {
  const w = Math.max(1, Math.round(width));
  const scale = fitScaleFor(w);
  const h = Math.max(1, Math.round(PAGE_H * scale));
  return {
    viewport: `<meta name="viewport" content="width=${w}, initial-scale=1">`,
    css: `
  #cv-fit { width: ${w}px; min-height: ${h}px; background: #fff; }
  #cv-page { width: ${PAGE_W}px; min-height: ${PAGE_H}px; transform: scale(${scale}); transform-origin: top left; }
`,
    body: `<div id="cv-fit"><div id="cv-page">${body}</div></div>`,
  };
}
