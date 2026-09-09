"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { INSTALL_DISMISS_KEY, shouldShowInstallBanner } from "@/lib/pwa/install-prompt-logic";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [sw, setSw] = useState(false);

  useEffect(() => {
    setSw(document.cookie.includes("lang=sw"));
    // NOTE: service-worker registration moved to <SwRegister /> (always
    // mounted) so the SW lifecycle is not coupled to this banner's visibility.
    setDismissedAt(localStorage.getItem(INSTALL_DISMISS_KEY));
    // Installed PWA (standalone window) never needs the banner — there is no
    // prompt to show and re-nagging installed users is a P2 UX bug.
    if (window.matchMedia?.("(display-mode: standalone)").matches) setStandalone(true);
    setLoaded(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || !loaded) return null;
  if (!shouldShowInstallBanner(pathname, dismissedAt, Date.now(), standalone)) return null;

  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[100] mx-auto flex max-w-[420px] items-center gap-3 rounded-[14px] bg-espresso px-4 py-3.5 text-cream shadow-[0_12px_30px_-12px_rgba(33,26,21,0.5)] md:bottom-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-ember shadow-[0_2px_0_#A8330F]">
        {/* download-to-device glyph, Lucide idiom */}
        <svg viewBox="0 0 24 24" fill="none" stroke="#FAF5EE" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 3v11M7.5 10 12 14.5 16.5 10M5 19h14" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{sw ? "Sakinisha Sumaiya" : "Install Sumaiya"}</p>
        <p className="mt-0.5 text-xs text-cream/60">{sw ? "Iongeze kwenye skrini yako ya mwanzo kwa ufikiaji wa haraka." : "Add to your home screen for one-tap access."}</p>
      </div>
      <button
        onClick={async () => {
          try {
            await deferred.prompt();
            await deferred.userChoice;
          } catch {}
          setDeferred(null);
        }}
        className="shrink-0 rounded-[9px] bg-ember px-3.5 py-2 text-[13px] font-bold text-cream transition hover:bg-ember-hover"
      >
        {sw ? "Sakinisha" : "Install"}
      </button>
      <button
        onClick={() => {
          // Persist the dismissal timestamp (NOT a forever-flag) so the banner
          // quietly re-offers after the window instead of nagging or vanishing
          // permanently.
          localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
          setDismissedAt(String(Date.now()));
        }}
        aria-label={sw ? "Ondoa" : "Dismiss"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-lg leading-none text-cream/40 transition hover:bg-cream/10 hover:text-cream/70"
      >
        &times;
      </button>
    </div>
  );
}
