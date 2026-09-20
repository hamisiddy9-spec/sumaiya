/**
 * Turns a NativeTemplate + a CV into one self-contained HTML document.
 *
 * This is the only place that knows how the three pieces fit together:
 *   metadata (templates/<id>.ts)  →  tokens + layout config
 *   CVData (native shape)         →  EngineView (web shape)
 *   layout (layouts.ts)           →  HTML
 *
 * The output is deliberately dependency-free: one <style> block, inline styles,
 * no external fonts, no network images. That is what makes it usable by both
 * expo-print and the WebView preview without a build step or an asset bundle.
 */

import type { CV, CVData } from "@sumaiya/types";
import type { NativeTemplate } from "../templates/types";
import type { Lang } from "./types";
import { makeTokens, type DensityMode, type DesignTokens } from "./tokens";
import { toEngineView, type EngineView } from "./view";
import { fitSheet } from "./fit";
import {
  accentBandLayout,
  headerLayout,
  minimalLayout,
  sidebarLayout,
  twoColumnLayout,
  PAGE_W,
} from "./layouts";

export const DEFAULT_ACCENT = "#DA4A1C";

/** The sentinel the generator writes wherever the web used `primaryColor`. */
const ACCENT = "@accent";

/** Deep-replace the `@accent` sentinel. Templates are data, so this is enough —
 *  no template needs to compute a colour at render time. */
function resolveAccent<T>(value: T, accent: string): T {
  if (value === ACCENT) return accent as unknown as T;
  if (Array.isArray(value)) return value.map((v) => resolveAccent(v, accent)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveAccent(v, accent);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Web templates receive a `fontFamily` prop from the editor and pass it straight
 * to makeTokens. Those values name web fonts ("Inter", "Playfair Display") that
 * are not installed on a phone and must never be fetched — so they are mapped
 * onto the closest system stack. The design intent (serif vs sans vs mono)
 * survives; the specific typeface does not, and cannot, offline.
 */
export function systemFontStack(requested?: string): string {
  const f = (requested ?? "").toLowerCase();
  if (!f) return "-apple-system, 'Helvetica Neue', Arial, sans-serif";
  if (/mono|courier|consol|menlo/.test(f)) {
    return "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  }
  if (
    /serif|georgia|times|garamond|baskerville|bodoni|playfair|didot|caslon|minion|cambria|palatino|libre|merriweather|lora|crimson|spectral|source serif/.test(
      f,
    ) &&
    !/sans-serif/.test(f)
  ) {
    return "Georgia, 'Times New Roman', Times, serif";
  }
  return "-apple-system, 'Helvetica Neue', Arial, sans-serif";
}

export interface RenderOptions {
  accent?: string;
  fontFamily?: string;
  lang?: Lang;
  /** User-chosen density, when the app grows that control. */
  density?: DensityMode;
  /**
   * Display width in CSS px for a WebView preview. When set, the page is wrapped
   * so it is SCALED TO FIT that width (see fit.ts) instead of leaving the fit to
   * the WebView's own viewport handling. Omit for print/PDF export.
   */
  fitWidth?: number;
}

/** Which layout string the template declares → the function that draws it. */
const LAYOUTS: Record<
  string,
  (
    view: EngineView,
    tokens: DesignTokens,
    config: never,
    lang: Lang,
  ) => string
> = {
  SidebarLayout: sidebarLayout as never,
  HeaderLayout: headerLayout as never,
  MinimalLayout: minimalLayout as never,
  TwoColumnLayout: twoColumnLayout as never,
  AccentBandLayout: accentBandLayout as never,
};

export function hasRenderer(tpl: NativeTemplate): boolean {
  return !tpl.bespoke && tpl.layout in LAYOUTS;
}

/** The accent a template uses when the caller passes none. */
export function templateAccent(tpl: NativeTemplate, requested?: string): string {
  if (requested && /^#[0-9a-fA-F]{6}$/.test(requested)) return requested;
  if (/^#[0-9a-fA-F]{6}$/.test(tpl.previewColor ?? "")) return tpl.previewColor;
  return DEFAULT_ACCENT;
}

/**
 * Renders a template to a complete HTML document.
 * Throws if the template has no engine renderer — callers should check
 * `hasRenderer` first and fall back to the legacy six.
 */
export function renderTemplateHtml(
  tpl: NativeTemplate,
  cv: CV,
  opts: RenderOptions = {},
): string {
  const lang: Lang = opts.lang === "sw" ? "sw" : "en";
  const accent = templateAccent(tpl, opts.accent);
  const fontFamily = systemFontStack(opts.fontFamily);

  const overrides = resolveAccent(tpl.tokenOverrides ?? {}, accent);
  const density: DensityMode = opts.density ?? tpl.personality?.density ?? "normal";
  const tokens = makeTokens(accent, fontFamily, overrides, density);

  const view = toEngineView((cv?.data ?? {}) as CVData);
  const config = resolveAccent(tpl.config ?? {}, accent);

  const draw = LAYOUTS[tpl.layout];
  if (!draw) throw new Error(`No engine renderer for layout "${tpl.layout}" (template "${tpl.id}")`);

  const body = draw(view, tokens, config as never, lang);

  // Preview path only: our own scale-to-frame wrapper, so a WebView of any width
  // shows the whole sheet (see fit.ts for why the viewport meta alone was not a
  // guarantee). Omitting fitWidth keeps this byte-identical for expo-print.
  const fit = opts.fitWidth && opts.fitWidth > 0 ? fitSheet(body, opts.fitWidth) : null;

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8">${fit ? fit.viewport : `<meta name="viewport" content="width=${PAGE_W}">`}
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { color: ${tokens.color.text}; }
  p { margin: 0; }${fit ? fit.css : ""}
</style></head><body>${fit ? fit.body : body}</body></html>`;
}
