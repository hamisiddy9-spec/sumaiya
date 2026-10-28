import localFont from "next/font/local";

// Self-hosted copies of the four faces (latin subset, variable woff2, from
// Google Fonts). They used to come from next/font/google, which fetches
// fonts.googleapis.com at build time; that fetch failed intermittently on
// Vercel ("An error occurred in `next/font`") and took whole production deploys
// down with it. Local files make the build independent of Google.
//
// display: "optional" for the UI faces: if the font hasn't arrived within the
// browser's ~100ms window the session keeps the size-adjusted fallback — no
// late swap, no layout shift. Inter (the face every CV template is typeset in)
// uses "swap": a CV's typography is the product, and the PDF exporter awaits
// document.fonts.ready before rasterizing, so a swap guarantees the exported
// document is set in the real face.

export const fontDisplay = localFont({
  src: "./bricolage-grotesque.woff2",
  weight: "600 800",
  variable: "--font-display",
  display: "optional",
  adjustFontFallback: "Arial",
});

export const fontBody = localFont({
  src: "./hanken-grotesk.woff2",
  weight: "400 800",
  variable: "--font-body",
  display: "optional",
  adjustFontFallback: "Arial",
});

export const fontCv = localFont({
  src: "./inter.woff2",
  weight: "400 800",
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const fontMono = localFont({
  src: "./jetbrains-mono.woff2",
  weight: "400 700",
  variable: "--font-mono",
  display: "optional",
  adjustFontFallback: "Arial",
});
