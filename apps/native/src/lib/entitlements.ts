import { useEffect, useState } from "react";
import { getSecureItem } from "@sumaiya/utils";

/**
 * What the user is entitled to. The free tier is generous — four CV templates,
 * the ATS checker, tailoring, cover letters, the free course guides. Premium
 * unlocks the advanced templates and the deep courses.
 *
 * No billing is wired yet. This reads a local flag so the gating is real and
 * testable now; a server check slots in here later (one place).
 */
export interface Entitlements {
  premium: boolean;
  /** true until the local flag has been read — screens can show a neutral state */
  loading: boolean;
}

const PREMIUM_KEY = "sumaiya_premium";

export function useEntitlements(): Entitlements {
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const v = await getSecureItem(PREMIUM_KEY);
        if (alive) setPremium(v === "true");
      } catch {
        /* default: free */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { premium, loading };
}
