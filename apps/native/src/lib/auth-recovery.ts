/**
 * Token recovery for the shared ApiClient.
 *
 * Why this exists: `auth-context` pushes the access token into the API client
 * whenever the Supabase session changes, but that push is ASYNCHRONOUS —
 * `supabase.auth.getSession()` resolves after the first screen has mounted, and
 * a refresh can land while a request is already in flight. Any request that goes
 * out in that window carries no Authorization header, the server answers 401,
 * and the user was told "we just couldn't reach the server" — with a Try-again
 * button that re-sent the same missing token, so it never recovered.
 *
 * The api-client calls this once after a 401. It restores or refreshes the
 * session, pushes the token in, and reports whether the retry has a chance.
 * Returning false means "there is genuinely no session" — the caller then says
 * so instead of blaming the network.
 */
import { apiClient } from "./api-client";
import { supabase } from "./supabase";

/**
 * Treat a token that expires within this window as already stale. Supabase
 * refreshes on its own timer, but this runs in the middle of a failed request,
 * where being pessimistic costs one refresh and being optimistic costs another
 * 401.
 */
const EXPIRY_HEADROOM_S = 30;

export async function recoverSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const usable =
      !!session?.access_token &&
      (session.expires_at ?? 0) * 1000 > Date.now() + EXPIRY_HEADROOM_S * 1000;

    if (usable && session) {
      apiClient.setAccessToken(session.access_token);
      return true;
    }

    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session?.access_token) return false;

    apiClient.setAccessToken(refreshed.session.access_token);
    return true;
  } catch (err) {
    // Never throw from here: a failed recovery must degrade to the honest
    // "sign in again" message, not mask the original 401 with a new error.
    console.error("[auth] session recovery failed:", err);
    return false;
  }
}

/** Register the recovery handler on the app's single ApiClient. Idempotent. */
export function installAuthRecovery(): void {
  apiClient.setRefreshAuth(recoverSession);
}
