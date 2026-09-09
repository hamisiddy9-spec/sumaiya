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
