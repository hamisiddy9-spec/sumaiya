"use client";

import { useEffect, useState } from "react";

// ROOT not-found — required by Next.js when the app uses multiple root layouts
// via route groups (app/(app)/layout.tsx + app/[locale]/layout.tsx) and there
// is no app/layout.tsx. Without this file, any bare unmatched path that isn't
// in the middleware's marketing allowlist and isn't under (app) falls through
// with no layout to render in → 500 instead of 404. (Live repro 2026-09:
// sumaiya.pro/<typo> → 500.)
//
// It renders with NO layout, so it must supply its own <html>/<body>, like
// app/global-error.tsx. Keep it dependency-light — no providers, no context.
export default function RootNotFound() {
  const [sw, setSw] = useState(true);

  useEffect(() => {
    try {
      const lang = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)?.[1];
      setSw(lang !== "en");
    } catch {
      /* default to Swahili */
    }
  }, []);

  return (
    <html lang={sw ? "sw" : "en"}>
      <head>
        <title>{sw ? "Ukurasa haupatikani — Sumaiya" : "Page not found — Sumaiya"}</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
          background: "#F1E7D8",
          color: "#54473B",
          fontFamily:
            "'Hanken Grotesk', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true" style={{ marginBottom: 24 }}>
          <g fill="#DA4A1C">
            <path d="M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z" transform="rotate(0 12 12)" />
            <path d="M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z" transform="rotate(120 12 12)" opacity="0.92" />
            <path d="M12 2.6 C 15.1 5 15.6 8.6 13.5 10.8 C 12.7 11.7 11.3 11.7 10.5 10.8 C 8.4 8.6 8.9 5 12 2.6 Z" transform="rotate(240 12 12)" opacity="0.84" />
            <circle cx="12" cy="12" r="2.1" />
          </g>
        </svg>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#B03F14",
            margin: "0 0 12px",
          }}
        >
          {sw ? "404 — Ukurasa haupatikani" : "404 — Page not found"}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#241A12", margin: "0 0 12px", maxWidth: "20ch" }}>
          {sw ? "Samahani, ukurasa huu haupo" : "Oops, this page doesn't exist"}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: "40ch", margin: "0 0 28px" }}>
          {sw
            ? "Huenda umehamishwa au kuondolewa. Turudi kwenye njia."
            : "It may have moved or been removed. Let's get you back on track."}
        </p>
        <a
          href="/"
          style={{
            background: "#DA4A1C",
            color: "#FBF6EF",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 22px",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          {sw ? "Rudi Mwanzo" : "Back to Home"}
        </a>
      </body>
    </html>
  );
}
