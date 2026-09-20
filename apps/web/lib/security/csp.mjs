// Content-Security-Policy builder — pure function so it's unit-testable.
//
// `unsafe-eval` is REQUIRED by Next.js's react-refresh runtime in DEV mode
// (it evaluates strings for hot reload). The old static CSP omitted it, which
// made `next dev` completely dead: react-refresh threw an EvalError, hydration
// failed on every page, and no interactive component worked (typing never
// reached React state, send buttons stayed disabled). Production never gets
// `unsafe-eval` — the allowlist stays strict there.

export function buildCsp(dev = false) {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Next.js inline bootstrap
    "'wasm-unsafe-eval'", // tesseract OCR core
    "https://cdn.jsdelivr.net", // tesseract worker/core
    "https://connect.facebook.net", // Meta Pixel (inert unless NEXT_PUBLIC_META_PIXEL_ID)
    "https://accounts.google.com", // Google Identity Services client (gsi/client)
    "https://us-assets.i.posthog.com", // posthog-js loader (array.js / config.js)
    "https://eu-assets.i.posthog.com",
    ...(dev ? ["'unsafe-eval'"] : []), // react-refresh runtime — dev only
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // GIS also pulls its own stylesheet (accounts.google.com/gsi/style) — without
    // this origin in style-src the prompt renders unstyled and the console shows a
    // CSP violation. Found by driving the real page, not by reading the spec.
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://www.facebook.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://accounts.google.com https://www.facebook.com https://us.i.posthog.com https://us-assets.i.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com",
    // Google Identity Services renders its account sheet in an accounts.google.com
    // iframe. There was no frame-src before, so `default-src 'self'` applied and
    // the sheet was blocked — the button would fail with a CSP console error and
    // no visible reason. (Google sign-in must NOT go through Supabase: see
    // lib/google-identity.ts.)
    "frame-src 'self' https://accounts.google.com",
    "worker-src 'self' blob: https://cdn.jsdelivr.net",
    "manifest-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
