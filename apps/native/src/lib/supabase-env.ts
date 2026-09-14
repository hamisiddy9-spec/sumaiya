/**
 * Supabase URL and anon key, resolved in exactly one place, with a guard.
 *
 * WHY THIS FILE EXISTS — the bug it closes
 * ----------------------------------------
 * supabase.ts used to read:
 *
 *   const supabaseAnonKey =
 *     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
 *     "eyJhbGci…";           // the real key, 208 characters
 *
 * `??` only falls back when the left side is null or undefined. An EMPTY STRING
 * is neither, so `"" ?? "eyJhbGci…"` is `""` — the fallback becomes dead code and
 * the minifier drops the literal entirely.
 *
 * That is exactly what happened. The shipped 1.6.12 APK contained NO anon key:
 * the bundle had the Supabase URL and zero occurrences of the key, so every
 * request went out without an `apikey` header and Supabase answered
 * "Invalid API key". Google sign-in was already broken by a Google Cloud
 * misconfiguration, so the email code was the only way in — and it was broken
 * too. Nobody could sign in.
 *
 * The fix is two things, and both matter:
 *
 *   1. `||` with `.trim()`, so "", "   " and undefined all fall through.
 *   2. A pair of predicates below, so a key that is missing or belongs to a
 *      different project is detectable by a test and by a build check — instead
 *      of failing silently at runtime on a user's phone.
 */

const FALLBACK_URL = "https://ayczgaddnufdxnhizpcr.supabase.co";

// Public by design — this is the anon key, it ships in every client bundle.
// It still must match the project in FALLBACK_URL or nothing works.
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5Y3pnYWRkbnVmZHhuaGl6cGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTIyMTIsImV4cCI6MjA5NTAyODIxMn0.sd-zIEbdCY377YZSpXgy2LTYFjRbHhSTgO7WdYuLsho";

export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || FALLBACK_URL).trim();
export const SUPABASE_ANON_KEY = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY
).trim();

/** The project ref encoded in a Supabase URL: https://<ref>.supabase.co */
export function projectRefFromUrl(url: string): string | null {
  const m = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/.exec(url);
  return m ? m[1] : null;
}

/** The project ref encoded in a Supabase JWT's `ref` claim. */
export function projectRefFromJwt(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    // atob is not available in the node test env; Buffer is not available on
    // Hermes. Use whichever exists so this works in both.
    const json =
      typeof atob === "function"
        ? atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(padded, "base64").toString("binary");
    return (JSON.parse(json) as { ref?: string }).ref ?? null;
  } catch {
    return null;
  }
}

/** True when the key is a well-formed JWT for the project in SUPABASE_URL. */
export function supabaseCredentialsAreConsistent(): boolean {
  const urlRef = projectRefFromUrl(SUPABASE_URL);
  const keyRef = projectRefFromJwt(SUPABASE_ANON_KEY);
  return Boolean(urlRef && keyRef && urlRef === keyRef);
}
