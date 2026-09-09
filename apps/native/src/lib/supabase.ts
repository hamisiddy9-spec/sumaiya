// Supabase client for the mobile app.
//
// Auth is delegated to Supabase GoTrue directly (email + password, with email
// confirmation). The resulting access token is handed to `ApiClient` so every
// `/api/*` call to the Next backend carries `Authorization: Bearer <token>` —
// `lib/api/auth.ts#getAuthUser` on the backend accepts exactly that.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";

// Required once at module load for the Google OAuth browser session to
// resolve cleanly (no-op on native beyond registering the dismiss handler;
// matters on web).
WebBrowser.maybeCompleteAuthSession();

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://ayczgaddnufdxnhizpcr.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Y3pnYWRkbnVmZHhuaGl6cGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTIyMTIsImV4cCI6MjA5NTAyODIxMn0.sd-zIEbdCY377YZSpXgy2LTYFjRbHhSTgO7WdYuLsho";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
// deep link above. Two reasons: (1) it works today with zero Supabase
// dashboard config, since https://sumaiya.pro is already the Site URL;
// (2) until EMAIL_REDIRECT_TO's dashboard entry exists, it's the only way in
// for accounts created via Google sign-in on web — Google issues no
// password. See app/(app)/(auth)/reset-password on the web app.
export const PASSWORD_RESET_REDIRECT_TO = "https://sumaiya.pro/reset-password";
