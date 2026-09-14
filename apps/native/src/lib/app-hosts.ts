/**
 * The one place every host this app talks to is decided.
 *
 * Why this file exists: the canonical host used to be typed out by hand in eight
 * places — the API base, the deep-link prefixes, the update prompt, the password
 * reset redirect, eas.json, app.json, the Android manifest and the release
 * invariant test. Moving the domain meant finding all eight, and two of them were
 * config files no test cross-checked against the code. That is how a shipped
 * build ends up calling one host while claiming another in its App Links filter.
 *
 * Everything host-shaped now derives from CANONICAL_HOST, and
 * __tests__/app-hosts.test.ts asserts that app.json and the Android manifest
 * agree with it, so the next move is a one-line change that cannot drift.
 */

/**
 * The canonical host. The APEX, not www.
 *
 * sumaiya.app serves every route directly. www.sumaiya.app 308-redirects to it,
 * and Android will not follow a redirect when it fetches
 * /.well-known/assetlinks.json — so claiming www in the manifest would produce a
 * permanently failing App Links verification entry.
 */
export const CANONICAL_HOST = "sumaiya.app";

/** Origin for every app->server call. No trailing slash. */
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

/**
 * Hosts that used to be canonical and still appear inside messages already
 * sitting in people's inboxes — confirmation emails, password resets, and push
 * payloads sent before the domain moved. Kept as accepted deep-link prefixes so
 * those old links still land inside the app instead of the browser.
 *
 * Safe to delete once those messages have aged out.
 */
export const LEGACY_ORIGINS = ["https://templatehub.pro", "https://www.templatehub.pro"] as const;

/** Where /api/app/update and the in-app updater point. */
export const APK_DOWNLOAD_URL = `${CANONICAL_ORIGIN}/downloads/sumaiya.apk`;

/**
 * Password reset lands on a web page, not the app, because accounts created via
 * Google sign-in on web have no password to set inside the app.
 */
export const PASSWORD_RESET_URL = `${CANONICAL_ORIGIN}/reset-password`;

/**
 * Mailboxes deliberately stay on templatehub.pro: that domain runs on Google
 * Workspace, and sumaiya.app has no MX records, so anything sent to @sumaiya.app
 * would bounce. URLs move; mailboxes do not.
 */
export const SUPPORT_EMAIL = "support@templatehub.pro";

/** Every https prefix the deep-link router accepts, canonical first. */
export const DEEP_LINK_PREFIXES = [
  CANONICAL_ORIGIN,
  `https://www.${CANONICAL_HOST}`,
  ...LEGACY_ORIGINS,
] as const;
