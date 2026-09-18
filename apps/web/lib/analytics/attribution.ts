/**
 * Campaign attribution — which printed thing brought this person here.
 *
 * THE QUESTION THIS ANSWERS
 * The poster on a shop noticeboard carries a QR. Before this file, a scan
 * landed on the same URL as every organic visitor, so "did anyone who scanned
 * the poster actually install the app?" was unanswerable: the funnel had no
 * idea the poster existed. Now the QR lands on /ats-checker?src=poster, the
 * source is captured here, and lib/analytics attaches it to every event the
 * product emits — so a scan is visible at every step it can reach:
 * ats_checked → sign_in_completed → pwa_installed.
 *
 * WHY localStorage AND NOT A COOKIE
 *   - The only consumer is the browser. Events are captured client-side by
 *     PostHog (see lib/analytics/index.ts), so a cookie's one real advantage —
 *     being readable by the server on the next request — buys nothing today.
 *   - A cookie would be a tracking cookie in the EU/UK sense, which pulls the
 *     consent question into a measurement we can take without it; localStorage
 *     is also invisible to the server, so it cannot leak into a cache key or a
 *     Vercel log line the way a query string or cookie can.
 *   - Lifetime is the same for our case: localStorage survives client-side
 *     navigation and the full-page Google / magic-link round-trips, because
 *     those return to the same origin. (A click on an emailed magic link in a
 *     different browser profile loses it — a cookie would too.)
 * If attribution is ever needed server-side (for example to stamp it on the
 * signup row), add a first-party cookie read in `browserStorage()` below — the
 * getters here are the only access path, so it stays a one-file change.
 *
 * FIRST TOUCH WINS, AND WHY
 * A stored source is never overwritten by a later `?src=`. The campaign a
 * person arrived with is the cohort that acquired them; a second poster seen
 * on a later day should not quietly re-attribute the install. There is also no
 * expiry, which is the honest trade: an install six months after the scan still
 * counts as poster-attributed. If a time window is ever wanted, store
 * `{ src, at }` here and expire in `readPersisted()`.
 *
 * SAFETY CONTRACT (analytics must never break a user action)
 *   - no `?src=` at all     → null, nothing written
 *   - junk (`?src=`, `?src=%%%`) → null
 *   - oversized / injection-looking → sanitized slug, or null if nothing survives
 *   - storage blocked (private mode, cookies off, sandboxed iframe) → the value
 *     is still read from the URL and kept in memory for the session; no throw
 *   - server / SSR          → every function returns its empty value, no throw
 */
import type { AttributionProps, CampaignSource } from "./events";

/** The query parameter printed material carries: `…?src=poster`. */
export const ATTRIBUTION_PARAM = "src";

/** Key the source is persisted under (first-party, this origin only). */
export const ATTRIBUTION_STORAGE_KEY = "sumaiya.attribution.src";

/**
 * Key the anonymous visitor id is persisted under.
 *
 * A campaign funnel counts PEOPLE, not page loads, and the server cannot count
 * people it cannot tell apart. This is a random id this origin generates once
 * and reuses — never derived from anything about the person, never sent to
 * PostHog, and never joined to a user account. It exists so "12 scans" means 12
 * browsers rather than 12 page loads from one bored tester.
 */
export const VISITOR_STORAGE_KEY = "sumaiya.attribution.vid";

/**
 * Longest source we keep. A campaign tag is a short slug — `poster`,
 * `flyer-boda`, `shop-kariakoo-3`. Anything longer is a broken link or someone
 * poking at the URL, and every emitted event would carry the whole thing.
 */
export const MAX_CAMPAIGN_SOURCE_LENGTH = 64;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Session fallback, used when storage is unavailable (private mode). */
let sessionSource: CampaignSource | null = null;

/**
 * Storage, or null when the browser will not give it to us. The *access* can
 * throw (Storage is behind cookies in some browsers, and is disabled inside
 * sandboxed iframes), not just the writes — so the property read is inside the
 * try too.
 */
function browserStorage(): StorageLike | null {
  try {
    const g = globalThis as typeof globalThis & { localStorage?: StorageLike };
    const ls = g.localStorage;
    return ls && typeof ls.getItem === "function" ? ls : null;
  } catch {
    return null;
  }
}

/**
 * Turn whatever arrived in the URL into a slug we are willing to store and
 * send. Campaign tags are lowercase by convention, so `?src=Poster` and
 * `?src=poster` are one cohort instead of two.
 *
 * Everything outside `[a-z0-9._-]` — spaces, quotes, `<>`, `%`-escapes that
 * failed to decode — becomes a separator, so `"><script>alert(1)</script>`
 * arrives at PostHog as `script-alert-1-script`. That value is never rendered
 * as markup anywhere, but a campaign tag is attacker-controllable (any link
 * can carry it) and this is a bound we can state plainly.
 */
export function sanitizeCampaignSource(
  raw: string | null | undefined,
): CampaignSource | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+/, "")
    .replace(/[-._]+$/, "")
    .slice(0, MAX_CAMPAIGN_SOURCE_LENGTH)
    // Truncation can re-expose a trailing separator.
    .replace(/[-._]+$/, "");
  return cleaned.length ? cleaned : null;
}

/**
 * Read `src` out of a raw query string. URLSearchParams is the parser the
 * browser itself uses: it does not throw on junk, and it decodes `%20`/`+`
 * the way the rest of the web does.
 */
export function readSrcFromSearch(search: string): CampaignSource | null {
  if (!search) return null;
  try {
    const query = search.startsWith("?") || search.startsWith("&")
      ? search
      : `?${search}`;
    return sanitizeCampaignSource(new URLSearchParams(query).get(ATTRIBUTION_PARAM));
  } catch {
    return null;
  }
}

/** The query string of the current page, or "" on the server. */
function currentSearch(explicit?: string): string {
  if (typeof explicit === "string") return explicit;
  try {
    const g = globalThis as typeof globalThis & {
      location?: { search?: string };
    };
    const loc = g.location;
    return typeof loc?.search === "string" ? loc.search : "";
  } catch {
    return "";
  }
}

function readPersisted(): CampaignSource | null {
  try {
    // Sanitize on the way out too: the stored value is user-editable (devtools,
    // another script on the origin) and must not become a bypass.
    return sanitizeCampaignSource(
      browserStorage()?.getItem(ATTRIBUTION_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function persist(src: CampaignSource): void {
  try {
    browserStorage()?.setItem(ATTRIBUTION_STORAGE_KEY, src);
  } catch {
    // Quota exceeded / private mode / storage disabled — the session fallback
    // below still reports the source for as long as the page lives.
  }
}

/**
 * Capture the source from the URL and persist it. Safe to call more than once
 * and on every mount: an existing value (persisted or captured on this page)
 * always wins, so later navigation cannot rewrite the cohort.
 *
 * @param search pass a query string explicitly in tests / non-browser callers.
 * @returns the source now in effect, or null when there is none.
 */
export function captureAttribution(search?: string): CampaignSource | null {
  const existing = getPersistedOrSession();
  if (existing) return existing;

  const found = readSrcFromSearch(currentSearch(search));
  sessionSource = found;
  if (found) persist(found);
  return found;
}

function getPersistedOrSession(): CampaignSource | null {
  const persisted = readPersisted();
  if (persisted) {
    sessionSource = persisted;
    return persisted;
  }
  return sessionSource;
}

/**
 * Entry point for the root layout — call once per page load. Idempotent; a
 * no-op when the visitor arrived without `?src=`.
 */
export function initAttribution(search?: string): CampaignSource | null {
  return captureAttribution(search);
}

/**
 * The campaign source for this visitor: what was persisted on the landing
 * page, else what was captured this session, else — when nothing could be
 * stored, or the landing page had no tag — what this page's URL says.
 */
export function getCampaignSource(): CampaignSource | null {
  const known = getPersistedOrSession();
  if (known) return known;
  return captureAttribution();
}

/**
 * The source in the form the sinks take it. Spread this onto any payload that
 * leaves the browser outside `track()`/`capture()` — inside those helpers it is
 * attached for you (see lib/analytics/index.ts).
 *
 * Always returns `{ src }`, with null when the visitor arrived untagged, so the
 * property exists on every event and a PostHog cohort or funnel filter does not
 * have to know which events "have" attribution.
 */
export function getAttributionProps(): AttributionProps {
  return { src: getCampaignSource() };
}

/**
 * Forget the attribution. For tests, and for a deliberate "this is not the
 * person who scanned" reset — not called on sign-out, since the source belongs
 * to the device's acquisition, not to the session.
 */
export function resetAttribution(): void {
  sessionSource = null;
  try {
    browserStorage()?.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ─── Anonymous visitor id ────────────────────────────────────────────────────
// See VISITOR_STORAGE_KEY above for why this exists. It is the counting unit of
// the campaign funnel (lib/analytics/campaign.ts → POST /api/campaign/event).

/** Session fallback when storage is unavailable — same trick as sessionSource. */
let sessionVisitorId: string | null = null;

/** Forget the visitor id. For tests only — a real visitor keeps their id. */
export function resetVisitorId(): void {
  sessionVisitorId = null;
  try {
    browserStorage()?.removeItem(VISITOR_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * A random opaque id, generated once per browser and reused forever after.
 *
 * Idempotent and safe to call on every page load. Falls back to the in-memory
 * id when storage is blocked, which means a private-mode visitor is counted
 * once per page load rather than once per person — understating unique
 * visitors, never overstating them, and never throwing.
 */
export function getVisitorId(): string {
  if (sessionVisitorId) return sessionVisitorId;

  try {
    const stored = browserStorage()?.getItem(VISITOR_STORAGE_KEY);
    // Sanitize on the way out: the stored value is user-editable (devtools) and
    // ends up in a column the funnel groups by.
    const clean =
      typeof stored === "string"
        ? stored.toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 40)
        : "";
    if (clean) {
      sessionVisitorId = clean;
      return clean;
    }
  } catch {
    /* fall through to a fresh id */
  }

  const fresh = newId();
  sessionVisitorId = fresh;
  try {
    browserStorage()?.setItem(VISITOR_STORAGE_KEY, fresh);
  } catch {
    /* quota / private mode — the session id still works this page load */
  }
  return fresh;
}

/** crypto.randomUUID where available, with a Math.random fallback. */
function newId(): string {
  try {
    const g = globalThis as typeof globalThis & {
      crypto?: { randomUUID?: () => string };
    };
    const uuid = g.crypto?.randomUUID?.();
    if (uuid) return uuid.toLowerCase();
  } catch {
    /* fall through */
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
