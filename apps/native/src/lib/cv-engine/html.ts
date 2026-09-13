/**
 * HTML helpers for the native CV engine.
 *
 * Everything the engine emits is a plain HTML string from here, so escaping and
 * style serialisation live in exactly one place — templates never hand-roll
 * either. Mirrors the escaping used by the original cv-html.ts (which stays the
 * source of truth for the legacy six templates).
 */

export function esc(text: unknown): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type StyleValue = string | number | undefined | null | false;

/**
 * CSS properties whose numeric values are unitless. Without this, `flex: 1`
 * became `flex:1px` and `lineHeight: 1.5` became `line-height:1.5px` — a silent
 * layout break that only shows up on the rendered page.
 */
const UNITLESS = new Set([
  "line-height",
  "opacity",
  "flex",
  "flex-grow",
  "flex-shrink",
  "font-weight",
  "z-index",
  "order",
  "aspect-ratio",
  "-webkit-line-clamp",
  "-webkit-box-orient",
  "column-count",
  "zoom",
]);

/** Serialise a React-style style object into an inline CSS declaration list. */
export function css(style: Record<string, StyleValue>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null || value === false || value === "") continue;
    const prop = key.startsWith("--")
      ? key
      : key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    const unitless = UNITLESS.has(prop);
    parts.push(
      `${prop}:${typeof value === "number" && value !== 0 && !unitless ? value + "px" : value}`,
    );
  }
  return parts.join(";");
}

/** An element with inline styles: `el("div", { ... }, children)`. */
export function el(tag: string, style: Record<string, StyleValue>, children = ""): string {
  const s = css(style);
  return `<${tag}${s ? ` style="${s}"` : ""}>${children}</${tag}>`;
}

/** Text node with an inline style, escaped. */
export function tx(text: unknown, style: Record<string, StyleValue> = {}): string {
  return el("span", style, esc(text));
}

/** Join parts, dropping empties — mirrors the web's `{cond && <X/>}` patterns. */
export function join(parts: Array<string | false | undefined | null>, sep = ""): string {
  return parts.filter(Boolean).join(sep);
}

/** `opacity`-safe colour helper: `#RRGGBB` + hex alpha, e.g. tint("#DA4A1C", "1f"). */
export function tint(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex + alpha : hex;
}

export function withAlpha(color: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return color + a;
}

/**
 * `2021-04` → `Apr 2021`; anything unparseable is returned untouched.
 *
 * Deliberately tolerant of a single-digit month ("2022-2"): that is what real
 * rows contain — the app's own date pickers write unpadded months — and the
 * strict two-digit form used to fall through and print "2022-2" on the page.
 * Mirrors fmtDate in apps/web/components/templates/format.ts.
 */
export function fmtDate(value: string | undefined, lang: Lang = "en"): string {
  if (!value) return "";
  const parts = String(value).trim().split("-");
  const y = parts[0];
  const m = parts[1];
  if (!m || !/^\d{1,2}$/.test(m)) return y || String(value);
  const idx = Number(m) - 1;
  if (idx < 0 || idx > 11) return String(value);
  const months = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    sw: ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"],
  }[lang === "sw" ? "sw" : "en"];
  return `${months[idx]} ${y}`;
}

export function dateRange(
  start: string | undefined,
  end: string | undefined,
  present: string,
  lang: Lang = "en",
): string {
  const a = fmtDate(start, lang);
  const b = end ? fmtDate(end, lang) : present;
  if (!a && !b) return "";
  if (!a) return b;
  return `${a} – ${b}`;
}

import type { Lang } from "./types";
