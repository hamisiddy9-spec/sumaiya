"use client";

/**
 * <AnalyticsProvider> — mounts once per root layout. It:
 *   1. captures campaign attribution from the landing URL (`?src=poster` on the
 *      printed posters) and persists it, so a scan is still identifiable at
 *      sign-in — see lib/analytics/attribution.ts,
 *   2. warms PostHog in the browser (lazy; no-ops without a key or under DNT),
 *   3. ties events to the signed-in user via Supabase `onAuthStateChange`
 *      (identify on sign-in / session restore, reset on sign-out so a shared
 *      phone never merges two people).
 *
 * Renders nothing. Pageviews are handled by PostHog autocapture + the Vercel
 * <Analytics/> already in the layout.
 */
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { identify, resetIdentity } from "@/lib/analytics";
import { getAttributionProps, initAttribution } from "@/lib/analytics/attribution";

export function AnalyticsProvider() {
  useEffect(() => {
    let active = true;

    // Capture on mount, not lazily on the first event: a visitor who scans the
    // poster and signs in without a single tracked interaction still has to be
    // attributable. Idempotent, and a no-op without `?src=`.
    initAttribution();

    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (user) {
        identify(user.id, {
          created_at: user.created_at ?? "",
          has_email: !!user.email,
          // The campaign that brought this person here, on the person profile —
          // this is the link between "someone scanned the poster" and "someone
          // has an account", and it is set on every identify so a signup that
          // happens long after the scan still connects.
          ...getAttributionProps(),
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) identify(session.user.id, getAttributionProps());
      } else if (event === "SIGNED_OUT") {
        resetIdentity();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
