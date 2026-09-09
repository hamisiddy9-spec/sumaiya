// Snap-to-Apply (D4) — "Made with Sumaiya" share helpers (pure, client-safe).
//
// The viral hook: a snap result is shareable as a PII-free public card at
// /snap/share/<token>. The token itself is minted + signed SERVER-side
// (lib/api/snap-share.ts — node:crypto) and carries ONLY the ATS score, a
// sanitized job title and the language — never CV text, names or contacts.
// This module is the client-safe half: URL building, token shape guard and
// the localized share text. It must stay free of node-only imports so the
// snap client and any server module can use it.

/** Public path a share token resolves to (the PII-free share card). */
export const SNAP_SHARE_PATH = "/snap/share/";

// A minted token is "<base64url-payload>.<base64url-signature>" — exactly one
// dot, url-safe alphabet only. Anything else is not a token we minted.
const TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LEN = 256;

/** Max length of the sanitized job title that may appear in a shared card. */
export const MAX_SHARE_TITLE_LEN = 80;

/**
 * Strip everything that could carry PII or turn a URL hostile out of a job
 * title before it ever reaches a share artifact: URLs, email addresses,
 * control characters and anything outside letters/numbers/basic punctuation.
 * The result is a short display-only label — never raw JD text.
 */
export function sanitizeShareTitle(raw: string | undefined | null): string {
  const t = (raw ?? "")
    .replace(/https?:\/\/\S+/gi, " ") // URLs
    .replace(/\S+@\S+/g, " ") // email addresses
    .replace(/[^\p{L}\p{N}\s\-&\/,'().\u2013\u2014]/gu, " ") // letters/numbers/basic punct only (incl. en/em dashes)
    .replace(/\s+/g, " ")
    .trim();
  return t.length > MAX_SHARE_TITLE_LEN ? t.slice(0, MAX_SHARE_TITLE_LEN).trim() : t;
}

/**
 * Shape-only guard for a share token (client side). The real verification
 * (signature, expiry) happens server-side on the share page; this just stops
 * garbage from becoming a link.
 */
export function isPlausibleShareToken(token: string | undefined | null): boolean {
  if (typeof token !== "string" || !token) return false;
  if (token.length > MAX_TOKEN_LEN) return false;
  return TOKEN_RE.test(token);
}

/**
 * Absolute URL for a share token, or null when either input is unusable —
 * callers must never fabricate a link (anti-fabrication: a missing/invalid
 * token simply means "no share link yet").
 */
export function buildShareUrl(
  origin: string | undefined | null,
  token: string | undefined | null,
): string | null {
  if (!origin || !isPlausibleShareToken(token)) return null;
  const base = origin.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return null;
  return `${base}${SNAP_SHARE_PATH}${token}`;
}

/**
 * Localized text for the share sheet / copy action. Uses the REAL sanitized
 * job title from the result — an empty/absent title yields the generic line,
 * never an invented one.
 */
export function snapShareText(sw: boolean, jobTitle: string | undefined | null): string {
  const title = sanitizeShareTitle(jobTitle);
  if (sw) {
    return title
      ? `CV yangu imelengwa kwa ${title} — imetengenezwa bure kwa Sumaiya.`
      : "CV yangu lengwa — imetengenezwa bure kwa Sumaiya.";
  }
  return title
    ? `My CV, tailored for ${title} — made free with Sumaiya.`
    : "My tailored CV — made free with Sumaiya.";
}
