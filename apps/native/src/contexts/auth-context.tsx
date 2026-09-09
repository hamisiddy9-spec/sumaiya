import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import type { ApiClient } from "@sumaiya/api-client";
import type { AuthUser } from "@sumaiya/types";
import { supabase, EMAIL_REDIRECT_TO } from "../lib/supabase";
import { apiClient as sharedApiClient } from "../lib/api-client";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  /** Set after sign-up when the user must confirm their email before signing in. */
  pendingConfirmationEmail: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  /** Defaults to the shared singleton; overridable for tests. */
  apiClient?: ApiClient;
}

function toAuthUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? "",
    name: (meta.name as string) ?? (meta.full_name as string) ?? undefined,
    photoUrl: (meta.avatar_url as string) ?? undefined,
    createdAt: user.created_at ? new Date(user.created_at) : new Date(),
    updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
  };
}

function friendlyError(message: string): string {
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email address first — check your inbox for the confirmation link.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Incorrect email or password.";
  }
  if (/user already registered/i.test(message)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  return message;
}

export function AuthProvider({ children, apiClient = sharedApiClient }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const initialized = useRef(false);

  const applySession = useCallback(
    (session: Session | null) => {
      apiClient.setAccessToken(session?.access_token ?? "");
      setUser(session?.user ? toAuthUser(session.user) : null);
    },
    [apiClient]
  );

  // Restore any persisted session + keep the API client token in sync.
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((err) => console.error("Auth session restore error:", err))
      .finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, [applySession]);

  // Handle the email-confirmation deep link: sumaiya://auth/confirm#access_token=...
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const handleUrl = async (url: string | null) => {
      if (!url || !url.includes("auth/confirm")) return;
      setLoading(true);
      try {
        const parsed = Linking.parse(url);
        const params = { ...(parsed.queryParams ?? {}) } as Record<string, string>;
        // Supabase implicit flow returns tokens in the URL fragment.
        const hash = url.split("#")[1];
        if (hash) {
          new URLSearchParams(hash).forEach((v, k) => {
            params[k] = v;
          });
        }

        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
          setPendingConfirmationEmail(null);
        } else if (params.token_hash) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: "email",
            token_hash: params.token_hash,
          });
          if (otpError) throw otpError;
          setPendingConfirmationEmail(null);
        } else if (params.error_description) {
          setError(friendlyError(params.error_description));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Confirmation failed";
        setError(friendlyError(message));
      } finally {
        setLoading(false);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: EMAIL_REDIRECT_TO },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          // Email confirmation disabled — user is signed in immediately.
          applySession(data.session);
        } else {
          // Confirmation required. Do NOT sign the user in yet.
          setPendingConfirmationEmail(email);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign up failed";
        setError(friendlyError(message));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      setPendingConfirmationEmail(null);
      // onAuthStateChange applies the session.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(friendlyError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Same Supabase Google provider the web app already uses
  // (lib/auth-client.ts) — no new Google Cloud Console setup needed. Flow:
  // ask Supabase for the provider's authorize URL, open it in a browser tab
  // the OS treats as a trusted user session (openAuthSessionAsync, NOT an
  // in-app WebView — Google blocks sign-in inside WebViews), and when it
  // redirects back to EMAIL_REDIRECT_TO the promise resolves with that URL
  // directly — no need to round-trip through the app's own deep-link
  // listener the way the email-confirm flow does.
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: EMAIL_REDIRECT_TO, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error("Could not start Google sign-in.");

      // Style the auth session so it reads as part of the app, not "a browser":
      // no title bar, app-coloured chrome, collapsing toolbar, kept out of the
      // recents switcher. (A fully native Google sheet needs
      // @react-native-google-signin + a Google Cloud OAuth client — separate.)
      const result = await WebBrowser.openAuthSessionAsync(data.url, EMAIL_REDIRECT_TO, {
        showTitle: false,
        enableBarCollapsing: true,
        showInRecents: false,
        toolbarColor: "#1A1310",
        controlsColor: "#DA4A1C",
        dismissButtonStyle: "cancel",
        preferEphemeralSession: false,
      });
      if (result.type !== "success" || !result.url) {
        // User closed the browser / cancelled — not an error to surface.
        return;
      }

      const hash = result.url.split("#")[1];
      const params = hash ? new URLSearchParams(hash) : null;
      const access_token = params?.get("access_token");
      const refresh_token = params?.get("refresh_token");
      if (!access_token || !refresh_token) {
        throw new Error(
          params?.get("error_description") || "Google sign-in didn't return a session."
        );
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) throw sessionError;
      // onAuthStateChange applies the session.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(friendlyError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      applySession(null);
      setPendingConfirmationEmail(null);
    }
  }, [applySession]);

  const resendConfirmation = useCallback(async (email: string) => {
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: EMAIL_REDIRECT_TO },
    });
    if (resendError) {
      setError(friendlyError(resendError.message));
      throw resendError;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        pendingConfirmationEmail,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resendConfirmation,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
