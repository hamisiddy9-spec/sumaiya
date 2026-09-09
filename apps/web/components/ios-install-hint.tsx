"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IOS_HINT_DISMISS_KEY, shouldShowIosHint } from "@/lib/pwa/ios-hint-logic";
import { isInstallBlockedPath } from "@/lib/pwa/install-prompt-logic";

/**
 * iOS "Add to Home Screen" hint.
 *
 * iOS Safari never fires `beforeinstallprompt`, so the install banner never
 * appears on iPhone — iOS users have no install path. This is a SUBTLE,
 * one-time hint explaining the Share → Add to Home Screen flow.
 *
 * Rules:
 *  - Only iOS Safari, never Chrome-on-iOS / Android / desktop.
 *  - Never inside in-app browsers (FB/IG webviews have no install path).
 *  - Never in standalone mode (already installed).
 *  - Never on routes with a fixed bottom action bar (same path gate as the
 *    install banner — the hint must not steal taps from CTAs).
 *  - Dismissed once → gone forever (one-time hint, persisted).
 *  - Dismiss button is a 28px tap target (audit flagged sub-24px dismissals).
 */
export function IosInstallHint() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [sw, setSw] = useState(false);

  useEffect(() => {
    setSw(document.cookie.includes("lang=sw"));
    if (isInstallBlockedPath(pathname)) return;
    const ua = navigator.userAgent;
    const maxTouchPoints = navigator.maxTouchPoints;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissedAt = localStorage.getItem(IOS_HINT_DISMISS_KEY);
    if (shouldShowIosHint(ua, maxTouchPoints, standalone, dismissedAt)) {
      setVisible(true);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[100] mx-auto flex max-w-[420px] items-center gap-3 rounded-[14px] bg-espresso px-4 py-3.5 text-cream shadow-[0_12px_30px_-12px_rgba(33,26,21,0.5)] md:bottom-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-ember shadow-[0_2px_0_#A8330F]">
        {/* iOS share glyph (square with up arrow), Lucide idiom */}
        <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5EE" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 3v11M7.5 10 12 14.5 16.5 10M5 19h14" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{sw ? "Sakinisha Sumaiya" : "Install Sumaiya"}</p>
        <p className="mt-0.5 text-xs text-cream/60">
          {sw
            ? "Gusa kitufe cha Kushiriki (square na mshale) → Ongeza kwenye Skrini ya Mwanzo."
            : "Tap the Share button (square with arrow) → Add to Home Screen."}
        </p>
      </div>
      <button
        onClick={() => {
          localStorage.setItem(IOS_HINT_DISMISS_KEY, String(Date.now()));
          setVisible(false);
        }}
        aria-label={sw ? "Funga" : "Dismiss"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-lg leading-none text-cream/40 transition hover:bg-cream/10 hover:text-cream/70"
      >
        &times;
      </button>
    </div>
  );
}
