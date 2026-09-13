import { useEffect, useState } from "react";
import { getSecureItem } from "@sumaiya/utils";
import { apiClient } from "./api-client";

/**
 * What the user is entitled to. The free tier is generous — four CV templates,
 * the ATS checker, tailoring, cover letters, the free course guides. Premium
 * unlocks the advanced templates and the deep courses.
 *
 * No billing is wired yet, but referrals already grant real Premium time
 * (profile.premiumUntil, 7 days per activated friend — see lib/referral.ts on
 * the server). `premium` is true if EITHER the local waitlist flag is set OR
 * the server says premiumUntil is still in the future, so a referrer who
 * earned time is covered the moment a feature actually gets gated.
 */
export interface Entitlements {
  premium: boolean;
  /** ISO timestamp of when earned Premium runs out, or null if none earned. */
  premiumUntil: string | null;
  /** true until both sources have been read — screens can show a neutral state */
  loading: boolean;
}

const PREMIUM_KEY = "sumaiya_premium";

export function useEntitlements(): Entitlements {
  const [premium, setPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      let localFlag = false;
      let serverUntil: string | null = null;
      try {
        localFlag = (await getSecureItem(PREMIUM_KEY)) === "true";
      } catch {
        /* default: free */
      }
      try {
        const r = await apiClient.getReferral();
        serverUntil = r.premiumUntil ?? null;
      } catch {
        /* guest, offline, or not signed in — no earned Premium visible */
      }
      if (!alive) return;
      const earnedActive = !!serverUntil && new Date(serverUntil).getTime() > Date.now();
      setPremium(localFlag || earnedActive);
      setPremiumUntil(serverUntil);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { premium, premiumUntil, loading };
}
