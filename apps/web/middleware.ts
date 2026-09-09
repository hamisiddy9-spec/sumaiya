import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Route prefixes that REQUIRE an authenticated user. Everything else (the whole
// marketing site, the PDF tools, the guest builders at /editor/*/try, and every
// /api/* route — which authenticate themselves via a Bearer token, not the
// cookie session) passes through untouched.
//
// This replaces an earlier denylist that gated "everything not public". That
// list contained "/" and was matched with startsWith(), so it matched EVERY
// path — the auth gate below it was dead code, and page-level guards were the
// only real protection. An allowlist is both correct and far safer: it can never
// accidentally lock a visitor out of a public page or break an API call.
// NOTE: "/assistant" is intentionally NOT here — it serves guests too. The page
// itself branches on auth (guest CV builder vs. authed profile-aware assistant),
// so gating it in middleware would redirect guests to sign-in before that logic
// ever runs, breaking guest mode.
const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/import-cv", "/studio", "/admin", "/applications"];

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  // Editing a saved document requires auth; the guest '/editor/*/try' routes do
  // not (they build in localStorage and migrate on sign-in).
  if (pathname.startsWith("/editor/") && !pathname.endsWith("/try")) {
    return true;
  }
  return false;
}

// Public marketing routes that live under app/[locale]/ — the middleware
// rewrites them to /[locale]<path> so the language comes from the URL segment
// (static/ISR pages) instead of per-request headers. MUST stay in sync with
// the folders under app/[locale]/(marketing)/.
const MARKETING_PREFIXES = [
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
  // /app — native-app landing page under app/[locale]/(marketing)/app/.
  // MUST be here or the bare path falls through to the dynamic (app) subtree
  // (no folder at app/app) → 500, while /sw/app + /en/app (static locale
  // prerenders, excluded from the matcher) keep working. Live repro 2026-09:
  // sumaiya.pro/app → 500; /sw/app + /en/app → 200.
  "/app",
];

function isMarketingPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

// ─── CDN CACHING — verified against the live site, Aug 2026 ────────────────
// Vercel does NOT cache HTML responses that pass through middleware when the
// middleware modifies REQUEST headers. Every public page (bare AND /sw//en/
// locale paths) was served with `cache-control: private, no-cache, no-store`
// and `x-vercel-cache: MISS` on every hit, because the middleware forwarded a
// modified `x-lang` request header for ALL paths — and a route whose request
// headers are mutated cannot be served from the static prerender, so Next.js
// re-renders it dynamically and its `private,no-cache,no-store` header wins
// over anything the middleware sets on the response.
//
// The fix has three parts:
//  1. The marketing rewrite is now a PURE rewrite (no request-header mutation).
//     The [locale] pages resolve the language from the URL segment
//     (params.locale) — they never read `headers()`. With untouched request
//     headers, Vercel serves the static prerender and the CDN caches it.
//  2. /sw/* and /en/* paths are EXCLUDED from the middleware matcher entirely —
//     they are already locale-correct static prerenders and need no middleware.
//  3. `x-lang` is only forwarded on the dynamic (app) subtree paths that
//     actually read it (dashboard, settings, assistant, editor try pages) —
//     those routes are inherently dynamic (auth + per-user data), so the
//     mutation costs them nothing.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read language preference from cookie early, used for all paths.
  // Swahili is the primary language — default to it unless the visitor has
  // explicitly chosen English.
  const langCookie = request.cookies.get("lang")?.value;
  const lang = langCookie === "en" ? "en" : "sw";

  // PUBLIC marketing surface → pure rewrite to the locale path. The URL bar
  // keeps showing the clean path (e.g. /templates/rift) while the app renders
  // /sw/templates/rift or /en/templates/rift — each of which is a statically
  // prerendered page. The rewrite also means crawlers and shared links always
  // resolve to the Swahili default unless the visitor chose English.
  //
  // NOTE: NO request-header mutation here (see CDN CACHING comment above).
  // `x-lang` is NOT forwarded for marketing paths — the [locale] tree resolves
  // lang from the URL segment, so nothing reads it. Keeping the request
  // untouched lets Vercel serve the prerendered HTML from cache.
  //
  // Tradeoff: the bare path serves /sw/ OR /en/ content depending on the
  // `lang` COOKIE, so an aggressive CDN cache could serve the wrong language
  // to a visitor who flipped the cookie. We therefore cache bare paths for
  // only 5 minutes (most visitors share the default lang; a language flip sees
  // at most 5 min of stale HTML, and the page carries an in-page language
  // toggle), then revalidate in the background for 10 min. `max-age=0` keeps
  // browsers revalidating so the cookie change is picked up on the next visit.
  // The /sw/ and /en/ locale paths (excluded from the matcher, served as pure
  // static prerenders) get Vercel's long static cache.
  if (isMarketingPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}${pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
    return response;
  }

  // Everything below this point is NOT a marketing path — it is the dynamic
  // (app) subtree (or a protected route), which reads `x-lang` via headers().
  // Forward the language on the REQUEST headers so Server Components can read
  // it. These routes are inherently dynamic (auth + per-user data), so the
  // request-header mutation does not cost them static caching.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lang", lang);

  if (!isProtectedPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() verifies the JWT with the Supabase auth server, unlike getSession()
  // which trusts whatever is in the cookie. Supabase recommends getUser for any
  // server-side gate. Token refresh still propagates via setAll → `response`.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const signInUrl = new URL("/sign-in", request.url);
    const cbPath = pathname + (request.nextUrl.search ?? "");
    signInUrl.searchParams.set("callbackUrl", cbPath);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  // /sw and /en (and their subtrees) are static locale prerenders that need no
  // middleware — exclude them so Vercel serves them straight from the static
  // cache. Everything else (bare marketing paths needing the i18n rewrite, the
  // (app) subtree needing auth + x-lang) still matches.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.webp|sw(?:$|/)|en(?:$|/)).*)"],
};
