// Supabase client for the mobile app.
//
// Auth is delegated to Supabase GoTrue directly (email + password, with email
// confirmation). The resulting access token is handed to `ApiClient` so every
// `/api/*` call to the Next backend carries `Authorization: Bearer *** —
// `lib/api/auth.ts#getAuthUser` on the backend accepts exactly that.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { PASSWORD_RESET_URL } from "./app-hosts";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-env";

// The Google Cloud **Web** OAuth client ID (same one configured in Supabase →
// Auth → Providers → Google). Public by design — safe to ship in the bundle.
// The native library needs it as `webClientId` to mint an ID token Supabase
// will accept via signInWithIdToken().
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "811013224847-1g6ml0490hhfngrips635ropm8tka4ep.apps.googleusercontent.com";

// Configure once at module load. No browser, no redirect — signIn() shows the
// OS account-picker sheet and returns an ID token.
//
// Guarded: on a device without Google Play Services, or if the native module
// didn't link, a bare `GoogleSignin.configure()` throws synchronously during
// this import and takes the whole app down before React mounts ("crashes
// instantly, never opens"). A missing Google button is survivable; a boot
// crash is not — email OTP still works.
try {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // We only need identity + email for account creation.
    scopes: ["email", "profile"],
  });
} catch (err) {
  console.warn("GoogleSignin.configure failed — Google sign-in disabled:", err);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // We handle the confirmation deep link ourselves (see auth-context); the
    // library never sees a browser URL on native.
    detectSessionInUrl: false,
  },
});

// Deep link the SIGN-UP confirmation email — and the Google OAuth browser
// session below — redirect to. Must be present in Supabase → Authentication
// → URL Configuration → Redirect URLs (a custom app:// scheme isn't allowed
// by default — someone needs to add it there, otherwise Supabase silently
// falls back to the Site URL, or the OAuth call errors before it ever opens
// a browser). One dashboard addition covers both flows.
export const EMAIL_REDIRECT_TO = "sumaiya://auth/confirm";

// The PASSWORD RESET email redirects to a plain web page instead of the app
// deep link above. Two reasons: (1) it works with no Supabase dashboard config
// beyond the Site URL; (2) until EMAIL_REDIRECT_TO's dashboard entry exists,
// it's the only way in for accounts created via Google sign-in on web — Google
// issues no password. See app/(app)/(auth)/reset-password on the web app.
//
// This literal used to read "https:...word" — a truncated, unparseable URL that
// no redirect handler could ever accept. Reset emails were being handed a
// broken target. It is now a real, verified route (200 on sumaiya.app).
export const PASSWORD_RESET_REDIRECT_TO = PASSWORD_RESET_URL;
