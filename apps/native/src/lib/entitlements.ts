import { useEffect, useState } from "react";
import { apiClient } from "./api-client";

/**
 * What the user is entitled to. The free tier is generous — the curated CV
 * templates, the ATS checker, tailoring, cover letters, the free course guides.
 * Premium unlocks the premium-tier designs (see `tier` on each template in
 * lib/templates) and the deep courses.
 *
 * Premium is EARNED, never local: referrals grant real time server-side
 * (profile.premiumUntil — 7 days per activated friend, lib/referral.ts on the
 * web app) and this hook reads it back. Nothing is granted to a device.
 *
 * This mirrors the web's lib/use-premium.ts and lib/entitlements.ts — the web
 * asks `can(subject, "template.premium")` with the same `premiumUntil`, so a
 * referrer's earned days unlock the same designs on both doors.
 *
 * ⚠️ The waitlist flag (`sumaiya_premium_waitlist`, set by PremiumSheet when
 * someone taps "notify me") is deliberately a DIFFERENT key and must never be
 * read here. It records interest in a paid tier that does not exist yet; it is
 * not a purchase and must never unlock anything. An earlier version of this
 * file read a `sumaiya_premium` flag that nothing ever wrote — dead, and a trap
 * for anyone who might "fix" it by pointing it at the waitlist key.
 */
export interface Entitlements {
  premium: boolean;
  /** ISO timestamp of when earned Premium runs out, or null if none earned. */
  premiumUntil: string | null;
  /** true until the server answer has been read — screens can show a neutral state */
  loading: boolean;
}

export function useEntitlements(): Entitlements {
  const [premium, setPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      let serverUntil: string | null = null;
      try {
        const r = await apiClient.getReferral();
        serverUntil = r.premiumUntil ?? null;
      } catch {
        /* guest, offline, or not signed in — no earned Premium visible */
      }
      if (!alive) return;
      const earnedActive =
        !!serverUntil && new Date(serverUntil).getTime() > Date.now();
      setPremium(earnedActive);
      setPremiumUntil(serverUntil);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { premium, premiumUntil, loading };
}
