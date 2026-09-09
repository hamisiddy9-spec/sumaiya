import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Static contract test for public/sw.js. The worker is a plain static file
 * (no build step), so we assert the NON-NEGOTIABLE invariants against its
 * source: versioned cache, /api/* never cached, network-first HTML, stale-
 * while-revalidate static, auth HTML never cached. If a future rewrite drops
 * one of these, this test fails loudly.
 */
const sw = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

describe("service worker contract", () => {
  it("uses a versioned cache name", () => {
    expect(sw).toMatch(/su-cache-v\d+/);
  });

  it("deletes old cache versions on activate", () => {
    expect(sw).toMatch(/caches\.keys\(\)/);
    expect(sw).toMatch(/caches\.delete\(/);
  });

  it("never caches /api/* — network only (per-user data, non-negotiable)", () => {
    expect(sw).toMatch(/pathname\.startsWith\("\/api\/"\)/);
  });

  it("serves HTML network-first with cache fallback (never stale HTML)", () => {
    expect(sw).toMatch(/mode === "navigate"/);
    expect(sw).toMatch(/networkFirstHtml/);
    // The offline fallback chain must exist (cached shell → offline page).
    expect(sw).toMatch(/caches\.match\(request, \{ ignoreSearch: true \}\)/);
    expect(sw).toMatch(/OFFLINE_URL/);
  });

  it("precaches the branded offline fallback page", () => {
    expect(sw).toMatch(/offline\.html/);
    expect(sw).toMatch(/PRECACHE/);
  });

  it("never caches authenticated HTML (dashboard/settings/import-cv/editor)", () => {
    expect(sw).toMatch(/AUTH_HTML_PREFIXES/);
    expect(sw).toMatch(/\/dashboard/);
    expect(sw).toMatch(/\/settings/);
  });

  it("keeps the guest editor /editor/cv/try cacheable (offline win)", () => {
    expect(sw).toMatch(/editor\/cv\/try/);
  });

  it("uses stale-while-revalidate for static assets (_next/static, images, fonts)", () => {
    expect(sw).toMatch(/staleWhileRevalidate/);
    expect(sw).toMatch(/_next\/static/);
  });

  it("skips non-GET requests and cross-origin requests", () => {
    expect(sw).toMatch(/request\.method !== "GET"/);
    expect(sw).toMatch(/isSameOrigin/);
  });

  it("keeps the auto-update flow (skipWaiting + clients.claim)", () => {
    expect(sw).toMatch(/skipWaiting\(\)/);
    expect(sw).toMatch(/clients\.claim\(\)/);
  });
});
