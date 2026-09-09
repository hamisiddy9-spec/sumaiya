"use client";

/**
 * <AnalyticsProvider> — mounts once per root layout. It:
 *   1. warms PostHog in the browser (lazy; no-ops without a key or under DNT),
 *   2. ties events to the signed-in user via Supabase `onAuthStateChange`
 *      (identify on sign-in / session restore, reset on sign-out so a shared
 *      phone never merges two people).
 *
 * Renders nothing. Pageviews are handled by PostHog autocapture + the Vercel
 * <Analytics/> already in the layout.
 */
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { identify, resetIdentity } from "@/lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (user) {
        identify(user.id, {
          created_at: user.created_at ?? "",
          has_email: !!user.email,
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) identify(session.user.id);
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
