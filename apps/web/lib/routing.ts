// Pure path classification for middleware.ts — no Next/Supabase imports, so
// it's unit-testable. middleware.ts re-exports these.

// Routes that REQUIRE an authenticated user.
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/import-cv",
  "/studio",
  "/admin",
  "/applications",
];

export function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  // Editing a saved document requires auth; guest '/editor/*/try' routes don't.
  if (pathname.startsWith("/editor/") && !pathname.endsWith("/try")) {
    return true;
  }
  return false;
}

// Public marketing routes under app/[locale]/(marketing)/. Keep in sync with
// those folders.
export const MARKETING_PREFIXES = [
  "/pro",
  "/templates",
  "/jobs",
  "/tools",
  "/blog",
  "/pricing",
  "/contact",
  "/about",
  "/terms",
  "/privacy",
  "/cookies",
  "/ats-checker",
  "/snap-to-apply",
  "/preview",
  "/app",
];

export function isMarketingPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

// First URL segment of every route under app/(app)/. A path that is neither
// marketing, nor /api, nor one of these is an UNKNOWN path (typo / stale link /
// a marketing page missing from MARKETING_PREFIXES). There is no root
// app/layout.tsx (two route-group root layouts instead), so an unknown path
// falling through renders with no layout → 500. The middleware rewrites it into
// the [locale] tree so it resolves to a real page or app/[locale]/not-found.tsx.
export const APP_PREFIXES = [
  "/admin",
  "/assistant",
  "/cv",
  "/editor",
  "/interview",
  "/migrate-guest",
  "/snap",
  "/studio",
  "/voice",
  "/applications",
  "/brief",
  "/career-interview",
  "/checkout",
  "/dashboard",
  "/import-cv",
  "/settings",
  "/reset-password",
  "/sign-in",
  "/sign-up",
  "/verify",
];

export function isAppPath(pathname: string): boolean {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** The middleware's routing decision for a path, given the resolved language. */
export type RouteDecision =
  | { kind: "marketing-rewrite"; to: string }
  | { kind: "unknown-rewrite"; to: string }
  | { kind: "passthrough" }
  | { kind: "protected" };

/** A file-like path — has an extension on the last segment. These are static
 * assets from public/ (/sw.js, /manifest.json, /opensearch.xml) or Next file
 * conventions (/robots.txt, /sitemap.xml from robots.ts / sitemap.ts). They
 * must pass through untouched — rewriting them into /[locale] 404s them. */
export function isFileLikePath(pathname: string): boolean {
  const last = pathname.split("/").pop() ?? "";
  return /\.[a-z0-9]{1,8}$/i.test(last);
}

export function classifyRoute(pathname: string, lang: "en" | "sw"): RouteDecision {
  if (isMarketingPath(pathname)) return { kind: "marketing-rewrite", to: `/${lang}${pathname}` };
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !isFileLikePath(pathname) &&
    !isAppPath(pathname)
  ) {
    return { kind: "unknown-rewrite", to: `/${lang}${pathname}` };
  }
  if (isProtectedPath(pathname)) return { kind: "protected" };
  return { kind: "passthrough" };
}

/** The public (browser-visible) Supabase values the Edge middleware needs in
 * order to build a server client. Kept as data so a missing one can be named
 * precisely in the log instead of surfacing as a generic client error. */
export const SUPABASE_PUBLIC_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

/**
 * Which of the public Supabase env vars are missing or empty, given an env bag.
 *
 * Pure, so it is unit-testable. The middleware uses this to refuse to call
 * createServerClient() with an undefined URL/key: that call throws, and Vercel
 * renders an exception thrown in middleware as MIDDLEWARE_INVOCATION_FAILED,
 * which is a 500 on EVERY protected route at once (see middleware.ts).
 */
export function missingSupabasePublicEnv(
  env: Record<string, string | undefined>,
): string[] {
  return SUPABASE_PUBLIC_ENV.filter((key) => !env[key]);
}
