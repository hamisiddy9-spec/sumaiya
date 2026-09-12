/**
 * LanguageSync — keeps the SERVER's copy of the user's language in step with
 * the device's. Renders nothing.
 *
 * Why this exists (a real bug, shipped):
 *   `LangProvider.setLang()` fires the PATCH only on an explicit language
 *   CHANGE. The onboarding language picker runs BEFORE sign-in, so that call
 *   carries no token, gets a 401, and is swallowed on purpose — and it is never
 *   retried. The choice then lived only on the device: `user_profile.lang`
 *   stayed NULL while the app happily rendered Swahili.
 *
 *   Consequence: every server-composed push notification — the six signal
 *   types in `lib/notify/dispatch-signals.ts` and the follow-up cron — resolved
 *   `lang === "sw"` to false and went out in English, to precisely the users
 *   who had asked for Swahili. Verified on a device: the app was in Swahili,
 *   `user_profile.lang` was NULL, and 0 of 13 profile rows had it set.
 *
 * Mount this inside BOTH AuthProvider and LangProvider. It re-asserts the
 * language whenever a session appears, and whenever the language changes, so
 * it also self-heals any send that previously failed.
 *
 * Deliberately NOT part of i18n.tsx: `components/error-boundary.tsx` imports
 * `getLastKnownLang` from there and must stay dependency-free, because a crash
 * can come from the very providers a sync like this depends on.
 */
import { useEffect, useRef } from "react";
import { useLang } from "./i18n";
import { apiClient } from "./api-client";
import { reportError } from "./reporting";
import { useAuthContext } from "../contexts/auth-context";

export function LanguageSync(): null {
  const { lang, ready } = useLang();
  const { user } = useAuthContext();
  const done = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !user?.id) return;
    // Keyed on user AND language, so signing in syncs and a later change
    // re-asserts, while a plain re-render does not spam the endpoint.
    const key = `${user.id}:${lang}`;
    if (done.current === key) return;
    done.current = key;

    apiClient.setLangPreference(lang).catch((err) => {
      // Not silent any more. A failure here means push notifications will go
      // out in the wrong language, and this went unnoticed for a whole release
      // precisely because nothing reported it.
      done.current = null; // allow another attempt
      reportError(err, { scope: "language-sync" });
    });
  }, [ready, user?.id, lang]);

  return null;
}
