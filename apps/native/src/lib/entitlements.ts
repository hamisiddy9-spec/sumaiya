import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
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
 *
 * Premium is a comparison against the clock, not a fact decided once: the
 * server's instant has to be re-compared when it passes (see the expiry timer)
 * and when the app comes back to the foreground. A hook that decides on mount
 * and never again hands out premium to an app left open past its expiry.
 */
export interface Entitlements {
  premium: boolean;
  /** ISO timestamp of when earned Premium runs out, or null if none earned. */
  premiumUntil: string | null;
  /** true until the server answer has been read — screens can show a neutral state */
  loading: boolean;
}

/**
 * The largest delay a JS timer can hold: 2^31 - 1 ms, about 24.8 days. A longer
 * delay overflows and fires *immediately*. Earned windows routinely run longer
 * than that (7 days per activated friend, and referrals compound), so the
 * expiry timer below arms the longest legal delay and re-arms for the rest
 * rather than trusting one long timer.
 */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The server's `premiumUntil`, normalised to what the type promises: an ISO
 * timestamp or null.
 *
 * `?? null` only catches null and undefined, so an empty string — or any other
 * string no Date can parse — survives it into the returned value. That fails
 * safe for the paywall itself (NaN is never greater than now, so it reads as
 * "not premium"), but it breaks the type's promise to every other consumer: a
 * screen rendering it to say when Premium ends would show "Invalid Date". An
 * empty, unparseable, or non-string value is therefore not an answer at all,
 * and becomes null.
 *
 * The trimmed form is returned so the value cannot carry stray whitespace into
 * a render; for an already-clean ISO string it is the string as sent.
 */
export function normalizePremiumUntil(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!Number.isFinite(new Date(trimmed).getTime())) return null;
  return trimmed;
}

/**
 * The single comparison the whole paywall rests on: is the server's instant
 * still in the future?
 *
 * `>` and never `>=` — the moment the earned time runs out, it has run out, and
 * a lapse of one millisecond is still a lapse. A null (nothing earned, or a
 * value the server should not have sent, see above) is not premium.
 */
export function isPremiumActive(serverUntil: string | null): boolean {
  return !!serverUntil && new Date(serverUntil).getTime() > Date.now();
}

export function useEntitlements(): Entitlements {
  const [premium, setPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // A slow answer must never write state into a screen that has already gone.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Take a server answer as truth: store the instant, re-decide premium from it. */
  const settle = useCallback((until: string | null) => {
    if (!alive.current) return;
    setPremiumUntil(until);
    setPremium(isPremiumActive(until));
    setLoading(false);
  }, []);

  // Read the earned time back from the server once, on mount.
  useEffect(() => {
    (async () => {
      let serverUntil: string | null = null;
      try {
        const r = await apiClient.getReferral();
        serverUntil = normalizePremiumUntil(r.premiumUntil);
      } catch {
        /* guest, offline, or not signed in — no earned Premium visible */
      }
      settle(serverUntil);
    })();
  }, [settle]);

  // Re-decide premium when the instant it depends on arrives.
  //
  // One timer armed for exactly the time that is left — NOT an interval: the
  // only moment the answer can change on its own is the expiry instant, so
  // there is nothing to poll. If the wait is longer than a JS timer can hold it
  // is armed again for the remainder (two arms per 24.8 days), which keeps a
  // 49-day referral window honest without ever firing early.
  useEffect(() => {
    if (!premiumUntil) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const arm = () => {
      const remaining = new Date(premiumUntil).getTime() - Date.now();
      if (remaining <= 0) return;
      timer = setTimeout(() => {
        settle(premiumUntil);
        arm();
      }, Math.min(remaining, MAX_TIMEOUT_MS));
    };

    arm();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [premiumUntil, settle]);

  // Android can suspend the JS thread across a background stretch (and Doze can
  // kill it outright), so a timer armed before the user locked the phone may
  // never have fired by the time the app is back in front of them. Re-decide
  // from the instant we already hold whenever the app becomes active.
  //
  // Deliberately a local re-compare and not another server round trip: a
  // refetch that fails (offline, a server hiccup) would read as "nothing
  // earned" and take premium away from someone who has it — the expensive
  // false negative this file exists to avoid.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      settle(premiumUntil);
    });
    return () => sub.remove();
  }, [premiumUntil, settle]);

  return { premium, premiumUntil, loading };
}
