"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

// The marketing layout used to resolve auth server-side via
// supabase.auth.getSession() — which forced EVERY marketing page to render
// dynamically (cookies()). Now this provider sniffs the Supabase session cookie
// client-side after hydration, so the layout can be statically prerendered.
// Trade-off: a signed-in user sees the guest nav for one frame before it flips
// to "Dashboard" + the mobile tab bar. Acceptable for static HTML + CDN cache.
const MarketingAuthContext = createContext(false);

function sniffAuthed(): boolean {
  if (typeof document === "undefined") return false;
  // Supabase cookie name is `sb-<project-ref>-auth-token`; the ref isn't known
  // client-side, so match the shape.
  return document.cookie.split(";").some((c) => {
    const name = c.trim().split("=")[0] ?? "";
    return name.startsWith("sb-") && name.endsWith("-auth-token");
  });
}

export function MarketingAuthProvider({ children }: { children: React.ReactNode }) {
  // Start false so SSR and first client render match (no hydration mismatch),
  // then flip after mount. Re-sniff on focus too — the session may have
  // started/ended in another tab.
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const update = () => setAuthed(sniffAuthed());
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);

  return (
    <MarketingAuthContext.Provider value={authed}>
      {authed ? <div className="pb-tabbar md:pb-0">{children}</div> : children}
      {authed && <MobileTabBar />}
    </MarketingAuthContext.Provider>
  );
}

export function useMarketingAuthed(): boolean {
  return useContext(MarketingAuthContext);
}
