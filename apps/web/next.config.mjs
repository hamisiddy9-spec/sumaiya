// Content-Security-Policy. A source-allowlist policy covering every resource the
// app actually loads — verified against the running app so it doesn't break
// features:
//   - script:  self + inline (Next.js bootstrap) + wasm-eval (tesseract OCR core)
//              + cdn.jsdelivr.net (tesseract worker/core) + unsafe-eval in DEV
//              only (Next's react-refresh runtime evaluates strings for HMR —
//              without it `next dev` hydration fails on every page)
//   - connect: self (+ Vercel Analytics same-origin beacons) + *.supabase.co
//              (+wss realtime) + cdn.jsdelivr.net (tesseract wasm + traineddata)
//   - worker:  self + blob: (pdfjs + tesseract web-workers)
//   - img:     self + data: + blob: + *.supabase.co (storage) + Google avatars
//   - style/font: self + inline styles (templates) + self-hosted next/font
// script-src keeps 'unsafe-inline' rather than a nonce: Next's inline bootstrap
// makes a nonce/strict-dynamic policy fragile, and the host allowlist already
// blocks off-origin script injection.
import { buildCsp } from "./lib/security/csp.mjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: buildCsp(process.env.NODE_ENV !== "production") },
];

// Same switch as lib/features.ts (strictly the string "true").
const PAYMENTS_UI_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: the @sumaiya/* workspace packages ship TS source, so Next must
  // transpile them (webpack does not touch node_modules by default).
  transpilePackages: [
    "@sumaiya/types",
    "@sumaiya/core",
    "@sumaiya/analytics",
    "@sumaiya/utils",
    "@sumaiya/hooks",
    "@sumaiya/api-client",
    "@sumaiya/templates",
    "@sumaiya/design-tokens",
  ],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Friendly redirects for common typed shorthands that aren't real routes.
    // Without this, "/ats" fell through the [locale] catch-all and rendered a
    // soft-404 (200 + homepage shell) instead of reaching the ATS checker.
    return [
      { source: "/ats", destination: "/ats-checker", permanent: true },
      // "Ajira" is the Swahili word for jobs, and Swahili is the default
      // language — printed/QR material and users type /ajira expecting the
      // jobs board, but no such route exists, so it 404s. Send it to the real
      // route (/jobs, which renders the Swahili title "Ajira Zinazolingana na
      // CV Yako") instead.
      { source: "/ajira", destination: "/jobs", permanent: true },
      { source: "/:locale(en|sw)/ajira", destination: "/:locale/jobs", permanent: true },
      // While payments are dark (everything is free) pricing / checkout send
      // stale links home rather than 404. Once NEXT_PUBLIC_PAYMENTS_ENABLED is
      // "true" the real pages must be reachable, so the redirects drop out.
      ...(PAYMENTS_UI_ENABLED
        ? []
        : [
            { source: "/pricing", destination: "/", permanent: false },
            { source: "/:locale(en|sw)/pricing", destination: "/:locale", permanent: false },
            { source: "/checkout", destination: "/dashboard", permanent: false },
            { source: "/:locale(en|sw)/checkout", destination: "/dashboard", permanent: false },
          ]),
      // The native-app download page was retired (PWA is the mobile experience
      // for now). Send stale /app links and bookmarks home.
      { source: "/app", destination: "/", permanent: false },
      { source: "/:locale(en|sw)/app", destination: "/:locale", permanent: false },
      // Backward-compatible APK link. The source repo is private, so release
      // assets there 404 for logged-out visitors; public builds live on the
      // PUBLIC releases repo (hamisiddy9-spec/sumaiya-releases). Older
      // CTAs may still point at templatehub.pro/downloads/sumaiya.apk —
      // redirect them to the public asset. (No static file exists at that
      // path anymore; the binary was removed from the repo.)
      {
        source: "/downloads/sumaiya.apk",
        destination:
          "https://github.com/hamisiddy9-spec/sumaiya-releases/releases/latest/download/sumaiya.apk",
        permanent: true,
      },
      // Sign-in aliases. The real auth route lives OUTSIDE the [locale] tree
      // (app/(app)/(auth)/sign-in → "/sign-in"), so the localized and shorthand
      // spellings — /en/signin, /en/sign-in, /signin, /login — all fell through
      // to a hard 404 even though the page exists one segment away. /sw and /en
      // are excluded from the middleware matcher, so these redirects are what
      // makes the locale variants resolve. `/sign-in` and `/sign-up` are real
      // routes and are deliberately NOT matched here (no redirect loop).
      { source: "/signin", destination: "/sign-in", permanent: false },
      { source: "/login", destination: "/sign-in", permanent: false },
      { source: "/:locale(en|sw)/signin", destination: "/sign-in", permanent: false },
      { source: "/:locale(en|sw)/sign-in", destination: "/sign-in", permanent: false },
    ];
  },
  experimental: {
    // Serialize static page generation. This box has 7.6GB RAM and the default
    // parallel workers OOM while prerendering the 273 template pages. Slower
    // build, far lower peak memory. CI can raise this.
    workerThreads: false,
    cpus: Number(process.env.NEXT_BUILD_CPUS ?? 1),
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 10000,
    // postgres must not be webpack-bundled (it relies on a runtime require of
    // optional native bits). (pdfjs-dist is now used ONLY client-side for the
    // in-browser CV import, so it must NOT be listed here — externalizing it
    // breaks the client worker asset resolution.)
    serverComponentsExternalPackages: ["postgres"],
    // Enable instrumentation.ts register() so we can validate env vars at boot.
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
