"use client";

import { useEffect } from "react";

/**
 * Always-mounted service-worker registrar. Deliberately separate from the
 * install banner: SW registration (and therefore update flow) must never
 * depend on UI state like the banner being visible or dismissed.
 *
 * The worker itself (public/sw.js) uses skipWaiting() + clients.claim(), so a
 * deployed update takes over automatically on the next load.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return; // SW requires HTTPS (or localhost)
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal — the app works fine without a SW.
    });
  }, []);
  return null;
}
