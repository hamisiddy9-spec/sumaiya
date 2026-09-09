import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  social: async ({ provider, callbackURL }: { provider: "google"; callbackURL: string }) => {
    const supabase = createSupabaseBrowserClient();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackURL },
      });
      if (error) {
        return { error: { message: error.message } };
      }
      return { error: null, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "OAuth sign-in failed";
      return { error: { message: errorMessage } };
    }
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
