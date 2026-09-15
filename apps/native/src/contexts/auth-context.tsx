import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as Linking from "expo-linking";
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import type { Session, User } from "@supabase/supabase-js";
import type { ApiClient } from "@sumaiya/api-client";
import type { AuthUser } from "@sumaiya/types";
import { supabase } from "../lib/supabase";
import { apiClient as sharedApiClient } from "../lib/api-client";
import { installAuthRecovery } from "../lib/auth-recovery";
import { reportError } from "../lib/reporting";
import { friendlyError } from "../lib/auth-errors";
import { getLastKnownLang } from "../lib/i18n";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  /** Email a one-time code. No redirect, no deep link — the code is typed in
   *  the app and verifyCode sets the session directly. The same code creates
   *  the account, so there is no separate sign-up. */
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, token: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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

export function AuthProvider({ children, apiClient = sharedApiClient }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    // A request can outrun this effect: getSession() below is async, and the
    // first screen's fetch may already be on the wire with no token. Recovery
    // gives that request one refresh-and-retry instead of a 401 the UI would
    // report as "can't reach the server".
    installAuthRecovery();

    supabase.auth
      .getSession()
      .then(({ data }) => applySession(data.session))
      .catch((err) => reportError(err, { scope: "auth.restore" }))
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
        } else if (params.token_hash) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: "email",
            token_hash: params.token_hash,
          });
          if (otpError) throw otpError;
        } else if (params.error_description) {
          setError(friendlyError(params.error_description, getLastKnownLang()));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Confirmation failed";
        setError(friendlyError(message, getLastKnownLang()));
      } finally {
        setLoading(false);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // Native Google Sign-In — the OS account-picker sheet, no browser, no
  // redirect URL involved. GoogleSignin (configured in lib/supabase.ts with the
  // Web client ID) returns an ID token; Supabase accepts it directly via
  // signInWithIdToken(). onAuthStateChange then applies the session.
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // v13+ returns { type: "success" | "cancelled", data }. Older shape put
      // the payload at the top level — handle both.
      const payload =
        (response as { type?: string; data?: unknown }).type === "cancelled"
          ? null
          : ((response as { data?: unknown }).data ?? response);
      if (!payload) return; // user dismissed the sheet — not an error

      const idToken = (payload as { idToken?: string }).idToken;
      if (!idToken) throw new Error("Google sign-in didn't return an ID token.");

      const { error: sessionError } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (sessionError) throw sessionError;
      // onAuthStateChange applies the session.
    } catch (err) {
      if (
        isErrorWithCode(err) &&
        (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS)
      ) {
        return; // silent — cancelled or a double-tap
      }
      if (isErrorWithCode(err) && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError(friendlyError("PLAY_SERVICES_NOT_AVAILABLE", getLastKnownLang()));
        throw err;
      }
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(friendlyError(message, getLastKnownLang()));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await GoogleSignin.signOut().catch(() => {}); // clear the cached Google account too
    } catch (err) {
      reportError(err, { scope: "auth.signOut" });
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const sendCode = useCallback(async (email: string) => {
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (otpError) {
      setError(friendlyError(otpError.message, getLastKnownLang()));
      throw otpError;
    }
  }, []);

  const verifyCode = useCallback(async (email: string, token: string) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        email,
        token: token.replace(/\D/g, ""),
        type: "email",
      });
      if (vErr || !data.session) {
        setError(friendlyError(vErr?.message ?? "That code is wrong or expired.", getLastKnownLang()));
        throw vErr ?? new Error("no session");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        sendCode,
        verifyCode,
        signInWithGoogle,
        signOut,
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
