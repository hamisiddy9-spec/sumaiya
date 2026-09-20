import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requestGoogleIdToken } from "@/lib/google-identity";

export interface MagicLinkError {
  message: string;
  /** Supabase auth error code (e.g. over_email_send_rate_limit, email_exists). */
  code?: string;
}

export const signIn = {
  magicLink: async ({ email, callbackURL }: { email: string; callbackURL: string }) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackURL },
    });
    if (!error) return { error: null as MagicLinkError | null };
    // Pass the SDK's error CODE through so the UI can map it to a localized
    // message (the raw English message must never leak into a Swahili modal).
    return { error: { message: error.message, code: (error as { code?: string }).code } };
  },

  /**
   * Email a 6-digit code instead of a link. This is the robust path for an
   * INSTALLED PWA: tapping a magic link opens the phone browser and the session
   * lands there, not back in the app — but a code the user types stays entirely
   * inside the PWA. (Requires the Supabase "Magic Link" email template to
   * include {{ .Token }} — see docs/HANDOVER.md.)
   */
  emailCode: async ({ email }: { email: string }) => {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (!error) return { error: null as MagicLinkError | null };
    return { error: { message: error.message, code: (error as { code?: string }).code } };
  },

  /** Verify the 6-digit code. On success the session is set in THIS context. */
  verifyEmailCode: async ({ email, token }: { email: string; token: string }) => {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (!error) return { error: null as MagicLinkError | null, data };
    return { error: { message: error.message, code: (error as { code?: string }).code }, data: null };
  },
  /**
   * Google sign-in — the SAME mechanism the native app uses.
   *
   * Google Identity Services mints an ID token in the browser (Google talks to
   * the browser directly), then Supabase only VERIFIES that token via
   * `signInWithIdToken`. Supabase never sees a Google client secret, so this
   * works on a project where the Google provider has no secret configured.
   *
   * Do NOT reintroduce `signInWithOAuth({ provider: "google" })`: that route
   * goes THROUGH Supabase and needs the Supabase-hosted client secret. With the
   * secret unset it answers 400 "Unsupported provider: missing OAuth secret"
   * and the button is dead. `lib/signin-mechanism-parity.test.ts` enforces this
   * so the web and native paths cannot silently drift apart again.
   *
   * On success the session is set in THIS browser context — there is no OAuth
   * redirect, so callers navigate to their destination themselves.
   */
  google: async (opts: { timeoutMs?: number } = {}) => {
    const supabase = createSupabaseBrowserClient();
    const outcome = await requestGoogleIdToken(opts);
    if (!outcome.ok) {
      // `reason` travels as `code` so the UI can localize it (the message is
      // English diagnostics and must never be shown to a Swahili user).
      return {
        error: { message: outcome.message, code: outcome.reason } as MagicLinkError,
        data: null,
      };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: outcome.token,
    });
    if (!error) return { error: null as MagicLinkError | null, data };
    return {
      error: { message: error.message, code: (error as { code?: string }).code },
      data: null,
    };
  },
};

export const signOut = async () => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.signOut();
};

export const getSession = async () => {
  const supabase = createSupabaseBrowserClient();
  return supabase.auth.getSession();
};
