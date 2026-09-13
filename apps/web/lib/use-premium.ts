"use client";

// use-premium — the CLIENT half of the entitlement check.
//
// Why this is client-side rather than a server prop: the template galleries
// live on the statically prerendered, CDN-cached marketing tree (see the CDN
// CACHING note in middleware.ts). Resolving Premium there would need cookies() +
// a DB read, which turns every template page dynamic and drops the cache for
// every visitor to serve a flag that only matters to a signed-in few. So the
// page stays static and hydrates this — the same trade-off, and the same cookie
// sniff, as components/ui/marketing-auth-context.tsx.
//
// It asks /api/entitlements, which runs the SAME `can()` the server enforces
// with, so a client gate can never disagree with the API. The native app does
// the identical thing (src/lib/entitlements.ts) — both doors answer alike.

import { useEffect, useState } from "react";

export interface PremiumState {
  /** True while a referral-earned (or future paid) window is live. */
  premium: boolean;
  /** ISO timestamp the window ends, or null when none was ever earned. */
  premiumUntil: string | null;
  /** True until the answer is known — screens can show a neutral state. */
  loading: boolean;
}

interface PremiumPayload {
  premium: boolean;
  premiumUntil: string | null;
}

const NO_PREMIUM: PremiumPayload = { premium: false, premiumUntil: null };

/** Supabase cookie name is `sb-<project-ref>-auth-token`; the ref isn't known
 *  client-side, so match the shape (identical to marketing-auth-context). */
function sniffAuthed(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const name = c.trim().split("=")[0] ?? "";
    return name.startsWith("sb-") && name.endsWith("-auth-token");
  });
}

// One in-flight/resolved promise per page load — the gallery renders ~40 cards
// and the editor renders its own picker; neither should cost a request.
let cache: Promise<PremiumPayload> | null = null;

function loadPremium(): Promise<PremiumPayload> {
  if (!cache) {
    cache = fetch("/api/entitlements", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j): PremiumPayload => ({
        premium: !!j?.data?.premium,
        premiumUntil: j?.data?.premiumUntil ?? null,
      }))
      .catch(() => NO_PREMIUM);
  }
  return cache;
}

/** Drop the memoised answer — used when the session may have changed (focus). */
export function resetPremiumCache(): void {
  cache = null;
}

export function usePremium(): PremiumState {
  const [state, setState] = useState<PremiumState>({
    premium: false,
    premiumUntil: null,
    loading: true,
  });

  useEffect(() => {
    let alive = true;

    const update = async () => {
      // A guest cannot have earned Premium, and /api/entitlements would just
      // tell us so — skip the request entirely on the anonymous hot path.
      if (!sniffAuthed()) {
        if (alive) setState({ ...NO_PREMIUM, loading: false });
        return;
      }
      const payload = await loadPremium();
      if (alive) setState({ ...payload, loading: false });
    };

    void update();

    // The session can start or end in another tab; re-check on focus, dropping
    // the memoised answer first so a just-earned window becomes visible.
    const onFocus = () => {
      resetPremiumCache();
      void update();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return state;
}
