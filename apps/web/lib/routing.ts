// Pure path classification for middleware.ts — no Next/Supabase imports, so
// it's unit-testable. middleware.ts re-exports these.

// ─── HOST SPLIT — two products, one deployment ─────────────────────────────
// sumaiya.app is the Sumaiya assistant. templatehub.pro is the TemplateHub
// half: the template catalog, the free document tools and the basic editor,
// with no assistant.
//
// This is a ROUTING decision, not a second deployment. The shipped Android
// build (pro.sumaiya.app 1.6.11) still has www.templatehub.pro baked in as BOTH
// its API base and its Android App Links host, so templatehub.pro must keep
// serving /api/* and /.well-known/assetlinks.json for as long as that build is
// in the wild. Everything this split divides is a *page*; nothing it divides is
// an endpoint.
export const SUMAIYA_HOST = "sumaiya.app";
export const TEMPLATEHUB_HOST = "templatehub.pro";

/**
 * What templatehub.pro serves at its root.
 *
 * `/pro` is the TemplateHub Pro landing — the catalog-forward page the domain
 * was always meant to show. Keep this in sync with
 * `app/[locale]/(marketing)/pro/page.tsx`.
 */
export const TEMPLATEHUB_LANDING = "/pro";

/** Lowercase, drop the port and a trailing root dot, and drop `www.`. */
export function normalizeHost(host?: string | null): string {
  if (!host) return "";
  const bare = host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return bare.startsWith("www.") ? bare.slice(4) : bare;
}

/**
 * Is this request for the TemplateHub product?
 *
 * Only an exact match counts. A Vercel preview URL, `localhost`, an IP, or the
 * sumaiya.app hosts are all "not TemplateHub" and get the full app — which is
 * the safe default, because every surface works there.
 */
export function isTemplateHubHost(host?: string | null): boolean {
  return normalizeHost(host) === TEMPLATEHUB_HOST;
}

/**
 * The surfaces that ARE the assistant product.
 *
 * templatehub.pro forwards these to sumaiya.app rather than rendering them: a
 * visitor who asked for the assistant should land in the app that has one, not
 * on a catalog page that half-works. Deliberately only real app subtrees —
 * /cv, /editor, /sign-in, /settings and /admin are shared plumbing and stay on
 * both hosts.
 */
export const ASSISTANT_ONLY_PREFIXES = [
  "/assistant",
  "/studio",
  "/voice",
  "/interview",
  "/career-interview",
  "/snap",
  "/dashboard",
  "/brief",
  "/applications",
  "/migrate-guest",
];

export function isAssistantOnlyPath(pathname: string): boolean {
  return ASSISTANT_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

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
  | { kind: "cross-host"; to: string }
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

export function classifyRoute(
  pathname: string,
  lang: "en" | "sw",
  host?: string | null,
): RouteDecision {
  // templatehub.pro has no assistant. Hand those surfaces to the host that does
  // — a redirect, not a 404, so a stale bookmark or a shared link still lands
  // somewhere useful instead of dead-ending.
  if (isTemplateHubHost(host) && isAssistantOnlyPath(pathname)) {
    return { kind: "cross-host", to: `https://${SUMAIYA_HOST}${pathname}` };
  }
  // ...and its own front door is the TemplateHub landing, not Sumaiya's. This
  // lives here rather than in vercel.json's `has: host` rewrite because
  // middleware runs first for bare paths: the marketing branch below rewrote
  // `/` to /sw before that rewrite could ever see it, so templatehub.pro served
  // the Sumaiya landing on the TemplateHub domain.
  if (pathname === "/" && isTemplateHubHost(host)) {
    return { kind: "marketing-rewrite", to: `/${lang}${TEMPLATEHUB_LANDING}` };
  }
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
