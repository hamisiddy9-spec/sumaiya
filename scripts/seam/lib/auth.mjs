/**
 * SEAM TEST — real sessions, without inventing a fake auth world.
 *
 * WHAT THIS DOES AND WHY
 * The journey's second half needs a genuinely authenticated browser. Two ways
 * to get one honestly:
 *
 *   1. Drive the product's own sign-in UI. Requires either a human at a Google
 *      consent screen or an inbox that can receive Supabase's magic link — this
 *      machine has neither (see the seam report's BLOCKED lines).
 *   2. Mint a REAL Supabase session through the public auth API and inject it in
 *      the EXACT cookie format the app itself uses (`@supabase/ssr`, the
 *      library the app depends on — not a hand-rolled encoding), so the pages
 *      under test cannot tell it from a signed-in user's session.
 *
 * This file is option 2. The session is real (a real `access_token` from
 * `POST /auth/v1/token`, verified by the app's own `getUser(token)`), the user
 * is real (created through the admin API with `email_confirm: true`), and the
 * only thing skipped is the click on the sign-in button — which is stated as
 * UNVERIFIED in the report rather than assumed to work.
 *
 * SECRETS: the service_role key is read from the secrets file into a local
 * variable. It is never printed, never returned in an observation line, and
 * never written to disk. Cookies are minted in memory and handed to Playwright.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const req = createRequire(path.join(REPO, "package.json"));

/** `sb-<ref>-auth-token` — the storage key @supabase/ssr derives from the URL. */
export function storageKey(supabaseUrl) {
  const ref = /^https?:\/\/([a-z0-9]+)\.supabase\./.exec(supabaseUrl)?.[1] ?? "supabase";
  return `sb-${ref}-auth-token`;
}

function adminHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

/**
 * Create a real user through the Supabase admin API.
 * `email_confirm: true` means no email is ever sent — the address is a reserved
 * `.invalid` TLD so a stray send can never reach a human.
 */
export async function createTestUser({ supabaseUrl, serviceRoleKey, email, password }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders(serviceRoleKey),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, status: res.status, error: body?.msg || body?.message || `HTTP ${res.status}` };
  }
  return { ok: true, status: res.status, id: body.id, email: body.email, password };
}

export async function deleteTestUser({ supabaseUrl, serviceRoleKey, id }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders(serviceRoleKey),
  });
  return { ok: res.ok, status: res.status };
}

/**
 * A REAL session: the password grant the Supabase API itself serves. Records the
 * shape of the response (token lengths, expiry) and never the token value.
 */
export async function passwordGrant({ supabaseUrl, anonKey, email, password }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, status: res.status, error: body?.error_description || body?.msg || `HTTP ${res.status}` };
  }
  return {
    ok: true,
    status: res.status,
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    userId: body.user?.id,
    expiresIn: body.expires_in,
    tokenType: body.token_type,
  };
}

/**
 * Mint the app's OWN session cookies by running @supabase/ssr's server client
 * against an in-memory cookie jar. This is the production encoding, produced by
 * the production library, so the app's reader parses it (chunking included).
 */
export async function mintSsrCookies({ supabaseUrl, anonKey, accessToken, refreshToken }) {
  const { createServerClient } = req("@supabase/ssr");
  const jar = new Map();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (list) => {
        for (const { name, value } of list) {
          if (value === undefined || value === "") jar.delete(name);
          else jar.set(name, value);
        }
      },
    },
  });
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) return { ok: false, error: error.message, cookies: [] };
  return { ok: true, cookies: [...jar.entries()].map(([name, value]) => ({ name, value })), userId: data.session?.user?.id };
}

/** Query the server for the providers/settings it is actually configured with. */
export async function authSettings({ supabaseUrl, anonKey }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: anonKey },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

/** Does the project's email provider accept an OTP request at all? Real HTTP. */
export async function requestEmailOtp({ supabaseUrl, anonKey, email }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, create_user: true }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

/** Raw provider probe: the OAuth redirect route the web app must NOT depend on. */
export async function googleAuthorizeProbe({ supabaseUrl, anonKey }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent("https://sumaiya.app/api/auth/callback")}`, {
    headers: { apikey: anonKey },
    redirect: "manual",
  });
  const text = await res.text().catch(() => "");
  return { status: res.status, body: text.slice(0, 300) };
}

/** The ID-token route the shipped web fix depends on. A fake token must be
 *  rejected for being FAKE ("Bad ID token"), not for the route being missing. */
export async function googleIdTokenProbe({ supabaseUrl, anonKey }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ provider: "google", id_token: "seam-test-not-a-real-token" }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}
