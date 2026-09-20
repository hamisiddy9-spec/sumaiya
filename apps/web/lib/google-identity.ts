/**
 * Google Identity Services (GIS) — the browser half of "Continue with Google".
 *
 * WHY THIS FILE EXISTS (the defect it closes)
 * -------------------------------------------
 * The web app used `supabase.auth.signInWithOAuth({ provider: "google" })`.
 * That route sends the browser to
 *
 *   https://<project>.supabase.co/auth/v1/authorize?provider=google
 *
 * and Supabase then completes the OAuth exchange itself — which requires the
 * Google **client secret** to be stored in the Supabase project. This project
 * has no secret configured (owner-only action, deliberately not ours to type),
 * so the endpoint answers every single request with
 *
 *   {"code":400,"error_code":"validation_failed","msg":"Unsupported provider:
 *    missing OAuth secret"}
 *
 * Reproduced 2026-09-20 with curl: HTTP 400, exactly that body.
 *
 * The native app never had this problem: `@react-native-google-signin` talks to
 * Google DIRECTLY, receives an ID token, and hands that token to Supabase via
 * `signInWithIdToken()`. No secret involved — Supabase only verifies a token
 * Google signed.
 *
 * This module gives the browser the same shape: GIS mints the ID token, and
 * `lib/auth-client.ts` passes it to `signInWithIdToken()`. Web and native now
 * share one mechanism, and there is no Supabase-hosted secret to forget.
 * `lib/signin-mechanism-parity.test.ts` fails if the two paths drift apart again.
 *
 * All of the DOM is injected, so every branch here is unit-testable in plain
 * node (the test suite runs without jsdom).
 */

/** The GIS loader. Must be in `script-src` AND its iframe in `frame-src` (see lib/security/csp.mjs). */
export const GOOGLE_GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const SCRIPT_ID = "google-identity-services";

/**
 * The Google Cloud **Web** OAuth client ID — public by design, it ships in the
 * bundle of every site that offers Google sign-in. It is the SAME client ID
 * Supabase has configured for the Google provider and the same one the native
 * app passes to `GoogleSignin.configure({ webClientId })`, so an ID token minted
 * against it is accepted by `signInWithIdToken()`.
 *
 * The literal is the fallback on purpose: the deployed web app has no
 * `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set (verified: apps/web/.env.local holds only
 * DATABASE_URL), and a sign-in button that dies on a missing env var is exactly
 * the failure class this file exists to remove. Set the env var to override.
 */
const FALLBACK_GOOGLE_CLIENT_ID =
  "811013224847-1g6ml0490hhfngrips635ropm8tka4ep.apps.googleusercontent.com";

export const GOOGLE_CLIENT_ID = (
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID
).trim();

/**
 * Shape check for a Web OAuth client ID. Uses `||` + `.trim()` (never `??`)
 * because an empty string is a real value to `??` — the dead-fallback bug that
 * silently stripped the Supabase anon key out of a shipped APK.
 */
export function googleClientIdIsConfigured(clientId: string = GOOGLE_CLIENT_ID): boolean {
  return /^\d{6,}-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(clientId.trim());
}

/** Why an ID token could not be obtained. The UI maps this to localized copy. */
export type GoogleIdTokenFailure =
  | "not_configured" // no usable client ID
  | "script_unavailable" // GIS client script could not be loaded (offline / blocked)
  | "not_supported" // the browser refused to show the Google sheet
  | "dismissed" // the user closed the sheet
  | "timeout"; // Google never answered

export type GoogleIdTokenOutcome =
  | { ok: true; token: string; clientId: string }
  | { ok: false; reason: GoogleIdTokenFailure; message: string };

/** Just the pieces of GIS we call. Structural, so tests can double them. */
export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

export interface GooglePromptNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
}

export interface GoogleAccountsIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    use_fedcm_for_prompt?: boolean;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    nonce?: string;
  }) => void;
  prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
  cancel?: () => void;
}

export interface GoogleIdentityWindowLike {
  google?: { accounts?: { id?: GoogleAccountsIdApi } };
}

export interface GoogleScriptElementLike {
  id?: string;
  src?: string;
  async?: boolean;
  defer?: boolean;
  onload?: (() => void) | null;
  onerror?: ((event?: unknown) => void) | null;
}

export interface GoogleIdentityDocumentLike {
  getElementById(id: string): GoogleScriptElementLike | null;
  createElement(tagName: string): GoogleScriptElementLike;
  head: { appendChild(node: GoogleScriptElementLike): void };
}

/** How long we wait for the user to pick an account before giving up. */
export const DEFAULT_TIMEOUT_MS = 120_000;

/** The GIS API, if the client script is already on the page. */
export function googleIdentityApi(
  win: GoogleIdentityWindowLike,
): GoogleAccountsIdApi | null {
  return win.google?.accounts?.id ?? null;
}

/**
 * Inject the GIS client script once. Resolves true when it is ready to use.
 * Never rejects: a blocked or offline script must degrade to "use email
 * instead", not to an unhandled rejection inside a click handler.
 */
export function loadGoogleIdentityScript(
  doc: GoogleIdentityDocumentLike,
  timeoutMs = 10_000,
): Promise<boolean> {
  if (doc.getElementById(SCRIPT_ID)) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    const script = doc.createElement("script");
    script.id = SCRIPT_ID;
    script.src = GOOGLE_GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    try {
      doc.head.appendChild(script);
    } catch {
      finish(false);
      return;
    }
    setTimeout(() => finish(false), timeoutMs);
  });
}

/**
 * Ask Google for an ID token, in the browser, without involving Supabase.
 *
 * The caller (lib/auth-client.ts) hands the token straight to
 * `supabase.auth.signInWithIdToken({ provider: "google", token })`.
 */
export async function requestGoogleIdToken(
  opts: {
    clientId?: string;
    win?: GoogleIdentityWindowLike;
    doc?: GoogleIdentityDocumentLike | null;
    timeoutMs?: number;
    nonce?: string;
  } = {},
): Promise<GoogleIdTokenOutcome> {
  const clientId = (opts.clientId ?? GOOGLE_CLIENT_ID).trim();
  if (!googleClientIdIsConfigured(clientId)) {
    return {
      ok: false,
      reason: "not_configured",
      message: `Google sign-in is not configured (client id: "${clientId || "(empty)"}")`,
    };
  }

  const win =
    opts.win ??
    (globalThis as unknown as GoogleIdentityWindowLike);
  const doc =
    opts.doc ??
    (typeof document !== "undefined"
      ? (document as unknown as GoogleIdentityDocumentLike)
      : null);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let api = googleIdentityApi(win);
  if (!api) {
    if (!doc) {
      return {
        ok: false,
        reason: "script_unavailable",
        message: "Google Identity Services cannot load outside a browser document",
      };
    }
    const loaded = await loadGoogleIdentityScript(doc);
    api = googleIdentityApi(win);
    if (!loaded || !api) {
      return {
        ok: false,
        reason: "script_unavailable",
        message: `Could not load ${GOOGLE_GIS_SCRIPT_SRC}`,
      };
    }
  }

  return await new Promise<GoogleIdTokenOutcome>((resolve) => {
    let settled = false;
    const finish = (outcome: GoogleIdTokenOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(outcome);
    };
    const timer = setTimeout(
      () => finish({ ok: false, reason: "timeout", message: "Google did not answer in time" }),
      timeoutMs,
    );

    try {
      api!.initialize({
        client_id: clientId,
        // FedCM is the current Google-supported prompt transport; without it
        // Chrome logs a deprecation and, in third-party-cookie-blocked
        // contexts, the One Tap sheet silently never appears.
        use_fedcm_for_prompt: true,
        auto_select: false,
        cancel_on_tap_outside: true,
        ...(opts.nonce ? { nonce: opts.nonce } : {}),
        callback: (response) => {
          if (response?.credential) {
            finish({ ok: true, token: response.credential, clientId });
            return;
          }
          finish({
            ok: false,
            reason: "not_supported",
            message: "Google Identity Services returned no credential",
          });
        },
      });

      api!.prompt((notification) => {
        if (!notification) return;
        if (notification.isNotDisplayed?.()) {
          finish({
            ok: false,
            reason: "not_supported",
            message: `Google prompt not displayed (${notification.getNotDisplayedReason?.() ?? "unknown_reason"})`,
          });
          return;
        }
        if (notification.isSkippedMoment?.()) {
          finish({
            ok: false,
            reason: "dismissed",
            message: `Google prompt skipped (${notification.getSkippedReason?.() ?? "unknown_reason"})`,
          });
          return;
        }
        if (notification.isDismissedMoment?.()) {
          finish({
            ok: false,
            reason: "dismissed",
            message: `Google prompt dismissed (${notification.getDismissedReason?.() ?? "unknown_reason"})`,
          });
        }
      });
    } catch (err) {
      finish({
        ok: false,
        reason: "not_supported",
        message: err instanceof Error ? err.message : "Google Identity Services failed to start",
      });
    }
  });
}
