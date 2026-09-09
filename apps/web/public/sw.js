/**
 * Sumaiya service worker — offline caching.
 *
 * Strategy (careful by design):
 *  - Versioned cache (su-cache-vN); activate() deletes every older cache.
 *  - HTML documents: NETWORK-FIRST with cache fallback. Stale HTML is never
 *    served while online — language (lang cookie) and CDN freshness (#238)
 *    must always come from the network; the cache is only the offline
 *    fallback. Authenticated HTML is NEVER cached (per-user data must not
 *    leak across users on a shared device).
 *  - /api/* : NETWORK-ONLY, never cached. These carry per-user data —
 *    non-negotiable.
 *  - Static assets (_next/static/*, images, fonts): STALE-WHILE-REVALIDATE —
 *    instant offline loads, refreshed in the background.
 *  - Offline editor: /editor/cv/try (guest editor) shell + JS are cached at
 *    runtime, so a CV can be built with no connection (guest CVs persist in
 *    localStorage and autosave retries).
 *
 * Update flow: skipWaiting() + clients.claim() — a new SW takes over
 * immediately on deploy (auto-update).
 */

const SU_CACHE = "su-cache-v1";
const OFFLINE_URL = "/offline.html";

/** Stable shell assets (no build hashes) precached at install time. */
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

/**
 * HTML paths that must NEVER be cached. These render authenticated,
 * per-user content server-side; serving a stale copy to another user on a
 * shared device would leak data. /editor/* is authenticated EXCEPT the
 * guest editor /editor/cv/try (the offline CV-building win).
 */
const AUTH_HTML_PREFIXES = ["/dashboard", "/settings", "/import-cv", "/studio"];

function isAuthHtmlPath(pathname) {
  if (AUTH_HTML_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // All editors require auth except the guest try editor.
  if (pathname === "/editor" || pathname.startsWith("/editor/")) {
    return !(pathname === "/editor/cv/try");
  }
  return false;
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  const p = url.pathname;
  if (p.startsWith("/_next/static/")) return true;
  if (p.startsWith("/_next/image")) return true; // Next.js optimized images
  if (p === "/favicon.ico") return true;
  if (/\.(png|jpe?g|svg|webp|gif|avif|ico)(\?|$)/.test(p)) return true;
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/.test(p)) return true;
  return false;
}

/** HTML: network first, cache fallback, then the branded offline page. */
async function networkFirstHtml(request, pathname) {
  try {
    const res = await fetch(request);
    if (
      res &&
      res.ok &&
      res.type === "basic" &&
      !res.redirected &&
      (res.headers.get("content-type") || "").includes("text/html") &&
      !isAuthHtmlPath(pathname)
    ) {
      const clone = res.clone();
      const cache = await caches.open(SU_CACHE);
      cache.put(request, clone).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/** Static assets: serve cache instantly, refresh in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(SU_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type === "basic") {
        cache.put(request, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => cached); // offline: serve the stale copy
  return cached || network;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SU_CACHE);
      // Individual adds (allSettled) so one 404 cannot fail the whole precache.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SU_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return; // cross-origin (analytics, CDNs) — default

  // Per-user data — NEVER cached (non-negotiable).
  if (url.pathname.startsWith("/api/")) return;

  // HTML document loads: network-first, cache only as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstHtml(request, url.pathname));
    return;
  }

  // Static assets, images, fonts: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Anything else same-origin GET (sitemap, robots, data files): network-only.
});

// ─── Web push (blueprint Stage 5) ────────────────────────────────────────────
// Payload: { title, body, url, tag }. Chrome revokes push if a received push
// shows no notification, so every push here is userVisibleOnly.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = data.title || "Sumaiya";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
