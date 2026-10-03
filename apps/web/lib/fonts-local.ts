/**
 * Self-hosted faces. No build ever calls Google.
 *
 * Why this file exists: the production build failed on a clean machine with
 *
 *     An error occurred in `next/font`. TypeError: Cannot read properties of null (reading '1')
 *         at @next/font/dist/google/loader.js:112
 *
 * `next/font/google` fetches from Google at build time. Locally the files were already in `.next`, so
 * the request was never made and the build looked green — a cached green, which is why the failure
 * reached production while `npm run build` passed on this machine.
 *
 * Self-hosting is also the better answer for the product: the app is used on cheap Android phones in
 * Tanzania, and a font served from our own origin is faster than one fetched from a third party, and
 * it keeps working where Google Fonts is slow or blocked.
 *
 * The four files in `app/fonts/` are the variable originals (latin subset), so one file covers every
 * weight the design uses instead of twenty static instances. Face names, CSS variables and display
 * behaviour are unchanged from the Google config they replace.
 */
import localFont from "next/font/local";

export const fontDisplay = localFont({
  src: [{ path: "../app/fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-display",
  display: "optional",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const fontBody = localFont({
  src: [{ path: "../app/fonts/hanken-grotesk-latin.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-body",
  display: "optional",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const fontCv = localFont({
  src: [{ path: "../app/fonts/inter-latin.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const fontMono = localFont({
  src: [{ path: "../app/fonts/jetbrains-mono-latin.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-mono",
  display: "optional",
  preload: true,
  adjustFontFallback: "Arial",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
