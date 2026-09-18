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
import { capture, identify, resetIdentity } from "@/lib/analytics";
import { getAttributionProps, initAttribution } from "@/lib/analytics/attribution";

/**
 * A signup is "new" if the account was created moments ago. Same 60s window the
 * server uses to decide whether to send a welcome email (lib/supabase/
 * auth-handler.ts) — one definition of "new user" in this codebase, not two.
 */
const NEW_ACCOUNT_WINDOW_MS = 60_000;

/** Users already reported this page load, so getSession + SIGNED_IN agree. */
const reportedSignIns = new Set<string>();

/**
 * The scan reached an account. This is the step the printed-poster question
 * actually turns on ("did any poster produce a single user?"), and until now
 * `sign_in_completed` was emitted from exactly ONE place — the email-code form
 * — with `isNew: false` hardcoded, so a magic-link or Google signup produced no
 * sign-in event at all and the poster funnel would have read zero by
 * construction. Reported here, where the auth state is actually known.
 *
 * Attribution is attached by track(); the method comes from Supabase's own
 * provider metadata, and the email provider is reported as `magic_link` because
 * the provider identity cannot tell a link from a code (the code form's own
 * emission reports `otp` for that path).
 */
function reportSignIn(user: {
  id: string;
  created_at?: string;
  app_metadata?: { provider?: string };
}): void {
  if (!user?.id || reportedSignIns.has(user.id)) return;
  reportedSignIns.add(user.id);
  const provider = user.app_metadata?.provider;
  const method = provider === "google" ? "google" : "magic_link";
  const isNew =
    !!user.created_at &&
    Date.now() - new Date(user.created_at).getTime() < NEW_ACCOUNT_WINDOW_MS;
  capture("sign_in_completed", { method, isNew });
}

export function AnalyticsProvider() {
  useEffect(() => {
    let active = true;

    // Capture on mount, not lazily on the first event: a visitor who scans the
    // poster and signs in without a single tracked interaction still has to be
    // attributable. Idempotent, and a no-op without `?src=`.
    const src = initAttribution();

    // The scan itself — the top of the campaign funnel, and the number every
    // drop-off below is a fraction of. Only for a tagged visit: an organic
    // visitor is not a campaign, and the ingest route would reject it.
    if (src) {
      capture("campaign_landing", {
        path: typeof location !== "undefined" ? location.pathname : "",
      });
    }

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
        reportSignIn(user);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          identify(session.user.id, getAttributionProps());
          reportSignIn(session.user);
        }
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
