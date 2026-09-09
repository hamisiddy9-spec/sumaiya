"use client";

import { useEffect } from "react";
import posthog from "@/lib/analytics";

// global-error.tsx replaces the root layout on fatal errors, so it must
// include <html> and <body>. Kept minimal: no nav, no layout imports.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    try {
      (posthog as unknown as { captureException?: (e: unknown, p?: unknown) => void })
        .captureException?.(error, { digest: error.digest });
    } catch {
      /* reporting must never mask the original error */
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            Something went wrong
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
            Unexpected error
          </h1>
          <p style={{ color: "#6b7280", maxWidth: 400, marginBottom: "2rem" }}>
            We hit a snag. Try refreshing the page or go back to the dashboard.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ background: "#DA4A1C", color: "#fff", fontWeight: 600, padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", fontSize: "0.875rem" }}
            >
              Try again
            </button>
            <a
              href="/dashboard"
              style={{ background: "#f9fafb", color: "#374151", fontWeight: 600, padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "1px solid #e5e7eb", textDecoration: "none", fontSize: "0.875rem" }}
            >
              Go to Dashboard
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#9ca3af" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
