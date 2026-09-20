/**
 * Canonical-host redirect.
 *
 * Why this exists: the Vercel project `sumaiya-web` has three live domains —
 * sumaiya.app, www.sumaiya.app, and the raw deployment host
 * sumaiya-web.vercel.app. Only www redirects at the Vercel level; the raw
 * `.vercel.app` host (and the legacy `sumaiyaai.vercel.app` project alias)
 * serve the entire product with no redirect at all. That means the whole app
 * — auth included — is reachable at an unbranded, uncanonical URL that leaks
 * into search results, shared links and referrer headers instead of
 * sumaiya.app.
 *
 * The allowlist below is deliberately NOT `*.vercel.app`: Vercel preview
 * deployments (`sumaiya-web-git-<branch>-<team>.vercel.app`) must keep
 * resolving on their own host for PR review and QA — redirecting them to
 * production would make it impossible to preview a change before it ships.
 */

export const CANONICAL_ORIGIN = "https://sumaiya.app";

const REDIRECT_HOSTS = new Set([
  "sumaiya-web.vercel.app",
  "sumaiyaai.vercel.app",
  "www.sumaiya.app",
]);

/**
 * Returns the absolute canonical URL to redirect to, or `null` if the
 * request is already on a canonical (or unrecognized/preview) host and
 * should be served as-is.
 */
export function canonicalHostRedirect(
  hostHeader: string | null,
  pathname: string,
  search: string,
): string | null {
  if (!hostHeader) return null;

  const host = hostHeader.split(":")[0].toLowerCase();
  if (!REDIRECT_HOSTS.has(host)) return null;

  return `${CANONICAL_ORIGIN}${pathname}${search}`;
}
